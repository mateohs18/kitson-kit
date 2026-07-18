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

  const fetchBots = async () => {
    try {
      setLoading(true);
      // Cambia la URL por la de tu servidor (ngrok o dominio)
      const res = await fetch('https://tu-ngrok-url/api/bots/status');
      if (!res.ok) throw new Error('Error al obtener datos');
      const data = await res.json();
      setBots(data.bots || []);
      setError(null);
    } catch (err) {
      setError('Error al conectar con el servidor de bots');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBots();
    // Opcional: actualizar cada 60 segundos
    const interval = setInterval(fetchBots, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ 
      background: '#0a0a0f', 
      color: '#fff', 
      minHeight: '100vh', 
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1 style={{ 
        marginBottom: '2rem', 
        fontSize: '2rem', 
        fontWeight: 700,
        background: 'linear-gradient(135deg, #ffd700, #ff6b00)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        textAlign: 'center'
      }}>
        🤖 Estado de Bots
      </h1>

      {loading && <p style={{ textAlign: 'center', color: '#888' }}>Cargando...</p>}
      {error && <p style={{ textAlign: 'center', color: '#d32f2f' }}>{error}</p>}

      {!loading && !error && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {bots.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#888' }}>No hay bots disponibles.</p>
          ) : (
            bots.map((bot) => (
              <div key={bot.accountId} style={{
                background: '#1a1a2e',
                borderRadius: '20px',
                padding: '1.5rem',
                border: '1px solid #2a2a4a',
                boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.4)';
              }}
              >
                <div style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem', color: '#fff' }}>
                  {bot.name}
                </div>
                <div style={{
                  display: 'inline-block',
                  padding: '0.2rem 0.8rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  marginBottom: '1rem',
                  background: bot.ready ? '#00c853' : '#d32f2f',
                  color: '#fff'
                }}>
                  {bot.ready ? '🟢 Online' : '🔴 Offline'}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #2a2a4a' }}>
                  <span style={{ color: '#aaa' }}>💰 V-Bucks</span>
                  <span style={{ fontWeight: 600, color: '#ffd700' }}>{bot.vbucks.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #2a2a4a' }}>
                  <span style={{ color: '#aaa' }}>🎁 Regalos hoy</span>
                  <span style={{ fontWeight: 600 }}>{bot.giftsSentToday} / {bot.giftLimit}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0' }}>
                  <span style={{ color: '#aaa' }}>📦 Restantes</span>
                  <span style={{ fontWeight: 600, color: '#64b5f6' }}>{bot.giftsRemaining}</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '0.5rem', wordBreak: 'break-all' }}>
                  ID: {bot.accountId}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
