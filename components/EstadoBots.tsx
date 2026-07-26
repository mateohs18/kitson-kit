'use client';

import { useEffect, useState } from 'react';

// ============================================================================
// INDICADOR DE STOCK DISPONIBLE
// Muestra el estado en vivo del sistema de entrega: cuántos V-Bucks quedan
// disponibles entre las cuentas conectadas y cuántas entregas restan hoy.
// Se auto-oculta por completo si el bot no responde — nunca le muestra un
// error al cliente, simplemente no aparece.
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

  const vbucksCompacto =
    estado.pavosDisponibles >= 1000
      ? `${(estado.pavosDisponibles / 1000).toFixed(1)}k`
      : estado.pavosDisponibles.toLocaleString('en-US');

  return (
    <span
      className="inline-flex items-center gap-2 bg-[#7BC77E]/10 border border-[#7BC77E]/30 rounded-lg pl-2.5 pr-3 py-1.5 text-[11px] font-bold text-[#7BC77E]"
      title="Se actualiza automáticamente cada minuto"
    >
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7BC77E] opacity-75"></span>
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#7BC77E]"></span>
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="https://fortnite-api.com/images/vbuck.png" alt="" className="w-3.5 h-3.5 shrink-0" loading="lazy" />
      <span>{vbucksCompacto} V-Bucks disponibles</span>
      <span className="text-[#7BC77E]/40">|</span>
      <span>{estado.regalosHoy} entrega{estado.regalosHoy === 1 ? '' : 's'} hoy</span>
    </span>
  );
}
