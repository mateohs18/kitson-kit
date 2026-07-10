"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { supabase } from '../../lib/supabase';
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

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><Package className="animate-bounce text-orange-500" size={48}/></div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-orange-500 relative">
      <header className="p-6 md:px-10 border-b border-white/5 bg-[#050505]/95 backdrop-blur-xl sticky top-0 z-[100]">
        <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-orange-500 transition-colors w-fit font-bold text-sm">
          <ChevronLeft size={20} /> Volver a la tienda
        </Link>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-black mb-8">Mis <span className="text-orange-500">Pedidos</span></h1>

        {orders.length === 0 ? (
          <div className="bg-[#0A0A0A] p-12 rounded-3xl border border-white/5 text-center">
            <Package size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg mb-6">Aún no tienes equipo en tu inventario.</p>
            <Link href="/" className="bg-orange-500 text-black px-6 py-3 rounded-full font-black">Explorar Catálogo</Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {orders.map(order => {
              // Lógica inteligente: Si contiene "ENTREGAD" (sin importar mayúsculas/minúsculas ni la letra final)
              const isDelivered = order.status?.toUpperCase().includes('ENTREGAD');
              // Acorta el ID para que no rompa el diseño
              const fullId = order.id;

              return (
                <div key={order.id} className="bg-[#0A0A0A] p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div>
                    <p className="text-gray-500 text-sm mb-1 font-mono">Orden #{fullId}</p>
                    <p className="font-bold text-lg mb-2">Total: ${order.total_price.toFixed(2)} USD</p>
                    <div className="flex items-center gap-2">
                      {isDelivered ? <CheckCircle2 size={18} className="text-green-500"/> : <Clock size={18} className="text-orange-500"/>}
                      <span className={`text-sm font-black tracking-widest uppercase ${isDelivered ? 'text-green-500' : 'text-orange-500'}`}>{order.status}</span>
                    </div>
                  </div>
                  
                  {isDelivered && (
                    <button onClick={() => setReviewOrder(order)} className="bg-white/5 hover:bg-orange-500 text-white hover:text-black transition-colors px-6 py-3 rounded-xl font-bold flex items-center gap-2 border border-white/10 hover:border-orange-500">
                      <Star size={18} /> Dejar Reseña
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
          <div className="bg-[#0f0f0f] p-8 rounded-3xl border border-white/10 max-w-md w-full relative">
            <button onClick={() => setReviewOrder(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white font-bold">X</button>
            <h3 className="text-2xl font-black mb-2">Califica tu experiencia</h3>
            <p className="text-gray-400 mb-6 text-sm">Tu opinión aparecerá en la página principal con el tag de "Verificado".</p>
            
            {reviewSuccess ? (
              <div className="text-center py-8">
                <CheckCircle2 size={48} className="mx-auto text-green-500 mb-4" />
                <p className="font-bold text-lg text-green-400">¡Reseña publicada con éxito!</p>
              </div>
            ) : (
              <>
                <div className="flex gap-2 justify-center mb-8">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} onClick={() => setRating(star)} className="focus:outline-none transition-transform hover:scale-110">
                      <Star size={36} className={star <= rating ? "text-orange-500 fill-orange-500" : "text-gray-700"} />
                    </button>
                  ))}
                </div>
                <textarea 
                  placeholder="¿Qué tal fue la atención y rapidez?..." 
                  value={comment} onChange={e => setComment(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-orange-500 h-32 mb-6 resize-none"
                />
                <button onClick={submitReview} className="w-full bg-orange-500 text-black py-4 rounded-xl font-black text-lg flex justify-center items-center gap-2 hover:bg-orange-400">
                  <Send size={20} /> Publicar Reseña
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}