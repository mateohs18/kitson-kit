import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // Solo Supabase debería poder llamar a este webhook. Verificamos un secreto
    // compartido que vos configurás tanto acá (WEBHOOK_SECRET) como en la
    // cabecera personalizada del webhook en el panel de Supabase.
    const secretoRecibido = req.headers.get('x-webhook-secret');
    if (!process.env.WEBHOOK_SECRET || secretoRecibido !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const payload = await req.json();
    
    const newStatus = payload.record?.status?.toUpperCase() || '';
    const oldStatus = payload.old_record?.status?.toUpperCase() || '';

    // Detecta el cambio hacia un estado entregado
    if (newStatus.includes('ENTREGAD') && !oldStatus.includes('ENTREGAD')) {
      const order = payload.record;
      // 👇 CAMBIO: Usamos el ID completo
      const fullId = order.id;

      const reviewLink = `https://kitson-kit.store/mi-cuenta?reviewOrder=${fullId}`;

      // Petición HTTP directa a Brevo (Pasa el firewall de Railway al instante)
      const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': process.env.BREVO_API_KEY!,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'Kitson Kit', email: process.env.EMAIL_USER }, // Tu correo configurado en Railway
          to: [{ email: order.user_email }],
          subject: `✅ Actualización de tu pedido #${fullId}: ¡Entrega completada!`, // Arreglado
          htmlContent: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #14110C; color: #F5F1E6; padding: 30px; border-radius: 12px; border: 3px solid #0A0806;">
              <h2 style="color: #E3A23D; text-align: center;">¡Misión Cumplida! 🎮</h2>
              <p>Hola <strong>${order.user_name}</strong>,</p>
              <p>Te contamos que tu pedido <strong>#${fullId}</strong> fue procesado y entregado con éxito. Los artículos ya están acreditados y listos para usar en tu cuenta.</p>
              <p>Si tenés alguna duda o necesitás ayuda, nuestro equipo de soporte está siempre disponible.</p>
              <div style="text-align: center; margin: 35px 0;">
                <a href="${reviewLink}" style="background-color: #E3A23D; color: #0A0806; padding: 14px 28px; text-decoration: none; font-weight: 900; border-radius: 8px; display: inline-block; border: 2px solid #0A0806;">CALIFICAR MI COMPRA</a>
              </div>
              <p style="font-size: 14px; color: #9A9384; text-align: center;">Tu opinión es clave para mantener nuestros estándares de calidad. Dejá una reseña y obtené tu insignia de comprador verificado. ¡Gracias por elegir Kitson Kit!</p>
            </div>
          `
        })
      });

      if (!brevoResponse.ok) {
        const errorText = await brevoResponse.text();
        console.error("Error devuelto por la API de Brevo:", errorText);
        throw new Error(`Brevo respondió con estado ${brevoResponse.status}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error en el proceso de envío:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}