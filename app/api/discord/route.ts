import { verifyKey } from 'discord-interactions';
import { supabase } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const signature = req.headers.get('x-signature-ed25519') || '';
    const timestamp = req.headers.get('x-signature-timestamp') || '';
    const bodyText = await req.text();
    const PUBLIC_KEY = (process.env.DISCORD_PUBLIC_KEY || '').trim();

    if (!verifyKey(bodyText, signature, timestamp, PUBLIC_KEY)) {
      return new Response('Firma invalida', { status: 401 });
    }

    const interaction = JSON.parse(bodyText);

    // 1. EL TRUCO: Respuesta cruda (Raw String) para que Discord no se confunda
    if (interaction.type === 1) {
      return new Response('{"type":1}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. COMANDOS (/recargar)
    if (interaction.type === 2 && interaction.data.name === 'recargar') {
      const correo = interaction.data.options.find((o: any) => o.name === 'correo').value;
      const monto = interaction.data.options.find((o: any) => o.name === 'monto').value;

      const { data: user } = await supabase.from('profiles').select('balance').eq('email', correo.trim()).single();

      if (!user) {
        return new Response('{"type":4,"data":{"content":"❌ Correo no encontrado"}}', { status: 200, headers: { 'Content-Type': 'application/json' }});
      }

      const nuevoSaldo = Number(user.balance || 0) + Number(monto);
      await supabase.from('profiles').update({ balance: nuevoSaldo }).eq('email', correo.trim());

      return new Response(JSON.stringify({
        type: 4,
        data: { content: `✅ **¡RECARGA EXITOSA!**\nSe añadieron **$${Number(monto).toFixed(2)} USD** a **${correo}**.\nNuevo saldo: **$${nuevoSaldo.toFixed(2)} USD**.` }
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // 3. BOTONES DE ENTREGAR
    if (interaction.type === 3) {
      const customId = interaction.data.custom_id;
      if (customId.startsWith('entregar_')) {
        const orderId = customId.split('_')[1];
        await supabase.from('orders').update({ status: 'ENTREGADO' }).eq('id', orderId);

        return new Response(JSON.stringify({
          type: 7, 
          data: { content: `✅ Pedido **#${orderId.slice(0,8)}** ENTREGADO.`, components: [] }
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
    }

    return new Response('{"success":true}', { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response('Error', { status: 500 });
  }
}