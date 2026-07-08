"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { useCartStore } from '../../store/cartStore';
import { signIn, signOut, useSession } from 'next-auth/react';
import { ShoppingCart, Menu, X, LogOut, Package, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

type Order = {
  id: string;
  created_at: string;
  gamer_id: string;
  total_price: number;
  status: string;
  items: any[];
};

export default function MisPedidosPage() {
  const { data: session, status } = useSession();
  const totalItemsCart = useCartStore((state) => state.totalItems());
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function fetchOrders() {
      if (session?.user?.email) {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('user_email', session.user.email)
          .order('created_at', { ascending: false }); // Los más recientes primero

        if (!error && data) {
          setOrders(data);
        }
      }
      setLoading(false);
    }

    if (status === "authenticated") {
      fetchOrders();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [session, status]);

  // Función para darle color al estado del pedido
  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDIENTE':
        return <span className="flex items-center gap-1.5 bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-yellow-500/20"><Clock size={14} /> Pendiente</span>;
      case 'COMPLETADO':
      case 'PAGADO':
      case 'ENTREGADO':
        return <span className="flex items-center gap-1.5 bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-green-500/20"><CheckCircle2 size={14} /> Entregado</span>;
      case 'CANCELADO':
        return <span className="flex items-center gap-1.5 bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-red-500/20"><AlertCircle size={14} /> Cancelado</span>;
      default:
        return <span className="bg-gray-500/10 text-gray-400 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-gray-500/20">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-500 selection:text-[#050505]">
      
      {/* BARRA DE NAVEGACIÓN GLOBAL */}
      <header className="flex flex-col md:flex-row md:items-center justify-between p-4 md:px-8 border-b border-white/5 bg-[#050505]/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center justify-between w-full md:w-auto">
          <Link href="/" className="flex items-center gap-3 group">
  <img 
    src="/kitsonkit.png" 
    alt="Logo Kitson Kit" 
    className="w-10 h-10 rounded-full border-2 border-transparent group-hover:border-orange-500 transition duration-300 object-cover" 
  />
  <span className="text-2xl font-black tracking-tighter text-white transition group-hover:opacity-80 hidden sm:block">
    Kitson <span className="text-orange-500">Kit</span>
  </span>
</Link>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden text-gray-400">
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
        
        <nav className={`${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row gap-6 mt-6 md:mt-0 font-medium text-sm text-gray-400 w-full md:w-auto items-center`}>
          <Link href="/" className="hover:text-orange-400 transition">Inicio</Link>
          <Link href="/#catalogo" className="hover:text-orange-400 transition">Catálogo</Link>
          <Link href="/tienda-diaria" className="hover:text-orange-400 transition">Tienda Fortnite</Link>
          <Link href="/#soporte" className="hover:text-orange-400 transition">Soporte</Link>
        </nav>

        <div className={`${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row items-center gap-4 mt-6 md:mt-0 w-full md:w-auto`}>
          <Link href="/carrito" className="flex items-center gap-2 hover:bg-white/5 transition bg-white/5 py-2 px-5 rounded-full border border-white/10 w-full md:w-auto justify-center">
            <ShoppingCart size={18} className="text-orange-500" /> 
            <span className="bg-orange-500 text-[#050505] text-xs font-black px-2 py-0.5 rounded-full">{totalItemsCart}</span>
          </Link>
          {session ? (
            <div className="flex items-center gap-3 bg-white/5 py-1.5 px-1.5 pr-4 rounded-full border border-white/10 w-full md:w-auto justify-center">
              <div className="flex items-center gap-2 cursor-pointer">
                <img src={session.user?.image || ""} alt="Avatar" className="w-8 h-8 rounded-full border border-orange-500/50" />
                <span className="text-sm font-bold text-gray-200">{session.user?.name}</span>
              </div>
              <button onClick={() => signOut()} className="text-red-400 hover:text-red-300 ml-2 border-l border-white/10 pl-3"><LogOut size={16}/></button>
            </div>
          ) : (
            <button onClick={() => signIn('discord')} className="bg-[#5865F2] hover:bg-[#4752C4] text-white w-full md:w-auto text-sm px-6 py-2.5 rounded-full font-black transition">
              Discord Login
            </button>
          )}
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-5xl mx-auto w-full px-6 py-12 md:py-20">
        <div className="flex items-center gap-4 mb-10 border-b border-white/5 pb-6">
          <Package size={40} className="text-orange-500" />
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">Mis Pedidos</h1>
            <p className="text-gray-400 text-sm mt-1">Historial de tus compras y recargas en Kitson Kit</p>
          </div>
        </div>

        {status === "unauthenticated" ? (
          <div className="bg-[#0A0A0A] border border-white/5 p-10 rounded-3xl text-center">
            <h2 className="text-xl font-bold mb-4">Inicia sesión para ver tus pedidos</h2>
            <button onClick={() => signIn('discord')} className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-8 py-3 rounded-xl font-black transition">
              Iniciar Sesión con Discord
            </button>
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 size={48} className="animate-spin text-orange-500" />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-[#0A0A0A] border border-white/5 p-12 rounded-3xl text-center flex flex-col items-center">
            <Package size={64} strokeWidth={1} className="text-gray-600 mb-6" />
            <h2 className="text-2xl font-bold mb-2">Aún no tienes pedidos</h2>
            <p className="text-gray-500 mb-8 max-w-md">Cuando realices una compra, aparecerá aquí junto con su estado de entrega.</p>
            <Link href="/#catalogo" className="bg-orange-500 hover:bg-orange-400 text-[#050505] px-8 py-3 rounded-full font-black transition shadow-[0_0_15px_rgba(249,115,22,0.3)]">
              Explorar Catálogo
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-[#0A0A0A] border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition">
                
                {/* Cabecera de la Orden */}
                <div className="bg-[#111] p-5 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Orden #{order.id.split('-')[0]}</p>
                      <p className="text-sm font-medium text-gray-300">
                        {new Date(order.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Cuenta Destino</p>
                      <p className="text-sm font-bold text-white">{order.gamer_id}</p>
                    </div>
                    <div className="h-10 w-px bg-white/10 hidden sm:block"></div>
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                {/* Lista de productos en la orden */}
                <div className="p-5">
                  <div className="space-y-3">
                    {order.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#151515] rounded-lg overflow-hidden flex-shrink-0">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a]"><Package size={20} className="text-gray-500" /></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-sm text-gray-200">{item.name}</p>
                          <p className="text-xs text-gray-500">Cantidad: {item.quantity}</p>
                        </div>
                        <div className="font-bold text-sm text-gray-300">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 pt-4 border-t border-white/5 flex justify-between items-center">
                    <span className="text-gray-400 font-medium text-sm">Total pagado</span>
                    <span className="text-xl font-black text-orange-500">${order.total_price.toFixed(2)} USD</span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}