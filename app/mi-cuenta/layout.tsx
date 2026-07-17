import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mi Cuenta',
  description: 'Tu billetera, tus pedidos y tu nivel de cliente en Kitson Kit.',
};

export default function MiCuentaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
