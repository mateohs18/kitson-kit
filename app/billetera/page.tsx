"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Wallet, UploadCloud, Loader2, ArrowUpRight, ChevronLeft, CheckCircle2 } from 'lucide-react';

export default function WalletPage() {
  const { data: session } = useSession();
  const [balance, setBalance] = useState<number>(0);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchBalance();
  }, [session]);

  async function fetchBalance() {
    if (session?.user?.email) {
      const res = await fetch('/api/mi-saldo');
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance);
      }
    }
  }

  async function handleSubmit() {
    if (!session) return alert('Iniciá sesión para solicitar una recarga.');
    if (!receiptFile) return alert('Subí la captura de tu transferencia.');
    const monto = Number(amount);
    if (!Number.isFinite(monto) || monto <= 0) return alert('Ingresá el monto que transferiste.');

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', receiptFile);
      const uploadRes = await fetch('/api/subir-comprobante', { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        setLoading(false);
        return alert(uploadData.error || 'No se pudo subir el comprobante.');
      }

      const res = await fetch('/api/solicitar-recarga', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: monto, receiptUrl: uploadData.url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoading(false);
        return alert(data.error || 'No se pudo enviar la solicitud.');
      }

      setSuccess(true);
      setReceiptFile(null);
      setAmount('');
    } catch {
      alert('Ocurrió un error al enviar la solicitud.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#14110C] text-[#F5F1E6] font-body">
      <header className="p-6 md:px-10 border-b-4 border-[#0A0806] bg-[#E3A23D] sticky top-0 z-[100]">
        <Link href="/" className="flex items-center gap-2 text-[#0A0806] hover:opacity-70 transition-colors w-fit font-bold text-sm">
          <ChevronLeft size={20} /> Volver a la tienda
        </Link>
      </header>

      <div className="max-w-3xl mx-auto p-6 md:p-10">
        {/* Cabecera */}
        <h1 className="font-display text-3xl font-bold mb-8 flex items-center gap-3">
          <Wallet className="text-[#E3A23D]" /> Mi Billetera
        </h1>

        {/* Tarjeta de Saldo */}
        <div className="kk-panel p-8 rounded-3xl mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.08]">
            <Wallet size={120} />
          </div>
          <p className="text-[#9A9384] font-bold uppercase text-sm mb-1 tracking-widest">Saldo disponible</p>
          <h2 className="font-mono font-semibold text-5xl text-[#E3A23D]">${balance.toFixed(2)} <span className="text-[#9A9384] text-3xl">USD</span></h2>
        </div>

        {/* Formulario de Recarga */}
        <div className="kk-panel p-8 rounded-3xl">
          <h3 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
            <ArrowUpRight className="text-[#E3A23D]" /> Solicitar recarga
          </h3>

          {success ? (
            <div className="text-center py-8">
              <CheckCircle2 size={48} className="mx-auto text-[#7BC77E] mb-4" />
              <p className="font-bold text-lg text-[#7BC77E] mb-2">¡Solicitud enviada!</p>
              <p className="text-[#9A9384] text-sm mb-6">Cuando confirmemos tu comprobante, el saldo aparece acreditado acá mismo.</p>
              <button onClick={() => setSuccess(false)} className="text-[#E3A23D] font-bold text-sm hover:underline">Enviar otra solicitud</button>
            </div>
          ) : (
            <>
              <label className="block text-sm font-bold text-[#D9D4C7] mb-2">¿Cuánto transferiste? (USD)</label>
              <input
                type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-[#14110C] border-2 border-[#0A0806] rounded-xl px-4 py-3 mb-6 text-[#F5F1E6] focus:outline-none focus:border-[#E3A23D] font-mono font-semibold"
              />

              <label className="relative flex flex-col items-center justify-center w-full py-10 px-4 bg-[#14110C] border-2 border-dashed border-[#3A3527] hover:border-[#E3A23D] rounded-2xl cursor-pointer transition-all group">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && setReceiptFile(e.target.files[0])} />
                {receiptFile ? (
                  <span className="text-[#7BC77E] font-bold">{receiptFile.name}</span>
                ) : (
                  <div className="text-center">
                    <UploadCloud size={32} className="text-[#E3A23D] mx-auto mb-3 group-hover:scale-110 transition-transform" />
                    <p className="text-sm font-bold text-[#D9D4C7]">Arrastrá o hacé clic para subir comprobante</p>
                  </div>
                )}
              </label>

              <button
                onClick={handleSubmit}
                disabled={loading || !receiptFile || !amount}
                className="w-full mt-6 bg-[#E3A23D] hover:bg-[#f0b458] disabled:opacity-40 text-[#0A0806] py-4 rounded-xl font-display font-bold border-[3px] border-[#0A0806] transition-all"
              >
                {loading ? <Loader2 className="animate-spin mx-auto"/> : "Enviar comprobante"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
