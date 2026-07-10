import { verifyKey } from 'discord-interactions';
import { supabase } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const signature = req.headers.get('x-signature-ed25519');
    const timestamp = req.headers.get('x-signature-timestamp');
    
    if (!signature || !timestamp) {
      return new Response('Faltan firmas', { status: 401 });
    }

    const bodyText = await req.text();
    // Tu llave exacta de "Kitson Admin"
    const PUBLIC_KEY = "72b7028f1a0e5e72731199ea8cd1523ee7dea08f64fc0ccd4c3b5df151ff389a";

    if (!verifyKey(bodyText, signature, timestamp, PUBLIC_KEY)) {
      return new Response('Firma invalida', { status: 401 });
    }

    const interaction = JSON.parse(bodyText);

    // 1. EL PING (Declarando el tamaño exacto del paquete para que Discord no lo rechace)
    if (interaction.type === 1) {
      const pingResponse = JSON.stringify({ type: 1 });
      return new Response(pingResponse, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': new TextEncoder().encode(pingResponse).length.toString(),
        }
      });
    }

    // 2. COMANDOS (/recargar)
    if (interaction.type === 2 && interaction.data.name === 'recargar') {
      const correo = interaction.data.options.find((o: any) => o.name === 'correo').value;
      const monto = interaction.data.options.find((o: any) => o.name === 'monto').value;

      const { data: user } = await supabase.from('profiles').select('balance').eq('email', correo.trim()).single();

      if (!user) {
        const errorBody = JSON.stringify({ type: 4, data: { content: `❌ Correo no encontrado: ${correo}` } });
        return new Response(errorBody, { status: 200, headers: { 'Content-Type': 'application/json', 'Content-Length': new TextEncoder().encode(errorBody).length.toString() }});
      }

      const nuevoSaldo = Number(user.balance || 0) + Number(monto);
      await supabase.from('profiles').update({ balance: nuevoSaldo }).eq('email', correo.trim());

      const successBody = JSON.stringify({
        type: 4,
        data: { content: `✅ **¡RECARGA EXITOSA!** 💰\nSe añadieron **$${Number(monto).toFixed(2)} USD** a **${correo}**.\nNuevo saldo: **$${nuevoSaldo.toFixed(2)} USD**.` }
      });
      return new Response(successBody, { status: 200, headers: { 'Content-Type': 'application/json', 'Content-Length': new TextEncoder().encode(successBody).length.toString() } });
    }

    // 3. BOTONES DE ENTREGAR
    if (interaction.type === 3) {
      const customId = interaction.data.custom_id;
      if (customId.startsWith('entregar_')) {
        const orderId = customId.split('_')[1];
        await supabase.from('orders').update({ status: 'ENTREGADO' }).eq('id', orderId);

        const btnBody = JSON.stringify({ type: 7, data: { content: `✅ Pedido **#${orderId.slice(0,8)}** ENTREGADO.`, components: [] } });
        return new Response(btnBody, { status: 200, headers: { 'Content-Type': 'application/json', 'Content-Length': new TextEncoder().encode(btnBody).length.toString() } });
      }
    }

    return new Response('{"success":true}', { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response('Error interno', { status: 500 });
  }
}