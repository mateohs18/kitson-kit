// app/estadobots/page.tsx
'use client';

import { useEffect, useState } from 'react';

interface BotStatus {
  name: string;
  accountId: string;
  ready: boolean;
  hasToken: boolean;
  vbucks: number;
  giftsSentToday: number;
  giftLimit: number;
  giftsRemaining: number;
}

export default function EstadoBotsPage() {
  const [bots, setBots] = useState<BotStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState('');

  const fetchBots = async () => {
    setLoading(true);
    setError(null);
    try {
      // Usa la variable de entorno NEXT_PUBLIC_BOT_URL
      const botUrl = process.env.NEXT_PUBLIC_BOT_URL || 'http://localhost:3001';
      const url = `${botUrl}/api/bots/status`;
      console.log('🔍 Fetching desde:', url);
      
      const res = await fetch(url, {
        // Asegurar que no haya caché
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
      });

      console.log('📡 Status:', res.status);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} - ${res.statusText}`);
      }
      const data = await res.json();
      console.log('✅ Datos recibidos:', data);
      setBots(data.bots || []);
      setDebugInfo(`Última actualización: ${new Date().toLocaleTimeString()}`);
    } catch (err: unknown) {
      console.error('❌ Error en fetchBots:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(`No se pudo conectar con el servidor de bots. (${errorMessage})`);
      setDebugInfo(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBots();
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchBots, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && bots.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-2xl mb-4">⏳ Cargando bots...</div>
          <div className="text-gray-400 text-sm">{debugInfo}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <div className="bg-[#1a1a2e] rounded-2xl p-8 max-w-md w-full border border-red-500/30">
          <div className="text-red-500 text-center text-xl mb-4">❌ {error}</div>
          <div className="text-gray-400 text-sm text-center mb-6">{debugInfo}</div>
          <button
            onClick={fetchBots}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-2 px-4 rounded-xl transition-all"
          >
            🔄 Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (bots.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-2xl mb-4">🤖 No hay bots disponibles</div>
          <div className="text-gray-400 text-sm">{debugInfo}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-transparent bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text">
            🤖 Estado de Bots
          </h1>
          <div className="text-gray-400 text-sm">{debugInfo}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bots.map((bot) => (
            <div
              key={bot.accountId}
              className="bg-[#1a1a2e] rounded-2xl p-6 border border-[#2a2a4a] shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
            >
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-xl font-bold text-white">{bot.name}</h2>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    bot.ready ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                  }`}
                >
                  {bot.ready ? '🟢 Online' : '🔴 Offline'}
                </span>
              </div>

              <div className="space-y-2 text-gray-300 text-sm">
                <div className="flex justify-between border-b border-[#2a2a4a] pb-1">
                  <span>💰 V-Bucks</span>
                  <span className="font-bold text-yellow-400">
                    {bot.vbucks > 0 ? bot.vbucks.toLocaleString() : '0'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-[#2a2a4a] pb-1">
                  <span>🎁 Regalos hoy</span>
                  <span>
                    {bot.giftsSentToday} / {bot.giftLimit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>📦 Restantes</span>
                  <span className="font-bold text-blue-400">{bot.giftsRemaining}</span>
                </div>
              </div>

              <div className="mt-3 text-[10px] text-gray-500 break-all">
                ID: {bot.accountId}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
