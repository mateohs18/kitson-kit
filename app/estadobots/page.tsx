// app/estadobots/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { 
  Server, RefreshCcw, AlertTriangle, Gift, 
  Zap, CheckCircle2, XCircle, Clock 
} from 'lucide-react';

interface BotStatus {
  name: string;
  accountId: string;
  ready: boolean;
  displayName: string;
  vbucks: number;
  giftsSentToday: number;
  giftLimit: number;
  giftsRemaining: number;
}

export default function EstadoBotsPage() {
  const [bots, setBots] = useState<BotStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState('');

  const fetchBots = async () => {
    setLoading(true);
    try {
      const botUrl = process.env.NEXT_PUBLIC_BOT_URL || 'http://localhost:3001';
      const res = await fetch(`${botUrl}/api/bots/status`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setBots(data.bots || []);
      setLastUpdate(new Date().toLocaleTimeString());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión con la granja');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBots();
    const interval = setInterval(fetchBots, 30000);
    return () => clearInterval(interval);
  }, []);

  // ESTADO: CARGANDO
  if (loading && bots.length === 0) {
    return (
      <div className="min-h-screen bg-[#14110C] flex flex-col items-center justify-center gap-4 selection:bg-[#E3A23D] selection:text-[#0A0806]">
        <RefreshCcw size={48} className="animate-spin text-[#E3A23D]" />
        <div className="font-display font-bold text-xl text-[#F5F1E6] animate-pulse">Conectando con la granja de bots...</div>
      </div>
    );
  }

  // ESTADO: ERROR
  if (error) {
    return (
      <div className="min-h-screen bg-[#14110C] flex items-center justify-center p-6 font-body selection:bg-[#E3A23D] selection:text-[#0A0806]">
        <div className="kk-panel bg-[#1D1913] rounded-3xl p-8 max-w-md text-center border-l-[6px] border-l-red-500 relative overflow-hidden">
          <div className="absolute inset-0 kk-dots opacity-10 pointer-events-none"></div>
          <AlertTriangle size={48} className="mx-auto text-red-500 mb-4 relative z-10" />
          <h2 className="font-display font-bold text-2xl text-[#F5F1E6] mb-2 relative z-10">Conexión Perdida</h2>
          <div className="text-[#9A9384] text-sm mb-6 relative z-10">{error}</div>
          <button 
            onClick={fetchBots} 
            className="w-full bg-[#E3A23D] hover:bg-[#f0b458] text-[#0A0806] px-6 py-3 rounded-xl font-bold border-[3px] border-[#0A0806] transition-transform hover:-translate-y-1 shadow-[0_4px_0_0_#0A0806] relative z-10"
          >
            Reintentar Conexión
          </button>
        </div>
      </div>
    );
  }

  // ESTADO: DASHBOARD PRINCIPAL
  return (
    <div className="min-h-screen bg-[#14110C] p-6 md:p-10 font-body selection:bg-[#E3A23D] selection:text-[#0A0806]">
      <div className="max-w-7xl mx-auto">
        
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-10 border-b-4 border-[#0A0806] pb-8">
          <div>
            <span className="inline-flex items-center gap-2 bg-[#4A93D6]/20 text-[#4A93D6] font-bold text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg border border-[#4A93D6]/30 mb-4">
              <span className="flex h-2 w-2 rounded-full bg-[#4A93D6] animate-pulse"></span>
              Sistema Central
            </span>
            <h1 className="font-display font-extrabold text-4xl md:text-5xl text-[#F5F1E6] flex items-center gap-3">
              <Server className="text-[#E3A23D]" size={40} />
              Estado de <span className="text-[#E3A23D]">Bots</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-[#1D1913] border-2 border-[#0A0806] rounded-xl px-4 py-2.5 flex flex-col justify-center">
              <span className="text-[#9A9384] text-[10px] font-bold uppercase tracking-widest leading-none mb-1">Última actualización</span>
              <span className="text-[#F5F1E6] font-mono font-bold text-sm leading-none">{lastUpdate}</span>
            </div>
            <button 
              onClick={fetchBots} 
              disabled={loading} 
              className="bg-[#E3A23D] hover:bg-[#f0b458] text-[#0A0806] p-3 rounded-xl border-2 border-[#0A0806] transition-transform hover:scale-105 disabled:opacity-50"
              title="Refrescar estado"
            >
              <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Grilla de Bots */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {bots.map((bot) => {
            const isGiftMaxed = bot.giftsSentToday >= bot.giftLimit;
            const progressPercentage = (bot.giftsSentToday / bot.giftLimit) * 100;

            return (
              <div 
                key={bot.accountId} 
                className="kk-panel kk-card-hover bg-gradient-to-b from-[#1D1913] to-[#14110C] rounded-[2rem] p-6 flex flex-col relative overflow-hidden"
              >
                {/* Glow de fondo decorativo */}
                <div className={`absolute -top-10 -right-10 w-32 h-32 blur-[80px] opacity-15 pointer-events-none ${bot.ready ? 'bg-[#E3A23D]' : 'bg-red-500'}`}></div>

                {/* Cabecera del Bot */}
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className="overflow-hidden pr-3">
                    <h2 className="font-display font-bold text-2xl text-[#F5F1E6] truncate">{bot.name}</h2>
                    <p className="text-[10px] font-mono text-[#9A9384] mt-1 flex items-center gap-1">ID: <span className="text-[#D9D4C7]">{bot.accountId}</span></p>
                  </div>
                  <span className={`shrink-0 px-3 py-1.5 text-[10px] uppercase font-black tracking-widest rounded-lg border-2 border-[#0A0806] flex items-center gap-1.5 shadow-sm ${bot.ready ? 'bg-emerald-400 text-[#0A0806]' : 'bg-red-500 text-[#F5F1E6]'}`}>
                    {bot.ready ? <CheckCircle2 size={14}/> : <XCircle size={14}/>}
                    {bot.ready ? 'Online' : 'Offline'}
                  </span>
                </div>

                {/* Bloque de Pavos */}
                <div className="bg-[#14110C] border-2 border-[#0A0806] rounded-2xl p-4 mb-4 relative z-10">
                  <p className="text-[#9A9384] text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5">
                    <Zap size={14} className="text-[#E3A23D]" /> Pavos Disponibles
                  </p>
                  <div className="flex items-end gap-1">
                    <p className="font-mono font-bold text-4xl text-[#E3A23D] leading-none">{bot.vbucks.toLocaleString()}</p>
                    <span className="text-[#9A9384] text-xs font-bold mb-1">V-Bucks</span>
                  </div>
                </div>

                {/* Bloque de Regalos Diarios */}
                <div className="bg-[#14110C] border-2 border-[#0A0806] rounded-2xl p-4 relative z-10 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-[#9A9384] text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                        <Gift size={14} className={isGiftMaxed ? 'text-red-400' : 'text-[#4A93D6]'} /> Regalos Enviados
                      </p>
                      <p className="font-mono font-bold text-sm text-[#F5F1E6]">
                        <span className={isGiftMaxed ? 'text-red-400' : 'text-[#4A93D6] text-lg'}>{bot.giftsSentToday}</span> / {bot.giftLimit}
                      </p>
                    </div>

                    {/* Barra de Progreso */}
                    <div className="h-3 w-full bg-[#1D1913] border border-[#0A0806] rounded-full overflow-hidden mb-4 shadow-inner">
                      <div 
                        className={`h-full transition-all duration-700 ease-out relative ${isGiftMaxed ? 'bg-red-500' : 'bg-[#4A93D6]'}`} 
                        style={{ width: `${progressPercentage}%` }}
                      >
                        {/* Brillo interno de la barra */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-white/20"></div>
                      </div>
                    </div>
                  </div>

                  {/* Explicación del sistema de 24hs de Epic Games */}
                  <div className="bg-[#1D1913] border border-[#3A3527] rounded-lg p-3">
                    <p className="text-[10px] text-[#9A9384] flex items-start gap-2 leading-tight">
                      <Clock size={14} className="shrink-0 text-[#E3A23D]"/>
                      <span>Los {bot.giftLimit} envíos no se reinician de golpe a la medianoche. <strong className="text-[#D9D4C7]">Cada slot de regalo se libera exactamente 24 horas después</strong> de haber sido utilizado.</span>
                    </p>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* Estado Vacío */}
        {!loading && bots.length === 0 && !error && (
          <div className="kk-panel bg-[#1D1913] border-2 border-[#0A0806] rounded-3xl p-12 text-center max-w-2xl mx-auto mt-10">
            <Server size={64} className="mx-auto text-[#3A3527] mb-4" />
            <h2 className="font-display font-bold text-2xl text-[#D9D4C7]">No hay bots conectados</h2>
            <p className="text-[#9A9384] mt-2">Inicia el servidor de la granja de bots para que aparezcan en el monitor.</p>
          </div>
        )}

      </div>
    </div>
  );
}
