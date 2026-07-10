import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { supabase } from '../../../lib/supabase';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!session?.user?.email || !adminEmail || session.user.email !== adminEmail) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
    }

    const { orderId } = await req.json();
    if (!orderId) {
      return NextResponse.json({ error: 'Falta el ID del pedido.' }, { status: 400 });
    }

    const { error } = await supabase.from('orders').update({ status: 'ENTREGADO' }).eq('id', orderId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en marcar-entregado:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}