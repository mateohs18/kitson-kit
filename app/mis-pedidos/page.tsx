import { redirect } from 'next/navigation';

// Esta página se unificó con /billetera en el nuevo dashboard /mi-cuenta.
// Si venís del link "Calificar mi compra" de un email viejo, te llevamos
// igual al lugar correcto dentro del nuevo dashboard.
export default async function MisPedidosRedirect({
  searchParams,
}: {
  searchParams: Promise<{ reviewOrder?: string }>;
}) {
  const params = await searchParams;
  const suffix = params.reviewOrder ? `?reviewOrder=${params.reviewOrder}` : '';
  redirect(`/mi-cuenta${suffix}`);
}
