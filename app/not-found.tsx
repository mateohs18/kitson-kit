import Link from 'next/link';
import { Gamepad2 } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center px-6 text-center">
      <Gamepad2 size={64} className="text-orange-500 mb-6" />
      <h1 className="text-6xl font-black mb-4">404</h1>
      <p className="text-xl text-gray-400 mb-8 max-w-md">
        Esta página no existe o fue movida. Volvamos a la base.
      </p>
      <Link
        href="/"
        className="bg-orange-500 hover:bg-orange-400 text-black px-8 py-4 rounded-full font-black text-lg transition-all hover:scale-105"
      >
        Volver al Inicio
      </Link>
    </div>
  );
}
