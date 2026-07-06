import Link from 'next/link';

// 1. Definimos las partes de la respuesta de la API
interface FortniteItem {
  name: string;
  description: string;
  images: {
    icon: string;
  };
}

interface ShopEntry {
  offerId: string;
  finalPrice: number;
  items?: FortniteItem[]; 
  brItems?: FortniteItem[]; // <-- AÑADIMOS ESTO: El nuevo formato de la API
}

// 2. Función para obtener la tienda
async function getFortniteShop() {
  try {
    const res = await fetch('https://fortnite-api.com/v2/shop?language=es', {
      cache: 'no-store' 
    });
    
    if (!res.ok) {
      console.error(`Error HTTP: ${res.status}`);
      return []; 
    }
    
    const json = await res.json();
    let entries: ShopEntry[] = [];
    
    if (json.data?.entries) {
      entries = json.data.entries;
    } else if (json.data?.featured?.entries) {
      entries = json.data.featured.entries;
    } else if (json.data?.daily?.entries) {
      entries = json.data.daily.entries;
    }
    
    return entries;
  } catch (error) {
    console.error("Error conectando con los servidores:", error);
    return []; 
  }
}

// 3. Nuestro componente principal
export default async function TiendaDiariaPage() {
  const shopEntries = await getFortniteShop();

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        
        {/* ENCABEZADO */}
        <div className="flex justify-between items-center mb-10 border-b border-gray-800 pb-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
              <span>🛒</span> Tienda Diaria de Fortnite
            </h1>
            <p className="text-gray-400 mt-2 text-sm">
              Actualizada en tiempo real. Usa tus V-Bucks de Kitson Kit para comprar.
            </p>
          </div>
          <Link href="/" className="hidden md:block bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-md font-medium transition">
            ← Volver a Kitson Kit
          </Link>
        </div>

        {/* VALIDACIÓN SI LA API FALLA O ESTÁ VACÍA */}
        {shopEntries.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-5xl block mb-4">⚠️</span>
            <p className="text-xl text-gray-400">La tienda se está actualizando. Vuelve en unos minutos.</p>
          </div>
        ) : (
          /* CUADRÍCULA DE LA TIENDA DE FORTNITE */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {shopEntries.map((entry) => {
              // CAMBIO CLAVE: Le decimos que busque primero en 'brItems', y si no hay, busque en 'items'
              const item = entry.brItems?.[0] || entry.items?.[0];
              
              if (!item) return null;

              return (
                <div 
                  key={entry.offerId} 
                  className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden hover:border-blue-500 transition group flex flex-col"
                >
                  {/* Imagen del cosmético */}
                  <div className="aspect-square bg-gradient-to-br from-blue-900/40 to-purple-900/40 p-4 relative flex items-center justify-center">
                    {item.images?.icon && (
                      <img 
                        src={item.images.icon} 
                        alt={item.name}
                        className="w-full h-full object-contain group-hover:scale-110 transition duration-300"
                      />
                    )}
                  </div>
                  
                  {/* Detalles y precio */}
                  <div className="p-4 flex flex-col flex-grow justify-between">
                    <div>
                      <h3 className="font-bold text-lg leading-tight mb-1 uppercase tracking-wider">
                        {item.name}
                      </h3>
                      <p className="text-xs text-gray-400 line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                    
                    <div className="mt-4 flex justify-between items-center bg-gray-900 rounded-lg p-2 border border-gray-700">
                      <span className="font-black text-blue-400 flex items-center gap-1">
                        💎 {entry.finalPrice}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}