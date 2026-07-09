import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! 
);

// Función auxiliar mejorada para enviar la alerta a Discord
async function sendDiscordNotification(payload: any) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
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

  // Darle formato a la lista de artículos
  const itemsList = cart.map((i: any) => `• **${i.name}** (x${i.quantity}) - $${(i.price * i.quantity).toFixed(2)} USD`).join('\n');
  const storeLogo = "https://kitson-kit.up.railway.app/logo.jpg";

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

      // ALERTA DISCORD PREMIUM: COMPRA CON SALDO
      await sendDiscordNotification({
        content: "<@755160795587018810> <@730084111984754712> 📦 **¡NUEVA ORDEN PAGADA CON SALDO! (HAY QUE ENTREGAR)**",
        embeds: [{
          title: "✅ Orden Automática Completada",
          description: "El cliente usó su saldo de Kitson para comprar cosméticos. **Entra a Fortnite y envía los siguientes regalos:**",
          color: 3066993, // Verde
          thumbnail: { url: storeLogo },
          fields: [
            { name: "👤 Cliente", value: `**${userName}**\n${userEmail}`, inline: true },
            { name: "🎮 Epic ID / Tag", value: `\`${gamerId}\``, inline: true },
            { name: "💳 Total Descontado", value: `**$${totalPrice.toFixed(2)} USD**`, inline: true },
            { name: "🎁 Cosméticos a Entregar", value: itemsList || "Recarga de Saldo" }
          ],
          footer: { text: "Kitson Kit System", icon_url: storeLogo },
          timestamp: new Date().toISOString()
        }]
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

      // ALERTA DISCORD PREMIUM: PAGO MANUAL POR TRANSFERENCIA
      await sendDiscordNotification({
        content: "<@755160795587018810> <@730084111984754712> 🚨 **¡NUEVO PAGO POR VERIFICAR!**",
        embeds: [{
          title: "🟨 Verificación de Transferencia",
          description: "Un cliente subió un comprobante de pago. **Verifica la cuenta bancaria y recarga su saldo o entrégale los items.**",
          color: 16753920, // Naranja
          thumbnail: { url: storeLogo },
          image: receiptUrl ? { url: receiptUrl } : undefined, // ¡La foto del comprobante aparecerá gigante aquí!
          fields: [
            { name: "👤 Cliente", value: `**${userName}**\n${userEmail}`, inline: true },
            { name: "🎮 Epic ID / Tag", value: `\`${gamerId}\``, inline: true },
            { name: "💰 Monto a Verificar", value: `**${activeCurrency.symbol}${formattedLocalPrice} ${activeCurrency.currency}**\n($${totalPrice.toFixed(2)} USD)`, inline: true },
            { name: "📦 Detalles del Carrito", value: itemsList || "Recarga de Saldo" }
          ],
          footer: { text: "Kitson Kit System", icon_url: storeLogo },
          timestamp: new Date().toISOString()
        }]
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}