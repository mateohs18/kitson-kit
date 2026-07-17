import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { supabaseAdmin } from '../../../lib/supabase-admin';

export async function GET() {
  const session = await getServerSession(authOptions);
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!session?.user?.email || !adminEmail || session.user.email !== adminEmail) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin.from('products').select('*').order('name', { ascending: true });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ products: data || [] });
}
