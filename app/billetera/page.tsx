import { redirect } from 'next/navigation';

// Esta página se unificó con /mis-pedidos en el nuevo dashboard /mi-cuenta.
// Dejamos este redirect para que ningún link viejo (menús, marcadores) se rompa.
export default function BilleteraRedirect() {
  redirect('/mi-cuenta');
}
