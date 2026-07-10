"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '../../store/cartStore';
import { useCurrencyStore } from '../../store/currencyStore';
import CurrencySelector from '../../components/CurrencySelector';
import { supabase } from '../../lib/supabase';
import { signIn, signOut, useSession } from 'next-auth/react';
import { 
  ShoppingCart, Trash2, Gamepad2, Menu, X, LogOut,
  Loader2, CheckCircle2, UploadCloud, Copy, Wallet, Mail, Lock 
} from 'lucide-react';

export default function CartPage() {
  const { cart, removeFromCart, clearCart, totalPrice, totalItems } = useCartStore();
  const { getActiveConfig } = useCurrencyStore();
  const activeCurrency = getActiveConfig();

  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [gamerId, setGamerId] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const [balance, setBalance] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'saldo' | 'manual'>('manual');

  // ESTADOS PARA EL PANEL DE AUTENTICACIÓN
  const [authTab, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  useEffect(() => setMounted(true), []);

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

  const convertedTotal = (totalPrice() * activeCurrency.rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return alert("Por favor, completa todos los campos.");
    setIsAuthLoading(true);

    try {
      if (authTab === 'register') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("¡Cuenta creada! Revisa tu correo o inicia sesión para continuar.");
        setAuthMode('login');
      } else {
        const res = await signIn('credentials', { redirect: false, email, password });
        if (res?.error) alert("Credenciales incorrectas. Verifica tus datos.");
      }
    } catch (err: any) {
      alert(err.message || "Ocurrió un error en la autenticación.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!session) return alert("Debes iniciar sesión para procesar tu pedido.");
    if (!session.user?.email) return alert("Error: Tu sesión no tiene un correo electrónico válido. Vuelve a iniciar sesión.");
    if (cart.length === 0) return alert("Tu carrito está vacío.");
    if (!gamerId.trim()) return alert("Necesitamos tu ID de Epic Games o GamerTag para la entrega.");

    setIsProcessing(true);
    
    try {
      let finalReceiptUrl = null;

      // Si es transferencia manual, subimos la imagen primero
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

      // 🚀 PETICIÓN AL BACKEND (Asegúrate de que este bloque esté así tal cual)
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: session.user.email,
          userName: session.user.name || 'Usuario',
          cart: cart,                 
          gamerId: gamerId,           
          totalPrice: totalPrice(),   
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
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-500 relative">
      
      <header className="flex items-center justify-between p-4 md:px-8 border-b border-white/5 bg-[#050505]/95 backdrop-blur-xl sticky top-0 z-[100]">
        <div className="flex-1 flex justify-start">
          <Link href="/" className="flex items-center gap-3 group">
            <img src="/logo.jpg" alt="Logo Kitson Kit" className="w-10 h-10 rounded-full border border-white/10 group-hover:border-orange-500 transition object-cover" />
            <span className="text-2xl font-black text-white hidden xl:block">Kitson <span className="text-orange-500">Kit</span></span>
          </Link>
        </div>
        
        <nav className="hidden lg:flex flex-1 justify-center gap-8 font-medium text-sm text-gray-400">
          <Link href="/" className="hover:text-white transition">Inicio</Link>
          <Link href="/#catalogo" className="hover:text-white transition">Catálogo</Link>
          <Link href="/tienda-diaria" className="hover:text-white transition">Tienda Fortnite</Link>
        </nav>

        <div className="flex-1 flex items-center justify-end gap-4">
          <div className="hidden sm:block"><CurrencySelector /></div>
          {session ? (
            <div className="hidden sm:flex items-center gap-3 bg-white/5 py-1.5 px-1.5 pr-4 rounded-full border border-white/10">
              <Link href="/mis-pedidos" className="flex items-center gap-2 hover:opacity-80 transition">
                <img src={session.user?.image || "/logo.jpg"} alt="Avatar" className="w-8 h-8 rounded-full border border-orange-500/50" />
                <span className="text-sm font-bold text-gray-200">{session.user?.name}</span>
              </Link>
              <button onClick={() => signOut()} className="text-red-400 hover:text-red-300 ml-2 border-l border-white/10 pl-3"><LogOut size={16}/></button>
            </div>
          ) : (
            <button onClick={() => signIn('discord')} className="hidden sm:block bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm px-6 py-2.5 rounded-full font-black">Login</button>
          )}
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden text-gray-400 ml-1 p-2">
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[#0A0A0A] border-t border-white/10 flex flex-col p-6 gap-6 fixed top-[73px] bottom-0 left-0 w-full z-[90] overflow-y-auto">
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-white border-b border-white/5 pb-4">Inicio</Link>
          <Link href="/#catalogo" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-white border-b border-white/5 pb-4">Catálogo</Link>
          <Link href="/tienda-diaria" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-white border-b border-white/5 pb-4">Tienda Fortnite</Link>
          <div className="pt-2"><CurrencySelector /></div>
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 relative z-10">
        {orderSuccess ? (
          <div className="text-center py-24 bg-green-500/5 border border-green-500/20 rounded-3xl max-w-2xl mx-auto">
            <CheckCircle2 size={80} className="text-green-500 mx-auto mb-6" />
            <h2 className="text-3xl font-black mb-4">¡Pedido Procesado!</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">Tu compra se ha registrado con éxito. Nuestro equipo te enviará los artículos a la brevedad.</p>
            <Link href="/mis-pedidos" className="bg-orange-500 text-[#050505] px-8 py-3 rounded-full font-black shadow-lg">Ver mis pedidos</Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-10">
            <div className="flex-1 space-y-6">
              <div className="bg-[#0A0A0A] p-6 rounded-3xl border border-white/5">
                <h3 className="text-xl font-black mb-4 flex items-center gap-2"><Gamepad2 className="text-orange-500"/> 1. Cuenta Destino</h3>
                <input 
                  type="text" placeholder="Tu ID de Epic Games o GamerTag"
                  value={gamerId} onChange={(e) => setGamerId(e.target.value)}
                  className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              <div className="bg-[#0A0A0A] p-6 rounded-3xl border border-white/5">
                <div className="flex justify-between mb-4">
                  <h3 className="text-xl font-black">2. Tu Carrito</h3>
                  <span className="text-sm font-bold text-gray-500">{totalItems()} items</span>
                </div>
                {cart.length === 0 ? (
                  <div className="text-center py-10 bg-[#111] rounded-xl border border-white/5">
                    <ShoppingCart size={40} className="text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 font-medium">No has añadido nada aún.</p>
                    <Link href="/tienda-diaria" className="text-orange-500 font-bold text-sm mt-2 inline-block hover:underline">Ir a la tienda</Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 bg-[#111] p-3 rounded-xl border border-white/5">
                        <div className="flex-1"><h4 className="font-bold text-sm">{item.name} <span className="text-gray-500">x{item.quantity}</span></h4></div>
                        <p className="font-black">${(item.price * item.quantity).toFixed(2)} USD</p>
                        <button onClick={() => removeFromCart(item.id)} className="text-red-500/50 hover:text-red-500 p-2 transition-colors"><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="w-full lg:w-[450px]">
              {!session ? (
                <div className="bg-[#0A0A0A] border border-white/5 p-8 rounded-3xl shadow-2xl">
                  <h2 className="text-2xl font-black mb-2 text-center">Únete a la Squad</h2>
                  <p className="text-sm text-gray-500 text-center mb-6">Regístrate o ingresa para procesar tu pago.</p>
                  
                  <div className="flex gap-2 mb-6 bg-[#111] p-1.5 rounded-xl border border-white/5">
                    <button onClick={() => setAuthMode('login')} className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${authTab === 'login' ? 'bg-white/5 border border-white/10 text-white' : 'text-gray-500'}`}>Iniciar Sesión</button>
                    <button onClick={() => setAuthMode('register')} className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${authTab === 'register' ? 'bg-white/5 border border-white/10 text-white' : 'text-gray-500'}`}>Crear Cuenta</button>
                  </div>

                  <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
                    <div className="relative">
                      <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                      <input type="email" placeholder="Tu correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#111] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-orange-500 transition-colors" />
                    </div>
                    <div className="relative">
                      <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                      <input type="password" placeholder="Tu contraseña" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#111] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-orange-500 transition-colors" />
                    </div>
                    <button type="submit" disabled={isAuthLoading} className="w-full bg-orange-500 text-black py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2">
                      {isAuthLoading ? <Loader2 size={16} className="animate-spin" /> : authTab === 'login' ? "Ingresar" : "Completar Registro"}
                    </button>
                  </form>

                  <div className="relative flex py-2 items-center mb-6">
                    <div className="flex-grow border-t border-white/5"></div>
                    <span className="flex-shrink mx-4 text-gray-600 text-xs font-bold uppercase tracking-wider">O ingresa con</span>
                    <div className="flex-grow border-t border-white/5"></div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => signIn('google')} className="bg-white text-black py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Google
                    </button>
                    <button onClick={() => signIn('discord')} className="bg-[#5865F2] hover:bg-[#4752C4] text-white py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-colors">
                      Discord
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-[#0A0A0A] border border-white/5 p-8 rounded-3xl sticky top-24">
                  <h2 className="text-2xl font-black mb-6">3. Método de Pago</h2>
                  
                  <div className="flex gap-2 mb-6 bg-[#111] p-1.5 rounded-xl border border-white/5">
                    <button onClick={() => setPaymentMethod('saldo')} className={`flex-1 py-2.5 rounded-lg text-sm font-black transition-all ${paymentMethod === 'saldo' ? 'bg-orange-500 text-black shadow-md' : 'text-gray-400 hover:text-white'}`}>Saldo Kitson</button>
                    <button onClick={() => setPaymentMethod('manual')} className={`flex-1 py-2.5 rounded-lg text-sm font-black transition-all ${paymentMethod === 'manual' ? 'bg-orange-500 text-black shadow-md' : 'text-gray-400 hover:text-white'}`}>Transferencia</button>
                  </div>

                  <div className="space-y-3 mb-6 bg-[#111] p-5 rounded-2xl border border-white/5">
                    <div className="flex justify-between text-gray-400 text-sm font-medium"><span>Total USD</span><span>${totalPrice().toFixed(2)}</span></div>
                    <div className="flex justify-between items-end pt-3 border-t border-white/10">
                      <span className="text-gray-300 font-bold">Total a Pagar</span>
                      <div className="text-right">
                        <span className="text-3xl font-black text-orange-500">{activeCurrency.symbol}{convertedTotal}</span>
                        <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">{activeCurrency.currency}</p>
                      </div>
                    </div>
                  </div>

                  {paymentMethod === 'saldo' ? (
                    <div className="mb-8 p-5 bg-[#111] border border-white/10 rounded-xl flex items-center gap-4">
                      <div className="bg-orange-500/20 p-3 rounded-full text-orange-500"><Wallet size={24}/></div>
                      <div>
                        <p className="text-sm text-gray-400">Tu saldo disponible:</p>
                        <p className={`text-xl font-black ${balance >= totalPrice() ? 'text-green-400' : 'text-red-400'}`}>${balance.toFixed(2)} USD</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mb-8">
                        <label className="block text-sm font-bold text-gray-400 mb-3">Cuentas de depósito ({activeCurrency.name}):</label>
                        <div className="space-y-3">
                          {activeCurrency.accounts.map((acc, idx) => (
                            <div key={idx} className="bg-[#111] border border-white/10 rounded-xl p-4">
                              <p className="text-xs text-gray-400 mb-2 font-medium">{acc.method}</p>
                              <div className="flex items-center justify-between bg-[#050505] border border-white/5 p-3 rounded-lg group">
                                <span className="font-mono font-bold text-orange-500 tracking-wider text-sm">{acc.number}</span>
                                <button onClick={() => handleCopy(acc.number)} className="text-gray-500 hover:text-white transition-colors p-1"><Copy size={16} /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mb-8">
                        <label className="block text-sm font-bold text-gray-300 mb-2">Sube la captura de pago <span className="text-red-500">*</span></label>
                        <label className="relative flex flex-col items-center justify-center w-full py-6 px-4 bg-[#111] border-2 border-dashed border-white/10 hover:border-orange-500/50 rounded-2xl cursor-pointer transition-colors group">
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => { if(e.target.files) setReceiptFile(e.target.files[0]) }} />
                          {receiptFile ? (
                            <span className="text-sm font-bold text-green-400">{receiptFile.name}</span>
                          ) : (
                            <div className="text-center">
                              <UploadCloud size={24} className="text-orange-500 mx-auto mb-2" />
                              <p className="text-sm font-bold text-gray-300">Seleccionar comprobante</p>
                            </div>
                          )}
                        </label>
                      </div>
                    </>
                  )}

                  <button 
                    onClick={handleCheckout} 
                    disabled={isProcessing || cart.length === 0}
                    className="w-full bg-orange-500 hover:bg-orange-400 disabled:bg-orange-500/30 text-[#050505] py-4 rounded-xl font-black flex items-center justify-center gap-2"
                  >
                    {isProcessing ? <><Loader2 className="animate-spin" size={20} /> Procesando...</> : "Confirmar Compra"}
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