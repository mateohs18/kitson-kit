import { redirect } from 'next/navigation';

// Esta página se unificó dentro de /mi-cuenta. Dejamos este redirect
// para que ningún link viejo (marcadores, mensajes de Discord) se rompa.
export default function VincularCuentaRedirect() {
  redirect('/mi-cuenta');
}
