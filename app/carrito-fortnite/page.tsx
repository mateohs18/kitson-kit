import { redirect } from 'next/navigation';

// El carrito de Fortnite se unificó con el carrito general — este link
// viejo (marcadores, historial) simplemente redirige ahí.
export default function CarritoFortniteRedirect() {
  redirect('/carrito');
}
