import { NextResponse } from 'next/server';
import { verifyKey } from 'discord-interactions';
import { supabase } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const signature = req.headers.get('x-signature-ed25519') || '';
    const timestamp = req.headers.get('x-signature-timestamp') || '';
    const bodyText = await req.text();
    
    // El .trim() destruye cualquier espacio en blanco invisible que se haya copiado por error
    const PUBLIC_KEY = (process.env.DISCORD_PUBLIC_KEY || '').trim();

    // 1. Verificación de Seguridad
    if (!verifyKey(bodyText, signature, timestamp, PUBLIC_KEY)) {
      console.error("Firma inválida - Discord rechazó la conexión.");
      return new NextResponse('Firma inválida', { status: 401 });
    }

    const interaction = JSON.parse(bodyText);

    // 2. PING (Lo que exige Discord para guardar la URL)
    if (interaction.type === 1) {
      console.log("¡Ping recibido y verificado con éxito!");
      return NextResponse.json({ type: 1 });
    }

    // 3. COMANDO DE RECARGA
    if (interaction.type === 2 && interaction.data.name === 'recargar') {
      const correo = interaction.data.options.find((o: any) => o.name === 'correo').value;
      const monto = interaction.data.options.find((o: any) => o.name === 'monto').value;

      const { data: user, error: fetchErr } = await supabase.from('profiles').select('balance').eq('email', correo.trim()).single();

      if (fetchErr || !user) {
        return NextResponse.json({
          type: 4,
          data: { content: `❌ No se encontró el correo: **${correo}**` }
        });
      }

      const nuevoSaldo = Number(user.balance || 0) + Number(monto);
      await supabase.from('profiles').update({ balance: nuevoSaldo }).eq('email', correo.trim());

      return NextResponse.json({
        type: 4,
        data: { content: `✅ **¡RECARGA EXITOSA!** 💰\nSe añadieron **$${Number(monto).toFixed(2)} USD** a **${correo}**.\nNuevo saldo: **$${nuevoSaldo.toFixed(2)} USD**.` }
      });
    }

    // 4. BOTONES DE ENTREGAR
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
    console.error("Error crítico en el servidor:", error);
    return new NextResponse('Error interno', { status: 500 });
  }
}