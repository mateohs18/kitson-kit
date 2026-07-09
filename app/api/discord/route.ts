import { NextResponse } from 'next/server';
import { verifyKey } from 'discord-interactions';
import { supabase } from '../../../lib/supabase';

export async function POST(req: Request) {
  const signature = req.headers.get('x-signature-ed25519');
  const timestamp = req.headers.get('x-signature-timestamp');
  const bodyText = await req.text();

  const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY || '';

  if (!signature || !timestamp) return new NextResponse('Faltan cabeceras', { status: 401 });

  const isValidRequest = verifyKey(bodyText, signature, timestamp, PUBLIC_KEY);
  if (!isValidRequest) return new NextResponse('Firma inválida', { status: 401 });

  const interaction = JSON.parse(bodyText);

  // 1. PING DE VERIFICACIÓN
  if (interaction.type === 1) return NextResponse.json({ type: 1 });

  // 2. COMANDOS DE BARRA (/recargar)
  if (interaction.type === 2) {
    if (interaction.data.name === 'recargar') {
      const correo = interaction.data.options.find((o: any) => o.name === 'correo').value;
      const monto = interaction.data.options.find((o: any) => o.name === 'monto').value;

      // Buscar usuario en profiles
      const { data: user, error: fetchErr } = await supabase.from('profiles').select('balance').eq('email', correo.trim()).single();

      if (fetchErr || !user) {
        return NextResponse.json({
          type: 4, 
          data: { content: `❌ No se encontró ningún cliente con el correo: **${correo}**` }
        });
      }

      // Sumar y actualizar
      const nuevoSaldo = Number(user.balance || 0) + Number(monto);
      const { error: updateErr } = await supabase.from('profiles').update({ balance: nuevoSaldo }).eq('email', correo.trim());

      if (updateErr) {
        return NextResponse.json({ type: 4, data: { content: '❌ Error al actualizar la base de datos.' } });
      }

      // Responder en Discord con éxito
      return NextResponse.json({
        type: 4,
        data: { content: `✅ **¡RECARGA EXITOSA!** 💰\nSe añadieron **$${Number(monto).toFixed(2)} USD** a la cuenta de **${correo}**.\n\nNuevo saldo total: **$${nuevoSaldo.toFixed(2)} USD**.` }
      });
    }
  }

  // 3. CLIC EN UN BOTÓN (Aprobar pedidos)
  if (interaction.type === 3) {
    const customId = interaction.data.custom_id;

    if (customId.startsWith('entregar_')) {
      const orderId = customId.split('_')[1];

      const { error } = await supabase.from('orders').update({ status: 'ENTREGADO' }).eq('id', orderId);

      if (error) {
        return NextResponse.json({ type: 4, data: { content: '❌ Error: ' + error.message } });
      }

      return NextResponse.json({
        type: 7, 
        data: {
          content: `✅ ¡Misión Cumplida! El pedido **#${orderId.slice(0,8)}** ha sido marcado como ENTREGADO.`,
          components: [] 
        }
      });
    }
  }

  return new NextResponse('Interacción no reconocida', { status: 400 });
}