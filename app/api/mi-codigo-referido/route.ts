import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { obtenerOCrearCodigo } from '../../../lib/referidos';
import { supabaseAdmin } from '../../../lib/supabase-admin';

// GET /api/mi-codigo-referido
// Devuelve (y crea si hace falta) el código de referido del usuario logueado,
// junto con las recompensas vigentes para mostrarlas en la tarjeta.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Inicia sesión.' }, { status: 401 });
  }

  const codigo = await obtenerOCrearCodigo(session.user.email);
  if (!codigo) {
    return NextResponse.json({ error: 'No se pudo generar tu código.' }, { status: 500 });
  }

  const { data: config } = await supabaseAdmin
    .from('site_config')
    .select('key, value')
    .in('key', ['ref_recompensa_referidor', 'ref_recompensa_referido', 'ref_compra_minima']);

  const cfg = Object.fromEntries((config || []).map((c) => [c.key, Number(c.value) || 0]));

  return NextResponse.json({
    codigo,
    link: `https://kitson-kit.store/?ref=${codigo}`,
    recompensaReferidor: cfg.ref_recompensa_referidor ?? 0,
    recompensaReferido: cfg.ref_recompensa_referido ?? 0,
    compraMinima: cfg.ref_compra_minima ?? 0,
  });
}
