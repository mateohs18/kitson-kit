// Configuración de Sentry para el runtime Edge — lo usa tu proxy.ts
// (la protección del panel de admin), que corre en Edge por defecto.
import * as Sentry from '@sentry/nextjs';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.2,
  });
}
