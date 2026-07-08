"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '../../store/cartStore';
import { signIn, signOut, useSession } from 'next-auth/react';
import { ShoppingCart, Menu, X, LogOut, Gamepad2 } from 'lucide-react';

type FortniteItem = {
  id: string;
  name?: string;
  title?: string;
  artist?: string;
  type?: { displayValue: string };
  rarity?: { displayValue: string; value: string };
  series?: { name: string };
  images?: { icon?: string; featured?: string };
  albumArt?: string; 
};

type FortniteEntry = {
  regularPrice: number;
  finalPrice: number;
  bundle?: { name: string; image: string };
  brItems?: FortniteItem[];
  tracks?: FortniteItem[];
  instruments?: FortniteItem[];
  cars?: FortniteItem[];
  legoKits?: FortniteItem[];
  items?: FortniteItem[];
  layout?: { name: string };
  section?: { name: string };
};

export default function TiendaFortnite() {
  const addToCart = useCartStore((state) => state.addToCart);
  const totalItemsCart = useCartStore((state) => state.totalItems());
  const { data: session } = useSession();

  const [groupedShop, setGroupedShop] = useState<Record<string, FortniteEntry[]>>({});
  const [totalItemsShop, setTotalItemsShop] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function fetchShop() {
      try {
        const response = await fetch('https://fortnite-api.com/v2/shop?language=es');
        const data = await response.json();

        if (data.status === 200 && data.data?.entries) {
          const entries = data.data.entries as FortniteEntry[];
          const groups: Record<string, FortniteEntry[]> = {};
          let count = 0;
          
          entries.forEach((entry) => {
            const sectionName = entry.layout?.name || entry.section?.name || 'Otras Ofertas';
            if (!groups[sectionName]) groups[sectionName] = [];
            groups[sectionName].push(entry);
            count++;
          });

          setGroupedShop(groups);
          setTotalItemsShop(count);
          setActiveCategory(Object.keys(groups)[0] || ''); 
        } else {
          setErrorMsg('No se pudo cargar la tienda desde la API.');
        }
      } catch (error) {
        setErrorMsg('Error de conexión con la API.');
      } finally {
        setLoading(false);
      }
    }
    fetchShop();
  }, []);

  const today = new Date();
  const dateString = today.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col selection:bg-orange-500 selection:text-[#050505]">
      
      {/* BARRA DE NAVEGACIÓN GLOBAL (Idéntica al Home y Carrito) */}
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
          <Link href="/" className="hover:text-orange-400 transition">Inicio</Link>
          <Link href="/#catalogo" className="hover:text-orange-400 transition">Catálogo</Link>
          <Link href="/tienda-diaria" className="text-white transition">Tienda Fortnite</Link>
          <Link href="/#soporte" className="hover:text-orange-400 transition">Soporte</Link>
        </nav>

        <div className={`${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row items-center gap-4 mt-6 md:mt-0 w-full md:w-auto`}>
          <Link href="/carrito" className="flex items-center gap-2 hover:bg-white/5 transition bg-white/5 py-2 px-5 rounded-full border border-white/10 w-full md:w-auto justify-center">
            <ShoppingCart size={18} className="text-orange-500" /> 
            <span className="bg-orange-500 text-[#050505] text-xs font-black px-2 py-0.5 rounded-full">{totalItemsCart}</span>
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

      {/* CUERPO DE LA TIENDA */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        
        {/* SIDEBAR CATEGORÍAS */}
        <aside className="w-full md:w-72 bg-[#050505] border-r border-white/5 p-6 flex-shrink-0 md:h-[calc(100vh-80px)] md:overflow-y-auto no-scrollbar hidden md:block">
          <div className="mb-8">
            <h1 className="text-3xl font-black tracking-tight mb-1">Tienda de Hoy</h1>
            <p className="text-gray-400 text-xs capitalize">{dateString} · {totalItemsShop} ítems</p>
          </div>

          <h3 className="text-gray-500 text-xs font-bold tracking-widest uppercase mb-4">Categorías</h3>
          
          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4,5,6].map(i => <div key={i} className="h-8 bg-white/5 rounded-lg animate-pulse"></div>)}
            </div>
          ) : (
            <nav className="space-y-1">
              <button 
                onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setActiveCategory('Todos'); }}
                className={`w-full flex justify-between items-center px-4 py-2.5 rounded-xl text-sm font-medium transition ${activeCategory === 'Todos' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'text-gray-300 hover:bg-white/5'}`}
              >
                <span>Todos</span>
                <span className="bg-white/10 px-2 py-0.5 rounded-full text-xs">{totalItemsShop}</span>
              </button>

              {Object.entries(groupedShop).map(([name, items]) => (
                <button 
                  key={name}
                  onClick={() => { setActiveCategory(name); document.getElementById(`section-${name}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                  className={`w-full flex justify-between items-center px-4 py-2.5 rounded-xl text-sm font-medium transition ${activeCategory === name ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'text-gray-300 hover:bg-white/5'}`}
                >
                  <span className="truncate pr-2 text-left">{name}</span>
                  <span className={`${activeCategory === name ? 'bg-orange-500/30 text-white' : 'bg-white/10'} px-2 py-0.5 rounded-full text-xs`}>{items.length}</span>
                </button>
              ))}
            </nav>
          )}
        </aside>

        {/* PRODUCTOS */}
        <main className="flex-1 p-6 md:p-10 md:h-[calc(100vh-80px)] md:overflow-y-auto">
          {errorMsg ? (
            <div className="flex justify-center py-20 text-red-500 font-bold">{errorMsg}</div>
          ) : loading ? (
            <div className="flex justify-center items-center h-full">
              <Gamepad2 size={48} className="animate-spin text-orange-500" />
            </div>
          ) : (
            <div className="space-y-16 max-w-7xl mx-auto pb-24">
              {Object.entries(groupedShop).map(([sectionName, items]) => (
                <section key={sectionName} id={`section-${sectionName}`} className="scroll-mt-24">
                  
                  <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-xl font-black text-white uppercase tracking-wider">{sectionName}</h2>
                    <span className="bg-white/10 text-gray-300 px-2.5 py-0.5 rounded-full text-xs font-bold">{items.length}</span>
                    <div className="h-px bg-white/10 flex-grow ml-2"></div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {items.map((entry, idx) => {
                      const isBundle = !!entry.bundle;
                      const safeItems = [...(entry.brItems || []), ...(entry.tracks || []), ...(entry.instruments || []), ...(entry.cars || []), ...(entry.legoKits || []), ...(entry.items || [])];
                      const firstItem = safeItems[0];
                      
                      const itemName = firstItem?.name || firstItem?.title || 'Cosmético Desconocido';
                      const name = isBundle ? entry.bundle?.name : itemName;
                      const imageUrl = isBundle ? entry.bundle?.image : (firstItem?.images?.featured || firstItem?.images?.icon || firstItem?.albumArt);
                      const id = firstItem?.id || `bundle-${idx}`;

                      const rarityLabel = firstItem?.series?.name || firstItem?.rarity?.displayValue || 'COMÚN';
                      const itemType = firstItem?.artist ? firstItem.artist : (firstItem?.type?.displayValue || 'COSMÉTICO');

                      if (!name || !imageUrl) return null;

                      return (
                        <div 
                          key={`${id}-${idx}`} 
                          className={`bg-[#0A0A0A] rounded-2xl border border-white/5 hover:border-orange-500/40 hover:bg-[#111] transition duration-300 group flex flex-col overflow-hidden relative cursor-pointer ${isBundle ? 'sm:col-span-2 sm:row-span-2 aspect-video sm:aspect-auto' : 'aspect-square'}`}
                          onClick={() => addToCart({ id, name, price: entry.finalPrice, image_url: imageUrl })}
                        >
                          <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-10 pointer-events-none">
                            <span className="bg-white/90 text-black text-[10px] font-black uppercase px-2 py-1 rounded-md shadow-md backdrop-blur-sm">{rarityLabel}</span>
                            {isBundle && <span className="bg-orange-500 text-[#050505] text-[10px] font-black uppercase px-2 py-1 rounded-md shadow-md">LOTE</span>}
                          </div>

                          <div className="flex-1 w-full bg-[#111] relative flex items-center justify-center overflow-hidden">
                            <img src={imageUrl} alt={name} className={`w-full h-full object-cover group-hover:scale-105 transition duration-500 ${firstItem?.albumArt ? 'scale-100' : ''}`} />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-transparent"></div>
                          </div>
                          
                          <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col justify-end z-10 pointer-events-none">
                            <h3 className="font-black text-white text-lg leading-tight uppercase tracking-wide truncate shadow-black drop-shadow-md">{name}</h3>
                            <span className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1 truncate shadow-black drop-shadow-md">{isBundle ? 'CONJUNTO' : itemType}</span>
                            
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-white font-black text-sm">${entry.finalPrice}</span>
                              <span className="text-gray-400 text-[10px] font-bold ml-0.5 mt-0.5">USD</span>
                            </div>
                          </div>
                          
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20">
                            <span className="bg-orange-500 text-[#050505] font-black px-6 py-2.5 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-[0_0_20px_rgba(249,115,22,0.4)]">
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
    </div>
  );
}