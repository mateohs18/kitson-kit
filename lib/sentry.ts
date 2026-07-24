import * as Sentry from '@sentry/nextjs';

// Envolvé cualquier bloque riesgoso de una API route con esto para que,
// además de loguear en consola, el error viaje a Sentry (si está configurado)
// y te llegue una alerta. Uso:
//
//   } catch (error) {
//     reportarError(error, 'checkout');
//     return NextResponse.json({ error: 'Error interno' }, { status: 500 });
//   }
export function reportarError(error: unknown, contexto: string) {
  console.error(`[${contexto}]`, error);
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, { tags: { contexto } });
  }
}
