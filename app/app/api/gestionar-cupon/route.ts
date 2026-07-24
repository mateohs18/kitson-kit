import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { supabaseAdmin } from '../../../lib/supabase-admin';

// ============================================================================
// Gestión de cupones (solo admin) — mismo patrón que gestionar-producto
//
// GET    -> lista todos los cupones con sus usos
// POST   -> crea o actualiza: { code, tipo, valor, usos_maximos?, min_total?, expira_at?, activo? }
// DELETE -> { code } lo elimina
//
// Ejemplo para crear desde la consola del navegador con tu sesión de admin:
// fetch('/api/gestionar-cupon', { method:'POST', headers:{'Content-Type':'application/json'},
//   body: JSON.stringify({ code:'BIENVENIDO10', tipo:'porcentaje', valor:10, usos_maximos:100, min_total:5 })
// }).then(r=>r.json()).then(console.log)
// ============================================================================

async function esAdmin(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  const adminEmail = process.env.ADMIN_EMAIL;
  return Boolean(session?.user?.email && adminEmail && session.user.email === adminEmail);
}

export async function GET() {
  if (!(await esAdmin())) return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });

  const { data, error } = await supabaseAdmin
    .from('cupones')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ cupones: data });
}

export async function POST(req: Request) {
  if (!(await esAdmin())) return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });

  const { code, tipo, valor, usos_maximos, min_total, expira_at, activo } = await req.json();

  if (!code || typeof code !== 'string' || code.trim().length < 3) {
    return NextResponse.json({ error: 'El código debe tener al menos 3 caracteres.' }, { status: 400 });
  }
  if (tipo !== 'porcentaje' && tipo !== 'fijo') {
    return NextResponse.json({ error: "El tipo debe ser 'porcentaje' o 'fijo'." }, { status: 400 });
  }
  const valorNum = Number(valor);
  if (!Number.isFinite(valorNum) || valorNum <= 0 || (tipo === 'porcentaje' && valorNum > 100)) {
    return NextResponse.json({ error: 'Valor inválido (porcentaje: 1-100, fijo: mayor a 0).' }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from('cupones').upsert({
    code: code.trim().toUpperCase(),
    tipo,
    valor: valorNum,
    usos_maximos: usos_maximos != null ? Number(usos_maximos) : null,
    min_total: min_total != null ? Number(min_total) : 0,
    expira_at: expira_at || null,
    activo: activo !== false,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, code: code.trim().toUpperCase() });
}

export async function DELETE(req: Request) {
  if (!(await esAdmin())) return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });

  const { code } = await req.json();
  if (!code) return NextResponse.json({ error: 'Falta el código.' }, { status: 400 });

  const { error } = await supabaseAdmin.from('cupones').delete().eq('code', code.trim().toUpperCase());
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
