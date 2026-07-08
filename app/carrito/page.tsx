"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '../../store/cartStore';
import { supabase } from '../../lib/supabase';
import { signIn, signOut, useSession } from 'next-auth/react';
import { 
  ShoppingCart, Trash2, Gamepad2, Menu, X, LogOut, ArrowRight, 
  ShieldCheck, Loader2, Globe, FileText, CheckCircle2 
} from 'lucide-react';

// TIPOS DE CAMBIO Y MÉTODOS DE PAGO (Puedes editar el "rate" para ajustar el precio del dólar)
const PAYMENT_OPTIONS = [
  { id: 'US', name: 'EEUU / Otros (Binance)', currency: 'USD', rate: 1, symbol: '$', instructions: 'Binance Pay ID:\n468856753' },
  { id: 'MX', name: 'México', currency: 'MXN', rate: 17.50, symbol: '$', instructions: 'Transferencia Interbancaria:\n728969000114678903\n\nSpin pago por OXXO:\n2242 1701 8064 3778' },
  { id: 'CO', name: 'Colombia', currency: 'COP', rate: 3900, symbol: '$', instructions: 'Nequi:\n3173326415' },
  { id: 'PE', name: 'Perú', currency: 'PEN', rate: 3.75, symbol: 'S/', instructions: 'Yape:\n998329414' }
];

export default function CartPage() {
  const { cart, removeFromCart, clearCart, totalPrice, totalItems } = useCartStore();
  const { data: session } = useSession();
  
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Estados del Checkout
  const [gamerId, setGamerId] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [paymentProof, setPaymentProof] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null; 

  const activePaymentConfig = PAYMENT_OPTIONS.find(c => c.id === selectedCountry) || PAYMENT_OPTIONS[0];
  const convertedTotal = (totalPrice() * activePaymentConfig.rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleCheckout = async () => {
    if (!session) {
      alert("Por favor, inicia sesión para continuar.");
      return;
    }
    if (!gamerId.trim()) {
      alert("Necesitamos tu ID de Epic Games o GamerTag para enviarte los productos.");
      return;
    }
    if (!paymentProof.trim()) {
      alert("Por favor, ingresa el Número de Operación o ID de Transacción de tu pago.");
      return;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.from('orders').insert([
        {
          user_email: session.user?.email || '',
          user_name: session.user?.name || '',
          gamer_id: gamerId,
          items: cart,
          total_price: totalPrice(),
          status: 'PENDIENTE',
          country: activePaymentConfig.name,
          local_currency: activePaymentConfig.currency,
          local_price: parseFloat(convertedTotal.replace(/,/g, '')),
          payment_proof: paymentProof
        }
      ]);

      if (error) throw error;

      setOrderSuccess(true);
      clearCart();
      
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
          <Link href="/" className="flex items-center gap-3 group">
  <img 
    src="/kitsonkit.png" 
    alt="Logo Kitson Kit" 
    className="w-10 h-10 rounded-full border-2 border-transparent group-hover:border-orange-500 transition duration-300 object-cover" 
  />
  <span className="text-2xl font-black tracking-tighter text-white transition group-hover:opacity-80 hidden sm:block">
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
        </nav>

        <div className={`${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row items-center gap-4 mt-6 md:mt-0 w-full md:w-auto`}>
          <div className="flex items-center gap-2 bg-orange-500/10 text-orange-400 py-2 px-5 rounded-full border border-orange-500/20 w-full md:w-auto justify-center">
            <ShoppingCart size={18} /> 
            <span className="bg-orange-500 text-[#050505] text-xs font-black px-2 py-0.5 rounded-full">{totalItems()}</span>
          </div>
          {session ? (
            <div className="flex items-center gap-3 bg-white/5 py-1.5 px-1.5 pr-4 rounded-full border border-white/10 w-full md:w-auto justify-center">
              <Link href="/mis-pedidos" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition">
                <img src={session.user?.image || ""} alt="Avatar" className="w-8 h-8 rounded-full border border-orange-500/50" />
                <span className="text-sm font-bold text-gray-200">{session.user?.name}</span>
              </Link>
              <button onClick={() => signOut()} className="text-red-400 hover:text-red-300 ml-2 border-l border-white/10 pl-3"><LogOut size={16}/></button>
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
        
        {orderSuccess ? (
          <div className="flex flex-col items-center justify-center py-24 bg-green-500/5 border border-green-500/20 rounded-3xl text-center max-w-2xl mx-auto">
            <CheckCircle2 size={80} className="text-green-500 mb-6" />
            <h2 className="text-3xl font-black mb-4">¡Pedido Recibido!</h2>
            <p className="text-gray-400 mb-8 max-w-md">
              Tu orden ha sido registrada como <strong>PENDIENTE</strong>. Nuestro equipo verificará el pago con tu número de comprobante y te enviaremos los artículos a la brevedad.
            </p>
            <Link href="/mis-pedidos" className="bg-orange-500 hover:bg-orange-400 text-[#050505] px-8 py-3 rounded-full font-black transition shadow-[0_0_15px_rgba(249,115,22,0.3)]">
              Ver estado de mi pedido
            </Link>
          </div>
        ) : cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-[#0A0A0A] border border-white/5 rounded-3xl">
            <ShoppingCart size={64} strokeWidth={1} className="text-gray-600 mb-6" />
            <h2 className="text-2xl font-bold mb-2">Tu carrito está vacío</h2>
            <p className="text-gray-500 mb-8 max-w-md text-center">Explora nuestro catálogo para empezar a armar tu pedido.</p>
            <Link href="/#catalogo" className="bg-white/5 hover:bg-white/10 text-white px-8 py-3 rounded-full font-bold transition border border-white/10">
              Ver Catálogo
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-10">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight">Checkout Seguro</h1>
            </div>

            <div className="flex flex-col lg:flex-row gap-10">
              {/* COLUMNA IZQUIERDA: PRODUCTOS Y DATOS */}
              <div className="flex-1 space-y-6">
                
                <div className="bg-[#0A0A0A] p-6 rounded-3xl border border-white/5">
                  <h3 className="text-xl font-black mb-4 flex items-center gap-2"><Gamepad2 className="text-orange-500"/> 1. Cuenta Destino</h3>
                  {session ? (
                    <div>
                      <label className="block text-sm font-bold text-gray-400 mb-2">ID de Epic Games / GamerTag <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        placeholder="Ej: Ninja, usuario_123"
                        value={gamerId}
                        onChange={(e) => setGamerId(e.target.value)}
                        className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition"
                      />
                    </div>
                  ) : (
                    <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl">
                      <p className="text-sm text-orange-400 font-bold mb-3">Debes iniciar sesión con Discord para asignar la cuenta destino.</p>
                      <button onClick={() => signIn('discord')} className="bg-[#5865F2] text-white px-6 py-2 rounded-lg font-bold text-sm">Iniciar Sesión</button>
                    </div>
                  )}
                </div>

                <div className="bg-[#0A0A0A] p-6 rounded-3xl border border-white/5">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-black flex items-center gap-2"><ShoppingCart className="text-orange-500"/> 2. Resumen ({totalItems()})</h3>
                    <button onClick={clearCart} className="text-xs font-bold text-red-500 hover:text-red-400 flex items-center gap-1"><Trash2 size={14} /> Vaciar</button>
                  </div>
                  
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 bg-[#111] p-3 rounded-xl border border-white/5">
                        <div className="w-16 h-16 bg-[#151515] rounded-lg overflow-hidden flex-shrink-0">
                          {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /> : <Gamepad2 size={24} className="text-gray-600 m-auto mt-4" />}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-sm text-white">{item.name}</h4>
                          <p className="text-gray-500 text-xs mt-1">x{item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-white">${(item.price * item.quantity).toFixed(2)} USD</p>
                          <button onClick={() => removeFromCart(item.id)} className="text-red-500/50 hover:text-red-500 text-xs font-bold mt-1">Eliminar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* COLUMNA DERECHA: PAGOS LOCALES */}
              <div className="w-full lg:w-[450px]">
                <div className="bg-[#0A0A0A] border border-white/5 p-8 rounded-3xl sticky top-32">
                  <h2 className="text-2xl font-black mb-6 flex items-center gap-2"><Globe className="text-orange-500"/> 3. Pago Manual</h2>
                  
                  {/* Selector de País */}
                  <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-400 mb-2">Selecciona tu País</label>
                    <select 
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                      className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition appearance-none cursor-pointer font-bold"
                    >
                      {PAYMENT_OPTIONS.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Precios */}
                  <div className="space-y-3 mb-6 bg-[#111] p-5 rounded-2xl border border-white/5">
                    <div className="flex justify-between text-gray-400 text-sm font-medium">
                      <span>Total en USD</span>
                      <span>${totalPrice().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-end pt-3 border-t border-white/10">
                      <span className="text-gray-300 font-bold">Total a Transferir</span>
                      <div className="text-right">
                        <span className="text-3xl font-black text-orange-500">{activePaymentConfig.symbol}{convertedTotal}</span>
                        <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">{activePaymentConfig.currency}</p>
                      </div>
                    </div>
                  </div>

                  {/* Instrucciones de Pago */}
                  <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-400 mb-2">Transfiere a la siguiente cuenta:</label>
                    <div className="bg-orange-500/10 border border-orange-500/20 p-5 rounded-xl">
                      <pre className="whitespace-pre-wrap font-mono text-sm text-orange-400 font-bold leading-relaxed">
                        {activePaymentConfig.instructions}
                      </pre>
                    </div>
                  </div>

                  {/* Input del Comprobante */}
                  {session && (
                    <div className="mb-8">
                      <label className="block text-sm font-bold text-gray-300 mb-2 flex items-center gap-2">
                        <FileText size={16} className="text-orange-500"/> Comprobante <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        placeholder="Nº de Operación, Referencia o Link"
                        value={paymentProof}
                        onChange={(e) => setPaymentProof(e.target.value)}
                        className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition placeholder-gray-600 text-sm"
                      />
                      <p className="text-[10px] text-gray-500 mt-2">Ingresa el código de transferencia o pega un link con la captura de pantalla de tu pago.</p>
                    </div>
                  )}

                  {/* Botón Final */}
                  {session ? (
                    <button 
                      onClick={handleCheckout}
                      disabled={isProcessing}
                      className="w-full bg-orange-500 hover:bg-orange-400 disabled:bg-orange-500/50 disabled:cursor-not-allowed text-[#050505] py-4 rounded-xl font-black text-lg transition shadow-[0_0_20px_rgba(249,115,22,0.3)] flex items-center justify-center gap-2"
                    >
                      {isProcessing ? <><Loader2 className="animate-spin" size={20} /> Verificando...</> : "Confirmar Pago Manual"}
                    </button>
                  ) : (
                    <button onClick={() => signIn('discord')} className="w-full bg-[#5865F2] text-white py-4 rounded-xl font-black transition flex items-center justify-center gap-2">
                      Inicia sesión para finalizar
                    </button>
                  )}
                  
                  <div className="mt-5 text-center text-[10px] text-gray-500 uppercase tracking-widest font-bold flex items-center justify-center gap-1.5">
                    <ShieldCheck size={14} className="text-green-500" /> Transacción Segura
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}