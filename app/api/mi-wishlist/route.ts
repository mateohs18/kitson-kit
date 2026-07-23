import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { supabaseAdmin } from '../../../lib/supabase-admin';

// Lista de deseos del usuario logueado.
// GET -> lista | POST { id, name, image } -> agrega | DELETE { id } -> quita

async function emailDeSesion(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.email || null;
}

export async function GET() {
  const email = await emailDeSesion();
  if (!email) return NextResponse.json({ error: 'Inicia sesión.' }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from('wishlist')
    .select('cosmetic_id, cosmetic_name, cosmetic_image, created_at')
    .eq('email', email)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ wishlist: data || [] });
}

export async function POST(req: Request) {
  const email = await emailDeSesion();
  if (!email) return NextResponse.json({ error: 'Inicia sesión.' }, { status: 401 });

  const { id, name, image } = await req.json();
  if (!id || !name) return NextResponse.json({ error: 'Faltan datos del cosmético.' }, { status: 400 });

  // Tope de 20 deseos por persona
  const { count } = await supabaseAdmin
    .from('wishlist')
    .select('id', { count: 'exact', head: true })
    .eq('email', email);
  if ((count || 0) >= 20) {
    return NextResponse.json({ error: 'Tu lista está llena (máximo 20). Quitá alguno para agregar otro.' }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from('wishlist').upsert(
    {
      email,
      cosmetic_id: String(id).slice(0, 120),
      cosmetic_name: String(name).slice(0, 200),
      cosmetic_image: typeof image === 'string' ? image.slice(0, 400) : null,
    },
    { onConflict: 'email,cosmetic_id' }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const email = await emailDeSesion();
  if (!email) return NextResponse.json({ error: 'Inicia sesión.' }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Falta el ID.' }, { status: 400 });

  const { error } = await supabaseAdmin.from('wishlist').delete().eq('email', email).eq('cosmetic_id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
