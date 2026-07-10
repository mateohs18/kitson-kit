import { verifyKey } from 'discord-interactions';
import { supabase } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  console.log("=== 🔍 NUEVA PETICIÓN DETECTADA ===");
  
  try {
    const signature = req.headers.get('x-signature-ed25519');
    const timestamp = req.headers.get('x-signature-timestamp');
    const bodyText = await req.text();
    
    if (!signature || !timestamp) {
      console.log("❌ Bloqueado: Faltan firmas en los headers.");
      return new Response('Unauthorized', { status: 401 });
    }

    // Tu llave pública exacta de "Kitson Admin"
    const PUBLIC_KEY = "72b7028f1a0e5e72731199ea8cd1523ee7dea08f64fc0ccd4c3b5df151ff389a";
    
    let isValid = false;
    try {
      isValid = verifyKey(bodyText, signature, timestamp, PUBLIC_KEY);
    } catch (e) {
      console.log("❌ Bloqueado: Error interno al leer la firma secreta.");
      return new Response('Unauthorized', { status: 401 });
    }

    if (!isValid) {
      console.log("🛡️ ATAQUE FALSO BLOQUEADO (Respondiendo 401 estricto)");
      return new Response('Unauthorized', { status: 401 });
    }

    const interaction = JSON.parse(bodyText);
    
    // 1. EL PING (Usando la API nativa de la web, sin Next.js de por medio)
    if (interaction.type === 1) {
      console.log("✅ PING VALIDADO (Respondiendo type: 1)");
      return Response.json({ type: 1 });
    }

    console.log("✅ COMANDO RECIBIDO:", interaction.data?.name);
    
    // 2. COMANDOS (/recargar)
    if (interaction.type === 2 && interaction.data.name === 'recargar') {
      const correo = interaction.data.options.find((o: any) => o.name === 'correo').value;
      const monto = interaction.data.options.find((o: any) => o.name === 'monto').value;
      const { data: user } = await supabase.from('profiles').select('balance').eq('email', correo.trim()).single();

      if (!user) {
        return Response.json({ type: 4, data: { content: `❌ Correo no encontrado: ${correo}` } });
      }

      const nuevoSaldo = Number(user.balance || 0) + Number(monto);
      await supabase.from('profiles').update({ balance: nuevoSaldo }).eq('email', correo.trim());

      return Response.json({
        type: 4,
        data: { content: `✅ **¡RECARGA EXITOSA!** 💰\nSe añadieron **$${Number(monto).toFixed(2)} USD** a **${correo}**.\nNuevo saldo: **$${nuevoSaldo.toFixed(2)} USD**.` }
      });
    }

    // 3. BOTONES DE ENTREGAR
    if (interaction.type === 3) {
      const customId = interaction.data.custom_id;
      if (customId.startsWith('entregar_')) {
        const orderId = customId.split('_')[1];
        await supabase.from('orders').update({ status: 'ENTREGADO' }).eq('id', orderId);
        return Response.json({ type: 7, data: { content: `✅ Pedido ENTREGADO.`, components: [] } });
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("❌ ERROR FATAL:", error);
    return new Response('Internal Server Error', { status: 500 });
  }
}