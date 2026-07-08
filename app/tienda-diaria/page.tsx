"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '../../store/cartStore';
import { useCurrencyStore } from '../../store/currencyStore';
import CurrencySelector from '../../components/CurrencySelector';
import { signIn, signOut, useSession } from 'next-auth/react';
import { ShoppingCart, Menu, X, Gamepad2, LogOut, List, Search } from 'lucide-react';

const FortniteItemCard = ({ entry, activeCurrency, addToCart }: { entry: any, activeCurrency: any, addToCart: any }) => {
  const safeItems = [...(entry.brItems || []), ...(entry.tracks || []), ...(entry.instruments || []), ...(entry.cars || []), ...(entry.legoKits || []), ...(entry.items || [])];
  
  const isBundle = !!entry.bundle;
  let name = '';
  let displayImage = '';
  let rarityValue = 'common';

  if (isBundle) {
    name = entry.bundle.name || 'Lote';
    rarityValue = safeItems[0]?.rarity?.value || 'epic';
    displayImage = entry.bundle.image || entry.newDisplayAsset?.materialInstances?.[0]?.images?.OfferImage || safeItems[0]?.images?.icon;
  } else {
    const mainItem = safeItems.find((i: any) => i.type?.value === 'outfit') || safeItems[0];
    name = mainItem?.name || mainItem?.title || 'Cosmético';
    rarityValue = mainItem?.rarity?.value || 'common';
    displayImage = entry.newDisplayAsset?.materialInstances?.[0]?.images?.OfferImage || mainItem?.images?.featured || mainItem?.images?.icon || '';
  }

  if (!name || !displayImage) return null;

  const bgGradient = (() => {
    switch (rarityValue.toLowerCase()) {
      case 'legendary': return 'from-orange-600/60 to-transparent';
      case 'epic': return 'from-purple-600/60 to-transparent';
      case 'rare': return 'from-blue-500/60 to-transparent';
      case 'uncommon': return 'from-green-500/60 to-transparent';
      case 'marvel': return 'from-red-600/60 to-transparent';
      case 'starwars': return 'from-blue-800/60 to-transparent';
      case 'icon': return 'from-teal-400/60 to-transparent';
      default: return 'from-gray-600/60 to-transparent'; 
    }
  })();

  const baseUsdPrice = entry.finalPrice / 100;
  const localPrice = (baseUsdPrice * activeCurrency.rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div 
      className="bg-[#0f0f0f] rounded-xl border border-white/10 hover:border-white/30 transition duration-300 group flex flex-col overflow-hidden relative aspect-[4/5] shadow-lg cursor-pointer"
      onClick={() => addToCart({ id: entry.offerId || Math.random().toString(), name, price: baseUsdPrice, image_url: displayImage })}
    >
      <div className={`absolute inset-0 bg-gradient-to-t ${bgGradient} opacity-50`}></div>
      
      <div className="flex-1 w-full relative flex items-center justify-center z-10 overflow-hidden">
        <Image 
          src={displayImage} 
          alt={name} 
          width={500}
          height={500}
          className="w-full h-full object-contain transform group-hover:scale-110 transition-transform duration-500 drop-shadow-2xl scale-[1.15]" 
        />
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/90 to-transparent flex flex-col justify-end z-20 pointer-events-none">
        <h3 className="font-black text-white text-lg leading-tight uppercase italic truncate drop-shadow-md">{name}</h3>
        <div className="flex items-center gap-1 mt-1">
          <span className="text-white font-black text-xl">{activeCurrency.symbol}{localPrice}</span>
          <span className="text-gray-400 text-xs font-bold mt-1 uppercase">{activeCurrency.currency}</span>
        </div>
      </div>
      
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50">
        <button
          onClick={(e) => {
            e.stopPropagation();
            addToCart({ id: entry.offerId || Math.random().toString(), name, price: baseUsdPrice, image_url: displayImage });
          }}
          className="bg-orange-500 hover:bg-orange-400 text-black p-2.5 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.4)] hover:scale-110 transition-transform flex items-center justify-center"
          title="Añadir al carrito"
        >
          <ShoppingCart size={16} />
        </button>
      </div>
    </div>
  );
};

export default function TiendaFortnite() {
  const addToCart = useCartStore((state) => state.addToCart);
  const totalItemsCount = useCartStore((state) => state.totalItems());
  const { getActiveConfig } = useCurrencyStore();
  const activeCurrency = getActiveConfig();
  const { data: session } = useSession();

  const [groupedShop, setGroupedShop] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredShop = Object.entries(groupedShop).reduce((acc, [section, items]) => {
    const filteredItems = items.filter(entry => {
      const searchLower = searchTerm.toLowerCase();
      const isBundle = !!entry.bundle;
      const safeItems = [...(entry.brItems || []), ...(entry.tracks || []), ...(entry.instruments || []), ...(entry.cars || []), ...(entry.legoKits || []), ...(entry.items || [])];
      const name = isBundle ? entry.bundle?.name : (safeItems[0]?.name || safeItems[0]?.title || '');
      return name?.toLowerCase().includes(searchLower);
    });
    
    if (filteredItems.length > 0) acc[section] = filteredItems;
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col selection:bg-orange-500 scroll-smooth">
      <header className="flex items-center justify-between p-4 md:px-8 border-b border-white/5 bg-[#050505]/95 backdrop-blur-xl sticky top-0 z-[100]">
        <div className="flex-1 flex justify-start">
          <Link href="/" className="flex items-center gap-3 group">
            <Image src="/logo.jpg" alt="Logo Kitson Kit" width={40} height={40} className="rounded-full border border-white/10 group-hover:border-orange-500 transition duration-300 object-cover" />
            <span className="text-2xl font-black text-white hidden xl:block">Kitson <span className="text-orange-500">Kit</span></span>
          </Link>
        </div>
        
        <nav className="hidden lg:flex flex-1 justify-center gap-8 font-medium text-sm text-gray-400">
          <Link href="/" className="hover:text-white transition">Inicio</Link>
          <Link href="/#catalogo" className="hover:text-white transition">Catálogo</Link>
          <Link href="/tienda-diaria" className="text-white transition">Tienda Fortnite</Link>
          <Link href="/billetera" className="hover:text-white transition">Mi Billetera</Link>
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
                <img src={session.user?.image || ""} alt="Avatar" className="w-8 h-8 rounded-full" />
              </Link>
              <button onClick={() => signOut()} className="text-red-400 hover:text-red-300 ml-2 border-l border-white/10 pl-3"><LogOut size={16}/></button>
            </div>
          ) : (
            <button onClick={() => signIn('discord')} className="hidden sm:block bg-[#5865F2] hover:bg-[#4752C4] px-6 py-2 rounded-full font-black text-sm">Login</button>
          )}

          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden text-gray-400 ml-1 p-2">
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[#0A0A0A] border-t border-white/10 flex flex-col p-6 gap-6 fixed top-[73px] bottom-0 left-0 w-full z-[90] overflow-y-auto">
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-white border-b border-white/5 pb-4">Inicio</Link>
          <Link href="/#catalogo" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-white border-b border-white/5 pb-4">Catálogo</Link>
          <Link href="/tienda-diaria" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-white border-b border-white/5 pb-4">Tienda Fortnite</Link>
          <Link href="/billetera" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-white border-b border-white/5 pb-4">Mi Billetera</Link>
          <div className="pt-2"><CurrencySelector /></div>
        </div>
      )}

      <main className="flex-1 p-6 md:p-10 max-w-[1600px] mx-auto w-full flex flex-col md:flex-row gap-10">
        
        {!loading && Object.keys(groupedShop).length > 0 && (
          <aside className="hidden md:block w-72 shrink-0">
            <div className="sticky top-28 space-y-6">
              
              <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-2 relative shadow-lg">
                <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input 
                  type="text" placeholder="Buscar cosmético..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#111] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-orange-500/50 font-medium transition-colors"
                />
              </div>

              <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6 shadow-2xl">
                <h3 className="text-white font-black text-lg mb-6 flex items-center gap-2 uppercase tracking-wider">
                  <List size={20} className="text-orange-500"/> Secciones
                </h3>
                <ul className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {Object.keys(filteredShop).map((section) => (
                    <li key={section}>
                      <a href={`#${section.replace(/\s+/g, '-')}`} className="text-gray-400 hover:text-white hover:text-orange-500 hover:pl-2 transition-all font-bold text-sm block">
                        {section}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>
        )}

        <div className="flex-1">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-40">
              <Gamepad2 size={64} className="animate-spin text-orange-500 mb-4" />
              <h2 className="text-2xl font-black uppercase italic tracking-widest text-gray-400 animate-pulse">Cargando Tienda...</h2>
            </div>
          ) : Object.keys(filteredShop).length === 0 ? (
            <div className="flex flex-col justify-center items-center py-40 bg-[#0A0A0A] rounded-3xl border border-white/5">
              <Search size={64} className="text-gray-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-300">No se encontraron cosméticos</h2>
              <p className="text-gray-500 mt-2">Intenta buscar con otro nombre.</p>
              <button onClick={() => setSearchTerm('')} className="mt-6 text-orange-500 font-bold hover:underline">Limpiar búsqueda</button>
            </div>
          ) : (
            <div className="space-y-20 pb-24">
              {Object.entries(filteredShop).map(([sectionName, items]) => (
                <section key={sectionName} id={sectionName.replace(/\s+/g, '-')} className="relative scroll-mt-28">
                  <div className="flex items-center gap-6 mb-8">
                    <h2 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-widest drop-shadow-md">{sectionName}</h2>
                    <div className="flex-1 h-1 bg-gradient-to-r from-white/20 to-transparent rounded-full"></div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                    {items.map((entry, idx) => (
                      <FortniteItemCard 
                        key={`${entry.bundle?.name || idx}-${idx}`} 
                        entry={entry} 
                        activeCurrency={activeCurrency} 
                        addToCart={addToCart} 
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}