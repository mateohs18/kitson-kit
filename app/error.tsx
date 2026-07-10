"use client";

import { useEffect } from 'react';
import Image from 'next/image';

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
    <div className="min-h-screen bg-[#14110C] text-[#F5F1E6] font-body flex flex-col items-center justify-center px-6 text-center">
      <div className="w-24 h-24 rounded-full border-[3px] border-[#0A0806] bg-[#E3A23D] mb-6 overflow-hidden flex items-center justify-center relative">
        <div className="absolute inset-0 kk-dots opacity-15"></div>
        <Image src="/logo.jpg" alt="Mascota Kitson Kit" width={90} height={90} className="w-4/5 h-4/5 object-contain rounded-full relative z-[1]" />
      </div>
      <h1 className="font-display text-3xl font-bold mb-4">Algo salió mal</h1>
      <p className="text-[#9A9384] mb-8 max-w-md">
        Tuvimos un problema al cargar esta página. Podés intentar de nuevo, o volver más tarde.
      </p>
      <button
        onClick={() => reset()}
        className="bg-[#E3A23D] hover:bg-[#f0b458] text-[#0A0806] px-8 py-4 rounded-xl font-display font-bold text-lg border-[3px] border-[#0A0806] transition-transform hover:-translate-y-0.5"
      >
        Intentar de nuevo
      </button>
    </div>
  );
}
