import { NextResponse } from 'next/server';
import { verifyKey } from 'discord-interactions';

// Evitamos que Next.js guarde respuestas en caché
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  console.log("=== 🚀 DISCORD ESTÁ TOCANDO LA PUERTA ===");
  
  try {
    const signature = req.headers.get('x-signature-ed25519');
    const timestamp = req.headers.get('x-signature-timestamp');
    
    // Si no trae las firmas, patada inmediata (401)
    if (!signature || !timestamp) {
      console.log("❌ Bloqueado: No trajo firmas");
      return new NextResponse('Faltan firmas', { status: 401 });
    }

    const bodyText = await req.text();
    // Tu llave exacta
    const PUBLIC_KEY = "302550f20e4babb566e43cd3232eb15c1b86ac6a2752b790f2c0015bc8c8b2bd";

    const isValid = verifyKey(bodyText, signature, timestamp, PUBLIC_KEY);

    // 🛡️ EL PASO MÁS IMPORTANTE PARA DISCORD
    if (!isValid) {
      console.log("🛡️ ¡ATAQUE DE PRUEBA DE DISCORD BLOQUEADO! (Respondiendo 401)");
      return new NextResponse('Firma invalida', { status: 401 });
    }

    const interaction = JSON.parse(bodyText);

    // ✅ EL PING DE VERIFICACIÓN
    if (interaction.type === 1) {
      console.log("✅ PING AUTÉNTICO RECIBIDO. Respondiendo 200 OK.");
      return NextResponse.json({ type: 1 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error fatal:", error);
    return new NextResponse('Error interno', { status: 500 });
  }
}