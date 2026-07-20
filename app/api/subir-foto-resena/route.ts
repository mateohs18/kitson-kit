import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { supabaseAdmin } from '../../../lib/supabase-admin';
import sharp from 'sharp';

const TIPOS_PERMITIDOS = ['image/png', 'image/jpeg', 'image/webp'];
const TAMANO_MAXIMO = 5 * 1024 * 1024; // 5 MB
const ANCHO_MAXIMO = 1400;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Debes iniciar sesión para subir una foto.' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'Falta el archivo.' }, { status: 400 });
  }
  if (!TIPOS_PERMITIDOS.includes(file.type)) {
    return NextResponse.json({ error: 'Formato no permitido. Subí una imagen (JPG, PNG o WEBP).' }, { status: 400 });
  }
  if (file.size > TAMANO_MAXIMO) {
    return NextResponse.json({ error: 'El archivo pesa demasiado (máximo 5 MB).' }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  let subirBuffer: Buffer;
  try {
    subirBuffer = await sharp(bytes)
      .rotate()
      .resize({ width: ANCHO_MAXIMO, withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
  } catch {
    return NextResponse.json({ error: 'No se pudo procesar la imagen. Probá con otro archivo.' }, { status: 400 });
  }

  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.jpg`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from('resenas')
    .upload(fileName, subirBuffer, { contentType: 'image/jpeg' });

  if (uploadError) {
    return NextResponse.json({ error: `No se pudo subir la foto: ${uploadError.message}` }, { status: 500 });
  }

  const { data: publicUrlData } = supabaseAdmin.storage.from('resenas').getPublicUrl(fileName);

  return NextResponse.json({ url: publicUrlData.publicUrl });
}
