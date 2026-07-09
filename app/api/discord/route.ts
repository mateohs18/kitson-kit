import { verifyKey } from 'discord-interactions';
import { supabase } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const signature = req.headers.get('x-signature-ed25519') || '';
    const timestamp = req.headers.get('x-signature-timestamp') || '';
    const bodyText = await req.text();
    
    // ⚠️ RECUERDA: Pega tu llave pública aquí entre las comillas
    const PUBLIC_KEY = "302550f20e4babb566e43cd3232eb15c1b86ac6a2752b790f2c0015bc8c8b2bd";

    const isValid = verifyKey(bodyText, signature, timestamp, PUBLIC_KEY);

    if (!isValid) {
      // Si Discord envía una firma falsa a propósito para probar tu seguridad,
      // debemos responder 401. Esto es OBLIGATORIO para pasar la validación.
      console.log("🛡️ Prueba de seguridad de Discord (Firma falsa detectada). Bloqueando...");
      return new Response('Firma invalida', { status: 401 });
    }

    const interaction = JSON.parse(bodyText);

    // 1. EL PING (El truco del Content-Length)
    if (interaction.type === 1) {
      console.log("✅ PING válido. Respondiendo PONG en paquete sólido...");
      const responseBody = JSON.stringify({ type: 1 });
      
      // Al enviar el Content-Length exacto, obligamos a Next.js a no usar "Chunked Encoding"
      return new Response(responseBody, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': responseBody.length.toString(),
        },
      });
    }

    // 2. COMANDOS (/recargar)
    if (interaction.type === 2 && interaction.data.name === 'recargar') {
      const correo = interaction.data.options.find((o: any) => o.name === 'correo').value;
      const monto = interaction.data.options.find((o: any) => o.name === 'monto').value;

      const { data: user } = await supabase.from('profiles').select('balance').eq('email', correo.trim()).single();

      if (!user) {
        const errorBody = JSON.stringify({ type: 4, data: { content: `❌ Correo no encontrado: ${correo}` } });
        return new Response(errorBody, { status: 200, headers: { 'Content-Type': 'application/json', 'Content-Length': errorBody.length.toString() } });
      }

      const nuevoSaldo = Number(user.balance || 0) + Number(monto);
      await supabase.from('profiles').update({ balance: nuevoSaldo }).eq('email', correo.trim());

      const successBody = JSON.stringify({
        type: 4,
        data: { content: `✅ **¡RECARGA EXITOSA!** 💰\nSe añadieron **$${Number(monto).toFixed(2)} USD** a **${correo}**.\nNuevo saldo: **$${nuevoSaldo.toFixed(2)} USD**.` }
      });
      return new Response(successBody, { status: 200, headers: { 'Content-Type': 'application/json', 'Content-Length': successBody.length.toString() } });
    }

    // 3. BOTONES DE ENTREGAR
    if (interaction.type === 3) {
      const customId = interaction.data.custom_id;
      if (customId.startsWith('entregar_')) {
        const orderId = customId.split('_')[1];
        await supabase.from('orders').update({ status: 'ENTREGADO' }).eq('id', orderId);

        const btnBody = JSON.stringify({ type: 7, data: { content: `✅ Pedido **#${orderId.slice(0,8)}** ENTREGADO.`, components: [] } });
        return new Response(btnBody, { status: 200, headers: { 'Content-Type': 'application/json', 'Content-Length': btnBody.length.toString() } });
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response('Error interno', { status: 500 });
  }
}