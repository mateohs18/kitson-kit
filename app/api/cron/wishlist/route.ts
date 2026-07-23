import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-admin';
import { getShopEntries, getMargenTienda, precioTiendaUsd } from '../../../../lib/tienda-diaria';
import { enviarEmail } from '../../../../lib/emails';

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
      const resultado = await enviarEmail(
        deseo.email,
        `🔔 ¡${info.nombre} volvió a la tienda de Fortnite!`,
        `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #14110C; color: #F5F1E6; padding: 30px; border-radius: 12px; border: 3px solid #0A0806;">
           <h2 style="color: #E3A23D; text-align: center;">¡Volvió lo que estabas esperando! 🎉</h2>
           ${info.imagen ? `<div style="text-align:center; margin: 20px 0;"><img src="${info.imagen}" alt="${info.nombre}" width="180" style="border-radius: 12px; border: 3px solid #0A0806;" /></div>` : ''}
           <p style="text-align:center;"><strong style="font-size: 20px;">${info.nombre}</strong></p>
           <p style="text-align:center; color: #9A9384;">está HOY en la tienda de Fortnite y podés tenerlo por</p>
           <p style="text-align:center; font-size: 28px; margin: 8px 0;"><strong style="color:#E3A23D;">$${info.usd.toFixed(2)} USD</strong> <span style="color:#9A9384; font-size: 14px;">(${info.pavos.toLocaleString('en-US')} pavos)</span></p>
           <p style="text-align:center; color: #9A9384; font-size: 13px;">La tienda rota cada día — si lo querés, no lo dejes pasar.</p>
           <div style="text-align: center; margin: 30px 0;">
             <a href="https://kitson-kit.store/tienda-diaria" style="background-color: #E3A23D; color: #0A0806; padding: 14px 28px; text-decoration: none; font-weight: 900; border-radius: 8px; display: inline-block; border: 2px solid #0A0806;">COMPRARLO AHORA</a>
           </div>
           <p style="font-size: 12px; color: #5A554A; text-align: center;">Recibís este aviso porque agregaste este ítem a tu lista de deseos en Kitson Kit. Podés quitarlo desde Mi Cuenta.</p>
         </div>`
      );

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
