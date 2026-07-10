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

    // 3. ENVIAR ALERTA A DISCORD
    const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
    const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

    if (DISCORD_CHANNEL_ID && BOT_TOKEN) {
      const resumenProductos = cart.map((item: any) => `• ${item.name} (x${item.quantity})`).join('\n');
      const metodoTexto = paymentMethod === 'saldo' ? '💰 Pagado con Saldo Kitson' : '🏦 Transferencia Bancaria';
      const urlComprobante = receiptUrl ? `\n\n📄 **[Ver Comprobante de Pago](${receiptUrl})**` : '';

      // Menciona a todos los admins configurados (podés poner más de uno separados por coma).
      const idsAdmin = (process.env.DISCORD_ADMIN_IDS || '').split(',').map((id) => id.trim()).filter(Boolean);
      const menciones = idsAdmin.map((id) => `<@${id}>`).join(' ');

      await fetch(`https://discord.com/api/v10/channels/${DISCORD_CHANNEL_ID}/messages`, {
        method: 'POST',
        headers: { 'Authorization': `Bot ${BOT_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: menciones || undefined,
          embeds: [
            {
              title: paymentMethod === 'saldo' ? "✅ Nueva Orden (Pagada)" : "⏳ Nueva Orden (Verificar Transferencia)",
              description: `Se ha procesado una nueva compra.\n**Método:** ${metodoTexto}${urlComprobante}`,
              color: paymentMethod === 'saldo' ? 5763719 : 16766720, // Verde para saldo, Amarillo para transferencia
              fields: [
                { name: "👤 Cliente", value: `\`${email}\``, inline: true },
                { name: "🎮 Epic ID", value: `\`${gamerId}\``, inline: true },
                { name: "💵 Monto", value: `$${Number(totalPrice).toFixed(2)} USD`, inline: false },
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