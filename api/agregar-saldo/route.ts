import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { supabaseAdmin } from '../../../lib/supabase-admin';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!session?.user?.email || !adminEmail || session.user.email !== adminEmail) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
    }

    const { emailSaldo, montoSaldo } = await req.json();

    if (!emailSaldo || !montoSaldo) {
      return NextResponse.json({ error: 'Falta el correo o el monto.' }, { status: 400 });
    }

    const monto = Number(montoSaldo);
    if (!Number.isFinite(monto) || monto <= 0) {
      return NextResponse.json({ error: 'Monto inválido.' }, { status: 400 });
    }

    const { data: user, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('balance')
      .eq('email', emailSaldo.trim())
      .single();

    if (fetchError || !user) {
      return NextResponse.json({ error: 'No se encontró ningún usuario con ese correo.' }, { status: 404 });
    }

    const nuevoSaldo = Number(user.balance || 0) + monto;

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ balance: nuevoSaldo })
      .eq('email', emailSaldo.trim());

    if (updateError) {
      return NextResponse.json({ error: `Error al guardar el saldo: ${updateError.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, nuevoSaldo });
  } catch (error) {
    console.error('Error en agregar-saldo:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
