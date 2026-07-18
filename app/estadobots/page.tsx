// app/estadobots/page.tsx
'use client';

import { useEffect, useState } from 'react';

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
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBots();
    const interval = setInterval(fetchBots, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && bots.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-white text-xl">Cargando bots...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <div className="bg-[#1a1a2e] rounded-xl p-8 max-w-md border border-red-500/30 text-center">
          <div className="text-red-500 text-lg mb-4">❌ {error}</div>
          <button
            onClick={fetchBots}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:opacity-90 transition"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">🤖 Estado de Bots</h1>
          <span className="text-gray-400 text-sm">Última actualización: {lastUpdate}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bots.map((bot) => (
            <div
              key={bot.accountId}
              className="bg-[#1a1a2e] rounded-xl p-5 border border-[#2a2a4a] hover:border-[#3a3a5a] transition"
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold text-white">{bot.name}</h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    bot.ready ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                  }`}
                >
                  {bot.ready ? 'Online' : 'Offline'}
                </span>
              </div>

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-300 border-b border-[#2a2a4a] pb-1">
                  <span>V-Bucks</span>
                  <span className="text-yellow-400 font-medium">{bot.vbucks}</span>
                </div>
                <div className="flex justify-between text-gray-300 border-b border-[#2a2a4a] pb-1">
                  <span>Regalos hoy</span>
                  <span className="text-white">
                    {bot.giftsSentToday} / {bot.giftLimit}
                  </span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Restantes</span>
                  <span className="text-blue-400 font-medium">{bot.giftsRemaining}</span>
                </div>
              </div>

              <div className="mt-2 text-[10px] text-gray-500 truncate">
                ID: {bot.accountId}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
