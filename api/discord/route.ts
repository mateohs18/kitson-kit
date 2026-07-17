import { verifyKey } from 'discord-interactions';
import { supabaseAdmin } from '../../../lib/supabase-admin';
import { aprobarRecarga } from '../../../lib/recargas';
import { marcarAmistadCuenta } from '../../../lib/amistad';

export const dynamic = 'force-dynamic';

// IDs de Discord autorizados a usar comandos administrativos, separados por coma
// (poné el tuyo en la variable de entorno DISCORD_ADMIN_IDS en Railway).
function esAdminAutorizado(interaction: any): boolean {
  const idsPermitidos = (process.env.DISCORD_ADMIN_IDS || '').split(',').map((id) => id.trim()).filter(Boolean);
  const userId = interaction.member?.user?.id || interaction.user?.id;
  return !!userId && idsPermitidos.includes(userId);
}

export async function POST(req: Request) {
  try {
    const signature = req.headers.get('x-signature-ed25519');
    const timestamp = req.headers.get('x-signature-timestamp');
    const bodyText = await req.text();
    
    if (!signature || !timestamp) return new Response('Unauthorized', { status: 401 });

    // Uso la variable de entorno, pero dejo tu llave escrita como plan de respaldo por si falla Railway
    const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY || "72b7028f1a0e5e72731199ea8cd1523ee7dea08f64fc0ccd4c3b5df151ff389a";
    
    let isValid = false;
    try { isValid = await verifyKey(bodyText, signature, timestamp, PUBLIC_KEY); } 
    catch (e) { return new Response('Unauthorized', { status: 401 }); }

    if (!isValid) return new Response('Unauthorized', { status: 401 });

    const interaction = JSON.parse(bodyText);
    const supabase = supabaseAdmin;
    
    // 1. EL PING
    if (interaction.type === 1) return Response.json({ type: 1 });

    // 2. COMANDOS (Toda tu lógica maestra intacta)
    if (interaction.type === 2) {
      const comando = interaction.data.name;

      // Todos los comandos de abajo modifican saldo o datos de clientes:
      // solo los IDs de Discord en DISCORD_ADMIN_IDS pueden usarlos.
      if (!esAdminAutorizado(interaction)) {
        return Response.json({ type: 4, data: { content: '⛔ No tenés permiso para usar este comando.', flags: 64 } });
      }

      if (comando === 'recargar') {
        const correo = interaction.data.options.find((o: any) => o.name === 'correo').value;
        const monto = interaction.data.options.find((o: any) => o.name === 'monto').value;
        const { data: user } = await supabase.from('profiles').select('balance').eq('email', correo.trim()).single();
        if (!user) return Response.json({ type: 4, data: { content: `❌ Correo no encontrado.` } });
        const nuevoSaldo = Number(user.balance || 0) + Number(monto);
        await supabase.from('profiles').update({ balance: nuevoSaldo }).eq('email', correo.trim());
        return Response.json({ type: 4, data: { content: `✅ **¡RECARGA EXITOSA!**\nNuevo saldo para **${correo}**: **$${nuevoSaldo.toFixed(2)} USD**.` } });
      }

      if (comando === 'descontar') {
        const correo = interaction.data.options.find((o: any) => o.name === 'correo').value;
        const monto = interaction.data.options.find((o: any) => o.name === 'monto').value;
        const { data: user } = await supabase.from('profiles').select('balance').eq('email', correo.trim()).single();
        if (!user) return Response.json({ type: 4, data: { content: `❌ Correo no encontrado.` } });
        const nuevoSaldo = Number(user.balance || 0) - Number(monto);
        await supabase.from('profiles').update({ balance: nuevoSaldo }).eq('email', correo.trim());
        return Response.json({ type: 4, data: { content: `➖ **¡DESCUENTO APLICADO!**\nNuevo saldo para **${correo}**: **$${nuevoSaldo.toFixed(2)} USD**.` } });
      }

      if (comando === 'registrar_usuario') {
        const correo = interaction.data.options.find((o: any) => o.name === 'correo').value;
        const { error } = await supabase.from('profiles').insert([{ email: correo.trim(), balance: 0 }]);
        if (error) return Response.json({ type: 4, data: { content: `❌ Hubo un error o el usuario ya existe.` } });
        return Response.json({ type: 4, data: { content: `✅ Cliente **${correo}** registrado con éxito. Saldo inicial: $0.` } });
      }

      if (comando === 'consultar_saldo') {
        const correo = interaction.data.options.find((o: any) => o.name === 'correo').value;
        const { data: user } = await supabase.from('profiles').select('balance').eq('email', correo.trim()).single();
        if (!user) return Response.json({ type: 4, data: { content: `❌ No se encontró una cuenta para **${correo}**.` }, flags: 64 });
        return Response.json({ type: 4, data: { content: `💳 Saldo disponible para **${correo}**: **$${Number(user.balance || 0).toFixed(2)} USD**.`, flags: 64 } });
      }

      if (comando === 'estado_pedido') {
        const ordenId = interaction.data.options.find((o: any) => o.name === 'orden_id').value;
        const { data: orden } = await supabase.from('orders').select('status').eq('id', ordenId).single();
        if (!orden) return Response.json({ type: 4, data: { content: `❌ No existe ninguna orden con el ID **${ordenId}**.` } });
        return Response.json({ type: 4, data: { content: `📦 El estado de tu pedido **#${ordenId.slice(0,8)}** es: **${orden.status}**.` } });
      }
    }

    // 3. BOTONES DE ENTREGAR / APROBAR RECARGA
    if (interaction.type === 3) {
      if (!esAdminAutorizado(interaction)) {
        return Response.json({ type: 4, data: { content: '⛔ No tenés permiso para hacer esto.', flags: 64 } });
      }
      const customId = interaction.data.custom_id;

      if (customId.startsWith('aprobar_recarga_')) {
        const recargaId = customId.replace('aprobar_recarga_', '');
        const resultado = await aprobarRecarga(recargaId);
        if (!resultado.ok) {
          return Response.json({ type: 4, data: { content: `❌ ${resultado.error}`, flags: 64 } });
        }
        return Response.json({
          type: 7,
          data: {
            content: `✅ **RECARGA APROBADA**\nNuevo saldo de **${resultado.email}**: **$${resultado.nuevoSaldo?.toFixed(2)} USD**.`,
            components: [],
            embeds: [],
          },
        });
      }
      if (customId.startsWith('amistad_cuenta_')) {
        const email = customId.replace('amistad_cuenta_', '');
        const resultado = await marcarAmistadCuenta(email);
        if (!resultado.ok) {
          return Response.json({ type: 4, data: { content: `❌ ${resultado.error}`, flags: 64 } });
        }
        return Response.json({
          type: 7,
          data: {
            content: `✅ **SOLICITUD CONFIRMADA**\nArrancó el contador de 48hs para **${email}**.`,
            components: [],
            embeds: [],
          },
        });
      }
      if (customId.startsWith('entregar_')) {
        const orderId = customId.split('_')[1];
        await supabase.from('orders').update({ status: 'ENTREGADO' }).eq('id', orderId);
        
        // type 7 edita el mensaje, borra la tarjeta y deja la confirmación
        return Response.json({ 
          type: 7, 
          data: { 
            content: `✅ **ORDEN #${orderId.slice(0,8)} ENTREGADA EXITOSAMENTE**`, 
            components: [], 
            embeds: [] 
          } 
        });
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    return new Response('Internal Server Error', { status: 500 });
  }
}