// Configuración de Sentry para el navegador (errores de React, JS del cliente).
// Se activa solo si existe la variable NEXT_PUBLIC_SENTRY_DSN — sin ella,
// no hace nada (no rompe el sitio si todavía no configuraste Sentry).
import * as Sentry from '@sentry/nextjs';

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.2, // 20% de las visitas, para no gastar cuota gratis de más
    // No mandamos replay de sesión (grabación de pantalla) para no capturar
    // datos sensibles de los clientes por accidente.
  });
}
