"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '../../store/cartStore';
import { useCurrencyStore } from '../../store/currencyStore';
import CurrencySelector from '../../components/CurrencySelector';
import { supabase } from '../../lib/supabase';
import { signIn, signOut, useSession } from 'next-auth/react';
import { 
  ShoppingCart, Trash2, Gamepad2, LogOut, 
  Loader2, FileImage, CheckCircle2 
} from 'lucide-react';

export default function CartPage() {
  const { cart, removeFromCart, clearCart, totalPrice, totalItems } = useCartStore();
  
  const { getActiveConfig } = useCurrencyStore();
  const activeCurrency = getActiveConfig();

  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  
  const [gamerId, setGamerId] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null; 

  const convertedTotal = (totalPrice() * activeCurrency.rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleCheckout = async () => {
    if (!session) return alert("Por favor, inicia sesión para continuar.");
    if (!gamerId.trim()) return alert("Necesitamos tu ID de Epic Games o GamerTag.");
    if (!receiptFile) return alert("Por favor, adjunta la imagen o captura de tu comprobante de pago.");

    setIsProcessing(true);

    try {
      const fileExt = receiptFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('comprobantes')
        .upload(fileName, receiptFile);

      if (uploadError) throw new Error("Error al subir imagen. Revisa que el bucket 'comprobantes' exista y sea público en Supabase.");

      const { data: publicUrlData } = supabase.storage.from('comprobantes').getPublicUrl(fileName);
      const proofUrl = publicUrlData.publicUrl;

      const { error: dbError } = await supabase.from('orders').insert([
        {
          user_email: session.user?.email || '',
          user_name: session.user?.name || '',
          gamer_id: gamerId,
          items: cart,
          total_price: totalPrice(),
          status: 'PENDIENTE',
          country: activeCurrency.name,
          local_currency: activeCurrency.currency,
          local_price: parseFloat(convertedTotal.replace(/,/g, '')),
          payment_proof: proofUrl
        }
      ]);

      if (dbError) throw dbError;

      setOrderSuccess(true);
      clearCart();
      
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Hubo un error al procesar tu pedido.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-500">
      {/* NAVBAR UNIFICADA (Igual a la página principal) */}
      <header className="flex flex-col md:flex-row md:items-center justify-between p-4 md:px-8 border-b border-white/5 bg-[#050505]/90 backdrop-blur-xl sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-3 mb-4 md:mb-0">
          <img src="/logo.jpg" alt="Logo" className="w-10 h-10 rounded-full object-cover border border-white/10" />
          <span className="text-2xl font-black text-white hidden sm:block">Kitson <span className="text-orange-500">Kit</span></span>
        </Link>
        
        <div className="flex items-center gap-4">
          <CurrencySelector />
          
          {session ? (
            <div className="flex items-center gap-3 bg-white/5 py-1.5 px-1.5 pr-4 rounded-full border border-white/10">
              <Link href="/mis-pedidos" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition">
                <img src={session.user?.image || ""} alt="Avatar" className="w-8 h-8 rounded-full border border-orange-500/50" />
                <span className="text-sm font-bold text-gray-200 hidden sm:block">{session.user?.name}</span>
              </Link>
              <button onClick={() => signOut()} className="text-red-400 hover:text-red-300 ml-2 border-l border-white/10 pl-3"><LogOut size={16}/></button>
            </div>
          ) : (
            <button onClick={() => signIn('discord')} className="bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm px-6 py-2.5 rounded-full font-black transition">
              Login
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
        {orderSuccess ? (
          <div className="text-center py-24 bg-green-500/5 border border-green-500/20 rounded-3xl max-w-2xl mx-auto">
            <CheckCircle2 size={80} className="text-green-500 mx-auto mb-6" />
            <h2 className="text-3xl font-black mb-4">¡Pago en Revisión!</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Hemos recibido tu comprobante de manera exitosa. Nuestro equipo lo validará y te entregaremos los artículos.
            </p>
            <Link href="/mis-pedidos" className="bg-orange-500 text-[#050505] px-8 py-3 rounded-full font-black shadow-lg">
              Ver mis pedidos
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
          <div className="flex flex-col lg:flex-row gap-10">
            {/* COLUMNA IZQUIERDA */}
            <div className="flex-1 space-y-6">
              <div className="bg-[#0A0A0A] p-6 rounded-3xl border border-white/5">
                <h3 className="text-xl font-black mb-4 flex items-center gap-2"><Gamepad2 className="text-orange-500"/> 1. Cuenta Destino</h3>
                <input 
                  type="text" 
                  placeholder="ID de Epic Games o GamerTag"
                  value={gamerId}
                  onChange={(e) => setGamerId(e.target.value)}
                  className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="bg-[#0A0A0A] p-6 rounded-3xl border border-white/5">
                <div className="flex justify-between mb-4 items-center">
                  <h3 className="text-xl font-black">2. Resumen ({totalItems()})</h3>
                  <button onClick={clearCart} className="text-xs font-bold text-red-500 hover:text-red-400">Vaciar Todo</button>
                </div>
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 bg-[#111] p-3 rounded-xl border border-white/5">
                      <div className="flex-1">
                        <h4 className="font-bold text-sm">{item.name} <span className="text-gray-500">x{item.quantity}</span></h4>
                      </div>
                      <p className="font-black">${(item.price * item.quantity).toFixed(2)} USD</p>
                      <button onClick={() => removeFromCart(item.id)} className="text-red-500/50 hover:text-red-500 p-2 transition">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* COLUMNA DERECHA: PAGOS */}
            <div className="w-full lg:w-[450px]">
              <div className="bg-[#0A0A0A] border border-white/5 p-8 rounded-3xl sticky top-24">
                <h2 className="text-2xl font-black mb-6">3. Pago Final</h2>
                
                <div className="space-y-3 mb-6 bg-[#111] p-5 rounded-2xl border border-white/5">
                  <div className="flex justify-between text-gray-400 text-sm font-medium">
                    <span>Total USD</span><span>${totalPrice().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-end pt-3 border-t border-white/10">
                    <span className="text-gray-300 font-bold">Total a Transferir</span>
                    <div className="text-right">
                      <span className="text-3xl font-black text-orange-500">{activeCurrency.symbol}{convertedTotal}</span>
                      <p className="text-[10px] text-gray-500 mt-1 uppercase">{activeCurrency.currency}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-400 mb-2">Instrucciones ({activeCurrency.name}):</label>
                  <div className="bg-orange-500/10 border border-orange-500/20 p-5 rounded-xl">
                    <pre className="whitespace-pre-wrap font-mono text-sm text-orange-400 font-bold">{activeCurrency.instructions}</pre>
                  </div>
                </div>

                <div className="mb-8">
                  <label className="block text-sm font-bold text-gray-300 mb-2 flex items-center gap-2">
                    <FileImage size={16} className="text-orange-500"/> Sube la captura de pago <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => { if(e.target.files) setReceiptFile(e.target.files[0]) }}
                    className="w-full text-sm text-gray-400 file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-black file:bg-orange-500 file:text-black hover:file:bg-orange-400 cursor-pointer bg-[#111] rounded-full p-1 border border-white/10"
                  />
                </div>

                {/* BOTÓN RESTAURADO Y FUNCIONAL */}
                {session ? (
                  <button 
                    onClick={handleCheckout}
                    disabled={isProcessing}
                    className="w-full bg-orange-500 hover:bg-orange-400 disabled:bg-orange-500/50 text-[#050505] py-4 rounded-xl font-black flex items-center justify-center gap-2 transition"
                  >
                    {isProcessing ? <><Loader2 className="animate-spin" size={20} /> Subiendo imagen...</> : "Confirmar Pago Manual"}
                  </button>
                ) : (
                  <button onClick={() => signIn('discord')} className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white py-4 rounded-xl font-black transition flex items-center justify-center gap-2">
                    Inicia sesión para finalizar
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}