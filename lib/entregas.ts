import { supabaseAdmin } from './supabase-admin';
import { emailPedidoEntregado } from './emails';
import { procesarReferidoTrasEntrega } from './referidos';

// ============================================================================
// REINTENTO DE ENTREGA
//
// Cuando un pedido queda PENDIENTE porque el cliente todavía no era amigo
// del bot (o no habían pasado las 48hs), esta función se llama después,
// cuando la amistad ya está confirmada — y reintenta mandar los regalos
// sin que nadie tenga que hacerlo a mano.
// ============================================================================

interface ItemPedido {
  id: string;
  name: string;
  price: number;
  vbucksPrice?: number | null;
  quantity: number;
  offer_id?: string | null;
}

async function enviarRegaloAlBot(gamerId: string, item: ItemPedido, unidad: number): Promise<boolean> {
  const BOT_URL = process.env.BOT_DELIVERY_URL;
  const BOT_SECRET = process.env.BOT_DELIVERY_SECRET;
  if (!BOT_URL) return false;

  try {
    const res = await fetch(`${BOT_URL}/api/bot/enviar-regalo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        ...(BOT_SECRET ? { 'x-bot-secret': BOT_SECRET } : {}),
      },
      body: JSON.stringify({
        epicName: gamerId,
        offerId: item.offer_id || item.id,
        precio: item.vbucksPrice ?? item.price, // Epic espera pavos, no dólares
        mensaje: '¡Gracias por tu compra en Kitson!',
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      console.error(`❌ El bot rechazó "${item.name}" (unidad ${unidad + 1}):`, await res.text().catch(() => ''));
    }
    return res.ok;
  } catch (e) {
    console.error('❌ Error de red conectando con el bot:', e);
    return false;
  }
}

/**
 * Busca pedidos PENDIENTES de un cliente (por su Epic ID) y reintenta
 * entregarlos. Se llama cuando el bot confirma que la amistad con ese
 * cliente ya está activa.
 */
export async function reintentarPedidosPendientes(
  epicId: string
): Promise<{ intentados: number; entregados: number }> {
  const { data: pedidos, error } = await supabaseAdmin
    .from('orders')
    .select('id, user_email, user_name, gamer_id, items, total_price, status')
    .eq('status', 'PENDIENTE')
    .ilike('gamer_id', epicId.trim()); // sin distinguir mayúsculas/minúsculas

  if (error || !pedidos || pedidos.length === 0) {
    return { intentados: 0, entregados: 0 };
  }

  let entregados = 0;

  for (const pedido of pedidos) {
    const items: ItemPedido[] = pedido.items || [];
    let todoEntregado = true;

    for (const item of items) {
      for (let unidad = 0; unidad < (item.quantity || 1); unidad++) {
        const ok = await enviarRegaloAlBot(pedido.gamer_id, item, unidad);
        if (!ok) todoEntregado = false;
      }
    }

    if (todoEntregado) {
      await supabaseAdmin.from('orders').update({ status: 'ENTREGADO' }).eq('id', pedido.id);
      await emailPedidoEntregado({ id: pedido.id, user_email: pedido.user_email, user_name: pedido.user_name });
      await procesarReferidoTrasEntrega(pedido.user_email, Number(pedido.total_price) || 0);
      entregados++;
      console.log(`✅ Pedido #${pedido.id} reintentado y entregado tras confirmarse la amistad.`);
    } else {
      console.warn(`⚠️ Pedido #${pedido.id} sigue sin poder entregarse (reintento falló).`);
    }
  }

  return { intentados: pedidos.length, entregados };
}
