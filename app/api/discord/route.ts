import { verifyKey } from 'discord-interactions';
import { supabase } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  console.log("=== 🟢 NUEVA PETICIÓN (VERSIÓN 10) ===");
  
  try {
    const signature = req.headers.get('x-signature-ed25519');
    const timestamp = req.headers.get('x-signature-timestamp');
    
    if (!signature || !timestamp) {
      console.log("❌ Discord detectado sin firmas. Bloqueando (401)...");
      return new Response('Faltan firmas', { status: 401 });
    }

    const bodyText = await req.text();
    const PUBLIC_KEY = "72b7028f1a0e5e72731199ea8cd1523ee7dea08f64fc0ccd4c3b5df151ff389a";

    const isValid = verifyKey(bodyText, signature, timestamp, PUBLIC_KEY);

    // 🛡️ AQUÍ ESTÁ LA MAGIA: Esto es lo que Discord quiere ver
    if (!isValid) {
      console.log("🛡️ ¡Ataque de Discord bloqueado con éxito! (Enviando 401)");
      return new Response('Firma invalida', { status: 401 });
    }

    const interaction = JSON.parse(bodyText);

    if (interaction.type === 1) {
      console.log("✅ PING Real Aprobado. Respondiendo 200 OK.");
      return new Response(JSON.stringify({ type: 1 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Lógica de Comandos
    if (interaction.type === 2 && interaction.data.name === 'recargar') {
      const correo = interaction.data.options.find((o: any) => o.name === 'correo').value;
      const monto = interaction.data.options.find((o: any) => o.name === 'monto').value;
      const { data: user } = await supabase.from('profiles').select('balance').eq('email', correo.trim()).single();
      
      if (!user) return new Response(JSON.stringify({ type: 4, data: { content: `❌ Correo no encontrado: ${correo}` } }), { status: 200, headers: { 'Content-Type': 'application/json' }});
      
      const nuevoSaldo = Number(user.balance || 0) + Number(monto);
      await supabase.from('profiles').update({ balance: nuevoSaldo }).eq('email', correo.trim());
      
      return new Response(JSON.stringify({ type: 4, data: { content: `✅ **¡RECARGA EXITOSA!** 💰\nNuevo saldo: **$${nuevoSaldo.toFixed(2)} USD**.` } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error("Error fatal:", error);
    return new Response('Error interno', { status: 500 });
  }
}