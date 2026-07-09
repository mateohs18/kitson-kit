import { NextResponse } from 'next/server';
import { verifyKey } from 'discord-interactions';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const signature = req.headers.get('x-signature-ed25519');
  const timestamp = req.headers.get('x-signature-timestamp');
  const bodyText = await req.text();

  // Tu llave pública (asegúrate de que sea la correcta de "Kitson Admin")
  const PUBLIC_KEY = "72b7028f1a0e5e72731199ea8cd1523ee7dea08f64fc0ccd4c3b5df151ff389a";

  const isValid = signature && timestamp && verifyKey(bodyText, signature, timestamp, PUBLIC_KEY);

  if (!isValid) {
    return new NextResponse('Invalid request', { status: 401 });
  }

  const interaction = JSON.parse(bodyText);

  // Respuesta de PING (vital para la validación)
  if (interaction.type === 1) {
    return NextResponse.json({ type: 1 });
  }

  // Respuesta de prueba (para verificar que tu servidor procesa comandos)
  return NextResponse.json({ 
    type: 4, 
    data: { content: "¡Bot configurado correctamente!" } 
  });
}