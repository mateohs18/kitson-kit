import { supabaseAdmin } from './supabase-admin';
import { enviarEmail } from './emails';

// ============================================================================
// PROGRAMA DE REFERIDOS — lógica de servidor
// ============================================================================

// Genera un código corto tipo "KIT-A7X29B" y lo guarda si el perfil no tiene.
export async function obtenerOCrearCodigo(email: string): Promise<string | null> {
  const { data: perfil } = await supabaseAdmin
    .from('profiles')
    .select('referral_code')
    .eq('email', email)
    .single();

  if (!perfil) return null;
  if (perfil.referral_code) return perfil.referral_code;

  // Hasta 5 intentos por si el código random ya existe (colisión rarísima)
  for (let i = 0; i < 5; i++) {
    const codigo = 'KIT-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ referral_code: codigo })
      .eq('email', email)
      .is('referral_code', null); // no pisar si otro request lo creó primero
    if (!error) {
      const { data: check } = await supabaseAdmin
        .from('profiles').select('referral_code').eq('email', email).single();
      if (check?.referral_code) return check.referral_code;
    }
  }
  return null;
}

// Atribuye un referido en su PRIMERA compra (si el código es válido y no es él mismo).
export async function atribuirReferido(emailComprador: string, refCode: string): Promise<void> {
  try {
    const codigo = refCode.trim().toUpperCase();
    if (!codigo) return;

    // ¿El comprador ya tiene referidor o ya compró antes?
    const { data: perfil } = await supabaseAdmin
      .from('profiles')
      .select('email, referred_by, referral_code')
      .eq('email', emailComprador)
      .single();
    if (!perfil || perfil.referred_by) return;
    if (perfil.referral_code === codigo) return; // no se puede auto-referir

    const { count } = await supabaseAdmin
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('user_email', emailComprador);
    if ((count || 0) > 1) return; // solo cuenta en la primera compra (la actual ya está insertada)

    // ¿Existe alguien con ese código?
    const { data: referidor } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('referral_code', codigo)
      .single();
    if (!referidor || referidor.email === emailComprador) return;

    await supabaseAdmin
      .from('profiles')
      .update({ referred_by: codigo })
      .eq('email', emailComprador)
      .is('referred_by', null);
  } catch (e) {
    console.error('Error atribuyendo referido:', e);
  }
}

// Tras ENTREGAR un pedido: paga las recompensas si corresponde (atómico en Postgres).
export async function procesarReferidoTrasEntrega(emailComprador: string, totalPedido: number): Promise<void> {
  try {
    const { data, error } = await supabaseAdmin.rpc('acreditar_referido', {
      p_email_comprador: emailComprador,
      p_total_pedido: totalPedido,
    });
    if (error) {
      console.error('Error acreditando referido:', error);
      return;
    }
    if (!data) return; // no había nada que pagar

    console.log(`🎉 Referido acreditado: ${JSON.stringify(data)}`);

    // Avisar por email al que invitó (si falla, no pasa nada)
    if (data.referidor_email && Number(data.recompensa_referidor) > 0) {
      enviarEmail(
        data.referidor_email,
        '🎉 ¡Ganaste crédito por invitar a un amigo!',
        `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #14110C; color: #F5F1E6; padding: 30px; border-radius: 12px; border: 3px solid #0A0806;">
           <h2 style="color: #E3A23D; text-align: center;">¡Tu invitación dio frutos! 🌱</h2>
           <p>Una persona que invitaste hizo su primera compra, así que te acreditamos <strong style="color:#7BC77E;">$${Number(data.recompensa_referidor).toFixed(2)} USD</strong> en tu billetera Kitson.</p>
           <p>Seguí compartiendo tu link: cada amigo que compre suma más crédito.</p>
           <div style="text-align: center; margin: 35px 0;">
             <a href="https://kitson-kit.store/mi-cuenta" style="background-color: #E3A23D; color: #0A0806; padding: 14px 28px; text-decoration: none; font-weight: 900; border-radius: 8px; display: inline-block; border: 2px solid #0A0806;">VER MI SALDO</a>
           </div>
         </div>`
      ).catch(() => {});
    }
  } catch (e) {
    console.error('Error procesando referido tras entrega:', e);
  }
}
