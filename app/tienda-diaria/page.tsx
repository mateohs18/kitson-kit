"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '../../store/cartStore';
import { signIn, signOut, useSession } from 'next-auth/react';
import { supabase } from '../../lib/supabase';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  emoji?: string;
}

export default function Home() {
  const addToCart = useCartStore((state) => state.addToCart);
  const totalItems = useCartStore((state) => state.totalItems());
  const { data: session } = useSession();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) console.error("Error al cargar productos:", error);
      else if (data) setProducts(data);
      
      setLoading(false);
    }
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-500 selection:text-white">
      
      {/* NAVEGACIÓN */}
      <header className="flex flex-col md:flex-row md:items-center justify-between p-4 md:px-8 border-b border-white/5 bg-[#050505]/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center justify-between w-full md:w-auto">
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition group">
            <img 
              src="/logo.jpg" 
              alt="Kitson Kit Logo" 
              onError={(e) => {
                // Si la imagen falla, muestra un círculo gris para que no se vea el error feo
                (e.target as HTMLImageElement).style.display = 'none';
              }}
              className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-transparent group-hover:border-orange-500 transition duration-300 object-cover"
            />
            <span className="text-2xl font-black tracking-tighter text-white">
              Kitson <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-500">Kit</span>
            </span>
          </Link>
          
          {/* Botón Hamburguesa Móvil */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-gray-400 hover:text-white transition"
          >
            <span className="text-2xl">{isMobileMenuOpen ? '✕' : '☰'}</span>
          </button>
        </div>
        
        {/* Enlaces */}
        <nav className={`${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row gap-6 mt-6 md:mt-0 font-medium text-sm text-gray-400 w-full md:w-auto items-center`}>
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-orange-400 transition">Inicio</Link>
          <Link href="#catalogo" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-orange-400 transition">Catálogo</Link>
          <Link href="/tienda-diaria" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-orange-400 transition">Tienda Fortnite</Link>
          <Link href="#faq" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-orange-400 transition">Soporte</Link>
        </nav>

        {/* Acciones */}
        <div className={`${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row items-center gap-4 mt-6 md:mt-0 w-full md:w-auto`}>
          <Link 
            href="/carrito" 
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-2 hover:bg-white/5 transition bg-white/5 py-2 px-5 rounded-full border border-white/10 w-full md:w-auto justify-center"
          >
            <span className="text-lg">🛒</span> 
            <span className="bg-orange-500 text-[#050505] text-xs font-black px-2 py-0.5 rounded-full">
              {totalItems}
            </span>
          </Link>

          {session ? (
            <div className="flex items-center gap-3 bg-white/5 py-1.5 px-1.5 pr-4 rounded-full border border-white/10 w-full md:w-auto justify-center">
              <img 
                src={session.user?.image || ""} 
                alt="Avatar" 
                className="w-8 h-8 rounded-full border border-orange-500/50"
              />
              <span className="text-sm font-bold text-gray-200">
                {session.user?.name}
              </span>
              <button 
                onClick={() => signOut()}
                className="text-xs font-bold text-red-400 hover:text-red-300 ml-2 transition"
              >
                Salir
              </button>
            </div>
          ) : (
            <button 
              onClick={() => signIn('discord')}
              className="bg-orange-500 hover:bg-orange-400 text-[#050505] w-full md:w-auto text-sm px-6 py-2.5 rounded-full font-black transition shadow-[0_0_15px_rgba(249,115,22,0.3)]"
            >
              Iniciar Sesión
            </button>
          )}
        </div>
      </header>

      {/* HERO SECTION */}
      <main className="relative flex flex-col items-center justify-center text-center px-4 py-32 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-[150px] -z-10 pointer-events-none"></div>
        
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-widest mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
          </span>
          Recargas Automatizadas 24/7
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black mb-6 max-w-4xl leading-tight tracking-tight">
          Sube de nivel con <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-yellow-500 to-orange-600">
            Kitson Kit
          </span>
        </h1>
        <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl font-medium">
          Consigue tus recargas, V-Bucks, Robux y suscripciones al mejor precio del mercado. Sin riesgos, rápido y 100% seguro.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-4">
          <Link href="#catalogo" className="bg-orange-500 hover:bg-orange-400 text-[#050505] px-8 py-4 rounded-full text-lg font-black transition shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:scale-105 w-full sm:w-auto text-center">
            Ver Catálogo
          </Link>
          <Link href="/tienda-diaria" className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-4 rounded-full text-lg font-bold transition w-full sm:w-auto text-center">
            Tienda Fortnite
          </Link>
        </div>
      </main>

      {/* SECCIÓN: ¿CÓMO FUNCIONA? (NUEVA) */}
      <section className="bg-[#0A0A0A] border-y border-white/5 py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">¿Cómo funciona?</h2>
            <p className="text-gray-400 text-lg">Tu recarga en tu cuenta en solo tres simples pasos.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Línea conectora (solo visible en escritorio) */}
            <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-orange-500/0 via-orange-500/50 to-orange-500/0 -translate-y-1/2 z-0"></div>

            {/* Paso 1 */}
            <div className="bg-[#050505] border border-white/5 p-8 rounded-3xl text-center relative z-10 hover:border-orange-500/30 transition">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-2xl font-black text-[#050505] mx-auto mb-6 shadow-[0_0_20px_rgba(249,115,22,0.4)]">1</div>
              <h3 className="text-xl font-bold mb-3 text-white">Elige tu producto</h3>
              <p className="text-gray-400 text-sm">Navega por nuestro catálogo y añade los V-Bucks o recargas que necesites a tu carrito.</p>
            </div>

            {/* Paso 2 */}
            <div className="bg-[#050505] border border-white/5 p-8 rounded-3xl text-center relative z-10 hover:border-orange-500/30 transition">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-2xl font-black text-[#050505] mx-auto mb-6 shadow-[0_0_20px_rgba(249,115,22,0.4)]">2</div>
              <h3 className="text-xl font-bold mb-3 text-white">Pago Seguro</h3>
              <p className="text-gray-400 text-sm">Completa tu compra de forma 100% segura. Inicia sesión rápido usando tu cuenta de Discord.</p>
            </div>

            {/* Paso 3 */}
            <div className="bg-[#050505] border border-white/5 p-8 rounded-3xl text-center relative z-10 hover:border-orange-500/30 transition">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-2xl font-black text-[#050505] mx-auto mb-6 shadow-[0_0_20px_rgba(249,115,22,0.4)]">3</div>
              <h3 className="text-xl font-bold mb-3 text-white">Recibe al instante</h3>
              <p className="text-gray-400 text-sm">Una vez procesado, los fondos se añaden automáticamente a tu cuenta. ¡Listo para jugar!</p>
            </div>
          </div>
        </div>
      </section>

      {/* CATÁLOGO DE PRODUCTOS */}
      <section id="catalogo" className="max-w-7xl mx-auto px-6 py-24">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
          <div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-3">
              🔥 Ofertas Destacadas
            </h2>
            <p className="text-gray-400 text-lg">Los productos más elegidos por la comunidad.</p>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => {
              const imageSrc = product.image_url?.includes('http') ? product.image_url : (product.emoji?.includes('http') ? product.emoji : null);
              
              return (
                <div key={product.id} className="bg-[#0A0A0A] p-5 rounded-3xl border border-white/5 hover:border-orange-500/50 hover:bg-[#111] transition duration-300 group flex flex-col shadow-xl">
                  <div className="aspect-square bg-[#151515] rounded-2xl mb-5 overflow-hidden relative flex items-center justify-center group-hover:shadow-[0_0_20px_rgba(249,115,22,0.15)] transition duration-300">
                    {imageSrc ? (
                      <img 
                        src={imageSrc} 
                        alt={`Portada de ${product.name}`} 
                        className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                      />
                    ) : (
                      <div className="text-6xl group-hover:scale-110 transition duration-500">🎮</div>
                    )}
                  </div>
                  <div className="flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-gray-100 leading-tight group-hover:text-orange-400 transition">{product.name}</h3>
                      <div className="flex items-center gap-2 mt-3 mb-5">
                        <span className="text-white font-black text-2xl tracking-tight">${product.price}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => addToCart(product)}
                      className="w-full bg-white/5 hover:bg-orange-500 text-white hover:text-[#050505] py-3.5 rounded-xl font-bold transition duration-300 flex justify-center items-center gap-2"
                    >
                      <span>Añadir al carrito</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECCIÓN: PREGUNTAS FRECUENTES (NUEVA) */}
      <section id="faq" className="py-24 border-t border-white/5 bg-[#020202]">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">Preguntas Frecuentes</h2>
            <p className="text-gray-400">Todo lo que necesitas saber antes de comprar.</p>
          </div>
          
          <div className="space-y-4">
            <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-2xl">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <span className="text-orange-500">✦</span> ¿Es seguro comprar en Kitson Kit?
              </h3>
              <p className="text-gray-400 text-sm pl-6">Absolutamente. Utilizamos protocolos de seguridad estándar de la industria y pasarelas de pago verificadas. Nunca te pediremos contraseñas de tus cuentas de juego.</p>
            </div>
            
            <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-2xl">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <span className="text-orange-500">✦</span> ¿Cuánto tiempo tarda en llegar mi recarga?
              </h3>
              <p className="text-gray-400 text-sm pl-6">El 99% de nuestros pedidos se procesan y entregan de manera automatizada en menos de 5 minutos después de confirmar el pago.</p>
            </div>
            
            <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-2xl">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <span className="text-orange-500">✦</span> ¿Qué pasa si tengo un problema con mi pedido?
              </h3>
              <p className="text-gray-400 text-sm pl-6">Contamos con soporte dedicado a través de nuestro servidor de Discord. Solo abre un ticket y nuestro equipo te ayudará de inmediato.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 bg-[#050505] pt-16 pb-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10 mb-16">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl font-black tracking-tighter text-white">Kitson Kit</span>
            </div>
            <p className="text-gray-400 text-sm max-w-sm leading-relaxed">
              Tu destino de confianza para recargas digitales, monedas de juego y suscripciones. Potenciamos tu experiencia de juego al máximo nivel.
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-5 text-lg">Navegación</h4>
            <ul className="space-y-3 text-sm text-gray-400 font-medium">
              <li><Link href="/" className="hover:text-orange-400 transition">Inicio</Link></li>
              <li><Link href="#catalogo" className="hover:text-orange-400 transition">Catálogo</Link></li>
              <li><Link href="/tienda-diaria" className="hover:text-orange-400 transition">Tienda Fortnite</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-5 text-lg">Ayuda</h4>
            <ul className="space-y-3 text-sm text-gray-400 font-medium">
              <li><Link href="#faq" className="hover:text-orange-400 transition">Preguntas Frecuentes</Link></li>
              <li><Link href="#" className="hover:text-orange-400 transition">Términos y Condiciones</Link></li>
              <li><Link href="#" className="hover:text-orange-400 transition">Contacto y Soporte</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-gray-600 text-sm font-medium">
            © {new Date().getFullYear()} Kitson Kit. Todos los derechos reservados.
          </p>
        </div>
      </footer>

    </div>
  );
}