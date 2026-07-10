import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function POST(req: Request) {
  try {
    const { email, productoNombre, precio } = await req.json();

    if (!email || !productoNombre || !precio) return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });

    const { data: user, error: userError } = await supabase.from('profiles').select('balance').eq('email', email.trim()).single();
    if (userError || !user) return NextResponse.json({ error: 'El correo electrónico no está registrado.' }, { status: 404 });
    if (Number(user.balance) < Number(precio)) return NextResponse.json({ error: 'Saldo insuficiente.' }, { status: 400 });

    const nuevoSaldo = Number(user.balance) - Number(precio);
    await supabase.from('profiles').update({ balance: nuevoSaldo }).eq('email', email.trim());

    const { data: orden, error: ordenError } = await supabase.from('orders').insert([{ email: email.trim(), product: productoNombre, total: precio, status: 'PENDIENTE' }]).select().single();
    if (ordenError || !orden) return NextResponse.json({ error: 'Error al registrar orden.' }, { status: 500 });

    const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
    const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

    if (DISCORD_CHANNEL_ID && BOT_TOKEN) {
      await fetch(`https://discord.com/api/v10/channels/${DISCORD_CHANNEL_ID}/messages`, {
        method: 'POST',
        headers: { 'Authorization': `Bot ${BOT_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [
            {
              title: "🚨 Nueva Orden (Kitson Kit System)",
              description: "Se ha procesado una nueva compra.",
              color: 16766720,
              fields: [
                { name: "👤 Cliente", value: `\`${email}\``, inline: true },
                { name: "📦 Artículo", value: productoNombre, inline: true },
                { name: "💰 Monto", value: `$${Number(precio).toFixed(2)} USD`, inline: false },
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
                  style: 3, // Botón Verde
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
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}