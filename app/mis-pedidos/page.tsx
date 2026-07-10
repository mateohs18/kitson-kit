"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { supabase } from '../../lib/supabase';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, Package, CheckCircle2, Clock, Star, Send } from 'lucide-react';

export default function MisPedidos() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [reviewOrder, setReviewOrder] = useState<any | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    if (session?.user?.email) {
      fetchOrders();
    }
  }, [session]);

  async function fetchOrders() {
    const res = await fetch('/api/mis-pedidos');
    if (res.ok) {
      const data = await res.json();
      setOrders(data.orders);
    }
    setLoading(false);
  }

  const submitReview = async () => {
    if (!comment.trim()) return alert("Escribe un pequeño comentario");

    const { error } = await supabase.from('reviews').insert([{
      user_name: session?.user?.name || "Gamer",
      rating: rating,
      comment: comment
    }]);

    if (!error) {
      setReviewSuccess(true);
      setTimeout(() => {
        setReviewOrder(null);
        setReviewSuccess(false);
        setComment("");
        setRating(5);
      }, 2000);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#14110C] flex items-center justify-center"><Package className="animate-bounce text-[#E3A23D]" size={48}/></div>;

  return (
    <div className="min-h-screen bg-[#14110C] text-[#F5F1E6] font-body selection:bg-[#E3A23D] selection:text-[#0A0806] relative">
      <header className="p-6 md:px-10 border-b-4 border-[#0A0806] bg-[#E3A23D] sticky top-0 z-[100]">
        <Link href="/" className="flex items-center gap-2 text-[#0A0806] hover:opacity-70 transition-colors w-fit font-bold text-sm">
          <ChevronLeft size={20} /> Volver a la tienda
        </Link>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="font-display text-4xl font-bold mb-8">Mis <span className="text-[#E3A23D]">Pedidos</span></h1>

        {orders.length === 0 ? (
          <div className="kk-panel p-12 rounded-3xl text-center">
            <div className="w-20 h-20 rounded-full border-[3px] border-[#0A0806] bg-[#4A93D6] mx-auto mb-4 overflow-hidden flex items-center justify-center relative">
              <div className="absolute inset-0 kk-dots opacity-15"></div>
              <Image src="/logo.jpg" alt="Mascota Kitson Kit" width={72} height={72} className="w-4/5 h-4/5 object-contain rounded-full relative z-[1]" />
            </div>
            <p className="text-[#D9D4C7] text-lg mb-6">Todavía no tenés equipo en tu inventario.</p>
            <Link href="/" className="bg-[#E3A23D] text-[#0A0806] px-6 py-3 rounded-xl font-display font-bold border-[3px] border-[#0A0806] inline-block">Explorar catálogo</Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {orders.map(order => {
              // Lógica inteligente: Si contiene "ENTREGAD" (sin importar mayúsculas/minúsculas ni la letra final)
              const isDelivered = order.status?.toUpperCase().includes('ENTREGAD');
              // Acorta el ID para que no rompa el diseño
              const fullId = order.id;

              return (
                <div key={order.id} className="kk-panel p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div>
                    <p className="text-[#9A9384] text-sm mb-1 font-mono">Orden #{fullId}</p>
                    <p className="font-bold text-lg mb-2 text-[#F5F1E6]">Total: <span className="font-mono text-[#E3A23D]">${order.total_price.toFixed(2)}</span> USD</p>
                    <div className="flex items-center gap-2">
                      {isDelivered ? <CheckCircle2 size={18} className="text-[#7BC77E]"/> : <Clock size={18} className="text-[#E3A23D]"/>}
                      <span className={`text-sm font-black tracking-widest uppercase ${isDelivered ? 'text-[#7BC77E]' : 'text-[#E3A23D]'}`}>{order.status}</span>
                    </div>
                  </div>

                  {isDelivered && (
                    <button onClick={() => setReviewOrder(order)} className="bg-[#14110C] hover:bg-[#E3A23D] text-[#F5F1E6] hover:text-[#0A0806] transition-colors px-6 py-3 rounded-xl font-bold flex items-center gap-2 border-2 border-[#0A0806]">
                      <Star size={18} /> Dejar reseña
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAL DE RESEÑA */}
      {reviewOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="kk-panel p-8 rounded-3xl max-w-md w-full relative">
            <button onClick={() => setReviewOrder(null)} className="absolute top-4 right-4 text-[#9A9384] hover:text-[#F5F1E6] font-bold">✕</button>
            <h3 className="font-display text-2xl font-bold mb-2">Calificá tu experiencia</h3>
            <p className="text-[#9A9384] mb-6 text-sm">Tu opinión va a aparecer en la página principal con el tag de &quot;Verificado&quot;.</p>

            {reviewSuccess ? (
              <div className="text-center py-8">
                <CheckCircle2 size={48} className="mx-auto text-[#7BC77E] mb-4" />
                <p className="font-bold text-lg text-[#7BC77E]">¡Reseña publicada con éxito!</p>
              </div>
            ) : (
              <>
                <div className="flex gap-2 justify-center mb-8">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} onClick={() => setRating(star)} className="focus:outline-none transition-transform hover:scale-110">
                      <Star size={36} className={star <= rating ? "text-[#E3A23D] fill-[#E3A23D]" : "text-[#3A3527]"} />
                    </button>
                  ))}
                </div>
                <textarea
                  placeholder="¿Qué tal fue la atención y rapidez?..."
                  value={comment} onChange={e => setComment(e.target.value)}
                  className="w-full bg-[#14110C] border-2 border-[#0A0806] rounded-xl p-4 text-[#F5F1E6] focus:outline-none focus:border-[#E3A23D] h-32 mb-6 resize-none"
                />
                <button onClick={submitReview} className="w-full bg-[#E3A23D] text-[#0A0806] py-4 rounded-xl font-display font-bold text-lg flex justify-center items-center gap-2 border-[3px] border-[#0A0806] hover:bg-[#f0b458]">
                  <Send size={20} /> Publicar reseña
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
