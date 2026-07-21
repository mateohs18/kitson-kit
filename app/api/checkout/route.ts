import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { supabaseAdmin } from '../../../lib/supabase-admin';
import { getShopEntries, getMargenTienda, precioTiendaUsd, entryName } from '../../../lib/tienda-diaria';

// ============================================================================
// CHECKOUT SEGURO
//
// Cambios clave respecto a la versión anterior:
//  1. El servidor RECALCULA el precio de cada ítem. El precio y el total que
//     manda el navegador se ignoran por completo (cualquiera puede editarlos
//     con la consola del navegador).
//  2. El descuento de saldo ahora es ATÓMICO vía la función SQL
//     `descontar_saldo` (ver supabase/descontar_saldo.sql). Adiós condición
//     de carrera de "gastar el mismo saldo dos veces".
//  3. La URL del bot ya no está hardcodeada: va en la variable de entorno
//     BOT_DELIVERY_URL, junto con un secreto BOT_DELIVERY_SECRET para que
//     nadie más pueda ordenarle regalos a tu bot.
//  4. El bot ahora respeta la CANTIDAD (x2 = 2 regalos) y la orden solo se
//     marca ENTREGADO si TODOS los regalos salieron bien.
// ============================================================================

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
  // Sanidad general del carrito
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

  // 1) Buscar todos los IDs en la tabla `products`
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
      // Precio REAL desde la base de datos — el del cliente se ignora
      validated.push({
        id: item.id,
        name: db.name,
        unitPrice: Number(db.price),
        quantity: item.quantity,
        offer_id: null, // los productos propios no usan offerId de Fortnite
        source: 'db',
      });
    } else {
      pendingDaily.push(item);
    }
  }

  // 2) Los que no están en la DB deben ser ítems de la tienda diaria.
  //    Verificamos contra fortnite-api.com (la misma fuente del frontend).
  if (pendingDaily.length > 0) {
    const [entries, margen] = await Promise.all([getShopEntries(), getMargenTienda()]);

    for (const item of pendingDaily) {
      let match: any = null;

      if (item.offer_id) {
        match = entries.find((e) => e.offerId === item.offer_id);
      }
      if (!match) {
        // Fallback para ítems sin offerId: el frontend genera el id como
        // encodeURIComponent(`${nombre}-${precioUSD}`), así que probamos por nombre.
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
        unitPrice: precioTiendaUsd(match.finalPrice, margen), // misma fórmula que /api/tienda
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
  try {
    const cuerpo = await req.json();
    const { email, userName, cart, gamerId, paymentMethod, receiptUrl } = cuerpo;

    // Validaciones de entrada
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Falta un email válido' }, { status: 400 });
    }
    if (!gamerId || typeof gamerId !== 'string' || gamerId.trim().length === 0) {
      return NextResponse.json({ error: 'Falta ID de Epic' }, { status: 400 });
    }
    if (paymentMethod !== 'saldo' && !receiptUrl) {
      return NextResponse.json({ error: 'Falta el comprobante de pago' }, { status: 400 });
    }

    // 1. RECALCULAR PRECIOS EN EL SERVIDOR (ignoramos lo que diga el cliente)
    let items: ValidatedItem[];
    try {
      items = await validateCart(cart);
    } catch (e: any) {
      return NextResponse.json({ error: e.message || 'Carrito inválido' }, { status: 400 });
    }

    const totalVerificado = Number(
      items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0).toFixed(2)
    );
    if (totalVerificado <= 0) {
      return NextResponse.json({ error: 'Total inválido' }, { status: 400 });
    }

    // (Solo informativo: si el total del cliente difiere, lo logueamos.
    //  Puede ser un intento de fraude o un carrito con precios viejos.)
    if (cuerpo.totalPrice !== undefined && Math.abs(Number(cuerpo.totalPrice) - totalVerificado) > 0.01) {
      console.warn(
        `⚠️ Discrepancia de precio: cliente dijo ${cuerpo.totalPrice}, servidor calculó ${totalVerificado} (${email})`
      );
    }

    // 2. DESCONTAR SALDO (atómico, sin condición de carrera)
    let nuevoSaldo = 0;
    let emailAutenticado: string | null = null;

    if (paymentMethod === 'saldo') {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        return NextResponse.json({ error: 'Inicia sesión para pagar con saldo.' }, { status: 401 });
      }
      emailAutenticado = session.user.email.trim();

      const { data: saldoResultado, error: saldoError } = await supabaseAdmin.rpc('descontar_saldo', {
        p_email: emailAutenticado,
        p_monto: totalVerificado,
      });

      if (saldoError) {
        const msg = saldoError.message || '';
        if (msg.includes('SALDO_INSUFICIENTE')) {
          return NextResponse.json({ error: 'Saldo insuficiente.' }, { status: 400 });
        }
        if (msg.includes('PERFIL_NO_ENCONTRADO')) {
          return NextResponse.json({ error: 'No registrado.' }, { status: 404 });
        }
        console.error('Error descontando saldo:', saldoError);
        return NextResponse.json({ error: 'Error procesando el pago con saldo.' }, { status: 500 });
      }
      nuevoSaldo = Number(saldoResultado);
    }

    // 3. CREAR LA ORDEN (con los precios VERIFICADOS, no los del cliente)
    const itemsParaOrden = items.map((i) => ({
      id: i.id,
      name: i.name,
      price: i.unitPrice,
      quantity: i.quantity,
      offer_id: i.offer_id,
    }));

    const { data: orden, error: ordenError } = await supabaseAdmin
      .from('orders')
      .insert([
        {
          user_email: email.trim(),
          user_name: (userName || 'Usuario').toString().slice(0, 100),
          gamer_id: gamerId.trim().slice(0, 100),
          items: itemsParaOrden,
          total_price: totalVerificado,
          status: 'PENDIENTE',
        },
      ])
      .select()
      .single();

    if (ordenError || !orden) {
      // Si ya cobramos con saldo y la orden falló, DEVOLVEMOS la plata
      if (paymentMethod === 'saldo' && emailAutenticado) {
        await supabaseAdmin.rpc('devolver_saldo', {
          p_email: emailAutenticado,
          p_monto: totalVerificado,
        });
      }
      return NextResponse.json({ error: `Error DB: ${ordenError?.message}` }, { status: 500 });
    }

    // 4. ALERTA A DISCORD (igual que antes, pero con el total verificado)
    const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
    const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

    if (DISCORD_CHANNEL_ID && BOT_TOKEN) {
      try {
        const resumenProductos = itemsParaOrden
          .map((item) => `• ${item.name} (x${item.quantity}) — $${item.price.toFixed(2)}`)
          .join('\n');
        const metodoTexto = paymentMethod === 'saldo' ? '💰 Pagado con Saldo' : '🏦 Transferencia';
        const urlComprobante = receiptUrl ? `\n\n📄 **[Ver Comprobante](${receiptUrl})**` : '';
        const idsAdmin = (process.env.DISCORD_ADMIN_IDS || '')
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean);
        const menciones = idsAdmin.map((id) => `<@${id}>`).join(' ');

        await fetch(`https://discord.com/api/v10/channels/${DISCORD_CHANNEL_ID}/messages`, {
          method: 'POST',
          headers: { Authorization: `Bot ${BOT_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: menciones || undefined,
            embeds: [
              {
                title: paymentMethod === 'saldo' ? '✅ Nueva Orden (Pagada)' : '⏳ Verificar Transferencia',
                description: `Se ha procesado una compra.\n**Método:** ${metodoTexto}\n**Total verificado:** $${totalVerificado.toFixed(2)} USD${urlComprobante}`,
                color: paymentMethod === 'saldo' ? 5763719 : 16766720,
                fields: [
                  { name: '👤 Cliente', value: `\`${email}\``, inline: true },
                  { name: '🎮 Epic ID', value: `\`${gamerId}\``, inline: true },
                  { name: '📦 Artículos', value: resumenProductos, inline: false },
                  { name: '🆔 Orden ID', value: `\`${orden.id}\``, inline: false },
                ],
              },
            ],
            components:
              paymentMethod === 'saldo'
                ? []
                : [
                    {
                      type: 1,
                      components: [
                        { type: 2, style: 3, label: '📦 Marcar como Entregado', custom_id: `entregar_${orden.id}` },
                      ],
                    },
                  ],
          }),
        });
      } catch (discordError) {
        // Discord caído no debe romper la compra del cliente
        console.error('Error avisando a Discord:', discordError);
      }
    }

    // 5. ENVIAR AL BOT DE ENTREGAS (solo pagos con saldo, ya confirmados)
    //    La URL y el secreto viven en variables de entorno — NUNCA en el código.
    //    Configurá en Railway/Vercel:
    //      BOT_DELIVERY_URL    = https://tu-tunel-o-servidor.com
    //      BOT_DELIVERY_SECRET = un-secreto-largo-que-tu-bot-tambien-verifique
    const BOT_URL = process.env.BOT_DELIVERY_URL;
    const BOT_SECRET = process.env.BOT_DELIVERY_SECRET;

    if (paymentMethod === 'saldo' && BOT_URL) {
      let todoEntregado = true;

      for (const item of items) {
        const codigoFortnite = item.offer_id || item.id;

        // Respetar la cantidad: x2 = 2 regalos
        for (let unidad = 0; unidad < item.quantity; unidad++) {
          try {
            const botResponse = await fetch(`${BOT_URL}/api/bot/enviar-regalo`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
                ...(BOT_SECRET ? { 'x-bot-secret': BOT_SECRET } : {}),
              },
              body: JSON.stringify({
                epicName: gamerId.trim(),
                offerId: codigoFortnite,
                precio: item.unitPrice,
                mensaje: '¡Gracias por tu compra en Kitson!',
              }),
            });

            if (!botResponse.ok) {
              todoEntregado = false;
              console.error(`❌ El bot rechazó "${item.name}" (unidad ${unidad + 1}):`, await botResponse.text());
            }
          } catch (botError) {
            todoEntregado = false;
            console.error('❌ Error de red conectando con el bot:', botError);
          }
        }
      }

      // Solo marcamos ENTREGADO si TODOS los regalos salieron bien.
      // Si algo falló, queda PENDIENTE y el aviso de Discord te permite
      // resolverlo a mano — el cliente nunca queda pagado y sin producto.
      if (todoEntregado) {
        await supabaseAdmin.from('orders').update({ status: 'ENTREGADO' }).eq('id', orden.id);
      }
    }

    return NextResponse.json({ success: true, nuevoSaldo, ordenId: orden.id, totalVerificado });
  } catch (error) {
    console.error('Error en checkout:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
