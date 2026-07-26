import { supabaseAdmin } from './supabase-admin';
import { emailPedidoEntregado } from './emails';
import { procesarReferidoTrasEntrega } from './referidos';

// ============================================================================
// ENTREGA MANUAL CON ELECCIÓN DE CUENTA
//
// Ningún regalo se manda solo. Cada vez que hay un pedido listo para
// entregarse (recién comprado, o porque se acaba de confirmar la amistad de
// 48hs), se publica un aviso en Discord con un botón por cada cuenta bot
// conectada — el admin elige cuál usa, y recién ahí se ejecuta el envío
// real con esa cuenta específica.
// ============================================================================

interface ItemPedido {
  id: string;
  name: string;
  price: number;
  vbucksPrice?: number | null;
  quantity: number;
  offer_id?: string | null;
}

interface OrdenParaAvisar {
  id: string;
  user_email: string;
  user_name?: string | null;
  gamer_id: string;
  items: ItemPedido[];
  total_price: number;
  coupon_code?: string | null;
  discount?: number;
  paymentMethod?: 'saldo' | 'manual';
  receiptUrl?: string | null;
}

// ---------- Cuentas bot activas (consultadas al bot en vivo) ----------
async function obtenerCuentasActivas(): Promise<{ name: string; displayName: string; vbucks: number; giftsRemaining: number }[]> {
  const BOT_URL = process.env.BOT_DELIVERY_URL;
  const BOT_SECRET = process.env.BOT_DELIVERY_SECRET;
  if (!BOT_URL) return [];

  try {
    const res = await fetch(`${BOT_URL}/api/bots/status`, {
      headers: {
        'ngrok-skip-browser-warning': 'true',
        ...(BOT_SECRET ? { 'x-bot-secret': BOT_SECRET } : {}),
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    const bots: any[] = json?.bots || [];
    return bots
      .filter((b) => b.ready)
      .map((b) => ({
        name: b.name,
        displayName: b.displayName || b.name,
        vbucks: Number(b.vbucks) || 0,
        giftsRemaining: Math.max(0, Number(b.giftsRemaining) || 0),
      }));
  } catch (e) {
    console.error('Error consultando cuentas bot activas:', e);
    return [];
  }
}

// ---------- Botones de Discord, uno por cuenta (máx. 5 por fila) ----------
function construirBotonesCuentas(orderId: string, cuentas: { name: string; displayName: string; vbucks: number; giftsRemaining: number }[]) {
  const botones = cuentas.map((c) => ({
    type: 2,
    style: 1, // azul
    label: `${c.displayName} (${c.vbucks.toLocaleString('en-US')}⚡ · ${c.giftsRemaining} regalos)`.slice(0, 80),
    custom_id: `entregar_cuenta_${orderId}|${c.name}`,
  }));

  // Discord permite máximo 5 botones por fila y 5 filas por mensaje.
  const filas = [];
  for (let i = 0; i < botones.length && filas.length < 5; i += 5) {
    filas.push({ type: 1, components: botones.slice(i, i + 5) });
  }
  return filas;
}

// ---------- Publica (o actualiza) el aviso de un pedido listo para elegir cuenta ----------
export async function avisarPedidoParaEntrega(orden: OrdenParaAvisar): Promise<void> {
  const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
  const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
  if (!DISCORD_CHANNEL_ID || !BOT_TOKEN) return;

  const cuentas = await obtenerCuentasActivas();

  const resumenProductos = (orden.items || [])
    .map((item) => `• ${item.name} (x${item.quantity}) — $${item.price.toFixed(2)}`)
    .join('\n');

  const filaDescuento = orden.discount && orden.discount > 0 ? `\n**Cupón ${orden.coupon_code}:** -$${orden.discount.toFixed(2)}` : '';
  const infoPago =
    orden.paymentMethod === 'saldo'
      ? '💰 Pagado con Saldo'
      : `🏦 Transferencia${orden.receiptUrl ? ` — [Ver comprobante](${orden.receiptUrl})` : ''}`;

  const idsAdmin = (process.env.DISCORD_ADMIN_IDS || '').split(',').map((id) => id.trim()).filter(Boolean);
  const menciones = idsAdmin.map((id) => `<@${id}>`).join(' ');

  const componentes = construirBotonesCuentas(orden.id, cuentas);

  await fetch(`https://discord.com/api/v10/channels/${DISCORD_CHANNEL_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bot ${BOT_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: menciones || undefined,
      embeds: [
        {
          title: '🎁 Pedido listo — elegí con qué cuenta entregarlo',
          description: `**Método:** ${infoPago}${filaDescuento}`,
          color: 15105570, // dorado
          fields: [
            { name: '👤 Cliente', value: `\`${orden.user_email}\``, inline: true },
            { name: '🎮 Epic ID', value: `\`${orden.gamer_id}\``, inline: true },
            { name: '📦 Artículos', value: resumenProductos || '—', inline: false },
            { name: '💵 Total', value: `$${Number(orden.total_price).toFixed(2)} USD`, inline: true },
            { name: '🆔 Orden ID', value: `\`${orden.id}\``, inline: false },
          ],
        },
      ],
      components:
        componentes.length > 0
          ? componentes
          : [
              {
                type: 1,
                components: [{ type: 2, style: 2, label: '⚠️ Sin cuentas conectadas — revisar a mano', custom_id: `sin_cuentas_${orden.id}`, disabled: true }],
              },
            ],
    }),
  }).catch((e) => console.error('Error avisando pedido a Discord:', e));
}

// ---------- Envío real a un ítem con una cuenta forzada ----------
async function enviarRegaloConCuenta(gamerId: string, item: ItemPedido, botName: string): Promise<{ ok: boolean; error?: string }> {
  const BOT_URL = process.env.BOT_DELIVERY_URL;
  const BOT_SECRET = process.env.BOT_DELIVERY_SECRET;
  if (!BOT_URL) return { ok: false, error: 'BOT_DELIVERY_URL no configurada' };

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
        precio: item.vbucksPrice ?? item.price,
        mensaje: '¡Gracias por tu compra en Kitson!',
        botName, // fuerza esta cuenta específica, elegida a mano
      }),
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) {
      const detalle = await res.text().catch(() => '');
      return { ok: false, error: detalle || `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Error de red' };
  }
}

/**
 * Se ejecuta cuando el admin elige una cuenta desde Discord. Manda todos
 * los ítems del pedido con esa cuenta, y si todo sale bien marca ENTREGADO,
 * manda el email al cliente y procesa la recompensa de referido.
 */
export async function ejecutarEntregaConCuenta(
  orderId: string,
  botName: string
): Promise<{ ok: boolean; resumen: string }> {
  const { data: orden, error } = await supabaseAdmin
    .from('orders')
    .select('id, user_email, user_name, gamer_id, items, total_price, status')
    .eq('id', orderId)
    .single();

  if (error || !orden) return { ok: false, resumen: 'No se encontró el pedido.' };
  if (orden.status === 'ENTREGADO') return { ok: true, resumen: 'Este pedido ya estaba entregado.' };

  const items: ItemPedido[] = orden.items || [];
  let todoOk = true;
  const errores: string[] = [];

  for (const item of items) {
    for (let unidad = 0; unidad < (item.quantity || 1); unidad++) {
      const resultado = await enviarRegaloConCuenta(orden.gamer_id, item, botName);
      if (!resultado.ok) {
        todoOk = false;
        errores.push(`${item.name} (unidad ${unidad + 1}): ${resultado.error}`);
      }
    }
  }

  if (todoOk) {
    await supabaseAdmin.from('orders').update({ status: 'ENTREGADO' }).eq('id', orden.id);
    await emailPedidoEntregado({ id: orden.id, user_email: orden.user_email, user_name: orden.user_name });
    await procesarReferidoTrasEntrega(orden.user_email, Number(orden.total_price) || 0);
    return { ok: true, resumen: `Entregado con éxito usando la cuenta **${botName}**.` };
  }

  return { ok: false, resumen: `Falló con **${botName}**:\n${errores.join('\n')}` };
}

/**
 * Busca pedidos PENDIENTES de un cliente y publica el aviso de "elegir
 * cuenta" para cada uno. Se llama cuando el bot confirma que la amistad
 * con ese cliente ya está activa — NO manda nada solo, solo avisa.
 */
export async function avisarPedidosPendientes(epicId: string): Promise<{ avisados: number }> {
  const { data: pedidos, error } = await supabaseAdmin
    .from('orders')
    .select('id, user_email, user_name, gamer_id, items, total_price, status, coupon_code, discount')
    .eq('status', 'PENDIENTE')
    .ilike('gamer_id', epicId.trim());

  if (error || !pedidos || pedidos.length === 0) return { avisados: 0 };

  for (const pedido of pedidos) {
    await avisarPedidoParaEntrega({
      id: pedido.id,
      user_email: pedido.user_email,
      user_name: pedido.user_name,
      gamer_id: pedido.gamer_id,
      items: pedido.items || [],
      total_price: Number(pedido.total_price) || 0,
      coupon_code: pedido.coupon_code,
      discount: Number(pedido.discount) || 0,
    });
  }

  return { avisados: pedidos.length };
}
