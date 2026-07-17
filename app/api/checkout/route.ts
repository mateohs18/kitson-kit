import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { supabaseAdmin } from '../../../lib/supabase-admin';

export async function POST(req: Request) {
  try {
    const cuerpo = await req.json();
    const { email, userName, cart, gamerId, totalPrice, paymentMethod, receiptUrl } = cuerpo;

    // 🔥 AHORA LOS ERRORES SON ESPECÍFICOS
    if (!email) return NextResponse.json({ error: 'Falta el correo electrónico (email)' }, { status: 400 });
    if (!cart || cart.length === 0) return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 });
    if (totalPrice === undefined) return NextResponse.json({ error: 'Falta el precio total' }, { status: 400 });
    if (!gamerId) return NextResponse.json({ error: 'Falta el ID de Epic Games' }, { status: 400 });

    let nuevoSaldo = 0;

    // 1. SI PAGA CON SALDO: hay que estar autenticado y solo se puede
    // descontar el saldo de la cuenta que inició sesión (nunca la de otro).
    if (paymentMethod === 'saldo') {
      const session = await getServerSession(authOptions);

      if (!session?.user?.email) {
        return NextResponse.json({ error: 'Debes iniciar sesión para pagar con saldo.' }, { status: 401 });
      }

      // Ignoramos el email que mande el cliente y usamos el de la sesión
      // verificada en el servidor, para que nadie pueda descontar saldo ajeno.
      const emailAutenticado = session.user.email.trim();

      const { data: user, error: userError } = await supabaseAdmin.from('profiles').select('balance').eq('email', emailAutenticado).single();
      if (userError || !user) return NextResponse.json({ error: 'El correo no está registrado.' }, { status: 404 });
      if (Number(user.balance) < Number(totalPrice)) return NextResponse.json({ error: 'Saldo insuficiente en tu billetera.' }, { status: 400 });

      nuevoSaldo = Number(user.balance) - Number(totalPrice);
      await supabaseAdmin.from('profiles').update({ balance: nuevoSaldo }).eq('email', emailAutenticado);
    }

    // 2. CREAR LA ORDEN EN LA BASE DE DATOS
    const { data: orden, error: ordenError } = await supabaseAdmin
      .from('orders')
      .insert([{ 
        user_email: email.trim(), 
        user_name: userName || 'Usuario',
        gamer_id: gamerId,
        items: cart,              
        total_price: totalPrice, 
        status: 'PENDIENTE' 
      }])
      .select()
      .single();

    if (ordenError || !orden) {
      console.error("❌ ERROR EN SUPABASE:", ordenError);
      return NextResponse.json({ error: `Error DB: ${ordenError?.message}` }, { status: 500 });
    }

    // 4. 🔥 ENVIAR LA ORDEN AUTOMÁTICAMENTE A TU BOT (NGROK)
    // Solo automatizamos si pagó con saldo. Si es transferencia, tú lo revisas manual.
    if (paymentMethod === 'saldo') {
      // ⚠️ IMPORTANTE: Si reiniciaste Ngrok, asegúrate de actualizar esta URL
      const NGROK_URL = "https://underwear-july-sanded.ngrok-free.dev"; 
      
      for (const item of cart) {
        try {
          console.log(`Enviando ${item.name} a ${gamerId} mediante Ngrok...`);
          
          const botResponse = await fetch(`${NGROK_URL}/api/bot/enviar-regalo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              epicName: gamerId, // El ID/Nombre de Epic del cliente
              offerId: item.offerId, // El ID de la skin que configuramos en la tarjeta
              mensaje: "¡Gracias por comprar en Kitson Kit!"
            })
          });
          
          // Si el bot de tu PC responde que todo salió bien, actualizamos la base de datos
          if (botResponse.ok) {
            console.log(`✅ Regalo entregado con éxito: ${item.name}`);
            await supabaseAdmin.from('orders').update({ status: 'ENTREGADO' }).eq('id', orden.id);
          } else {
            console.error(`❌ El bot rechazó el envío de ${item.name}:`, await botResponse.text());
          }
        } catch (botError) {
          console.error("❌ No se pudo conectar con Ngrok. ¿Tu PC y el bot están encendidos?", botError);
        }
      }
    }
