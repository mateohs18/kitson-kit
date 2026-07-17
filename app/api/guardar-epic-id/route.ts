import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { supabaseAdmin } from '../../../lib/supabase-admin';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  const { epicId } = await req.json();
  if (typeof epicId !== 'string' || epicId.trim().length < 3 || /\s/.test(epicId.trim())) {
    return NextResponse.json({ error: 'El ID no es válido (sin espacios, mínimo 3 caracteres).' }, { status: 400 });
  }
  const email = session.user.email.trim();
  const nuevoEpicId = epicId.trim();

  const { data: perfilPrevio } = await supabaseAdmin
    .from('profiles')
    .select('epic_id, friend_requested_at')
    .eq('email', email)
    .single();

  const cambioDeId = perfilPrevio?.epic_id !== nuevoEpicId;

  const { error } = await supabaseAdmin
    .from('profiles')
    // Si cambia el ID, reseteamos el estado de amistad — hay que volver a mandar la solicitud a la cuenta nueva.
    .update(cambioDeId ? { epic_id: nuevoEpicId, friend_requested_at: null } : { epic_id: nuevoEpicId })
    .eq('email', email);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Si es un ID nuevo (o todavía no se le mandó la solicitud), avisamos por Discord
  // para que un humano le mande la solicitud de amistad real desde Epic Games.
  if (cambioDeId || !perfilPrevio?.friend_requested_at) {
    const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
    const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
    if (DISCORD_CHANNEL_ID && BOT_TOKEN) {
      const idsAdmin = (process.env.DISCORD_ADMIN_IDS || '').split(',').map((id) => id.trim()).filter(Boolean);
      const menciones = idsAdmin.map((id) => `<@${id}>`).join(' ');

      await fetch(`https://discord.com/api/v10/channels/${DISCORD_CHANNEL_ID}/messages`, {
        method: 'POST',
        headers: { 'Authorization': `Bot ${BOT_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: menciones || undefined,
          embeds: [{
            title: '🤝 Nueva solicitud de amistad pendiente',
            description: `Mandale la solicitud de amistad desde Epic Games a este usuario, y después apretá el botón para arrancar el contador de 48hs.`,
            color: 4886754,
            fields: [
              { name: '🎮 Epic Games ID', value: `\`${nuevoEpicId}\``, inline: true },
              { name: '📧 Cliente', value: `\`${email}\``, inline: true },
            ],
          }],
          components: [{
            type: 1,
            components: [{
              type: 2,
              style: 3,
              label: '✅ Ya le mandé la solicitud',
              custom_id: `amistad_cuenta_${email}`,
            }],
          }],
        }),
      });
    }
  }

  return NextResponse.json({ success: true });
}
