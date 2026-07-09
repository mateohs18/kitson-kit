import { NextResponse } from 'next/server';
import { verifyKey } from 'discord-interactions';
import { supabase } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const signature = req.headers.get('x-signature-ed25519');
    const timestamp = req.headers.get('x-signature-timestamp');
    
    if (!signature || !timestamp) {
      return new NextResponse('Faltan firmas', { status: 401 });
    }

    const bodyText = await req.text();
    
    // Tu llave exacta de Kitson Admin
    const PUBLIC_KEY = "72b7028f1a0e5e72731199ea8cd1523ee7dea08f64fc0ccd4c3b5df151ff389a";

    const isValid = verifyKey(bodyText, signature, timestamp, PUBLIC_KEY);

    if (!isValid) {
      return new NextResponse('Firma invalida', { status: 401 });
    }

    const interaction = JSON.parse(bodyText);

    // 1. EL PING: NextResponse.json asegura las cabeceras exactas y elimina el "chunked encoding"
    if (interaction.type === 1) {
      return NextResponse.json({ type: 1 });
    }

    // 2. COMANDOS (/recargar)
    if (interaction.type === 2 && interaction.data.name === 'recargar') {
      const correo = interaction.data.options.find((o: any) => o.name === 'correo').value;
      const monto = interaction.data.options.find((o: any) => o.name === 'monto').value;

      const { data: user } = await supabase.from('profiles').select('balance').eq('email', correo.trim()).single();

      if (!user) {
        return NextResponse.json({ type: 4, data: { content: `❌ Correo no encontrado: ${correo}` } });
      }

      const nuevoSaldo = Number(user.balance || 0) + Number(monto);
      await supabase.from('profiles').update({ balance: nuevoSaldo }).eq('email', correo.trim());

      return NextResponse.json({
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

        return NextResponse.json({
          type: 7, 
          data: { content: `✅ Pedido **#${orderId.slice(0,8)}** ENTREGADO.`, components: [] }
        });
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    return new NextResponse('Error interno', { status: 500 });
  }
}