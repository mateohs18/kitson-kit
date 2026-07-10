import { NextResponse } from 'next/server';

export async function GET() {
  // 1. Tus credenciales
  const APP_ID = "1524878067846221984"; // Tu ID de Kitson Admin
  const BOT_TOKEN = "MTUyNDg3ODA2Nzg0NjIyMTk4NA.GjWml_.v97zGSrm7w9cQhwVqV2moioYzg3YzZSZro8QAc"; // ⚠️ ¡Pega el token de la pestaña Bot!

  // 2. Nuestro "Menú" de comandos
  const commands = [
    {
      name: 'recargar',
      description: 'Añade saldo a la cuenta de un cliente en la base de datos.',
      type: 1, // Significa "Comando de chat" (Slash Command)
      options: [
        {
          name: 'correo',
          description: 'Correo electrónico del cliente',
          type: 3, // Significa "Texto"
          required: true
        },
        {
          name: 'monto',
          description: 'Cantidad de USD a recargar (Ej: 15.50)',
          type: 10, // Significa "Número"
          required: true
        }
      ]
    }
  ];

  // 3. Enviamos el menú a Discord
  try {
    const response = await fetch(`https://discord.com/api/v10/applications/${APP_ID}/commands`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bot ${BOT_TOKEN}`
      },
      body: JSON.stringify(commands)
    });

    const data = await response.json();
    return NextResponse.json({ success: true, mensaje: "¡Comandos registrados con éxito!", data });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error interno conectando con Discord' });
  }
}