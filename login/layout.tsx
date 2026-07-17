import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Iniciar Sesión',
  description: 'Iniciá sesión en Kitson Kit para comprar, ver tu billetera y tus pedidos.',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
