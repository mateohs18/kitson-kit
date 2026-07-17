import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

export const dynamic = 'force-dynamic'; // 👈 Esto obliga a Next.js a intentar de nuevo y no usar caché

export async function GET() {
  // Solo el admin logueado puede (re)configurar los comandos del bot.
  const session = await getServerSession(authOptions);
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!session?.user?.email || !adminEmail || session.user.email !== adminEmail) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
  }

  const APP_ID = process.env.DISCORD_APP_ID;
  const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

  // Todos los comandos que el bot ya sabe responder (en app/api/discord/route.ts),
  // pero que antes no estaban dados de alta en Discord.
  const commands = [
    {
      name: 'recargar',
      description: 'Añade saldo a la billetera de un cliente en Kitson Kit',
      options: [
        { name: 'correo', description: 'El correo electrónico del cliente', type: 3, required: true },
        { name: 'monto', description: 'Cantidad en USD a recargar', type: 10, required: true }
      ]
    },
    {
      name: 'descontar',
      description: 'Descuenta saldo de la billetera de un cliente',
      options: [
        { name: 'correo', description: 'El correo electrónico del cliente', type: 3, required: true },
        { name: 'monto', description: 'Cantidad en USD a descontar', type: 10, required: true }
      ]
    },
    {
      name: 'registrar_usuario',
      description: 'Crea manualmente una cuenta de cliente con saldo $0',
      options: [
        { name: 'correo', description: 'El correo electrónico del cliente', type: 3, required: true }
      ]
    },
    {
      name: 'consultar_saldo',
      description: 'Consulta el saldo disponible de un cliente',
      options: [
        { name: 'correo', description: 'El correo electrónico del cliente', type: 3, required: true }
      ]
    },
    {
      name: 'estado_pedido',
      description: 'Consulta el estado de un pedido por su ID',
      options: [
        { name: 'orden_id', description: 'El ID del pedido', type: 3, required: true }
      ]
    }
  ];

  // PUT reemplaza TODOS los comandos globales de una sola vez (en vez de agregarlos de a uno).
  const response = await fetch(`https://discord.com/api/v10/applications/${APP_ID}/commands`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bot ${BOT_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(commands)
  });

  if (response.ok) {
    return NextResponse.json({ success: true, message: `¡${commands.length} comandos instalados en Discord!`, commands: commands.map(c => c.name) });
  } else {
    const error = await response.text();
    return NextResponse.json({ success: false, error });
  }
}
