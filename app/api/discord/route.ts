import { verifyKey } from 'discord-interactions';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const signature = req.headers.get('x-signature-ed25519') || '';
    const timestamp = req.headers.get('x-signature-timestamp') || '';
    const bodyText = await req.text();
    const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY || '';

    // 1. Verificamos la firma (Seguridad)
    if (!verifyKey(bodyText, signature, timestamp, PUBLIC_KEY)) {
      return new Response('Firma inválida', { status: 401 });
    }

    const interaction = JSON.parse(bodyText);

    // 2. Respondemos el PING de Discord a la velocidad de la luz
    if (interaction.type === 1) {
      return new Response(JSON.stringify({ type: 1 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. (Aquí irá la lógica de tus botones y comandos luego)
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response('Error interno del servidor', { status: 500 });
  }
}