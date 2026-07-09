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
    const PUBLIC_KEY = "72b7028f1a0e5e72731199ea8cd1523ee7dea08f64fc0ccd4c3b5df151ff389a";

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