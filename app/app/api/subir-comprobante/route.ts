import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { supabaseAdmin } from '../../../lib/supabase-admin';
import sharp from 'sharp';
import { permitirPeticion, respuesta429 } from '../../../lib/rate-limit';

const TIPOS_PERMITIDOS = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
const TAMANO_MAXIMO = 5 * 1024 * 1024; // 5 MB (antes de comprimir)
const ANCHO_MAXIMO = 1600; // Un comprobante no necesita más resolución que esto para leerse bien

export async function POST(req: Request) {
  if (!permitirPeticion(req, 'subir-comprobante', 6)) return respuesta429();

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

  const bytes = Buffer.from(await file.arrayBuffer());
  const esPdf = file.type === 'application/pdf';

  let subirBuffer: Buffer = bytes;
  let extensionFinal = 'jpg';
  let contentType = 'image/jpeg';

  if (esPdf) {
    // Los PDF los dejamos tal cual, no se comprimen con sharp.
    extensionFinal = 'pdf';
    contentType = 'application/pdf';
  } else {
    // Redimensionamos (si es más ancho que 1600px) y comprimimos a JPEG de buena calidad.
    // Esto reduce mucho el peso de las fotos que suben desde el celular sin perder legibilidad.
    try {
      subirBuffer = await sharp(bytes)
        .rotate() // respeta la orientación EXIF de fotos tomadas con el celular
        .resize({ width: ANCHO_MAXIMO, withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();
    } catch {
      return NextResponse.json({ error: 'No se pudo procesar la imagen. Probá con otro archivo.' }, { status: 400 });
    }
  }

  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${extensionFinal}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from('comprobantes')
    .upload(fileName, subirBuffer, { contentType });

  if (uploadError) {
    return NextResponse.json({ error: `No se pudo subir el comprobante: ${uploadError.message}` }, { status: 500 });
  }

  const { data: publicUrlData } = supabaseAdmin.storage.from('comprobantes').getPublicUrl(fileName);

  return NextResponse.json({ url: publicUrlData.publicUrl });
}
