"use client";

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '../../lib/supabase';
import { ChevronLeft, Mail, Lock, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return setError('Completá todos los campos.');
    setError('');
    setIsLoading(true);

    try {
      if (authTab === 'register') {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        setAuthTab('login');
        setError('¡Cuenta creada! Ahora iniciá sesión.');
      } else {
        const res = await signIn('credentials', { redirect: false, email, password });
        if (res?.error) setError('Credenciales incorrectas. Verificá tus datos.');
        else window.location.href = callbackUrl;
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#14110C] text-[#F5F1E6] font-body flex flex-col">
      <header className="p-6 md:px-10 border-b-4 border-[#0A0806] bg-[#E3A23D]">
        <Link href="/" className="flex items-center gap-2 text-[#0A0806] hover:opacity-70 transition-colors w-fit font-bold text-sm">
          <ChevronLeft size={20} /> Volver a la tienda
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="kk-panel p-8 rounded-3xl max-w-md w-full">
          <div className="w-16 h-16 rounded-full border-[3px] border-[#0A0806] bg-[#4A93D6] mx-auto mb-6 overflow-hidden flex items-center justify-center relative">
            <div className="absolute inset-0 kk-dots opacity-15"></div>
            <Image src="/logo.jpg" alt="Logo Kitson Kit" width={60} height={60} className="w-4/5 h-4/5 object-contain rounded-full relative z-[1]" />
          </div>
          <h2 className="font-display text-2xl font-bold mb-2 text-center">Únete a la Squad</h2>
          <p className="text-sm text-[#9A9384] text-center mb-6">Iniciá sesión para comprar, ver tu billetera y tus pedidos.</p>

          <div className="flex gap-2 mb-6 bg-[#14110C] p-1.5 rounded-xl border-2 border-[#0A0806]">
            <button onClick={() => { setAuthTab('login'); setError(''); }} className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${authTab === 'login' ? 'bg-[#E3A23D] text-[#0A0806]' : 'text-[#9A9384]'}`}>Iniciar Sesión</button>
            <button onClick={() => { setAuthTab('register'); setError(''); }} className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${authTab === 'register' ? 'bg-[#E3A23D] text-[#0A0806]' : 'text-[#9A9384]'}`}>Crear Cuenta</button>
          </div>

          {error && <p className="text-sm text-center mb-4 text-[#E3A23D] font-medium">{error}</p>}

          <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A9384]" />
              <input type="email" placeholder="Tu correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#14110C] border-2 border-[#0A0806] rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-[#E3A23D] transition-colors" />
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A9384]" />
              <input type="password" placeholder="Tu contraseña" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#14110C] border-2 border-[#0A0806] rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-[#E3A23D] transition-colors" />
            </div>
            <button type="submit" disabled={isLoading} className="w-full bg-[#E3A23D] text-[#0A0806] py-3 rounded-xl font-display font-bold text-sm flex items-center justify-center gap-2 border-[3px] border-[#0A0806]">
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : authTab === 'login' ? "Ingresar" : "Completar Registro"}
            </button>
          </form>

          <div className="relative flex py-2 items-center mb-6">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink mx-4 text-[#9A9384] text-xs font-bold uppercase tracking-wider">O ingresa con</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => signIn('google', { callbackUrl })} className="bg-[#F5F1E6] text-[#0A0806] py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-colors border-2 border-[#0A0806]">
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
            <button onClick={() => signIn('discord', { callbackUrl })} className="bg-[#5865F2] hover:bg-[#4752C4] text-white py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-colors border-2 border-[#0A0806]">
              Discord
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
