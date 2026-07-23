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
//   - "POSTMARK_SERVER_TOKEN no configurada" -> falta la variable en Railway
//   - "Postmark 401"                          -> el token es inválido
//   - "Postmark 412 ... pending approval"     -> tu cuenta de Postmark
//     todavía no fue aprobada; mientras tanto solo podés mandar correos a
//     direcciones @kitson-kit.store (probá con ?to=ventas@kitson-kit.store)
//   - "Postmark 300 ... signature"            -> EMAIL_USER no está
//     verificado como Sender Signature/dominio en Postmark
//   - ok: true                                -> todo funciona
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
      : 'Postmark falló — el detalle exacto está en "error". Si dice "pending approval", tu cuenta de Postmark todavía se está revisando: mientras tanto solo podés mandar a direcciones @kitson-kit.store.',
    variables: {
      POSTMARK_SERVER_TOKEN: process.env.POSTMARK_SERVER_TOKEN ? 'configurada ✅' : 'FALTA ❌',
      EMAIL_USER: process.env.EMAIL_USER || 'FALTA ❌',
    },
  });
}
