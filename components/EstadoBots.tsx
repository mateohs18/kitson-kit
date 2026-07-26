'use client';

import { useEffect, useState } from 'react';

// ============================================================================
// INDICADOR DE STOCK DISPONIBLE
// Muestra "🟢 Sistema operativo · X pavos disponibles · Y regalos hoy" en la
// home. Se auto-oculta por completo si el bot no responde — nunca le muestra
// un error al cliente, simplemente no aparece.
// ============================================================================

export default function EstadoBots() {
  const [estado, setEstado] = useState<{ operativo: boolean; pavosDisponibles: number; regalosHoy: number } | null>(null);

  useEffect(() => {
    let activo = true;
    const cargar = () => {
      fetch('/api/estado-bots')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (activo && d) setEstado(d); })
        .catch(() => {});
    };
    cargar();
    const t = setInterval(cargar, 60000);
    return () => { activo = false; clearInterval(t); };
  }, []);

  if (!estado || !estado.operativo) return null;

  return (
    <div className="mt-3 inline-flex items-center gap-2 bg-[#1D1913] border-2 border-[#0A0806] rounded-lg px-3 py-1.5 text-[11px] font-bold text-[#D9D4C7]">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7BC77E] opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#7BC77E]"></span>
      </span>
      <span className="text-[#7BC77E]">Sistema operativo</span>
      <span className="text-[#5A554A]">·</span>
      <span className="flex items-center gap-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="https://fortnite-api.com/images/vbuck.png" alt="" className="w-3.5 h-3.5" loading="lazy" />
        {estado.pavosDisponibles.toLocaleString('en-US')} disponibles
      </span>
      <span className="text-[#5A554A]">·</span>
      <span>{estado.regalosHoy} regalo{estado.regalosHoy === 1 ? '' : 's'} hoy</span>
    </div>
  );
}
