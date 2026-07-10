import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { supabaseAdmin } from '../../../lib/supabase-admin';

const TIPOS_PERMITIDOS = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
const TAMANO_MAXIMO = 5 * 1024 * 1024; // 5 MB

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Debes iniciar sesión para subir un comprobante.' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'Falta el archivo del comprobante.' }, { status: 400 });
  }

  if (!TIPOS_PERMITIDOS.includes(file.type)) {
    return NextResponse.json({ error: 'Formato no permitido. Subí una imagen (JPG, PNG, WEBP) o un PDF.' }, { status: 400 });
  }

  if (file.size > TAMANO_MAXIMO) {
    return NextResponse.json({ error: 'El archivo pesa demasiado (máximo 5 MB).' }, { status: 400 });
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from('comprobantes')
    .upload(fileName, file);

  if (uploadError) {
    return NextResponse.json({ error: `No se pudo subir el comprobante: ${uploadError.message}` }, { status: 500 });
  }

  const { data: publicUrlData } = supabaseAdmin.storage.from('comprobantes').getPublicUrl(fileName);

  return NextResponse.json({ url: publicUrlData.publicUrl });
}
