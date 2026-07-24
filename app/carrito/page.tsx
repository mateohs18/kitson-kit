"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '../../store/cartStore';
import { useCurrencyStore } from '../../store/currencyStore';
import CurrencySelector from '../../components/CurrencySelector';
import { signIn, useSession } from 'next-auth/react';
import {
  ShoppingCart, Trash2, Gamepad2, Menu, X,
  Loader2, CheckCircle2, UploadCloud, Copy, Wallet, Check, CreditCard
} from 'lucide-react';

export default function CartPage() {
  const { cart, removeFromCart, clearCart, totalPrice, totalItems } = useCartStore();
  const { getActiveConfig } = useCurrencyStore();
  const activeCurrency = getActiveConfig();

  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Nuevos estados para el tipo de recarga y datos de Xbox
  const [rechargeType, setRechargeType] = useState<'regalo' | 'directa'>('regalo');
  const [gamerId, setGamerId] = useState('');
  const [xboxEmail, setXboxEmail] = useState('');
  const [xboxPassword, setXboxPassword] = useState('');

  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [processingFile, setProcessingFile] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState<{ code: string; descuento: number; mensaje: string } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [balance, setBalance] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'saldo' | 'manual'>('manual');

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setCoupon(null);
    setCouponError(null);
  }, [cart]);

  useEffect(() => {
    async function checkBalance() {
      if (session?.user?.email) {
        const res = await fetch('/api/mi-saldo');
        if (res.ok) {
          const data = await res.json();
          setBalance(data.balance);
        }
      }
    }
    checkBalance();
  }, [session]);

  if (!mounted) return null;

  // Validación dinámica dependiendo del tipo de recarga
  const gamerIdTrimmed = gamerId.trim();
  const gamerIdValid = gamerIdTrimmed.length >= 3 && !/\s/.test(gamerIdTrimmed);
  const xboxValid = xboxEmail.trim().includes('@') && xboxPassword.trim().length > 0;
  
  const isAccountInfoValid = rechargeType === 'regalo' ? gamerIdValid : xboxValid;

  const totalConDescuento = Math.max(totalPrice() - (coupon?.descuento || 0), 0);

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

  const paymentReady = paymentMethod === 'saldo' ? balance >= totalConDescuento && totalConDescuento > 0 : !!receiptFile;

  const currentStep = !isAccountInfoValid ? 1 : !paymentReady ? 2 : 3;

  const convertedTotal = (totalConDescuento * activeCurrency.rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCheckout = async () => {
    if (!session) return alert("Debes iniciar sesión para procesar tu pedido.");
    if (!session.user?.email) return alert("Error: Tu sesión no tiene un correo electrónico válido. Vuelve a iniciar sesión.");
    if (cart.length === 0) return alert("Tu carrito está vacío.");
    
    // Validación según método
    if (rechargeType === 'regalo' && !gamerId.trim()) return alert("Necesitamos tu ID de Epic Games o GamerTag para la entrega.");
    if (rechargeType === 'directa' && (!xboxEmail.trim() || !xboxPassword.trim())) return alert("Necesitamos tu correo y contraseña de Xbox.");
    
    if (paymentMethod === 'saldo' && balance < totalConDescuento) return alert("No tenés saldo suficiente. Elegí Transferencia o cargá saldo primero.");

    setIsProcessing(true);

    try {
      let finalReceiptUrl = null;

      if (paymentMethod === 'manual') {
        if (!receiptFile) {
          setIsProcessing(false);
          return alert("Por favor, sube la captura de tu transferencia.");
        }
        const formData = new FormData();
        formData.append('file', receiptFile);
        const uploadRes = await fetch('/api/subir-comprobante', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          setIsProcessing(false);
          return alert(uploadData.error || "No se pudo subir el comprobante.");
        }
        finalReceiptUrl = uploadData.url;
      }

      // --- 🚀 ENVIAR DATOS AL EXCEL VÍA SHEETDB ---
      try {
        const sheetDbUrl = 'PEGA_AQUI_LA_URL_CORTITA_DE_SHEETDB'; // Ej: https://sheetdb.io/api/v1/tucodigo
        
        await fetch(sheetDbUrl, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            data: {
              fecha: new Date().toLocaleString(),
              cliente_email: session.user.email,
              tipo_recarga: rechargeType === 'regalo' ? 'Vía Regalo' : 'Directa (Xbox)',
              id_epic: rechargeType === 'regalo' ? gamerId.trim() : 'N/A',
              correo_xbox: rechargeType === 'directa' ? xboxEmail.trim() : 'N/A',
              password_xbox: rechargeType === 'directa' ? xboxPassword.trim() : 'N/A'
            }
          })
        });
      } catch (sheetError) {
        console.error("No se pudo guardar en el Excel:", sheetError);
      }
      // ----------------------------------------
      // ----------------------------------------
      // ----------------------------------------

      // 🚀 PETICIÓN AL BACKEND
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: session.user.email,
          userName: session.user.name || 'Usuario',
          cart: cart,
          gamerId: rechargeType === 'regalo' ? gamerId.trim() : 'N/A',
          rechargeType: rechargeType, 
          xboxEmail: rechargeType === 'directa' ? xboxEmail.trim() : null, 
          xboxPassword: rechargeType === 'directa' ? xboxPassword.trim() : null, 
          totalPrice: totalConDescuento,
          couponCode: coupon?.code || null,
          refCode: (() => { try { return localStorage.getItem('kitson_ref'); } catch { return null; } })(),
          paymentMethod: paymentMethod,
          receiptUrl: finalReceiptUrl
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Hubo un problema procesando el pago.");
      }

      setOrderSuccess(true);
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
          <Link href="/#catalogo" className="hover:opacity-70 transition">Catálogo</Link>
          <Link href="/tienda-diaria" className="hover:opacity-70 transition">Tienda Fortnite</Link>
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
          <Link href="/#catalogo" onClick={() => setIsMobileMenuOpen(false)} className="font-display text-xl font-bold text-[#F5F1E6] border-b border-white/10 pb-4">Catálogo</Link>
          <Link href="/tienda-diaria" onClick={() => setIsMobileMenuOpen(false)} className="font-display text-xl font-bold text-[#F5F1E6] border-b border-white/10 pb-4">Tienda Fortnite</Link>
          <div className="pt-2"><CurrencySelector /></div>
          <div className="mt-6 pt-6 border-t border-white/10">
            {!session && <button onClick={() => signIn()} className="w-full bg-[#E3A23D] text-[#0A0806] py-4 rounded-xl font-black text-lg border-[3px] border-[#0A0806]">Iniciar Sesión</button>}
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 pt-28 pb-12 relative z-10">
        {!orderSuccess && (
          <div className="flex items-center justify-center gap-2 sm:gap-4 mb-10 max-w-lg mx-auto">
            {[
              { n: 1, label: 'Tu cuenta' },
              { n: 2, label: 'Pago' },
              { n: 3, label: 'Entrega' },
            ].map((step, idx) => {
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
            <p className="text-[#9A9384] mb-8 max-w-md mx-auto">Tu compra se ha registrado con éxito. Nuestro equipo te enviará los artículos a la brevedad.</p>
            <Link href="/mi-cuenta" className="bg-[#E3A23D] text-[#0A0806] px-8 py-3 rounded-xl font-display font-bold border-[3px] border-[#0A0806] inline-block">Ver mis pedidos</Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-10">
            <div className="flex-1 space-y-6">
              <div className="kk-panel p-6 rounded-3xl">
                <h3 className="font-display text-xl font-bold mb-4 flex items-center gap-2"><Gamepad2 className="text-[#E3A23D]"/> 1. Cuenta destino</h3>
                
                {/* Selector de Método de Recarga */}
                <div className="flex gap-2 mb-6 bg-[#14110C] p-1.5 rounded-xl border-2 border-[#0A0806]">
                  <button onClick={() => setRechargeType('regalo')} className={`flex-1 py-2.5 rounded-lg text-sm font-black transition-all ${rechargeType === 'regalo' ? 'bg-[#E3A23D] text-[#0A0806]' : 'text-[#9A9384] hover:text-[#F5F1E6]'}`}>Vía Regalo (Epic)</button>
                  <button onClick={() => setRechargeType('directa')} className={`flex-1 py-2.5 rounded-lg text-sm font-black transition-all ${rechargeType === 'directa' ? 'bg-[#E3A23D] text-[#0A0806]' : 'text-[#9A9384] hover:text-[#F5F1E6]'}`}>Directa (Xbox)</button>
                </div>

                {/* Campos Dinámicos */}
                {rechargeType === 'regalo' ? (
                  <div>
                    <div className="relative">
                      <input
                        type="text" placeholder="Tu ID de Epic Games o GamerTag"
                        value={gamerId} onChange={(e) => setGamerId(e.target.value)}
                        className={`w-full bg-[#14110C] border-2 rounded-xl px-4 py-3 pr-11 text-[#F5F1E6] focus:outline-none transition-colors ${gamerId.trim().length === 0 ? 'border-[#0A0806] focus:border-[#E3A23D]' : gamerIdValid ? 'border-[#7BC77E]' : 'border-red-500/60'}`}
                      />
                      {gamerId.trim().length > 0 && (
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
                          {gamerIdValid ? <Check size={20} className="text-[#7BC77E]" /> : <X size={20} className="text-red-400" />}
                        </span>
                      )}
                    </div>
                    {gamerId.trim().length > 0 && !gamerIdValid && (
                      <p className="text-xs text-red-400 mt-2">El ID no puede tener espacios y debe tener al menos 3 caracteres.</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <input
                      type="email" placeholder="Correo de Xbox (Microsoft)"
                      value={xboxEmail} onChange={(e) => setXboxEmail(e.target.value)}
                      className="w-full bg-[#14110C] border-2 border-[#0A0806] focus:border-[#E3A23D] rounded-xl px-4 py-3 text-[#F5F1E6] focus:outline-none transition-colors"
                    />
                    <input
                      type="text" placeholder="Contraseña de Xbox"
                      value={xboxPassword} onChange={(e) => setXboxPassword(e.target.value)}
                      className="w-full bg-[#14110C] border-2 border-[#0A0806] focus:border-[#E3A23D] rounded-xl px-4 py-3 text-[#F5F1E6] focus:outline-none transition-colors"
                    />
                    <p className="text-[11px] text-[#9A9384]">La recarga directa requiere los datos de tu cuenta vinculada de Microsoft (Xbox). Tus datos están cifrados y seguros.</p>
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
                    <Link href="/tienda-diaria" className="text-[#E3A23D] font-bold text-sm mt-2 inline-block hover:underline">Ir a la tienda</Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 bg-[#14110C] p-3 rounded-xl border-2 border-[#0A0806]">
                        <div className="flex-1"><h4 className="font-bold text-sm">{item.name} <span className="text-[#9A9384]">x{item.quantity}</span></h4></div>
                        <p className="font-mono font-semibold text-[#E3A23D]">${(item.price * item.quantity).toFixed(2)} USD</p>
                        <button onClick={() => removeFromCart(item.id)} className="text-red-500/60 hover:text-red-400 p-2 transition-colors"><Trash2 size={16} /></button>
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
                  <Link href="/login?callbackUrl=/carrito" className="w-full bg-[#E3A23D] text-[#0A0806] py-3 rounded-xl font-display font-bold text-sm inline-flex items-center justify-center gap-2 border-[3px] border-[#0A0806]">
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
                        type="text"
                        value={couponInput}
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
                      <div className="bg-[#4A93D6]/20 p-3 rounded-full text-[#4A93D6]"><Wallet size={24}/></div>
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
                                return alert("El archivo pesa más de 5MB. Subí una imagen más liviana.");
                              }
                              setTimeout(() => {
                                setReceiptFile(file);
                                setProcessingFile(false);
                              }, 300);
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
                    disabled={isProcessing || processingFile || cart.length === 0 || !isAccountInfoValid || (paymentMethod === 'manual' && !receiptFile)}
                    className="w-full bg-[#E3A23D] hover:bg-[#f0b458] disabled:opacity-40 text-[#0A0806] py-4 rounded-xl font-display font-bold flex items-center justify-center gap-2 border-[3px] border-[#0A0806]"
                  >
                    {isProcessing ? <><Loader2 className="animate-spin" size={20} /> Procesando...</> : !isAccountInfoValid ? "Completá tus datos para continuar" : "Confirmar compra"}
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
