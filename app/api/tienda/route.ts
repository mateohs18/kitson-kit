import { NextResponse } from 'next/server';
import { getShopEntries, getMargenTienda, precioTiendaUsd } from '../../../lib/tienda-diaria';

// ============================================================================
// GET /api/tienda
//
// Devuelve el catálogo diario de Fortnite con TU precio de venta ya
// calculado en el servidor (pavos/100 + margen configurable desde el admin).
//
// Ventajas sobre pegarle a fortnite-api.com desde el navegador:
//  - El margen de ganancia no queda expuesto en el código del frontend.
//  - Cambiás el margen desde el admin y se aplica al instante, sin deploy.
//  - Un solo fetch cacheado en tu servidor en vez de uno por visitante.
// ============================================================================

export async function GET() {
  try {
    const [entries, margen] = await Promise.all([getShopEntries(), getMargenTienda()]);

    // Agregamos a cada entrada los precios en USD ya listos para mostrar.
    // El resto de la estructura queda igual, así el frontend casi no cambia.
    const conPrecios = entries.map((entry: any) => ({
      ...entry,
      kkUsdPrice: typeof entry.finalPrice === 'number' ? precioTiendaUsd(entry.finalPrice, margen) : null,
      kkRegularUsdPrice: typeof entry.regularPrice === 'number' ? precioTiendaUsd(entry.regularPrice, margen) : null,
    }));

    return NextResponse.json(
      { status: 200, data: { entries: conPrecios } },
      {
        headers: {
          // El navegador y el CDN pueden cachear 2 min; el servidor ya cachea 5.
          'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Error en /api/tienda:', error);
    return NextResponse.json({ status: 500, error: 'No se pudo cargar la tienda' }, { status: 500 });
  }
}
