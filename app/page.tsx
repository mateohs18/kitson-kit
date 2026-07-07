"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '../store/cartStore';
import { signIn, signOut, useSession } from 'next-auth/react';
import { supabase } from '../lib/supabase';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  emoji?: string; // Mantenemos ambos por si acaso
}

export default function Home() {
  const addToCart = useCartStore((state) => state.addToCart);
  const totalItems = useCartStore((state) => state.totalItems());
  const { data: session } = useSession();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

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
    <div className="min-h-screen bg-[#0B0E14] text-white font-sans selection:bg-blue-500 selection:text-white">
      
      {/* NAVEGACIÓN PROFESIONAL (Efecto Cristal) */}
      <header className="flex items-center justify-between p-4 md:px-8 border-b border-white/10 bg-[#0B0E14]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600 hover:opacity-80 transition">
            Kitson Kit
          </Link>
        </div>
        
        <nav className="hidden md:flex gap-8 font-medium text-sm text-gray-400">
          <Link href="/" className="hover:text-white transition">Inicio</Link>
          <Link href="#catalogo" className="hover:text-white transition">Catálogo</Link>
          <Link href="/tienda-diaria" className="hover:text-white transition">Tienda Fortnite</Link>
          <Link href="/soporte" className="hover:text-white transition">Soporte</Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link 
            href="/carrito" 
            className="flex items-center gap-2 hover:bg-white/5 transition bg-white/5 py-2 px-4 rounded-full border border-white/10"
          >
            <span className="text-lg">🛒</span> 
            <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {totalItems}
            </span>
          </Link>

          {session ? (
            <div className="flex items-center gap-3 bg-white/5 py-1.5 px-1.5 pr-4 rounded-full border border-white/10">
              <img 
                src={session.user?.image || ""} 
                alt="Avatar" 
                className="w-8 h-8 rounded-full border border-blue-500/50"
              />
              <span className="text-sm font-bold hidden sm:block text-gray-200">
                {session.user?.name}
              </span>
              <button 
                onClick={() => signOut()}
                className="text-xs font-bold text-red-400 hover:text-red-300 ml-2 transition"
                title="Cerrar sesión"
              >
                Salir
              </button>
            </div>
          ) : (
            <button 
              onClick={() => signIn()}
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-6 py-2.5 rounded-full font-bold transition shadow-[0_0_15px_rgba(37,99,235,0.4)]"
            >
              Iniciar Sesión
            </button>
          )}
        </div>
      </header>

      {/* HERO SECTION PREMIUM */}
      <main className="relative flex flex-col items-center justify-center text-center px-4 py-32 overflow-hidden">
        {/* Luces de fondo (Glow) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] -z-10"></div>
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          Entregas Automatizadas 24/7
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 max-w-4xl leading-tight tracking-tight">
          Sube de nivel con <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500">
            Kitson Kit
          </span>
        </h1>
        <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl">
          Consigue tus recargas, V-Bucks, Robux y suscripciones al mejor precio del mercado. Sin riesgos, rápido y 100% seguro.
        </p>
        
        <div className="flex gap-4">
          <Link href="#catalogo" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full text-lg font-bold transition shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:scale-105">
            Ver Catálogo
          </Link>
          <Link href="/tienda-diaria" className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-4 rounded-full text-lg font-bold transition">
            Tienda Fortnite
          </Link>
        </div>
      </main>

      {/* SECCIÓN DE CONFIANZA (NUEVA) */}
      <section className="border-y border-white/5 bg-white/[0.02] py-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center text-2xl mb-4 border border-blue-500/20">⚡</div>
            <h3 className="text-white font-bold text-lg mb-2">Entrega Instantánea</h3>
            <p className="text-gray-400 text-sm">Recibe tus recargas en cuestión de segundos tras confirmar el pago.</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center text-2xl mb-4 border border-purple-500/20">🔒</div>
            <h3 className="text-white font-bold text-lg mb-2">Pagos Seguros</h3>
            <p className="text-gray-400 text-sm">Transacciones protegidas y cifradas de extremo a extremo.</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center text-2xl mb-4 border border-green-500/20">🎧</div>
            <h3 className="text-white font-bold text-lg mb-2">Soporte Dedicado</h3>
            <p className="text-gray-400 text-sm">Estamos en Discord para ayudarte ante cualquier inconveniente.</p>
          </div>
        </div>
      </section>

      {/* CATÁLOGO DE PRODUCTOS */}
      <section id="catalogo" className="max-w-7xl mx-auto px-6 py-24">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
              🔥 Ofertas Destacadas
            </h2>
            <p className="text-gray-400">Los productos más elegidos por la comunidad.</p>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => {
              // Lógica de seguridad para encontrar la imagen
              const imageSrc = product.image_url?.includes('http') ? product.image_url : (product.emoji?.includes('http') ? product.emoji : null);
              
              return (
                <div key={product.id} className="bg-white/[0.03] p-5 rounded-2xl border border-white/10 hover:border-blue-500/50 hover:bg-white/[0.05] transition duration-300 group flex flex-col">
                  
                  {/* Contenedor de Imagen */}
                  <div className="aspect-square bg-[#0B0E14] rounded-xl mb-5 overflow-hidden relative border border-white/5 flex items-center justify-center">
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
                  
                  {/* Información del producto */}
                  <div className="flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-gray-100 leading-tight">{product.name}</h3>
                      <div className="flex items-center gap-2 mt-2 mb-4">
                        <span className="text-blue-400 font-black text-2xl tracking-tight">${product.price}</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => addToCart(product)}
                      className="w-full bg-white/10 hover:bg-blue-600 text-white py-3 rounded-xl font-bold transition duration-300 flex justify-center items-center gap-2"
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

      {/* FOOTER PROFESIONAL (NUEVO) */}
      <footer className="border-t border-white/10 bg-[#07090D] pt-16 pb-8 mt-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="md:col-span-2">
            <span className="text-2xl font-black tracking-tighter text-blue-500 mb-4 block">Kitson Kit</span>
            <p className="text-gray-400 text-sm max-w-sm mb-6">
              Tu destino de confianza para recargas digitales, monedas de juego y suscripciones. Potenciamos tu experiencia de juego.
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Enlaces Rápidos</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/" className="hover:text-blue-400 transition">Inicio</Link></li>
              <li><Link href="#catalogo" className="hover:text-blue-400 transition">Catálogo</Link></li>
              <li><Link href="/tienda-diaria" className="hover:text-blue-400 transition">Tienda Fortnite</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Ayuda legal</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="#" className="hover:text-blue-400 transition">Términos y Condiciones</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition">Política de Privacidad</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition">Política de Reembolsos</Link></li>
              <li><Link href="/soporte" className="hover:text-blue-400 transition">Contacto</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Kitson Kit. Todos los derechos reservados.
          </p>
          <div className="flex gap-4">
            {/* Iconos sociales simulados */}
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-blue-600 hover:text-white transition cursor-pointer">X</div>
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-blue-600 hover:text-white transition cursor-pointer">D</div>
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-blue-600 hover:text-white transition cursor-pointer">IG</div>
          </div>
        </div>
      </footer>

    </div>
  );
}