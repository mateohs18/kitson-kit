"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '../../store/cartStore';
import { signIn, signOut, useSession } from 'next-auth/react';
import { supabase } from '../../lib/supabase';
import { ShoppingCart, Gamepad2, Zap, ShieldCheck, Headphones, LogOut } from 'lucide-react';

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
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) console.error("Error al cargar productos:", error);
      else if (data) setProducts(data);
      
      setLoading(false);
    }
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-500 selection:text-white">
      
      {/* NAVEGACIÓN */}
      <header className="flex flex-col md:flex-row md:items-center justify-between p-4 md:px-8 border-b border-white/5 bg-[#050505]/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center justify-between w-full md:w-auto">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition group">
            <img src="/logo.jpg" alt="Logo" className="w-10 h-10 rounded-full border-2 border-transparent group-hover:border-orange-500 transition duration-300 object-cover" />
            <span className="text-2xl font-black tracking-tighter">Kitson <span className="text-orange-500">Kit</span></span>
          </Link>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden text-gray-400 text-2xl">
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
        
        <nav className={`${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row gap-6 mt-6 md:mt-0 text-sm text-gray-400 items-center`}>
          <Link href="/" className="hover:text-orange-400 transition">Inicio</Link>
          <Link href="#catalogo" className="hover:text-orange-400 transition">Catálogo</Link>
          <Link href="/tienda-diaria" className="hover:text-orange-400 transition">Tienda Fortnite</Link>
        </nav>

        <div className={`${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row items-center gap-4 mt-6 md:mt-0`}>
          <Link href="/carrito" className="flex items-center gap-2 bg-white/5 py-2 px-5 rounded-full border border-white/10">
            <ShoppingCart size={18} />
            <span className="bg-orange-500 text-[#050505] text-xs font-black px-2 py-0.5 rounded-full">{totalItems}</span>
          </Link>
          {session ? (
            <div className="flex items-center gap-3 bg-white/5 py-1.5 px-3 rounded-full border border-white/10">
              <span className="text-sm font-bold">{session.user?.name}</span>
              <button onClick={() => signOut()} className="text-red-400"><LogOut size={16} /></button>
            </div>
          ) : (
            <button onClick={() => signIn('discord')} className="bg-orange-500 text-[#050505] px-6 py-2.5 rounded-full font-black text-sm">Ingresar</button>
          )}
        </div>
      </header>

      {/* HERO */}
      <main className="relative flex flex-col items-center justify-center text-center px-4 py-32">
        <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">Sube de nivel con <br/><span className="text-orange-500">Kitson Kit</span></h1>
        <p className="text-lg text-gray-400 mb-10 max-w-2xl">Recargas digitales, V-Bucks y suscripciones al mejor precio.</p>
        <Link href="#catalogo" className="bg-orange-500 text-[#050505] px-8 py-4 rounded-full font-black text-lg transition hover:scale-105">Ver Catálogo</Link>
      </main>

      {/* CARACTERÍSTICAS */}
      <section className="border-y border-white/5 py-16 grid grid-cols-1 md:grid-cols-3 gap-10 max-w-7xl mx-auto px-6 text-center">
        <div className="flex flex-col items-center"><Zap className="text-orange-500 mb-4" size={32} /> <h3 className="font-bold">Entrega Instantánea</h3></div>
        <div className="flex flex-col items-center"><ShieldCheck className="text-orange-500 mb-4" size={32} /> <h3 className="font-bold">Pagos Seguros</h3></div>
        <div className="flex flex-col items-center"><Headphones className="text-orange-500 mb-4" size={32} /> <h3 className="font-bold">Soporte Dedicado</h3></div>
      </section>

      {/* CATÁLOGO */}
      <section id="catalogo" className="max-w-7xl mx-auto px-6 py-24">
        <h2 className="text-4xl font-black mb-12">🔥 Ofertas Destacadas</h2>
        {loading ? (
          <div className="flex justify-center p-20"><div className="animate-spin text-orange-500"><Gamepad2 size={48} /></div></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <div key={p.id} className="bg-[#0A0A0A] p-5 rounded-3xl border border-white/5 hover:border-orange-500/50 transition">
                <div className="aspect-square bg-[#151515] rounded-2xl mb-4 flex items-center justify-center">
                  {p.image_url ? <img src={p.image_url} className="w-full h-full object-cover rounded-2xl" /> : <Gamepad2 size={48} className="text-gray-600" />}
                </div>
                <h3 className="font-bold mb-2">{p.name}</h3>
                <p className="text-2xl font-black mb-4">${p.price}</p>
                <button onClick={() => addToCart(p)} className="w-full bg-white/5 hover:bg-orange-500 hover:text-black py-3 rounded-xl font-bold transition">Añadir al carrito</button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}