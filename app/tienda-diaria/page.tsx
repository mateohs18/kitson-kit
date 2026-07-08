"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '../../store/cartStore';
import { useCurrencyStore } from '../../store/currencyStore';
import CurrencySelector from '../../components/CurrencySelector';
import { signIn, signOut, useSession } from 'next-auth/react';
import { ShoppingCart, Menu, X, Gamepad2 } from 'lucide-react';

export default function TiendaFortnite() {
  const addToCart = useCartStore((state) => state.addToCart);
  const totalItemsCount = useCartStore((state) => state.totalItems());
  
  const { getActiveConfig } = useCurrencyStore();
  const activeCurrency = getActiveConfig();
  const { data: session } = useSession();

  const [groupedShop, setGroupedShop] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function fetchShop() {
      try {
        const response = await fetch('https://fortnite-api.com/v2/shop?language=es');
        const data = await response.json();
        if (data.status === 200 && data.data?.entries) {
          const groups: Record<string, any[]> = {};
          data.data.entries.forEach((entry: any) => {
            const sectionName = entry.layout?.name || entry.section?.name || 'Otras Ofertas';
            if (!groups[sectionName]) groups[sectionName] = [];
            groups[sectionName].push(entry);
          });
          setGroupedShop(groups);
        }
      } catch (error) {
        console.error('Error fetching shop:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchShop();
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col selection:bg-orange-500">
      
      {/* NAVBAR CENTRADA EXACTAMENTE IGUAL AL INICIO */}
      <header className="flex items-center justify-between p-4 md:px-8 border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex-1 flex justify-start">
          <Link href="/" className="flex items-center gap-3 group">
            <img src="/logo.jpg" alt="Logo Kitson Kit" className="w-10 h-10 rounded-full border border-white/10 group-hover:border-orange-500 transition duration-300 object-cover" />
            <span className="text-2xl font-black tracking-tighter text-white transition group-hover:opacity-80 hidden xl:block">
              Kitson <span className="text-orange-500">Kit</span>
            </span>
          </Link>
        </div>
        
        <nav className="hidden lg:flex flex-1 justify-center gap-8 font-medium text-sm text-gray-400">
          <Link href="/" className="hover:text-white transition">Inicio</Link>
          <Link href="/#catalogo" className="hover:text-white transition">Catálogo</Link>
          <Link href="/tienda-diaria" className="text-white transition">Tienda Fortnite</Link>
          <Link href="/#soporte" className="hover:text-white transition">Soporte</Link>
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

      {/* CUERPO DE LA TIENDA */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
        <h1 className="text-3xl font-black mb-10">Tienda de Fortnite</h1>
        {loading ? (
          <div className="flex justify-center items-center py-20"><Gamepad2 size={48} className="animate-spin text-orange-500" /></div>
        ) : (
          <div className="space-y-16 pb-24">
            {Object.entries(groupedShop).map(([sectionName, items]) => (
              <section key={sectionName}>
                <h2 className="text-xl font-black text-white uppercase tracking-wider mb-6 border-b border-white/5 pb-2">{sectionName}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {items.map((entry, idx) => {
                    const isBundle = !!entry.bundle;
                    const safeItems = [...(entry.brItems || []), ...(entry.tracks || []), ...(entry.instruments || []), ...(entry.cars || []), ...(entry.legoKits || []), ...(entry.items || [])];
                    const firstItem = safeItems[0];
                    const name = isBundle ? entry.bundle?.name : (firstItem?.name || firstItem?.title || 'Cosmético');
                    const imageUrl = isBundle ? entry.bundle?.image : (firstItem?.images?.featured || firstItem?.images?.icon || firstItem?.albumArt);
                    const id = firstItem?.id || `bundle-${idx}`;

                    if (!name || !imageUrl) return null;

                    // CONVERSIÓN DE PAVOS A DINERO REAL (Dividimos por 100 y aplicamos la moneda actual)
                    const baseUsdPrice = entry.finalPrice / 100;
                    const localPrice = (baseUsdPrice * activeCurrency.rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

                    return (
                      <div 
                        key={`${id}-${idx}`} 
                        className="bg-[#0A0A0A] rounded-2xl border border-white/5 hover:border-white/10 transition duration-300 group flex flex-col overflow-hidden relative cursor-pointer aspect-square"
                        onClick={() => addToCart({ id, name, price: baseUsdPrice, image_url: imageUrl })}
                      >
                        <div className="flex-1 w-full bg-[#111] relative flex items-center justify-center overflow-hidden p-4">
                          <img src={imageUrl} alt={name} className="w-full h-full object-contain group-hover:scale-105 transition duration-500" />
                        </div>
                        
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col justify-end">
                          <h3 className="font-bold text-white text-sm leading-tight uppercase truncate">{name}</h3>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-orange-500 font-black text-lg">{activeCurrency.symbol}{localPrice}</span>
                            <span className="text-gray-400 text-[10px] font-bold mt-0.5">{activeCurrency.currency}</span>
                          </div>
                        </div>
                        
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <span className="bg-orange-500 text-[#050505] text-sm font-black px-4 py-2 rounded-full">
                            Añadir al Carrito
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}