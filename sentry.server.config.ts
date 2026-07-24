// Configuración de Sentry para el servidor (errores en las API routes: el
// checkout, los crons, los webhooks). Esto es lo que más te interesa: te
// avisa por email/Slack apenas algo falla en producción, sin depender de
// que un cliente te escriba para enterarte.
import * as Sentry from '@sentry/nextjs';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.2,
  });
}
