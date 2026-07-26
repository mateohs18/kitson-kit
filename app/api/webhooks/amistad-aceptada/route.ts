import { NextResponse } from 'next/server';
import { avisarPedidosPendientes } from '../../../../lib/entregas';

// ============================================================================
// POST /api/webhooks/amistad-aceptada
//
// El BOT llama a esto (no un humano) cada vez que se confirma una amistad
// nueva — sin importar si la mandó el bot o el cliente. Con esto:
//   1. Busca pedidos PENDIENTES de ese cliente que estaban esperando esta
//      amistad, y publica el aviso de "elegí con qué cuenta entregarlo"
//      para cada uno — nunca se manda nada solo, siempre a mano.
//   2. Avisa por Discord que la amistad quedó confirmada.
//
// Protegido con un secreto compartido — configurá la MISMA variable de
// entorno SITE_CALLBACK_SECRET en el sitio web y en el bot.
// ============================================================================

export async function POST(req: Request) {
  const secretoEsperado = process.env.SITE_CALLBACK_SECRET;
  const secretoRecibido = req.headers.get('x-callback-secret');

  if (!secretoEsperado || secretoRecibido !== secretoEsperado) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { epicName, botName } = await req.json().catch(() => ({}));
  if (!epicName || typeof epicName !== 'string') {
    return NextResponse.json({ error: 'Falta epicName' }, { status: 400 });
  }

  // Avisar (con botones de cuenta) los pedidos pendientes que esperaban esta amistad
  const resultado = await avisarPedidosPendientes(epicName).catch((e: unknown) => {
    console.error('Error avisando pedidos tras amistad confirmada:', e);
    return { avisados: 0 };
  });

  // Aviso adicional de que la amistad en sí quedó confirmada
  const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
  const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
  if (DISCORD_CHANNEL_ID && BOT_TOKEN) {
    const extra =
      resultado.avisados > 0
        ? `\n🎁 Había **${resultado.avisados}** pedido${resultado.avisados === 1 ? '' : 's'} esperando esta amistad — mirá el mensaje de arriba para elegir con qué cuenta entregarlo${resultado.avisados === 1 ? '' : 's'}.`
        : '';

    await fetch(`https://discord.com/api/v10/channels/${DISCORD_CHANNEL_ID}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bot ${BOT_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [
          {
            title: '🤝 Nueva amistad confirmada',
            description: `**${botName || 'Un bot'}** ahora es amigo de **${epicName}**.${extra}`,
            color: 5763719,
          },
        ],
      }),
    }).catch((e: unknown) => console.error('Error avisando a Discord:', e));
  }

  return NextResponse.json({ success: true, ...resultado });
}
