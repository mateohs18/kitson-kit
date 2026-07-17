import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { supabaseAdmin } from '../../../lib/supabase-admin';

export async function POST(req: Request) {
  try {
    const cuerpo = await req.json();
    const { email, userName, cart, gamerId, totalPrice, paymentMethod, receiptUrl } = cuerpo;

    // 🔥 AHORA LOS ERRORES SON ESPECÍFICOS
    if (!email) return NextResponse.json({ error: 'Falta el correo electrónico (email)' }, { status: 400 });
    if (!cart || cart.length === 0) return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 });
    if (totalPrice === undefined) return NextResponse.json({ error: 'Falta el precio total' }, { status: 400 });
    if (!gamerId) return NextResponse.json({ error: 'Falta el ID de Epic Games' }, { status: 400 });

    let nuevoSaldo = 0;

    // 1. SI PAGA CON SALDO: hay que estar autenticado y solo se puede
    // descontar el saldo de la cuenta que inició sesión (nunca la de otro).
    if (paymentMethod === 'saldo') {
      const session = await getServerSession(authOptions);

      if (!session?.user?.email) {
        return NextResponse.json({ error: 'Debes iniciar sesión para pagar con saldo.' }, { status: 401 });
      }

      // Ignoramos el email que mande el cliente y usamos el de la sesión
      // verificada en el servidor, para que nadie pueda descontar saldo ajeno.
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

  try {
    console.log(`🎁 Procesando regalo para: ${epicName}...`);

    let accountIdReceptor = null;

    // 2. EL TRUCO INFALIBLE: Buscamos al jugador directamente en la lista de amigos del bot.
    // Convertimos la lista de amigos en un arreglo y buscamos el nombre, sin importar símbolos.
    const amigosArray = Array.from(bot.friends.values());
    const amigo = amigosArray.find(f => f.displayName && f.displayName.toLowerCase() === epicName.toLowerCase());

    if (amigo) {
      accountIdReceptor = amigo.id;
      console.log(`✅ Jugador encontrado en tu lista de amigos. Account ID: ${accountIdReceptor}`);
    } else {
      // Plan B: Si no está en amigos (quizás lo escribieron mal), intenta en la API pública
      try {
        const userResponse = await bot.http.epicgamesRequest({
          method: 'GET',
          url: `https://account-public-service-prod.ol.epicgames.com/account/api/public/account/displayName/${encodeURIComponent(epicName)}`
        });
        accountIdReceptor = userResponse.id;
        console.log(`✅ Jugador encontrado vía API. Account ID: ${accountIdReceptor}`);
      } catch (lookupErr) {
        console.error(`❌ No se encontró al jugador: ${epicName}`);
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

    console.log(`🎉 ¡Regalo enviado con éxito a ${epicName}!`);
    res.json({ success: true, message: 'Regalo enviado correctamente.' });
    
  } catch (error) {
    console.error('❌ Error enviando regalo:', error.message || error);
    res.status(500).json({ success: false, error: 'Fallo al entregar el regalo.' });
  }
});
