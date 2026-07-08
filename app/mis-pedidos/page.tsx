"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '../../store/cartStore';
import { useCurrencyStore } from '../../store/currencyStore';
import CurrencySelector from '../../components/CurrencySelector';
import { supabase } from '../../lib/supabase';
import { signIn, signOut, useSession } from 'next-auth/react';
import { 
  ShoppingCart, Menu, X, LogOut, Package, 
  Clock, CheckCircle2, AlertTriangle, ExternalLink, Gamepad2
} from 'lucide-react';

export default function MisPedidos() {
  const totalItemsCount = useCartStore((state) => state.totalItems());
  const { data: session, status } = useSession();
  
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function fetchOrders() {
      if (session?.user?.email) {
        const { data } = await supabase
          .from('orders')
          .select('*')
          .eq('user_email', session.user.email)
          .order('created_at', { ascending: false });
        
        if (data) setOrders(data);
      }
      setLoading(false);
    }
    fetchOrders();
  }, [session]);

  const getStatusStyle = (status: string) => {
    switch(status.toUpperCase()) {
      case 'PENDIENTE': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'COMPLETADO': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'RECHAZADO': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status.toUpperCase()) {
      case 'PENDIENTE': return <Clock size={16} className="animate-pulse" />;
      case 'COMPLETADO': return <CheckCircle2 size={16} />;
      case 'RECHAZADO': return <AlertTriangle size={16} />;
      default: return <Package size={16} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-500">
      
      {/* NAVBAR UNIFICADA */}
      <header className="flex items-center justify-between p-4 md:px-8 border-b border-white/5 bg-[#050505]/95 backdrop-blur-xl sticky top-0 z-[100]">
        <Link href="/" className="flex items-center gap-3">
          <img src="/logo.jpg" alt="Logo Kitson Kit" className="w-10 h-10 rounded-full border border-white/10" />
          <span className="text-2xl font-black text-white hidden xl:block">Kitson <span className="text-orange-500">Kit</span></span>
        </Link>
        <nav className="hidden lg:flex flex-1 justify-center gap-8 font-medium text-sm text-gray-400">
          <Link href="/" className="hover:text-white transition">Inicio</Link>
          <Link href="/#catalogo" className="hover:text-white transition">Catálogo</Link>
          <Link href="/tienda-diaria" className="hover:text-white transition">Tienda Fortnite</Link>
        </nav>
        <div className="flex-1 flex items-center justify-end gap-4">
          <div className="hidden sm:block"><CurrencySelector /></div>
          <Link href="/carrito" className="flex items-center gap-2 hover:bg-white/10 transition bg-white/5 py-2 px-4 rounded-full border border-white/10">
            <ShoppingCart size={18} className="text-gray-400" /> 
            <span className="bg-orange-500 text-[#050505] text-xs font-black px-2 py-0.5 rounded-full">{totalItemsCount}</span>
          </Link>
          {session ? (
            <div className="hidden sm:flex items-center gap-3 bg-white/5 py-1.5 px-1.5 pr-4 rounded-full border border-white/10">
              <Link href="/mis-pedidos" className="flex items-center gap-2 hover:opacity-80 transition">
                <img src={session.user?.image || ""} alt="Avatar" className="w-8 h-8 rounded-full border border-orange-500/50" />
                <span className="text-sm font-bold text-gray-200">{session.user?.name}</span>
              </Link>
              <button onClick={() => signOut()} className="text-red-400 hover:text-red-300 ml-2 border-l border-white/10 pl-3"><LogOut size={16}/></button>
            </div>
          ) : (
            <button onClick={() => signIn('discord')} className="hidden sm:block bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm px-6 py-2.5 rounded-full font-black">Login</button>
          )}
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden text-gray-400 ml-1 p-2">
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </header>

      {/* CUERPO DEL DASHBOARD */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-end justify-between mb-10 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-4xl font-black mb-2 flex items-center gap-3"><Package className="text-orange-500" size={36}/> Mi Bóveda de Items</h1>
            <p className="text-gray-400">Revisa el estado de todas tus recargas y entregas.</p>
          </div>
        </div>

        {status === 'loading' || loading ? (
          <div className="flex flex-col items-center py-20"><Loader2 size={48} className="animate-spin text-orange-500 mb-4" /><p className="text-gray-500 font-bold tracking-widest">Sincronizando bóveda...</p></div>
        ) : !session ? (
          <div className="text-center py-24 glass-panel rounded-3xl">
            <Gamepad2 size={64} className="mx-auto text-gray-600 mb-4" />
            <h2 className="text-2xl font-bold mb-4">Inicia sesión para ver tus pedidos</h2>
            <button onClick={() => signIn('discord')} className="bg-[#5865F2] px-8 py-3 rounded-full font-black">Login con Discord</button>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-24 glass-panel rounded-3xl">
            <ShoppingCart size={64} className="mx-auto text-gray-600 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Aún no has hecho ninguna compra</h2>
            <Link href="/tienda-diaria" className="text-orange-500 hover:text-orange-400 font-bold transition">Explorar Tienda &rarr;</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {orders.map((order) => (
              <div key={order.id} className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-white/20 transition-all shadow-lg hover:shadow-orange-500/10">
                {/* Indicador de estado */}
                <div className={`absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-black tracking-wider ${getStatusStyle(order.status)}`}>
                  {getStatusIcon(order.status)} {order.status}
                </div>
                
                <p className="text-xs text-gray-500 mb-4 font-mono">Orden #{order.id?.slice(0,8).toUpperCase()}</p>
                
                <div className="space-y-3 mb-6 bg-[#111] p-4 rounded-xl">
                  {order.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span className="font-bold text-gray-300">{item.name} <span className="text-gray-600">x{item.quantity}</span></span>
                    </div>
                  ))}
                </div>

                <div className="flex items-end justify-between border-t border-white/5 pt-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Destino:</p>
                    <p className="font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md inline-block">{order.gamer_id}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-xl text-white">{order.local_price} <span className="text-xs text-gray-500">{order.local_currency}</span></p>
                    {order.payment_proof && (
                      <a href={order.payment_proof} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 justify-end mt-2">
                        Ver Comprobante <ExternalLink size={12}/>
                      </a>
                    )}
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