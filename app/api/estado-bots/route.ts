import { NextResponse } from 'next/server';

// ============================================================================
// GET /api/estado-bots  (público, sin autenticación)
//
// Resume la capacidad de entrega actual (pavos disponibles + regalos que
// quedan hoy) para mostrarle a los CLIENTES un indicador simple de "hay
// stock" en la home. A propósito NO expone nada sensible: ni nombres de
// cuentas, ni accountId, ni el secreto del bot — solo totales agregados.
//
// Cacheado 60 segundos en el servidor para no pegarle al bot en cada visita.
// Si el bot no responde, devuelve operativo:false y el frontend simplemente
// no muestra nada (nunca un error feo de cara al cliente).
// ============================================================================

let cache: { data: any; fetchedAt: number } | null = null;
const CACHE_MS = 60 * 1000;

export async function GET() {
  if (cache && Date.now() - cache.fetchedAt < CACHE_MS) {
    return NextResponse.json(cache.data);
  }

  const BOT_URL = process.env.BOT_DELIVERY_URL;
  const BOT_SECRET = process.env.BOT_DELIVERY_SECRET;

  if (!BOT_URL) {
    return NextResponse.json({ operativo: false });
  }

  try {
    const res = await fetch(`${BOT_URL}/api/bots/status`, {
      headers: {
        'ngrok-skip-browser-warning': 'true',
        ...(BOT_SECRET ? { 'x-bot-secret': BOT_SECRET } : {}),
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return NextResponse.json({ operativo: false });
    }

    const json = await res.json();
    const bots: any[] = json?.bots || [];
    const activos = bots.filter((b) => b.ready);

    const resultado = {
      operativo: activos.length > 0,
      pavosDisponibles: activos.reduce((acc, b) => acc + (Number(b.vbucks) || 0), 0),
      regalosHoy: activos.reduce((acc, b) => acc + Math.max(0, Number(b.giftsRemaining) || 0), 0),
    };

    cache = { data: resultado, fetchedAt: Date.now() };
    return NextResponse.json(resultado);
  } catch {
    return NextResponse.json({ operativo: false });
  }
}
