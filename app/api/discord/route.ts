import { NextResponse } from 'next/server';
import { verifyKey } from 'discord-interactions';

export async function POST(req: Request) {
  // Tu llave exacta
  const PUBLIC_KEY = "302550f20e4babb566e43cd3232eb15c1b86ac6a2752b790f2c0015bc8c8b2bd";
  
  try {
    const signature = req.headers.get('x-signature-ed25519') || '';
    const timestamp = req.headers.get('x-signature-timestamp') || '';
    const bodyText = await req.text();

    // Si Discord envía una firma falsa (test de seguridad), respondemos 401
    if (!verifyKey(bodyText, signature, timestamp, PUBLIC_KEY)) {
      return new NextResponse('Firma invalida', { status: 401 });
    }

    const interaction = JSON.parse(bodyText);

    // Si es un PING, respondemos con el formato estricto de Next.js
    if (interaction.type === 1) {
      return NextResponse.json({ type: 1 }, { status: 200 });
    }

    // Cualquier otra cosa, respondemos OK
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    return new NextResponse('Error', { status: 500 });
  }
}