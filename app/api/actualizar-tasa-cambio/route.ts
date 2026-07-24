import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { supabaseAdmin } from '../../../lib/supabase-admin';
import { esEmailAdmin } from '../../../lib/admin';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!esEmailAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
  }

  const { countryCode, rate } = await req.json();
  const codigosValidos = ['MX', 'CO', 'PE'];

  if (!codigosValidos.includes(countryCode)) {
    return NextResponse.json({ error: 'País no válido.' }, { status: 400 });
  }
  const rateNum = Number(rate);
  if (!Number.isFinite(rateNum) || rateNum <= 0) {
    return NextResponse.json({ error: 'La tasa no es válida.' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('exchange_rates')
    .upsert({ country_code: countryCode, rate: rateNum, updated_at: new Date().toISOString() });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
