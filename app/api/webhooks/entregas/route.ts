import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    
    const newStatus = payload.record?.status?.toUpperCase() || '';
    const oldStatus = payload.old_record?.status?.toUpperCase() || '';

    // Detecta el cambio hacia un estado entregado
    if (newStatus.includes('ENTREGAD') && !oldStatus.includes('ENTREGAD')) {
      const order = payload.record;
      // 👇 CAMBIO: Usamos el ID completo
      const fullId = order.id;

      const reviewLink = `https://kitson-kit.store/mis-pedidos?reviewOrder=${fullId}`;

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
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #050505; color: #ffffff; padding: 30px; border-radius: 12px; border: 1px solid #333;">
              <h2 style="color: #f97316; text-align: center;">¡Misión Cumplida! 🎮</h2>
              <p>Hola <strong>${order.user_name}</strong>,</p>
              <p>Nos complace informarte que tu pedido <strong>#${fullId}</strong> ha sido procesado y entregado con éxito. Los artículos ya se encuentran acreditados y listos para usar en tu cuenta.</p>
              <p>Si tienes alguna duda o requieres asistencia, nuestro equipo de soporte está siempre disponible para ayudarte.</p>
              <div style="text-align: center; margin: 35px 0;">
                <a href="${reviewLink}" style="background-color: #f97316; color: #000; padding: 14px 28px; text-decoration: none; font-weight: 900; border-radius: 8px; display: inline-block;">CALIFICAR MI COMPRA</a>
              </div>
              <p style="font-size: 14px; color: #888; text-align: center;">Tu opinión es clave para mantener nuestros estándares de calidad. Deja una reseña y obtén tu insignia de comprador verificado. ¡Gracias por elegir la seguridad y rapidez de Kitson Kit!</p>
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