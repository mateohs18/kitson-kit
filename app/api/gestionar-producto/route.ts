import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { supabaseAdmin } from '../../../lib/supabase-admin';

async function verificarAdmin() {
  const session = await getServerSession(authOptions);
  const adminEmail = process.env.ADMIN_EMAIL;
  return !!session?.user?.email && !!adminEmail && session.user.email === adminEmail;
}

function parsePrecioPais(valor: any): number | null {
  if (valor === null || valor === undefined || valor === '') return null;
  const n = Number(valor);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function POST(req: Request) {
  if (!(await verificarAdmin())) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
  }

  const { name, price, compare_at_price, image_url, delivery_type, price_mx, price_co, price_pe } = await req.json();
  if (!name || price === undefined) {
    return NextResponse.json({ error: 'Falta el nombre o el precio.' }, { status: 400 });
  }
  const precioNum = Number(price);
  if (!Number.isFinite(precioNum) || precioNum < 0) {
    return NextResponse.json({ error: 'El precio no es válido.' }, { status: 400 });
  }
  let precioOriginal: number | null = null;
  if (compare_at_price !== null && compare_at_price !== undefined && compare_at_price !== '') {
    precioOriginal = Number(compare_at_price);
    if (!Number.isFinite(precioOriginal) || precioOriginal <= precioNum) {
      return NextResponse.json({ error: 'El precio original debe ser mayor al precio actual.' }, { status: 400 });
    }
  }
  const tipoEntrega = delivery_type === 'recarga' ? 'recarga' : 'regalo';

  const { data, error } = await supabaseAdmin
    .from('products')
    .insert([{
      name, price: precioNum, compare_at_price: precioOriginal, image_url: image_url || null, delivery_type: tipoEntrega,
      price_mx: parsePrecioPais(price_mx), price_co: parsePrecioPais(price_co), price_pe: parsePrecioPais(price_pe),
    }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, product: data });
}

export async function PUT(req: Request) {
  if (!(await verificarAdmin())) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
  }

  const { id, name, price, compare_at_price, image_url, delivery_type, price_mx, price_co, price_pe } = await req.json();
  if (!id) {
    return NextResponse.json({ error: 'Falta el ID del producto.' }, { status: 400 });
  }
  const precioNum = Number(price);
  if (!Number.isFinite(precioNum) || precioNum < 0) {
    return NextResponse.json({ error: 'El precio no es válido.' }, { status: 400 });
  }
  let precioOriginal: number | null = null;
  if (compare_at_price !== null && compare_at_price !== undefined && compare_at_price !== '') {
    precioOriginal = Number(compare_at_price);
    if (!Number.isFinite(precioOriginal) || precioOriginal <= precioNum) {
      return NextResponse.json({ error: 'El precio original debe ser mayor al precio actual.' }, { status: 400 });
    }
  }
  const tipoEntrega = delivery_type === 'recarga' ? 'recarga' : 'regalo';

  const { error } = await supabaseAdmin
    .from('products')
    .update({
      name, price: precioNum, compare_at_price: precioOriginal, image_url: image_url || null, delivery_type: tipoEntrega,
      price_mx: parsePrecioPais(price_mx), price_co: parsePrecioPais(price_co), price_pe: parsePrecioPais(price_pe),
    })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  if (!(await verificarAdmin())) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: 'Falta el ID del producto.' }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from('products').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
