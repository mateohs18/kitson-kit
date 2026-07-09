import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! 
);

// Función auxiliar para enviar notificaciones estéticas a Discord
async function sendDiscordNotification(embed: any) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    });
  } catch (error) {
    console.error("Error enviando alerta a Discord:", error);
  }
}

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { cart, gamerId, paymentMethod, totalPrice, activeCurrency, receiptUrl } = await req.json();
  const userEmail = session.user.email;
  const userName = session.user.name || 'Gamer';

  // Darle formato a la lista de artículos para el mensaje de Discord
  const itemsList = cart.map((i: any) => `• **${i.name}** (x${i.quantity}) - $${(i.price * i.quantity).toFixed(2)} USD`).join('\n');

  try {
    if (paymentMethod === 'saldo') {
      const { data: profile } = await supabaseAdmin.from('profiles').select('balance').eq('email', userEmail).single();
      
      if (!profile || profile.balance < totalPrice) {
        return NextResponse.json({ error: "Saldo insuficiente o cuenta no encontrada" }, { status: 400 });
      }

      await supabaseAdmin.from('profiles').update({ balance: profile.balance - totalPrice }).eq('email', userEmail);
      
      await supabaseAdmin.from('orders').insert([{
        user_email: userEmail, user_name: userName,
        gamer_id: gamerId, items: cart, total_price: totalPrice, status: 'PAGADO CON SALDO',
        country: 'Kitson Wallet', local_currency: 'USD', local_price: totalPrice
      }]);

      // ALERTA DISCORD: COMPRA AUTOMÁTICA CON SALDO
      await sendDiscordNotification({
        title: "🟩 NUEVA COMPRA AUTOMÁTICA (SALDO)",
        color: 3066993, // Verde Gamer
        fields: [
          { name: "👤 Cliente", value: `${userName} (${userEmail})`, inline: true },
          { name: "🎮 Epic ID / Tag", value: `\`${gamerId}\``, inline: true },
          { name: "💰 Total Descontado", value: `**$${totalPrice.toFixed(2)} USD**`, inline: false },
          { name: "📦 Cosméticos Adquiridos", value: itemsList || "Recarga de Saldo" }
        ],
        footer: { text: "Kitson Kit System — Procesado al Instante" },
        timestamp: new Date().toISOString()
      });

    } else {
      const localPriceCalculated = activeCurrency.rate * totalPrice;
      const formattedLocalPrice = localPriceCalculated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      await supabaseAdmin.from('orders').insert([{
        user_email: userEmail, user_name: userName,
        gamer_id: gamerId, items: cart, total_price: totalPrice, status: 'PENDIENTE',
        country: activeCurrency.name, local_currency: activeCurrency.currency,
        local_price: parseFloat(formattedLocalPrice.replace(/,/g, '')), payment_proof: receiptUrl
      }]);

      // ALERTA DISCORD: PAGO MANUAL POR TRANSFERENCIA (REQUIERE TU APROBACIÓN)
      await sendDiscordNotification({
        title: "🟨 NUEVO COMPROBANTE POR VERIFICAR",
        color: 15105570, // Naranja / Amarillo Alerta
        fields: [
          { name: "👤 Cliente", value: `${userName} (${userEmail})`, inline: true },
          { name: "🎮 Epic ID / Tag", value: `\`${gamerId}\``, inline: true },
          { name: "🌍 País / Moneda", value: `${activeCurrency.name} (${activeCurrency.currency})`, inline: true },
          { name: "💵 Monto Reportado", value: `**${activeCurrency.symbol}${formattedLocalPrice} ${activeCurrency.currency}** ($${totalPrice.toFixed(2)} USD)`, inline: false },
          { name: "📦 Carrito/Concepto", value: itemsList || "Recarga de Saldo / Billetera" },
          { name: "📸 Captura del Recibo", value: receiptUrl ? `[Ver Comprobante de Pago de forma Segura](${receiptUrl})` : "No se adjuntó imagen" }
        ],
        footer: { text: "Kitson Kit System — Esperando Verificación Manual" },
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}