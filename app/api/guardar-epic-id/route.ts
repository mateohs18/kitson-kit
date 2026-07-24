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

  // 🔍 LOG DE DIAGNÓSTICO — para ver exactamente por qué se toma cada decisión.
  console.log('[guardar-epic-id] email:', email, '| nuevoEpicId:', nuevoEpicId, '| epic_id previo:', perfilPrevio?.epic_id, '| friend_requested_at previo:', perfilPrevio?.friend_requested_at, '| cambioDeId:', cambioDeId);

  const { error } = await supabaseAdmin
    .from('profiles')
    .update(cambioDeId ? { epic_id: nuevoEpicId, friend_requested_at: null } : { epic_id: nuevoEpicId })
    .eq('email', email);

  if (error) {
    console.error('[guardar-epic-id] Error guardando en Supabase:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (cambioDeId || !perfilPrevio?.friend_requested_at) {
    console.log('[guardar-epic-id] Entrando al bloque de contactar al bot. BOT_DELIVERY_URL:', process.env.BOT_DELIVERY_URL ? 'configurada' : '❌ NO CONFIGURADA');

    let botOk = false;

    if (process.env.BOT_DELIVERY_URL) {
      try {
        console.log(`[guardar-epic-id] Llamando a ${process.env.BOT_DELIVERY_URL}/api/bot/agregar-amigo con epicName="${nuevoEpicId}"...`);
        const botRes = await fetch(`${process.env.BOT_DELIVERY_URL}/api/bot/agregar-amigo`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
            ...(process.env.BOT_DELIVERY_SECRET ? { 'x-bot-secret': process.env.BOT_DELIVERY_SECRET } : {}),
          },
          body: JSON.stringify({ epicName: nuevoEpicId }),
          signal: AbortSignal.timeout(15000),
        });
        botOk = botRes.ok;
        const detalle = await botRes.text().catch(() => '');
        console.log(`[guardar-epic-id] El bot respondió con status ${botRes.status} (ok=${botOk}):`, detalle);
      } catch (e) {
        console.warn('[guardar-epic-id] No se pudo contactar al bot (excepción):', e);
      }
    } else {
      console.warn('[guardar-epic-id] BOT_DELIVERY_URL está vacía — no se intenta contactar al bot.');
    }

    if (botOk) {
      console.log('[guardar-epic-id] ✅ Bot OK — arrancando contador de 48hs.');
      await supabaseAdmin
        .from('profiles')
        .update({ friend_requested_at: new Date().toISOString() })
        .eq('email', email);
    } else {
      console.log('[guardar-epic-id] ⚠️ Bot falló o no configurado — cayendo al aviso por Discord.');
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
              title: '⚠️ El bot no pudo mandar la solicitud — hacelo a mano',
              description: `El envío automático falló (bot caído o sin respuesta). Mandale la solicitud de amistad desde Epic Games a este usuario, y después apretá el botón para arrancar el contador de 48hs.`,
              color: 15158332,
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
      } else {
        console.warn('[guardar-epic-id] DISCORD_CHANNEL_ID o DISCORD_BOT_TOKEN faltantes — no se pudo avisar por Discord tampoco.');
      }
    }
  } else {
    console.log('[guardar-epic-id] Se saltea el bloque del bot: ni cambió el ID ni falta friend_requested_at.');
  }

  return NextResponse.json({ success: true });
}
