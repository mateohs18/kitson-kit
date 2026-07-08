"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '../store/cartStore';
import { useCurrencyStore } from '../store/currencyStore';
import CurrencySelector from '../components/CurrencySelector';
import { signIn, signOut, useSession } from 'next-auth/react';
import { supabase } from '../lib/supabase';
import { 
  ShoppingCart, Gamepad2, Zap, ShieldCheck, LogOut, 
  PackageSearch, Menu, X, Star, Users, Flame, BellRing
} from 'lucide-react';

interface Product { id: string; name: string; price: number; image_url?: string; }

export default function Home() {
  const addToCart = useCartStore((state) => state.addToCart);
  const totalItemsCount = useCartStore((state) => state.totalItems());
  const { getActiveConfig } = useCurrencyStore();
  const activeCurrency = getActiveConfig();
  const { data: session } = useSession();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({ totalOrders: 0, averageRating: "5.0", totalReviews: 0 });

  // EFECTO DINÁMICO DE COMPRAS EN VIVO (ESTILO PEEKSTORE)
  const [livePurchase, setLivePurchase] = useState<{name: string, item: string} | null>(null);

  useEffect(() => {
    async function fetchData() {
      const { data: productsData } = await supabase.from('products').select('*');
      if (productsData) setProducts(productsData);

      const { count: ordersCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
      const { data: reviewsData } = await supabase.from('reviews').select('*').order('created_at', { ascending: false }).limit(6);
      
      let avg = 5.0; let revCount = 0;
      if (reviewsData && reviewsData.length > 0) {
        setReviews(reviewsData);
        revCount = reviewsData.length;
        avg = reviewsData.reduce((acc, curr) => acc + curr.rating, 0) / revCount;
      }
      setStats({ totalOrders: (ordersCount || 0) + 150, averageRating: avg.toFixed(1), totalReviews: revCount });
      setLoading(false);
    }
    fetchData();

    // Simular compras en vivo cada 8 segundos
    const interval = setInterval(() => {
      const names = ['Carlos_Gamer', 'Alejandro', 'Luisa_FTN', 'Santi123', 'Mati_pro', 'JoseX'];
      const items = ['Club de Fortnite', '1000 Pavos', 'Pack de Inicio', '2800 Pavos', 'Pase de Batalla'];
      setLivePurchase({
        name: names[Math.floor(Math.random() * names.length)],
        item: items[Math.floor(Math.random() * items.length)]
      });
      setTimeout(() => setLivePurchase(null), 4000); // Lo esconde después de 4 seg
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-500 overflow-hidden relative">
      
      {/* FRANJA ANIMADA (MARQUEE) TOP */}
      <div className="bg-orange-500 text-black py-1.5 overflow-hidden flex whitespace-nowrap font-black text-xs uppercase tracking-[0.2em] relative z-[101]">
        <div className="animate-marquee flex gap-12">
          <span>🔥 Entrega en 5 minutos</span><span>⚡ 100% Seguro y sin riesgo de ban</span><span>💎 Precios exclusivos</span>
          <span>🔥 Entrega en 5 minutos</span><span>⚡ 100% Seguro y sin riesgo de ban</span><span>💎 Precios exclusivos</span>
          <span>🔥 Entrega en 5 minutos</span><span>⚡ 100% Seguro y sin riesgo de ban</span><span>💎 Precios exclusivos</span>
          <span>🔥 Entrega en 5 minutos</span><span>⚡ 100% Seguro y sin riesgo de ban</span><span>💎 Precios exclusivos</span>
        </div>
      </div>

      <div className="fixed top-[10%] left-[-10%] w-[60%] h-[60%] bg-orange-600/10 rounded-full blur-[150px] pointer-events-none z-0"></div>

      <header className="flex items-center justify-between p-4 md:px-8 border-b border-white/5 bg-[#050505]/90 backdrop-blur-xl sticky top-0 z-[100]">
        <div className="flex-1 flex justify-start">
          <Link href="/" className="flex items-center gap-3 group">
            <img src="/logo.jpg" alt="Logo" className="w-10 h-10 rounded-full border border-white/10 group-hover:shadow-[0_0_15px_rgba(249,115,22,0.5)] transition duration-300" />
            <span className="text-2xl font-black text-white hidden xl:block">Kitson <span className="text-orange-500">Kit</span></span>
          </Link>
        </div>
        
        <nav className="hidden lg:flex flex-1 justify-center gap-8 font-bold text-sm text-gray-400">
          <Link href="/" className="text-white">Inicio</Link>
          <Link href="#catalogo" className="hover:text-white transition">Catálogo</Link>
          <Link href="/tienda-diaria" className="hover:text-white transition">Tienda Fortnite</Link>
          <Link href="/mis-pedidos" className="hover:text-white transition">Mis Pedidos</Link>
        </nav>

        <div className="flex-1 flex items-center justify-end gap-3 md:gap-4">
          <div className="hidden sm:block"><CurrencySelector /></div>
          <Link href="/carrito" className="flex items-center gap-2 hover:bg-white/10 transition bg-white/5 py-2 px-4 rounded-full border border-white/10">
            <ShoppingCart size={18} className="text-orange-500" /> 
            <span className="bg-orange-500 text-black text-xs font-black px-2 py-0.5 rounded-full">{totalItemsCount}</span>
          </Link>

          {session ? (
            <div className="hidden sm:flex items-center gap-3 bg-white/5 py-1.5 px-1.5 pr-4 rounded-full border border-white/10">
              <Link href="/mis-pedidos" className="flex items-center gap-2 hover:opacity-80 transition">
                <img src={session.user?.image || ""} alt="Avatar" className="w-8 h-8 rounded-full" />
                <span className="text-sm font-bold text-gray-200">{session.user?.name}</span>
              </Link>
              <button onClick={() => signOut()} className="text-red-400 hover:text-red-300 ml-2 border-l border-white/10 pl-3"><LogOut size={16}/></button>
            </div>
          ) : (
            <button onClick={() => signIn('discord')} className="hidden sm:block bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm px-6 py-2.5 rounded-full font-black shadow-lg">Login</button>
          )}
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden text-gray-400 ml-1 p-2"><Menu size={28} /></button>
        </div>
      </header>

      {/* NOTIFICACIÓN FLOTANTE DE COMPRA EN VIVO */}
      <div className={`fixed bottom-6 left-6 z-[120] glass-panel p-4 rounded-2xl flex items-center gap-4 border-l-4 border-l-orange-500 shadow-2xl transition-all duration-500 ${livePurchase ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
        <div className="bg-orange-500/20 p-2 rounded-full"><BellRing size={20} className="text-orange-500 animate-bounce" /></div>
        <div>
          <p className="text-sm text-gray-300"><span className="font-bold text-white">{livePurchase?.name}</span> acaba de comprar</p>
          <p className="text-sm font-black text-orange-400">{livePurchase?.item}</p>
        </div>
      </div>

      <main className="relative flex flex-col items-center justify-center text-center px-6 py-24 md:py-36 z-10">
        <div className="relative z-10 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel mb-8 border border-white/10 text-orange-500">
            <Flame size={14} className="animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest">Tienda Nº1 en Seguridad</span>
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-[1.1] tracking-tight drop-shadow-2xl">
            Sube de Nivel <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Al Instante</span>
          </h1>
          <p className="text-lg text-gray-400 mb-10 max-w-xl font-medium">Automatizamos tus recargas de Fortnite para que no tengas que esperar. Precios justos, entrega récord.</p>
          <div className="flex gap-4">
            <Link href="#catalogo" className="bg-orange-500 hover:bg-orange-400 text-black px-8 py-4 rounded-full font-black text-lg transition-all shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:shadow-[0_0_50px_rgba(249,115,22,0.6)] hover:-translate-y-1">
              Ver Catálogo
            </Link>
            <Link href="/tienda-diaria" className="glass-panel hover:bg-white/10 text-white px-8 py-4 rounded-full font-black text-lg transition-all hover:-translate-y-1">
              Tienda Diaria
            </Link>
          </div>
        </div>
      </main>

      <section id="catalogo" className="max-w-7xl mx-auto px-6 py-16 relative z-10">
        <div className="flex items-center gap-3 mb-10">
          <PackageSearch className="text-orange-500" size={32} />
          <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-wider">Ofertas Exclusivas</h2>
        </div>

        {loading ? (
          <div className="flex justify-center p-20"><Gamepad2 size={48} className="animate-spin text-orange-500" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p) => {
              const localPrice = (p.price * activeCurrency.rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              return (
                <div key={p.id} className="group glass-panel rounded-3xl p-1 overflow-hidden transition-all duration-500 hover:shadow-[0_0_30px_rgba(249,115,22,0.15)] hover:border-orange-500/30 cursor-pointer">
                  <div className="bg-[#0A0A0A] p-5 rounded-[22px] h-full flex flex-col relative z-10">
                    <div className="aspect-square bg-[#111] rounded-xl mb-5 flex items-center justify-center overflow-hidden relative">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} loading="lazy" decoding="async" className="w-full h-full object-cover transform group-hover:scale-110 transition duration-700" />
                      ) : <Gamepad2 size={48} className="text-gray-700" />}
                    </div>
                    <div className="flex-1 flex flex-col justify-end">
                      <h3 className="font-bold text-lg mb-1 leading-tight text-white group-hover:text-orange-400 transition-colors">{p.name}</h3>
                      <div className="flex items-end gap-1 mb-5">
                        <p className="text-white font-black text-2xl">{activeCurrency.symbol}{localPrice}</p>
                        <span className="text-gray-500 text-xs font-bold mb-1">{activeCurrency.currency}</span>
                      </div>
                      <button onClick={() => addToCart(p)} className="w-full bg-white/5 hover:bg-orange-500 text-white hover:text-black py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2">
                        <ShoppingCart size={18} /> Añadir al carrito
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
      
      {/* SECCIÓN ESTADÍSTICAS */}
      <section className="glass-panel border-y border-white/10 relative z-10 py-12 my-10">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/5 max-w-7xl mx-auto">
          <div className="text-center"><span className="text-4xl font-black text-white">+{stats.totalOrders}</span><p className="text-xs text-orange-500 font-bold tracking-widest mt-1">ÓRDENES</p></div>
          <div className="text-center"><span className="text-4xl font-black text-white">&lt; 5m</span><p className="text-xs text-orange-500 font-bold tracking-widest mt-1">ENTREGA</p></div>
          <div className="text-center"><span className="text-4xl font-black text-white">100%</span><p className="text-xs text-orange-500 font-bold tracking-widest mt-1">SEGURO</p></div>
          <div className="text-center"><span className="text-4xl font-black text-white">{stats.averageRating}</span><p className="text-xs text-orange-500 font-bold tracking-widest mt-1">ESTRELLAS</p></div>
        </div>
      </section>

      {/* FOOTER BÁSICO */}
      <footer className="bg-[#050505] py-10 px-6 border-t border-white/5 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Kitson Kit. Todos los derechos reservados. Operamos de forma independiente a Epic Games.</p>
      </footer>
    </div>
  );
}