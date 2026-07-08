"use client";

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '../store/cartStore';
import { useCurrencyStore } from '../store/currencyStore';
import CurrencySelector from '../components/CurrencySelector';
import { signIn, signOut, useSession } from 'next-auth/react';
import { supabase } from '../lib/supabase';
import { 
  ShoppingCart, Gamepad2, Zap, ShieldCheck, Headphones, LogOut, 
  PackageSearch, Menu, X, Star, Wallet, Flame, BellRing, 
  Search, ChevronDown, CheckCircle2, MessageSquare, Shield, CreditCard
} from 'lucide-react';

interface Product { id: string; name: string; price: number; image_url?: string; }

export default function Home() {
  const addToCart = useCartStore((state) => state.addToCart);
  const totalItemsCount = useCartStore((state) => state.totalItems());
  const { getActiveConfig } = useCurrencyStore();
  const activeCurrency = getActiveConfig();
  const { data: session } = useSession();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({ totalOrders: 0, averageRating: 5.0, totalReviews: 0 });
  const [searchReview, setSearchReview] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const [livePurchase, setLivePurchase] = useState<{name: string, item: string} | null>(null);
  const lastOrderIdRef = useRef<number | null>(null);

  const faqs = [
    { q: "¿Cuánto tiempo tarda en llegar mi recarga?", a: "El sistema automatizado procesa tu pedido. Al validarse tu comprobante de pago, la entrega suele tardar entre 1 y 5 minutos." },
    { q: "¿Qué métodos de pago aceptan?", a: "Aceptamos pagos manuales directos en tu moneda local: Binance, Yape, Nequi, Transferencia Bancaria y Oxxo." },
    { q: "¿Es seguro dar mi ID de jugador?", a: "Totalmente. Solo necesitamos tu ID público o GamerTag para enviarte los artículos. Nunca pediremos tu contraseña." }
  ];

  useEffect(() => {
    async function fetchData() {
      const { data: productsData } = await supabase.from('products').select('*');
      if (productsData) setProducts(productsData);

      const { data: ordersData, count: ordersCount } = await supabase.from('orders').select('id, user_name, items', { count: 'exact', head: false }).order('created_at', { ascending: false }).limit(1);
      if (ordersData && ordersData.length > 0) {
        lastOrderIdRef.current = ordersData[0].id;
      }

      const { data: reviewsData } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
      let avg = 5.0; let revCount = 0;
      if (reviewsData && reviewsData.length > 0) {
        setReviews(reviewsData);
        revCount = reviewsData.length;
        avg = reviewsData.reduce((acc, curr) => acc + curr.rating, 0) / revCount;
      }
      setStats({ totalOrders: (ordersCount || 0) + 150, averageRating: avg, totalReviews: revCount });
      setLoading(false);
    }
    fetchData();

    const interval = setInterval(async () => {
      const { data } = await supabase.from('orders').select('id, user_name, items').order('created_at', { ascending: false }).limit(1);
      if (data && data.length > 0) {
        const latestOrder = data[0];
        if (lastOrderIdRef.current !== null && latestOrder.id !== lastOrderIdRef.current) {
          const itemName = latestOrder.items && latestOrder.items.length > 0 ? latestOrder.items[0].name : 'Recarga de Saldo';
          setLivePurchase({ name: latestOrder.user_name || 'Gamer Anónimo', item: itemName });
          setTimeout(() => setLivePurchase(null), 6000);
        }
        lastOrderIdRef.current = latestOrder.id;
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => { if(ratingCounts[r.rating as keyof typeof ratingCounts] !== undefined) ratingCounts[r.rating as keyof typeof ratingCounts]++; });
  const filteredReviews = reviews.filter(r => r.comment.toLowerCase().includes(searchReview.toLowerCase()) || r.user_name.toLowerCase().includes(searchReview.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-500 overflow-hidden relative">
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <header className="flex items-center justify-between p-4 md:px-8 border-b border-white/5 bg-[#050505]/95 backdrop-blur-xl sticky top-0 z-[100]">
        <div className="flex-1 flex justify-start">
          <Link href="/" className="flex items-center gap-3 group">
            <Image src="/logo.jpg" alt="Logo Kitson Kit" width={40} height={40} className="rounded-full border border-white/10 group-hover:border-orange-500 transition duration-300 object-cover" />
            <span className="text-2xl font-black text-white hidden xl:block">Kitson <span className="text-orange-500">Kit</span></span>
          </Link>
        </div>
        
        <nav className="hidden lg:flex flex-1 justify-center gap-8 font-medium text-sm text-gray-400">
          <Link href="/" className="text-white transition">Inicio</Link>
          <Link href="#catalogo" className="hover:text-white transition">Catálogo</Link>
          <Link href="/tienda-diaria" className="hover:text-white transition">Tienda Fortnite</Link>
          <Link href="/billetera" className="hover:text-white transition">Mi Billetera</Link>
        </nav>

        <div className="flex-1 flex items-center justify-end gap-4">
          <div className="hidden sm:block"><CurrencySelector /></div>
          <Link href="/carrito" className="flex items-center gap-2 hover:bg-white/10 transition bg-white/5 py-2 px-4 rounded-full border border-white/10">
            <ShoppingCart size={18} className="text-gray-400" /> 
            <span className="bg-orange-500 text-black text-xs font-black px-2 py-0.5 rounded-full">{totalItemsCount}</span>
          </Link>
          {session ? (
            <div className="hidden sm:flex items-center gap-3 bg-white/5 py-1.5 px-1.5 pr-4 rounded-full border border-white/10">
              <Link href="/mis-pedidos" className="flex items-center gap-2 hover:opacity-80 transition">
                <img src={session.user?.image || "/logo.jpg"} alt="Avatar" className="w-8 h-8 rounded-full" />
                <span className="text-sm font-bold text-gray-200">{session.user?.name}</span>
              </Link>
              <button onClick={() => signOut()} className="text-red-400 hover:text-red-300 ml-2 border-l border-white/10 pl-3"><LogOut size={16}/></button>
            </div>
          ) : (
            // CAMBIO: Botón genérico Iniciar Sesión (Abre opciones de Google, Discord y Email)
            <button onClick={() => signIn()} className="hidden sm:block bg-orange-500 hover:bg-orange-400 text-black px-6 py-2 rounded-full font-black text-sm transition">Iniciar Sesión</button>
          )}
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden text-gray-400 ml-1 p-2"><Menu size={28} /></button>
        </div>
      </header>

      {/* MENÚ MÓVIL ARREGLADO CON BOTONES DE SESIÓN */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[#0A0A0A] border-t border-white/10 flex flex-col p-6 fixed top-[73px] bottom-0 left-0 w-full z-[90] overflow-y-auto">
          <div className="flex flex-col gap-6 flex-1">
            <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-white border-b border-white/5 pb-4">Inicio</Link>
            <Link href="/#catalogo" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-white border-b border-white/5 pb-4">Catálogo</Link>
            <Link href="/tienda-diaria" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-white border-b border-white/5 pb-4">Tienda Fortnite</Link>
            <Link href="/billetera" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-white border-b border-white/5 pb-4">Mi Billetera</Link>
            <div className="pt-2"><CurrencySelector /></div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-white/10 pb-10">
            {!session ? (
              <button onClick={() => signIn()} className="w-full bg-orange-500 text-black py-4 rounded-xl font-black text-lg shadow-lg">Iniciar Sesión</button>
            ) : (
              <button onClick={() => signOut()} className="w-full bg-red-500/10 text-red-500 py-4 rounded-xl font-black text-lg border border-red-500/20">Cerrar Sesión</button>
            )}
          </div>
        </div>
      )}

      <div className={`fixed bottom-6 left-6 z-[120] glass-panel p-4 rounded-2xl flex items-center gap-4 border-l-4 border-l-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.2)] transition-all duration-700 ${livePurchase ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
        <div className="bg-orange-500/20 p-2 rounded-full"><BellRing size={20} className="text-orange-500 animate-bounce" /></div>
        <div>
          <p className="text-sm text-gray-300"><span className="font-bold text-white">{livePurchase?.name}</span> acaba de adquirir</p>
          <p className="text-sm font-black text-orange-400">{livePurchase?.item}</p>
        </div>
      </div>

      <main className="relative flex flex-col items-center justify-center text-center px-6 py-24 md:py-36 z-10 overflow-hidden">
        <div className="relative z-10 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel mb-8 border border-white/10 text-orange-500">
            <Flame size={14} className="animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest">Tienda Nº1 en Seguridad</span>
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-[1.1] tracking-tight drop-shadow-2xl">
            El Siguiente Nivel <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Para Tu Cuenta</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl font-medium">
            Adquiere cosméticos exclusivos, recargas y suscripciones de forma automatizada, segura y sin riesgo de ban.
          </p>
          <div className="flex gap-4">
            <Link href="#catalogo" className="bg-gradient-to-r from-orange-500 to-orange-600 text-black px-8 py-4 rounded-full font-black text-lg transition-all hover:scale-105">
              Explorar Catálogo
            </Link>
            <Link href="/tienda-diaria" className="glass-panel hover:bg-white/10 text-white px-8 py-4 rounded-full font-black text-lg transition-all hover:-translate-y-1 hidden sm:block">
              Tienda Diaria
            </Link>
          </div>
        </div>
      </main>

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
                <div key={p.id} className="group bg-[#0A0A0A] rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-all cursor-pointer">
                  <div className="aspect-square bg-[#111] rounded-xl mb-5 flex items-center justify-center overflow-hidden relative">
                    {p.image_url ? (
                      <Image src={p.image_url} alt={p.name} width={400} height={400} className="w-full h-full object-cover transform group-hover:scale-110 transition duration-700" />
                    ) : <Gamepad2 size={64} className="text-gray-700" />}
                  </div>
                  <h3 className="font-bold text-lg mb-1 text-gray-100">{p.name}</h3>
                  <div className="flex items-end gap-1 mb-5">
                    <p className="text-white font-black text-2xl">{activeCurrency.symbol}{localPrice}</p>
                    <span className="text-gray-500 text-xs font-bold mb-1">{activeCurrency.currency}</span>
                  </div>
                  <button onClick={() => addToCart(p)} className="w-full bg-white/5 hover:bg-orange-500 text-white hover:text-[#050505] py-3.5 rounded-xl font-bold transition flex items-center justify-center gap-2">
                    <ShoppingCart size={18} /> Añadir
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section id="reseñas" className="px-6 py-24 relative z-10 border-t border-white/5 bg-gradient-to-b from-[#050505] to-[#0A0A0A]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 border-l-4 border-orange-500 pl-6">
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight uppercase italic tracking-widest drop-shadow-md">Nuestra Squad <br/><span className="text-orange-500">de Leyendas</span></h2>
            <p className="text-gray-400 mt-4 max-w-xl font-medium">Lee las opiniones reales de los gamers que ya aseguraron su cuenta con nosotros.</p>
          </div>
          <div className="flex flex-col lg:flex-row gap-10">
            <div className="w-full lg:w-[350px] shrink-0 bg-[#0f0f0f] p-8 rounded-3xl border border-white/5 shadow-2xl h-fit relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-orange-600"></div>
              <div className="flex items-center gap-4 mb-2">
                <span className="text-6xl font-black text-white drop-shadow-md">{stats.averageRating.toFixed(1)}</span>
                <div>
                  <div className="flex gap-1 mb-1">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} size={18} className={i <= Math.round(stats.averageRating) ? "text-orange-500 fill-orange-500" : "text-gray-800"} />
                    ))}
                  </div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{stats.totalReviews} REVIEWS REALES</p>
                </div>
              </div>
              <div className="space-y-3 mt-8 mb-8">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = ratingCounts[stars as keyof typeof ratingCounts];
                  const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                  return (
                    <div key={stars} className="flex items-center gap-3 text-sm">
                      <span className="font-bold text-gray-400 w-4">{stars}★</span>
                      <div className="flex-1 h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 rounded-full" style={{ width: `${percentage}%` }}></div>
                      </div>
                      <span className="text-gray-600 font-mono text-xs w-6 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
              <button onClick={() => alert("Escribe tu reseña verificada en nuestro Discord Oficial")} className="w-full bg-white/5 hover:bg-orange-500 text-white hover:text-black py-4 rounded-xl font-black flex items-center justify-center gap-2 transition-all mb-8 border border-white/10 hover:border-orange-500">
                <MessageSquare size={18} /> Dejar mi Reseña
              </button>
            </div>
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type="text" placeholder="Buscar por usuario o palabra..." value={searchReview} onChange={(e) => setSearchReview(e.target.value)} className="w-full bg-[#0f0f0f] border border-white/5 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-orange-500/50 transition-colors" />
                </div>
              </div>
              <div className="space-y-4">
                {filteredReviews.length > 0 ? filteredReviews.map((r, idx) => (
                  <div key={idx} className="bg-[#0f0f0f] border border-white/5 p-6 rounded-2xl hover:border-white/10 transition-colors relative overflow-hidden">
                    <div className="flex items-start justify-between mb-4 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 bg-white/5 border border-white/10 text-orange-500 rounded-full flex items-center justify-center font-black text-xl">{r.user_name.charAt(0).toUpperCase()}</div>
                          <div className="absolute -bottom-1 -right-1 bg-[#0f0f0f] rounded-full p-0.5"><CheckCircle2 size={14} className="text-orange-500 bg-black rounded-full" /></div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-white text-lg">{r.user_name}</span>
                            <span className="bg-orange-500/10 text-orange-400 text-[10px] font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-1">Verificado</span>
                          </div>
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => <Star key={i} size={14} className={i < r.rating ? "text-orange-500 fill-orange-500" : "text-gray-800"} />)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-300 leading-relaxed font-medium relative z-10 italic">"{r.comment}"</p>
                  </div>
                )) : (
                  <div className="text-center py-12 bg-[#0f0f0f] rounded-2xl border border-white/5 text-gray-500 font-bold">El radar no encontró reseñas con esa búsqueda.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="max-w-4xl mx-auto px-6 py-24 relative z-10 border-t border-white/5">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black mb-4">Preguntas Frecuentes</h2>
          <p className="text-gray-400">Todo lo que necesitas saber sobre cómo funciona Kitson Kit.</p>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-[#0A0A0A] border border-white/5 rounded-2xl overflow-hidden">
              <button onClick={() => setOpenFaq(openFaq === idx ? null : idx)} className="w-full flex items-center justify-between p-6 text-left focus:outline-none hover:bg-white/5 transition-colors">
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

      <footer className="border-t border-white/5 bg-[#050505] pt-16 pb-8 px-6 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 mb-16">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image src="/logo.jpg" alt="Logo Kitson Kit" width={32} height={32} className="rounded-full" />
              <span className="text-xl font-black tracking-tighter text-white">Kitson <span className="text-orange-500">Kit</span></span>
            </Link>
            <p className="text-gray-400 text-sm max-w-sm leading-relaxed mb-6">
              Tu tienda de confianza para recargas, cosméticos y suscripciones. Operamos de forma 100% legal y segura para proteger tu cuenta en todo momento.
            </p>
            <div className="flex gap-4">
              <div className="bg-white/5 p-2 rounded-md"><CreditCard size={20} className="text-gray-400" /></div>
              <div className="bg-white/5 p-2 rounded-md"><Shield size={20} className="text-gray-400" /></div>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4 uppercase tracking-widest text-xs">Enlaces Rápidos</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><Link href="#catalogo" className="hover:text-orange-500 transition">Catálogo</Link></li>
              <li><Link href="/tienda-diaria" className="hover:text-orange-500 transition">Tienda Fortnite</Link></li>
              <li><Link href="/billetera" className="hover:text-orange-500 transition">Mi Billetera</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4 uppercase tracking-widest text-xs">Legal & Soporte</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><Link href="#" className="hover:text-orange-500 transition">Términos del Servicio</Link></li>
              <li><Link href="#" className="hover:text-orange-500 transition">Política de Reembolsos</Link></li>
              <li><a href="#" className="hover:text-[#5865F2] transition flex items-center gap-2">Soporte en Discord</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-white/5 pt-8 text-center">
          <p className="text-xs text-gray-500 font-medium">&copy; {new Date().getFullYear()} Kitson Kit. Todos los derechos reservados. No afiliados a Epic Games Inc.</p>
        </div>
      </footer>
    </div>
  );
}