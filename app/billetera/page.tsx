"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useCurrencyStore } from '../../store/currencyStore';
import CurrencySelector from '../../components/CurrencySelector';
import { supabase } from '../../lib/supabase';
import { signIn, signOut, useSession } from 'next-auth/react';
import { Menu, X, LogOut, Wallet, UploadCloud, CheckCircle2, Loader2, Copy, Check } from 'lucide-react';

export default function BilleteraPage() {
  const { getActiveConfig } = useCurrencyStore();
  const activeCurrency = getActiveConfig();
  const { data: session } = useSession();
  
  const [amount, setAmount] = useState<number>(10);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const localAmount = (amount * activeCurrency.rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTopUp = async () => {
    if (!session) return alert("Inicia sesión para recargar.");
    if (!receiptFile) return alert("Por favor, sube tu comprobante de pago.");

    setIsProcessing(true);
    try {
      const fileExt = receiptFile.name.split('.').pop();
      const fileName = `recarga-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('comprobantes').upload(fileName, receiptFile);
      if (uploadError) throw new Error("Error al subir imagen.");
      const { data: publicUrlData } = supabase.storage.from('comprobantes').getPublicUrl(fileName);
      
      // Creamos una orden especial para recarga
      const { error: dbError } = await supabase.from('orders').insert([{
        user_email: session.user?.email, user_name: session.user?.name,
        gamer_id: 'RECARGA DE SALDO', items: [{ name: `Recarga de Billetera`, price: amount, quantity: 1 }],
        total_price: amount, status: 'PENDIENTE',
        country: activeCurrency.name, local_currency: activeCurrency.currency,
        local_price: parseFloat(localAmount.replace(/,/g, '')), payment_proof: publicUrlData.publicUrl
      }]);

      if (dbError) throw dbError;
      setSuccess(true);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-500">
      {/* NAVBAR */}
      <header className="flex items-center justify-between p-4 md:px-8 border-b border-white/5 bg-[#050505]/95 backdrop-blur-xl sticky top-0 z-[100]">
        <Link href="/" className="flex items-center gap-3"><span className="text-2xl font-black">Kitson <span className="text-orange-500">Kit</span></span></Link>
        <nav className="hidden lg:flex flex-1 justify-center gap-8 font-medium text-sm text-gray-400">
          <Link href="/" className="hover:text-white transition">Inicio</Link>
          <Link href="/#catalogo" className="hover:text-white transition">Catálogo</Link>
          <Link href="/tienda-diaria" className="hover:text-white transition">Tienda Fortnite</Link>
          <Link href="/billetera" className="text-white transition">Mi Billetera</Link>
        </nav>
        <div className="flex-1 flex items-center justify-end gap-4">
          <div className="hidden sm:block"><CurrencySelector /></div>
          {session ? (
            <div className="hidden sm:flex items-center gap-3 bg-white/5 py-1.5 px-1.5 pr-4 rounded-full border border-white/10">
              <Link href="/mis-pedidos" className="flex items-center gap-2 hover:opacity-80 transition">
                <img src={session.user?.image || ""} className="w-8 h-8 rounded-full" alt="avatar" />
                <span className="text-sm font-bold text-gray-200">{session.user?.name}</span>
              </Link>
            </div>
          ) : (
            <button onClick={() => signIn('discord')} className="bg-[#5865F2] px-6 py-2 rounded-full font-black text-sm">Login</button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {success ? (
          <div className="text-center py-20 bg-green-500/10 border border-green-500/20 rounded-3xl">
            <CheckCircle2 size={80} className="text-green-500 mx-auto mb-6" />
            <h2 className="text-3xl font-black mb-4">Solicitud Enviada</h2>
            <p className="text-gray-400 mb-6">Validaremos tu pago y tu saldo se actualizará en unos minutos.</p>
            <Link href="/" className="bg-orange-500 text-black px-8 py-3 rounded-full font-black">Volver al Inicio</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <div className="flex items-center gap-3 mb-6"><Wallet className="text-orange-500" size={32}/><h1 className="text-3xl font-black">Recargar Saldo</h1></div>
              <p className="text-gray-400 mb-8">Elige cuánto deseas recargar en USD. El monto se convertirá automáticamente a tu moneda local para el depósito.</p>
              
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[5, 10, 20, 50, 100].map(val => (
                  <button key={val} onClick={() => setAmount(val)} className={`py-3 rounded-xl font-black border ${amount === val ? 'bg-orange-500 text-black border-orange-500' : 'bg-[#111] border-white/10 text-white'}`}>
                    ${val}
                  </button>
                ))}
              </div>
              
              <div className="bg-[#111] p-6 rounded-2xl border border-white/5">
                <p className="text-sm text-gray-400 mb-1">Total a transferir:</p>
                <p className="text-4xl font-black text-orange-500">{activeCurrency.symbol}{localAmount} <span className="text-sm text-gray-500 uppercase">{activeCurrency.currency}</span></p>
              </div>
            </div>

            <div className="bg-[#0A0A0A] p-8 rounded-3xl border border-white/5">
              <h3 className="font-bold mb-4">Cuentas Disponibles ({activeCurrency.name})</h3>
              <div className="space-y-3 mb-8">
                {activeCurrency.accounts.map((acc, idx) => (
                  <div key={idx} className="bg-[#111] border border-white/10 rounded-xl p-3 flex justify-between items-center group">
                    <div>
                      <p className="text-xs text-gray-400 font-medium">{acc.method}</p>
                      <p className="font-mono font-bold text-orange-500 text-sm">{acc.number}</p>
                    </div>
                    <button onClick={() => handleCopy(acc.number)} className="p-2 text-gray-500 hover:text-white transition">
                      {copiedId === acc.number ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                    </button>
                  </div>
                ))}
              </div>

              <label className="relative flex flex-col items-center justify-center w-full py-6 px-4 bg-[#111] border-2 border-dashed border-white/10 hover:border-orange-500/50 rounded-2xl cursor-pointer mb-6 group">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { if(e.target.files) setReceiptFile(e.target.files[0]) }} />
                {receiptFile ? (
                   <p className="text-sm font-bold text-green-500">{receiptFile.name}</p>
                ) : (
                  <div className="text-center">
                    <UploadCloud size={24} className="text-orange-500 mx-auto mb-2" />
                    <p className="text-sm font-bold text-gray-300">Sube tu comprobante</p>
                  </div>
                )}
              </label>

              <button onClick={handleTopUp} disabled={isProcessing} className="w-full bg-orange-500 text-black py-4 rounded-xl font-black flex items-center justify-center gap-2">
                {isProcessing ? <><Loader2 className="animate-spin" size={20} /> Procesando...</> : "Confirmar Recarga"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}