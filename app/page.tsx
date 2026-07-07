"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '../store/cartStore';
import { signIn, signOut, useSession } from 'next-auth/react';
import { supabase } from '../lib/supabase';
import { ShoppingCart, Gamepad2, Zap, ShieldCheck, Headphones, LogOut, PackageSearch } from 'lucide-react';

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

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase.from('products').select('*');
      if (error) console.error("Error:", error);
      else if (data) setProducts(data);
      setLoading(false);
    }
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans">
      {/* NAVBAR */}
      <header className="flex justify-between items-center p-6 border-b border-white/5 bg-[#050505]/90 backdrop-blur-md sticky top-0 z-50">
        <Link href="/" className="text-2xl font-black">Kitson <span className="text-orange-500">Kit</span></Link>
        <div className="flex items-center gap-4">
          <Link href="/carrito" className="bg-white/5 p-2 rounded-full border border-white/10 flex items-center gap-2 px-4">
            <ShoppingCart size={18} />
            <span className="font-bold">{totalItems}</span>
          </Link>
          {session ? (
            <button onClick={() => signOut()} className="text-red-400"><LogOut size={20}/></button>
          ) : (
            <button onClick={() => signIn('discord')} className="bg-orange-500 text-black px-4 py-2 rounded-full font-bold text-sm">Login</button>
          )}
        </div>
      </header>

      {/* HERO */}
      <section className="py-24 text-center">
        <h1 className="text-6xl font-black mb-6">Sube de nivel con <span className="text-orange-500">Kitson Kit</span></h1>
        <p className="text-gray-400 text-lg mb-10">Recargas y cosméticos seguros.</p>
        <Link href="#catalogo" className="bg-orange-500 text-black px-8 py-4 rounded-full font-bold">Ver Catálogo</Link>
      </section>

      {/* CATÁLOGO */}
      <section id="catalogo" className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-black mb-10 flex items-center gap-3"><PackageSearch /> Ofertas Destacadas</h2>
        
        {loading ? (
          <div className="flex justify-center p-20"><Gamepad2 className="animate-spin text-orange-500" size={48} /></div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-[#0A0A0A] rounded-2xl border border-white/5">
             <p className="text-gray-500">No hay productos disponibles por ahora.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <div key={p.id} className="bg-[#0A0A0A] p-4 rounded-2xl border border-white/10 hover:border-orange-500 transition">
                <div className="aspect-square bg-[#151515] rounded-xl mb-4 flex items-center justify-center overflow-hidden">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <Gamepad2 size={64} className="text-gray-700" />
                  )}
                </div>
                <h3 className="font-bold text-lg mb-1">{p.name}</h3>
                <p className="text-orange-500 font-black text-xl mb-4">${p.price}</p>
                <button onClick={() => addToCart(p)} className="w-full bg-white/5 py-3 rounded-lg font-bold hover:bg-orange-500 transition">Añadir</button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}