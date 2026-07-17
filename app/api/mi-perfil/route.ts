import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { supabaseAdmin } from '../../../lib/supabase-admin';

// Niveles de cliente según cuántos pedidos entregados tiene.
// (El 5% de descuento del nivel Plata todavía no está conectado al checkout —
// por ahora esto es solo informativo, para no prometer algo que no aplica aún.)
function calcularNivel(pedidosEntregados: number) {
  if (pedidosEntregados >= 10) return { nombre: 'Oro', siguiente: null, faltan: 0 };
  if (pedidosEntregados >= 5) return { nombre: 'Plata', siguiente: 'Oro', faltan: 10 - pedidosEntregados };
  return { nombre: 'Bronce', siguiente: 'Plata', faltan: 5 - pedidosEntregados };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  const email = session.user.email.trim();
  const name = session.user.name || 'Usuario';

  const [{ data: perfil }, { count: pedidosEntregados }] = await Promise.all([
    supabaseAdmin.from('profiles').select('balance, epic_id, friend_requested_at').eq('email', email).single(),
    supabaseAdmin.from('orders').select('id', { count: 'exact', head: true }).eq('user_email', email).ilike('status', '%entregad%'),
  ]);

  let balance = perfil?.balance;
  let epicId = perfil?.epic_id || '';
  let friendRequestedAt = perfil?.friend_requested_at || null;

  // Si todavía no existe el perfil, lo creamos con saldo 0 (mismo criterio que /api/mi-saldo).
  if (balance === undefined) {
    const { data: nuevo } = await supabaseAdmin.from('profiles').insert([{ email, name, balance: 0 }]).select('balance').single();
    balance = nuevo?.balance ?? 0;
  }

  const nivel = calcularNivel(pedidosEntregados || 0);

  return NextResponse.json({
    balance,
    epicId,
    friendRequestedAt,
    pedidosEntregados: pedidosEntregados || 0,
    nivel,
  });
}
