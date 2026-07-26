'use client';

import { useEffect, useState } from 'react';
import { Copy, Check, Gamepad2 } from 'lucide-react';

// ============================================================================
// CUENTAS DE FORTNITE PARA AGREGAR
// Muestra el nombre real de cada cuenta bot conectada (ya es público dentro
// del juego) junto con su saldo de V-Bucks, e invita al cliente a agregarlas
// como amigo directamente — sin tener que esperar a comprar primero, así
// las 48hs de amistad corren mientras decide qué quiere.
// Se auto-oculta por completo si el bot no responde.
// ============================================================================

interface Cuenta { nombre: string; vbucks: number }

export default function EstadoBots() {
  const [cuentas, setCuentas] = useState<Cuenta[] | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    const cargar = () => {
      fetch('/api/estado-bots')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (activo && d?.operativo) setCuentas(d.cuentas || []); })
        .catch(() => {});
    };
    cargar();
    const t = setInterval(cargar, 60000);
    return () => { activo = false; clearInterval(t); };
  }, []);

  if (!cuentas || cuentas.length === 0) return null;

  const copiar = (nombre: string) => {
    navigator.clipboard.writeText(nombre);
    setCopiado(nombre);
    setTimeout(() => setCopiado(null), 2000);
  };

  return (
    <div className="mt-8 kk-panel rounded-2xl p-5 max-w-md">
      <div className="flex items-center gap-2 mb-1">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7BC77E] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#7BC77E]"></span>
        </span>
        <h3 className="font-display font-bold text-sm text-[#F5F1E6]">Agreganos en Fortnite</h3>
      </div>
      <p className="text-[#9A9384] text-xs mb-3">Agregá cualquiera de estas cuentas para recibir tus productos favoritos apenas se cumplan las 48hs de amistad.</p>

      <div className="space-y-2">
        {cuentas.map((c) => (
          <div key={c.nombre} className="flex items-center justify-between bg-[#14110C] border border-[#3A3527] rounded-lg pl-3 pr-2 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <Gamepad2 size={14} className="text-[#4A93D6] shrink-0" />
              <span className="font-mono font-bold text-sm text-[#F5F1E6] truncate">{c.nombre}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://fortnite-api.com/images/vbuck.png" alt="" className="w-3.5 h-3.5" loading="lazy" />
              <span className="font-mono text-xs font-bold text-[#E3A23D]">{c.vbucks.toLocaleString('en-US')}</span>
              <button
                onClick={() => copiar(c.nombre)}
                className="text-[#9A9384] hover:text-[#E3A23D] transition p-1"
                title="Copiar nombre de usuario"
              >
                {copiado === c.nombre ? <Check size={14} className="text-[#7BC77E]" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
