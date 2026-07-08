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
  PackageSearch, Menu, X
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url?: string;
}

export default function Home() {
  const addToCart = useCartStore((state) => state.addToCart);
  const totalItemsCount = useCartStore((state) => state.totalItems());
  
  const { getActiveConfig } = useCurrencyStore();
  const activeCurrency = getActiveConfig();

  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase.from('products').select('*');
      if (data) setProducts(data);
      setLoading(false);
    }
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-500 overflow-hidden">
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* NAVBAR CENTRADA PERFECTAMENTE */}
      <header className="flex items-center justify-between p-4 md:px-8 border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl sticky top-0 z-50">
        
        {/* IZQUIERDA: Logo */}
        <div className="flex-1 flex justify-start">
          <Link href="/" className="flex items-center gap-3 group">
            <img src="/logo.jpg" alt="Logo Kitson Kit" className="w-10 h-10 rounded-full border border-white/10 group-hover:border-orange-500 transition duration-300 object-cover" />
            <span className="text-2xl font-black tracking-tighter text-white transition group-hover:opacity-80 hidden xl:block">
              Kitson <span className="text-orange-500">Kit</span>
            </span>
          </Link>
        </div>
        
        {/* CENTRO: Links de Navegación */}
        <nav className="hidden lg:flex flex-1 justify-center gap-8 font-medium text-sm text-gray-400">
          <Link href="/" className="hover:text-white transition">Inicio</Link>
          <Link href="#catalogo" className="hover:text-white transition">Catálogo</Link>
          <Link href="/tienda-diaria" className="hover:text-white transition">Tienda Fortnite</Link>
          <Link href="#soporte" className="hover:text-white transition">Soporte</Link>
        </nav>

        {/* DERECHA: Moneda, Carrito y Login */}
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
              <button onClick={() => signOut()} className="text-red-400 hover:text-red-300 ml-2 border-l border-white/10 pl-3">Salir</button>
            </div>
          ) : (
            <button onClick={() => signIn('discord')} className="hidden sm:block bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm px-6 py-2.5 rounded-full font-black transition">
              Login
            </button>
          )}

          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden text-gray-400 ml-2">
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </header>

      {/* MENÚ MÓVIL (Se despliega si tocas el icono de hamburguesa) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[#111] border-b border-white/10 flex flex-col p-6 gap-6 absolute w-full z-40">
          <Link href="/" className="text-lg font-bold">Inicio</Link>
          <Link href="#catalogo" className="text-lg font-bold">Catálogo</Link>
          <Link href="/tienda-diaria" className="text-lg font-bold">Tienda Fortnite</Link>
          <Link href="#soporte" className="text-lg font-bold">Soporte</Link>
          <div className="pt-4 border-t border-white/10"><CurrencySelector /></div>
          {!session && (
            <button onClick={() => signIn('discord')} className="bg-[#5865F2] text-white text-center py-3 rounded-xl font-black">
              Iniciar sesión con Discord
            </button>
          )}
        </div>
      )}

      {/* HERO SECTION */}
      <main className="relative flex flex-col items-center justify-center text-center px-6 py-20 z-10">
        <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tight drop-shadow-2xl">
          Sube de nivel con <span className="text-orange-500">Kitson Kit</span>
        </h1>
        <p className="text-lg text-gray-400 mb-10">Recargas y cosméticos seguros.</p>
        <Link href="#catalogo" className="bg-orange-500 hover:bg-orange-400 text-[#050505] px-8 py-3 rounded-full font-black text-lg transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)]">
          Ver Catálogo
        </Link>
      </main>

      {/* LAS 3 CARACTERÍSTICAS RESTAURADAS */}
      <section id="soporte" className="border-y border-white/5 bg-[#080808]/50 backdrop-blur-lg relative z-10 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto px-6 text-center">
          <div className="flex flex-col items-center">
            <div className="bg-orange-500/10 p-4 rounded-full mb-4 text-orange-500"><Zap size={32} /></div>
            <h3 className="font-bold text-lg mb-2">Entrega Instantánea</h3>
            <p className="text-sm text-gray-400">Recibe tus recargas en cuestión de segundos tras confirmar el pago.</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="bg-orange-500/10 p-4 rounded-full mb-4 text-orange-500"><ShieldCheck size={32} /></div>
            <h3 className="font-bold text-lg mb-2">Pagos Seguros</h3>
            <p className="text-sm text-gray-400">Transacciones protegidas y cifradas de extremo a extremo.</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="bg-orange-500/10 p-4 rounded-full mb-4 text-orange-500"><Headphones size={32} /></div>
            <h3 className="font-bold text-lg mb-2">Soporte Dedicado</h3>
            <p className="text-sm text-gray-400">Estamos en Discord para ayudarte ante cualquier inconveniente.</p>
          </div>
        </div>
      </section>

      {/* CATÁLOGO DINÁMICO */}
      <section id="catalogo" className="max-w-7xl mx-auto px-6 py-24 relative z-10">
        <div className="flex items-center gap-3 mb-12">
          <PackageSearch className="text-white" size={28} />
          <h2 className="text-3xl md:text-4xl font-black">Ofertas Destacadas</h2>
        </div>

        {loading ? (
          <div className="flex justify-center p-20"><Gamepad2 size={48} className="animate-spin text-orange-500" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p) => {
              const localPrice = (p.price * activeCurrency.rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              return (
                <div key={p.id} className="bg-[#0A0A0A] rounded-2xl p-4 border border-white/5 hover:border-white/10 transition">
                  <div className="aspect-square bg-[#111] rounded-xl mb-4 flex items-center justify-center overflow-hidden">
                    {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> : <Gamepad2 size={48} className="text-[#1a1a1a]" />}
                  </div>
                  <h3 className="font-bold text-white mb-1">{p.name}</h3>
                  <p className="text-orange-500 font-black mb-4">{activeCurrency.symbol}{localPrice}</p>
                  <button onClick={() => addToCart(p)} className="w-full bg-[#151515] hover:bg-[#222] text-gray-300 py-3 rounded-xl font-bold transition">
                    Añadir al carrito
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