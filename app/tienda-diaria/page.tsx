"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '../../store/cartStore';
import { useCurrencyStore } from '../../store/currencyStore';
import CurrencySelector from '../../components/CurrencySelector';
import { signIn, signOut, useSession } from 'next-auth/react';
import { ShoppingCart, Menu, X, Gamepad2, LogOut, List, Search } from 'lucide-react';

const rarityMeta: Record<string, { label: string; className: string }> = {
  legendary: { label: 'Legendario', className: 'bg-[#E3A23D] text-[#0A0806]' },
  epic: { label: 'Épico', className: 'bg-[#4A93D6] text-[#0C2438]' },
  rare: { label: 'Raro', className: 'bg-[#6B7D91] text-[#F5F1E6]' },
  uncommon: { label: 'Poco común', className: 'bg-[#6FA85A] text-[#0A0806]' },
  marvel: { label: 'Marvel', className: 'bg-[#C24A3D] text-[#F5F1E6]' },
  starwars: { label: 'Star Wars', className: 'bg-[#3B5B8C] text-[#F5F1E6]' },
  icon: { label: 'Icónico', className: 'bg-[#4BA89A] text-[#0A0806]' },
};
const defaultRarity = { label: 'Común', className: 'bg-[#5A554A] text-[#F5F1E6]' };

const FortniteItemCard = ({ entry, activeCurrency, addToCart }: { entry: any, activeCurrency: any, addToCart: any }) => {
  const safeItems = [...(entry.brItems || []), ...(entry.tracks || []), ...(entry.instruments || []), ...(entry.cars || []), ...(entry.legoKits || []), ...(entry.items || [])];

  const isBundle = !!entry.bundle;
  // Atrapamos el ítem principal (priorizamos skins, si no, el primero que haya)
  const mainItem = safeItems.find((i: any) => i.type?.value === 'outfit') || safeItems[0] || {};

  let name = '';
  let rarityValue = 'common';

  if (isBundle) {
    name = entry.bundle?.name || 'Lote';
    rarityValue = mainItem?.rarity?.value || 'epic';
  } else {
    name = mainItem?.name || mainItem?.title || 'Cosmético';
    rarityValue = mainItem?.rarity?.value || 'common';
  }

  // 👇 EL ATRAPALOTODO DEFINITIVO DE IMÁGENES 👇
  const displayImage =
    entry.bundle?.image ||
    entry.newDisplayAsset?.materialInstances?.[0]?.images?.OfferImage ||
    mainItem?.images?.featured ||
    mainItem?.images?.icon ||
    mainItem?.images?.large ||
    mainItem?.albumArt ||
    mainItem?.image ||
    '';

  if (!name || !displayImage) return null;

  const rarity = rarityMeta[rarityValue.toLowerCase()] || defaultRarity;

  const baseUsdPrice = entry.finalPrice / 100;
  const localPrice = (baseUsdPrice * activeCurrency.rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div
      className="kk-panel kk-card-hover rounded-2xl overflow-hidden cursor-pointer flex flex-col"
      onClick={() => addToCart({ id: entry.offerId || Math.random().toString(), name, price: baseUsdPrice, image_url: displayImage })}
    >
      <div className={`flex items-center justify-between px-3 py-1.5 border-b-[3px] border-[#0A0806] ${rarity.className}`}>
        <span className="font-display font-bold text-[10px] uppercase tracking-wide">{rarity.label}</span>
      </div>

      <div className="flex-1 w-full relative flex items-center justify-center overflow-hidden aspect-square bg-[#14110C]">
        <img
          src={displayImage}
          alt={name}
          className="w-full h-full object-contain transform hover:scale-110 transition-transform duration-500 scale-[1.1]"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            addToCart({ id: entry.offerId || Math.random().toString(), name, price: baseUsdPrice, image_url: displayImage });
          }}
          className="absolute top-2 right-2 bg-[#E3A23D] hover:bg-[#f0b458] text-[#0A0806] p-2.5 rounded-full border-2 border-[#0A0806] transition-transform hover:scale-110 flex items-center justify-center"
          title="Añadir al carrito"
        >
          <ShoppingCart size={16} />
        </button>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-sm text-[#F5F1E6] leading-tight truncate mb-2">{name}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-[#E3A23D] font-mono font-semibold text-lg">{activeCurrency.symbol}{localPrice}</span>
          <span className="text-[#9A9384] text-[10px] font-bold uppercase">{activeCurrency.currency}</span>
        </div>
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
    <div className="min-h-screen bg-[#14110C] text-[#F5F1E6] font-body flex flex-col selection:bg-[#E3A23D] selection:text-[#0A0806] scroll-smooth">
      <header className="flex items-center justify-between p-4 md:px-8 border-b-4 border-[#0A0806] bg-[#E3A23D] sticky top-0 z-[100]">
        <div className="flex-1 flex justify-start">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full border-[3px] border-[#0A0806] overflow-hidden bg-[#F5F1E6]">
              <Image src="/logo.jpg" alt="Logo Kitson Kit" width={40} height={40} className="w-full h-full object-cover" />
            </div>
            <span className="font-display font-bold text-xl text-[#0A0806] hidden xl:block">KITSON KIT</span>
          </Link>
        </div>

        <nav className="hidden lg:flex flex-1 justify-center gap-8 font-semibold text-sm text-[#0A0806]">
          <Link href="/" className="hover:opacity-70 transition">Inicio</Link>
          <Link href="/#catalogo" className="hover:opacity-70 transition">Catálogo</Link>
          <Link href="/tienda-diaria" className="opacity-100 underline underline-offset-4 transition">Tienda Fortnite</Link>
          <Link href="/billetera" className="hover:opacity-70 transition">Mi Billetera</Link>
        </nav>

        <div className="flex-1 flex items-center justify-end gap-3">
          <div className="hidden sm:block"><CurrencySelector /></div>

          <Link href="/carrito" className="flex items-center gap-2 bg-[#0A0806] text-[#E3A23D] py-2 px-4 rounded-lg font-bold hover:opacity-90 transition">
            <ShoppingCart size={18} />
            <span className="text-xs font-black">{totalItemsCount}</span>
          </Link>

          {session ? (
            <div className="hidden sm:flex items-center gap-3 bg-[#0A0806] py-1.5 px-1.5 pr-4 rounded-lg">
              <Link href="/mis-pedidos" className="flex items-center gap-2 hover:opacity-80 transition">
                <Image src={session.user?.image || "/logo.jpg"} alt="Avatar" width={32} height={32} className="w-8 h-8 rounded-full border-2 border-[#E3A23D] object-cover" />
              </Link>
              <button onClick={() => signOut()} className="text-red-400 hover:text-red-300 ml-2 border-l border-white/10 pl-3"><LogOut size={16}/></button>
            </div>
          ) : (
            <button onClick={() => signIn('discord')} className="hidden sm:block bg-[#5865F2] hover:bg-[#4752C4] text-white px-6 py-2 rounded-lg font-black text-sm border-2 border-[#0A0806]">Login</button>
          )}

          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden text-[#0A0806] ml-1 p-2">
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[#1D1913] border-t-4 border-[#0A0806] flex flex-col p-6 gap-6 fixed top-[73px] bottom-0 left-0 w-full z-[90] overflow-y-auto">
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="font-display text-xl font-bold text-[#F5F1E6] border-b border-white/10 pb-4">Inicio</Link>
          <Link href="/#catalogo" onClick={() => setIsMobileMenuOpen(false)} className="font-display text-xl font-bold text-[#F5F1E6] border-b border-white/10 pb-4">Catálogo</Link>
          <Link href="/tienda-diaria" onClick={() => setIsMobileMenuOpen(false)} className="font-display text-xl font-bold text-[#F5F1E6] border-b border-white/10 pb-4">Tienda Fortnite</Link>
          <Link href="/billetera" onClick={() => setIsMobileMenuOpen(false)} className="font-display text-xl font-bold text-[#F5F1E6] border-b border-white/10 pb-4">Mi Billetera</Link>
          <div className="pt-2"><CurrencySelector /></div>
        </div>
      )}

      <main className="flex-1 p-6 md:p-10 max-w-[1600px] mx-auto w-full flex flex-col md:flex-row gap-10">

        {!loading && Object.keys(groupedShop).length > 0 && (
          <aside className="hidden md:block w-72 shrink-0">
            <div className="sticky top-28 space-y-6">

              <div className="kk-panel rounded-2xl p-2 relative">
                <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#9A9384]" />
                <input
                  type="text" placeholder="Buscar cosmético..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#14110C] border-2 border-[#0A0806] rounded-xl py-3 pl-12 pr-4 text-[#F5F1E6] focus:outline-none focus:border-[#E3A23D] font-medium transition-colors"
                />
              </div>

              <div className="kk-panel rounded-2xl p-6">
                <h3 className="text-[#F5F1E6] font-display font-bold text-lg mb-6 flex items-center gap-2">
                  <List size={20} className="text-[#E3A23D]"/> Secciones
                </h3>
                <ul className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {Object.keys(filteredShop).map((section) => (
                    <li key={section}>
                      <a href={`#${section.replace(/\s+/g, '-')}`} className="text-[#9A9384] hover:text-[#E3A23D] hover:pl-2 transition-all font-bold text-sm block">
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
              <Gamepad2 size={64} className="animate-spin text-[#E3A23D] mb-4" />
              <h2 className="font-display text-2xl font-bold text-[#9A9384] animate-pulse">Cargando tienda...</h2>
            </div>
          ) : Object.keys(filteredShop).length === 0 ? (
            <div className="flex flex-col justify-center items-center py-40 kk-panel rounded-3xl">
              <Search size={64} className="text-[#3A3527] mb-4" />
              <h2 className="text-2xl font-bold text-[#D9D4C7]">No se encontraron cosméticos</h2>
              <p className="text-[#9A9384] mt-2">Intenta buscar con otro nombre.</p>
              <button onClick={() => setSearchTerm('')} className="mt-6 text-[#E3A23D] font-bold hover:underline">Limpiar búsqueda</button>
            </div>
          ) : (
            <div className="space-y-20 pb-24">
              {Object.entries(filteredShop).map(([sectionName, items]) => (
                <section key={sectionName} id={sectionName.replace(/\s+/g, '-')} className="relative scroll-mt-28">
                  <div className="flex items-center gap-6 mb-8">
                    <h2 className="font-display text-3xl md:text-4xl font-bold text-[#F5F1E6]">{sectionName}</h2>
                    <div className="flex-1 h-1 bg-[#1D1913] border-t-2 border-[#0A0806]"></div>
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
