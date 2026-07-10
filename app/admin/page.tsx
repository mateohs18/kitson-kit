"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { supabase } from '../../lib/supabase';
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
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (data) setOrders(data);
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

  if (loading) return <div className="min-h-screen bg-[#050505] flex justify-center items-center"><Package className="animate-spin text-orange-500" size={48}/></div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-10">
        
        <div className="flex items-center gap-4 border-b border-white/10 pb-6">
          <ShieldAlert size={40} className="text-orange-500" />
          <div>
            <h1 className="text-4xl font-black">Centro de Mando</h1>
            <p className="text-gray-400">Acceso restringido: Nivel Administrador</p>
          </div>
        </div>

        {/* NUEVA SECCIÓN: GESTOR DE BILLETERA */}
        <div className="bg-[#0A0A0A] p-8 rounded-2xl border border-white/5 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Wallet className="text-orange-500" size={28} />
            <h2 className="text-2xl font-black uppercase">Recargar Billetera</h2>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <input 
              type="email" placeholder="Correo del cliente (ej: gamer@gmail.com)" 
              value={emailSaldo} onChange={(e) => setEmailSaldo(e.target.value)}
              className="flex-1 bg-[#111] border border-white/10 rounded-xl px-4 py-3 focus:border-orange-500 focus:outline-none text-white font-medium"
            />
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-black">$</span>
              <input 
                type="number" placeholder="0.00" 
                value={montoSaldo} onChange={(e) => setMontoSaldo(e.target.value)}
                className="w-full md:w-32 bg-[#111] border border-white/10 rounded-xl pl-8 pr-4 py-3 focus:border-orange-500 focus:outline-none text-white font-bold"
              />
            </div>
            <button 
              onClick={agregarSaldo} disabled={loadingSaldo}
              className="bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-black px-6 py-3 rounded-xl font-black flex items-center justify-center gap-2 transition-transform hover:scale-105"
            >
              {loadingSaldo ? <Package className="animate-spin" size={20} /> : <Plus size={20} />}
              Añadir Saldo
            </button>
          </div>
        </div>

        {/* SECCIÓN ORIGINAL: PEDIDOS */}
        <div className="bg-[#0A0A0A] rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-[#111] border-b border-white/10 text-gray-400 text-sm uppercase tracking-wider">
              <tr>
                <th className="p-4">ID Pedido</th>
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
                    <td className="p-4 font-mono text-xs text-gray-500">{order.id.slice(0,8)}...</td>
                    <td className="p-4 font-bold">{order.user_email}</td>
                    <td className="p-4 text-orange-400 font-black">${order.total_price.toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 w-fit ${isDelivered ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                        {isDelivered ? <CheckCircle2 size={14}/> : <Clock size={14}/>}
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {!isDelivered ? (
                        <button onClick={() => marcarComoEntregado(order.id)} className="bg-orange-500 hover:bg-orange-400 text-black px-4 py-2 rounded-lg font-black text-sm transition-transform hover:scale-105">
                          Entregar
                        </button>
                      ) : (
                        <span className="text-gray-600 font-bold text-sm">Completado</span>
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
  );
}