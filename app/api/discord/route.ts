import { NextResponse } from 'next/server';
import { verifyKey } from 'discord-interactions';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // 1. OBTENEMOS DATOS DE LA PETICIÓN
  const signature = req.headers.get('x-signature-ed25519');
  const timestamp = req.headers.get('x-signature-timestamp');
  const bodyText = await req.text();
  
  // 2. LOGUEAMOS TODO (Para ver qué está pasando exactamente)
  console.log("--- 🚀 PETICIÓN RECIBIDA ---");
  console.log("Headers:", req.headers);
  console.log("Cuerpo:", bodyText);

  // 3. LLAVE (Pégala aquí otra vez para asegurar)
  const PUBLIC_KEY = "72b7028f1a0e5e72731199ea8cd1523ee7dea08f64fc0ccd4c3b5df151ff389a";

  // 4. VERIFICACIÓN CRÍTICA
  if (!signature || !timestamp || !verifyKey(bodyText, signature, timestamp, PUBLIC_KEY)) {
    console.log("❌ FALLO DE VERIFICACIÓN: Discord envió algo que no pudimos validar.");
    return new NextResponse('Invalid request signature', { status: 401 });
  }

  const interaction = JSON.parse(bodyText);

  // 5. PING (Verificación de Discord)
  if (interaction.type === 1) {
    console.log("✅ PING AUTÉNTICO RECIBIDO. Respondiendo 200 OK.");
    // Devolvemos el JSON de la forma más estricta posible
    return NextResponse.json({ type: 1 }, { status: 200 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}