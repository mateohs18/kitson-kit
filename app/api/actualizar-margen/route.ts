import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { supabaseAdmin } from '../../../lib/supabase-admin';
import { invalidarMargenCache } from '../../../lib/tienda-diaria';

// ============================================================================
// Margen de ganancia de la tienda diaria (solo admin)
//
// GET  -> devuelve el margen actual (en %)
// POST -> { margen: 20 } lo actualiza (20 = cobrás un 20% arriba del costo)
//
// Sigue el mismo patrón de autenticación que /api/actualizar-tasa-cambio.
// ============================================================================

async function esAdmin(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  const adminEmail = process.env.ADMIN_EMAIL;
  return Boolean(session?.user?.email && adminEmail && session.user.email === adminEmail);
}

export async function GET() {
  if (!(await esAdmin())) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from('site_config')
    .select('value, updated_at')
    .eq('key', 'margen_tienda')
    .single();

  if (error) {
    // Si la fila todavía no existe, el margen efectivo es 0
    return NextResponse.json({ margen: 0 });
  }

  return NextResponse.json({ margen: Number(data.value) || 0, updated_at: data.updated_at });
}

export async function POST(req: Request) {
  if (!(await esAdmin())) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
  }

  const { margen } = await req.json();
  const margenNum = Number(margen);

  if (!Number.isFinite(margenNum) || margenNum < 0 || margenNum > 500) {
    return NextResponse.json({ error: 'El margen debe ser un número entre 0 y 500 (%).' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('site_config')
    .upsert({ key: 'margen_tienda', value: String(margenNum), updated_at: new Date().toISOString() });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Que el nuevo margen se aplique al instante, sin esperar el caché de 60s
  invalidarMargenCache();

  return NextResponse.json({ success: true, margen: margenNum });
}
