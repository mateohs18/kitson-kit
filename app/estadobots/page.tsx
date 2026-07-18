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

  useEffect(() => {
    async function fetchBots() {
      try {
        // 🔁 REEMPLAZA con la URL de tu servidor Express (ngrok)
        const res = await fetch('https://underwear-july-sanded.ngrok-free.dev/api/bots/status');
        if (!res.ok) throw new Error('Error al obtener estado');
        const data = await res.json();
        setBots(data.bots || []);
      } catch (err) {
        setError('No se pudo conectar con el servidor de bots.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchBots();
  }, []);

  if (loading) return <div className="text-white text-center p-8">Cargando bots...</div>;
  if (error) return <div className="text-red-500 text-center p-8">{error}</div>;
  if (bots.length === 0) return <div className="text-white text-center p-8">No hay bots disponibles.</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-8">
      <h1 className="text-3xl font-bold text-center mb-8 text-transparent bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text">
        🤖 Estado de Bots
      </h1>
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
                <span className="font-bold text-yellow-400">{bot.vbucks.toLocaleString()}</span>
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
