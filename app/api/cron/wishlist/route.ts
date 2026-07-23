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
      const linkItem = `https://kitson-kit.store/tienda-diaria?buscar=${encodeURIComponent(info.nombre)}`;
      const resultado = await enviarEmail(
        deseo.email,
        `Disponible hoy: ${info.nombre}`,
        `<div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; background-color: #ffffff; color: #222222; padding: 24px; border: 1px solid #e2e2e2; border-radius: 8px;">
           <p style="font-size: 14px; color: #555;">Hola,</p>
           <p style="font-size: 14px; color: #333; line-height: 1.5;">El artículo que guardaste en tu lista de deseos de Kitson Kit está disponible hoy en la tienda de Fortnite:</p>
           <table role="presentation" style="width: 100%; margin: 18px 0; border-collapse: collapse;">
             <tr>
               ${info.imagen ? `<td style="width: 72px; vertical-align: top;"><img src="${info.imagen}" alt="${info.nombre}" width="64" style="border-radius: 6px; display: block;" /></td>` : ''}
               <td style="vertical-align: top; padding-left: ${info.imagen ? '12px' : '0'};">
                 <p style="margin: 0; font-size: 15px; font-weight: 600; color: #111;">${info.nombre}</p>
                 <p style="margin: 4px 0 0; font-size: 13px; color: #666;">${info.pavos.toLocaleString('en-US')} pavos · $${info.usd.toFixed(2)} USD en Kitson</p>
               </td>
             </tr>
           </table>
           <p style="font-size: 13px; color: #555;">La tienda del juego cambia todos los días, así que este artículo puede no estar disponible mañana.</p>
           <p style="font-size: 14px; margin: 16px 0;"><a href="${linkItem}" style="color: #1a5fb4;">Ver este artículo en Kitson Kit →</a></p>
           <p style="font-size: 12px; color: #999; margin-top: 24px; border-top: 1px solid #eee; padding-top: 12px;">Te llegó este aviso porque agregaste este artículo a tu lista de deseos. Podés administrarla desde Mi Cuenta en kitson-kit.store.</p>
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
