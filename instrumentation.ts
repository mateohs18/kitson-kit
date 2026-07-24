// Este archivo es el que REALMENTE activa Sentry — sin él, sentry.server.config.ts
// y sentry.edge.config.ts quedan escritos pero nunca se ejecutan. Next.js lo
// corre automáticamente una sola vez al arrancar el servidor.
import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

// Captura automáticamente los errores de Server Components, del proxy
// (middleware) y de las rutas — sin esto, solo se reportan los errores que
// atrapamos a mano con reportarError().
export const onRequestError = Sentry.captureRequestError;
