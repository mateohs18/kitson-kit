"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
// Rutas corregidas a ../../ para subir desde app/tienda-diaria hasta la raíz
import { useCartStore } from '../../store/cartStore'; 
import { supabase } from '../../lib/supabase';
import { signIn, signOut, useSession } from 'next-auth/react';
import { ShoppingCart, Gamepad2, LogOut } from 'lucide-react';

type FortniteItem = {
  id: string;
  name?: string;
  title?: string;
  type?: { displayValue: string };
  rarity?: { displayValue: string; value: string };
  series?: { name: string };
  images?: { icon?: string; featured?: string };
  albumArt?: string;
  artist?: string;
};

type FortniteEntry = {
  regularPrice: number;
  finalPrice: number;
  bundle?: { name: string; image: string };
  brItems?: FortniteItem[];
  tracks?: FortniteItem[];
  items?: FortniteItem[];
  layout?: { name: string };
  section?: { name: string };
};

export default function TiendaFortnite() {
  const addToCart = useCartStore((state) => state.addToCart);
  const totalItemsCart = useCartStore((state) => state.totalItems());
  const { data: session } = useSession();

  const [groupedShop, setGroupedShop] = useState<Record<string, FortniteEntry[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchShop() {
      try {
        const response = await fetch('https://fortnite-api.com/v2/shop?language=es');
        const data = await response.json();
        if (data.status === 200 && data.data?.entries) {
          const entries = data.data.entries as FortniteEntry[];
          const groups: Record<string, FortniteEntry[]> = {};
          entries.forEach((entry) => {
            const sectionName = entry.layout?.name || entry.section?.name || 'Otras Ofertas';
            if (!groups[sectionName]) groups[sectionName] = [];
            groups[sectionName].push(entry);
          });
          setGroupedShop(groups);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchShop();
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* NAVBAR GLOBAL */}
      <header className="flex justify-between items-center p-6 border-b border-white/5 bg-[#050505]/90 backdrop-blur-xl sticky top-0 z-50">
        <Link href="/" className="text-2xl font-black">Kitson <span className="text-orange-500">Kit</span></Link>
        <div className="flex items-center gap-4">
          <Link href="/carrito" className="bg-white/5 p-2 rounded-full"><ShoppingCart size={20}/></Link>
          {session ? (
            <button onClick={() => signOut()} className="text-red-400"><LogOut size={20}/></button>
          ) : (
            <button onClick={() => signIn('discord')} className="bg-orange-500 px-4 py-2 rounded-full font-bold text-sm text-black">Login</button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <h1 className="text-4xl font-black mb-12">Tienda de Hoy</h1>
        {loading ? (
          <div className="flex justify-center p-20"><Gamepad2 className="animate-spin" size={48} /></div>
        ) : (
          Object.entries(groupedShop).map(([section, entries]) => (
            <section key={section} className="mb-16">
              <h2 className="text-xl font-bold uppercase mb-6 text-gray-400">{section}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {entries.map((e, i) => {
                  const item = (e.brItems?.[0] || e.tracks?.[0] || e.items?.[0]);
                  const name = e.bundle?.name || item?.name || item?.title || 'Ítem';
                  const img = e.bundle?.image || item?.images?.featured || item?.images?.icon || item?.albumArt;
                  if (!img) return null;
                  return (
                    <div key={i} className="bg-[#111] p-4 rounded-2xl border border-white/5">
                      <img src={img} className="w-full aspect-square object-cover mb-4 rounded-lg" />
                      <h3 className="font-bold truncate">{name}</h3>
                      <p className="text-orange-500 font-black mb-3">${e.finalPrice}</p>
                      <button onClick={() => addToCart({ id: e.bundle?.name || item?.id || 'id', name, price: e.finalPrice, image_url: img })} className="w-full bg-white/10 py-2 rounded-lg font-bold hover:bg-orange-500">Añadir</button>
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </main>
    </div>
  );
}