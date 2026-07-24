import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { supabaseAdmin } from '../../../lib/supabase-admin';

// Historial de movimientos de la billetera del usuario logueado (últimos 40).
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Inicia sesión.' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('movimientos')
    .select('id, concepto, monto, created_at')
    .eq('email', session.user.email)
    .order('created_at', { ascending: false })
    .limit(40);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ movimientos: data || [] });
}
