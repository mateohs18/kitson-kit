"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '../store/cartStore';
import { useCurrencyStore } from '../store/currencyStore';
import CurrencySelector from '../components/CurrencySelector';
import { signIn, signOut, useSession } from 'next-auth/react';
import { supabase } from '../lib/supabase';
import { faqs } from '../lib/faqs';
import {
  ShoppingCart, Gamepad2,
  PackageSearch, Menu, X, Star, BellRing,
  Search, ChevronDown, CheckCircle2, MessageSquare,
  Send, MessageCircle, Hourglass, Gift
} from 'lucide-react';

interface Product { id: string; name: string; price: number; compare_at_price?: number | null; image_url?: string; delivery_type?: 'regalo' | 'recarga'; price_mx?: number | null; price_co?: number | null; price_pe?: number | null; }

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
  const [isScrolled, setIsScrolled] = useState(false);
  const [hoursLeft, setHoursLeft] = useState(0);
  const [stats, setStats] = useState({ totalOrders: 0, averageRating: 5.0, totalReviews: 0 });
  const [searchReview, setSearchReview] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const [livePurchase, setLivePurchase] = useState<{name: string, item: string} | null>(null);

  useEffect(() => {
    async function fetchData() {
      const [{ data: productsData }, ultimaRes, { data: reviewsData }] = await Promise.all([
        supabase.from('products').select('*'),
        fetch('/api/ultima-compra'),
        supabase.from('reviews').select('*').order('created_at', { ascending: false }),
      ]);

      if (productsData) setProducts(productsData);

      const ultimaData = await ultimaRes.json();
      let avg = 5.0; let revCount = 0;
      if (reviewsData && reviewsData.length > 0) {
        setReviews(reviewsData);
        revCount = reviewsData.length;
        avg = reviewsData.reduce((acc, curr) => acc + curr.rating, 0) / revCount;
      }
      setStats({ totalOrders: ultimaData.totalOrders || 0, averageRating: avg, totalReviews: revCount });
      setLoading(false);
    }
    fetchData();

    // 🔴 TIEMPO REAL: en vez de preguntar cada 5 segundos si hubo una compra
    // (miles de consultas por día), nos suscribimos al feed y Supabase nos
    // avisa al instante cuando entra una orden nueva.
    const canal = supabase
      .channel('feed-compras')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'feed_compras' },
        (payload: any) => {
          const compra = payload?.new;
          if (!compra) return;
          setLivePurchase({
            name: compra.name || 'Gamer Anónimo',
            item: compra.item || 'Recarga de Saldo',
          });
          setTimeout(() => setLivePurchase(null), 6000);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(canal); };
  }, []);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    function actualizar() {
      const ahora = new Date();
      const proximoReinicio = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate() + 1, 0, 0, 0));
      setHoursLeft(Math.max(0, Math.round((proximoReinicio.getTime() - ahora.getTime()) / 3600000)));
    }
    actualizar();
    const t = setInterval(actualizar, 60000);
    return () => clearInterval(t);
  }, []);

  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => { if(ratingCounts[r.rating as keyof typeof ratingCounts] !== undefined) ratingCounts[r.rating as keyof typeof ratingCounts]++; });
  const filteredReviews = reviews.filter(r => r.comment.toLowerCase().includes(searchReview.toLowerCase()) || r.user_name.toLowerCase().includes(searchReview.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#14110C] text-[#F5F1E6] font-body selection:bg-[#E3A23D] selection:text-[#0A0806]">

      <header className={`flex items-center justify-between border-b-4 border-[#0A0806] bg-[#E3A23D] sticky top-0 z-[100] transition-all duration-300 ${isScrolled ? 'p-2.5 md:px-8' : 'p-4 md:px-8'}`}>
        <div className="flex-1 flex justify-start">
          <Link href="/" className="flex items-center gap-3 group">
            <div className={`rounded-full border-[3px] border-[#0A0806] overflow-hidden bg-[#F5F1E6] transition-all duration-300 ${isScrolled ? 'w-8 h-8' : 'w-10 h-10'}`}>
              <Image src="/logo.jpg" alt="Logo Kitson Kit" width={40} height={40} className="w-full h-full object-cover" />
            </div>
            <span className="font-display font-bold text-xl text-[#0A0806] hidden xl:block">KITSON KIT</span>
          </Link>
        </div>

        <nav className="hidden lg:flex flex-1 justify-center gap-8 font-semibold text-sm text-[#0A0806]">
          <Link href="/" className="relative py-1 group">Inicio<span className="absolute left-0 -bottom-0.5 w-0 h-[2px] bg-[#0A0806] transition-all duration-300 group-hover:w-full"></span></Link>
          <Link href="#catalogo" className="relative py-1 group">Catálogo<span className="absolute left-0 -bottom-0.5 w-0 h-[2px] bg-[#0A0806] transition-all duration-300 group-hover:w-full"></span></Link>
          <Link href="/tienda-diaria" className="relative py-1 group flex items-center gap-1.5">
            Tienda Fortnite
            <span className="bg-[#0A0806]/10 text-[#0A0806] text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><Hourglass size={9} />{hoursLeft}h</span>
            <span className="absolute left-0 -bottom-0.5 w-0 h-[2px] bg-[#0A0806] transition-all duration-300 group-hover:w-full"></span>
          </Link>
          <Link href="/mi-cuenta" className="relative py-1 group">Mi Cuenta<span className="absolute left-0 -bottom-0.5 w-0 h-[2px] bg-[#0A0806] transition-all duration-300 group-hover:w-full"></span></Link>
        </nav>

        <div className="flex-1 flex items-center justify-end gap-3">
          <div className="hidden sm:block"><CurrencySelector /></div>
          <Link href="/carrito" className="flex items-center gap-2 bg-[#0A0806] text-[#E3A23D] py-2 px-4 rounded-lg font-bold hover:opacity-90 hover:-translate-y-0.5 transition-all">
            <ShoppingCart size={18} />
            <span className="text-xs font-black">{totalItemsCount}</span>
          </Link>
          {session ? (
            <Link href="/mi-cuenta" className="hidden sm:flex items-center gap-2 bg-[#0A0806] py-1.5 px-1.5 pr-4 rounded-lg hover:opacity-80 transition">
              <Image src={session.user?.image || "/logo.jpg"} alt="Avatar" width={32} height={32} className="w-8 h-8 rounded-full border-2 border-[#E3A23D] object-cover" />
              <span className="text-sm font-bold text-[#F5F1E6]">{session.user?.name}</span>
            </Link>
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
            <Link href="/mi-cuenta" onClick={() => setIsMobileMenuOpen(false)} className="font-display text-xl font-bold text-[#F5F1E6] border-b border-white/10 pb-4">Mi Cuenta</Link>
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

      <section className="relative px-6 md:px-12 pt-16 pb-24 md:pt-20 md:pb-32 grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-14 items-center max-w-7xl mx-auto">
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

          <div className="mt-8 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-[#9A9384] uppercase tracking-widest mr-1">Pagá con:</span>
            {['Binance', 'Yape', 'Nequi', 'OXXO', 'Transferencia', 'Saldo Kitson'].map((m) => (
              <span key={m} className="bg-[#1D1913] border-2 border-[#0A0806] rounded-lg px-3 py-1.5 text-[11px] font-bold text-[#D9D4C7]">{m}</span>
            ))}
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

      <section className={`grid ${(stats.totalOrders > 0 || stats.totalReviews > 0) ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2'} border-y-4 border-[#0A0806] max-w-7xl mx-auto`}>
        {stats.totalOrders > 0 && (
          <div className="p-5 md:p-6 border-r-2 border-[#0A0806]">
            <div className="font-mono font-semibold text-xl md:text-2xl text-[#E3A23D]">{stats.totalOrders.toLocaleString('en-US')}</div>
            <div className="text-xs text-[#9A9384] font-medium">Pedidos entregados</div>
          </div>
        )}
        <div className="p-5 md:p-6 border-r-2 border-[#0A0806] md:border-r-2">
          <div className="font-mono font-semibold text-xl md:text-2xl text-[#E3A23D]">2–5 min</div>
          <div className="text-xs text-[#9A9384] font-medium">Tiempo de entrega</div>
        </div>
        {stats.totalReviews > 0 && (
          <div className="p-5 md:p-6 border-r-2 border-[#0A0806]">
            <div className="font-mono font-semibold text-xl md:text-2xl text-[#E3A23D]">{stats.averageRating.toFixed(1)}</div>
            <div className="text-xs text-[#9A9384] font-medium">Calificación promedio</div>
          </div>
        )}
        <div className="p-5 md:p-6">
          <div className="font-mono font-semibold text-xl md:text-2xl text-[#E3A23D]">24/7</div>
          <div className="text-xs text-[#9A9384] font-medium">Bots de entrega activos</div>
        </div>
      </section>

      <section id="como-funciona" className="max-w-7xl mx-auto px-6 py-20 border-b-4 border-[#0A0806]">
        <div className="text-center mb-12">
          <span className="inline-block bg-[#4A93D6] text-[#0C2438] font-bold text-xs px-4 py-2 rounded-lg border-2 border-[#0A0806] mb-4">PROCESO DE COMPRA</span>
          <h2 className="font-display font-bold text-3xl md:text-4xl">¿Cómo <span className="text-[#E3A23D]">funciona?</span></h2>
          <p className="text-[#9A9384] mt-3 max-w-2xl mx-auto">De la tienda a tu casillero de Fortnite en 4 pasos. Sin pedirte nunca tu contraseña.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { n: '01', titulo: 'Agreganos en Fortnite', desc: 'Vinculá tu cuenta con tu nombre de Epic y agregá a nuestro bot como amigo. Solo tu nombre público — jamás tu contraseña.', extra: 'Vincular cuenta →', link: '/vincular-cuenta' },
            { n: '02', titulo: 'Elegí tus artículos', desc: 'Skins de la tienda del día, packs de pavos, el Club de Fortnite o nuestras ofertas exclusivas. Precios claros en tu moneda.', extra: null, link: null },
            { n: '03', titulo: 'Pagá como quieras', desc: 'Saldo Kitson para entrega automática al instante, o transferencia local (Binance, Yape, Nequi, OXXO) con verificación en horas.', extra: null, link: null },
            { n: '04', titulo: 'Recibí tu regalo', desc: 'Nuestro bot te lo envía dentro del juego. Si es tu primera compra, Epic exige 48hs de amistad — después, todo llega en minutos.', extra: null, link: null },
          ].map((paso, i) => (
            <div key={paso.n} className="kk-panel rounded-2xl p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono font-bold text-3xl text-[#E3A23D]">{paso.n}</span>
                {i === 3 && <span className="bg-[#7BC77E]/15 text-[#7BC77E] text-[10px] font-black px-2.5 py-1 rounded-full border border-[#7BC77E]/30">¡GG!</span>}
              </div>
              <h3 className="font-display font-bold text-lg mb-2 leading-snug">{paso.titulo}</h3>
              <p className="text-sm text-[#9A9384] leading-relaxed">{paso.desc}</p>
              {paso.extra && paso.link && (
                <Link href={paso.link} className="inline-block mt-3 text-sm font-bold text-[#4A93D6] hover:underline underline-offset-2">{paso.extra}</Link>
              )}
            </div>
          ))}
        </div>
      </section>

      <section id="catalogo" className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex items-center gap-3 mb-10">
          <PackageSearch className="text-[#E3A23D]" size={28} />
          <h2 className="font-display font-bold text-3xl md:text-4xl">Ofertas Exclusivas</h2>
        </div>
        {loading ? (
          <div className="flex justify-center p-20"><Gamepad2 size={48} className="animate-spin text-[#E3A23D]" /></div>
        ) : products.length === 0 ? (
          <div className="kk-panel p-12 rounded-3xl text-center max-w-xl mx-auto">
            <PackageSearch size={40} className="mx-auto text-[#E3A23D] mb-4" />
            <h3 className="font-display text-xl font-bold mb-2">Todavía no hay ofertas cargadas</h3>
            <p className="text-[#9A9384] text-sm mb-6">Mientras tanto, mirá la Tienda Diaria — ahí siempre hay algo nuevo.</p>
            <Link href="/tienda-diaria" className="bg-[#E3A23D] text-[#0A0806] px-6 py-3 rounded-xl font-display font-bold inline-block border-[3px] border-[#0A0806]">Ver Tienda Diaria</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p) => {
              const precioFijoPais = activeCurrency.id === 'MX' ? p.price_mx : activeCurrency.id === 'CO' ? p.price_co : activeCurrency.id === 'PE' ? p.price_pe : null;
              const localPrice = (precioFijoPais ?? (p.price * activeCurrency.rate)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              const esRecarga = p.delivery_type === 'recarga';
              const tieneDescuento = !!p.compare_at_price && p.compare_at_price > p.price;
              const precioAntes = tieneDescuento ? (p.compare_at_price! * activeCurrency.rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : null;
              const porcentajeOff = tieneDescuento ? Math.round((1 - p.price / p.compare_at_price!) * 100) : 0;
              return (
                <div key={p.id} className="kk-panel kk-card-hover rounded-2xl overflow-hidden cursor-pointer">
                  <div className={`flex items-center justify-between border-b-[3px] border-[#0A0806] px-3 py-1.5 ${esRecarga ? 'bg-[#4A93D6]' : 'bg-[#E3A23D]'}`}>
                    <span className={`font-display font-bold text-[10px] uppercase tracking-wide ${esRecarga ? 'text-[#0C2438]' : 'text-[#0A0806]'}`}>
                      {esRecarga ? <>⚡ Recarga directa</> : <span className="inline-flex items-center gap-1"><Gift size={11} /> Regalo</span>}
                    </span>
                    {tieneDescuento && <span className="bg-red-500 text-white text-[10px] font-display font-bold px-2 py-0.5 rounded-full">-{porcentajeOff}%</span>}
                  </div>
                  <div className="p-5">
                    <div className="aspect-square bg-[#14110C] rounded-xl mb-5 flex items-center justify-center overflow-hidden relative border-2 border-[#0A0806]">
                      {p.image_url ? (
                        <Image src={p.image_url} alt={p.name} width={400} height={400} className="w-full h-full object-cover" />
                      ) : <Gamepad2 size={64} className="text-[#9A9384]" />}
                    </div>
                    <h3 className="font-bold text-lg mb-1 text-[#F5F1E6]">{p.name}</h3>
                    {tieneDescuento ? (
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-[#5A554A] font-mono text-sm line-through">{activeCurrency.symbol}{precioAntes}</span>
                        <p className="text-[#E3A23D] font-mono font-semibold text-2xl">{activeCurrency.symbol}{localPrice}</p>
                      </div>
                    ) : (
                      <div className="flex items-end gap-1 mb-3">
                        <p className="text-[#E3A23D] font-mono font-semibold text-2xl">{activeCurrency.symbol}{localPrice}</p>
                        <span className="text-[#9A9384] text-xs font-bold mb-1">{activeCurrency.currency}</span>
                      </div>
                    )}
                    {!esRecarga && (
                      <p className="text-[10px] text-[#9A9384] mb-3 leading-snug">Se entrega como regalo. Si es tu primera compra, Epic Games exige 48hs de amistad antes de poder enviártelo.</p>
                    )}
                    <button
                      onClick={() => {
                        // Si hay un precio fijo para el país activo, lo convertimos a un
                        // "USD equivalente" para que el resto del sistema (carrito, checkout,
                        // pedidos) siga funcionando igual sin tocar nada más — al mostrarlo
                        // de nuevo con la tasa de este país, va a dar exactamente ese precio fijo.
                        const precioParaCarrito = precioFijoPais ? precioFijoPais / activeCurrency.rate : p.price;
                        addToCart({ ...p, price: precioParaCarrito });
                      }}
                      className="w-full bg-[#0A0806] hover:bg-[#E3A23D] text-[#E3A23D] hover:text-[#0A0806] py-3.5 rounded-xl font-bold transition flex items-center justify-center gap-2 border-2 border-[#0A0806]"
                    >
                      <ShoppingCart size={18} /> Añadir
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section id="reseñas" className="px-6 py-24 border-t-4 border-[#0A0806]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 border-l-[6px] border-[#E3A23D] pl-6">
            <h2 className="font-display font-bold text-3xl md:text-5xl leading-tight">Nuestra Squad <br/><span className="text-[#E3A23D]">de Leyendas</span></h2>
            <p className="text-[#9A9384] mt-4 max-w-xl font-medium">Lee las opiniones reales de los gamers que ya aseguraron su cuenta con nosotros.</p>
          </div>
          {stats.totalReviews === 0 ? (
            <div className="kk-panel p-12 rounded-3xl text-center max-w-xl mx-auto">
              <MessageSquare size={40} className="mx-auto text-[#E3A23D] mb-4" />
              <h3 className="font-display text-xl font-bold mb-2">Sé el primero en dejar tu opinión</h3>
              <p className="text-[#9A9384] text-sm mb-6">Todavía no tenemos reseñas publicadas. Si ya compraste, contanos cómo te fue.</p>
              <Link href="/mi-cuenta" className="bg-[#E3A23D] text-[#0A0806] px-6 py-3 rounded-xl font-display font-bold inline-flex items-center gap-2 border-[3px] border-[#0A0806]">
                <MessageSquare size={18} /> Dejar mi reseña
              </Link>
            </div>
          ) : (
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
              <Link href="/mi-cuenta" className="w-full bg-[#14110C] hover:bg-[#E3A23D] text-[#F5F1E6] hover:text-[#0A0806] py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all mb-2 border-2 border-[#0A0806]">
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
                    {r.image_url && (
                      <img src={r.image_url} alt="Foto adjunta a la reseña" className="mt-4 rounded-xl border-2 border-[#0A0806] max-h-64 w-auto relative z-10" />
                    )}
                  </div>
                )) : (
                  <div className="text-center py-12 kk-panel rounded-2xl text-[#9A9384] font-bold">El radar no encontró reseñas con esa búsqueda.</div>
                )}
              </div>
            </div>
          </div>
          )}
        </div>
      </section>

      <section id="faq" className="max-w-4xl mx-auto px-6 py-24 border-t-4 border-[#0A0806]">
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
              <div className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${openFaq === idx ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                <p className="text-[#9A9384] leading-relaxed">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t-4 border-[#0A0806] bg-[#0A0806] pt-20 pb-8 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 mb-14">
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
            <div className="flex gap-3 mb-6 flex-wrap">
              <a href="https://wa.me/573156098437" target="_blank" rel="noopener noreferrer" className="bg-[#1D1913] hover:bg-[#25D366] border border-[#3A3527] hover:border-[#25D366] p-2.5 rounded-lg transition-colors group" title="WhatsApp">
                <MessageCircle size={18} className="text-[#9A9384] group-hover:text-white" />
              </a>
              <a href="https://www.instagram.com/kitsonkit2.0/" target="_blank" rel="noopener noreferrer" className="bg-[#1D1913] hover:bg-[#E1306C] border border-[#3A3527] hover:border-[#E1306C] p-2.5 rounded-lg transition-colors group" title="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-[#9A9384] group-hover:text-white" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a href="https://www.facebook.com/kitson.kit.2025" target="_blank" rel="noopener noreferrer" className="bg-[#1D1913] hover:bg-[#1877F2] border border-[#3A3527] hover:border-[#1877F2] p-2.5 rounded-lg transition-colors group" title="Facebook">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-[#9A9384] group-hover:text-white" stroke="currentColor" strokeWidth="2">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>
              <a href="https://discord.gg/gPumDeNvp6" target="_blank" rel="noopener noreferrer" className="bg-[#1D1913] hover:bg-[#5865F2] border border-[#3A3527] hover:border-[#5865F2] p-2.5 rounded-lg transition-colors group" title="Discord">
                <Send size={18} className="text-[#9A9384] group-hover:text-white" />
              </a>
              <a href="mailto:soporte@kitson-kit.store" className="bg-[#1D1913] hover:bg-[#E3A23D] border border-[#3A3527] hover:border-[#E3A23D] p-2.5 rounded-lg transition-colors group" title="Email">
                <MessageSquare size={18} className="text-[#9A9384] group-hover:text-[#0A0806]" />
              </a>
            </div>
            <p className="text-[10px] text-[#5A554A] uppercase tracking-widest font-bold mb-2">Métodos de pago aceptados</p>
            <div className="flex flex-wrap gap-2">
              {['Binance', 'Yape', 'Nequi', 'OXXO', 'Transferencia'].map((m) => (
                <span key={m} className="bg-[#1D1913] border border-[#3A3527] text-[#9A9384] text-[10px] font-bold px-2.5 py-1 rounded-md">{m}</span>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-bold text-[#F5F1E6] mb-4 uppercase tracking-widest text-xs">Enlaces Rápidos</h4>
            <ul className="space-y-3 text-sm text-[#9A9384]">
              <li><Link href="#catalogo" className="hover:text-[#E3A23D] transition">Catálogo</Link></li>
              <li><Link href="/tienda-diaria" className="hover:text-[#E3A23D] transition">Tienda Fortnite</Link></li>
              <li><Link href="/mi-cuenta" className="hover:text-[#E3A23D] transition">Mi Billetera</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-[#F5F1E6] mb-4 uppercase tracking-widest text-xs">Legal & Soporte</h4>
            <ul className="space-y-3 text-sm text-[#9A9384]">
              <li><Link href="/faq" className="hover:text-[#E3A23D] transition">Preguntas Frecuentes</Link></li>
              <li><Link href="/terminos" className="hover:text-[#E3A23D] transition">Términos del Servicio</Link></li>
              <li><Link href="/terminos" className="hover:text-[#E3A23D] transition">Política de Reembolsos</Link></li>
              <li><Link href="/privacidad" className="hover:text-[#E3A23D] transition">Política de Privacidad</Link></li>
              <li><a href="https://wa.me/573156098437" target="_blank" rel="noopener noreferrer" className="hover:text-[#25D366] transition flex items-center gap-2">WhatsApp</a></li>
              <li><a href="https://discord.gg/gPumDeNvp6" target="_blank" rel="noopener noreferrer" className="hover:text-[#5865F2] transition flex items-center gap-2">Soporte en Discord</a></li>
              <li><a href="mailto:soporte@kitson-kit.store" className="hover:text-[#E3A23D] transition">soporte@kitson-kit.store</a></li>
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
