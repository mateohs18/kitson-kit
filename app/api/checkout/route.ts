import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function POST(req: Request) {
  try {
    const { email, userName, cart, gamerId, totalPrice } = await req.json();

    if (!email || !cart || cart.length === 0 || totalPrice === undefined) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    // 1. Verificamos el saldo
    const { data: user, error: userError } = await supabase.from('profiles').select('balance').eq('email', email.trim()).single();
    if (userError || !user) return NextResponse.json({ error: 'El correo no está registrado.' }, { status: 404 });
    if (Number(user.balance) < Number(totalPrice)) return NextResponse.json({ error: 'Saldo insuficiente.' }, { status: 400 });

    // 2. CREAR LA ORDEN CON TUS NOMBRES DE COLUMNAS EXACTOS
    const { data: orden, error: ordenError } = await supabase
      .from('orders')
      .insert([{ 
        user_email: email.trim(), 
        user_name: userName,
        gamer_id: gamerId,
        items: cart,              // Se guarda perfecto porque tu columna es jsonb
        total_price: totalPrice, 
        status: 'PENDIENTE' 
      }])
      .select()
      .single();

    if (ordenError || !orden) {
      console.error("❌ ERROR EN SUPABASE:", ordenError);
      return NextResponse.json({ error: `Error DB: ${ordenError?.message}` }, { status: 500 });
    }

    // 3. Descontamos el saldo
    const nuevoSaldo = Number(user.balance) - Number(totalPrice);
    await supabase.from('profiles').update({ balance: nuevoSaldo }).eq('email', email.trim());

    // 4. Enviamos la alerta mejorada a Discord
    const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
    const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

    if (DISCORD_CHANNEL_ID && BOT_TOKEN) {
      // Creamos una lista bonita de los items para Discord
      const resumenProductos = cart.map((item: any) => `• ${item.name} (x${item.quantity})`).join('\n');

      await fetch(`https://discord.com/api/v10/channels/${DISCORD_CHANNEL_ID}/messages`, {
        method: 'POST',
        headers: { 'Authorization': `Bot ${BOT_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [
            {
              title: "🚨 Nueva Orden (Kitson Kit System)",
              description: "Se ha procesado una nueva compra con saldo.",
              color: 16766720,
              fields: [
                { name: "👤 Cliente", value: `\`${email}\``, inline: true },
                { name: "🎮 Epic ID / Tag", value: `\`${gamerId}\``, inline: true },
                { name: "💰 Monto Cobrado", value: `$${Number(totalPrice).toFixed(2)} USD`, inline: false },
                { name: "📦 Artículos", value: resumenProductos, inline: false },
                { name: "🆔 Orden ID", value: `\`${orden.id}\``, inline: false }
              ]
            }
          ],
          components: [
            {
              type: 1,
              components: [
                {
                  type: 2,
                  style: 3,
                  label: '📦 Marcar como Entregado',
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
    console.error("Error general:", error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}