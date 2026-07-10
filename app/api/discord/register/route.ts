import { NextResponse } from 'next/server';

export async function GET() {
  const APP_ID = "1524878067846221984"; 
  const BOT_TOKEN = "MTUyNDg3ODA2Nzg0NjIyMTk4NA.GjWml_.v97zGSrm7w9cQhwVqV2moioYzg3YzZSZro8QAc"; // ⚠️ Pega tu token de la pestaña Bot

  const commands = [
    // 🔒 COMANDOS DE ADMINISTRADOR (Solo Owner / Admins)
    {
      name: 'recargar',
      description: '🔒 Añade saldo a la cuenta de un cliente.',
      type: 1,
      default_member_permissions: "8", // El "8" significa Administrador
      options: [
        { name: 'correo', description: 'Correo del cliente', type: 3, required: true },
        { name: 'monto', description: 'Cantidad a sumar', type: 10, required: true }
      ]
    },
    {
      name: 'descontar',
      description: '🔒 Resta saldo de la cuenta de un cliente.',
      type: 1,
      default_member_permissions: "8",
      options: [
        { name: 'correo', description: 'Correo del cliente', type: 3, required: true },
        { name: 'monto', description: 'Cantidad a restar', type: 10, required: true }
      ]
    },
    {
      name: 'registrar_usuario',
      description: '🔒 Crea un perfil nuevo en la base de datos con $0.',
      type: 1,
      default_member_permissions: "8",
      options: [
        { name: 'correo', description: 'Correo del nuevo cliente', type: 3, required: true }
      ]
    },

    // 🌍 COMANDOS PÚBLICOS (Cualquiera los puede usar)
    {
      name: 'consultar_saldo',
      description: '🌍 Revisa cuánto saldo tienes disponible.',
      type: 1,
      options: [
        { name: 'correo', description: 'Tu correo electrónico registrado', type: 3, required: true }
      ]
    },
    {
      name: 'estado_pedido',
      description: '🌍 Consulta si tu orden está Pendiente, Comprada o Entregada.',
      type: 1,
      options: [
        { name: 'orden_id', description: 'El ID de tu pedido', type: 3, required: true }
      ]
    }
  ];

  try {
    const response = await fetch(`https://discord.com/api/v10/applications/${APP_ID}/commands`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bot ${BOT_TOKEN}` },
      body: JSON.stringify(commands)
    });
    const data = await response.json();
    return NextResponse.json({ success: true, mensaje: "¡5 Comandos registrados!", data });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error interno conectando con Discord' });
  }
}