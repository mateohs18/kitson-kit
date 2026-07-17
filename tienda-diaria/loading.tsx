export default function TiendaDiariaLoading() {
  // Creamos una lista ficticia de 8 elementos para simular las tarjetas de la tienda
  const skeletons = Array.from({ length: 8 });

  return (
    <div className="min-h-screen bg-[#14110C] text-[#F5F1E6] font-body p-6 md:p-12">
      <div className="max-w-6xl mx-auto">

        {/* ENCABEZADO EN ESPERA */}
        <div className="flex justify-between items-center mb-10 border-b-4 border-[#0A0806] pb-4">
          <div>
            <div className="h-9 w-64 bg-[#1D1913] rounded-lg animate-pulse mb-3"></div>
            <div className="h-4 w-80 bg-[#1D1913] rounded-lg animate-pulse"></div>
          </div>
          <div className="hidden md:block h-10 w-40 bg-[#1D1913] rounded-lg animate-pulse"></div>
        </div>

        {/* CUADRÍCULA DE TARJETAS EN ESPERA (SKELETONS) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {skeletons.map((_, index) => (
            <div
              key={index}
              className="kk-panel rounded-2xl overflow-hidden p-4 flex flex-col justify-between h-[380px]"
            >
              {/* Espacio de la Imagen */}
              <div className="aspect-square bg-[#14110C] rounded-lg animate-pulse w-full mb-4 border-2 border-[#0A0806]"></div>

              {/* Espacio del Texto */}
              <div className="space-y-2 flex-grow">
                <div className="h-5 bg-[#14110C] rounded animate-pulse w-3/4"></div>
                <div className="h-3 bg-[#14110C] rounded animate-pulse w-1/2"></div>
              </div>

              {/* Espacio del Botón/Precio */}
              <div className="h-10 bg-[#14110C] rounded-lg animate-pulse w-full mt-4"></div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
