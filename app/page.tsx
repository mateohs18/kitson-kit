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
  ShoppingCart, Gamepad2, LogOut,
  PackageSearch, Menu, X, Star, BellRing,
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
      const [{ data: productsData }, ultimaRes, { data: reviewsData }] = await Promise.all([
        supabase.from('products').select('*'),
        fetch('/api/ultima-compra'),
        supabase.from('reviews').select('*').order('created_at', { ascending: false }),
      ]);

      if (productsData) setProducts(productsData);

      const ultimaData = await ultimaRes.json();
      if (ultimaData.order) {
        lastOrderIdRef.current = ultimaData.order.id;
      }

      let avg = 5.0; let revCount = 0;
      if (reviewsData && reviewsData.length > 0) {
        setReviews(reviewsData);
        revCount = reviewsData.length;
        avg = reviewsData.reduce((acc, curr) => acc + curr.rating, 0) / revCount;
      }
      setStats({ totalOrders: 150, averageRating: avg, totalReviews: revCount });
      setLoading(false);
    }
    fetchData();

    const interval = setInterval(async () => {
      const res = await fetch('/api/ultima-compra');
      const data = await res.json();
      const latestOrder = data.order;
      if (latestOrder) {
        if (lastOrderIdRef.current !== null && latestOrder.id !== lastOrderIdRef.current) {
          setLivePurchase({ name: latestOrder.name, item: latestOrder.item });
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
    <div className="min-h-screen bg-[#14110C] text-[#F5F1E6] font-body selection:bg-[#E3A23D] selection:text-[#0A0806]">

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
          <Link href="#catalogo" className="hover:opacity-70 transition">Catálogo</Link>
          <Link href="/tienda-diaria" className="hover:opacity-70 transition">Tienda Fortnite</Link>
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
                <span className="text-sm font-bold text-[#F5F1E6]">{session.user?.name}</span>
              </Link>
              <button onClick={() => signOut()} className="text-red-400 hover:text-red-300 ml-2 border-l border-white/10 pl-3"><LogOut size={16}/></button>
            </div>
          ) : (
            <button onClick={() => signIn()} className="hidden sm:block bg-[#0A0806] hover:opacity-90 text-[#E3A23D] px-6 py-2 rounded-lg font-black text-sm transition border-2 border-[#0A0806]">Iniciar Sesión</button>
          )}
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden text-[#0A0806] ml-1 p-2"><Menu size={28} /></button>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[#1D1913] border-t-4 border-[#0A0806] flex flex-col p-6 fixed top-[73px] bottom-0 left-0 w-full z-[90] overflow-y-auto">
          <div className="flex flex-col gap-6 flex-1">
            <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="font-display text-xl font-bold text-[#F5F1E6] border-b border-white/10 pb-4">Inicio</Link>
            <Link href="/#catalogo" onClick={() => setIsMobileMenuOpen(false)} className="font-display text-xl font-bold text-[#F5F1E6] border-b border-white/10 pb-4">Catálogo</Link>
            <Link href="/tienda-diaria" onClick={() => setIsMobileMenuOpen(false)} className="font-display text-xl font-bold text-[#F5F1E6] border-b border-white/10 pb-4">Tienda Fortnite</Link>
            <Link href="/billetera" onClick={() => setIsMobileMenuOpen(false)} className="font-display text-xl font-bold text-[#F5F1E6] border-b border-white/10 pb-4">Mi Billetera</Link>
            <div className="pt-2"><CurrencySelector /></div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/10 pb-10">
            {!session ? (
              <button onClick={() => signIn()} className="w-full bg-[#E3A23D] text-[#0A0806] py-4 rounded-xl font-black text-lg border-[3px] border-[#0A0806]">Iniciar Sesión</button>
            ) : (
              <button onClick={() => signOut()} className="w-full bg-red-500/10 text-red-400 py-4 rounded-xl font-black text-lg border border-red-500/20">Cerrar Sesión</button>
            )}
          </div>
        </div>
      )}

      <div className={`fixed bottom-6 left-6 z-[120] kk-panel p-4 rounded-2xl flex items-center gap-4 transition-all duration-700 ${livePurchase ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
        <div className="bg-[#E3A23D] p-2 rounded-full border-2 border-[#0A0806]"><BellRing size={20} className="text-[#0A0806] animate-bounce" /></div>
        <div>
          <p className="text-sm text-[#9A9384]"><span className="font-bold text-[#F5F1E6]">{livePurchase?.name}</span> acaba de adquirir</p>
          <p className="text-sm font-black text-[#E3A23D]">{livePurchase?.item}</p>
        </div>
      </div>

      <section className="relative px-6 md:px-12 py-16 md:py-20 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center max-w-7xl mx-auto">
        <div>
          <span className="inline-flex items-center gap-2 bg-[#4A93D6] text-[#0C2438] font-bold text-xs px-4 py-2 rounded-lg border-2 border-[#0A0806] mb-6">
            <span className="flex h-2 w-2 rounded-full bg-[#0C2438] animate-pulse"></span>
            TIENDA ACTIVA HOY
          </span>
          <h1 className="font-display font-extrabold text-4xl md:text-6xl leading-[1.05] mb-6">
            Subí de nivel<br/>tu <span className="text-[#E3A23D]">cuenta.</span>
          </h1>
          <p className="text-base md:text-lg text-[#9A9384] mb-8 max-w-xl">
            Adquiere cosméticos exclusivos, recargas y suscripciones de forma automatizada, segura y sin riesgo de ban.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="#catalogo" className="bg-[#E3A23D] text-[#0A0806] px-8 py-4 rounded-xl font-display font-bold text-lg border-[3px] border-[#0A0806] transition-transform hover:-translate-y-0.5">
              Ver tienda de hoy
            </Link>
            <Link href="/tienda-diaria" className="bg-transparent border-[3px] border-[#F5F1E6] text-[#F5F1E6] px-8 py-4 rounded-xl font-bold text-lg transition-transform hover:-translate-y-0.5 hidden sm:block">
              Tienda Diaria
            </Link>
          </div>
        </div>

        <div className="bg-[#4A93D6] border-[4px] border-[#0A0806] rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute inset-0 kk-dots opacity-10"></div>
          <span className="absolute top-4 right-4 bg-[#F5F1E6] border-2 border-[#0A0806] rounded-lg px-3 py-1 font-display font-bold text-xs text-[#0A0806] z-10">¡Hola!</span>
          <div className="bg-[#F5F1E6] border-[3px] border-[#0A0806] rounded-2xl p-6 relative z-[1] flex items-center justify-center aspect-square max-w-sm mx-auto">
            <Image src="/logo.jpg" alt="Mascota Kitson Kit" width={280} height={280} priority className="w-4/5 h-4/5 object-contain rounded-full" />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 border-y-4 border-[#0A0806] max-w-7xl mx-auto">
        <div className="p-5 md:p-6 border-r-2 border-[#0A0806]">
          <div className="font-mono font-semibold text-xl md:text-2xl text-[#E3A23D]">{(stats.totalOrders + 30000).toLocaleString('en-US')}</div>
          <div className="text-xs text-[#9A9384] font-medium">Pedidos entregados</div>
        </div>
        <div className="p-5 md:p-6 border-r-2 border-[#0A0806] md:border-r-2">
          <div className="font-mono font-semibold text-xl md:text-2xl text-[#E3A23D]">2–5 min</div>
          <div className="text-xs text-[#9A9384] font-medium">Tiempo de entrega</div>
        </div>
        <div className="p-5 md:p-6 border-r-2 border-[#0A0806]">
          <div className="font-mono font-semibold text-xl md:text-2xl text-[#E3A23D]">{stats.averageRating.toFixed(1)}</div>
          <div className="text-xs text-[#9A9384] font-medium">Calificación promedio</div>
        </div>
        <div className="p-5 md:p-6">
          <div className="font-mono font-semibold text-xl md:text-2xl text-[#E3A23D]">6</div>
          <div className="text-xs text-[#9A9384] font-medium">Métodos de pago</div>
        </div>
      </section>

      <section id="catalogo" className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex items-center gap-3 mb-10">
          <PackageSearch className="text-[#E3A23D]" size={28} />
          <h2 className="font-display font-bold text-3xl md:text-4xl">Ofertas Exclusivas</h2>
        </div>
        {loading ? (
          <div className="flex justify-center p-20"><Gamepad2 size={48} className="animate-spin text-[#E3A23D]" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p) => {
              const localPrice = (p.price * activeCurrency.rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              return (
                <div key={p.id} className="kk-panel kk-card-hover rounded-2xl overflow-hidden cursor-pointer">
                  <div className="bg-[#E3A23D] border-b-[3px] border-[#0A0806] px-3 py-1.5">
                    <span className="font-display font-bold text-[10px] uppercase tracking-wide text-[#0A0806]">Oferta</span>
                  </div>
                  <div className="p-5">
                    <div className="aspect-square bg-[#14110C] rounded-xl mb-5 flex items-center justify-center overflow-hidden relative border-2 border-[#0A0806]">
                      {p.image_url ? (
                        <Image src={p.image_url} alt={p.name} width={400} height={400} className="w-full h-full object-cover" />
                      ) : <Gamepad2 size={64} className="text-[#9A9384]" />}
                    </div>
                    <h3 className="font-bold text-lg mb-1 text-[#F5F1E6]">{p.name}</h3>
                    <div className="flex items-end gap-1 mb-5">
                      <p className="text-[#E3A23D] font-mono font-semibold text-2xl">{activeCurrency.symbol}{localPrice}</p>
                      <span className="text-[#9A9384] text-xs font-bold mb-1">{activeCurrency.currency}</span>
                    </div>
                    <button onClick={() => addToCart(p)} className="w-full bg-[#0A0806] hover:bg-[#E3A23D] text-[#E3A23D] hover:text-[#0A0806] py-3.5 rounded-xl font-bold transition flex items-center justify-center gap-2 border-2 border-[#0A0806]">
                      <ShoppingCart size={18} /> Añadir
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section id="reseñas" className="px-6 py-20 border-t-4 border-[#0A0806]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 border-l-[6px] border-[#E3A23D] pl-6">
            <h2 className="font-display font-bold text-3xl md:text-5xl leading-tight">Nuestra Squad <br/><span className="text-[#E3A23D]">de Leyendas</span></h2>
            <p className="text-[#9A9384] mt-4 max-w-xl font-medium">Lee las opiniones reales de los gamers que ya aseguraron su cuenta con nosotros.</p>
          </div>
          <div className="flex flex-col lg:flex-row gap-10">
            <div className="w-full lg:w-[350px] shrink-0 kk-panel p-8 rounded-3xl h-fit relative overflow-hidden">
              <div className="flex items-center gap-4 mb-2">
                <span className="font-display font-bold text-6xl text-[#F5F1E6]">{stats.averageRating.toFixed(1)}</span>
                <div>
                  <div className="flex gap-1 mb-1">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} size={18} className={i <= Math.round(stats.averageRating) ? "text-[#E3A23D] fill-[#E3A23D]" : "text-[#3A3527]"} />
                    ))}
                  </div>
                  <p className="text-xs font-bold text-[#9A9384] uppercase tracking-widest">{stats.totalReviews} reviews reales</p>
                </div>
              </div>
              <div className="space-y-3 mt-8 mb-8">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = ratingCounts[stars as keyof typeof ratingCounts];
                  const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                  return (
                    <div key={stars} className="flex items-center gap-3 text-sm">
                      <span className="font-bold text-[#9A9384] w-4">{stars}★</span>
                      <div className="flex-1 h-2 bg-[#14110C] rounded-full overflow-hidden border border-[#0A0806]">
                        <div className="h-full bg-[#E3A23D]" style={{ width: `${percentage}%` }}></div>
                      </div>
                      <span className="text-[#9A9384] font-mono text-xs w-6 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
              <Link href="/mis-pedidos" className="w-full bg-[#14110C] hover:bg-[#E3A23D] text-[#F5F1E6] hover:text-[#0A0806] py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all mb-2 border-2 border-[#0A0806]">
                <MessageSquare size={18} /> Dejar mi Reseña
              </Link>
            </div>
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A9384]" />
                  <input type="text" placeholder="Buscar por usuario o palabra..." value={searchReview} onChange={(e) => setSearchReview(e.target.value)} className="w-full bg-[#1D1913] border-2 border-[#0A0806] rounded-xl py-4 pl-12 pr-4 text-[#F5F1E6] focus:outline-none focus:border-[#E3A23D] transition-colors" />
                </div>
              </div>
              <div className="space-y-4">
                {filteredReviews.length > 0 ? filteredReviews.map((r, idx) => (
                  <div key={idx} className="kk-panel p-6 rounded-2xl relative overflow-hidden">
                    <div className="flex items-start justify-between mb-4 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 bg-[#14110C] border-2 border-[#0A0806] text-[#E3A23D] rounded-full flex items-center justify-center font-display font-bold text-xl">{r.user_name.charAt(0).toUpperCase()}</div>
                          <div className="absolute -bottom-1 -right-1 bg-[#1D1913] rounded-full p-0.5"><CheckCircle2 size={14} className="text-[#E3A23D]" /></div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-[#F5F1E6] text-lg">{r.user_name}</span>
                            <span className="bg-[#E3A23D]/15 text-[#E3A23D] text-[10px] font-black uppercase px-2 py-0.5 rounded-md">Verificado</span>
                          </div>
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => <Star key={i} size={14} className={i < r.rating ? "text-[#E3A23D] fill-[#E3A23D]" : "text-[#3A3527]"} />)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-[#D9D4C7] leading-relaxed font-medium relative z-10 italic">&quot;{r.comment}&quot;</p>
                  </div>
                )) : (
                  <div className="text-center py-12 kk-panel rounded-2xl text-[#9A9384] font-bold">El radar no encontró reseñas con esa búsqueda.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="max-w-4xl mx-auto px-6 py-20 border-t-4 border-[#0A0806]">
        <div className="text-center mb-12">
          <h2 className="font-display font-bold text-3xl md:text-4xl mb-4">Preguntas Frecuentes</h2>
          <p className="text-[#9A9384]">Todo lo que necesitas saber sobre cómo funciona Kitson Kit.</p>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="kk-panel rounded-2xl overflow-hidden">
              <button onClick={() => setOpenFaq(openFaq === idx ? null : idx)} className="w-full flex items-center justify-between p-6 text-left focus:outline-none hover:bg-white/5 transition-colors">
                <span className="font-bold text-lg text-[#F5F1E6]">{faq.q}</span>
                <ChevronDown className={`text-[#E3A23D] transition-transform duration-300 ${openFaq === idx ? 'rotate-180' : ''}`} />
              </button>
              <div className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${openFaq === idx ? 'max-h-40 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                <p className="text-[#9A9384] leading-relaxed">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t-4 border-[#0A0806] bg-[#0A0806] pt-16 pb-8 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 mb-16">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full border-2 border-[#E3A23D] overflow-hidden">
                <Image src="/logo.jpg" alt="Logo Kitson Kit" width={32} height={32} className="w-full h-full object-cover" />
              </div>
              <span className="font-display font-bold text-xl text-[#F5F1E6]">KITSON KIT</span>
            </Link>
            <p className="text-[#9A9384] text-sm max-w-sm leading-relaxed mb-6">
              Tu tienda de confianza para recargas, cosméticos y suscripciones. Operamos de forma 100% legal y segura para proteger tu cuenta en todo momento.
            </p>
            <div className="flex gap-4">
              <div className="bg-[#1D1913] border border-[#3A3527] p-2 rounded-md"><CreditCard size={20} className="text-[#9A9384]" /></div>
              <div className="bg-[#1D1913] border border-[#3A3527] p-2 rounded-md"><Shield size={20} className="text-[#9A9384]" /></div>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-[#F5F1E6] mb-4 uppercase tracking-widest text-xs">Enlaces Rápidos</h4>
            <ul className="space-y-3 text-sm text-[#9A9384]">
              <li><Link href="#catalogo" className="hover:text-[#E3A23D] transition">Catálogo</Link></li>
              <li><Link href="/tienda-diaria" className="hover:text-[#E3A23D] transition">Tienda Fortnite</Link></li>
              <li><Link href="/billetera" className="hover:text-[#E3A23D] transition">Mi Billetera</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-[#F5F1E6] mb-4 uppercase tracking-widest text-xs">Legal & Soporte</h4>
            <ul className="space-y-3 text-sm text-[#9A9384]">
              <li><Link href="/terminos" className="hover:text-[#E3A23D] transition">Términos del Servicio</Link></li>
              <li><Link href="/terminos" className="hover:text-[#E3A23D] transition">Política de Reembolsos</Link></li>
              <li><a href="https://discord.gg/gPumDeNvp6" target="_blank" rel="noopener noreferrer" className="hover:text-[#5865F2] transition flex items-center gap-2">Soporte en Discord</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-[#1D1913] pt-8 text-center">
          <p className="text-xs text-[#9A9384] font-medium">&copy; {new Date().getFullYear()} Kitson Kit. Todos los derechos reservados. No afiliados a Epic Games Inc.</p>
        </div>
      </footer>
    </div>
  );
}
