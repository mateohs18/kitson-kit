import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { supabaseAdmin } from '../../../lib/supabase-admin';
import { esEmailAdmin } from '../../../lib/admin';

// Links de soporte (botones flotantes de WhatsApp y Discord)
// GET público / POST solo admin. Vacío = el botón no se muestra.
let cache: { data: any; fetchedAt: number } | null = null;

export async function GET() {
  if (cache && Date.now() - cache.fetchedAt < 60_000) return NextResponse.json(cache.data);
  const { data } = await supabaseAdmin
    .from('site_config')
    .select('key, value')
    .in('key', ['soporte_whatsapp', 'soporte_discord']);
  const cfg = Object.fromEntries((data || []).map((c) => [c.key, c.value]));
  const resultado = { whatsapp: cfg.soporte_whatsapp || '', discord: cfg.soporte_discord || '' };
  cache = { data: resultado, fetchedAt: Date.now() };
  return NextResponse.json(resultado);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!esEmailAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
  }
  const { whatsapp, discord } = await req.json();
  const limpiar = (v: any) => (typeof v === 'string' ? v.trim().slice(0, 300) : '');
  const filas = [
    { key: 'soporte_whatsapp', value: limpiar(whatsapp), updated_at: new Date().toISOString() },
    { key: 'soporte_discord', value: limpiar(discord), updated_at: new Date().toISOString() },
  ];
  const { error } = await supabaseAdmin.from('site_config').upsert(filas);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  cache = null;
  return NextResponse.json({ success: true });
}
