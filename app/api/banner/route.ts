import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { supabaseAdmin } from '../../../lib/supabase-admin';

// ============================================================================
// BARRA DE ANUNCIOS
// GET  (público)  -> { texto, link }  — si texto está vacío, la barra no se muestra
// POST (admin)    -> { texto, link }  — actualiza el anuncio al instante
// ============================================================================

let cache: { data: { texto: string; link: string }; fetchedAt: number } | null = null;
const CACHE_MS = 60 * 1000;

export async function GET() {
  if (cache && Date.now() - cache.fetchedAt < CACHE_MS) {
    return NextResponse.json(cache.data);
  }
  const { data } = await supabaseAdmin
    .from('site_config')
    .select('key, value')
    .in('key', ['banner_texto', 'banner_link']);

  const cfg = Object.fromEntries((data || []).map((c) => [c.key, c.value]));
  const resultado = { texto: cfg.banner_texto || '', link: cfg.banner_link || '' };
  cache = { data: resultado, fetchedAt: Date.now() };
  return NextResponse.json(resultado);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!session?.user?.email || !adminEmail || session.user.email !== adminEmail) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
  }

  const { texto, link } = await req.json();
  if (typeof texto !== 'string' || texto.length > 140) {
    return NextResponse.json({ error: 'El texto debe tener hasta 140 caracteres (vacío para ocultar la barra).' }, { status: 400 });
  }

  const filas = [
    { key: 'banner_texto', value: texto.trim(), updated_at: new Date().toISOString() },
    { key: 'banner_link', value: (typeof link === 'string' ? link.trim() : '').slice(0, 300), updated_at: new Date().toISOString() },
  ];
  const { error } = await supabaseAdmin.from('site_config').upsert(filas);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  cache = null; // que se vea al instante
  return NextResponse.json({ success: true });
}
