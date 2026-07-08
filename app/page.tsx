"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '../store/cartStore';
import { signIn, signOut, useSession } from 'next-auth/react';
import { supabase } from '../lib/supabase';
import { ShoppingCart, Gamepad2, Zap, ShieldCheck, Headphones, LogOut, PackageSearch, Menu, X } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url?: string;
}

export default function Home() {
  const addToCart = useCartStore((state) => state.addToCart);
  const totalItems = useCartStore((state) => state.totalItems());
  const { data: session } = useSession();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase.from('products').select('*');
      if (!error && data) setProducts(data);
      setLoading(false);
    }
    fetchProducts();
  }, []);

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
          <Link href="/" className="text-white transition">Inicio</Link>
          <Link href="#catalogo" className="hover:text-orange-400 transition">Catálogo</Link>
          <Link href="/tienda-diaria" className="hover:text-orange-400 transition">Tienda Fortnite</Link>
          <Link href="#soporte" className="hover:text-orange-400 transition">Soporte</Link>
        </nav>

        <div className={`${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row items-center gap-4 mt-6 md:mt-0 w-full md:w-auto`}>
          <Link href="/carrito" className="flex items-center gap-2 hover:bg-white/5 transition bg-white/5 py-2 px-5 rounded-full border border-white/10 w-full md:w-auto justify-center">
            <ShoppingCart size={18} className="text-orange-500" /> 
            <span className="bg-orange-500 text-[#050505] text-xs font-black px-2 py-0.5 rounded-full">{totalItems}</span>
          </Link>
          {session ? (
            <div className="flex items-center gap-3 bg-white/5 py-1.5 px-1.5 pr-4 rounded-full border border-white/10 w-full md:w-auto justify-center">
              <img src={session.user?.image || ""} alt="Avatar" className="w-8 h-8 rounded-full border border-orange-500/50" />
              <span className="text-sm font-bold text-gray-200">{session.user?.name}</span>
              <button onClick={() => signOut()} className="text-red-400 hover:text-red-300 ml-2"><LogOut size={18}/></button>
            </div>
          ) : (
            <button onClick={() => signIn('discord')} className="bg-[#5865F2] hover:bg-[#4752C4] text-white w-full md:w-auto text-sm px-6 py-2.5 rounded-full font-black transition">
              Discord Login
            </button>
          )}
        </div>
      </header>

      {/* HERO SECTION */}
      <main className="relative flex flex-col items-center justify-center text-center px-6 py-24 md:py-32">
        <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight tracking-tight">
          Sube de nivel con <br/><span className="text-orange-500">Kitson Kit</span>
        </h1>
        <p className="text-lg text-gray-400 mb-10 max-w-2xl">
          Tu billetera, tus reglas. Recarga y compra cosméticos sin recargos sorpresa y con entrega segura.
        </p>
        <Link href="#catalogo" className="bg-orange-500 hover:bg-orange-400 text-[#050505] px-8 py-4 rounded-full font-black text-lg transition shadow-[0_0_20px_rgba(249,115,22,0.3)]">
          Explorar Catálogo
        </Link>
      </main>

      {/* CARACTERÍSTICAS */}
      <section className="border-y border-white/5 py-16 bg-[#080808]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto px-6 text-center">
          <div className="flex flex-col items-center">
            <div className="bg-orange-500/10 p-4 rounded-full mb-4 text-orange-500"><Zap size={32} /></div>
            <h3 className="font-bold text-lg mb-2">Entrega Inmediata</h3>
            <p className="text-sm text-gray-400">Tus recargas en cuestión de segundos tras confirmar el pago.</p>
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

      {/* CATÁLOGO DE PRODUCTOS */}
      <section id="catalogo" className="max-w-7xl mx-auto px-6 py-24">
        <div className="flex items-center gap-3 mb-12 border-b border-white/5 pb-4">
          <PackageSearch className="text-orange-500" size={32} />
          <h2 className="text-3xl font-black">Ofertas Destacadas</h2>
        </div>

        {loading ? (
          <div className="flex justify-center p-20"><Gamepad2 size={48} className="animate-spin text-orange-500" /></div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-[#0A0A0A] rounded-3xl border border-white/5">
            <p className="text-gray-500 font-medium">El catálogo se está actualizando. Vuelve pronto.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <div key={p.id} className="bg-[#0A0A0A] p-5 rounded-3xl border border-white/5 hover:border-orange-500/40 hover:bg-[#111] transition duration-300 group flex flex-col">
                <div className="aspect-square bg-[#151515] rounded-2xl mb-5 flex items-center justify-center overflow-hidden relative">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  ) : (
                    <Gamepad2 size={64} strokeWidth={1} className="text-gray-700" />
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-end">
                  <h3 className="font-bold text-lg mb-1 leading-tight text-gray-100">{p.name}</h3>
                  <div className="flex items-end gap-1 mb-5">
                    <p className="text-orange-500 font-black text-2xl">${p.price}</p>
                    <span className="text-gray-500 text-xs font-bold mb-1">USD</span>
                  </div>
                  <button onClick={() => addToCart(p)} className="w-full bg-white/5 hover:bg-orange-500 text-white hover:text-[#050505] py-3 rounded-xl font-bold transition duration-300">
                    Añadir al carrito
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}