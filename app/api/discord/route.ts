import { verifyKey } from 'discord-interactions';
import { supabase } from '../../../lib/supabase';

// Forzamos a Next.js a no usar caché
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const signature = req.headers.get('x-signature-ed25519');
    const timestamp = req.headers.get('x-signature-timestamp');
    
    if (!signature || !timestamp) {
      return new Response('Faltan firmas', { status: 401 });
    }

    const bodyText = await req.text();
    
    // 🔥 LA NUEVA LLAVE DE "Kitson Admin" EXTRAÍDA DE TU FOTO
    const PUBLIC_KEY = "72b7028f1a0e5e72731199ea8cd1523ee7dea08f64fc0ccd4c3b5df151ff389a";

    const isValid = verifyKey(bodyText, signature, timestamp, PUBLIC_KEY);

    if (!isValid) {
      return new Response('Firma invalida', { status: 401 });
    }

    const interaction = JSON.parse(bodyText);

    // 1. EL PING (Respuesta sólida y nativa)
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
        return new Response(JSON.stringify({ type: 4, data: { content: `❌ Correo no encontrado: ${correo}` } }), { status: 200, headers: { 'Content-Type': 'application/json' }});
      }

      const nuevoSaldo = Number(user.balance || 0) + Number(monto);
      await supabase.from('profiles').update({ balance: nuevoSaldo }).eq('email', correo.trim());

      return new Response(JSON.stringify({
        type: 4,
        data: { content: `✅ **¡RECARGA EXITOSA!** 💰\nSe añadieron **$${Number(monto).toFixed(2)} USD** a **${correo}**.\nNuevo saldo: **$${nuevoSaldo.toFixed(2)} USD**.` }
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
    return new Response('Error interno', { status: 500 });
  }
}