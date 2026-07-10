import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { supabaseAdmin } from '../../../lib/supabase-admin';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('user_email', session.user.email.trim())
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ orders: data || [] });
}
