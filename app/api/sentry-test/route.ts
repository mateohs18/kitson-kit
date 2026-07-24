import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { esEmailAdmin } from '../../../lib/admin';
import { reportarError } from '../../../lib/sentry';

// ============================================================================
// GET /api/sentry-test  (solo admin)
//
// Provoca un error A PROPÓSITO para confirmar que Sentry está bien
// conectado. Usalo una sola vez después de configurar las variables
// SENTRY_DSN / NEXT_PUBLIC_SENTRY_DSN / SENTRY_ORG / SENTRY_PROJECT:
//
//   1. Entrá a esta URL con tu sesión de admin.
//   2. Te va a devolver un error 500 (es lo esperado, es a propósito).
//   3. Andá a tu proyecto en sentry.io → si ves un evento nuevo llamado
//      "Error de prueba de Sentry — Kitson Kit", ¡está todo conectado!
//   4. Si no aparece nada en un par de minutos, revisá que las 4 variables
//      de entorno estén bien cargadas en Railway.
// ============================================================================
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!esEmailAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
  }

  try {
    throw new Error('Error de prueba de Sentry — Kitson Kit');
  } catch (error) {
    reportarError(error, 'sentry-test');
    return NextResponse.json(
      {
        ok: false,
        mensaje: 'Error provocado a propósito y enviado a Sentry. Revisá tu panel de sentry.io en unos segundos.',
      },
      { status: 500 }
    );
  }
}
