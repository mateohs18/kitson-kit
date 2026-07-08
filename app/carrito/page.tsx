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
  Loader2, CheckCircle2, UploadCloud, Copy, Check, Wallet, Mail, Lock 
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

  // ESTADOS PARA EL NUEVO PANEL DE AUTENTICACIÓN
  const [authTab, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    async function checkBalance() {
      const userEmail = session?.user?.email;
      const userName = session?.user?.name || 'Usuario';

      if (userEmail) {
        const { data } = await supabase.from('profiles').select('balance').eq('email', userEmail).single();
        if (data) {
          setBalance(data.balance);
        } else {
          await supabase.from('profiles').insert([{ email: userEmail, name: userName, balance: 0 }]);
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

  // MANEJO DE REGISTRO / LOGIN CON CORREO
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return alert("Por favor, completa todos los campos.");
    setIsAuthLoading(true);

    try {
      if (authTab === 'register') {
        // Registro directo en Supabase Auth o NextAuth según tu api
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("¡Cuenta creada con éxito! Revisa tu correo para verificarla si es necesario o inicia sesión.");
        setAuthMode('login');
      } else {
        // Inicio de sesión usando NextAuth Credentials Provider
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
    if (cart.length === 0) return alert("Tu carrito está vacío.");
    if (!gamerId.trim()) return alert("Necesitamos tu ID de Epic Games o GamerTag para la entrega.");

    const userEmail = session.user?.email || '';
    const userName = session.user?.name || 'Gamer';

    setIsProcessing(true);
    
    try {
      if (paymentMethod === 'saldo') {
        if (balance < totalPrice()) {
          setIsProcessing(false);
          return alert("No tienes saldo suficiente. Ve a la Billetera para recargar.");
        }
        
        await supabase.from('profiles').update({ balance: balance - totalPrice() }).eq('email', userEmail);
        
        await supabase.from('orders').insert([{
          user_email: userEmail, user_name: userName,
          gamer_id: gamerId, items: cart, total_price: totalPrice(), status: 'PAGADO CON SALDO',
          country: 'Kitson Wallet', local_currency: 'USD', local_price: totalPrice()
        }]);

      } else {
        if (!receiptFile) {
          setIsProcessing(false);
          return alert("Por favor, sube la captura de tu transferencia.");
        }
        const fileExt = receiptFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        await supabase.storage.from('comprobantes').upload(fileName, receiptFile);
        const { data: publicUrlData } = supabase.storage.from('comprobantes').getPublicUrl(fileName);
        
        await supabase.from('orders').insert([{
          user_email: userEmail, user_name: userName,
          gamer_id: gamerId, items: cart, total_price: totalPrice(), status: 'PENDIENTE',
          country: activeCurrency.name, local_currency: activeCurrency.currency,
          local_price: parseFloat(convertedTotal.replace(/,/g, '')), payment_proof: publicUrlData.publicUrl
        }]);
      }

      setOrderSuccess(true);
      clearCart();
    } catch (error: any) {
      alert("Hubo un problema al procesar tu pedido.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-500 relative">
      
      <header className="flex items-center justify-between p-4 md:px-8 border-b border-white/5 bg-[#050505]/95 backdrop-blur-xl sticky top-0 z-[100]">
        <div className="flex-1 flex justify-start">
          <Link href="/" className="flex items-center gap-3 group">
            <img src="/logo.jpg" alt="Logo Kitson Kit" className="w-10 h-10 rounded-full border border-white/10" />
            <span className="text-2xl font-black text-white hidden xl:block">Kitson <span className="text-orange-500">Kit</span></span>
          </Link>
        </div>
        <div className="flex-grow flex justify-center hidden lg:flex">
          <nav className="flex gap-8 font-medium text-sm text-gray-400">
            <Link href="/" className="hover:text-white transition">Inicio</Link>
            <Link href="/#catalogo" className="hover:text-white transition">Catálogo</Link>
            <Link href="/tienda-diaria" className="hover:text-white transition">Tienda Fortnite</Link>
          </nav>
        </div>
        <div className="flex-1 flex items-center justify-end gap-4">
          <CurrencySelector />
          {session && (
            <div className="bg-white/5 py-1.5 px-3 rounded-full border border-white/10 flex items-center gap-2 text-sm font-bold">
              <Wallet size={16} className="text-orange-500"/> ${balance.toFixed(2)}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        {orderSuccess ? (
          <div className="text-center py-24 bg-green-500/5 border border-green-500/20 rounded-3xl max-w-2xl mx-auto">
            <CheckCircle2 size={80} className="text-green-500 mx-auto mb-6" />
            <h2 className="text-3xl font-black mb-4">¡Pedido en Revisión!</h2>
            <p className="text-gray-400 mb-8">Recibimos tu comprobante. Nuestro equipo validará los datos para enviarte los cosméticos.</p>
            <Link href="/mis-pedidos" className="bg-orange-500 text-black px-8 py-3 rounded-full font-black shadow-lg">Ver mis pedidos</Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-10">
            {/* IZQUIERDA: RESUMEN Y CONFIGURACIÓN */}
            <div className="flex-1 space-y-6">
              <div className="bg-[#0A0A0A] p-6 rounded-3xl border border-white/5">
                <h3 className="text-xl font-black mb-4 flex items-center gap-2"><Gamepad2 className="text-orange-500"/> 1. Cuenta Destino</h3>
                <input 
                  type="text" placeholder="ID de Epic Games o GamerTag"
                  value={gamerId} onChange={(e) => setGamerId(e.target.value)}
                  className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              <div className="bg-[#0A0A0A] p-6 rounded-3xl border border-white/5">
                <h3 className="text-xl font-black mb-4">2. Tu Carrito</h3>
                {cart.length === 0 ? (
                  <p className="text-gray-500 font-medium text-sm">No hay artículos guardados.</p>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 bg-[#111] p-3 rounded-xl border border-white/5">
                        <div className="flex-1"><h4 className="font-bold text-sm">{item.name} <span className="text-gray-500">x{item.quantity}</span></h4></div>
                        <p className="font-black">${(item.price * item.quantity).toFixed(2)} USD</p>
                        <button onClick={() => removeFromCart(item.id)} className="text-red-500/50 hover:text-red-500 p-2"><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* DERECHA: FLUJO FINAL O LOGIN PANEL */}
            <div className="w-full lg:w-[450px]">
              {!session ? (
                /* =======================================================
                   NUEVO: PANEL DE ACCESO PREMIUM (EMAIL, GOOGLE, DISCORD)
                   ======================================================= */
                <div className="bg-[#0A0A0A] border border-white/5 p-8 rounded-3xl shadow-2xl">
                  <h2 className="text-2xl font-black mb-2 text-center">Únete a la Squad</h2>
                  <p className="text-sm text-gray-500 text-center mb-6">Regístrate o ingresa para guardar tus datos y procesar el pago.</p>
                  
                  {/* Selector de pestañas */}
                  <div className="flex gap-2 mb-6 bg-[#111] p-1.5 rounded-xl border border-white/5">
                    <button onClick={() => setAuthMode('login')} className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${authTab === 'login' ? 'bg-white/5 border border-white/10 text-white' : 'text-gray-500'}`}>Iniciar Sesión</button>
                    <button onClick={() => setAuthMode('register')} className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${authTab === 'register' ? 'bg-white/5 border border-white/10 text-white' : 'text-gray-500'}`}>Crear Cuenta</button>
                  </div>

                  {/* Formulario Tradicional */}
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

                  {/* Botones de Redes Sociales */}
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => signIn('google')} className="bg-white text-black py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors">
                      <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85