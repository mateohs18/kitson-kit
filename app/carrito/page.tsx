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
  Loader2, CheckCircle2, UploadCloud, Copy, Check, Wallet 
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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // NUEVO: SISTEMA DE SALDO
  const [balance, setBalance] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'saldo' | 'manual'>('manual');

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    async function checkBalance() {
      if (session?.user?.email) {
        const { data } = await supabase.from('profiles').select('balance').eq('email', session.user.email).single();
        if (data) {
          setBalance(data.balance);
        } else {
          // Si no existe, creamos su perfil
          await supabase.from('profiles').insert([{ email: session.user.email, name: session.user.name, balance: 0 }]);
        }
      }
    }
    checkBalance();
  }, [session]);

  if (!mounted) return null; 

  const convertedTotal = (totalPrice() * activeCurrency.rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCheckout = async () => {
    if (!session) return alert("Inicia sesión para continuar.");
    if (!gamerId.trim()) return alert("Necesita tu ID de Epic Games.");
    
    setIsProcessing(true);
    
    try {
      if (paymentMethod === 'saldo') {
        if (balance < totalPrice()) {
          setIsProcessing(false);
          return alert("No tienes saldo suficiente. Ve a la Billetera para recargar.");
        }
        
        // Descontamos el saldo
        await supabase.from('profiles').update({ balance: balance - totalPrice() }).eq('email', session.user.email);
        
        // Creamos la orden como PAGADA
        await supabase.from('orders').insert([{
          user_email: session.user?.email, user_name: session.user?.name,
          gamer_id: gamerId, items: cart, total_price: totalPrice(), status: 'PAGADO CON SALDO',
          country: 'Kitson Wallet', local_currency: 'USD', local_price: totalPrice()
        }]);

      } else {
        // Pago manual (foto)
        if (!receiptFile) {
          setIsProcessing(false);
          return alert("Sube la imagen de tu comprobante.");
        }
        const fileExt = receiptFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        await supabase.storage.from('comprobantes').upload(fileName, receiptFile);
        const { data: publicUrlData } = supabase.storage.from('comprobantes').getPublicUrl(fileName);
        
        await supabase.from('orders').insert([{
          user_email: session.user?.email, user_name: session.user?.name,
          gamer_id: gamerId, items: cart, total_price: totalPrice(), status: 'PENDIENTE',
          country: activeCurrency.name, local_currency: activeCurrency.currency,
          local_price: parseFloat(convertedTotal.replace(/,/g, '')), payment_proof: publicUrlData.publicUrl
        }]);
      }

      setOrderSuccess(true);
      clearCart();
    } catch (error: any) {
      alert("Error al procesar tu pedido.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-500">
      <header className="flex items-center justify-between p-4 md:px-8 border-b border-white/5 bg-[#050505]/95 backdrop-blur-xl sticky top-0 z-[100]">
        <Link href="/" className="text-2xl font-black text-white">Kitson <span className="text-orange-500">Kit</span></Link>
        <nav className="hidden lg:flex gap-8 font-medium text-sm text-gray-400">
          <Link href="/">Inicio</Link>
          <Link href="/tienda-diaria">Tienda Fortnite</Link>
          <Link href="/billetera">Mi Billetera</Link>
        </nav>
        <div className="flex items-center gap-4">
          <CurrencySelector />
          {session && (
            <div className="bg-white/5 py-1.5 px-3 rounded-full border border-white/10 flex items-center gap-2 text-sm font-bold">
              <Wallet size={16} className="text-orange-500"/> ${balance.toFixed(2)}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {orderSuccess ? (
          <div className="text-center py-24 bg-green-500/5 border border-green-500/20 rounded-3xl">
            <CheckCircle2 size={80} className="text-green-500 mx-auto mb-6" />
            <h2 className="text-3xl font-black mb-4">¡Pedido Realizado!</h2>
            <Link href="/mis-pedidos" className="bg-orange-500 text-black px-8 py-3 rounded-full font-black">Ver mis pedidos</Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-10">
            <div className="flex-1 space-y-6">
              <div className="bg-[#0A0A0A] p-6 rounded-3xl border border-white/5">
                <h3 className="text-xl font-black mb-4"><Gamepad2 className="text-orange-500 inline mr-2"/>1. Cuenta Destino</h3>
                <input type="text" placeholder="ID de Epic Games" value={gamerId} onChange={(e) => setGamerId(e.target.value)} className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 focus:border-orange-500 outline-none" />
              </div>
              <div className="bg-[#0A0A0A] p-6 rounded-3xl border border-white/5">
                <h3 className="text-xl font-black mb-4">2. Resumen</h3>
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center bg-[#111] p-3 rounded-xl border border-white/5 mb-2">
                    <span>{item.name} x{item.quantity}</span>
                    <span className="font-black">${(item.price * item.quantity).toFixed(2)} USD <button onClick={() => removeFromCart(item.id)} className="text-red-500 ml-2"><Trash2 size={16}/></button></span>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full lg:w-[450px]">
              <div className="bg-[#0A0A0A] border border-white/5 p-8 rounded-3xl sticky top-24">
                <h2 className="text-2xl font-black mb-6">3. Método de Pago</h2>
                
                <div className="flex gap-2 mb-6">
                  <button onClick={() => setPaymentMethod('saldo')} className={`flex-1 py-2 rounded-lg text-sm font-bold border ${paymentMethod === 'saldo' ? 'bg-orange-500 text-black border-orange-500' : 'bg-[#111] text-gray-400 border-white/10'}`}>Saldo Kitson</button>
                  <button onClick={() => setPaymentMethod('manual')} className={`flex-1 py-2 rounded-lg text-sm font-bold border ${paymentMethod === 'manual' ? 'bg-orange-500 text-black border-orange-500' : 'bg-[#111] text-gray-400 border-white/10'}`}>Transferencia</button>
                </div>

                <div className="mb-6 bg-[#111] p-5 rounded-2xl border border-white/5 flex justify-between">
                  <span className="text-gray-400 font-medium">Total a pagar:</span>
                  <span className="text-2xl font-black text-orange-500">${totalPrice().toFixed(2)} USD</span>
                </div>

                {paymentMethod === 'saldo' ? (
                  <div className="mb-8 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                    <p className="text-sm text-center">Tu saldo actual es de <strong>${balance.toFixed(2)} USD</strong>. Se descontará automáticamente de tu cuenta.</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-6 space-y-2">
                      {activeCurrency.accounts.map((acc, idx) => (
                        <div key={idx} className="bg-[#111] p-3 rounded-lg flex justify-between items-center">
                          <span className="text-xs text-gray-400">{acc.method}</span>
                          <span className="font-mono font-bold text-orange-500 text-sm flex gap-2">{acc.number} <button onClick={() => handleCopy(acc.number)}><Copy size={14}/></button></span>
                        </div>
                      ))}
                    </div>
                    <label className="relative flex flex-col items-center justify-center w-full py-4 mb-6 bg-[#111] border-2 border-dashed border-white/10 rounded-xl cursor-pointer">
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { if(e.target.files) setReceiptFile(e.target.files[0]) }} />
                      {receiptFile ? <span className="text-green-500 font-bold">{receiptFile.name}</span> : <span className="text-sm text-gray-400"><UploadCloud size={20} className="inline mr-2"/>Subir comprobante</span>}
                    </label>
                  </>
                )}

                {session ? (
                  <button onClick={handleCheckout} disabled={isProcessing} className="w-full bg-orange-500 text-black py-4 rounded-xl font-black flex items-center justify-center gap-2">
                    {isProcessing ? <><Loader2 className="animate-spin" size={20} /> Procesando...</> : `Pagar $${totalPrice().toFixed(2)}`}
                  </button>
                ) : (
                  <button onClick={() => signIn('discord')} className="w-full bg-[#5865F2] text-white py-4 rounded-xl font-black">Inicia sesión</button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}