import { NextResponse } from 'next/server';
import { reintentarPedidosPendientes } from '../../../../lib/entregas';

// ============================================================================
// POST /api/webhooks/amistad-aceptada
//
// El BOT llama a esto (no un humano) cada vez que se confirma una amistad
// nueva — sin importar si la mandó el bot o el cliente. Con esto:
//   1. Avisa por Discord.
//   2. Busca pedidos PENDIENTES de ese cliente y reintenta entregarlos
//      automáticamente, sin que nadie tenga que hacer nada a mano.
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

  // Reintentar pedidos pendientes de este cliente (si tenía alguno esperando)
  const resultado = await reintentarPedidosPendientes(epicName).catch((e) => {
    console.error('Error reintentando pedidos tras amistad confirmada:', e);
    return { intentados: 0, entregados: 0 };
  });

  // Aviso por Discord
  const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
  const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
  if (DISCORD_CHANNEL_ID && BOT_TOKEN) {
    const extra =
      resultado.entregados > 0
        ? `\n📦 Se entregaron automáticamente **${resultado.entregados}** pedido${resultado.entregados === 1 ? '' : 's'} que estaban esperando esta amistad.`
        : resultado.intentados > 0
          ? `\n⚠️ Había ${resultado.intentados} pedido(s) pendiente(s), pero el reintento de entrega falló — revisalo a mano.`
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
    }).catch((e) => console.error('Error avisando a Discord:', e));
  }

  return NextResponse.json({ success: true, ...resultado });
}
