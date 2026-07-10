import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function POST(req: Request) {
  try {
    const { email, productoNombre, precio } = await req.json();

    if (!email || !productoNombre || !precio) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    // 1. VERIFICAR EL SALDO DEL CLIENTE EN SUPABASE
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('balance')
      .eq('email', email.trim())
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'El correo electrónico no está registrado en el sistema.' }, { status: 404 });
    }

    if (Number(user.balance) < Number(precio)) {
      return NextResponse.json({ error: 'Saldo insuficiente para realizar esta compra.' }, { status: 400 });
    }

    // 2. RESTAR EL SALDO DE LA CUENTA
    const nuevoSaldo = Number(user.balance) - Number(precio);
    await supabase
      .from('profiles')
      .update({ balance: nuevoSaldo })
      .eq('email', email.trim());

    // 3. CREAR LA ORDEN EN LA TABLA DE PEDIDOS
    const { data: orden, error: ordenError } = await supabase
      .from('orders')
      .insert([
        { email: email.trim(), product: productoNombre, total: precio, status: 'PENDIENTE' }
      ])
      .select()
      .single();

    if (ordenError || !orden) {
      return NextResponse.json({ error: 'Error crítico al registrar la orden.' }, { status: 500 });
    }

    // 4. ENVIAR LA ALERTA AUTOMÁTICA A DISCORD CON EL BOTÓN INTERACTIVO
    const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
    const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

    if (DISCORD_CHANNEL_ID && BOT_TOKEN) {
      await fetch(`https://discord.com/api/v10/channels/${DISCORD_CHANNEL_ID}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${BOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: `🚨 **¡NUEVA ORDEN PROCESADA EN LA WEB!** 🚨\n\n👤 **Cliente:** \`${email}\`\n📦 **Artículo:** ${productoNombre}\n💰 **Monto Cobrado:** $${Number(precio).toFixed(2)} USD\n🆔 **Orden ID:** \`${orden.id}\``,
          components: [
            {
              type: 1, // Barra de acciones
              components: [
                {
                  type: 2, // Componente Botón
                  style: 3, // Color Verde (Success)
                  label: '📦 Marcar como Entregado',
                  // 🔥 La magia: Al pulsar este botón, se dispara el código de entregas que ya creamos en tu bot
                  custom_id: `entregar_${orden.id}` 
                }
              ]
            }
          ]
        })
      });
    }

    return NextResponse.json({ success: true, nuevoSaldo, ordenId: orden.id });

  } catch (error) {
    console.error("Error en checkout:", error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}