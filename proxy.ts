import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { esEmailAdmin } from './lib/admin';

// Poné tu correo de admin en el .env (ADMIN_EMAIL=tu@correo.com), o varios
// separados por coma en ADMIN_EMAILS, en vez de tenerlo escrito directo en
// el código. Este proxy es lo que realmente bloquea el acceso: el chequeo
// dentro de app/admin/page.tsx solo mejora la experiencia (evita el
// parpadeo de contenido), pero no es seguridad real porque corre en el
// navegador.
export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!esEmailAdmin(token?.email)) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/agregar-saldo/:path*', '/api/marcar-entregado/:path*', '/api/pedidos-admin/:path*', '/api/recargas-admin/:path*', '/api/aprobar-recarga/:path*', '/api/discord/setup/:path*', '/api/productos-admin/:path*', '/api/gestionar-producto/:path*', '/api/resenas-admin/:path*', '/api/eliminar-resena/:path*', '/api/marcar-amistad-enviada/:path*', '/api/marcar-amistad-cuenta/:path*', '/api/solicitudes-amistad-admin/:path*', '/api/actualizar-tasa-cambio/:path*'],
};