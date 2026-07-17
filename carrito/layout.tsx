import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mi Carrito',
  description: 'Revisá tu carrito y completá tu compra en Kitson Kit.',
};

export default function CarritoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
