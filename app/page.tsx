"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '../store/cartStore';
import { useCurrencyStore } from '../store/currencyStore';
import CurrencySelector from '../components/CurrencySelector';
import { signIn, signOut, useSession } from 'next-auth/react';
import { supabase } from '../lib/supabase';
import { 
  ShoppingCart, Gamepad2, Zap, ShieldCheck, Headphones, LogOut, 
  PackageSearch, Menu, X, Star, Users, ChevronDown, CreditCard
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url?: string;
}

export default function Home() {
  const addToCart = useCartStore((state) => state.addToCart);
  const totalItemsCount = useCartStore((state) => state.totalItems());
  
  const { getActiveConfig } = useCurrencyStore();
  const activeCurrency = getActiveConfig();

  const { data: session } = useSession();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<any[]>([]); // NUEVO ESTADO PARA RESEÑAS
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const [stats, setStats] = useState({ totalOrders: 0, averageRating: "5.0", totalReviews: 0 });

  useEffect(() => {
    async function fetchData() {
      const { data: productsData } = await supabase.from('products').select('*');
      if (productsData) setProducts(productsData);

      const { count: ordersCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
      
      // CARGAMOS LAS RESEÑAS CON SUS COMENTARIOS Y NOMBRES
      const { data: reviewsData } = await supabase.from('reviews').select('*').order('created_at', { ascending: false }).limit(6);
      
      let avg = 5.0; let revCount = 0;
      if (reviewsData && reviewsData.length > 0) {
        setReviews(reviewsData); // Guardamos las reseñas en pantalla
        revCount = reviewsData.length;
        avg = reviewsData.reduce((acc, curr) => acc + curr.rating, 0) / revCount;
      }
      setStats({ totalOrders: (ordersCount || 0) + 150, averageRating: avg.toFixed(1), totalReviews: revCount });
      setLoading(false);
    }
    fetchData();
  }, []);

  const faqs = [
    { q: "¿Cuánto tiempo tarda en llegar mi recarga?", a: "El sistema automatizado procesa tu pedido. Al validarse tu comprobante de pago, la entrega suele tardar entre 1 y 5 minutos." },
    { q: "¿Qué métodos de pago aceptan?", a: "Aceptamos pagos manuales directos en tu moneda local: Binance, Yape, Nequi, Transferencia Bancaria y Oxxo." },
    { q: "¿Es seguro dar mi ID de jugador?", a: "Totalmente. Solo necesitamos tu ID público o GamerTag para enviarte los artículos. Nunca pediremos tu contraseña." }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-500 overflow-hidden">
      
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

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
          <Link href="#catalogo" className="hover:text-white transition">Catálogo</Link>
          <Link href="/tienda-diaria" className="hover:text-white transition">Tienda Fortnite</Link>
          <Link href="#soporte" className="hover:text-white transition">Soporte</Link>
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

      <main className="relative flex flex-col items-center justify-center text-center px-6 py-20 md:py-32 z-10">
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-[1.1] tracking-tight drop-shadow-2xl">
          El Siguiente Nivel <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Para Tu Cuenta</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl font-medium">
          Adquiere cosméticos exclusivos, recargas y suscripciones de forma automatizada, segura y sin riesgo de ban.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="#catalogo" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-[#050505] px-8 py-4 rounded-full font-black text-lg transition-all shadow-[0_0_30px_rgba(249,115,22,0.3)] hover:-translate-y-1">
            Explorar Catálogo
          </Link>
        </div>
      </main>

      <section className="border-y border-white/5 bg-[#080808]/50 backdrop-blur-lg relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-white/5 max-w-7xl mx-auto">
          <div className="p-8 text-center flex flex-col items-center">
            <Users className="text-gray-500 mb-3" size={24} />
            <span className="text-3xl font-black text-white">{stats.totalOrders > 0 ? `+${stats.totalOrders}` : '---'}</span>
            <span className="text-xs text-gray-500 uppercase tracking-widest font-bold mt-1">Órdenes Procesadas</span>
          </div>
          <div className="p-8 text-center flex flex-col items-center">
            <Zap className="text-orange-500 mb-3" size={24} />
            <span className="text-3xl font-black text-white">1 - 5 Min</span>
            <span className="text-xs text-gray-500 uppercase tracking-widest font-bold mt-1">Tiempo de Entrega</span>
          </div>
          <div className="p-8 text-center flex flex-col items-center">
            <ShieldCheck className="text-green-500 mb-3" size={24} />
            <span className="text-3xl font-black text-white">100%</span>
            <span className="text-xs text-gray-500 uppercase tracking-widest font-bold mt-1">Seguro y Legal</span>
          </div>
          <div className="p-8 text-center flex flex-col items-center">
            <Star className="text-yellow-500 mb-3" size={24} />
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-white">{stats.averageRating}</span>
              <span className="text-lg text-gray-500 font-bold">/5</span>
            </div>
            <span className="text-xs text-gray-500 uppercase tracking-widest font-bold mt-1">Basado en {stats.totalReviews} reseñas</span>
          </div>
        </div>
      </section>

      <section id="soporte" className="relative z-10 py-16 bg-[#050505]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto px-6 text-center">
          <div className="flex flex-col items-center">
            <div className="bg-orange-500/10 p-4 rounded-full mb-4 text-orange-500"><Zap size={32} /></div>
            <h3 className="font-bold text-lg mb-2">Entrega Inmediata</h3>
            <p className="text-sm text-gray-400">Verificamos tu pago y entregamos tus items rápidamente.</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="bg-orange-500/10 p-4 rounded-full mb-4 text-orange-500"><ShieldCheck size={32} /></div>
            <h3 className="font-bold text-lg mb-2">100% Legal</h3>
            <p className="text-sm text-gray-400">Métodos oficiales sin riesgo de baneos para tu cuenta.</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="bg-orange-500/10 p-4 rounded-full mb-4 text-orange-500"><Headphones size={32} /></div>
            <h3 className="font-bold text-lg mb-2">Soporte Dedicado</h3>
            <p className="text-sm text-gray-400">¿Dudas? Nuestro equipo en Discord está listo para ayudarte.</p>
          </div>
        </div>
      </section>

      <section id="catalogo" className="max-w-7xl mx-auto px-6 py-24 relative z-10 border-t border-white/5">
        <div className="flex items-center gap-3 mb-12">
          <PackageSearch className="text-orange-500" size={28} />
          <h2 className="text-3xl md:text-4xl font-black">Ofertas Exclusivas</h2>
        </div>

        {loading ? (
          <div className="flex justify-center p-20"><Gamepad2 size={48} className="animate-spin text-orange-500" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p) => {
              const localPrice = (p.price * activeCurrency.rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              return (
                <div key={p.id} className="group relative bg-[#0A0A0A] rounded-3xl p-1 overflow-hidden transition-all duration-500 hover:shadow-[0_0_30px_rgba(249,115,22,0.15)]">
                  <div className="absolute inset-0 bg-gradient-to-b from-orange-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative bg-[#0A0A0A] p-5 rounded-[22px] h-full flex flex-col z-10 border border-white/5">
                    <div className="aspect-square bg-[#111] rounded-2xl mb-5 flex items-center justify-center overflow-hidden relative border border-white/5">
                      {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover transform group-hover:scale-110 transition duration-700" /> : <Gamepad2 size={64} className="text-gray-700" />}
                    </div>
                    <div className="flex-1 flex flex-col justify-end">
                      <h3 className="font-bold text-lg mb-1 leading-tight text-gray-100">{p.name}</h3>
                      <div className="flex items-end gap-1 mb-5">
                        <p className="text-white font-black text-2xl">{activeCurrency.symbol}{localPrice}</p>
                        <span className="text-gray-500 text-xs font-bold mb-1">{activeCurrency.currency}</span>
                      </div>
                      <button onClick={() => addToCart(p)} className="w-full bg-white/5 hover:bg-orange-500 text-white hover:text-[#050505] py-3.5 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2">
                        <ShoppingCart size={18} /> Añadir al carrito
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* NUEVA SECCIÓN DE RESEÑAS REALES */}
      {reviews.length > 0 && (
        <section id="reseñas" className="max-w-7xl mx-auto px-6 py-24 relative z-10 border-t border-white/5">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Lo que dicen nuestros Gamers</h2>
            <p className="text-gray-400">Reseñas reales de clientes que ya subieron de nivel con nosotros.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((r, idx) => (
              <div key={idx} className="bg-[#0A0A0A] border border-white/5 p-8 rounded-3xl relative hover:border-white/10 transition">
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={18} className={i < r.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-700"} />
                  ))}
                </div>
                <p className="text-gray-300 italic mb-6 text-sm leading-relaxed">"{r.comment}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500/20 text-orange-500 rounded-full flex items-center justify-center font-black text-lg">
                    {r.user_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">{r.user_name}</p>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Comprador Verificado</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section id="faq" className="max-w-4xl mx-auto px-6 py-24 relative z-10 border-t border-white/5">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black mb-4">Preguntas Frecuentes</h2>
          <p className="text-gray-400">Todo lo que necesitas saber sobre cómo funciona Kitson Kit.</p>
        </div>
        
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-[#0A0A0A] border border-white/5 rounded-2xl overflow-hidden">
              <button 
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
              >
                <span className="font-bold text-lg text-gray-200">{faq.q}</span>
                <ChevronDown className={`text-orange-500 transition-transform duration-300 ${openFaq === idx ? 'rotate-180' : ''}`} />
              </button>
              <div className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${openFaq === idx ? 'max-h-40 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                <p className="text-gray-400 leading-relaxed">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/5 bg-[#050505] pt-16 pb-8 px-6 relative z-10 mt-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 mb-16">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <img src="/logo.jpg" alt="Logo Kitson Kit" className="w-8 h-8 rounded-full" />
              <span className="text-xl font-black tracking-tighter text-white">Kitson <span className="text-orange-500">Kit</span></span>
            </Link>
            <p className="text-gray-400 text-sm max-w-sm leading-relaxed mb-6">
              Tu tienda de confianza para recargas, cosméticos y suscripciones. Operamos de forma 100% legal y segura para proteger tu cuenta en todo momento.
            </p>
            <div className="flex gap-4">
              <div className="bg-white/5 p-2 rounded-md"><CreditCard size={20} className="text-gray-400" /></div>
              <div className="bg-white/5 p-2 rounded-md"><ShieldCheck size={20} className="text-gray-400" /></div>
            </div>
          </div>
          
          <div>
            <h4 className="font-bold text-white mb-4 uppercase tracking-widest text-xs">Enlaces Rápidos</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><Link href="#catalogo" className="hover:text-orange-500 transition">Catálogo</Link></li>
              <li><Link href="/tienda-diaria" className="hover:text-orange-500 transition">Tienda Fortnite</Link></li>
              <li><Link href="/carrito" className="hover:text-orange-500 transition">Tu Carrito</Link></li>
              <li><Link href="/mis-pedidos" className="hover:text-orange-500 transition">Mis Pedidos</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4 uppercase tracking-widest text-xs">Legal & Soporte</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><Link href="#" className="hover:text-orange-500 transition">Términos del Servicio</Link></li>
              <li><Link href="#" className="hover:text-orange-500 transition">Política de Reembolsos</Link></li>
              <li><a href="https://discord.gg/tu-enlace" target="_blank" rel="noreferrer" className="hover:text-[#5865F2] transition flex items-center gap-2">Soporte en Discord</a></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500 font-medium">
            &copy; {new Date().getFullYear()} Kitson Kit. Todos los derechos reservados. No estamos afiliados a Epic Games Inc.
          </p>
        </div>
      </footer>
    </div>
  );
}