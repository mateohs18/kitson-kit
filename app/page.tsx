"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '../store/cartStore';
import { supabase } from '../lib/supabase';
import { ShoppingCart, Gamepad2, PackageSearch } from 'lucide-react';

export default function Home() {
  const addToCart = useCartStore((state) => state.addToCart);
  const totalItems = useCartStore((state) => state.totalItems());
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    async function fetchProducts() {
      const { data } = await supabase.from('products').select('*');
      if (data) setProducts(data);
    }
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans">
      {/* NAVBAR UNIFICADA */}
      <nav className="flex items-center justify-between p-6 border-b border-white/5 bg-[#050505]">
        <Link href="/" className="text-2xl font-black">Kitson <span className="text-orange-500">Kit</span></Link>
        <div className="flex items-center gap-6 text-sm font-medium text-gray-400">
          <Link href="/" className="hover:text-white">Inicio</Link>
          <Link href="#catalogo" className="hover:text-white">Catálogo</Link>
          <Link href="/tienda-diaria" className="hover:text-white">Tienda Fortnite</Link>
        </div>
        <Link href="/carrito" className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
          <ShoppingCart size={18} />
          <span className="font-bold">{totalItems}</span>
        </Link>
      </nav>

      {/* HERO */}
      <section className="py-20 text-center">
        <h1 className="text-6xl font-black mb-4">Sube de nivel con <span className="text-orange-500">Kitson Kit</span></h1>
        <p className="text-gray-400 mb-8">Recargas y cosméticos seguros.</p>
        <Link href="#catalogo" className="bg-orange-500 text-black px-8 py-3 rounded-full font-bold">Ver Catálogo</Link>
      </section>

      {/* CATÁLOGO */}
      <section id="catalogo" className="max-w-7xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold mb-8 flex items-center gap-2"><PackageSearch /> Ofertas Destacadas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {products.map((p) => (
            <div key={p.id} className="bg-[#0A0A0A] p-4 rounded-2xl border border-white/10">
              <div className="aspect-square bg-[#151515] rounded-xl mb-4 flex items-center justify-center">
                {p.image_url ? <img src={p.image_url} className="w-full h-full object-cover rounded-xl" /> : <Gamepad2 size={40} className="text-gray-700" />}
              </div>
              <h3 className="font-bold">{p.name}</h3>
              <p className="text-orange-500 font-black mb-4">${p.price}</p>
              <button onClick={() => addToCart(p)} className="w-full bg-white/5 py-2 rounded-lg font-bold hover:bg-orange-500 transition">Añadir</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}