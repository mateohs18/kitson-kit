import { supabaseAdmin } from './supabase-admin';

export async function marcarAmistadCuenta(email: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ friend_requested_at: new Date().toISOString() })
    .eq('email', email.trim());

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
