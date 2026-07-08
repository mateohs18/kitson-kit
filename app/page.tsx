"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '../store/cartStore';
import { useCurrencyStore } from '../store/currencyStore';
import CurrencySelector from '../components/CurrencySelector';
import { signIn, signOut, useSession } from 'next-auth/react';
import { supabase } from '../lib/supabase';
import { 
  ShoppingCart, Gamepad2, Zap, ShieldCheck, Headphones, LogOut, 
  PackageSearch, Menu, X, Star, Users, Wallet
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
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-500 overflow-hidden relative">
      
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <header className="flex items-center justify-between p-4 md:px-8 border-b border-white/5 bg-[#050505]/95 backdrop-blur-xl sticky top-0 z-[100]">
        <div className="flex-1 flex justify-start">
          <Link href="/" className="flex items-center gap-3 group">
            <img src="/logo.jpg" alt="Logo Kitson Kit" className="w-10 h-10 rounded-full border border-white/10 group-hover:border-orange-500 transition duration-300 object-cover" />
            <span className="text-2xl font-black text-white hidden xl:block">Kitson <span className="text-orange-500">Kit</span></span>
          </Link>
        </div>
        
        <nav className="hidden lg:flex flex-1 justify-center gap-8 font-medium text-sm text-gray-400">
          <Link href="/" className="hover:text-white transition">Inicio</Link>
          <Link href="#catalogo" className="hover:text-white transition">Catálogo</Link>
          <Link href="/tienda-diaria" className="hover:text-white transition">Tienda Fortnite</Link>
          <Link href="/billetera" className="hover:text-white transition">Mi Billetera</Link>
        </nav>

        <div className="flex-1 flex items-center justify-end gap-4">
          <div className="hidden sm:block"><CurrencySelector /></div>
          <Link href="/carrito" className="flex items-center gap-2 hover:bg-white/10 transition bg-white/5 py-2 px-4 rounded-full border border-white/10">
            <ShoppingCart size={18} className="text-gray-400" /> 
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
            <button onClick={() => signIn('discord')} className="hidden sm:block bg-[#5865F2] px-6 py-2 rounded-full font-black text-sm">Login</button>
          )}
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden text-gray-400 ml-1 p-2"><Menu size={28} /></button>
        </div>
      </header>

      <main className="relative flex flex-col items-center justify-center text-center px-6 py-24 md:py-36 z-10 overflow-hidden">
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]"></div>
          <div className="absolute w-[600px] h-[300px] bg-orange-600/10 blur-[120px] rounded-full"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-[1.1] tracking-tight drop-shadow-2xl">
            El Siguiente Nivel <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Para Tu Cuenta</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl font-medium">
            Adquiere cosméticos exclusivos, recargas y suscripciones de forma automatizada, segura y sin riesgo de ban.
          </p>
          <div className="flex gap-4">
            <Link href="#catalogo" className="bg-gradient-to-r from-orange-500 to-orange-600 text-black px-8 py-4 rounded-full font-black text-lg transition-all hover:scale-105">
              Explorar Catálogo
            </Link>
          </div>
        </div>
      </main>

      {/* SECCIÓN CARACTERÍSTICAS LÍMPIA */}
      <section className="border-y border-white/5 bg-[#080808]/50 relative z-10 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto px-6 text-center">
          <div className="flex flex-col items-center">
            <div className="bg-orange-500/10 p-4 rounded-full mb-4 text-orange-500"><Zap size={32} /></div>
            <h3 className="font-bold text-lg mb-2">Entrega Inmediata</h3>
            <p className="text-sm text-gray-400">Verificamos tu pago y entregamos tus items rápidamente.</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="bg-orange-500/10 p-4 rounded-full mb-4 text-orange-500"><Wallet size={32} /></div>
            <h3 className="font-bold text-lg mb-2">Billetera Virtual</h3>
            <p className="text-sm text-gray-400">Recarga saldo en tu cuenta y compra al instante sin esperas.</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="bg-orange-500/10 p-4 rounded-full mb-4 text-orange-500"><Headphones size={32} /></div>
            <h3 className="font-bold text-lg mb-2">Soporte Dedicado</h3>
            <p className="text-sm text-gray-400">Nuestro equipo en Discord está listo para ayudarte en todo.</p>
          </div>
        </div>
      </section>

      <section id="catalogo" className="max-w-7xl mx-auto px-6 py-24 relative z-10">
        <div className="flex items-center gap-3 mb-12">
          <PackageSearch className="text-orange-500" size={28} />
          <h2 className="text-3xl md:text-4xl font-black">Ofertas Exclusivas</h2>
        </div>

        {loading ? (
          <div className="flex justify-center p-20"><Gamepad2 size={48} className="animate-spin text-orange-500" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p) => {
              const localPrice = (p.price * activeCurrency.rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              return (
                <div key={p.id} className="group bg-[#0A0A0A] rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-all">
                  <div className="aspect-square bg-[#111] rounded-xl mb-5 flex items-center justify-center overflow-hidden">
                    {p.image_url ? <img src={p.image_url} alt={p.name} loading="lazy" decoding="async" className="w-full h-full object-cover transform group-hover:scale-110 transition duration-700" /> : <Gamepad2 size={64} className="text-gray-700" />}
                  </div>
                  <h3 className="font-bold text-lg mb-1 text-gray-100">{p.name}</h3>
                  <div className="flex items-end gap-1 mb-5">
                    <p className="text-white font-black text-2xl">{activeCurrency.symbol}{localPrice}</p>
                    <span className="text-gray-500 text-xs font-bold mb-1">{activeCurrency.currency}</span>
                  </div>
                  <button onClick={() => addToCart(p)} className="w-full bg-white/5 hover:bg-orange-500 text-white hover:text-black py-3.5 rounded-xl font-bold transition flex items-center justify-center gap-2">
                    <ShoppingCart size={18} /> Añadir
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}