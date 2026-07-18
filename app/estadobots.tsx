<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Estado de Bots - Kitson Kit</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif; }
    body { background: #0a0a0f; color: #fff; padding: 2rem; min-height: 100vh; display: flex; flex-direction: column; align-items: center; }
    h1 { margin-bottom: 2rem; font-size: 2rem; font-weight: 700; background: linear-gradient(135deg, #ffd700, #ff6b00); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .bots-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      width: 100%;
      max-width: 1200px;
    }
    .bot-card {
      background: #1a1a2e;
      border-radius: 20px;
      padding: 1.5rem;
      border: 1px solid #2a2a4a;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 8px 20px rgba(0,0,0,0.4);
    }
    .bot-card:hover { transform: translateY(-5px); box-shadow: 0 12px 30px rgba(0,0,0,0.6); }
    .bot-name { font-size: 1.4rem; font-weight: 700; margin-bottom: 0.5rem; color: #fff; }
    .bot-status {
      display: inline-block;
      padding: 0.2rem 0.8rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }
    .bot-status.online { background: #00c853; color: #fff; }
    .bot-status.offline { background: #d32f2f; color: #fff; }
    .bot-info { display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid #2a2a4a; }
    .bot-info:last-child { border-bottom: none; }
    .bot-info-label { color: #aaa; }
    .bot-info-value { font-weight: 600; }
    .vbucks { color: #ffd700; }
    .gifts-remaining { color: #64b5f6; }
    .account-id { font-size: 0.7rem; color: #888; margin-top: 0.5rem; word-break: break-all; }
    .error-msg { color: #d32f2f; text-align: center; margin: 2rem; }
    .loading { text-align: center; font-size: 1.2rem; color: #888; }
  </style>
</head>
<body>
  <h1>🤖 Estado de Bots</h1>
  <div id="botsContainer" class="bots-grid">
    <div class="loading">Cargando...</div>
  </div>

  <script>
    async function loadBotsStatus() {
      const container = document.getElementById('botsContainer');
      container.innerHTML = '<div class="loading">Cargando...</div>';

      try {
        // 🔁 CAMBIA ESTA URL POR LA DE TU SERVIDOR (ngrok o dominio)
        const response = await fetch('https://tu-ngrok-url/api/bots/status');
        if (!response.ok) throw new Error('Error en la respuesta del servidor');
        const data = await response.json();

        if (!data.bots || data.bots.length === 0) {
          container.innerHTML = '<p class="error-msg">No hay bots disponibles.</p>';
          return;
        }

        container.innerHTML = data.bots.map(bot => `
          <div class="bot-card">
            <div class="bot-name">${bot.name}</div>
            <div class="bot-status ${bot.ready ? 'online' : 'offline'}">
              ${bot.ready ? '🟢 Online' : '🔴 Offline'}
            </div>
            <div class="bot-info">
              <span class="bot-info-label">💰 V-Bucks</span>
              <span class="bot-info-value vbucks">${bot.vbucks.toLocaleString()}</span>
            </div>
            <div class="bot-info">
              <span class="bot-info-label">🎁 Regalos hoy</span>
              <span class="bot-info-value">${bot.giftsSentToday} / ${bot.giftLimit}</span>
            </div>
            <div class="bot-info">
              <span class="bot-info-label">📦 Restantes</span>
              <span class="bot-info-value gifts-remaining">${bot.giftsRemaining}</span>
            </div>
            <div class="account-id">ID: ${bot.accountId}</div>
          </div>
        `).join('');
      } catch (error) {
        console.error('Error cargando estado de bots:', error);
        container.innerHTML = '<p class="error-msg">❌ Error al conectar con el servidor. Verifica la URL o que el servidor esté encendido.</p>';
      }
    }

    // Carga inicial
    loadBotsStatus();

    // Actualizar cada 60 segundos (opcional)
    // setInterval(loadBotsStatus, 60000);
  </script>
</body>
</html>
