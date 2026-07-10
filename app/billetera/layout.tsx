import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mi Billetera',
  description: 'Consultá tu saldo y recargá tu billetera de Kitson Kit.',
};

export default function BilleteraLayout({ children }: { children: React.ReactNode }) {
  return children;
}
