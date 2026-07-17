import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase-admin';

export async function GET() {
  const [{ data, error }, { count }] = await Promise.all([
    supabaseAdmin
      .from('orders')
      .select('id, user_name, items')
      .order('created_at', { ascending: false })
      .limit(1),
    supabaseAdmin
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .ilike('status', '%entregad%'),
  ]);

  const totalOrders = count || 0;

  if (error || !data || data.length === 0) {
    return NextResponse.json({ order: null, totalOrders });
  }

  const latest = data[0];
  const itemName = latest.items && latest.items.length > 0 ? latest.items[0].name : 'Recarga de Saldo';

  return NextResponse.json({
    order: {
      id: latest.id,
      name: latest.user_name || 'Gamer Anónimo',
      item: itemName,
    },
    totalOrders,
  });
}
