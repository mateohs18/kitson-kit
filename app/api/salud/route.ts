import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { supabaseAdmin } from '../../../lib/supabase-admin';

// ============================================================================
// GET /api/salud  (solo admin)
//
// Chequeo integral del sitio en un solo vistazo. Abrilo después de cada
// deploy y te dice al instante si falta una variable de entorno o una tabla
// de Supabase — exactamente el tipo de problema que causó el 404 de la
// wishlist y los emails que no salían.
//
// Uso: con tu sesión de admin abierta, entrá a kitson-kit.store/api/salud
// ============================================================================

export async function GET() {
  const session = await getServerSession(authOptions);
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!session?.user?.email || !adminEmail || session.user.email !== adminEmail) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
  }

  // ---- 1) Variables de entorno ----
  const variablesRequeridas = [
    'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY',
    'NEXTAUTH_SECRET', 'ADMIN_EMAIL',
    'BREVO_API_KEY', 'EMAIL_USER',
    'DISCORD_BOT_TOKEN', 'DISCORD_CHANNEL_ID',
    'CRON_SECRET',
  ];
  const variablesOpcionales = [
    'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET',
    'DISCORD_CLIENT_ID', 'DISCORD_CLIENT_SECRET', 'DISCORD_PUBLIC_KEY', 'DISCORD_ADMIN_IDS',
    'DISCORD_TIENDA_CHANNEL_ID',
    'BOT_DELIVERY_URL', 'BOT_DELIVERY_SECRET',
  ];

  const variables: Record<string, string> = {};
  for (const v of variablesRequeridas) variables[v] = process.env[v] ? '✅' : '❌ FALTA (requerida)';
  for (const v of variablesOpcionales) variables[v] = process.env[v] ? '✅' : '⚠️ vacía (opcional)';

  // ---- 2) Tablas y funciones de Supabase ----
  async function tablaExiste(nombre: string): Promise<string> {
    const { error } = await supabaseAdmin.from(nombre).select('*', { count: 'exact', head: true }).limit(1);
    if (!error) return '✅';
    return `❌ ${error.message.includes('does not exist') || error.code === '42P01' ? 'la tabla no existe — corré su SQL en Supabase' : error.message}`;
  }

  const tablas: Record<string, string> = {};
  const listaTablas = [
    ['profiles', 'base del sitio'],
    ['orders', 'base del sitio'],
    ['reviews', 'base del sitio'],
    ['site_config', 'site_config.sql'],
    ['feed_compras', 'feed_compras.sql'],
    ['cupones', 'cupones.sql'],
    ['movimientos', 'mejoras.sql'],
    ['wishlist', 'wishlist.sql'],
  ] as const;
  for (const [nombre, origen] of listaTablas) {
    tablas[`${nombre} (${origen})`] = await tablaExiste(nombre);
  }

  // Funciones críticas de saldo
  let funcionSaldo = '✅';
  try {
    const { error } = await supabaseAdmin.rpc('descontar_saldo', { p_email: '__chequeo__@salud.test', p_monto: 1 });
    // Esperamos PERFIL_NO_ENCONTRADO (la función existe); "does not exist" = falta el SQL
    if (error && (error.message.includes('does not exist') || error.code === 'PGRST202')) {
      funcionSaldo = '❌ falta correr descontar_saldo.sql';
    }
  } catch {
    funcionSaldo = '⚠️ no se pudo verificar';
  }

  const todoOk =
    Object.values(variables).every((v) => !v.startsWith('❌')) &&
    Object.values(tablas).every((v) => v === '✅') &&
    funcionSaldo === '✅';

  return NextResponse.json({
    estado: todoOk ? '✅ TODO EN ORDEN' : '⚠️ HAY PENDIENTES — revisá los ❌ de abajo',
    fecha: new Date().toISOString(),
    variables_de_entorno: variables,
    tablas_de_supabase: tablas,
    funcion_descontar_saldo: funcionSaldo,
    nota: 'Los ⚠️ opcionales solo importan si usás esa función (ej: login con Google, bot de entregas, tienda en Discord).',
  });
}
