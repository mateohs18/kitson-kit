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
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    async function fetchBots() {
      try {
        setLoading(true);
        setError('');
        setDebugInfo('Iniciando petición...');

        // ⚠️ CAMBIA ESTA URL POR LA DE TU NGROK
        const url = 'https://underwear-july-sanded.ngrok-free.dev/api/bots/status';
        setDebugInfo(`Fetching: ${url}`);

        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        setDebugInfo(`Status: ${res.status} ${res.statusText}`);

        if (!res.ok) {
          throw new Error(`HTTP ${res.status} - ${res.statusText}`);
        }

        const data = await res.json();
        setDebugInfo(`Datos recibidos: ${JSON.stringify(data).substring(0, 200)}...`);

        if (!data.bots) {
          throw new Error('La respuesta no contiene "bots"');
        }

        setBots(data.bots);
        setError('');
      } catch (err) {
        console.error('❌ Error en fetchBots:', err);
        setError('No se pudo conectar con el servidor de bots.');
        setDebugInfo(`Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }

    fetchBots();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-white text-xl">🔄 Cargando bots...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center gap-4 p-4">
        <div className="text-red-500 text-xl">❌ {error}</div>
        {debugInfo && (
          <div className="text-gray-400 text-sm max-w-lg text-center bg-[#1a1a2e] p-4 rounded-lg border border-[#2a2a4a]">
            <div className="font-mono text-xs break-all">{debugInfo}</div>
          </div>
        )}
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          🔄 Reintentar
        </button>
      </div>
    );
  }

  if (bots.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-white text-xl">🤖 No hay bots disponibles.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-8">
      <h1 className="text-3xl font-bold text-center mb-8 text-transparent bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text">
        🤖 Estado de Bots
      </h1>

      {debugInfo && (
        <div className="max-w-4xl mx-auto mb-4 text-xs text-gray-500 bg-[#1a1a2e] p-2 rounded border border-[#2a2a4a] overflow-auto">
          <code>{debugInfo}</code>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {bots.map((bot) => (
          <div
            key={bot.accountId}
            className="bg-[#1a1a2e] rounded-2xl p-6 border border-[#2a2a4a] shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
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
                  {bot.vbucks > 0 ? bot.vbucks.toLocaleString() : 'Sin datos'}
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
            <div className="mt-3 text-[10px] text-gray-500 break-all">ID: {bot.accountId}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
