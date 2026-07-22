import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase-admin';

// ============================================================================
// POST /api/validar-cupon   { code, total }
//
// Validación de SOLO LECTURA para mostrar el descuento en el carrito antes de
// pagar. No consume usos: el consumo real y atómico pasa en el checkout con
// la función canjear_cupon. Así, escribir un código en el carrito y no
// comprar nunca gasta un uso.
// ============================================================================

export async function POST(req: Request) {
  try {
    const { code, total } = await req.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ valido: false, mensaje: 'Escribí un código de cupón.' });
    }
    const totalNum = Number(total);
    if (!Number.isFinite(totalNum) || totalNum <= 0) {
      return NextResponse.json({ valido: false, mensaje: 'Total inválido.' });
    }

    const { data: cupon } = await supabaseAdmin
      .from('cupones')
      .select('code, tipo, valor, usos_maximos, usos, min_total, activo, expira_at')
      .eq('code', code.trim().toUpperCase())
      .single();

    if (!cupon) return NextResponse.json({ valido: false, mensaje: 'Ese cupón no existe.' });
    if (!cupon.activo) return NextResponse.json({ valido: false, mensaje: 'Ese cupón ya no está activo.' });
    if (cupon.expira_at && new Date(cupon.expira_at) < new Date()) {
      return NextResponse.json({ valido: false, mensaje: 'Ese cupón ya venció.' });
    }
    if (cupon.usos_maximos !== null && cupon.usos >= cupon.usos_maximos) {
      return NextResponse.json({ valido: false, mensaje: 'Ese cupón ya alcanzó su límite de usos.' });
    }
    if (totalNum < Number(cupon.min_total)) {
      return NextResponse.json({
        valido: false,
        mensaje: `Ese cupón requiere una compra mínima de $${Number(cupon.min_total).toFixed(2)} USD.`,
      });
    }

    const descuento =
      cupon.tipo === 'porcentaje'
        ? Number((totalNum * (Number(cupon.valor) / 100)).toFixed(2))
        : Math.min(Number(cupon.valor), totalNum);

    return NextResponse.json({
      valido: true,
      code: cupon.code,
      descuento,
      mensaje:
        cupon.tipo === 'porcentaje'
          ? `¡Cupón aplicado! ${cupon.valor}% de descuento.`
          : `¡Cupón aplicado! $${Number(cupon.valor).toFixed(2)} USD de descuento.`,
    });
  } catch (error) {
    console.error('Error validando cupón:', error);
    return NextResponse.json({ valido: false, mensaje: 'Error validando el cupón.' }, { status: 500 });
  }
}
