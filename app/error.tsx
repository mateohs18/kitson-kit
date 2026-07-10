"use client";

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center px-6 text-center">
      <AlertTriangle size={64} className="text-orange-500 mb-6" />
      <h1 className="text-3xl font-black mb-4">Algo salió mal</h1>
      <p className="text-gray-400 mb-8 max-w-md">
        Tuvimos un problema al cargar esta página. Podés intentar de nuevo, o volver más tarde.
      </p>
      <button
        onClick={() => reset()}
        className="bg-orange-500 hover:bg-orange-400 text-black px-8 py-4 rounded-full font-black text-lg transition-all hover:scale-105"
      >
        Intentar de nuevo
      </button>
    </div>
  );
}
