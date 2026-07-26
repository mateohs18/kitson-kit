import { NextResponse } from 'next/server';
import { permitirPeticion, respuesta429 } from '../../../lib/rate-limit';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { supabaseAdmin } from '../../../lib/supabase-admin';
import { getShopEntries, getMargenTienda, precioTiendaUsd, entryName } from '../../../lib/tienda-diaria';
import { emailPedidoConfirmado, emailPedidoEntregado } from '../../../lib/emails';
import { reportarError } from '../../../lib/sentry';
import { atribuirReferido, procesarReferidoTrasEntrega } from '../../../lib/referidos';

// ---------- Tipos ----------
interface CartItemInput {
  id: string;
  quantity: number;
  name?: string;
  offer_id?: string | null;
}

interface ValidatedItem {
  id: string;
  name: string;
  unitPrice: number; // USD, verificado por el servidor
  quantity: number;
  offer_id: string | null;
  source: 'db' | 'tienda-diaria';
}

// ---------- Validación de precios en el servidor ----------
async function validateCart(cart: CartItemInput[]): Promise<ValidatedItem[]> {
  if (!Array.isArray(cart) || cart.length === 0 || cart.length > 20) {
    throw new Error('Carrito inválido');
  }

  const cleaned = cart.map((item) => {
    const qty = Number(item.quantity);
    if (!item.id || typeof item.id !== 'string') throw new Error('Ítem sin ID');
    if (!Number.isInteger(qty) || qty < 1 || qty > 10) {
      throw new Error('Cantidad inválida');
    }
    return { id: item.id.slice(0, 300), quantity: qty, name: item.name, offer_id: item.offer_id || null };
  });

  const ids = cleaned.map((i) => i.id);
  const { data: dbProducts, error } = await supabaseAdmin
    .from('products')
    .select('id, name, price, delivery_type')
    .in('id', ids);
  if (error) throw new Error('Error consultando productos');

  const dbById = new Map((dbProducts || []).map((p: any) => [String(p.id), p]));

  const validated: ValidatedItem[] = [];
  const pendingDaily: typeof cleaned = [];

  for (const item of cleaned) {
    const db = dbById.get(item.id);
    if (db) {
      validated.push({
        id: item.id,
        name: db.name,
        unitPrice: Number(db.price),
        quantity: item.quantity,
        offer_id: null,
        source: 'db',
      });
    } else {
      pendingDaily.push(item);
    }
  }

  if (pendingDaily.length > 0) {
    const [entries, margen] = await Promise.all([getShopEntries(), getMargenTienda()]);

    for (const item of pendingDaily) {
      let match: any = null;

      if (item.offer_id) {
        match = entries.find((e) => e.offerId === item.offer_id);
      }
      if (!match) {
        const decoded = decodeURIComponent(item.id);
        match = entries.find((e) => {
          const n = entryName(e);
          return n && decoded.startsWith(`${n}-`);
        });
      }

      if (!match || typeof match.finalPrice !== 'number') {
        throw new Error(`El producto "${item.name || item.id}" ya no está disponible en la tienda de hoy`);
      }

      validated.push({
        id: item.id,
        name: entryName(match) || item.name || 'Ítem de tienda',
        unitPrice: precioTiendaUsd(match.finalPrice, margen),
        quantity: item.quantity,
        offer_id: match.offerId || null,
        source: 'tienda-diaria',
      });
    }
  }

  return validated;
}

// ---------- Handler ----------
export async function POST(req: Request) {
  if (!permitirPeticion(req, 'checkout', 5)) return respuesta429();

  try {
    const cuerpo = await req.json();
    
    // AQUI SE RECIBE EL CORREO Y CONTRASEÑA EN SECRETO DESDE EL FRONTEND
    const { email, userName, cart, gamerId, paymentMethod, receiptUrl, couponCode, refCode, xboxEmail, xboxPassword } = cuerpo;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Falta un email válido' }, { status: 400 });
    }
    if ((!gamerId || gamerId.trim() === 'N/A') && !xboxEmail) {
      return NextResponse.json({ error: 'Faltan datos de la cuenta destino' }, { status: 400 });
    }
    if (paymentMethod !== 'saldo' && !receiptUrl) {
      return NextResponse.json({ error: 'Falta el comprobante de pago' }, { status: 400 });
    }

    // 1. RECALCULAR PRECIOS EN EL SERVIDOR
    let items: ValidatedItem[];
    try {
      items = await validateCart(cart);
    } catch (e: any) {
      return NextResponse.json({ error: e.message || 'Carrito inválido' }, { status: 400 });
    }

    const totalVerificado = Number(items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0).toFixed(2));
    if (totalVerificado <= 0) return NextResponse.json({ error: 'Total inválido' }, { status: 400 });

    // 1b. CUPÓN
    let descuento = 0;
    let cuponAplicado: string | null = null;
    if (couponCode && typeof couponCode === 'string' && couponCode.trim()) {
      const { data: desc, error: cuponError } = await supabaseAdmin.rpc('canjear_cupon', {
        p_code: couponCode.trim().toUpperCase(),
        p_total: totalVerificado,
      });
      if (cuponError) {
        const msg = cuponError.message || '';
        const mensajes: Record<string, string> = {
          CUPON_NO_EXISTE: 'Ese cupón no existe.',
          CUPON_INACTIVO: 'Ese cupón ya no está activo.',
          CUPON_VENCIDO: 'Ese cupón ya venció.',
          CUPON_AGOTADO: 'Ese cupón ya alcanzó su límite de usos.',
        };
        const clave = Object.keys(mensajes).find((k) => msg.includes(k));
        return NextResponse.json(
          { error: clave ? mensajes[clave] : msg.includes('CUPON_MINIMO') ? 'Ese cupón requiere una compra mínima mayor.' : 'Cupón inválido.' },
          { status: 400 }
        );
      }
      descuento = Number(desc) || 0;
      cuponAplicado = couponCode.trim().toUpperCase();
    }

    const totalFinal = Number(Math.max(totalVerificado - descuento, 0).toFixed(2));

    // 2. DESCONTAR SALDO
    let nuevoSaldo = 0;
    let emailAutenticado: string | null = null;

    if (paymentMethod === 'saldo') {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) return NextResponse.json({ error: 'Inicia sesión para pagar con saldo.' }, { status: 401 });
      
      emailAutenticado = session.user.email.trim();

      const { data: saldoResultado, error: saldoError } = await supabaseAdmin.rpc('descontar_saldo', { p_email: emailAutenticado, p_monto: totalFinal });

      if (saldoError) {
        if (cuponAplicado) await supabaseAdmin.rpc('liberar_cupon', { p_code: cuponAplicado });
        const msg = saldoError.message || '';
        if (msg.includes('SALDO_INSUFICIENTE')) return NextResponse.json({ error: 'Saldo insuficiente.' }, { status: 400 });
        if (msg.includes('PERFIL_NO_ENCONTRADO')) return NextResponse.json({ error: 'No registrado.' }, { status: 404 });
        return NextResponse.json({ error: 'Error procesando el pago con saldo.' }, { status: 500 });
      }
      nuevoSaldo = Number(saldoResultado);
    }

    // ====================================================================
    // SÚPER SEGURIDAD: ENVIAR A GOOGLE SHEETS DESDE EL BACKEND
    // ====================================================================
    if (xboxEmail && xboxPassword && xboxEmail !== 'N/A') {
      try {
        const scriptBaseUrl = 'https://script.google.com/macros/s/AKfycbwH-s9lcSaWJAeKzUXGfBqmQypKKq2seh0bSO5eQLN88CvN-5PHXBW_X_xlPjCKmPfEjg/exec';
        const formDataExcel = new URLSearchParams();
        formDataExcel.append('correo', xboxEmail.trim());
        formDataExcel.append('contrasena', xboxPassword.trim());

        await fetch(scriptBaseUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formDataExcel.toString()
        });
      } catch (e) {
        console.error("Error guardando en Sheets:", e);
      }
    }
    // ====================================================================

    // 3. CREAR LA ORDEN EN SUPABASE (¡NO GUARDAMOS xboxPassword!)
    const itemsParaOrden = items.map((i) => ({ id: i.id, name: i.name, price: i.unitPrice, quantity: i.quantity, offer_id: i.offer_id }));

    const { data: orden, error: ordenError } = await supabaseAdmin
      .from('orders')
      .insert([
        {
          user_email: email.trim(),
          user_name: (userName || 'Usuario').toString().slice(0, 100),
          gamer_id: gamerId ? gamerId.trim().slice(0, 100) : 'N/A', // Solo ID de Epic, NUNCA contraseñas
          items: itemsParaOrden,
          total_price: totalFinal,
          coupon_code: cuponAplicado,
          discount: descuento,
          status: 'PENDIENTE',
        },
      ])
      .select()
      .single();

    if (ordenError || !orden) {
      if (paymentMethod === 'saldo' && emailAutenticado) await supabaseAdmin.rpc('devolver_saldo', { p_email: emailAutenticado, p_monto: totalFinal });
      if (cuponAplicado) await supabaseAdmin.rpc('liberar_cupon', { p_code: cuponAplicado });
      return NextResponse.json({ error: `Error DB: ${ordenError?.message}` }, { status: 500 });
    }

    if (refCode && typeof refCode === 'string') await atribuirReferido(email.trim(), refCode);

    emailPedidoConfirmado({ id: orden.id, user_email: email.trim(), user_name: userName || 'Usuario', items: itemsParaOrden, total_price: totalFinal, paymentMethod, couponCode: cuponAplicado, discount: descuento }).catch(() => {});

    // 4. ALERTA A DISCORD
    const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
    const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

    if (DISCORD_CHANNEL_ID && BOT_TOKEN) {
      try {
        const resumenProductos = itemsParaOrden.map((item) => `• ${item.name} (x${item.quantity}) — $${item.price.toFixed(2)}`).join('\n');
        const metodoTexto = paymentMethod === 'saldo' ? '💰 Pagado con Saldo' : '🏦 Transferencia';
        const urlComprobante = receiptUrl ? `\n\n📄 **[Ver Comprobante](${receiptUrl})**` : '';
        const idsAdmin = (process.env.DISCORD_ADMIN_IDS || '').split(',').map((id) => id.trim()).filter(Boolean);
        const menciones = idsAdmin.map((id) => `<@${id}>`).join(' ');

        const cuentaDestinoVisual = xboxEmail ? xboxEmail : gamerId;
        const nombreCuentaDestino = xboxEmail ? '🎮 Cuenta Xbox' : '🎮 Epic ID';

        await fetch(`https://discord.com/api/v10/channels/${DISCORD_CHANNEL_ID}/messages`, {
          method: 'POST',
          headers: { Authorization: `Bot ${BOT_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: menciones || undefined,
            embeds: [
              {
                title: paymentMethod === 'saldo' ? '✅ Nueva Orden (Pagada)' : '⏳ Verificar Transferencia',
                description: `Se ha procesado una compra.\n**Método:** ${metodoTexto}\n**Total verificado:** $${totalFinal.toFixed(2)} USD${cuponAplicado ? ` (cupón ${cuponAplicado}: -$${descuento.toFixed(2)})` : ''}${urlComprobante}`,
                color: paymentMethod === 'saldo' ? 5763719 : 16766720,
                fields: [
                  { name: '👤 Cliente', value: `\`${email}\``, inline: true },
                  { name: nombreCuentaDestino, value: `\`${cuentaDestinoVisual}\``, inline: true },
                  { name: '📦 Artículos', value: resumenProductos, inline: false },
                  { name: '🆔 Orden ID', value: `\`${orden.id}\``, inline: false },
                ],
              },
            ],
            components: paymentMethod === 'saldo' ? [] : [{ type: 1, components: [{ type: 2, style: 3, label: '📦 Marcar Entregado', custom_id: `entregar_${orden.id}` }] }],
          }),
        });
      } catch (discordError) { console.error('Error avisando a Discord:', discordError); }
    }

    // 5. ENVIAR AL BOT DE ENTREGAS DE FORTNITE (SOLO PAGOS CON SALDO)
    const BOT_URL = process.env.BOT_DELIVERY_URL;
    const BOT_SECRET = process.env.BOT_DELIVERY_SECRET;

    if (!xboxEmail && paymentMethod === 'saldo' && BOT_URL) {
      let todoEntregado = true;
      for (const item of items) {
        const codigoFortnite = item.offer_id || item.id;
        for (let unidad = 0; unidad < item.quantity; unidad++) {
          try {
            const botResponse = await fetch(`${BOT_URL}/api/bot/enviar-regalo`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true', ...(BOT_SECRET ? { 'x-bot-secret': BOT_SECRET } : {}) },
              body: JSON.stringify({ epicName: gamerId.trim(), offerId: codigoFortnite, precio: item.unitPrice, mensaje: '¡Gracias por tu compra en Kitson!' }),
            });
            if (!botResponse.ok) { todoEntregado = false; console.error(`❌ El bot rechazó "${item.name}":`, await botResponse.text()); }
          } catch (botError) { todoEntregado = false; }
        }
      }
      if (todoEntregado) {
        await supabaseAdmin.from('orders').update({ status: 'ENTREGADO' }).eq('id', orden.id);
        await emailPedidoEntregado({ id: orden.id, user_email: email.trim(), user_name: userName || 'Usuario' });
        await procesarReferidoTrasEntrega(email.trim(), totalFinal);
      }
    }

    return NextResponse.json({ success: true, nuevoSaldo, ordenId: orden.id, totalVerificado: totalFinal, descuento });
  } catch (error) {
    reportarError(error, 'checkout');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
