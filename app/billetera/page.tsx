"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Wallet, UploadCloud, Loader2, ArrowUpRight } from 'lucide-react';

export default function WalletPage() {
  const { data: session } = useSession();
  const [balance, setBalance] = useState<number>(0);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchBalance() {
      if (session?.user?.email) {
        const res = await fetch('/api/mi-saldo');
        if (res.ok) {
          const data = await res.json();
          setBalance(data.balance);
        }
      }
    }
    fetchBalance();
  }, [session]);

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-10 text-white min-h-screen">
      {/* Cabecera */}
      <h1 className="text-3xl font-black mb-8 flex items-center gap-3 uppercase tracking-widest italic">
        <Wallet className="text-orange-500" /> Mi Billetera
      </h1>
      
      {/* Tarjeta de Saldo (Estilo Pro) */}
      <div className="bg-[#0A0A0A] p-8 rounded-3xl border border-white/5 mb-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Wallet size={120} />
        </div>
        <p className="text-gray-400 font-bold uppercase text-sm mb-1">Saldo Disponible</p>
        <h2 className="text-5xl font-black text-white italic drop-shadow-lg">${balance.toFixed(2)} <span className="text-gray-600 text-3xl">USD</span></h2>
      </div>

      {/* Formulario de Recarga (Estilo Tienda) */}
      <div className="bg-[#0A0A0A] p-8 rounded-3xl border border-white/5 shadow-lg">
        <h3 className="text-xl font-black mb-6 uppercase flex items-center gap-2">
          <ArrowUpRight className="text-orange-500" /> Solicitar Recarga
        </h3>
        
        <label className="relative flex flex-col items-center justify-center w-full py-10 px-4 bg-[#111] border-2 border-dashed border-white/10 hover:border-orange-500/50 rounded-2xl cursor-pointer transition-all group">
          <input type="file" className="hidden" onChange={(e) => e.target.files && setReceiptFile(e.target.files[0])} />
          {receiptFile ? (
            <span className="text-green-400 font-bold italic">{receiptFile.name}</span>
          ) : (
            <div className="text-center">
              <UploadCloud size={32} className="text-orange-500 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-bold text-gray-300">Arrastra o haz clic para subir comprobante</p>
            </div>
          )}
        </label>

        <button 
          onClick={() => alert("Función de notificación al admin en camino...")} 
          disabled={loading || !receiptFile}
          className="w-full mt-6 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-black py-4 rounded-xl font-black uppercase italic tracking-widest transition-all"
        >
          {loading ? <Loader2 className="animate-spin mx-auto"/> : "Enviar Comprobante"}
        </button>
      </div>
    </div>
  );
}