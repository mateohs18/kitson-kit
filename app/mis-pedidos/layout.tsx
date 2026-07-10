import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mis Pedidos',
  description: 'Revisá el estado de tus pedidos en Kitson Kit.',
};

export default function MisPedidosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
