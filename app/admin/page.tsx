"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { supabase } from '../../lib/supabase';
import { ShieldAlert, CheckCircle2, Clock, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminPanel() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔴 CAMBIA ESTO POR TU CORREO REAL DE DISCORD
  const ADMIN_EMAIL = "mateo1810hoyos@gmail.com"; 

  useEffect(() => {
    if (status === 'loading') return;
    
    // Si no está logueado o no es el admin, lo pateamos al inicio
    if (!session || session.user?.email !== ADMIN_EMAIL) {
      router.push('/');
      return;
    }

    fetchTodasLasOrdenes();
  }, [session, status, router]);

  async function fetchTodasLasOrdenes() {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false }); // Las más nuevas primero
    
    if (data) setOrders(data);
    setLoading(false);
  }

  async function marcarComoEntregado(id: string) {
    // Actualizamos en Supabase
    const { error } = await supabase
      .from('orders')
      .update({ status: 'ENTREGADO' })
      .eq('id', id);

    if (!error) {
      // Recargamos la lista visualmente
      fetchTodasLasOrdenes();
      alert("¡Pedido entregado! El cliente recibirá su correo.");
    } else {
      alert("Error al actualizar: " + error.message);
    }
  }

  if (loading) return <div className="min-h-screen bg-[#050505] flex justify-center items-center"><Package className="animate-spin text-orange-500" size={48}/></div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-10 border-b border-white/10 pb-6">
          <ShieldAlert size={40} className="text-orange-500" />
          <div>
            <h1 className="text-4xl font-black">Centro de Mando</h1>
            <p className="text-gray-400">Acceso restringido: Nivel Administrador</p>
          </div>
        </div>

        <div className="bg-[#0A0A0A] rounded-2xl border border-white/5 overflow-hidden">
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
                    <td className="p-4 font-mono text-xs text-gray-500">{order.id}</td>
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
                        <button 
                          onClick={() => marcarComoEntregado(order.id)}
                          className="bg-orange-500 hover:bg-orange-400 text-black px-4 py-2 rounded-lg font-black text-sm transition-transform hover:scale-105"
                        >
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