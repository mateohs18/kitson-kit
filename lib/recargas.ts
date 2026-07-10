import { supabaseAdmin } from './supabase-admin';

export async function aprobarRecarga(recargaId: string): Promise<{ ok: boolean; error?: string; email?: string; nuevoSaldo?: number }> {
  const { data: recarga, error: fetchError } = await supabaseAdmin
    .from('recargas')
    .select('*')
    .eq('id', recargaId)
    .single();

  if (fetchError || !recarga) {
    return { ok: false, error: 'No se encontró la solicitud de recarga.' };
  }

  if (recarga.status === 'APROBADA') {
    return { ok: false, error: 'Esta recarga ya fue aprobada antes.' };
  }

  const { data: perfil } = await supabaseAdmin
    .from('profiles')
    .select('balance')
    .eq('email', recarga.user_email)
    .single();

  const nuevoSaldo = Number(perfil?.balance || 0) + Number(recarga.amount);

  if (perfil) {
    await supabaseAdmin.from('profiles').update({ balance: nuevoSaldo }).eq('email', recarga.user_email);
  } else {
    await supabaseAdmin.from('profiles').insert([{ email: recarga.user_email, name: recarga.user_name, balance: nuevoSaldo }]);
  }

  await supabaseAdmin.from('recargas').update({ status: 'APROBADA' }).eq('id', recargaId);

  return { ok: true, email: recarga.user_email, nuevoSaldo };
}
