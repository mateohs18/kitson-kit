import { verifyKey } from 'discord-interactions';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  console.log("--- 🟢 NUEVA PETICIÓN DE DISCORD ---");
  
  try {
    const signature = req.headers.get('x-signature-ed25519') || '';
    const timestamp = req.headers.get('x-signature-timestamp') || '';
    const bodyText = await req.text();
    
    console.log("Cuerpo recibido:", bodyText);
    
    // Aquí puedes dejar la variable de entorno o pegar la llave dura como hicimos antes
    const PUBLIC_KEY = (process.env.DISCORD_PUBLIC_KEY || '').trim();
    
    const isValid = verifyKey(bodyText, signature, timestamp, PUBLIC_KEY);
    console.log("¿Firma verificada como válida?:", isValid);

    if (!isValid) {
      console.log("❌ Discord intentó conectar, pero la Llave Pública no coincide.");
      return new Response('Firma invalida', { status: 401 });
    }

    const interaction = JSON.parse(bodyText);
    console.log("Tipo de interacción recibida:", interaction.type);

    if (interaction.type === 1) {
      console.log("✅ ¡Es un PING de Discord! Respondiendo con type: 1...");
      return new Response(JSON.stringify({ type: 1 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error("❌ Error interno del servidor:", error);
    return new Response('Error', { status: 500 });
  }
}