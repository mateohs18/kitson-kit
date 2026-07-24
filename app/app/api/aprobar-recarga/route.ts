import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { aprobarRecarga } from '../../../lib/recargas';
import { esEmailAdmin } from '../../../lib/admin';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!esEmailAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
  }

  const { recargaId } = await req.json();
  if (!recargaId) {
    return NextResponse.json({ error: 'Falta el ID de la recarga.' }, { status: 400 });
  }

  const resultado = await aprobarRecarga(recargaId);
  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, nuevoSaldo: resultado.nuevoSaldo });
}
