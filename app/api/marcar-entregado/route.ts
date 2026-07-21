import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { supabaseAdmin } from '../../../lib/supabase-admin';
import { emailPedidoEntregado } from '../../../lib/emails';

export async function POST(req: Request) {
// ... resto del código
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

    const { data: orden, error } = await supabaseAdmin
      .from('orders')
      .update({ status: 'ENTREGADO' })
      .eq('id', orderId)
      .select('id, user_email, user_name')
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 📧 Email al cliente, directo desde acá (ya no depende del webhook de Supabase)
    let emailEnviado = false;
    if (orden?.user_email) {
      const r = await emailPedidoEntregado({ id: orden.id, user_email: orden.user_email, user_name: orden.user_name });
      emailEnviado = r.ok;
    }

    return NextResponse.json({ success: true, emailEnviado });
  } catch (error) {
    console.error('Error en marcar-entregado:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
