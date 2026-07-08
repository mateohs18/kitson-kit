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
  PackageSearch, Menu, X, Star, Wallet, Flame, BellRing, 
  Search, ChevronDown, CheckCircle2, MessageSquare, Shield
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

  const [livePurchase, setLivePurchase] = useState<{name: string, item: string} | null>(null);

  useEffect(() => {
    async function fetchData() {
      const { data: productsData } = await supabase.from('products').select('*');
      if (productsData) setProducts(productsData);

      const { data: ordersData, count: ordersCount } = await supabase
        .from('orders')
        .select('user_name, items', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: reviewsData } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
      
      let avg = 5.0; let revCount = 0;
      if (reviewsData && reviewsData.length > 0) {
        setReviews(reviewsData);
        revCount = reviewsData.length;
        avg = reviewsData.reduce((acc, curr) => acc + curr.rating, 0) / revCount;
      }
      setStats({ totalOrders: (ordersCount || 0) + 150, averageRating: avg, totalReviews: revCount });
      setLoading(false);

      // NOTIFICACIONES LIMITADAS A LAS ÚLTIMAS 3 COMPRAS REALES
      if (ordersData && ordersData.length > 0) {
        let idx = 0;
        const maxPopups = Math.min(ordersData.length, 3); 
        
        const interval = setInterval(() => {
          if (idx >= maxPopups) {
            clearInterval(interval);
            return;
          }
          const order = ordersData[idx];
          const itemName = order.items && order.items.length > 0 ? order.items[0].name : 'Recarga de Saldo';
          
          setLivePurchase({ name: order.user_name || 'Gamer Anónimo', item: itemName });
          setTimeout(() => setLivePurchase(null), 5000); 
          
          idx++;
        }, 12000);
        return () => clearInterval(interval);
      }
    }
    fetchData();
  }, []);

  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => { if(ratingCounts[r.rating as keyof typeof ratingCounts] !== undefined) ratingCounts[r.rating as keyof typeof ratingCounts]++; });
  const filteredReviews = reviews.filter(r => r.comment.toLowerCase().includes(searchReview.toLowerCase()) || r.user_name.toLowerCase().includes(searchReview.toLowerCase()));

  const handleWriteReview = () => {
    alert("¡Para mantener 100% la autenticidad, todas las reseñas se escriben y verifican a través de nuestro servidor oficial de Discord!");
    // Aquí puedes poner: window.open("https://discord.gg/TU_LINK", "_blank");
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-500 overflow-hidden relative">
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <header className="flex items-center justify-between p-4 md:px-8 border-b border-white/5 bg-[#050505]/95 backdrop-blur-xl sticky top-0 z-[100]">
        <div className="flex-1 flex justify-start">
          <Link href="/" className="flex items-center gap-3 group">
            <img src="/logo.jpg" alt="Logo Kitson Kit" className="w-10 h-10 rounded-full border border-white/10 group-hover:border-orange-500 transition duration-300 object-cover" />
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
                <img src={session.user?.image || ""} alt="Avatar" className="w-8 h-8 rounded-full" />
                <span className="text-sm font-bold text-gray-200">{session.user?.name}</span>
              </Link>
              <button onClick={() => signOut()} className="text-red-400 hover:text-red-300 ml-2 border-l border-white/10 pl-3"><LogOut size={16}/></button>
            </div>
          ) : (
            <button onClick={() => signIn('discord')} className="hidden sm:block bg-[#5865F2] hover:bg-[#4752C4] px-6 py-2 rounded-full font-black text-sm transition">Login</button>
          )}
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden text-gray-400 ml-1 p-2"><Menu size={28} /></button>
        </div>
      </header>

      <div className={`fixed bottom-6 left-6 z-[120] glass-panel p-4 rounded-2xl flex items-center gap-4 border-l-4 border-l-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.2)] transition-all duration-700 ${livePurchase ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
        <div className="bg-orange-500/20 p-2 rounded-full"><BellRing size={20} className="text-orange-500 animate-bounce" /></div>
        <div>
          <p className="text-sm text-gray-300"><span className="font-bold text-white">{livePurchase?.name}</span> acaba de adquirir</p>
          <p className="text-sm font-black text-orange-400">{livePurchase?.item}</p>
        </div>
      </div>

      <main className="relative flex flex-col items-center justify-center text-center px-6 py-24 md:py-36 z-10 overflow-hidden">
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]"></div>
          <div className="absolute w-[600px] h-[300px] bg-orange-600/10 blur-[120px] rounded-full"></div>
        </div>

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
                  <div className="aspect-square bg-[#111] rounded-xl mb-5 flex items-center justify-center overflow-hidden">
                    {p.image_url ? <img src={p.image_url} alt={p.name} loading="lazy" decoding="async" className="w-full h-full object-cover transform group-hover:scale-110 transition duration-700" /> : <Gamepad2 size={64} className="text-gray-700" />}
                  </div>
                  <h3 className="font-bold text-lg mb-1 text-gray-100">{p.name}</h3>
                  <div className="flex items-end gap-1 mb-5">
                    <p className="text-white font-black text-2xl">{activeCurrency.symbol}{localPrice}</p>
                    <span className="text-gray-500 text-xs font-bold mb-1">{activeCurrency.currency}</span>
                  </div>
                  <button onClick={() => addToCart(p)} className="w-full bg-white/5 hover:bg-orange-500 text-white hover:text-black py-3.5 rounded-xl font-bold transition flex items-center justify-center gap-2">
                    <ShoppingCart size={18} /> Añadir
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECCIÓN DE RESEÑAS 100% ESTILO KITSON KIT */}
      <section id="reseñas" className="px-6 py-24 relative z-10 border-t border-white/5 bg-gradient-to-b from-[#050505] to-[#0A0A0A]">
        <div className="max-w-7xl mx-auto">
          
          <div className="mb-12 border-l-4 border-orange-500 pl-6">
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight uppercase italic tracking-widest drop-shadow-md">Nuestra Squad <br/><span className="text-orange-500">de Leyendas</span></h2>
            <p className="text-gray-400 mt-4 max-w-xl font-medium">No confíes solo en nuestras stats. Lee las opiniones reales de los gamers que ya aseguraron su cuenta y subieron al siguiente nivel con nosotros.</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-10">
            {/* Panel de Estadísticas Gamer */}
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

              <button onClick={handleWriteReview} className="w-full bg-white/5 hover:bg-orange-500 text-white hover:text-black py-4 rounded-xl font-black flex items-center justify-center gap-2 transition-all mb-8 border border-white/10 hover:border-orange-500">
                <MessageSquare size={18} /> Dejar mi Reseña
              </button>

              <div className="space-y-4 text-sm font-bold text-gray-400">
                <p className="flex items-center gap-3"><Shield size={18} className="text-orange-500"/> Trust Score: 100%</p>
                <p className="flex items-center gap-3"><CheckCircle2 size={18} className="text-orange-500"/> Transacciones Blindadas</p>
              </div>
            </div>

            {/* Lista de Reseñas y Buscador */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input 
                    type="text" 
                    placeholder="Buscar por usuario o palabra..." 
                    value={searchReview}
                    onChange={(e) => setSearchReview(e.target.value)}
                    className="w-full bg-[#0f0f0f] border border-white/5 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-orange-500/50 transition-colors"
                  />
                </div>
                <div className="relative min-w-[200px]">
                  <select className="w-full bg-[#0f0f0f] border border-white/5 rounded-xl py-4 px-4 text-white appearance-none focus:outline-none focus:border-orange-500/50 font-bold cursor-pointer">
                    <option>Más Recientes</option>
                    <option>Top Valoradas</option>
                  </select>
                  <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-4">
                {filteredReviews.length > 0 ? filteredReviews.map((r, idx) => (
                  <div key={idx} className="bg-[#0f0f0f] border border-white/5 p-6 rounded-2xl hover:border-white/10 transition-colors relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/5 rounded-bl-full -z-0"></div>
                    <div className="flex items-start justify-between mb-4 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 bg-white/5 border border-white/10 text-orange-500 rounded-full flex items-center justify-center font-black text-xl">
                            {r.user_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="absolute -bottom-1 -right-1 bg-[#0f0f0f] rounded-full p-0.5">
                            <CheckCircle2 size={14} className="text-orange-500 bg-black rounded-full" />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-white text-lg">{r.user_name}</span>
                            <span className="bg-orange-500/10 text-orange-400 text-[10px] font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-1">
                              Verificado
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <div className="flex gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} size={14} className={i < r.rating ? "text-orange-500 fill-orange-500" : "text-gray-800"} />
                              ))}
                            </div>
                            <span>• Hace unos días</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-300 leading-relaxed font-medium relative z-10 italic">"{r.comment}"</p>
                  </div>
                )) : (
                  <div className="text-center py-12 bg-[#0f0f0f] rounded-2xl border border-white/5 text-gray-500 font-bold">
                    El radar no encontró reseñas con esa búsqueda.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-[#050505] py-10 px-6 border-t border-white/5 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Kitson Kit. Todos los derechos reservados. Operamos de forma independiente a Epic Games.</p>
      </footer>
    </div>
  );
}