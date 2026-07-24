import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-admin';
import { emailAmistadLista } from '../../../../lib/emails';

// ============================================================================
// GET /api/cron/amistades
//
// Busca clientes cuya solicitud de amistad se envió hace 48 horas o más y que
// todavía no fueron avisados, les manda el email de "¡tu regalo ya se puede
// enviar!" y los marca como notificados (nunca reciben el aviso dos veces).
//
// Protegido con CRON_SECRET: solo quien conozca el secreto puede dispararlo.
//
// CÓMO PROGRAMARLO (elegí una):
//   - cron-job.org (gratis): creá un job que llame cada hora a
//     https://kitson-kit.store/api/cron/amistades
//     con el header:  Authorization: Bearer TU_CRON_SECRET
//   - Vercel Cron (si migrás a Vercel): agregá en vercel.json
//     { "crons": [{ "path": "/api/cron/amistades", "schedule": "0 * * * *" }] }
//   - Railway: un servicio cron aparte que haga el curl.
//
// Variable de entorno nueva:  CRON_SECRET = un-secreto-largo-inventado
// ============================================================================

export async function GET(req: Request) {
  // Autenticación por secreto
  const auth = req.headers.get('authorization') || '';
  const secreto = process.env.CRON_SECRET;
  if (!secreto || auth !== `Bearer ${secreto}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const hace48hs = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    // Perfiles con amistad enviada hace >= 48hs y sin aviso todavía
    const { data: perfiles, error } = await supabaseAdmin
      .from('profiles')
      .select('email, name, friend_requested_at')
      .not('friend_requested_at', 'is', null)
      .lte('friend_requested_at', hace48hs)
      .is('friend_ready_notified_at', null)
      .limit(50); // como mucho 50 por corrida, para no agotar la cuota de Brevo

    if (error) {
      console.error('Cron amistades — error consultando perfiles:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let enviados = 0;
    const fallos: string[] = [];

    for (const perfil of perfiles || []) {
      const resultado = await emailAmistadLista({ email: perfil.email, nombre: perfil.name });

      if (resultado.ok) {
        // Marcamos ANTES de seguir, así aunque el cron se corte a mitad
        // nadie recibe el email dos veces.
        await supabaseAdmin
          .from('profiles')
          .update({ friend_ready_notified_at: new Date().toISOString() })
          .eq('email', perfil.email);
        enviados++;
      } else {
        fallos.push(`${perfil.email}: ${resultado.error}`);
      }
    }

    return NextResponse.json({
      success: true,
      revisados: perfiles?.length || 0,
      enviados,
      fallos,
    });
  } catch (e: any) {
    console.error('Cron amistades — error inesperado:', e);
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 });
  }
}
