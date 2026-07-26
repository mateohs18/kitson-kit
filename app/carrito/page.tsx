"use client";

// Esta página usa useSession() (depende de si el visitante está logueado o
// no), así que no tiene sentido "pre-generarla" de antemano en el build.
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useFortniteCartStore } from '../../store/fortniteCartStore';
import { useCurrencyStore } from '../../store/currencyStore';
import CurrencySelector from '../../components/CurrencySelector';
import { signIn, useSession } from 'next-auth/react';
import {
  ShoppingCart, Trash2, Gamepad2, Menu, X,
  Loader2, CheckCircle2, UploadCloud, Copy, Wallet, Check,
  ShieldCheck, Hourglass, Pencil, AlertTriangle
} from 'lucide-react';

function formatoRestante(ms: number) {
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h ${m}m`;
}

export default function CarritoFortnitePage() {
  const { cart, removeFromCart, clearCart, totalPrice, totalItems } = useFortniteCartStore();
  const { getActiveConfig } = useCurrencyStore();
  const activeCurrency = getActiveConfig();

  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Estados CONECTADOS a la API de Epic Games
  const [epicId, setEpicId] = useState('');
  const [epicIdGuardado, setEpicIdGuardado] = useState('');
  const [editandoEpicId, setEditandoEpicId] = useState(true);
  const [guardandoEpicId, setGuardandoEpicId] = useState(false);
  const [epicIdError, setEpicIdError] = useState<string | null>(null);
  const [friendRequestedAt, setFriendRequestedAt] = useState<string | null>(null);
  const [ahora, setAhora] = useState(Date.now());

  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [processingFile, setProcessingFile] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState<{ code: string; descuento: number; mensaje: string } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [balance, setBalance] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'saldo' | 'manual'>('saldo');

  useEffect(() => setMounted(true), []);
  useEffect(() => { setCoupon(null); setCouponError(null); }, [cart]);
  
  // Actualizador para el contador de las 48hs
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  // API Interna: Cargar perfil
  useEffect(() => {
    if (!session?.user?.email) return;
    fetch('/api/mi-perfil')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.epicId) {
          setEpicId(d.epicId);
          setEpicIdGuardado(d.epicId);
          setEditandoEpicId(false);
        }
        if (d?.friendRequestedAt) setFriendRequestedAt(d.friendRequestedAt);
        if (typeof d?.balance === 'number') setBalance(d.balance);
      })
      .catch(() => {});
  }, [session]);

  if (!mounted) return null;

  const totalConDescuento = Math.max(totalPrice() - (coupon?.descuento || 0), 0);
  const convertedTotal = (totalConDescuento * activeCurrency.rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Lógica de las 48 horas
  const remaining = friendRequestedAt ? 48 * 60 * 60 * 1000 - (ahora - new Date(friendRequestedAt).getTime()) : null;
  const amistadLista = friendRequestedAt !== null && (remaining ?? 0) <= 0;

  const epicIdValido = epicId.trim().length >= 3 && !/\s/.test(epicId.trim());
  const cuentaLista = epicIdGuardado.trim().length >= 3 && !editandoEpicId;
  const paymentReady = paymentMethod === 'saldo' ? balance >= totalConDescuento && totalConDescuento > 0 : !!receiptFile;
  const currentStep = !cuentaLista ? 1 : !paymentReady ? 2 : 3;

  // API Interna: Guardar Epic ID y activar contador
  const guardarEpicId = async () => {
    if (!epicIdValido) {
      setEpicIdError('Escribí tu nombre de usuario de Epic Games (sin espacios, mínimo 3 caracteres).');
      return;
    }
    setGuardandoEpicId(true);
    setEpicIdError(null);
    try {
      const res = await fetch('/api/guardar-epic-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ epicId: epicId.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEpicIdError(data.error || 'No se pudo guardar tu Epic ID.');
        return;
      }
      setEpicIdGuardado(epicId.trim());
      setEditandoEpicId(false);
      const perfilRes = await fetch('/api/mi-perfil');
      if (perfilRes.ok) {
        const perfil = await perfilRes.json();
        setFriendRequestedAt(perfil.friendRequestedAt || new Date().toISOString());
      }
    } catch {
      setEpicIdError('No se pudo conectar. Probá de nuevo.');
    } finally {
      setGuardandoEpicId(false);
    }
  };

  const aplicarCupon = async () => {
    if (!couponInput.trim()) return;
    setValidatingCoupon(true);
    setCouponError(null);
    try {
      const res = await fetch('/api/validar-cupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput.trim(), total: totalPrice() }),
      });
      const data = await res.json();
      if (data.valido) {
        setCoupon({ code: data.code, descuento: data.descuento, mensaje: data.mensaje });
      } else {
        setCoupon(null);
        setCouponError(data.mensaje || 'Cupón inválido.');
      }
    } catch {
      setCouponError('No se pudo validar el cupón. Probá de nuevo.');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCheckout = async () => {
    if (!session?.user?.email) return alert('Iniciá sesión para procesar tu pedido.');
    if (cart.length === 0) return alert('Tu carrito está vacío.');
    if (!cuentaLista) return alert('Guardá tu Epic ID antes de continuar.');
    if (paymentMethod === 'saldo' && balance < totalConDescuento) return alert('No tenés saldo suficiente. Elegí Transferencia o cargá saldo primero.');

    setIsProcessing(true);
    try {
      let finalReceiptUrl = null;
      if (paymentMethod === 'manual') {
        if (!receiptFile) { setIsProcessing(false); return alert('Subí la captura de tu transferencia.'); }
        const formData = new FormData();
        formData.append('file', receiptFile);
        const uploadRes = await fetch('/api/subir-comprobante', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) { setIsProcessing(false); return alert(uploadData.error || 'No se pudo subir el comprobante.'); }
        finalReceiptUrl = uploadData.url;
      }

      // 🚀 PETICIÓN SEGURA A TU PROPIO SERVIDOR (Cero conexión a Google Sheets)
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: session.user.email,
          userName: session.user.name || 'Usuario',
          cart,
          gamerId: epicIdGuardado.trim(), 
          totalPrice: totalConDescuento,
          couponCode: coupon?.code || null,
          refCode: (() => { try { return localStorage.getItem('kitson_ref'); } catch { return null; } })(),
          paymentMethod,
          receiptUrl: finalReceiptUrl,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Hubo un problema procesando el pago.');

      setOrderSuccess(result.ordenId || 'ok');
      clearCart();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#14110C] text-[#F5F1E6] font-body selection:bg-[#E3A23D] selection:text-[#0A0806] relative">

      <header className="flex items-center justify-between p-4 md:px-8 border-b-4 border-[#0A0806] bg-[#E3A23D] sticky top-0 z-[100]">
        <div className="flex-1 flex justify-start">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full border-[3px] border-[#0A0806] overflow-hidden bg-[#F5F1E6]">
              <Image src="/logo.jpg" alt="Logo Kitson Kit" width={40} height={40} className="w-full h-full object-cover" />
            </div>
            <span className="font-display font-bold text-xl text-[#0A0806] hidden xl:block">KITSON KIT</span>
          </Link>
        </div>

        <nav className="hidden lg:flex flex-1 justify-center gap-8 font-semibold text-sm text-[#0A0806]">
          <Link href="/" className="hover:opacity-70 transition">Inicio</Link>
          <Link href="/tienda-diaria" className="hover:opacity-70 transition">Tienda Fortnite</Link>
          <Link href="/mi-cuenta" className="hover:opacity-70 transition">Mi Cuenta</Link>
        </nav>

        <div className="flex-1 flex items-center justify-end gap-3">
          <div className="hidden sm:block"><CurrencySelector /></div>
          {session ? (
            <Link href="/mi-cuenta" className="hidden sm:flex items-center gap-2 bg-[#0A0806] py-1.5 px-1.5 pr-4 rounded-lg hover:opacity-80 transition">
              <Image src={session.user?.image || "/logo.jpg"} alt="Avatar" width={32} height={32} className="w-8 h-8 rounded-full border-2 border-[#E3A23D] object-cover" />
            </Link>
          ) : (
            <button onClick={() => signIn()} className="hidden sm:block bg-[#0A0806] hover:opacity-90 text-[#E3A23D] px-6 py-2 rounded-lg font-black text-sm border-2 border-[#0A0806]">Iniciar Sesión</button>
          )}
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden text-[#0A0806] ml-1 p-2">
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[#1D1913] border-t-4 border-[#0A0806] flex flex-col p-6 gap-6 fixed top-[73px] bottom-0 left-0 w-full z-[90] overflow-y-auto">
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="font-display text-xl font-bold text-[#F5F1E6] border-b border-white/10 pb-4">Inicio</Link>
          <Link href="/tienda-diaria" onClick={() => setIsMobileMenuOpen(false)} className="font-display text-xl font-bold text-[#F5F1E6] border-b border-white/10 pb-4">Tienda Fortnite</Link>
          <Link href="/mi-cuenta" onClick={() => setIsMobileMenuOpen(false)} className="font-display text-xl font-bold text-[#F5F1E6] border-b border-white/10 pb-4">Mi Cuenta</Link>
          <div className="pt-2"><CurrencySelector /></div>
          {!session && <button onClick={() => signIn()} className="w-full bg-[#E3A23D] text-[#0A0806] py-4 rounded-xl font-black text-lg border-[3px] border-[#0A0806] mt-4">Iniciar Sesión</button>}
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 pt-10 pb-12 relative z-10">
        <div className="mb-8">
          <span className="inline-flex items-center gap-2 bg-[#4A93D6] text-[#0C2438] font-bold text-xs px-4 py-2 rounded-lg border-2 border-[#0A0806] mb-3">
            <Gamepad2 size={14} /> CARRITO DE FORTNITE
          </span>
          <h1 className="font-display font-extrabold text-3xl md:text-4xl">Tus artículos <span className="text-[#E3A23D]">de la tienda</span></h1>
          <p className="text-[#9A9384] text-sm mt-1">Este carrito es exclusivo para skins, packs y objetos de Fortnite — se entregan como regalo dentro del juego.</p>
        </div>

        {!orderSuccess && (
          <div className="flex items-center justify-center gap-2 sm:gap-4 mb-10 max-w-lg mx-auto">
            {[{ n: 1, label: 'Epic ID' }, { n: 2, label: 'Pago' }, { n: 3, label: 'Entrega' }].map((step, idx) => {
              const done = currentStep > step.n;
              const active = currentStep === step.n;
              return (
                <div key={step.n} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-9 h-9 rounded-full border-2 border-[#0A0806] flex items-center justify-center font-display font-bold text-sm transition-colors ${done ? 'bg-[#7BC77E] text-[#0A0806]' : active ? 'bg-[#E3A23D] text-[#0A0806]' : 'bg-[#1D1913] text-[#9A9384]'}`}>
                      {done ? <Check size={16} /> : step.n}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wide ${active || done ? 'text-[#F5F1E6]' : 'text-[#5A554A]'}`}>{step.label}</span>
                  </div>
                  {idx < 2 && <div className={`flex-1 h-[2px] mx-2 mb-4 transition-colors ${done ? 'bg-[#7BC77E]' : 'bg-[#3A3527]'}`}></div>}
                </div>
              );
            })}
          </div>
        )}

        {orderSuccess ? (
          <div className="text-center py-16 kk-panel rounded-3xl max-w-2xl mx-auto px-6">
            <div className="w-24 h-24 rounded-full border-[3px] border-[#0A0806] bg-[#4A93D6] overflow-hidden mx-auto mb-6 flex items-center justify-center">
              <Image src="/logo.jpg" alt="Mascota Kitson Kit" width={96} height={96} className="w-4/5 h-4/5 object-contain" />
            </div>
            <h2 className="font-display font-bold text-3xl mb-4">¡Pedido procesado!</h2>
            <p className="text-[#9A9384] mb-8 max-w-md mx-auto">
              {amistadLista
                ? 'Tu regalo se está enviando dentro del juego ahora mismo.'
                : 'Apenas se cumplan las 48hs de amistad con nuestro bot, tu regalo se entrega automáticamente — sin que tengas que hacer nada.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {orderSuccess !== 'ok' && (
                <Link href={`/pedido/${orderSuccess}`} className="bg-[#1D1913] text-[#F5F1E6] px-8 py-3 rounded-xl font-display font-bold border-[3px] border-[#0A0806] inline-block hover:bg-[#E3A23D] hover:text-[#0A0806] transition-colors">Ver seguimiento en vivo</Link>
              )}
              <Link href="/mi-cuenta" className="bg-[#E3A23D] text-[#0A0806] px-8 py-3 rounded-xl font-display font-bold border-[3px] border-[#0A0806] inline-block">Ver mis pedidos</Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-10">
            <div className="flex-1 space-y-6">

              <div className="bg-[#4A93D6]/20 border-2 border-[#4A93D6] p-4 rounded-xl flex gap-4 items-start">
                <AlertTriangle className="text-[#4A93D6] shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-[#4A93D6] mb-1">Regla de 48 horas</h4>
                  <p className="text-sm text-[#D9D4C7]">Si es tu primera compra, debes aceptar a nuestro bot en Fortnite. Epic Games requiere 48hs de amistad antes de poder enviar regalos.</p>
                </div>
              </div>

              <div className="kk-panel p-6 rounded-3xl">
                <h3 className="font-display text-xl font-bold mb-4 flex items-center gap-2"><Gamepad2 className="text-[#E3A23D]" /> 1. Tu cuenta de Epic Games</h3>

                {!session ? (
                  <p className="text-sm text-[#9A9384]">Iniciá sesión para vincular tu cuenta de Epic Games.</p>
                ) : editandoEpicId ? (
                  <div className="space-y-3">
                    <input
                      type="text" placeholder="Tu nombre de usuario de Epic Games"
                      value={epicId} onChange={(e) => { setEpicId(e.target.value); setEpicIdError(null); }}
                      className="w-full bg-[#14110C] border-2 border-[#0A0806] focus:border-[#E3A23D] rounded-xl px-4 py-3 text-[#F5F1E6] focus:outline-none transition-colors"
                    />
                    {epicIdError && <p className="text-red-400 text-xs font-bold">{epicIdError}</p>}
                    <button
                      onClick={guardarEpicId}
                      disabled={guardandoEpicId || !epicIdValido}
                      className="w-full bg-[#E3A23D] hover:bg-[#f0b458] disabled:opacity-40 text-[#0A0806] py-3 rounded-xl font-display font-bold flex items-center justify-center gap-2 border-2 border-[#0A0806]"
                    >
                      {guardandoEpicId ? <><Loader2 className="animate-spin" size={18} /> Guardando y avisando al bot...</> : 'Guardar y agregar amigo'}
                    </button>
                    <p className="text-[11px] text-[#9A9384]">Al guardar, nuestro bot te manda la solicitud de amistad automáticamente. Nunca te pedimos tu contraseña.</p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between bg-[#14110C] border-2 border-[#0A0806] rounded-xl px-4 py-3 mb-3">
                      <span className="font-mono font-bold text-[#F5F1E6]">{epicIdGuardado}</span>
                      <button onClick={() => setEditandoEpicId(true)} className="text-[#9A9384] hover:text-[#E3A23D] transition p-1" title="Cambiar Epic ID">
                        <Pencil size={16} />
                      </button>
                    </div>
                    {friendRequestedAt ? (
                      amistadLista ? (
                        <div className="flex items-center gap-2 bg-[#7BC77E]/10 text-[#7BC77E] rounded-xl px-4 py-2.5 text-sm font-bold">
                          <ShieldCheck size={16} /> Amistad confirmada — tus regalos se entregan al instante.
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 bg-[#E3A23D]/10 text-[#E3A23D] rounded-xl px-4 py-2.5 text-sm font-bold">
                          <Hourglass size={16} /> Esperando las 48hs de amistad — faltan {formatoRestante(remaining || 0)}.
                        </div>
                      )
                    ) : (
                      <p className="text-xs text-[#9A9384]">Podés comprar igual — la entrega se procesa apenas se confirme la amistad.</p>
                    )}
                  </div>
                )}
              </div>

              <div className="kk-panel p-6 rounded-3xl">
                <div className="flex justify-between mb-4">
                  <h3 className="font-display text-xl font-bold">2. Tu carrito</h3>
                  <span className="text-sm font-bold text-[#9A9384]">{totalItems()} items</span>
                </div>
                {cart.length === 0 ? (
                  <div className="text-center py-10 bg-[#14110C] rounded-xl border-2 border-[#0A0806]">
                    <div className="w-16 h-16 rounded-full border-[3px] border-[#0A0806] bg-[#4A93D6] overflow-hidden mx-auto mb-3 flex items-center justify-center">
                      <Image src="/logo.jpg" alt="Mascota Kitson Kit" width={64} height={64} className="w-4/5 h-4/5 object-contain" />
                    </div>
                    <p className="text-[#9A9384] font-medium">No has añadido nada aún.</p>
                    <Link href="/tienda-diaria" className="text-[#E3A23D] font-bold text-sm mt-2 inline-block hover:underline">Ir a la tienda de Fortnite</Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 bg-[#14110C] p-3 rounded-xl border-2 border-[#0A0806]">
                        {item.image_url && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                        )}
                        <div className="flex-1 min-w-0"><h4 className="font-bold text-sm truncate">{item.name} <span className="text-[#9A9384]">x{item.quantity}</span></h4></div>
                        <p className="font-mono font-semibold text-[#E3A23D] shrink-0">${(item.price * item.quantity).toFixed(2)} USD</p>
                        <button onClick={() => removeFromCart(item.id)} className="text-red-500/60 hover:text-red-400 p-2 transition-colors shrink-0"><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="w-full lg:w-[450px]">
              {!session ? (
                <div className="kk-panel p-8 rounded-3xl text-center">
                  <div className="w-16 h-16 rounded-full border-[3px] border-[#0A0806] bg-[#4A93D6] mx-auto mb-4 overflow-hidden flex items-center justify-center relative">
                    <div className="absolute inset-0 kk-dots opacity-15"></div>
                    <Image src="/logo.jpg" alt="Mascota Kitson Kit" width={60} height={60} className="w-4/5 h-4/5 object-contain rounded-full relative z-[1]" />
                  </div>
                  <h2 className="font-display text-2xl font-bold mb-2">Únete a la Squad</h2>
                  <p className="text-sm text-[#9A9384] mb-6">Iniciá sesión para procesar tu pago. Tu carrito te va a estar esperando.</p>
                  <Link href="/login?callbackUrl=/carrito-fortnite" className="w-full bg-[#E3A23D] text-[#0A0806] py-3 rounded-xl font-display font-bold text-sm inline-flex items-center justify-center gap-2 border-[3px] border-[#0A0806]">
                    Iniciar sesión
                  </Link>
                </div>
              ) : (
                <div className="kk-panel p-8 rounded-3xl sticky top-24">
                  <h2 className="font-display text-2xl font-bold mb-6">3. Método de pago</h2>

                  <div className="flex gap-2 mb-6 bg-[#14110C] p-1.5 rounded-xl border-2 border-[#0A0806]">
                    <button onClick={() => setPaymentMethod('saldo')} className={`flex-1 py-2.5 rounded-lg text-sm font-black transition-all ${paymentMethod === 'saldo' ? 'bg-[#E3A23D] text-[#0A0806]' : 'text-[#9A9384] hover:text-[#F5F1E6]'}`}>Saldo Kitson</button>
                    <button onClick={() => setPaymentMethod('manual')} className={`flex-1 py-2.5 rounded-lg text-sm font-black transition-all ${paymentMethod === 'manual' ? 'bg-[#E3A23D] text-[#0A0806]' : 'text-[#9A9384] hover:text-[#F5F1E6]'}`}>Transferencia</button>
                  </div>

                  <div className="mb-4">
                    <div className="flex gap-2">
                      <input
                        type="text" value={couponInput}
                        onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(null); }}
                        placeholder="¿Tenés un cupón?"
                        className="flex-1 bg-[#14110C] border-2 border-[#0A0806] rounded-xl px-4 py-2.5 text-sm font-mono text-[#F5F1E6] placeholder-[#9A9384] focus:outline-none focus:border-[#E3A23D] uppercase"
                      />
                      {coupon ? (
                        <button onClick={() => { setCoupon(null); setCouponInput(''); }} className="px-4 py-2.5 rounded-xl text-sm font-black bg-red-500/20 text-red-400 border-2 border-[#0A0806] hover:bg-red-500/30 transition">Quitar</button>
                      ) : (
                        <button onClick={aplicarCupon} disabled={validatingCoupon || !couponInput.trim()} className="px-4 py-2.5 rounded-xl text-sm font-black bg-[#E3A23D] text-[#0A0806] border-2 border-[#0A0806] disabled:opacity-50 hover:opacity-90 transition">{validatingCoupon ? '...' : 'Aplicar'}</button>
                      )}
                    </div>
                    {coupon && <p className="text-[#7BC77E] text-xs font-bold mt-2">✓ {coupon.mensaje}</p>}
                    {couponError && <p className="text-red-400 text-xs font-bold mt-2">{couponError}</p>}
                  </div>

                  <div className="space-y-3 mb-6 bg-[#14110C] p-5 rounded-2xl border-2 border-[#0A0806]">
                    <div className="flex justify-between text-[#9A9384] text-sm font-medium"><span>Total USD</span><span>${totalPrice().toFixed(2)}</span></div>
                    {coupon && (
                      <div className="flex justify-between text-[#7BC77E] text-sm font-bold"><span>Cupón {coupon.code}</span><span>-${coupon.descuento.toFixed(2)}</span></div>
                    )}
                    <div className="flex justify-between items-end pt-3 border-t border-white/10">
                      <span className="text-[#D9D4C7] font-bold">Total a pagar</span>
                      <div className="text-right">
                        <span className="font-mono font-semibold text-3xl text-[#E3A23D]">{activeCurrency.symbol}{convertedTotal}</span>
                        <p className="text-[10px] text-[#9A9384] mt-1 uppercase tracking-widest">{activeCurrency.currency}</p>
                      </div>
                    </div>
                  </div>

                  {paymentMethod === 'saldo' ? (
                    <div className="mb-8 p-5 bg-[#14110C] border-2 border-[#0A0806] rounded-xl flex items-center gap-4">
                      <div className="bg-[#4A93D6]/20 p-3 rounded-full text-[#4A93D6]"><Wallet size={24} /></div>
                      <div>
                        <p className="text-sm text-[#9A9384]">Tu saldo disponible:</p>
                        <p className={`font-mono font-semibold text-xl ${balance >= totalConDescuento ? 'text-[#7BC77E]' : 'text-red-400'}`}>${balance.toFixed(2)} USD</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mb-8">
                        <label className="block text-sm font-bold text-[#9A9384] mb-3">Cuentas de depósito ({activeCurrency.name}):</label>
                        <div className="space-y-3">
                          {activeCurrency.accounts.map((acc, idx) => (
                            <div key={idx} className="bg-[#14110C] border-2 border-[#0A0806] rounded-xl p-4">
                              <p className="text-xs text-[#9A9384] mb-2 font-medium">{acc.method}</p>
                              <div className="flex items-center justify-between bg-[#0A0806] p-3 rounded-lg group">
                                <span className="font-mono font-semibold text-[#E3A23D] tracking-wider text-sm">{acc.number}</span>
                                <button onClick={() => handleCopy(acc.number)} className="text-[#9A9384] hover:text-[#F5F1E6] transition-colors p-1">
                                  {copiedId === acc.number ? <CheckCircle2 className="text-[#7BC77E]" size={16} /> : <Copy size={16} />}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="mb-8">
                        <label className="block text-sm font-bold text-[#D9D4C7] mb-2">Sube la captura de pago <span className="text-red-400">*</span></label>
                        <label className="relative flex flex-col items-center justify-center w-full py-6 px-4 bg-[#14110C] border-2 border-dashed border-[#3A3527] hover:border-[#E3A23D] rounded-2xl cursor-pointer transition-colors group">
                          <input
                            type="file" accept="image/*" className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setProcessingFile(true);
                              setReceiptFile(null);
                              if (file.size > 5 * 1024 * 1024) {
                                setProcessingFile(false);
                                return alert('El archivo pesa más de 5MB. Subí una imagen más liviana.');
                              }
                              setTimeout(() => { setReceiptFile(file); setProcessingFile(false); }, 300);
                            }}
                          />
                          {processingFile ? (
                            <div className="text-center">
                              <Loader2 size={24} className="text-[#E3A23D] mx-auto mb-2 animate-spin" />
                              <p className="text-sm font-bold text-[#D9D4C7]">Procesando imagen...</p>
                            </div>
                          ) : receiptFile ? (
                            <span className="text-sm font-bold text-[#7BC77E]">{receiptFile.name}</span>
                          ) : (
                            <div className="text-center">
                              <UploadCloud size={24} className="text-[#E3A23D] mx-auto mb-2" />
                              <p className="text-sm font-bold text-[#D9D4C7]">Seleccionar comprobante</p>
                            </div>
                          )}
                        </label>
                      </div>
                    </>
                  )}

                  <button
                    onClick={handleCheckout}
                    disabled={isProcessing || processingFile || cart.length === 0 || !cuentaLista || (paymentMethod === 'manual' && !receiptFile)}
                    className="w-full bg-[#E3A23D] hover:bg-[#f0b458] disabled:opacity-40 text-[#0A0806] py-4 rounded-xl font-display font-bold flex items-center justify-center gap-2 border-[3px] border-[#0A0806]"
                  >
                    {isProcessing ? <><Loader2 className="animate-spin" size={20} /> Procesando...</> : !cuentaLista ? 'Guardá tu Epic ID para continuar' : 'Confirmar compra'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
