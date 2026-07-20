import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase-admin';

export async function GET() {
  const { data, error } = await supabaseAdmin.from('exchange_rates').select('country_code, rate');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rates: Record<string, number> = {};
  (data || []).forEach((r) => { rates[r.country_code] = Number(r.rate); });

  return NextResponse.json({ rates });
}
