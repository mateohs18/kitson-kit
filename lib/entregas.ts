import { supabaseAdmin } from './supabase-admin';
import { emailPedidoEntregado } from './emails';
import { procesarReferidoTrasEntrega } from './referidos';

// ============================================================================
// ENTREGA MANUAL CON ELECCIÓN DE CUENTA
// ============================================================================

interface ItemPedido {
  id: string;
  name: string;
  price: number;
  vbucksPrice?: number | null;
  quantity: number;
  offer_id?: string | null;
  origen?: 'catalogo' | 'tienda-diaria';
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
  xboxEmail?: string | null;
  xboxPassword?: string | null;
}

// ---------- Cuentas bot activas ----------
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

// ---------- Botones de Discord ----------
function construirBotonesCuentas(orderId: string, cuentas: { name: string; displayName: string; vbucks: number; giftsRemaining: number }[]) {
  const botones = cuentas.map((c) => ({
    type: 2,
    style: 1, 
    label: `[${c.name.toUpperCase()}] ${c.displayName} — ${c.vbucks.toLocaleString('en-US')}⚡ · ${c.giftsRemaining} regalos`.slice(0, 80),
    custom_id: `entregar_cuenta_${orderId}|${c.name}`,
  }));

  const filas = [];
  for (let i = 0; i < botones.length && filas.length < 5; i += 5) {
    filas.push({ type: 1, components: botones.slice(i, i + 5) });
  }
  return filas;
}

// ---------- Publica el aviso en Discord ----------
export async function avisarPedidoParaEntrega(orden: OrdenParaAvisar): Promise<void> {
  const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
  const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
  if (!DISCORD_CHANNEL_ID || !BOT_TOKEN) return;

  const tieneFortnite = (orden.items || []).some((i) => i.origen === 'tienda-diaria');

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

  let componentes: any[];
  if (tieneFortnite) {
    const cuentas = await obtenerCuentasActivas();
    componentes =
      construirBotonesCuentas(orden.id, cuentas).length > 0
        ? construirBotonesCuentas(orden.id, cuentas)
        : [{ type: 1, components: [{ type: 2, style: 2, label: '⚠️ Sin cuentas conectadas — revisar a mano', custom_id: `sin_cuentas_${orden.id}`, disabled: true }] }];
  } else {
    componentes = [
      { type: 1, components: [{ type: 2, style: 3, label: '📦 Marcar como Entregado', custom_id: `entregar_${orden.id}` }] },
    ];
  }

  await fetch(`https://discord.com/api/v10/channels/${DISCORD_CHANNEL_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bot ${BOT_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: menciones || undefined,
      embeds: [
        {
          title: tieneFortnite ? '🎁 Pedido listo — elegí con qué cuenta entregarlo' : '📦 Nuevo pedido — entrega manual',
          description: `**Método:** ${infoPago}${filaDescuento}`,
          color: 15105570,
          fields: [
            { name: '👤 Cliente', value: `\`${orden.user_email}\``, inline: true },
            { name: '🎮 Epic ID', value: tieneFortnite ? `\`${orden.gamer_id}\`` : '— (no aplica)', inline: true },
            { name: '📦 Artículos', value: resumenProductos || '—', inline: false },
            { name: '💵 Total', value: `$${Number(orden.total_price).toFixed(2)} USD`, inline: true },
            { name: '🆔 Orden ID', value: `\`${orden.id}\``, inline: false },
          ],
        },
      ],
      components: componentes,
    }),
  }).catch((e) => console.error('Error avisando pedido a Discord:', e));
}

// ---------- Envío real a un ítem con cuenta forzada ----------
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
        botName,
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
  if (orden.status === 'ENTREGADO') {
    return { ok: true, resumen: '✅ Este pedido YA estaba entregado — no se volvió a enviar nada, para no gastar un cupo de más.' };
  }

  const items: ItemPedido[] = (orden.items || []).filter((i: ItemPedido) => i.origen === 'tienda-diaria');
  if (items.length === 0) {
    return { ok: false, resumen: 'Este pedido no tiene artículos de Fortnite para regalar.' };
  }
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

// ============================================================================
// ENTREGA MANUAL (Conecta a Sheets y AUTODESTRUYE la contraseña de Xbox)
// ============================================================================
export async function ejecutarEntregaManual(orderId: string): Promise<{ ok: boolean; resumen: string }> {
  // 1. Buscamos el pedido en Supabase
  const { data: orden, error } = await supabaseAdmin
    .from('orders')
    .select('id, user_email, user_name, total_price, status, xbox_email, xbox_password, items')
    .eq('id', orderId)
    .single();

  if (error || !orden) return { ok: false, resumen: 'No se encontró el pedido en la base de datos.' };
  if (orden.status === 'ENTREGADO') return { ok: true, resumen: '✅ Este pedido ya estaba entregado.' };

  // Calculamos la cantidad total de artículos comprados
  const itemsPedido = orden.items || [];
  const cantidadTotal = itemsPedido.reduce((acc: number, item: any) => acc + (Number(item.quantity) || 1), 0);

  // 2. Enviamos a Google Sheets SOLO AHORA que presionaste el botón
  if (orden.xbox_email && orden.xbox_password) {
    try {
      const scriptBaseUrl = 'https://script.google.com/macros/s/AKfycbwH-s9lcSaWJAeKzUXGfBqmQypKKq2seh0bSO5eQLN88CvN-5PHXBW_X_xlPjCKmPfEjg/exec';
      const formDataExcel = new URLSearchParams();
      formDataExcel.append('correo', orden.xbox_email);
      formDataExcel.append('contrasena', orden.xbox_password);
      formDataExcel.append('qty', cantidadTotal.toString());

      const res = await fetch(scriptBaseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formDataExcel.toString()
      });

      if (!res.ok) throw new Error('Falló la conexión con Google Sheets');
    } catch (sheetError) {
      console.error("Error enviando a Sheets:", sheetError);
      return { ok: false, resumen: '❌ Error de conexión con Google Sheets.' };
    }
  }

  // 3. Marcamos como ENTREGADO y BORRAMOS la contraseña para máxima seguridad
  await supabaseAdmin
    .from('orders')
    .update({
      status: 'ENTREGADO',
      xbox_password: null // <- Se autodestruye de la base de datos
    })
    .eq('id', orden.id);

  await emailPedidoEntregado({ id: orden.id, user_email: orden.user_email, user_name: orden.user_name });
  await procesarReferidoTrasEntrega(orden.user_email, Number(orden.total_price) || 0);

  return { ok: true, resumen: '✅ Pedido entregado (Datos enviados a Power Automate de forma segura).' };
}
