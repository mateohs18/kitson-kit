"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { ShieldAlert, CheckCircle2, Clock, Package, Wallet, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminPanel() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para la recarga de saldo
  const [emailSaldo, setEmailSaldo] = useState("");
  const [montoSaldo, setMontoSaldo] = useState("");
  const [loadingSaldo, setLoadingSaldo] = useState(false);

  // La verificación real de admin ya se hace en middleware.ts (servidor).
  // Este chequeo es solo para no mostrar el panel un instante mientras
  // carga la sesión, o si por algo se llega a esta ruta sin pasar por el middleware.
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/');
      return;
    }
    fetchTodasLasOrdenes();
  }, [session, status, router]);

  async function fetchTodasLasOrdenes() {
    const res = await fetch('/api/pedidos-admin');
    if (res.ok) {
      const data = await res.json();
      setOrders(data.orders);
    }
    setLoading(false);
  }

  async function marcarComoEntregado(id: string) {
    const res = await fetch('/api/marcar-entregado', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: id }),
    });
    const data = await res.json();
    if (res.ok) {
      fetchTodasLasOrdenes();
      alert("¡Pedido entregado! El cliente recibirá su correo.");
    } else {
      alert("Error al actualizar: " + data.error);
    }
  }

  // NUEVA FUNCIÓN: Agregar Saldo
  async function agregarSaldo() {
    if (!emailSaldo || !montoSaldo) return alert("Por favor, llena el correo y el monto.");
    setLoadingSaldo(true);

    const res = await fetch('/api/agregar-saldo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailSaldo, montoSaldo }),
    });
    const data = await res.json();

    if (res.ok) {
      alert(`✅ ¡Recarga exitosa!\nEl nuevo saldo de ${emailSaldo} es de $${data.nuevoSaldo.toFixed(2)} USD.`);
      setEmailSaldo("");
      setMontoSaldo("");
    } else {
      alert("❌ " + data.error);
    }
    setLoadingSaldo(false);
  }

  if (loading) return <div className="min-h-screen bg-[#14110C] flex justify-center items-center"><Package className="animate-spin text-[#E3A23D]" size={48}/></div>;

  return (
    <div className="min-h-screen bg-[#14110C] text-[#F5F1E6] font-body p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-10">

        <div className="flex items-center gap-4 border-b-4 border-[#0A0806] pb-6">
          <ShieldAlert size={40} className="text-[#E3A23D]" />
          <div>
            <h1 className="font-display text-4xl font-bold">Centro de Mando</h1>
            <p className="text-[#9A9384]">Acceso restringido: nivel administrador</p>
          </div>
        </div>

        {/* GESTOR DE BILLETERA */}
        <div className="kk-panel p-8 rounded-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Wallet className="text-[#E3A23D]" size={28} />
            <h2 className="font-display text-2xl font-bold">Recargar billetera</h2>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="email" placeholder="Correo del cliente (ej: gamer@gmail.com)"
              value={emailSaldo} onChange={(e) => setEmailSaldo(e.target.value)}
              className="flex-1 bg-[#14110C] border-2 border-[#0A0806] rounded-xl px-4 py-3 focus:border-[#E3A23D] focus:outline-none text-[#F5F1E6] font-medium"
            />
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A9384] font-black">$</span>
              <input
                type="number" placeholder="0.00"
                value={montoSaldo} onChange={(e) => setMontoSaldo(e.target.value)}
                className="w-full md:w-32 bg-[#14110C] border-2 border-[#0A0806] rounded-xl pl-8 pr-4 py-3 focus:border-[#E3A23D] focus:outline-none text-[#F5F1E6] font-bold"
              />
            </div>
            <button
              onClick={agregarSaldo} disabled={loadingSaldo}
              className="bg-[#E3A23D] hover:bg-[#f0b458] disabled:opacity-40 text-[#0A0806] px-6 py-3 rounded-xl font-display font-bold flex items-center justify-center gap-2 border-[3px] border-[#0A0806] transition-transform hover:scale-[1.02]"
            >
              {loadingSaldo ? <Package className="animate-spin" size={20} /> : <Plus size={20} />}
              Añadir saldo
            </button>
          </div>
        </div>

        {/* PEDIDOS */}
        <div className="kk-panel rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[640px]">
            <thead className="bg-[#14110C] border-b-2 border-[#0A0806] text-[#9A9384] text-sm uppercase tracking-wider">
              <tr>
                <th className="p-4">ID pedido</th>
                <th className="p-4">Cliente</th>
                <th className="p-4">Monto</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {orders.map(order => {
                const isDelivered = order.status?.toUpperCase().includes('ENTREGAD');
                return (
                  <tr key={order.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-mono text-xs text-[#9A9384]">{order.id.slice(0,8)}...</td>
                    <td className="p-4 font-bold">{order.user_email}</td>
                    <td className="p-4 font-mono font-semibold text-[#E3A23D]">${order.total_price.toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 w-fit border ${isDelivered ? 'bg-[#7BC77E]/10 text-[#7BC77E] border-[#7BC77E]/30' : 'bg-[#E3A23D]/10 text-[#E3A23D] border-[#E3A23D]/30'}`}>
                        {isDelivered ? <CheckCircle2 size={14}/> : <Clock size={14}/>}
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {!isDelivered ? (
                        <button onClick={() => marcarComoEntregado(order.id)} className="bg-[#E3A23D] hover:bg-[#f0b458] text-[#0A0806] px-4 py-2 rounded-lg font-display font-bold text-sm border-2 border-[#0A0806] transition-transform hover:scale-105">
                          Entregar
                        </button>
                      ) : (
                        <span className="text-[#5A554A] font-bold text-sm">Completado</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>

      </div>
    </div>
  );
}
