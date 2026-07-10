import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tienda Fortnite Diaria',
  description: 'Mirá la tienda de artículos de Fortnite disponible hoy y comprala automatizada, segura y sin riesgo de ban.',
};

export default function TiendaDiariaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
