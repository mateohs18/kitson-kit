import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-admin';
import { getShopEntries, getMargenTienda, precioTiendaUsd } from '../../../../lib/tienda-diaria';
import { emailWishlistDisponible } from '../../../../lib/emails';

// ============================================================================
// GET /api/cron/wishlist  (con Authorization: Bearer CRON_SECRET)
//
// Revisa la tienda diaria de Fortnite y cruza con las listas de deseos:
// si el ítem que alguien esperaba apareció, le manda un email con el precio
// en Kitson y el link para comprarlo. No repite el aviso mientras el ítem
// siga en la tienda (solo si vuelve tras al menos 3 días).
//
// PROGRAMARLO: cron-job.org, una vez al día, unos minutos después del reset
// de la tienda (00:05 UTC = 21:05 en Argentina).
// ============================================================================

export async function GET(req: Request) {
  const auth = req.headers.get('authorization') || '';
  const secreto = process.env.CRON_SECRET;
  if (!secreto || auth !== `Bearer ${secreto}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const [entries, margen] = await Promise.all([getShopEntries(), getMargenTienda()]);

    // Mapa: id de cosmético -> { nombre, precio en pavos, precio USD, imagen }
    const enTienda = new Map<string, { nombre: string; pavos: number; usd: number; imagen: string | null }>();
    for (const entry of entries) {
      const listas = [entry.brItems, entry.tracks, entry.instruments, entry.cars, entry.legoKits];
      for (const lista of listas) {
        for (const item of lista || []) {
          if (item?.id && typeof entry.finalPrice === 'number') {
            enTienda.set(item.id, {
              nombre: item.name || item.title || 'Cosmético',
              pavos: entry.finalPrice,
              usd: precioTiendaUsd(entry.finalPrice, margen),
              imagen: item.images?.icon || entry.newDisplayAsset?.renderImages?.[0]?.image || null,
            });
          }
        }
      }
    }

    if (enTienda.size === 0) {
      return NextResponse.json({ success: true, mensaje: 'La tienda no devolvió ítems.' });
    }

    // Deseos que coinciden y no fueron avisados en los últimos 3 días
    const hace3dias = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const { data: deseos, error } = await supabaseAdmin
      .from('wishlist')
      .select('id, email, cosmetic_id, cosmetic_name')
      .in('cosmetic_id', Array.from(enTienda.keys()))
      .or(`notified_at.is.null,notified_at.lt.${hace3dias}`)
      .limit(100);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    let enviados = 0;
    const fallos: string[] = [];

    for (const deseo of deseos || []) {
      const info = enTienda.get(deseo.cosmetic_id)!;
      const linkItem = `https://kitson-kit.store/tienda-diaria?buscar=${encodeURIComponent(info.nombre)}`;
      const resultado = await emailWishlistDisponible({
        email: deseo.email,
        nombre: info.nombre,
        imagen: info.imagen,
        usd: info.usd,
        pavos: info.pavos,
        link: linkItem,
      });

      if (resultado.ok) {
        await supabaseAdmin.from('wishlist').update({ notified_at: new Date().toISOString() }).eq('id', deseo.id);
        enviados++;
      } else {
        fallos.push(`${deseo.email}: ${resultado.error}`);
      }
    }

    return NextResponse.json({ success: true, itemsEnTienda: enTienda.size, coincidencias: deseos?.length || 0, enviados, fallos });
  } catch (e: any) {
    console.error('Cron wishlist — error:', e);
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 });
  }
}
