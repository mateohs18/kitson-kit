"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '../../store/cartStore';

// Definimos la estructura de datos que nos envía la API de Fortnite
type FortniteItem = {
  id: string;
  name: string;
  images: {
    icon: string;
    featured?: string;
  };
};

type FortniteEntry = {
  regularPrice: number;
  finalPrice: number;
  bundle?: {
    name: string;
    image: string;
  };
  items: FortniteItem[];
  section?: {
    name: string;
  };
};

export default function TiendaFortnite() {
  const addToCart = useCartStore((state) => state.addToCart);
  // Guardaremos los productos agrupados por el nombre de su sección
  const [groupedShop, setGroupedShop] = useState<Record<string, FortniteEntry[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchShop() {
      try {
        // Obtenemos la tienda actual en español
        const response = await fetch('https://fortnite-api.com/v2/shop?language=es');
        const data = await response.json();

        if (data.status === 200 && data.data?.entries) {
          const entries = data.data.entries as FortniteEntry[];

          // Magia: Agrupamos cada cosmético en su sección correspondiente
          const groups: Record<string, FortniteEntry[]> = {};
          
          entries.forEach((entry) => {
            // Si el objeto no tiene sección definida, lo mandamos a "Otras Ofertas"
            const sectionName = entry.section?.name || 'Otras Ofertas';
            
            if (!groups[sectionName]) {
              groups[sectionName] = [];
            }
            groups[sectionName].push(entry);
          });

          setGroupedShop(groups);
        }
      } catch (error) {
        console.error('Error cargando la tienda de Fortnite:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchShop();
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-500 selection:text-white pb-24">
      
      {/* CABECERA SENCILLA */}
      <header className="p-6 md:px-12 border-b border-white/5 bg-[#050505]/90 backdrop-blur-xl sticky top-0 z-50 flex items-center justify-between">
        <Link href="/" className="text-gray-400 hover:text-orange-500 transition font-bold flex items-center gap-2">
          <span>←</span> Volver al inicio
        </Link>
        <div className="text-xl font-black tracking-tighter">
          Tienda <span className="text-orange-500">Fortnite</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-12">
        <div className="mb-16 text-center">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
            Tienda de Hoy
          </h1>
          <p className="text-gray-400 text-lg">Actualizada en tiempo real. Compra como regalo al instante.</p>
        </div>

        {loading ? (
          // PANTALLA DE CARGA (SKELETONS)
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500"></div>
          </div>
        ) : (
          // SECCIONES AGRUPADAS
          <div className="space-y-20">
            {Object.entries(groupedShop).map(([sectionName, items], sectionIndex) => (
              <section key={sectionIndex}>
                {/* Título de la Sección */}
                <div className="flex items-center gap-4 mb-8">
                  <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wider">
                    {sectionName}
                  </h2>
                  <div className="h-px bg-white/10 flex-grow"></div>
                </div>

                {/* Cuadrícula de productos de esa sección */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {items.map((entry, idx) => {
                    // Verificamos si es un lote (bundle) o un item individual para sacar la foto y nombre
                    const isBundle = !!entry.bundle;
                    const name = isBundle ? entry.bundle!.name : entry.items[0]?.name;
                    const imageUrl = isBundle 
                      ? entry.bundle!.image 
                      : (entry.items[0]?.images.featured || entry.items[0]?.images.icon);
                    const id = entry.items[0]?.id || `bundle-${idx}`;

                    return (
                      <div 
                        key={`${id}-${idx}`} 
                        className="bg-[#0A0A0A] rounded-2xl border border-white/5 hover:border-orange-500/50 hover:bg-[#111] transition duration-300 group flex flex-col overflow-hidden shadow-lg"
                      >
                        {/* Contenedor de Imagen */}
                        <div className="aspect-square bg-gradient-to-tr from-blue-900/20 to-purple-900/20 relative overflow-hidden flex items-center justify-center">
                          {imageUrl && (
                            <img 
                              src={imageUrl} 
                              alt={name} 
                              className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                            />
                          )}
                          
                          {/* Etiqueta de descuento (Si el precio final es menor al regular) */}
                          {entry.finalPrice < entry.regularPrice && (
                            <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-black px-2 py-1 rounded">
                              OFERTA
                            </div>
                          )}
                        </div>
                        
                        {/* Información del cosmético */}
                        <div className="p-4 flex-grow flex flex-col justify-between">
                          <div>
                            <h3 className="font-bold text-gray-100 leading-tight group-hover:text-orange-400 transition line-clamp-2">
                              {name || 'Cosmético Desconocido'}
                            </h3>
                            <div className="flex items-center gap-2 mt-2 mb-4">
                              <img src="https://fortnite-api.com/images/vbuck.png" alt="V-Bucks" className="w-5 h-5" />
                              <span className="text-white font-black text-xl">{entry.finalPrice}</span>
                              {entry.finalPrice < entry.regularPrice && (
                                <span className="text-gray-500 text-sm line-through">{entry.regularPrice}</span>
                              )}
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => addToCart({
                              id: id,
                              name: name || 'Item Fortnite',
                              price: entry.finalPrice,
                              image_url: imageUrl
                            })}
                            className="w-full bg-white/5 hover:bg-orange-500 text-white hover:text-[#050505] py-2.5 rounded-lg font-bold transition duration-300 flex justify-center items-center gap-2 text-sm"
                          >
                            <span>Añadir</span>
                          </button>
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