"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '../store/cartStore';
import { useCurrencyStore, PAYMENT_OPTIONS } from '../store/currencyStore';
import { signIn, signOut, useSession } from 'next-auth/react';
import { supabase } from '../lib/supabase';
import { 
  ShoppingCart, Gamepad2, Zap, ShieldCheck, LogOut, 
  PackageSearch, Menu, X, Star, Users, ChevronDown, CreditCard, Globe
} from 'lucide-react';
import CurrencySelector from '@/components/CurrencySelector';
interface Product {
  id: string;
  name: string;
  price: number;
  image_url?: string;
}

export default function Home() {
  const addToCart = useCartStore((state) => state.addToCart);
  const totalItemsCount = useCartStore((state) => state.totalItems());
  
  const { selectedCountry, setCountry, getActiveConfig } = useCurrencyStore();
  const activeCurrency = getActiveConfig();

  const { data: session } = useSession();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const [stats, setStats] = useState({ totalOrders: 0, averageRating: "5.0", totalReviews: 0 });

  useEffect(() => {
    async function fetchData() {
      const { data: productsData } = await supabase.from('products').select('*');
      if (productsData) setProducts(productsData);

      const { count: ordersCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
      const { data: reviewsData } = await supabase.from('reviews').select('rating');
      
      let avg = 5.0; let revCount = 0;
      if (reviewsData && reviewsData.length > 0) {
        revCount = reviewsData.length;
        avg = reviewsData.reduce((acc, curr) => acc + curr.rating, 0) / revCount;
      }
      setStats({ totalOrders: (ordersCount || 0) + 150, averageRating: avg.toFixed(1), totalReviews: revCount });
      setLoading(false);
    }
    fetchData();
  }, []);

  const faqs = [
    { q: "¿Cuánto tiempo tarda en llegar mi recarga?", a: "El sistema automatizado procesa tu pedido. Al validarse en Supabase, la entrega suele tardar entre 1 y 5 minutos." },
    { q: "¿Qué métodos de pago aceptan?", a: "Aceptamos pagos manuales directos en tu moneda local: Binance, Yape, Nequi, Transferencia Bancaria y Oxxo." }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-500 overflow-hidden">
      
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <header className="flex flex-col md:flex-row md:items-center justify-between p-4 md:px-8 border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center justify-between w-full md:w-auto">
          <Link href="/" className="flex items-center gap-3 group">
            <img src="/logo.jpg" alt="Logo Kitson Kit" className="w-10 h-10 rounded-full border border-white/10 group-hover:border-orange-500 transition duration-300 object-cover" />
            <span className="text-2xl font-black tracking-tighter text-white transition group-hover:opacity-80 hidden sm:block">
              Kitson <span className="text-orange-500">Kit</span>
            </span>
          </Link>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden text-gray-400">
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
        
        <nav className={`${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row gap-6 mt-6 md:mt-0 font-medium text-sm text-gray-400 w-full md:w-auto items-center`}>
          <Link href="/" className="text-white transition">Inicio</Link>
          <Link href="#catalogo" className="hover:text-orange-400 transition">Catálogo</Link>
          <Link href="/tienda-diaria" className="hover:text-orange-400 transition">Tienda Fortnite</Link>
          
          <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
            <Globe size={16} className="text-orange-500" />
            <select 
              value={selectedCountry}
              onChange={(e) => setCountry(e.target.value)}
              className="bg-transparent text-white text-sm font-bold focus:outline-none cursor-pointer appearance-none outline-none"
            >
              {PAYMENT_OPTIONS.map(opt => (
                <option key={opt.id} value={opt.id} className="bg-[#111]">{opt.name} ({opt.currency})</option>
              ))}
            </select>
            <ChevronDown size={14} />
          </div>
        </nav>

        <div className={`${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row items-center gap-4 mt-6 md:mt-0 w-full md:w-auto`}>
          <Link href="/carrito" className="flex items-center gap-2 hover:bg-white/10 transition bg-white/5 py-2 px-5 rounded-full border border-white/10 w-full md:w-auto justify-center">
            <ShoppingCart size={18} className="text-orange-500" /> 
            <span className="bg-orange-500 text-[#050505] text-xs font-black px-2 py-0.5 rounded-full">{totalItemsCount}</span>
          </Link>
          {session ? (
            <div className="flex items-center gap-3 bg-white/5 py-1.5 px-1.5 pr-4 rounded-full border border-white/10 w-full md:w-auto justify-center">
              <Link href="/mis-pedidos" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition">
                <img src={session.user?.image || ""} alt="Avatar" className="w-8 h-8 rounded-full border border-orange-500/50" />
                <span className="text-sm font-bold text-gray-200">{session.user?.name}</span>
              </Link>
              <button onClick={() => signOut()} className="text-red-400 hover:text-red-300 ml-2 border-l border-white/10 pl-3"><LogOut size={16}/></button>
            </div>
          ) : (
            <button onClick={() => signIn('discord')} className="bg-[#5865F2] hover:bg-[#4752C4] text-white w-full md:w-auto text-sm px-6 py-2.5 rounded-full font-black transition shadow-[0_0_15px_rgba(88,101,242,0.3)]">
              Discord Login
            </button>
          )}
        </div>
      </header>

      <main className="relative flex flex-col items-center justify-center text-center px-6 py-24 md:py-32 z-10">
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-[1.1] tracking-tight drop-shadow-2xl">
          El Siguiente Nivel <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Para Tu Cuenta</span>
        </h1>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="#catalogo" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-[#050505] px-8 py-4 rounded-full font-black text-lg transition-all shadow-[0_0_30px_rgba(249,115,22,0.3)]">
            Explorar Catálogo
          </Link>
        </div>
      </main>

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
                <div key={p.id} className="group relative bg-[#0A0A0A] rounded-3xl p-1 overflow-hidden transition-all duration-500 hover:shadow-[0_0_30px_rgba(249,115,22,0.15)]">
                  <div className="absolute inset-0 bg-gradient-to-b from-orange-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative bg-[#0A0A0A] p-5 rounded-[22px] h-full flex flex-col z-10 border border-white/5">
                    <div className="aspect-square bg-[#111] rounded-2xl mb-5 flex items-center justify-center overflow-hidden relative border border-white/5">
                      {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover transform group-hover:scale-110 transition duration-700" /> : <Gamepad2 size={64} className="text-gray-700" />}
                    </div>
                    <div className="flex-1 flex flex-col justify-end">
                      <h3 className="font-bold text-lg mb-1 leading-tight text-gray-100">{p.name}</h3>
                      <div className="flex items-end gap-1 mb-5">
                        <p className="text-white font-black text-2xl">{activeCurrency.symbol}{localPrice}</p>
                        <span className="text-gray-500 text-xs font-bold mb-1">{activeCurrency.currency}</span>
                      </div>
                      <button onClick={() => addToCart(p)} className="w-full bg-white/5 hover:bg-orange-500 text-white hover:text-[#050505] py-3.5 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2">
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
    </div>
  );
}