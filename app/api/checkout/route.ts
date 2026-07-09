import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createClient } from '@supabase/supabase-js';

// Usamos la Llave Maestra para saltarnos las restricciones y escribir en la base de datos de forma segura
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! 
);

export async function POST(req: Request) {
  // 1. Verificamos que el usuario tenga sesión iniciada
  const session = await getServerSession();
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { cart, gamerId, paymentMethod, totalPrice, activeCurrency, receiptUrl } = await req.json();
  const userEmail = session.user.email;
  const userName = session.user.name || 'Gamer';

  try {
    if (paymentMethod === 'saldo') {
      // 2. Buscamos el saldo REAL en la base de datos (No confiamos en lo que diga el navegador)
      const { data: profile } = await supabaseAdmin.from('profiles').select('balance').eq('email', userEmail).single();
      
      if (!profile || profile.balance < totalPrice) {
        return NextResponse.json({ error: "Saldo insuficiente o cuenta no encontrada" }, { status: 400 });
      }

      // 3. Descontamos el saldo
      await supabaseAdmin.from('profiles').update({ balance: profile.balance - totalPrice }).eq('email', userEmail);
      
      // 4. Creamos el pedido ya pagado
      await supabaseAdmin.from('orders').insert([{
        user_email: userEmail, user_name: userName,
        gamer_id: gamerId, items: cart, total_price: totalPrice, status: 'PAGADO CON SALDO',
        country: 'Kitson Wallet', local_currency: 'USD', local_price: totalPrice
      }]);

    } else {
      // Si es pago manual, solo creamos la orden en estado PENDIENTE con la foto del recibo
      await supabaseAdmin.from('orders').insert([{
        user_email: userEmail, user_name: userName,
        gamer_id: gamerId, items: cart, total_price: totalPrice, status: 'PENDIENTE',
        country: activeCurrency.name, local_currency: activeCurrency.currency,
        local_price: activeCurrency.rate * totalPrice, payment_proof: receiptUrl
      }]);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}