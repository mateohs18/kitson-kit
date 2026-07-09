import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // Supabase nos envía el registro viejo y el nuevo. 
    // Comprobamos que el nuevo estado sea "ENTREGADA" y que antes no lo fuera.
    if (payload.record?.status === 'ENTREGADA' && payload.old_record?.status !== 'ENTREGADA') {
      const order = payload.record;

      // Configuramos tu Gmail
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      // El link que lo llevará a su panel de pedidos para dejar la reseña
      const reviewLink = `https://kitson-kit.up.railway.app/mis-pedidos?reviewOrder=${order.id}`;

      const mailOptions = {
        from: `"Kitson Kit" <${process.env.EMAIL_USER}>`,
        to: order.user_email,
        subject: `🎉 ¡Tu pedido #${order.id} ha sido entregado!`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #050505; color: #ffffff; padding: 30px; border-radius: 12px; border: 1px solid #333;">
            <h2 style="color: #f97316; text-align: center;">¡Misión Cumplida! 🎮</h2>
            <p>Hola <strong>${order.user_name}</strong>,</p>
            <p>Nos emociona avisarte que tu pedido <strong>#${order.id}</strong> ha sido marcado como <strong>ENTREGADO</strong>. Tus artículos ya están listos en tu cuenta.</p>
            <div style="text-align: center; margin: 35px 0;">
              <a href="${reviewLink}" style="background-color: #f97316; color: #000; padding: 14px 28px; text-decoration: none; font-weight: 900; border-radius: 8px; display: inline-block;">CALIFICAR MI EXPERIENCIA</a>
            </div>
            <p style="font-size: 14px; color: #888; text-align: center;">Gana la medalla de leyenda dejando tu reseña verificada. ¡Gracias por confiar en Kitson Kit!</p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error enviando email:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}