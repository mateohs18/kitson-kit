import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { esEmailAdmin } from '../../../lib/admin';

// ============================================================================
// GET /api/tasa-referencia  (solo admin)
//
// Trae la cotización actual del dólar (USD -> MXN/COP/PEN) desde una API
// pública gratuita, solo como REFERENCIA junto al campo de cada tasa en el
// admin. No cambia nada solo, y no reemplaza tu criterio: vos seguís
// decidiendo y guardando el valor final a mano — esto evita que el número
// quede desactualizado por semanas sin que te des cuenta.
//
// Cacheado 6 horas: no tiene sentido consultarlo más seguido que eso.
// ============================================================================

let cache: { data: Record<string, number>; fetchedAt: number } | null = null;
const CACHE_MS = 6 * 60 * 60 * 1000;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!esEmailAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
  }

  if (cache && Date.now() - cache.fetchedAt < CACHE_MS) {
    return NextResponse.json({ tasas: cache.data, actualizado: new Date(cache.fetchedAt).toISOString() });
  }

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', { next: { revalidate: 21600 } });
    if (!res.ok) throw new Error('API de cotización no respondió');
    const json = await res.json();

    const tasas = {
      MX: Number(json?.rates?.MXN) || 0,
      CO: Number(json?.rates?.COP) || 0,
      PE: Number(json?.rates?.PEN) || 0,
    };

    cache = { data: tasas, fetchedAt: Date.now() };
    return NextResponse.json({ tasas, actualizado: new Date().toISOString() });
  } catch (e) {
    console.error('Error consultando tasa de referencia:', e);
    return NextResponse.json({ error: 'No se pudo consultar la cotización de referencia.' }, { status: 502 });
  }
}
