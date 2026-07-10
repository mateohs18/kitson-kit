"use client";

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useSession } from 'next-auth/react';
import { Wallet, UploadCloud, Loader2 } from 'lucide-react';

export default function WalletPage() {
  const { data: session } = useSession();
  const [balance, setBalance] = useState<number>(0);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchBalance() {
      if (session?.user?.email) {
        const { data } = await supabase.from('profiles').select('balance').eq('email', session.user.email).single();
        if (data) setBalance(data.balance);
      }
    }
    fetchBalance();
  }, [session]);

  const handleUploadReceipt = async () => {
    if (!receiptFile || !session?.user?.email) return alert("Sube una captura primero.");
    setLoading(true);
    
    // Subir a Storage y guardar en una tabla de 'recargas' (puedes crearla en Supabase)
    const fileExt = receiptFile.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    await supabase.storage.from('comprobantes').upload(fileName, receiptFile);
    
    // Aquí podrías insertar un registro en una tabla 'recharges' para que te llegue a Discord
    alert("Comprobante enviado. El admin lo verificará pronto.");
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-10 text-white">
      <h1 className="text-4xl font-black mb-8 flex items-center gap-3"><Wallet className="text-orange-500"/> Mi Billetera</h1>
      
      <div className="bg-[#0A0A0A] p-8 rounded-3xl border border-white/5 mb-8">
        <p className="text-gray-400">Saldo Disponible</p>
        <h2 className="text-5xl font-black text-green-400">${balance.toFixed(2)} USD</h2>
      </div>

      <div className="bg-[#0A0A0A] p-8 rounded-3xl border border-white/5">
        <h3 className="text-xl font-bold mb-4">Solicitar Recarga Manual</h3>
        <input type="file" onChange={(e) => e.target.files && setReceiptFile(e.target.files[0])} className="mb-4 block" />
        <button onClick={handleUploadReceipt} disabled={loading} className="bg-orange-500 text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2">
          {loading ? <Loader2 className="animate-spin"/> : "Enviar Comprobante"}
        </button>
      </div>
    </div>
  );
}