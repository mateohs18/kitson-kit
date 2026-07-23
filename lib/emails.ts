// ============================================================================
// EMAILS TRANSACCIONALES — módulo central
//
// Se envían DIRECTO desde el código en el momento exacto de cada evento
// (confirmación de pedido, entrega, recordatorio de 48hs, disponibilidad en
// wishlist), sin depender de webhooks externos. Cada función es una llamada
// simple: emailPedidoConfirmado(...), emailPedidoEntregado(...), etc.
//
// Envío vía Postmark (stream "outbound", transaccional puro — sin header de
// baja forzado ni tracking pixel, a diferencia de Brevo).
//
// Variables de entorno necesarias:
//   POSTMARK_SERVER_TOKEN  -> token del servidor en Postmark
//   EMAIL_USER             -> remitente, verificado como Sender Signature/
//                             dominio en Postmark
// ============================================================================

const SITE_URL = 'https://kitson-kit.store';
const LOGO_URL = `${SITE_URL}/logo.jpg`;

interface ResultadoEmail {
  ok: boolean;
  error?: string;
}

// Paleta de marca (misma que el sitio)
const COLOR = {
  fondo: '#F4F1EA',
  tarjeta: '#FFFFFF',
  oscuro: '#14110C',
  borde: '#0A0806',
  dorado: '#E3A23D',
  crema: '#F5F1E6',
  texto: '#2B2620',
  gris: '#7A7365',
  verde: '#4C9A56',
};

// ---------- Texto plano a partir del HTML (mejora entregabilidad) ----------
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

// ---------- Envío base (Postmark) ----------
export async function enviarEmail(destinatario: string, asunto: string, html: string): Promise<ResultadoEmail> {
  if (!process.env.POSTMARK_SERVER_TOKEN) {
    console.error('EMAIL: POSTMARK_SERVER_TOKEN no configurada, no se envio:', asunto);
    return { ok: false, error: 'POSTMARK_SERVER_TOKEN no configurada' };
  }
  if (!process.env.EMAIL_USER) {
    console.error('EMAIL: EMAIL_USER no configurada, no se envio:', asunto);
    return { ok: false, error: 'EMAIL_USER no configurada' };
  }

  try {
    const res = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'X-Postmark-Server-Token': process.env.POSTMARK_SERVER_TOKEN,
      },
      body: JSON.stringify({
        From: `Kitson Kit <${process.env.EMAIL_USER}>`,
        To: destinatario,
        Subject: asunto,
        HtmlBody: html,
        TextBody: htmlATexto(html),
        MessageStream: 'outbound',
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.ErrorCode) {
      console.error(`EMAIL: Postmark rechazo "${asunto}" para ${destinatario}:`, res.status, data);
      return { ok: false, error: `Postmark ${data.ErrorCode || res.status}: ${data.Message || 'error desconocido'}` };
    }

    return { ok: true };
  } catch (e: any) {
    console.error(`EMAIL: error de red enviando "${asunto}" a ${destinatario}:`, e);
    return { ok: false, error: e?.message || 'Error de red' };
  }
}

// ============================================================================
// PLANTILLA BASE
// Estructura de tabla (compatible con todos los clientes de correo, incluido
// Outlook de escritorio). Header con logo y marca sobre franja oscura,
// tarjeta blanca de contenido, footer con links.
// ============================================================================
function plantilla(opts: {
  preheader: string;
  titulo: string;
  cuerpoHtml: string;
  boton?: { texto: string; url: string };
  notaFooter?: string;
}): string {
  const { preheader, titulo, cuerpoHtml, boton, notaFooter } = opts;

  const botonHtml = boton
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 28px auto 8px;">
         <tr><td style="border-radius: 8px; background-color: ${COLOR.dorado};">
           <a href="${boton.url}" style="display: inline-block; padding: 14px 32px; font-family: Arial, sans-serif; font-size: 15px; font-weight: 700; color: ${COLOR.borde}; text-decoration: none;">${boton.texto}</a>
         </td></tr>
       </table>`
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${titulo}</title>
</head>
<body style="margin:0; padding:0; background-color:${COLOR.fondo};">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLOR.fondo}; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color:${COLOR.tarjeta}; border-radius: 14px; overflow: hidden; border: 1px solid #E4DFD3;">

          <tr>
            <td style="background-color:${COLOR.oscuro}; padding: 22px 28px;" align="center">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right: 10px;">
                    <img src="${LOGO_URL}" width="34" height="34" alt="Kitson Kit" style="border-radius: 50%; display:block; border: 2px solid ${COLOR.dorado};" />
                  </td>
                  <td>
                    <span style="font-family: Arial, sans-serif; font-size: 17px; font-weight: 800; color: ${COLOR.crema}; letter-spacing: 0.3px;">KITSON KIT</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 30px 32px 6px;">
              <h1 style="margin:0; font-family: Arial, sans-serif; font-size: 21px; font-weight: 800; color: ${COLOR.texto};">${titulo}</h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 6px 32px 4px; font-family: Arial, sans-serif; font-size: 14.5px; line-height: 1.65; color: ${COLOR.texto};">
              ${cuerpoHtml}
            </td>
          </tr>

          ${boton ? `<tr><td style="padding: 0 32px;" align="center">${botonHtml}</td></tr>` : ''}

          <tr><td style="padding: 24px 32px 0;"><div style="border-top: 1px solid #ECE7DA;"></div></td></tr>

          <tr>
            <td style="padding: 18px 32px 28px; font-family: Arial, sans-serif; font-size: 12.5px; line-height: 1.6; color: ${COLOR.gris};" align="center">
              ${notaFooter ? `<p style="margin: 0 0 10px;">${notaFooter}</p>` : ''}
              <p style="margin: 0 0 6px;">¿Necesitás ayuda? Escribinos por Discord o WhatsApp, te responde una persona real.</p>
              <p style="margin: 0;"><a href="${SITE_URL}" style="color: ${COLOR.gris}; text-decoration: underline;">kitson-kit.store</a></p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---------- Tabla de artículos (recibo) ----------
function tablaArticulos(items: { name: string; quantity?: number; price: number }[]): string {
  const filas = items
    .map(
      (i) => `
      <tr>
        <td style="padding: 9px 0; border-bottom: 1px solid #F0ECE0; font-size: 14px; color: ${COLOR.texto};">
          ${i.name}${(i.quantity || 1) > 1 ? ` <span style="color:${COLOR.gris};">x ${i.quantity}</span>` : ''}
        </td>
        <td style="padding: 9px 0; border-bottom: 1px solid #F0ECE0; font-size: 14px; color: ${COLOR.texto}; text-align: right; white-space: nowrap;">
          $${(i.price * (i.quantity || 1)).toFixed(2)}
        </td>
      </tr>`
    )
    .join('');

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 14px 0;">${filas}</table>`;
}

function formatearFecha(fecha: Date = new Date()): string {
  return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ============================================================================
// 1) Confirmación al crear el pedido
// ============================================================================
export async function emailPedidoConfirmado(order: {
  id: string | number;
  user_email: string;
  user_name?: string | null;
  items?: { name: string; quantity?: number; price: number }[];
  total_price?: number;
  paymentMethod?: string;
  couponCode?: string | null;
  discount?: number;
}): Promise<ResultadoEmail> {
  const items = order.items || [];
  const nombre = order.user_name || 'Gamer';
  const idCorto = String(order.id).slice(0, 8);

  const filaDescuento =
    order.discount && order.discount > 0
      ? `<tr><td style="padding: 6px 0; font-size: 13.5px; color: ${COLOR.verde};">Cupón ${order.couponCode || ''}</td>
           <td style="padding: 6px 0; font-size: 13.5px; color: ${COLOR.verde}; text-align: right;">-$${order.discount.toFixed(2)}</td></tr>`
      : '';

  const estadoPago =
    order.paymentMethod === 'saldo'
      ? `<p style="margin: 16px 0 0;">Tu pago con saldo Kitson ya fue confirmado. Estamos preparando la entrega y te avisamos apenas esté lista.</p>`
      : `<p style="margin: 16px 0 0;">Estamos revisando tu comprobante de pago. En cuanto quede verificado, procesamos la entrega y te escribimos de nuevo.</p>`;

  const cuerpo = `
    <p style="margin: 0 0 4px;">Hola ${nombre},</p>
    <p style="margin: 0 0 4px;">Recibimos tu pedido <strong>#${idCorto}</strong> el ${formatearFecha()}. Este es el detalle:</p>

    ${tablaArticulos(items)}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${filaDescuento}
      <tr>
        <td style="padding-top: 8px; border-top: 1px solid #E4DFD3; font-size: 15.5px; font-weight: 700; color: ${COLOR.texto};">Total</td>
        <td style="padding-top: 8px; border-top: 1px solid #E4DFD3; font-size: 15.5px; font-weight: 700; color: ${COLOR.texto}; text-align: right;">$${Number(order.total_price || 0).toFixed(2)} USD</td>
      </tr>
    </table>

    ${estadoPago}
  `;

  return enviarEmail(
    order.user_email,
    `Confirmación de tu pedido #${idCorto} — Kitson Kit`,
    plantilla({
      preheader: `Recibimos tu pedido #${idCorto} por $${Number(order.total_price || 0).toFixed(2)} USD.`,
      titulo: 'Recibimos tu pedido',
      cuerpoHtml: cuerpo,
      boton: { texto: 'Ver estado del pedido', url: `${SITE_URL}/pedido/${order.id}` },
      notaFooter: 'Te enviamos este correo porque realizaste una compra en Kitson Kit.',
    })
  );
}

// ============================================================================
// 2) Pedido entregado
// ============================================================================
export async function emailPedidoEntregado(order: {
  id: string | number;
  user_email: string;
  user_name?: string | null;
}): Promise<ResultadoEmail> {
  const nombre = order.user_name || 'Gamer';
  const idCorto = String(order.id).slice(0, 8);
  const reviewLink = `${SITE_URL}/mi-cuenta?reviewOrder=${order.id}`;

  const cuerpo = `
    <p style="margin: 0 0 4px;">Hola ${nombre},</p>
    <p style="margin: 0 0 4px;">Tu pedido <strong>#${idCorto}</strong> fue entregado con éxito. Los artículos ya están acreditados en tu cuenta de Fortnite, listos para usar.</p>
    <p style="margin: 16px 0 0;">Si te gustó tu compra, nos ayuda mucho que dejes una reseña, le sirve a otros jugadores a decidirse.</p>
  `;

  return enviarEmail(
    order.user_email,
    `Tu pedido #${idCorto} fue entregado — Kitson Kit`,
    plantilla({
      preheader: `Tu pedido #${idCorto} ya está en tu cuenta de Fortnite.`,
      titulo: 'Pedido entregado',
      cuerpoHtml: cuerpo,
      boton: { texto: 'Dejar una reseña', url: reviewLink },
      notaFooter: 'Te enviamos este correo porque tu pedido en Kitson Kit cambió de estado.',
    })
  );
}

// ============================================================================
// 3) Recordatorio: pasaron las 48hs de amistad
// ============================================================================
export async function emailAmistadLista(perfil: {
  email: string;
  nombre?: string | null;
}): Promise<ResultadoEmail> {
  const nombre = perfil.nombre || 'Gamer';

  const cuerpo = `
    <p style="margin: 0 0 4px;">Hola ${nombre},</p>
    <p style="margin: 0 0 4px;">Epic Games exige 48 horas de amistad antes de poder enviarte regalos dentro de Fortnite, y ese plazo ya se cumplió en tu cuenta.</p>
    <p style="margin: 16px 0 0;">Si tenías un pedido esperando, ya lo estamos procesando. Y si querés comprar algo nuevo, a partir de ahora la entrega es inmediata.</p>
  `;

  return enviarEmail(
    perfil.email,
    'Ya podés recibir regalos en Fortnite — Kitson Kit',
    plantilla({
      preheader: 'Se cumplieron las 48 horas de amistad que exige Epic Games.',
      titulo: 'Ya podés recibir tu regalo',
      cuerpoHtml: cuerpo,
      boton: { texto: 'Ir a la tienda', url: SITE_URL },
      notaFooter: 'Te enviamos este correo porque vinculaste tu cuenta de Epic Games en Kitson Kit.',
    })
  );
}

// ============================================================================
// 4) Disponible en la tienda (lista de deseos)
// ============================================================================
export async function emailWishlistDisponible(datos: {
  email: string;
  nombre: string;
  imagen?: string | null;
  usd: number;
  pavos: number;
  link: string;
}): Promise<ResultadoEmail> {
  const imagenHtml = datos.imagen
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 14px 0;">
         <tr>
           <td style="width: 56px; vertical-align: top; padding-right: 12px;">
             <img src="${datos.imagen}" width="48" height="48" alt="${datos.nombre}" style="border-radius: 8px; display: block; border: 1px solid #E4DFD3;" />
           </td>
           <td style="vertical-align: middle;">
             <p style="margin:0; font-size: 15px; font-weight: 700; color: ${COLOR.texto};">${datos.nombre}</p>
             <p style="margin: 3px 0 0; font-size: 13px; color: ${COLOR.gris};">${datos.pavos.toLocaleString('en-US')} pavos · $${datos.usd.toFixed(2)} USD</p>
           </td>
         </tr>
       </table>`
    : `<p style="margin: 14px 0;"><strong>${datos.nombre}</strong><br/><span style="color:${COLOR.gris}; font-size: 13px;">${datos.pavos.toLocaleString('en-US')} pavos · $${datos.usd.toFixed(2)} USD</span></p>`;

  const cuerpo = `
    <p style="margin: 0 0 4px;">Hola,</p>
    <p style="margin: 0 0 4px;">Un artículo de tu lista de deseos está disponible hoy en la tienda de Fortnite:</p>
    ${imagenHtml}
    <p style="margin: 16px 0 0;">La tienda del juego cambia todos los días, así que este artículo puede no estar mañana.</p>
  `;

  return enviarEmail(
    datos.email,
    `${datos.nombre} está disponible hoy — Kitson Kit`,
    plantilla({
      preheader: `${datos.nombre} apareció hoy en la tienda de Fortnite.`,
      titulo: 'Novedad en tu lista de deseos',
      cuerpoHtml: cuerpo,
      boton: { texto: 'Ver en la tienda', url: datos.link },
      notaFooter: 'Te enviamos este correo porque agregaste este artículo a tu lista de deseos en Kitson Kit. Podés administrarla desde tu cuenta.',
    })
  );
}
