import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { marcarAmistadCuenta } from '../../../lib/amistad';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!session?.user?.email || !adminEmail || session.user.email !== adminEmail) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
  }

  const { email } = await req.json();
  if (!email) {
    return NextResponse.json({ error: 'Falta el correo del cliente.' }, { status: 400 });
  }

  const resultado = await marcarAmistadCuenta(email);
  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
