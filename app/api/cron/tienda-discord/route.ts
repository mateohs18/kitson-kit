import { NextResponse } from 'next/server';
import { getShopEntries, getMargenTienda, precioTiendaUsd, entryName } from '../../../../lib/tienda-diaria';

// ============================================================================
// GET /api/cron/tienda-discord  (con Authorization: Bearer CRON_SECRET)
//
// Publica la tienda del día en tu servidor de Discord: los ítems destacados
// con imagen, precio en pavos y TU precio (margen incluido), y el link para
// comprar en Kitson. Marketing diario en piloto automático.
//
// Variable de entorno nueva:
//   DISCORD_TIENDA_CHANNEL_ID = ID del canal público donde publicar
//   (usa el mismo DISCORD_BOT_TOKEN que ya tenés; el bot debe estar en el
//    servidor y tener permiso de escribir en ese canal)
//
// PROGRAMARLO: cron-job.org, una vez al día tras el reset (00:10 UTC).
// ============================================================================

export async function GET(req: Request) {
  const auth = req.headers.get('authorization') || '';
  const secreto = process.env.CRON_SECRET;
  if (!secreto || auth !== `Bearer ${secreto}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
  const CANAL = process.env.DISCORD_TIENDA_CHANNEL_ID;
  if (!BOT_TOKEN || !CANAL) {
    return NextResponse.json(
      { error: 'Faltan DISCORD_BOT_TOKEN o DISCORD_TIENDA_CHANNEL_ID en las variables de entorno.' },
      { status: 500 }
    );
  }

  try {
    const [entries, margen] = await Promise.all([getShopEntries(), getMargenTienda()]);
    if (entries.length === 0) {
      return NextResponse.json({ success: false, mensaje: 'La tienda no devolvió ítems.' });
    }

    // Destacados: lotes primero, después por prioridad del propio juego
    const destacados = [...entries]
      .filter((e) => typeof e.finalPrice === 'number' && entryName(e))
      .sort((a, b) => (b.bundle ? 1 : 0) - (a.bundle ? 1 : 0) || (b.sortPriority ?? 0) - (a.sortPriority ?? 0))
      .slice(0, 8);

    const fecha = new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long' });

    const embeds = destacados.map((e, i) => {
      const usd = precioTiendaUsd(e.finalPrice, margen);
      const imagen =
        e.newDisplayAsset?.renderImages?.[0]?.image ||
        e.bundle?.image ||
        e.brItems?.[0]?.images?.featured ||
        e.brItems?.[0]?.images?.icon ||
        null;
      return {
        title: `${e.bundle ? '🎁 ' : ''}${entryName(e)}`,
        // URL única por embed (con un ancla #1, #2...): si todos comparten la
        // misma URL, Discord los agrupa como galería de fotos de un solo
        // embed y el resto queda sin título ni precio. Con URL distinta,
        // cada ítem se muestra como tarjeta independiente y completa.
        url: `https://kitson-kit.store/tienda-diaria#${e.offerId || i}`,
        description: `🪙 **${e.finalPrice.toLocaleString('en-US')} pavos** · 💵 **$${usd.toFixed(2)} USD** en Kitson`,
        color: 14918205, // dorado #E3A23D
        ...(imagen ? { image: { url: imagen } } : {}),
      };
    });

    const res = await fetch(`https://discord.com/api/v10/channels/${CANAL}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bot ${BOT_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `🛒 **¡Tienda de Fortnite — ${fecha}!**\nEstos son los destacados de hoy. Compralos con entrega automática en **https://kitson-kit.store/tienda-diaria** 👇`,
        embeds,
      }),
    });

    if (!res.ok) {
      const detalle = await res.text();
      console.error('Discord rechazó la publicación de la tienda:', res.status, detalle);
      return NextResponse.json({ error: `Discord ${res.status}: ${detalle}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, publicados: destacados.length });
  } catch (e: any) {
    console.error('Cron tienda-discord — error:', e);
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 });
  }
}
