"use client";

import { useEffect, useState, useMemo, type ReactNode } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '../../store/cartStore';
import { useCurrencyStore } from '../../store/currencyStore';
import { supabase } from '../../lib/supabase';
import {
  Wallet, Pencil, Check, X, Zap, Gift, Clock, CheckCircle2, AlertTriangle,
  UploadCloud, Copy, Loader2, Star, Send, ShoppingCart, ChevronLeft, Trophy, Package, Gamepad2,
  Hourglass, ShieldCheck, Camera, Users, ChevronDown
} from 'lucide-react';

const PACKAGES = [
  { id: 'basico', label: 'Pack Básico', pay: 5, bonus: 0 },
  { id: 'leyenda', label: 'Pack Leyenda', pay: 20, bonus: 2, highlight: true },
  { id: 'kitson', label: 'Pack Kitson', pay: 50, bonus: 7 },
];

const TIER_INFO: Record<string, { color: string; next: number }> = {
  Bronce: { color: '#B08D57', next: 5 },
  Plata: { color: '#C7CDD6', next: 10 },
  Oro: { color: '#E3A23D', next: 10 },
};

function itemsSummary(items: any[]): string {
  if (!Array.isArray(items) || items.length === 0) return 'Pedido';
  const first = items[0]?.name || 'Artículo';
  return items.length > 1 ? `${first} y ${items.length - 1} más` : first;
}

function tieneRegalos(items: any[]): boolean {
  return Array.isArray(items) && items.some((it) => it.delivery_type === 'regalo');
}

function formatoRestante(ms: number) {
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h ${m}m`;
}

export default function MiCuenta() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const addToCart = useCartStore((s) => s.addToCart);

  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState<{ balance: number; epicId: string; friendRequestedAt: string | null; pedidosEntregados: number; nivel: { nombre: string; siguiente: string | null; faltan: number } } | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'activos' | 'historial' | 'movimientos'>('activos');
  const [now, setNow] = useState(Date.now());
  const [editingEpicId, setEditingEpicId] = useState(false);
  const [epicIdInput, setEpicIdInput] = useState('');
  const [savingEpicId, setSavingEpicId] = useState(false);
  const [refInfo, setRefInfo] = useState<{ link: string; recompensaReferidor: number; recompensaReferido: number; compraMinima: number } | null>(null);
  const [refCopiado, setRefCopiado] = useState(false);
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [movimientosCargados, setMovimientosCargados] = useState(false);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [wishBusqueda, setWishBusqueda] = useState('');
  const [wishResultados, setWishResultados] = useState<any[]>([]);
  const [wishBuscando, setWishBuscando] = useState(false);
  const [wishMsg, setWishMsg] = useState<string | null>(null);
  const [wishBuscado, setWishBuscado] = useState(false);
  const [wishAbierta, setWishAbierta] = useState(true);
  const [refAbierta, setRefAbierta] = useState(false);

  useEffect(() => {
    if (activeTab !== 'movimientos' || movimientosCargados) return;
    fetch('/api/mis-movimientos')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.movimientos) { setMovimientos(d.movimientos); setMovimientosCargados(true); } })
      .catch(() => {});
  }, [activeTab, movimientosCargados]);

  useEffect(() => {
    fetch('/api/mi-wishlist')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.wishlist) setWishlist(d.wishlist); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (wishBusqueda.trim().length < 3) { setWishResultados([]); setWishBuscado(false); return; }
    const t = setTimeout(async () => {
      setWishBuscando(true);
      setWishBuscado(false);
      try {
        const res = await fetch(`/api/buscar-cosmetico?q=${encodeURIComponent(wishBusqueda.trim())}`);
        const d = res.ok ? await res.json() : { resultados: [] };
        setWishResultados(d.resultados || []);
      } catch { setWishResultados([]); }
      setWishBuscando(false);
      setWishBuscado(true);
    }, 450);
    return () => clearTimeout(t);
  }, [wishBusqueda]);

  const [wishGuardando, setWishGuardando] = useState<string | null>(null);

  const agregarDeseo = async (c: any) => {
    setWishMsg(null);
    setWishGuardando(c.id);
    const res = await fetch('/api/mi-wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: c.id, name: c.name, image: c.image }),
    });
    const d = await res.json().catch(() => ({}));
    setWishGuardando(null);
    if (!res.ok) { setWishMsg(d.error || `No se pudo agregar (error ${res.status}). Si dice que la tabla no existe, falta correr wishlist.sql en Supabase.`); return; }
    // NO cerramos los resultados: así se pueden agregar varios seguidos.
    setWishlist((prev) => [{ cosmetic_id: c.id, cosmetic_name: c.name, cosmetic_image: c.image }, ...prev.filter((w) => w.cosmetic_id !== c.id)]);
  };

  const yaEnLista = (id: string) => wishlist.some((w) => w.cosmetic_id === id);

  const quitarDeseo = async (id: string) => {
    setWishlist((prev) => prev.filter((w) => w.cosmetic_id !== id));
    await fetch('/api/mi-wishlist', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
  };

  useEffect(() => {
    fetch('/api/mi-codigo-referido')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.link) setRefInfo(d); })
      .catch(() => {});
  }, []);

  // Modal de recarga
  const [showRecharge, setShowRecharge] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<typeof PACKAGES[0] | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submittingRecharge, setSubmittingRecharge] = useState(false);
  const [rechargeSuccess, setRechargeSuccess] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal de reseña
  const [reviewOrder, setReviewOrder] = useState<any | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewPhoto, setReviewPhoto] = useState<File | null>(null);
  const [subiendoReview, setSubiendoReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (session?.user?.email) {
      fetchAll();
    } else {
      setLoading(false);
    }
  }, [session, status]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const reviewOrderId = searchParams.get('reviewOrder');
    if (reviewOrderId && orders.length > 0) {
      const order = orders.find((o) => o.id === reviewOrderId);
      if (order) setReviewOrder(order);
    }
  }, [searchParams, orders]);

  async function fetchAll() {
    const [perfilRes, pedidosRes] = await Promise.all([
      fetch('/api/mi-perfil'),
      fetch('/api/mis-pedidos'),
    ]);
    if (perfilRes.ok) {
      const data = await perfilRes.json();
      setPerfil(data);
      setEpicIdInput(data.epicId || '');
    }
    if (pedidosRes.ok) {
      const data = await pedidosRes.json();
      setOrders(data.orders);
    }
    setLoading(false);
  }

  async function guardarEpicId() {
    const trimmed = epicIdInput.trim();
    if (trimmed.length < 3 || /\s/.test(trimmed)) return alert('El ID no puede tener espacios y debe tener al menos 3 caracteres.');
    setSavingEpicId(true);
    const res = await fetch('/api/guardar-epic-id', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ epicId: trimmed }),
    });
    const data = await res.json();
    if (res.ok) {
      await fetchAll();
      setEditingEpicId(false);
    } else {
      alert('❌ ' + data.error);
    }
    setSavingEpicId(false);
  }

  async function enviarRecarga() {
    if (!selectedPackage || !receiptFile) return alert('Elegí un paquete y subí tu comprobante.');
    setSubmittingRecharge(true);
    try {
      const formData = new FormData();
      formData.append('file', receiptFile);
      const uploadRes = await fetch('/api/subir-comprobante', { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || 'No se pudo subir el comprobante.');

      const credited = selectedPackage.pay + selectedPackage.bonus;
      const res = await fetch('/api/solicitar-recarga', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: credited,
          receiptUrl: uploadData.url,
          packageLabel: `${selectedPackage.label} — paga $${selectedPackage.pay}${selectedPackage.bonus > 0 ? ` + $${selectedPackage.bonus} de regalo` : ''}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo enviar la solicitud.');
      setRechargeSuccess(true);
    } catch (err: any) {
      alert('❌ ' + err.message);
    } finally {
      setSubmittingRecharge(false);
    }
  }

  function cerrarModalRecarga() {
    setShowRecharge(false);
    setSelectedPackage(null);
    setReceiptFile(null);
    setRechargeSuccess(false);
  }

  function volverAComprar(items: any[]) {
    if (!Array.isArray(items)) return;
    items.forEach((it) => addToCart(it));
    router.push('/carrito');
  }

  async function submitReview() {
    if (!comment.trim()) return alert('Escribí un comentario.');
    setSubiendoReview(true);
    try {
      let imageUrl: string | null = null;
      if (reviewPhoto) {
        const formData = new FormData();
        formData.append('file', reviewPhoto);
        const uploadRes = await fetch('/api/subir-foto-resena', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'No se pudo subir la foto.');
        imageUrl = uploadData.url;
      }

      const { error } = await supabase.from('reviews').insert([{ user_name: session?.user?.name || 'Gamer', rating, comment, image_url: imageUrl, verified: true, order_id: reviewOrder?.id || null }]);
      if (!error) {
        setReviewSuccess(true);
        setTimeout(() => {
          setReviewOrder(null);
          setReviewSuccess(false);
          setComment('');
          setRating(5);
          setReviewPhoto(null);
        }, 2000);
      } else {
        alert('No se pudo publicar la reseña.');
      }
    } catch (err: any) {
      alert(err.message || 'No se pudo publicar la reseña.');
    } finally {
      setSubiendoReview(false);
    }
  }

  const activeOrders = useMemo(() => orders.filter((o) => !o.status?.toUpperCase().includes('ENTREGAD')), [orders]);

  if (status === 'loading' || loading) {
    return <div className="min-h-screen bg-[#14110C] flex items-center justify-center"><Package className="animate-spin text-[#E3A23D]" size={48} /></div>;
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#14110C] text-[#F5F1E6] font-body flex items-center justify-center px-6">
        <div className="kk-panel p-10 rounded-3xl text-center max-w-md">
          <Wallet size={40} className="mx-auto text-[#E3A23D] mb-4" />
          <h1 className="font-display text-2xl font-bold mb-2">Mi Cuenta</h1>
          <p className="text-[#9A9384] mb-6">Iniciá sesión para ver tu billetera, tus pedidos y tu nivel de cliente.</p>
          <Link href="/login?callbackUrl=/mi-cuenta" className="bg-[#E3A23D] text-[#0A0806] px-6 py-3 rounded-xl font-display font-bold border-[3px] border-[#0A0806] inline-block">Iniciar sesión</Link>
        </div>
      </div>
    );
  }

  const nivel = perfil?.nivel;
  const tierColor = nivel ? TIER_INFO[nivel.nombre]?.color || '#E3A23D' : '#E3A23D';
  const tierNext = nivel ? TIER_INFO[nivel.nombre]?.next || 10 : 10;
  const tierBase = nivel?.nombre === 'Plata' ? 5 : 0;
  const tierProgress = nivel ? Math.min(100, (((perfil!.pedidosEntregados - tierBase) / (tierNext - tierBase)) * 100)) : 0;

  return (
    <div className="min-h-screen bg-[#14110C] text-[#F5F1E6] font-body selection:bg-[#E3A23D] selection:text-[#0A0806]">
      <header className="p-6 md:px-10 border-b-4 border-[#0A0806] bg-[#E3A23D] sticky top-0 z-[100]">
        <Link href="/" className="flex items-center gap-2 text-[#0A0806] hover:opacity-70 transition-colors w-fit font-bold text-sm">
          <ChevronLeft size={20} /> Volver a la tienda
        </Link>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 items-start">

        {/* ===== COLUMNA IZQUIERDA: PLAYER CARD ===== */}
        <div className="lg:sticky lg:top-28 space-y-6 w-full">
          <div className="kk-panel rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute inset-0 kk-dots opacity-[0.04]"></div>
            <div className="relative z-[1]">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full border-[3px] border-[#E3A23D] overflow-hidden shrink-0">
                  <Image src={session.user?.image || '/logo.jpg'} alt="Avatar" width={64} height={64} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="font-display font-bold text-lg truncate">{session.user?.name}</p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-md" style={{ backgroundColor: `${tierColor}25`, color: tierColor }}>
                    <Trophy size={11} /> Nivel {nivel?.nombre}
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-[#9A9384] font-bold uppercase tracking-widest mb-1">Saldo disponible</p>
              <p className="font-display font-bold text-4xl text-[#E3A23D] mb-4">${(perfil?.balance ?? 0).toFixed(2)}</p>

              {nivel?.siguiente && (
                <div className="mb-5">
                  <div className="flex justify-between text-[10px] text-[#9A9384] font-bold mb-1.5">
                    <span>Nivel {nivel.nombre}</span>
                    <span>Faltan {nivel.faltan} para {nivel.siguiente}</span>
                  </div>
                  <div className="h-2 bg-[#14110C] rounded-full overflow-hidden border border-[#0A0806]">
                    <div className="h-full transition-all" style={{ width: `${tierProgress}%`, backgroundColor: tierColor }}></div>
                  </div>
                </div>
              )}

              <button onClick={() => setShowRecharge(true)} className="w-full bg-[#E3A23D] hover:bg-[#f0b458] text-[#0A0806] py-4 rounded-xl font-display font-bold text-base border-[3px] border-[#0A0806] transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2">
                <Zap size={20} /> Recargar saldo
              </button>
              <button onClick={() => signOut({ callbackUrl: '/' })} className="w-full mt-3 text-[#9A9384] hover:text-red-400 text-xs font-bold transition-colors">
                Cerrar sesión
              </button>
            </div>
          </div>

          <div className="kk-panel rounded-3xl p-6">
            <h3 className="font-display font-bold text-base mb-4 flex items-center gap-2"><Gamepad2 size={18} className="text-[#E3A23D]" /> Vincular cuenta Epic</h3>

            <div className="space-y-2.5 mb-5">
              {[
                { n: '1', title: 'Solicitud directa', desc: 'Cargás tu nombre y avisamos a nuestro equipo al instante.' },
                { n: '2', title: 'Espera de 48h', desc: 'Regla de Epic Games para poder enviarte regalos.' },
                { n: '3', title: '¡Todo listo!', desc: 'Pasado ese tiempo, tus compras vía regalo llegan en minutos.' },
              ].map((step) => (
                <div key={step.n} className="flex items-start gap-3">
                  <div className="w-7 h-7 shrink-0 rounded-lg bg-[#14110C] border-2 border-[#0A0806] flex items-center justify-center font-mono text-[10px] font-bold text-[#E3A23D]">{step.n}</div>
                  <div>
                    <p className="font-bold text-xs text-[#F5F1E6]">{step.title}</p>
                    <p className="text-[11px] text-[#9A9384] leading-snug">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {editingEpicId || !perfil?.epicId ? (
              <>
                <label className="block text-[10px] font-bold text-[#9A9384] uppercase tracking-widest mb-2">Tu nombre de Epic Games</label>
                <div className="relative mb-4">
                  <Gamepad2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A9384]" />
                  <input
                    type="text" value={epicIdInput} onChange={(e) => setEpicIdInput(e.target.value)}
                    placeholder="Ej: Ninja, Bugha..."
                    className="w-full bg-[#14110C] border-2 border-[#0A0806] rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#E3A23D]"
                  />
                </div>
                <div className="flex items-start gap-2 bg-[#7BC77E]/10 border border-[#7BC77E]/30 rounded-xl p-3 mb-4">
                  <ShieldCheck size={15} className="text-[#7BC77E] shrink-0 mt-0.5" />
                  <p className="text-[10px] text-[#9A9384] leading-relaxed">Solo usamos tu nombre para enviarte la solicitud de amistad. Nunca te vamos a pedir tu contraseña.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={guardarEpicId} disabled={savingEpicId} className="flex-1 bg-[#E3A23D] hover:bg-[#f0b458] disabled:opacity-40 text-[#0A0806] py-3 rounded-xl font-display font-bold text-sm border-2 border-[#0A0806]">
                    {savingEpicId ? 'Enviando...' : 'Enviar solicitud'}
                  </button>
                  {perfil?.epicId && (
                    <button onClick={() => { setEditingEpicId(false); setEpicIdInput(perfil.epicId); }} className="px-3 bg-[#1D1913] text-[#9A9384] rounded-xl border-2 border-[#0A0806]"><X size={16} /></button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between bg-[#14110C] border-2 border-[#0A0806] rounded-xl px-4 py-3 mb-3">
                  <span className="text-sm font-mono text-[#F5F1E6]">{perfil.epicId}</span>
                  <button onClick={() => setEditingEpicId(true)} className="text-[#E3A23D]"><Pencil size={15} /></button>
                </div>
                {(() => {
                  if (!perfil.friendRequestedAt) {
                    return (
                      <div className="flex items-center gap-2 bg-red-500/10 text-red-400 rounded-xl px-4 py-3 text-xs font-bold">
                        <AlertTriangle size={16} /> Esperando que te agreguemos como amigo.
                      </div>
                    );
                  }
                  const elapsed = now - new Date(perfil.friendRequestedAt).getTime();
                  const remaining = 48 * 60 * 60 * 1000 - elapsed;
                  if (remaining > 0) {
                    return (
                      <div className="flex items-center gap-2 bg-[#E3A23D]/10 text-[#E3A23D] rounded-xl px-4 py-3 text-xs font-bold">
                        <Hourglass size={16} /> Faltan {formatoRestante(remaining)}.
                      </div>
                    );
                  }
                  return (
                    <div className="flex items-center gap-2 bg-[#7BC77E]/10 text-[#7BC77E] rounded-xl px-4 py-3 text-xs font-bold">
                      <Gift size={16} /> ¡Listo para recibir regalos!
                    </div>
                  );
                })()}
              </>
            )}
          </div>

          {/* ===== INVITÁ Y GANÁ ===== */}
          {refInfo && (refInfo.recompensaReferidor > 0 || refInfo.recompensaReferido > 0) && (
            <div className="kk-panel rounded-3xl p-6">
              <button onClick={() => setRefAbierta(!refAbierta)} className="w-full flex items-center justify-between text-left">
                <h3 className="font-display font-bold text-base flex items-center gap-2"><Users size={18} className="text-[#E3A23D]" /> Invitá y ganá</h3>
                <ChevronDown size={18} className={`text-[#9A9384] transition-transform duration-300 ${refAbierta ? 'rotate-180' : ''}`} />
              </button>
              {refAbierta && (<>
              <p className="text-xs text-[#9A9384] leading-relaxed mb-4 mt-2">
                Compartí tu link. Cuando un amigo haga su primera compra{refInfo.compraMinima > 0 ? ` (mínimo $${refInfo.compraMinima.toFixed(2)} USD)` : ''} y se entregue,
                {' '}vos recibís <strong className="text-[#7BC77E]">${refInfo.recompensaReferidor.toFixed(2)} USD</strong>
                {refInfo.recompensaReferido > 0 && <> y tu amigo <strong className="text-[#7BC77E]">${refInfo.recompensaReferido.toFixed(2)} USD</strong></>} en la billetera.
              </p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={refInfo.link}
                  className="flex-1 min-w-0 bg-[#14110C] border-2 border-[#0A0806] rounded-xl px-3 py-2.5 text-[11px] font-mono text-[#D9D4C7] focus:outline-none"
                  onFocus={(e) => e.target.select()}
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(refInfo.link);
                    setRefCopiado(true);
                    setTimeout(() => setRefCopiado(false), 2000);
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black border-2 border-[#0A0806] transition shrink-0 ${refCopiado ? 'bg-[#7BC77E] text-[#0A0806]' : 'bg-[#E3A23D] text-[#0A0806] hover:opacity-90'}`}
                >
                  {refCopiado ? '✓ Copiado' : 'Copiar'}
                </button>
              </div>
              </>)}
            </div>
          )}

          {/* ===== LISTA DE DESEOS ===== */}
          <div className="kk-panel rounded-3xl p-6">
            <button onClick={() => setWishAbierta(!wishAbierta)} className="w-full flex items-center justify-between text-left">
              <h3 className="font-display font-bold text-base flex items-center gap-2"><Star size={18} className="text-[#E3A23D]" /> Lista de deseos {wishlist.length > 0 && <span className="bg-[#E3A23D]/15 text-[#E3A23D] text-[10px] font-black px-2 py-0.5 rounded-full">{wishlist.length}</span>}</h3>
              <ChevronDown size={18} className={`text-[#9A9384] transition-transform duration-300 ${wishAbierta ? 'rotate-180' : ''}`} />
            </button>
            {wishAbierta && (<>
            <p className="text-xs text-[#9A9384] leading-relaxed mb-3 mt-2">Buscá cualquier skin, gesto o pico de Fortnite — hasta los que no rotan hace años. Cuando vuelva a la tienda, te avisamos por email al instante.</p>

            <div className="relative">
              <input
                type="text"
                value={wishBusqueda}
                onChange={(e) => setWishBusqueda(e.target.value)}
                placeholder="Buscar un cosmético... (mín. 3 letras)"
                className="w-full bg-[#14110C] border-2 border-[#0A0806] rounded-xl px-3 py-2.5 text-sm text-[#F5F1E6] placeholder-[#9A9384] focus:outline-none focus:border-[#E3A23D]"
              />
              {(wishBuscando || wishBuscado) && (
                <div className="absolute inset-x-0 top-full mt-1 z-20 bg-[#1D1913] border-2 border-[#0A0806] rounded-xl overflow-hidden shadow-xl">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
                    <span className="text-[10px] font-black text-[#9A9384] uppercase tracking-widest">
                      {wishBuscando ? 'Buscando...' : `${wishResultados.length} resultado${wishResultados.length === 1 ? '' : 's'}`}
                    </span>
                    <button onClick={() => { setWishBusqueda(''); setWishResultados([]); setWishBuscado(false); }} className="text-[#9A9384] hover:text-[#F5F1E6] text-xs font-bold transition">
                      Cerrar ✕
                    </button>
                  </div>
                  {wishMsg && (
                    <div className="px-3 py-2.5 bg-red-500/15 border-b-2 border-[#0A0806]">
                      <p className="text-red-400 text-xs font-bold">⚠️ {wishMsg}</p>
                    </div>
                  )}
                  <div className="max-h-80 overflow-y-auto">
                    {wishBuscando ? (
                      <p className="p-4 text-xs text-[#9A9384] font-bold">Revisando el catálogo completo de Fortnite...</p>
                    ) : wishResultados.length === 0 ? (
                      <div className="p-4">
                        <p className="text-sm font-bold text-[#D9D4C7]">No encontramos nada con &quot;{wishBusqueda}&quot;.</p>
                        <p className="text-xs text-[#9A9384] mt-1">Probá con otra parte del nombre, o con el nombre en inglés (ej: &quot;Renegade&quot;).</p>
                      </div>
                    ) : (
                      wishResultados.map((c) => {
                        const agregado = yaEnLista(c.id);
                        return (
                          <div key={c.id} className="flex items-center gap-3 p-2.5 hover:bg-white/5 transition border-b border-white/5 last:border-b-0">
                            {c.image ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={c.image} alt={c.name} className="w-14 h-14 rounded-xl border-2 border-[#0A0806] bg-[#14110C] object-contain shrink-0" loading="lazy" />
                            ) : <span className="w-14 h-14 rounded-xl border-2 border-[#0A0806] bg-[#14110C] shrink-0"></span>}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-[#F5F1E6] truncate">{c.name}</p>
                              <p className="text-[10px] text-[#9A9384]">{c.type}{c.rarity ? ` · ${c.rarity}` : ''}</p>
                            </div>
                            <button
                              onClick={() => !agregado && agregarDeseo(c)}
                              disabled={agregado || wishGuardando === c.id}
                              className={`shrink-0 px-3 py-2 rounded-lg text-xs font-black border-2 border-[#0A0806] transition ${agregado ? 'bg-[#7BC77E]/20 text-[#7BC77E] cursor-default' : 'bg-[#E3A23D] text-[#0A0806] hover:opacity-90 disabled:opacity-60'}`}
                            >
                              {agregado ? '✓ En tu lista' : wishGuardando === c.id ? '...' : '+ Agregar'}
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
            {wishMsg && <p className="text-red-400 text-xs font-bold mt-2">{wishMsg}</p>}

            {wishlist.length > 0 && (
              <div className="mt-4 space-y-2">
                {wishlist.map((w) => (
                  <div key={w.cosmetic_id} className="flex items-center gap-3 bg-[#14110C] border-2 border-[#0A0806] rounded-xl p-2">
                    {w.cosmetic_image ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={w.cosmetic_image} alt="" className="w-9 h-9 rounded-lg object-contain shrink-0" loading="lazy" />
                    ) : <span className="w-9 h-9 shrink-0"></span>}
                    <span className="flex-1 text-sm font-bold text-[#D9D4C7] truncate">{w.cosmetic_name}</span>
                    <button onClick={() => quitarDeseo(w.cosmetic_id)} className="text-[#9A9384] hover:text-red-400 transition p-1" title="Quitar">
                      <X size={15} />
                    </button>
                  </div>
                ))}
                <p className="text-[10px] text-[#5A554A] font-medium">{wishlist.length}/20 · Te avisamos por email cuando alguno vuelva a la tienda.</p>
              </div>
            )}
            </>)}
          </div>
        </div>

        {/* ===== COLUMNA DERECHA ===== */}
        <div className="min-w-0">
          <div className="flex gap-2 mb-6 bg-[#1D1913] p-1.5 rounded-xl border-2 border-[#0A0806] w-fit">
            <button onClick={() => setActiveTab('activos')} className={`px-5 py-2 rounded-lg text-sm font-black transition-all ${activeTab === 'activos' ? 'bg-[#E3A23D] text-[#0A0806]' : 'text-[#9A9384]'}`}>
              Pedidos Activos {activeOrders.length > 0 && `(${activeOrders.length})`}
            </button>
            <button onClick={() => setActiveTab('historial')} className={`px-5 py-2 rounded-lg text-sm font-black transition-all ${activeTab === 'historial' ? 'bg-[#E3A23D] text-[#0A0806]' : 'text-[#9A9384]'}`}>
              Historial
            </button>
            <button onClick={() => setActiveTab('movimientos')} className={`px-5 py-2 rounded-lg text-sm font-black transition-all ${activeTab === 'movimientos' ? 'bg-[#E3A23D] text-[#0A0806]' : 'text-[#9A9384]'}`}>
              Movimientos
            </button>
          </div>

          {activeTab === 'activos' ? (
            activeOrders.length === 0 ? (
              <div className="kk-panel p-10 rounded-3xl text-center">
                <CheckCircle2 size={36} className="mx-auto text-[#7BC77E] mb-3" />
                <p className="text-[#D9D4C7] font-bold">No tenés pedidos en camino ahora mismo.</p>
                <Link href="/#catalogo" className="text-[#E3A23D] font-bold text-sm hover:underline mt-2 inline-block">Ir al catálogo</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {activeOrders.map((order) => {
                  const gift = tieneRegalos(order.items);
                  let estado: { color: string; icon: ReactNode; texto: string };

                  if (!gift) {
                    estado = { color: '#E3A23D', icon: <Clock size={16} />, texto: 'En proceso — te avisamos apenas se acredite.' };
                  } else if (!order.friend_request_sent_at) {
                    estado = { color: '#EF4444', icon: <AlertTriangle size={16} />, texto: 'Aceptá nuestra solicitud de amistad en Epic Games para iniciar el contador de 48hs.' };
                  } else {
                    const elapsed = now - new Date(order.friend_request_sent_at).getTime();
                    const remaining = 48 * 60 * 60 * 1000 - elapsed;
                    if (remaining > 0) {
                      estado = { color: '#E3A23D', icon: <Clock size={16} />, texto: `Esperando las 48hs de amistad. Faltan: ${formatoRestante(remaining)}` };
                    } else {
                      estado = { color: '#7BC77E', icon: <Gift size={16} />, texto: 'Ya pasaron las 48hs — tu regalo está en camino.' };
                    }
                  }

                  return (
                    <div key={order.id} className="kk-panel rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <p className="font-mono text-xs text-[#9A9384] mb-1">#{order.id.slice(0, 8)}</p>
                        <p className="font-bold text-[#F5F1E6]">{itemsSummary(order.items)}</p>
                        <p className="font-mono text-sm text-[#E3A23D]">${Number(order.total_price).toFixed(2)} USD</p>
                      </div>
                      <div className="flex flex-col sm:items-end gap-2">
                        <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold max-w-sm" style={{ backgroundColor: `${estado.color}18`, color: estado.color }}>
                          {estado.icon}
                          <span>{estado.texto}</span>
                        </div>
                        <Link href={`/pedido/${order.id}`} className="text-[#7BC77E] hover:underline text-xs font-bold flex items-center gap-1 w-fit">
                          <Package size={12} /> Ver seguimiento en vivo →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : activeTab === 'historial' ? (
            orders.length === 0 ? (
              <div className="kk-panel p-10 rounded-3xl text-center">
                <p className="text-[#D9D4C7] font-bold">Todavía no hiciste ninguna compra.</p>
              </div>
            ) : (
              <div className="kk-panel rounded-2xl overflow-hidden font-mono">
                <div className="divide-y divide-white/5">
                  {orders.map((order) => {
                    const isDelivered = order.status?.toUpperCase().includes('ENTREGAD');
                    return (
                      <div key={order.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-sm hover:bg-white/5">
                        <span className="text-[#5A554A] text-xs w-24 shrink-0">{new Date(order.created_at).toLocaleDateString('es-ES')}</span>
                        <span className="flex-1 text-[#D9D4C7] truncate">{itemsSummary(order.items)}</span>
                        <span className="text-[#E3A23D] font-semibold w-20 shrink-0">${Number(order.total_price).toFixed(2)}</span>
                        <span className={`text-xs font-bold w-24 shrink-0 ${isDelivered ? 'text-[#7BC77E]' : 'text-[#E3A23D]'}`}>{order.status}</span>
                        <div className="flex gap-3 shrink-0">
                          <Link href={`/pedido/${order.id}`} className="text-[#7BC77E] hover:underline text-xs font-bold flex items-center gap-1">
                            <Package size={12} /> Seguir pedido
                          </Link>
                          <button onClick={() => volverAComprar(order.items)} className="text-[#4A93D6] hover:underline text-xs font-bold flex items-center gap-1">
                            <ShoppingCart size={12} /> Volver a comprar
                          </button>
                          {isDelivered && (
                            <button onClick={() => setReviewOrder(order)} className="text-[#E3A23D] hover:underline text-xs font-bold flex items-center gap-1">
                              <Star size={12} /> Reseñar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          ) : (
            movimientos.length === 0 ? (
              <div className="kk-panel p-10 rounded-3xl text-center">
                <Wallet size={36} className="mx-auto text-[#E3A23D] mb-3" />
                <p className="text-[#D9D4C7] font-bold">Todavía no hay movimientos en tu billetera.</p>
                <p className="text-[#9A9384] text-sm mt-1">Acá vas a ver cada recarga, compra, reembolso y recompensa, con fecha y monto.</p>
              </div>
            ) : (
              <div className="kk-panel rounded-2xl overflow-hidden font-mono">
                <div className="divide-y divide-white/5">
                  {movimientos.map((mov) => (
                    <div key={mov.id} className="p-4 flex items-center gap-4 text-sm hover:bg-white/5">
                      <span className="text-[#5A554A] text-xs w-24 shrink-0">{new Date(mov.created_at).toLocaleDateString('es-ES')}</span>
                      <span className="flex-1 text-[#D9D4C7]">{mov.concepto}</span>
                      <span className={`font-semibold shrink-0 ${Number(mov.monto) >= 0 ? 'text-[#7BC77E]' : 'text-red-400'}`}>
                        {Number(mov.monto) >= 0 ? '+' : ''}{Number(mov.monto).toFixed(2)} USD
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      </main>

      {/* ===== MODAL DE RECARGA ===== */}
      {showRecharge && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-y-auto">
          <div className="kk-panel p-8 rounded-3xl max-w-lg w-full relative my-8">
            <button onClick={cerrarModalRecarga} className="absolute top-4 right-4 text-[#9A9384] hover:text-[#F5F1E6]"><X size={20} /></button>

            {rechargeSuccess ? (
              <div className="text-center py-8">
                <CheckCircle2 size={48} className="mx-auto text-[#7BC77E] mb-4" />
                <p className="font-bold text-lg text-[#7BC77E] mb-2">¡Solicitud enviada!</p>
                <p className="text-[#9A9384] text-sm mb-6">Cuando confirmemos tu comprobante, el saldo se acredita solo.</p>
                <button onClick={cerrarModalRecarga} className="bg-[#E3A23D] text-[#0A0806] px-6 py-3 rounded-xl font-display font-bold border-[3px] border-[#0A0806]">Listo</button>
              </div>
            ) : !selectedPackage ? (
              <>
                <h3 className="font-display text-2xl font-bold mb-1">Elegí tu paquete</h3>
                <p className="text-[#9A9384] text-sm mb-6">El saldo se acredita apenas confirmamos tu pago.</p>
                <div className="space-y-3">
                  {PACKAGES.map((pkg) => (
                    <button
                      key={pkg.id} onClick={() => setSelectedPackage(pkg)}
                      className={`w-full kk-card-hover text-left rounded-2xl p-5 border-2 transition-colors flex items-center justify-between ${pkg.highlight ? 'border-[#E3A23D] bg-[#E3A23D]/5' : 'border-[#0A0806] bg-[#14110C]'}`}
                    >
                      <div>
                        <p className="font-display font-bold text-lg flex items-center gap-2">{pkg.id === 'kitson' ? <Gift size={18} className="text-[#E3A23D]" /> : <Zap size={18} className="text-[#E3A23D]" />} {pkg.label}</p>
                        <p className="text-xs text-[#9A9384]">Cargás ${pkg.pay.toFixed(2)}{pkg.bonus > 0 && <span className="text-[#7BC77E] font-bold"> + ${pkg.bonus} de regalo</span>}</p>
                      </div>
                      <p className="font-mono font-bold text-2xl text-[#E3A23D]">${(pkg.pay + pkg.bonus).toFixed(2)}</p>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <button onClick={() => setSelectedPackage(null)} className="text-[#9A9384] text-xs font-bold flex items-center gap-1 mb-4"><ChevronLeft size={14} /> Cambiar paquete</button>
                <h3 className="font-display text-xl font-bold mb-1">{selectedPackage.label}</h3>
                <p className="text-[#9A9384] text-sm mb-6">Transferí <span className="text-[#E3A23D] font-bold">${selectedPackage.pay.toFixed(2)}</span> a cualquiera de estas cuentas y subí tu comprobante.</p>

                <PaymentAccountsList onCopy={(text) => { setCopiedId(text); setTimeout(() => setCopiedId(null), 2000); }} copiedId={copiedId} />

                <label className="relative flex flex-col items-center justify-center w-full py-8 px-4 bg-[#14110C] border-2 border-dashed border-[#3A3527] hover:border-[#E3A23D] rounded-2xl cursor-pointer transition-colors mt-5 mb-6">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && setReceiptFile(e.target.files[0])} />
                  {receiptFile ? (
                    <span className="text-sm font-bold text-[#7BC77E]">{receiptFile.name}</span>
                  ) : (
                    <div className="text-center">
                      <UploadCloud size={24} className="text-[#E3A23D] mx-auto mb-2" />
                      <p className="text-sm font-bold text-[#D9D4C7]">Subir comprobante</p>
                    </div>
                  )}
                </label>

                <button onClick={enviarRecarga} disabled={submittingRecharge || !receiptFile} className="w-full bg-[#E3A23D] hover:bg-[#f0b458] disabled:opacity-40 text-[#0A0806] py-4 rounded-xl font-display font-bold border-[3px] border-[#0A0806] flex items-center justify-center gap-2">
                  {submittingRecharge ? <Loader2 className="animate-spin" size={18} /> : 'Enviar comprobante'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ===== MODAL DE RESEÑA ===== */}
      {reviewOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="kk-panel p-8 rounded-3xl max-w-md w-full relative">
            <button onClick={() => { setReviewOrder(null); setReviewPhoto(null); setComment(''); setRating(5); }} className="absolute top-4 right-4 text-[#9A9384] hover:text-[#F5F1E6] font-bold">✕</button>
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
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setRating(star)} className="focus:outline-none transition-transform hover:scale-110">
                      <Star size={36} className={star <= rating ? 'text-[#E3A23D] fill-[#E3A23D]' : 'text-[#3A3527]'} />
                    </button>
                  ))}
                </div>
                <textarea
                  placeholder="¿Qué tal fue la atención y rapidez?..."
                  value={comment} onChange={(e) => setComment(e.target.value)}
                  className="w-full bg-[#14110C] border-2 border-[#0A0806] rounded-xl p-4 text-[#F5F1E6] focus:outline-none focus:border-[#E3A23D] h-32 mb-4 resize-none"
                />
                <label className="relative flex items-center justify-center gap-2 w-full py-3 px-4 bg-[#14110C] border-2 border-dashed border-[#3A3527] hover:border-[#E3A23D] rounded-xl cursor-pointer transition-colors mb-6">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && setReviewPhoto(e.target.files[0])} />
                  <Camera size={16} className="text-[#E3A23D]" />
                  <span className="text-xs font-bold text-[#D9D4C7]">{reviewPhoto ? reviewPhoto.name : 'Agregar una foto (opcional)'}</span>
                  {reviewPhoto && (
                    <button
                      onClick={(e) => { e.preventDefault(); setReviewPhoto(null); }}
                      className="text-[#9A9384] hover:text-red-400"
                    >
                      <X size={14} />
                    </button>
                  )}
                </label>
                <button onClick={submitReview} disabled={subiendoReview} className="w-full bg-[#E3A23D] disabled:opacity-40 text-[#0A0806] py-4 rounded-xl font-display font-bold text-lg flex justify-center items-center gap-2 border-[3px] border-[#0A0806] hover:bg-[#f0b458]">
                  {subiendoReview ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />} {subiendoReview ? 'Publicando...' : 'Publicar reseña'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PaymentAccountsList({ onCopy, copiedId }: { onCopy: (t: string) => void; copiedId: string | null }) {
  const { getActiveConfig } = useCurrencyStore();
  const activeCurrency = getActiveConfig();
  return (
    <div className="space-y-3">
      {activeCurrency.accounts.map((acc: any, idx: number) => (
        <div key={idx} className="bg-[#14110C] border-2 border-[#0A0806] rounded-xl p-4">
          <p className="text-xs text-[#9A9384] mb-2 font-medium">{acc.method}</p>
          <div className="flex items-center justify-between bg-[#0A0806] p-3 rounded-lg">
            <span className="font-mono font-semibold text-[#E3A23D] tracking-wider text-sm">{acc.number}</span>
            <button onClick={() => { navigator.clipboard.writeText(acc.number); onCopy(acc.number); }} className="text-[#9A9384] hover:text-[#F5F1E6] transition-colors p-1">
              {copiedId === acc.number ? <Check size={16} className="text-[#7BC77E]" /> : <Copy size={16} />}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
