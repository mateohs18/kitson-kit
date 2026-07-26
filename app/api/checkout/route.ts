import { NextResponse } from 'next/server';
import { permitirPeticion, respuesta429 } from '../../../lib/rate-limit';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { supabaseAdmin } from '../../../lib/supabase-admin';
import { getShopEntries, getMargenTienda, precioTiendaUsd, entryName } from '../../../lib/tienda-diaria';
import { emailPedidoConfirmado } from '../../../lib/emails';
import { reportarError } from '../../../lib/sentry';
import { atribuirReferido } from '../../../lib/referidos';
import { avisarPedidoParaEntrega } from '../../../lib/entregas';

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
  vbucksPrice: number | null; // precio real en pavos
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

  const esUUID = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
  const idsParaDB = cleaned.map((i) => i.id).filter(esUUID);

  const { data: dbProducts, error } =
    idsParaDB.length > 0
      ? await supabaseAdmin.from('products').select('id, name, price, delivery_type').in('id', idsParaDB)
      : { data: [], error: null };
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
        vbucksPrice: null,
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
        vbucksPrice: match.finalPrice,
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
    const { email, userName, cart, gamerId, paymentMethod, receiptUrl, couponCode, refCode, xboxEmail, xboxPassword } = cuerpo;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Falta un email válido' }, { status: 400 });
    }
    if (!gamerId || typeof gamerId !== 'string' || gamerId.trim().length === 0) {
      return NextResponse.json({ error: 'Falta ID de Epic' }, { status: 400 });
    }
    if (paymentMethod !== 'saldo' && !receiptUrl) {
      return NextResponse.json({ error: 'Falta el comprobante de pago' }, { status: 400 });
    }

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

    if (cuerpo.totalPrice !== undefined && Math.abs(Number(cuerpo.totalPrice) - totalVerificado) > 0.01) {
      console.warn(`⚠️ Discrepancia de precio: cliente dijo ${cuerpo.totalPrice}, servidor calculó ${totalVerificado} (${email})`);
    }

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
        p_monto: totalFinal,
      });

      if (saldoError) {
        if (cuponAplicado) await supabaseAdmin.rpc('liberar_cupon', { p_code: cuponAplicado });
        const msg = saldoError.message || '';
        if (msg.includes('SALDO_INSUFICIENTE')) {
          return NextResponse.json({ error: 'Saldo insuficiente.' }, { status: 400 });
        }
        if (msg.includes('PERFIL_NO_ENCONTRADO')) {
          return NextResponse.json({ error: 'No registrado.' }, { status: 404 });
        }
        return NextResponse.json({ error: 'Error procesando el pago con saldo.' }, { status: 500 });
      }
      nuevoSaldo = Number(saldoResultado);
    }

    const itemsParaOrden = items.map((i) => ({
      id: i.id,
      name: i.name,
      price: i.unitPrice,
      vbucksPrice: i.vbucksPrice,
      quantity: i.quantity,
      offer_id: i.offer_id,
      origen: (i.source === 'tienda-diaria' ? 'tienda-diaria' : 'catalogo') as 'catalogo' | 'tienda-diaria',
    }));

    const { data: orden, error: ordenError } = await supabaseAdmin
      .from('orders')
      .insert([
        {
          user_email: email.trim(),
          user_name: (userName || 'Usuario').toString().slice(0, 100),
          gamer_id: gamerId.trim().slice(0, 100),
          items: itemsParaOrden,
          total_price: totalFinal,
          coupon_code: cuponAplicado,
          discount: descuento,
          status: 'PENDIENTE',
          // Guardamos las credenciales temporalmente en la BD
          xbox_email: xboxEmail ? String(xboxEmail).trim().slice(0, 200) : null,
          xbox_password: xboxPassword ? String(xboxPassword).slice(0, 200) : null,
        },
      ])
      .select()
      .single();

    if (ordenError || !orden) {
      if (paymentMethod === 'saldo' && emailAutenticado) {
        await supabaseAdmin.rpc('devolver_saldo', { p_email: emailAutenticado, p_monto: totalFinal });
      }
      if (cuponAplicado) await supabaseAdmin.rpc('liberar_cupon', { p_code: cuponAplicado });
      return NextResponse.json({ error: `Error DB: ${ordenError?.message}` }, { status: 500 });
    }

    if (refCode && typeof refCode === 'string') {
      await atribuirReferido(email.trim(), refCode);
    }

    if (process.env.BOT_DELIVERY_URL) {
      fetch(`${process.env.BOT_DELIVERY_URL}/api/bot/agregar-amigo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          ...(process.env.BOT_DELIVERY_SECRET ? { 'x-bot-secret': process.env.BOT_DELIVERY_SECRET } : {}),
        },
        body: JSON.stringify({ epicName: gamerId.trim() }),
        signal: AbortSignal.timeout(15000),
      })
        .then(async (r) => {
          if (r.ok) {
            await supabaseAdmin
              .from('profiles')
              .update({ friend_requested_at: new Date().toISOString() })
              .eq('email', email.trim())
              .is('friend_requested_at', null); 
          }
        })
        .catch((e) => console.warn('No se pudo contactar al bot:', e));
    }

    emailPedidoConfirmado({
      id: orden.id,
      user_email: email.trim(),
      user_name: userName || 'Usuario',
      items: itemsParaOrden,
      total_price: totalFinal,
      paymentMethod,
      couponCode: cuponAplicado,
      discount: descuento,
    }).catch(() => {});

    await avisarPedidoParaEntrega({
      id: orden.id,
      user_email: email.trim(),
      user_name: userName || 'Usuario',
      gamer_id: gamerId.trim(),
      items: itemsParaOrden,
      total_price: totalFinal,
      coupon_code: cuponAplicado,
      discount: descuento,
      paymentMethod,
      receiptUrl,
      xboxEmail: xboxEmail || null,
      xboxPassword: xboxPassword || null,
    }).catch((e) => console.error('Error avisando pedido a Discord:', e));

    return NextResponse.json({ success: true, nuevoSaldo, ordenId: orden.id, totalVerificado: totalFinal, descuento });
  } catch (error) {
    reportarError(error, 'checkout');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
