"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
// IMPORTANTE: Asegúrate de que las rutas tengan ../../
import { useCartStore } from '../../store/cartStore';
import { supabase } from '../../lib/supabase';
import { signIn, signOut, useSession } from 'next-auth/react';
import { ShoppingCart, Trash2, Gamepad2, Menu, X, LogOut, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';

export default function CartPage() {
  const { cart, removeFromCart, clearCart, totalPrice, totalItems } = useCartStore();
  const { data: session } = useSession();
  
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // NUEVO: Estados para el ID del jugador y el proceso de pago
  const [gamerId, setGamerId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null; 

  // NUEVO: Función para enviar la orden a Supabase
  const handleCheckout = async () => {
    if (!session) {
      alert("Por favor, inicia sesión para continuar.");
      return;
    }
    if (!gamerId.trim()) {
      alert("¡Oye! Necesitamos tu ID de Epic Games o GamerTag para enviarte los productos.");
      return;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.from('orders').insert([
        {
          user_email: session.user?.email || '',
          user_name: session.user?.name || '',
          gamer_id: gamerId,
          items: cart, // Guardamos el carrito completo como JSON
          total_price: totalPrice(),
          status: 'PENDIENTE'
        }
      ]);

      if (error) throw error;

      alert("¡Orden creada con éxito! En Supabase ya aparece como PENDIENTE. Pronto conectaremos esto con Stripe.");
      // Aquí en el futuro redigiremos a Stripe (ej: window.location.href = urlStripe)
      
    } catch (error) {
      console.error("Error al crear la orden:", error);
      alert("Hubo un error al procesar tu pedido. Intenta de nuevo.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-500 selection:text-[#050505]">
      
      {/* BARRA DE NAVEGACIÓN GLOBAL */}
      <header className="flex flex-col md:flex-row md:items-center justify-between p-4 md:px-8 border-b border-white/5 bg-[#050505]/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center justify-between w-full md:w-auto">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl font-black tracking-tighter text-white transition group-hover:opacity-80">
              Kitson <span className="text-orange-500">Kit</span>
            </span>
          </Link>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden text-gray-400">
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
        
        <nav className={`${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row gap-6 mt-6 md:mt-0 font-medium text-sm text-gray-400 w-full md:w-auto items-center`}>
          <Link href="/" className="hover:text-orange-400 transition">Inicio</Link>
          <Link href="/#catalogo" className="hover:text-orange-400 transition">Catálogo</Link>
          <Link href="/tienda-diaria" className="hover:text-orange-400 transition">Tienda Fortnite</Link>
          <Link href="/#soporte" className="hover:text-orange-400 transition">Soporte</Link>
        </nav>

        <div className={`${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row items-center gap-4 mt-6 md:mt-0 w-full md:w-auto`}>
          <div className="flex items-center gap-2 bg-orange-500/10 text-orange-400 py-2 px-5 rounded-full border border-orange-500/20 w-full md:w-auto justify-center">
            <ShoppingCart size={18} /> 
            <span className="bg-orange-500 text-[#050505] text-xs font-black px-2 py-0.5 rounded-full">{totalItems()}</span>
          </div>
          {session ? (
            <div className="flex items-center gap-3 bg-white/5 py-1.5 px-1.5 pr-4 rounded-full border border-white/10 w-full md:w-auto justify-center">
              <img src={session.user?.image || ""} alt="Avatar" className="w-8 h-8 rounded-full border border-orange-500/50" />
              <span className="text-sm font-bold text-gray-200">{session.user?.name}</span>
              <button onClick={() => signOut()} className="text-red-400 hover:text-red-300 ml-2"><LogOut size={18}/></button>
            </div>
          ) : (
             <button onClick={() => signIn('discord')} className="bg-[#5865F2] hover:bg-[#4752C4] text-white w-full md:w-auto text-sm px-6 py-2.5 rounded-full font-black transition">
               Discord Login
             </button>
          )}
        </div>
      </header>

      {/* CONTENIDO DEL CARRITO */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 md:py-20">
        <div className="flex items-center gap-4 mb-10">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">Tu Carrito</h1>
          {cart.length > 0 && (
            <span className="bg-white/10 text-gray-300 px-3 py-1 rounded-full text-sm font-bold mt-2">{totalItems()} artículo(s)</span>
          )}
        </div>
        
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-[#0A0A0A] border border-white/5 rounded-3xl">
            <ShoppingCart size={64} strokeWidth={1} className="text-gray-600 mb-6" />
            <h2 className="text-2xl font-bold mb-2">Tu carrito está vacío</h2>
            <p className="text-gray-500 mb-8 max-w-md text-center">Aún no has añadido ningún producto. Explora nuestro catálogo para empezar.</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/#catalogo" className="bg-white/5 hover:bg-white/10 text-white px-8 py-3 rounded-full font-bold transition border border-white/10 flex items-center justify-center gap-2">
                Ver Catálogo
              </Link>
              <Link href="/tienda-diaria" className="bg-orange-500 hover:bg-orange-400 text-[#050505] px-8 py-3 rounded-full font-bold transition shadow-[0_0_15px_rgba(249,115,22,0.3)] flex items-center justify-center gap-2">
                Tienda Fortnite <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-10">
            {/* LISTA DE PRODUCTOS */}
            <div className="flex-1 space-y-4">
              <div className="flex justify-end mb-4 border-b border-white/5 pb-4">
                <button onClick={clearCart} className="text-sm font-bold text-red-500 hover:text-red-400 transition flex items-center gap-2">
                  <Trash2 size={16} /> Vaciar carrito
                </button>
              </div>

              {cart.map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row items-center gap-6 bg-[#0A0A0A] p-4 rounded-2xl border border-white/5 hover:border-white/10 transition">
                  <div className="w-full sm:w-24 h-24 bg-[#151515] rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <Gamepad2 size={32} className="text-gray-600" />
                    )}
                  </div>
                  
                  <div className="flex-1 text-center sm:text-left w-full">
                    <h3 className="font-bold text-lg text-white mb-1">{item.name}</h3>
                    <p className="text-gray-500 text-sm font-medium">Precio unitario: ${item.price.toFixed(2)}</p>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-8 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="bg-[#151515] border border-white/10 px-4 py-2 rounded-lg font-bold text-gray-300">
                      x{item.quantity}
                    </div>
                    <div className="font-black text-xl text-white">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* RESUMEN DE PAGO */}
            <div className="w-full lg:w-[400px]">
              <div className="bg-[#0A0A0A] border border-white/5 p-8 rounded-3xl sticky top-32">
                <h2 className="text-2xl font-black mb-6">Resumen</h2>
                
                <div className="space-y-4 mb-6 text-sm font-medium text-gray-400 border-b border-white/10 pb-6">
                  <div className="flex justify-between"><span>Subtotal</span><span className="text-white">${totalPrice().toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Impuestos</span><span className="text-green-400">Calculados en el pago</span></div>
                </div>

                <div className="flex justify-between items-end mb-6">
                  <span className="text-gray-300 font-bold">Total</span>
                  <div className="text-right">
                    <span className="text-4xl font-black text-orange-500">${totalPrice().toFixed(2)}</span>
                    <p className="text-xs text-gray-500 mt-1">USD</p>
                  </div>
                </div>

                {/* NUEVO: FORMULARIO DE ID DE JUGADOR */}
                {session && (
                  <div className="mb-6 bg-[#111] p-4 rounded-2xl border border-white/5">
                    <label className="block text-sm font-bold text-gray-300 mb-2">
                      Tu ID de Epic / GamerTag <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      placeholder="Ej: Ninja, usuario_123"
                      value={gamerId}
                      onChange={(e) => setGamerId(e.target.value)}
                      className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition placeholder-gray-600 text-sm"
                    />
                    <p className="text-[10px] text-gray-500 mt-2 leading-tight">
                      Requerido para poder enviarte los cosméticos o recargas.
                    </p>
                  </div>
                )}

                {session ? (
                  <button 
                    onClick={handleCheckout}
                    disabled={isProcessing}
                    className="w-full bg-orange-500 hover:bg-orange-400 disabled:bg-orange-500/50 disabled:cursor-not-allowed text-[#050505] py-4 rounded-xl font-black text-lg transition shadow-[0_0_20px_rgba(249,115,22,0.3)] flex items-center justify-center gap-2"
                  >
                    {isProcessing ? <><Loader2 className="animate-spin" size={20} /> Procesando...</> : "Proceder al Pago"}
                  </button>
                ) : (
                  <button onClick={() => signIn('discord')} className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white py-4 rounded-xl font-black transition flex items-center justify-center gap-2">
                    Inicia sesión para pagar
                  </button>
                )}
                
                <div className="mt-6 text-center text-xs text-gray-500 font-medium flex items-center justify-center gap-2">
                  <ShieldCheck size={16} className="text-green-500" /> Pago 100% seguro
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}