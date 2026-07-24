import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { supabaseAdmin } from '../../../../lib/supabase-admin';
import { esEmailAdmin } from '../../../../lib/admin';

// Estado de un pedido, solo visible para su dueño (o el admin).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Inicia sesión.' }, { status: 401 });
  }

  const { id } = await params;
  const { data: orden, error } = await supabaseAdmin
    .from('orders')
    .select('id, user_email, gamer_id, items, total_price, status, created_at, coupon_code, discount, friend_request_sent_at')
    .eq('id', id)
    .single();

  if (error || !orden) return NextResponse.json({ error: 'Pedido no encontrado.' }, { status: 404 });

  const esDueno = orden.user_email === session.user.email;
  const esAdmin = process.env.ADMIN_EMAIL && esEmailAdmin(session.user.email);
  if (!esDueno && !esAdmin) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
  }

  const { user_email, ...ordenPublica } = orden;
  return NextResponse.json({ orden: ordenPublica });
}
