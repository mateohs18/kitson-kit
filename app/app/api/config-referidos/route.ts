import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { supabaseAdmin } from '../../../lib/supabase-admin';

// Configuración del programa de referidos (solo admin)
// GET  -> { recompensaReferidor, recompensaReferido, compraMinima }
// POST -> actualiza cualquiera de los tres valores

async function esAdmin(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  const adminEmail = process.env.ADMIN_EMAIL;
  return Boolean(session?.user?.email && adminEmail && session.user.email === adminEmail);
}

export async function GET() {
  if (!(await esAdmin())) return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });

  const { data } = await supabaseAdmin
    .from('site_config')
    .select('key, value')
    .in('key', ['ref_recompensa_referidor', 'ref_recompensa_referido', 'ref_compra_minima']);

  const cfg = Object.fromEntries((data || []).map((c) => [c.key, Number(c.value) || 0]));
  return NextResponse.json({
    recompensaReferidor: cfg.ref_recompensa_referidor ?? 0,
    recompensaReferido: cfg.ref_recompensa_referido ?? 0,
    compraMinima: cfg.ref_compra_minima ?? 0,
  });
}

export async function POST(req: Request) {
  if (!(await esAdmin())) return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });

  const { recompensaReferidor, recompensaReferido, compraMinima } = await req.json();
  const valores: [string, number][] = [
    ['ref_recompensa_referidor', Number(recompensaReferidor)],
    ['ref_recompensa_referido', Number(recompensaReferido)],
    ['ref_compra_minima', Number(compraMinima)],
  ];

  for (const [, v] of valores) {
    if (!Number.isFinite(v) || v < 0 || v > 1000) {
      return NextResponse.json({ error: 'Todos los valores deben ser números entre 0 y 1000.' }, { status: 400 });
    }
  }

  const filas = valores.map(([key, v]) => ({ key, value: String(v), updated_at: new Date().toISOString() }));
  const { error } = await supabaseAdmin.from('site_config').upsert(filas);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
