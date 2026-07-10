import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { supabaseAdmin } from '../../../lib/supabase-admin';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  const email = session.user.email.trim();
  const name = session.user.name || 'Usuario';

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('balance')
    .eq('email', email)
    .single();

  // Si el usuario todavía no tiene fila en "profiles", se la creamos con saldo 0.
  if (error || !data) {
    const { data: nuevo, error: insertError } = await supabaseAdmin
      .from('profiles')
      .insert([{ email, name, balance: 0 }])
      .select('balance')
      .single();

    if (insertError || !nuevo) {
      return NextResponse.json({ error: 'No se pudo obtener el saldo.' }, { status: 500 });
    }
    return NextResponse.json({ balance: nuevo.balance });
  }

  return NextResponse.json({ balance: data.balance });
}
