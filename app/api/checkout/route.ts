import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { supabaseAdmin } from '../../../lib/supabase-admin';

export async function POST(req: Request) {
  try {
    const cuerpo = await req.json();
    const { email, userName, cart, gamerId, totalPrice, paymentMethod, receiptUrl } = cuerpo;

    // 🔥 VALIDACIONES DE DATOS
    if (!email) return NextResponse.json({ error: 'Falta el correo electrónico (email)' }, { status: 400 });
    if (!cart || cart.length === 0) return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 });
    if (totalPrice === undefined) return NextResponse.json({ error: 'Falta el precio total' }, { status: 400 });
    if (!gamerId) return NextResponse.json({ error: 'Falta el ID de Epic Games' }, { status: 400 });

    let nuevoSaldo = 0;

    // 1. SI PAGA CON SALDO: Descontar de la base de datos
    if (paymentMethod === 'saldo') {
      const session = await getServerSession(authOptions);

      if (!session?.user?.email) {
        return NextResponse.json({ error: 'Debes iniciar sesión para pagar con saldo.' }, { status: 401 });
      }

      const emailAutenticado = session.user.email.trim();

      const { data: user, error: userError } = await supabaseAdmin.from('profiles').select('balance').eq('email', emailAutenticado).single();
      if (userError || !user) return NextResponse.json({ error: 'El correo no está registrado.' }, { status: 404 });
      if (Number(user.balance) < Number(totalPrice)) return NextResponse.json({ error: 'Saldo insuficiente en tu billetera.' }, { status: 400 });

      nuevoSaldo = Number(user.balance) - Number(totalPrice);
      await supabaseAdmin.from('profiles').update({ balance: nuevoSaldo }).eq('email', emailAutenticado);
    }

    // ENDPOINT 2: Enviar el cosmético (Regalo)
app.post('/api/bot/enviar-regalo', async (req, res) => {
  const { epicName, offerId, mensaje } = req.body;
  
  // Limpiamos espacios invisibles adelante o atrás
  const nombreBuscado = epicName.trim();

  try {
    console.log(`\n🎁 Procesando regalo para: "${nombreBuscado}"...`);

    // ==========================================
    // 🕵️‍♂️ RADAR DE AMIGOS (MODO DEBUG)
    // ==========================================
    const amigosArray = Array.from(bot.friends.values());
    console.log(`👥 El bot tiene ${amigosArray.length} amigos en su lista.`);
    
    // Mostramos los nombres exactos separados para ver si hay símbolos raros
    const nombresAmigos = amigosArray.map(f => f.displayName).filter(Boolean);
    console.log(`📜 Nombres que el bot está viendo: [ ${nombresAmigos.join(' ] | [ ')} ]`);
    // ==========================================

    let accountIdReceptor = null;

    // Buscamos coincidencia exacta primero, o minúsculas como plan B
    const amigo = amigosArray.find(f => 
      f.displayName && (
        f.displayName === nombreBuscado || 
        f.displayName.toLowerCase() === nombreBuscado.toLowerCase()
      )
    );

    if (amigo) {
      accountIdReceptor = amigo.id;
      console.log(`✅ Jugador encontrado en tu lista de amigos. Account ID: ${accountIdReceptor}`);
    } else {
      // Plan B: API pública
      try {
        const userResponse = await bot.http.epicgamesRequest({
          method: 'GET',
          url: `https://account-public-service-prod.ol.epicgames.com/account/api/public/account/displayName/${encodeURIComponent(nombreBuscado)}`
        });
        accountIdReceptor = userResponse.id;
        console.log(`✅ Jugador encontrado vía API. Account ID: ${accountIdReceptor}`);
      } catch (lookupErr) {
        console.error(`❌ No se encontró al jugador en amigos ni en la API.`);
        return res.status(404).json({ success: false, error: 'Jugador no encontrado.' });
      }
    }

    // 3. Preparamos la caja de regalo
    const giftPayload = {
      offerId: offerId, 
      purchaseQuantity: 1,
      currency: "MtxCurrency",
      currencySubType: "",
      expectedTotalPrice: 0, 
      gameContext: "",
      receiverAccountIds: [accountIdReceptor], 
      giftWrapTemplateId: "GiftBox:gb_makeitrain",
      personalMessage: mensaje || "¡Gracias por tu compra en Kitson Kit!"
    };

    // 4. Enviamos la petición a Epic Games
    await bot.http.epicgamesRequest({
      method: 'POST',
      url: `https://fortnite-public-service-prod11.ol.epicgames.com/fortnite/api/game/v2/profile/${bot.user.id}/client/GiftCatalogEntry?profileId=common_core&rvn=-1`,
      body: giftPayload
    });

    console.log(`🎉 ¡Regalo enviado con éxito a ${nombreBuscado}!`);
    res.json({ success: true, message: 'Regalo enviado correctamente.' });
    
  } catch (error) {
    console.error('❌ Error enviando regalo:', error.message || error);
    res.status(500).json({ success: false, error: 'Fallo al entregar el regalo.' });
  }
});
