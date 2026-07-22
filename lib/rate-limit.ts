// ============================================================================
// RATE LIMITING (límite de peticiones por IP)
//
// Protege las APIs públicas de abuso: alguien con un script podría intentar
// adivinar cupones por fuerza bruta, spamear checkouts falsos o llenarte el
// storage de comprobantes basura. Con esto, cada IP tiene un tope por minuto.
//
// Es un limitador EN MEMORIA: funciona perfecto en Railway porque el sitio
// corre como un único proceso persistente. (Si algún día migrás a Vercel u
// otro serverless, reemplazalo por Upstash Redis.)
// ============================================================================

interface Ventana {
  count: number;
  resetAt: number;
}

const ventanas = new Map<string, Ventana>();

// Limpieza periódica para que el Map no crezca infinito
setInterval(() => {
  const ahora = Date.now();
  for (const [clave, v] of ventanas) {
    if (v.resetAt <= ahora) ventanas.delete(clave);
  }
}, 60_000).unref?.();

/**
 * Devuelve true si la petición está DENTRO del límite (se permite),
 * false si la IP ya se pasó (hay que rechazarla con 429).
 *
 * @param req        la Request entrante (para leer la IP)
 * @param nombre     identificador del endpoint, ej: 'checkout'
 * @param maximo     peticiones permitidas por ventana
 * @param ventanaMs  duración de la ventana en milisegundos (default: 1 minuto)
 */
export function permitirPeticion(req: Request, nombre: string, maximo: number, ventanaMs = 60_000): boolean {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'desconocida';

  const clave = `${nombre}:${ip}`;
  const ahora = Date.now();
  const ventana = ventanas.get(clave);

  if (!ventana || ventana.resetAt <= ahora) {
    ventanas.set(clave, { count: 1, resetAt: ahora + ventanaMs });
    return true;
  }

  if (ventana.count >= maximo) return false;

  ventana.count++;
  return true;
}

/** Respuesta estándar 429 para cuando se supera el límite. */
export function respuesta429() {
  return new Response(
    JSON.stringify({ error: 'Demasiadas peticiones. Esperá un minuto e intentá de nuevo.' }),
    { status: 429, headers: { 'Content-Type': 'application/json' } }
  );
}
