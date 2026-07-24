'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signIn } from 'next-auth/react';
import { ChevronLeft, CheckCircle2, Clock, Gift, PackageCheck, Hourglass, ShieldCheck } from 'lucide-react';

// ============================================================================
// SEGUIMIENTO DEL PEDIDO — /pedido/[id]
// Muestra el recorrido del pedido en pasos visuales y se actualiza solo cada
// 8 segundos hasta que llega a ENTREGADO. Solo el dueño del pedido (o el
// admin) puede verlo.
// ============================================================================

export default function SeguimientoPedido({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session, status } = useSession();
  const [orden, setOrden] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (status !== 'authenticated') return;
    let activo = true;

    async function cargar() {
      try {
        const res = await fetch(`/api/pedido/${id}`);
        const data = await res.json();
        if (!activo) return;
        if (!res.ok) {
          setError(data.error || 'No se pudo cargar el pedido.');
        } else {
          setOrden(data.orden);
          setError(null);
        }
      } catch {
        if (activo) setError('Error de conexión.');
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargar();
    // Actualización automática mientras no esté entregado
    const t = setInterval(() => {
      setOrden((prev: any) => {
        if (!prev || !String(prev.status || '').toUpperCase().includes('ENTREGAD')) cargar();
        return prev;
      });
    }, 8000);
    return () => { activo = false; clearInterval(t); };
  }, [id, status]);

  if (status === 'loading') return null;
  if (!session) {
    return (
      <div className="min-h-screen bg-[#14110C] flex items-center justify-center p-6">
        <div className="kk-panel p-10 rounded-3xl text-center max-w-md">
          <ShieldCheck size={40} className="mx-auto text-[#E3A23D] mb-4" />
          <h1 className="font-display text-2xl font-bold text-[#F5F1E6] mb-2">Seguimiento de pedido</h1>
          <p className="text-[#9A9384] text-sm mb-6">Iniciá sesión con la cuenta con la que compraste para ver el estado.</p>
          <button onClick={() => signIn()} className="bg-[#E3A23D] text-[#0A0806] px-8 py-3 rounded-xl font-display font-bold border-[3px] border-[#0A0806]">Iniciar sesión</button>
        </div>
      </div>
    );
  }

  const entregado = String(orden?.status || '').toUpperCase().includes('ENTREGAD');
  const esperandoAmistad = !entregado && orden && !orden.friend_request_sent_at &&
    (orden.items || []).some((i: any) => i.offer_id || i.vbucks);

  // Pasos del recorrido
  const pasos = [
    {
      titulo: 'Pedido recibido',
      desc: 'Registramos tu compra y avisamos a nuestro equipo.',
      icono: <PackageCheck size={20} />,
      completo: !!orden,
    },
    {
      titulo: 'Pago confirmado',
      desc: 'Verificamos tu pago (los pagos con saldo se confirman al instante).',
      icono: <CheckCircle2 size={20} />,
      completo: !!orden, // al existir la orden, el pago con saldo ya se cobró; transferencias quedan en revisión visual con el paso 3
    },
    {
      titulo: 'Preparando la entrega',
      desc: esperandoAmistad
        ? 'Tu regalo espera las 48hs de amistad que exige Epic Games. Apenas se cumplan, sale solo.'
        : 'Nuestro bot está procesando el envío dentro del juego.',
      icono: esperandoAmistad ? <Hourglass size={20} /> : <Clock size={20} />,
      completo: entregado,
      activo: !entregado,
    },
    {
      titulo: '¡Entregado!',
      desc: 'Los artículos ya están en tu cuenta de Fortnite. ¡A disfrutarlos!',
      icono: <Gift size={20} />,
      completo: entregado,
    },
  ];

  return (
    <div className="min-h-screen bg-[#14110C] text-[#F5F1E6] font-body selection:bg-[#E3A23D] selection:text-[#0A0806]">
      <header className="p-6 md:px-10 border-b-4 border-[#0A0806] bg-[#E3A23D] sticky top-0 z-[100] flex items-center justify-between">
        <Link href="/mi-cuenta" className="flex items-center gap-2 text-[#0A0806] hover:opacity-70 transition-colors font-bold text-sm">
          <ChevronLeft size={20} /> Mi Cuenta
        </Link>
        <Link href="/" className="w-10 h-10 rounded-full border-[3px] border-[#0A0806] overflow-hidden bg-[#F5F1E6]">
          <Image src="/logo.jpg" alt="Kitson Kit" width={40} height={40} className="w-full h-full object-cover" />
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        {cargando ? (
          <div className="text-center py-24">
            <Clock size={48} className="mx-auto animate-spin text-[#E3A23D] mb-4" />
            <p className="text-[#9A9384] font-bold">Cargando tu pedido...</p>
          </div>
        ) : error ? (
          <div className="kk-panel p-10 rounded-3xl text-center">
            <p className="text-[#D9D4C7] font-bold mb-2">{error}</p>
            <Link href="/mi-cuenta" className="text-[#E3A23D] font-bold text-sm hover:underline">Volver a mis pedidos</Link>
          </div>
        ) : orden && (
          <>
            <div className="mb-10">
              <p className="text-[#9A9384] text-xs font-bold uppercase tracking-widest mb-1">Seguimiento en vivo</p>
              <h1 className="font-display font-extrabold text-3xl md:text-4xl">Pedido <span className="text-[#E3A23D]">#{String(orden.id).slice(0, 8)}</span></h1>
              <p className="text-[#9A9384] text-sm mt-1">Realizado el {new Date(orden.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })} · Epic: <span className="font-mono text-[#4A93D6]">{orden.gamer_id}</span></p>
            </div>

            {/* Recorrido en pasos */}
            <div className="kk-panel rounded-3xl p-8 mb-8">
              <div className="space-y-0">
                {pasos.map((paso, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-11 h-11 shrink-0 rounded-xl border-[3px] border-[#0A0806] flex items-center justify-center transition-colors ${paso.completo ? 'bg-[#7BC77E] text-[#0A0806]' : paso.activo ? 'bg-[#E3A23D] text-[#0A0806] animate-pulse' : 'bg-[#1D1913] text-[#5A554A]'}`}>
                        {paso.icono}
                      </div>
                      {i < pasos.length - 1 && (
                        <div className={`w-1 flex-1 min-h-8 my-1 rounded-full ${pasos[i + 1].completo || paso.completo ? 'bg-[#7BC77E]' : 'bg-[#1D1913]'}`}></div>
                      )}
                    </div>
                    <div className="pb-8">
                      <h3 className={`font-display font-bold text-base ${paso.completo || paso.activo ? 'text-[#F5F1E6]' : 'text-[#5A554A]'}`}>{paso.titulo}</h3>
                      <p className={`text-sm leading-relaxed ${paso.completo || paso.activo ? 'text-[#9A9384]' : 'text-[#3A3527]'}`}>{paso.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              {!entregado && (
                <p className="text-[11px] text-[#5A554A] font-mono text-center pt-2 border-t border-white/5">Esta página se actualiza sola — no hace falta recargarla.</p>
              )}
            </div>

            {/* Resumen del pedido */}
            <div className="kk-panel rounded-3xl p-6">
              <h2 className="font-display font-bold text-lg mb-4">Resumen</h2>
              <div className="space-y-2 mb-4">
                {(orden.items || []).map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-[#D9D4C7]">{item.name} <span className="text-[#9A9384]">x{item.quantity || 1}</span></span>
                    <span className="font-mono text-[#9A9384]">${(Number(item.price) * (item.quantity || 1)).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              {Number(orden.discount) > 0 && (
                <div className="flex justify-between text-sm text-[#7BC77E] font-bold mb-2">
                  <span>Cupón {orden.coupon_code}</span>
                  <span>-${Number(orden.discount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-3 border-t border-white/10">
                <span className="text-[#D9D4C7] font-bold">Total</span>
                <span className="font-mono font-semibold text-2xl text-[#E3A23D]">${Number(orden.total_price).toFixed(2)} <span className="text-xs text-[#9A9384]">USD</span></span>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
