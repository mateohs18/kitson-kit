// ============================================================================
// EMAILS TRANSACCIONALES — módulo central
//
// Antes, el email de "pedido entregado" dependía de un webhook configurado en
// el panel de Supabase que llamaba a /api/webhooks/entregas. Si la URL del
// deploy cambiaba, el secreto no coincidía o Brevo fallaba, el email
// simplemente no salía y nadie se enteraba.
//
// Ahora los emails se envían DIRECTO desde el código, en el momento exacto en
// que pasa cada evento, con el error logueado si algo falla.
//
// Variables de entorno necesarias (las mismas que ya tenías):
//   BREVO_API_KEY  -> tu clave de Brevo
//   EMAIL_USER     -> el remitente (tiene que estar VERIFICADO en Brevo)
// ============================================================================

const SITE_URL = 'https://kitson-kit.store';

interface ResultadoEmail {
  ok: boolean;
  error?: string;
}

// Genera una versión de texto plano a partir del HTML (mejora la
// entregabilidad: los filtros anti-spam desconfían de correos que SOLO
// traen HTML, sin ninguna alternativa de texto).
function htmlATexto(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h1|h2|h3|li|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&aacute;/g, 'á').replace(/&eacute;/g, 'é').replace(/&iacute;/g, 'í')
    .replace(/&oacute;/g, 'ó').replace(/&uacute;/g, 'ú').replace(/&ntilde;/g, 'ñ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ---------- Envío base ----------
export async function enviarEmail(destinatario: string, asunto: string, html: string): Promise<ResultadoEmail> {
  if (!process.env.BREVO_API_KEY) {
    console.error('📧 BREVO_API_KEY no está configurada — email no enviado:', asunto);
    return { ok: false, error: 'BREVO_API_KEY no configurada' };
  }
  if (!process.env.EMAIL_USER) {
    console.error('📧 EMAIL_USER no está configurada — email no enviado:', asunto);
    return { ok: false, error: 'EMAIL_USER no configurada' };
  }

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'Kitson Kit', email: process.env.EMAIL_USER },
        to: [{ email: destinatario }],
        subject: asunto,
        htmlContent: html,
        // Versión de texto plano junto al HTML: mejora la entregabilidad
        // (evita la señal "MIME_HTML_ONLY" de los filtros anti-spam).
        textContent: htmlATexto(html),
      }),
    });

    if (!res.ok) {
      const detalle = await res.text();
      console.error(`📧 Brevo rechazó el email "${asunto}" para ${destinatario}:`, res.status, detalle);
      return { ok: false, error: `Brevo ${res.status}: ${detalle}` };
    }

    return { ok: true };
  } catch (e: any) {
    console.error(`📧 Error de red enviando "${asunto}" a ${destinatario}:`, e);
    return { ok: false, error: e?.message || 'Error de red' };
  }
}

// ---------- Plantilla base (mismo estilo oscuro que ya usabas) ----------
function plantilla(titulo: string, cuerpoHtml: string, boton?: { texto: string; url: string }): string {
  const botonHtml = boton
    ? `<div style="text-align: center; margin: 35px 0;">
         <a href="${boton.url}" style="background-color: #E3A23D; color: #0A0806; padding: 14px 28px; text-decoration: none; font-weight: 900; border-radius: 8px; display: inline-block; border: 2px solid #0A0806;">${boton.texto}</a>
       </div>`
    : '';

  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #14110C; color: #F5F1E6; padding: 30px; border-radius: 12px; border: 3px solid #0A0806;">
      <h2 style="color: #E3A23D; text-align: center;">${titulo}</h2>
      ${cuerpoHtml}
      ${botonHtml}
      <p style="font-size: 13px; color: #9A9384; text-align: center; margin-top: 30px;">
        ¿Dudas? Escribinos por Discord o WhatsApp — te responde una persona, no un bot. ¡Gracias por elegir Kitson Kit!
      </p>
    </div>
  `;
}

// ---------- 1) Confirmación al crear el pedido ----------
export async function emailPedidoConfirmado(order: {
  id: string | number;
  user_email: string;
  user_name?: string | null;
  items?: any[];
  total_price?: number;
  paymentMethod?: string;
}): Promise<ResultadoEmail> {
  const lista = (order.items || [])
    .map((i: any) => `<li>${i.name} (x${i.quantity || 1})</li>`)
    .join('');
  const esperaTransferencia =
    order.paymentMethod === 'saldo'
      ? '<p>Tu pago con saldo ya quedó confirmado y estamos preparando la entrega. 🚀</p>'
      : '<p>Apenas verifiquemos tu comprobante de pago, procesamos la entrega. Te volvemos a escribir cuando esté lista.</p>';

  return enviarEmail(
    order.user_email,
    `🧾 Recibimos tu pedido #${order.id}`,
    plantilla(
      '¡Pedido recibido! 📦',
      `<p>Hola <strong>${order.user_name || 'Gamer'}</strong>,</p>
       <p>Registramos tu pedido <strong>#${order.id}</strong> con estos artículos:</p>
       <ul>${lista}</ul>
       <p><strong>Total: $${Number(order.total_price || 0).toFixed(2)} USD</strong></p>
       ${esperaTransferencia}`,
      { texto: 'VER MI PEDIDO', url: `${SITE_URL}/mis-pedidos` }
    )
  );
}

// ---------- 2) Pedido entregado (el que dejó de funcionar) ----------
export async function emailPedidoEntregado(order: {
  id: string | number;
  user_email: string;
  user_name?: string | null;
}): Promise<ResultadoEmail> {
  const reviewLink = `${SITE_URL}/mi-cuenta?reviewOrder=${order.id}`;

  return enviarEmail(
    order.user_email,
    `✅ Actualización de tu pedido #${order.id}: ¡Entrega completada!`,
    plantilla(
      '¡Misión Cumplida! 🎮',
      `<p>Hola <strong>${order.user_name || 'Gamer'}</strong>,</p>
       <p>Te contamos que tu pedido <strong>#${order.id}</strong> fue procesado y entregado con éxito. Los artículos ya están acreditados y listos para usar en tu cuenta.</p>
       <p>Si tenés alguna duda o necesitás ayuda, nuestro equipo de soporte está siempre disponible.</p>`,
      { texto: 'CALIFICAR MI COMPRA', url: reviewLink }
    )
  );
}

// ---------- 3) Recordatorio: pasaron las 48hs de amistad ----------
export async function emailAmistadLista(perfil: {
  email: string;
  nombre?: string | null;
}): Promise<ResultadoEmail> {
  return enviarEmail(
    perfil.email,
    '🎁 ¡Ya pasaron las 48 horas! Tu regalo está listo para enviarse',
    plantilla(
      '¡Se terminó la espera! ⏰',
      `<p>Hola <strong>${perfil.nombre || 'Gamer'}</strong>,</p>
       <p>Epic Games exige 48 horas de amistad antes de poder enviar regalos entre cuentas — y ese plazo <strong>ya se cumplió</strong>. 🎉</p>
       <p>Si tenías un pedido esperando, lo estamos procesando ahora. Y si querías comprar algo nuevo, ya no hay espera: tus próximos regalos llegan al toque.</p>`,
      { texto: 'IR A LA TIENDA', url: SITE_URL }
    )
  );
}

// ---------- 4) Disponible en la tienda (lista de deseos) ----------
export async function emailWishlistDisponible(datos: {
  email: string;
  nombre: string;
  imagen?: string | null;
  usd: number;
  pavos: number;
  link: string;
}): Promise<ResultadoEmail> {
  return enviarEmail(
    datos.email,
    `🔔 ¡${datos.nombre} volvió a la tienda de Fortnite!`,
    plantilla(
      '¡Volvió lo que estabas esperando! 🎉',
      `<p>Hola,</p>
       <p>El artículo que guardaste en tu lista de deseos está <strong>hoy</strong> en la tienda de Fortnite:</p>
       ${datos.imagen ? `<div style="text-align:center; margin: 20px 0;"><img src="${datos.imagen}" alt="${datos.nombre}" width="160" style="border-radius: 12px; border: 3px solid #0A0806;" /></div>` : ''}
       <p style="text-align:center;"><strong style="font-size: 18px;">${datos.nombre}</strong></p>
       <p style="text-align:center; font-size: 24px; margin: 8px 0;"><strong style="color:#E3A23D;">$${datos.usd.toFixed(2)} USD</strong> <span style="color:#9A9384; font-size: 14px;">(${datos.pavos.toLocaleString('en-US')} pavos)</span></p>
       <p>La tienda del juego rota todos los días, así que este artículo puede no estar disponible mañana.</p>`,
      { texto: 'VER EN LA TIENDA', url: datos.link }
    )
  );
}
