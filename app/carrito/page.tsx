"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '../../store/cartStore';
import { useCurrencyStore } from '../../store/currencyStore';
import CurrencySelector from '../../components/CurrencySelector';
import { supabase } from '../../lib/supabase';
import { signIn, signOut, useSession } from 'next-auth/react';
import { 
  ShoppingCart, Trash2, Gamepad2, Menu, X, LogOut,
  Loader2, CheckCircle2, UploadCloud, Copy, Check 
} from 'lucide-react';

export default function CartPage() {
  const { cart, removeFromCart, clearCart, totalPrice, totalItems } = useCartStore();
  const { getActiveConfig } = useCurrencyStore();
  const activeCurrency = getActiveConfig();

  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [gamerId, setGamerId] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null; 

  const convertedTotal = (totalPrice() * activeCurrency.rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCheckout = async () => {
    if (!session) return alert("Por favor, inicia sesión para continuar.");
    if (!gamerId.trim()) return alert("Necesitamos tu ID de Epic Games o GamerTag.");
    if (!receiptFile) return alert("Por favor, adjunta la imagen de tu comprobante.");

    setIsProcessing(true);
    try {
      const fileExt = receiptFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('comprobantes').upload(fileName, receiptFile);
      if (uploadError) throw new Error("Error al subir imagen.");
      const { data: publicUrlData } = supabase.storage.from('comprobantes').getPublicUrl(fileName);
      
      const { error: dbError } = await supabase.from('orders').insert([{
        user_email: session.user?.email || '', user_name: session.user?.name || '',
        gamer_id: gamerId, items: cart, total_price: totalPrice(), status: 'PENDIENTE',
        country: activeCurrency.name, local_currency: activeCurrency.currency,
        local_price: parseFloat(convertedTotal.replace(/,/g, '')), payment_proof: publicUrlData.publicUrl
      }]);

      if (dbError) throw dbError;
      setOrderSuccess(true);
      clearCart();
    } catch (error: any) {
      alert(error.message || "Error al procesar tu pedido.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-500 relative">
      
      <header className="flex items-center justify-between p-4 md:px-8 border-b border-white/5 bg-[#050505]/95 backdrop-blur-xl sticky top-0 z-[100]">
        <div className="flex-1 flex justify-start">
          <Link href="/" className="flex items-center gap-3 group">
            <img src="/logo.jpg" alt="Logo Kitson Kit" className="w-10 h-10 rounded-full border border-white/10 group-hover:border-orange-500 transition object-cover" />
            <span className="text-2xl font-black text-white hidden xl:block">Kitson <span className="text-orange-500">Kit</span></span>
          </Link>
        </div>
        
        <nav className="hidden lg:flex flex-1 justify-center gap-8 font-medium text-sm text-gray-400">
          <Link href="/" className="hover:text-white transition">Inicio</Link>
          <Link href="/#catalogo" className="hover:text-white transition">Catálogo</Link>
          <Link href="/tienda-diaria" className="hover:text-white transition">Tienda Fortnite</Link>
        </nav>

        <div className="flex-1 flex items-center justify-end gap-4">
          <div className="hidden sm:block"><CurrencySelector /></div>
          
          {session ? (
            <div className="hidden sm:flex items-center gap-3 bg-white/5 py-1.5 px-1.5 pr-4 rounded-full border border-white/10">
              <Link href="/mis-pedidos" className="flex items-center gap-2 hover:opacity-80 transition">
                <img src={session.user?.image || ""} alt="Avatar" className="w-8 h-8 rounded-full border border-orange-500/50" />
                <span className="text-sm font-bold text-gray-200">{session.user?.name}</span>
              </Link>
              <button onClick={() => signOut()} className="text-red-400 hover:text-red-300 ml-2 border-l border-white/10 pl-3"><LogOut size={16}/></button>
            </div>
          ) : (
            <button onClick={() => signIn('discord')} className="hidden sm:block bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm px-6 py-2.5 rounded-full font-black">Login</button>
          )}

          {/* BOTÓN MÓVIL ARREGLADO */}
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden text-gray-400 ml-1 p-2">
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </header>

      {/* MENÚ MÓVIL ARREGLADO */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[#0A0A0A] border-b border-white/10 flex flex-col p-6 gap-6 fixed top-[73px] left-0 w-full h-[calc(100vh-73px)] z-[90] overflow-y-auto">
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-white border-b border-white/5 pb-4">Inicio</Link>
          <Link href="/#catalogo" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-white border-b border-white/5 pb-4">Catálogo</Link>
          <Link href="/tienda-diaria" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-white border-b border-white/5 pb-4">Tienda Fortnite</Link>
          <div className="pt-2"><CurrencySelector /></div>
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 relative z-10">
        {orderSuccess ? (
          <div className="text-center py-24 bg-green-500/5 border border-green-500/20 rounded-3xl max-w-2xl mx-auto">
            <CheckCircle2 size={80} className="text-green-500 mx-auto mb-6" />
            <h2 className="text-3xl font-black mb-4">¡Pago en Revisión!</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">Hemos recibido tu comprobante de manera exitosa. Nuestro equipo lo validará y te entregaremos los artículos.</p>
            <Link href="/mis-pedidos" className="bg-orange-500 text-[#050505] px-8 py-3 rounded-full font-black shadow-lg">Ver mis pedidos</Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-10">
            <div className="flex-1 space-y-6">
              <div className="bg-[#0A0A0A] p-6 rounded-3xl border border-white/5">
                <h3 className="text-xl font-black mb-4 flex items-center gap-2"><Gamepad2 className="text-orange-500"/> 1. Cuenta Destino</h3>
                <input 
                  type="text" placeholder="ID de Epic Games o GamerTag"
                  value={gamerId} onChange={(e) => setGamerId(e.target.value)}
                  className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              <div className="bg-[#0A0A0A] p-6 rounded-3xl border border-white/5">
                <div className="flex justify-between mb-4"><h3 className="text-xl font-black">2. Resumen ({totalItems()})</h3></div>
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 bg-[#111] p-3 rounded-xl border border-white/5">
                      <div className="flex-1"><h4 className="font-bold text-sm">{item.name} <span className="text-gray-500">x{item.quantity}</span></h4></div>
                      <p className="font-black">${(item.price * item.quantity).toFixed(2)} USD</p>
                      <button onClick={() => removeFromCart(item.id)} className="text-red-500/50 hover:text-red-500 p-2"><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="w-full lg:w-[450px]">
              <div className="bg-[#0A0A0A] border border-white/5 p-8 rounded-3xl sticky top-24">
                <h2 className="text-2xl font-black mb-6">3. Pago Final</h2>
                
                <div className="space-y-3 mb-6 bg-[#111] p-5 rounded-2xl border border-white/5">
                  <div className="flex justify-between text-gray-400 text-sm font-medium"><span>Total USD</span><span>${totalPrice().toFixed(2)}</span></div>
                  <div className="flex justify-between items-end pt-3 border-t border-white/10">
                    <span className="text-gray-300 font-bold">Total a Transferir</span>
                    <div className="text-right">
                      <span className="text-3xl font-black text-orange-500">{activeCurrency.symbol}{convertedTotal}</span>
                      <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">{activeCurrency.currency}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-8">
                  <label className="block text-sm font-bold text-gray-400 mb-3">Cuentas de depósito ({activeCurrency.name}):</label>
                  <div className="space-y-3">
                    {activeCurrency.accounts.map((acc, idx) => (
                      <div key={idx} className="bg-[#111] border border-white/10 rounded-xl p-4">
                        <p className="text-xs text-gray-400 mb-2 font-medium">{acc.method}</p>
                        <div className="flex items-center justify-between bg-[#050505] border border-white/5 p-3 rounded-lg group">
                          <span className="font-mono font-bold text-orange-500 tracking-wider text-sm">{acc.number}</span>
                          <button 
                            onClick={() => handleCopy(acc.number)}
                            className="text-gray-500 hover:text-white transition-colors p-1"
                            title="Copiar número"
                          >
                            {copiedId === acc.number ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="group-hover:scale-110 transition-transform" />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-8">
                  <label className="block text-sm font-bold text-gray-300 mb-2">Sube la captura de pago <span className="text-red-500">*</span></label>
                  
                  <label className="relative flex flex-col items-center justify-center w-full py-6 px-4 bg-[#111] border-2 border-dashed border-white/10 hover:border-orange-500/50 rounded-2xl cursor-pointer transition-colors group">
                    <input 
                      type="file" 
                      accept="image/*"
                      className="hidden" 
                      onChange={(e) => { if(e.target.files) setReceiptFile(e.target.files[0]) }}
                    />
                    {receiptFile ? (
                      <div className="flex flex-col items-center text-center">
                        <CheckCircle2 size={32} className="text-green-500 mb-2" />
                        <p className="text-sm font-bold text-white truncate max-w-[200px]">{receiptFile.name}</p>
                        <p className="text-xs text-gray-500 mt-1">Clic para cambiar</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-center">
                        <div className="bg-orange-500/10 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
                          <UploadCloud size={24} className="text-orange-500" />
                        </div>
                        <p className="text-sm font-bold text-gray-300 mb-1">Toca para subir tu comprobante</p>
                        <p className="text-xs text-gray-500">Soporta JPG y PNG</p>
                      </div>
                    )}
                  </label>
                </div>

                {session ? (
                  <button onClick={handleCheckout} disabled={isProcessing} className="w-full bg-orange-500 hover:bg-orange-400 disabled:bg-orange-500/50 text-[#050505] py-4 rounded-xl font-black flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all">
                    {isProcessing ? <><Loader2 className="animate-spin" size={20} /> Subiendo imagen...</> : "Confirmar Pago Manual"}
                  </button>
                ) : (
                  <button onClick={() => signIn('discord')} className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white py-4 rounded-xl font-black flex items-center justify-center shadow-lg transition-all">Inicia sesión para finalizar</button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}