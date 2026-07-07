"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '../../store/cartStore';

// Tipos actualizados para capturar la rareza, tipo y el nuevo 'layout'
type FortniteItem = {
  id: string;
  name: string;
  type: { displayValue: string };
  rarity: { displayValue: string; value: string };
  series?: { name: string };
  images: { icon: string; featured?: string };
};

type FortniteEntry = {
  regularPrice: number;
  finalPrice: number;
  bundle?: { name: string; image: string };
  items?: FortniteItem[];
  layout?: { name: string }; // ESTA ES LA CLAVE DE LA NUEVA TIENDA
  section?: { name: string };
};

export default function TiendaFortnite() {
  const addToCart = useCartStore((state) => state.addToCart);
  const [groupedShop, setGroupedShop] = useState<Record<string, FortniteEntry[]>>({});
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('');

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
            // Priorizamos 'layout.name' que es lo que usa la nueva UI de Fortnite
            const sectionName = entry.layout?.name || entry.section?.name || 'Otras Ofertas';
            
            if (!groups[sectionName]) {
              groups[sectionName] = [];
            }
            groups[sectionName].push(entry);
            count++;
          });

          setGroupedShop(groups);
          setTotalItems(count);
          setActiveCategory(Object.keys(groups)[0] || ''); // Seleccionar la primera por defecto
        } else {
          setErrorMsg('No se pudo cargar la tienda desde la API.');
        }
      } catch (error) {
        console.error('Error cargando la tienda:', error);
        setErrorMsg('Error de conexión con la API.');
      } finally {
        setLoading(false);
      }
    }

    fetchShop();
  }, []);

  // Formateador de fecha similar al del juego
  const today = new Date();
  const dateString = today.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-[#09090C] text-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-3xl font-bold text-red-500 mb-4">Ups, algo salió mal</h1>
        <p className="text-gray-400 mb-8">{errorMsg}</p>
        <Link href="/" className="bg-orange-500 hover:bg-orange-400 text-black px-8 py-3 rounded-full font-bold transition">
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090C] text-white font-sans flex flex-col md:flex-row">
      
      {/* SIDEBAR (Barra lateral de categorías) */}
      <aside className="w-full md:w-72 bg-[#09090C] border-r border-white/5 p-6 flex-shrink-0 md:sticky md:top-0 md:h-screen md:overflow-y-auto no-scrollbar">
        <Link href="/" className="text-gray-400 hover:text-white transition font-bold flex items-center gap-2 mb-8 text-sm">
          <span>←</span> Volver al inicio
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight mb-1">Tienda de Hoy</h1>
          <p className="text-gray-400 text-xs capitalize">{dateString} · {totalItems} ítems disponibles</p>
        </div>

        <h3 className="text-gray-500 text-xs font-bold tracking-widest uppercase mb-4">Categorías</h3>
        
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-8 bg-white/5 rounded-lg animate-pulse"></div>)}
          </div>
        ) : (
          <nav className="space-y-1">
            <button 
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setActiveCategory('Todos');
              }}
              className={`w-full flex justify-between items-center px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                activeCategory === 'Todos' ? 'bg-purple-500/20 text-purple-400' : 'text-gray-300 hover:bg-white/5'
              }`}
            >
              <span>Todos</span>
              <span className="bg-white/10 px-2 py-0.5 rounded-full text-xs">{totalItems}</span>
            </button>

            {Object.entries(groupedShop).map(([name, items]) => (
              <button 
                key={name}
                onClick={() => {
                  setActiveCategory(name);
                  document.getElementById(`section-${name}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`w-full flex justify-between items-center px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                  activeCategory === name ? 'bg-purple-500/20 text-purple-400' : 'text-gray-300 hover:bg-white/5'
                }`}
              >
                <span className="truncate pr-2 text-left">{name}</span>
                <span className={`${activeCategory === name ? 'bg-purple-500/30' : 'bg-white/10'} px-2 py-0.5 rounded-full text-xs`}>
                  {items.length}
                </span>
              </button>
            ))}
          </nav>
        )}
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-6 md:p-10 md:overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <div className="space-y-16 max-w-6xl mx-auto pb-24">
            {Object.entries(groupedShop).map(([sectionName, items]) => (
              <section key={sectionName} id={`section-${sectionName}`} className="scroll-mt-10">
                
                {/* Encabezado de la Sección */}
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-xl font-black text-white uppercase tracking-wider">{sectionName}</h2>
                  <span className="bg-white/10 text-gray-300 px-2.5 py-0.5 rounded-full text-xs font-bold">
                    {items.length}
                  </span>
                  <div className="h-px bg-white/10 flex-grow ml-2"></div>
                </div>

                {/* Grid de Tarjetas Estilo Locker */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {items.map((entry, idx) => {
                    const isBundle = !!entry.bundle;
                    const safeItems = entry.items || [];
                    const firstItem = safeItems[0];
                    
                    const name = isBundle ? entry.bundle?.name : firstItem?.name;
                    const imageUrl = isBundle 
                      ? entry.bundle?.image 
                      : (firstItem?.images?.featured || firstItem?.images?.icon);
                    const id = firstItem?.id || `bundle-${idx}`;

                    // Etiquetas dinámicas
                    const rarityLabel = firstItem?.series?.name || firstItem?.rarity?.displayValue || 'COMÚN';
                    const itemType = firstItem?.type?.displayValue || 'COSMÉTICO';

                    if (!name || !imageUrl) return null;

                    return (
                      <div 
                        key={`${id}-${idx}`} 
                        className={`bg-[#18181C] rounded-2xl border border-white/10 hover:border-white/30 transition duration-300 group flex flex-col overflow-hidden relative cursor-pointer ${
                          isBundle ? 'sm:col-span-2 sm:row-span-2 aspect-video sm:aspect-auto' : 'aspect-square'
                        }`}
                        onClick={() => addToCart({ id, name, price: entry.finalPrice, image_url: imageUrl })}
                      >
                        {/* Insignias Superiores */}
                        <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-10 pointer-events-none">
                          <span className="bg-white text-black text-[10px] font-black uppercase px-2 py-1 rounded-md shadow-md">
                            {rarityLabel}
                          </span>
                          {isBundle && (
                            <span className="bg-blue-500 text-white text-[10px] font-black uppercase px-2 py-1 rounded-md shadow-md">
                              BUNDLE
                            </span>
                          )}
                        </div>

                        {/* Imagen con Gradiente */}
                        <div className="flex-1 w-full bg-gradient-to-b from-transparent to-[#18181C] relative flex items-center justify-center overflow-hidden">
                          <img 
                            src={imageUrl} 
                            alt={name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#18181C] via-[#18181C]/20 to-transparent"></div>
                        </div>
                        
                        {/* Información Inferior */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col justify-end z-10 pointer-events-none">
                          <h3 className="font-black text-white text-lg leading-tight uppercase tracking-wide truncate shadow-black drop-shadow-md">
                            {name}
                          </h3>
                          <span className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1 shadow-black drop-shadow-md">
                            {isBundle ? 'LOTE' : itemType}
                          </span>
                          
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-white font-black text-sm">${entry.finalPrice}</span>
                            <span className="text-gray-400 text-[10px] font-bold ml-0.5 mt-0.5">USD</span>
                            
                            {/* Simulador de V-Bucks */}
                            <div className="ml-auto flex items-center gap-1 bg-black/40 px-2 py-1 rounded-md backdrop-blur-sm">
                                <img src="https://fortnite-api.com/images/vbuck.png" alt="V-Bucks" className="w-3 h-3" />
                                <span className="text-gray-300 font-bold text-xs">{entry.finalPrice}</span>
                                {entry.finalPrice < entry.regularPrice && (
                                  <span className="text-gray-500 text-[10px] line-through ml-1">{entry.regularPrice}</span>
                                )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Hover Overlay para Añadir al Carrito */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20">
                           <span className="bg-orange-500 text-black font-black px-6 py-2 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
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