import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { supabaseAdmin } from '../../../lib/supabase-admin';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Debes iniciar sesión.' }, { status: 401 });
  }

  const { amount, receiptUrl } = await req.json();
  const monto = Number(amount);

  if (!Number.isFinite(monto) || monto <= 0) {
    return NextResponse.json({ error: 'Ingresá un monto válido.' }, { status: 400 });
  }
  if (!receiptUrl) {
    return NextResponse.json({ error: 'Falta el comprobante.' }, { status: 400 });
  }

  const { data: recarga, error } = await supabaseAdmin
    .from('recargas')
    .insert([{
      user_email: session.user.email.trim(),
      user_name: session.user.name || 'Usuario',
      amount: monto,
      receipt_url: receiptUrl,
      status: 'PENDIENTE',
    }])
    .select()
    .single();

  if (error || !recarga) {
    return NextResponse.json({ error: error?.message || 'No se pudo registrar la solicitud.' }, { status: 500 });
  }

  // Aviso a Discord, igual que con los pedidos, para que lo apruebes con un clic.
  const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
  const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

  if (DISCORD_CHANNEL_ID && BOT_TOKEN) {
    await fetch(`https://discord.com/api/v10/channels/${DISCORD_CHANNEL_ID}/messages`, {
      method: 'POST',
      headers: { 'Authorization': `Bot ${BOT_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: '💰 Nueva solicitud de recarga de saldo',
          description: `Un cliente pidió cargar saldo a su billetera.\n\n📄 **[Ver comprobante](${recarga.receipt_url})**`,
          color: 14924072,
          fields: [
            { name: '👤 Cliente', value: `\`${recarga.user_email}\``, inline: true },
            { name: '💵 Monto', value: `$${monto.toFixed(2)} USD`, inline: true },
            { name: '🆔 Solicitud', value: `\`${recarga.id}\``, inline: false },
          ],
        }],
        components: [{
          type: 1,
          components: [{
            type: 2,
            style: 3,
            label: '✅ Aprobar recarga',
            custom_id: `aprobar_recarga_${recarga.id}`,
          }],
        }],
      }),
    });
  }

  return NextResponse.json({ success: true });
}
