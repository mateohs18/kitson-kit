import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { enviarEmail } from '../../../lib/emails';

// ============================================================================
// GET /api/test-email  (solo admin)
//
// Envía un email de prueba a tu propio correo de admin y te devuelve la
// respuesta CRUDA de Brevo. Sirve para diagnosticar en segundos por qué no
// están saliendo los emails:
//   - "BREVO_API_KEY no configurada"  -> falta la variable en Railway/Vercel
//   - "Brevo 401"                     -> la clave es inválida o venció
//   - "Brevo 400 ... sender"          -> EMAIL_USER no está verificado en Brevo
//   - "Brevo 402"                     -> te quedaste sin cuota (300/día gratis)
//   - ok: true                        -> Brevo funciona; el problema era el
//                                        webhook de Supabase (ya no se usa)
//
// Uso: abrí https://kitson-kit.store/api/test-email con tu sesión de admin.
// ============================================================================

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!session?.user?.email || !adminEmail || session.user.email !== adminEmail) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
  }

  // Por defecto se manda a tu propio correo de admin. Pasando ?to=direccion@donde-sea.com
  // podés mandarlo a cualquier casilla — por ejemplo, la dirección temporal que te da
  // mail-tester.com, para medir tu puntaje real de entregabilidad (SPF/DKIM/DMARC,
  // contenido, formato). Sigue protegido: solo el admin puede dispararlo.
  const destino = new URL(req.url).searchParams.get('to')?.trim() || adminEmail;

  const resultado = await enviarEmail(
    destino,
    '🧪 Prueba de emails — Kitson Kit',
    `<div style="font-family: sans-serif; padding: 20px;">
       <h2>✅ Los emails funcionan</h2>
       <p>Si estás leyendo esto, Brevo está configurado correctamente y los emails transaccionales del sitio van a salir sin problema.</p>
       <p>Enviado: ${new Date().toISOString()}</p>
     </div>`
  );

  return NextResponse.json({
    ...resultado,
    enviado_a: destino,
    diagnostico: resultado.ok
      ? `Enviado a ${destino}. Si es una dirección de mail-tester.com, andá a esa página y mirá tu puntaje.`
      : 'Brevo falló — el detalle exacto está en "error". Revisá BREVO_API_KEY, que EMAIL_USER esté verificado como remitente en Brevo, y tu cuota diaria.',
    variables: {
      BREVO_API_KEY: process.env.BREVO_API_KEY ? 'configurada ✅' : 'FALTA ❌',
      EMAIL_USER: process.env.EMAIL_USER || 'FALTA ❌',
    },
  });
}
