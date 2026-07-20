import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Preguntas Frecuentes',
  description: 'Todo lo que necesitás saber sobre cómo funciona Kitson Kit antes de comprar.',
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children;
}
