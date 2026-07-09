import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // 👈 Esto obliga a Next.js a intentar de nuevo y no usar caché

export async function GET() {
  const APP_ID = process.env.DISCORD_APP_ID;
  const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

  const command = {
    name: 'recargar',
    description: 'Añade saldo a la billetera de un cliente en Kitson Kit',
    options: [
      { name: 'correo', description: 'El correo electrónico del cliente', type: 3, required: true },
      { name: 'monto', description: 'Cantidad en USD a recargar', type: 10, required: true }
    ]
  };

  const response = await fetch(`https://discord.com/api/v10/applications/${APP_ID}/commands`, {
    method: 'POST',
    headers: {
      'Authorization': `Bot ${BOT_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(command)
  });

  if (response.ok) {
    return NextResponse.json({ success: true, message: '¡Comando /recargar instalado en Discord!' });
  } else {
    const error = await response.text();
    return NextResponse.json({ success: false, error });
  }
}