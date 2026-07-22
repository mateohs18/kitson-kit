import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { supabaseAdmin } from '../../../lib/supabase-admin';

// Acreditación manual de saldo desde el panel de admin.
// (Esta ruta no existía — el botón "Recargar billetera" del admin llamaba a
// un endpoint inexistente. Ahora funciona y además registra el movimiento.)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!session?.user?.email || !adminEmail || session.user.email !== adminEmail) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
  }

  const { email, monto } = await req.json();
  const montoNum = Number(monto);
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'Email inválido.' }, { status: 400 });
  }
  if (!Number.isFinite(montoNum) || montoNum <= 0 || montoNum > 10000) {
    return NextResponse.json({ error: 'El monto debe ser mayor a 0 (máx 10.000).' }, { status: 400 });
  }

  const emailLimpio = email.trim();
  const { data: perfil } = await supabaseAdmin.from('profiles').select('balance').eq('email', emailLimpio).single();

  let nuevoSaldo: number;
  if (perfil) {
    nuevoSaldo = Number(perfil.balance || 0) + montoNum;
    const { error } = await supabaseAdmin.from('profiles').update({ balance: nuevoSaldo }).eq('email', emailLimpio);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    nuevoSaldo = montoNum;
    const { error } = await supabaseAdmin.from('profiles').insert([{ email: emailLimpio, balance: nuevoSaldo }]);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabaseAdmin.from('movimientos').insert([{ email: emailLimpio, concepto: 'Recarga acreditada por el equipo', monto: montoNum }]);

  return NextResponse.json({ success: true, nuevoSaldo });
}
