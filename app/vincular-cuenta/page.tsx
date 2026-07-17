"use client";

import { useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { Gamepad2, ShieldCheck, Menu, X, ShoppingCart, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import CurrencySelector from '../../components/CurrencySelector';

function formatoRestante(ms: number) {
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h ${m}m`;
}

export default function VincularCuenta() {
  const { data: session } = useSession();
  const totalItemsCount = useCartStore((s) => s.totalItems());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [epicId, setEpicId] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [perfil, setPerfil] = useState<{ epicId: string; friendRequestedAt: string | null } | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (session?.user?.email) fetchPerfil();
  }, [session]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  async function fetchPerfil() {
    const res = await fetch('/api/mi-perfil');
    if (res.ok) {
      const data = await res.json();
      setPerfil(data);
      setEpicId(data.epicId || '');
    }
  }

  async function enviarSolicitud() {
    if (!session) return signIn();
    const trimmed = epicId.trim();
    if (trimmed.length < 3 || /\s/.test(trimmed)) return alert('Ingresá un nombre válido (sin espacios, mínimo 3 caracteres).');
    
    setEnviando(true);

    try {
      // ==========================================
      // PASO 1: Conectar con el bot para que envíe la solicitud
      // ==========================================
      // ⚠️ CAMBIA 'http://localhost:3001' POR TU LINK DE NGROK SI TU WEB ESTÁ EN LÍNEA
      const botRes = await fetch('http://localhost:3001/api/bot/agregar-amigo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ epicId: trimmed }),
      });
      
      const botData = await botRes.json();

      if (!botRes.ok) {
        // Si el bot falló (ej. letras raras o no existe), mostramos el error del bot
        alert('❌ ' + botData.error);
        setEnviando(false);
        return;
      }

      // ==========================================
      // PASO 2: Si el bot tuvo éxito, lo guardamos en tu base de datos web
      // ==========================================
      const res = await fetch('/api/guardar-epic-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ epicId: trimmed }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setEnviado(true);
        fetchPerfil();
        alert('✅ ' + botData.message); // Muestra el mensaje de éxito del bot
      } else {
        alert('❌ Error al guardar en tu web: ' + data.error);
      }
      
    } catch (error) {
      console.error(error);
      alert('❌ No se pudo conectar con el bot. Verifica que esté encendido.');
    }
    
    setEnviando(false);
  }

  let estado: { color: string; icon: React.ReactNode; texto: string } | null = null;
  if (perfil?.epicId) {
    if (!perfil.friendRequestedAt) {
      estado = { color: '#EF4444', icon: <AlertTriangle size={16} />, texto: 'Esperando que te agreguemos como amigo en Epic Games.' };
    } else {
      const elapsed = now - new Date(perfil.friendRequestedAt).getTime();
      const remaining = 48 * 60 * 60 * 1000 - elapsed;
      estado = remaining > 0
        ? { color: '#E3A23D', icon: <Clock size={16} />, texto: `Faltan ${formatoRestante(remaining)} para poder recibir regalos.` }
        : { color: '#7BC77E', icon: <CheckCircle2 size={16} />, texto: '¡Listo! Ya podés comprar vía regalo.' };
    }
  }

  return (
    <div className="min-h-screen bg-[#14110C] text-[#F5F1E6] font-body selection:bg-[#E3A23D] selection:text-[#0A0806]">
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
          <Link href="/vincular-cuenta" className="opacity-100 underline underline-offset-4 transition">Vincular Cuenta</Link>
          <Link href="/mi-cuenta" className="hover:opacity-70 transition">Mi Cuenta</Link>
        </nav>

        <div className="flex-1 flex items-center justify-end gap-3">
          <div className="hidden sm:block"><CurrencySelector /></div>
          <Link href="/carrito" className="flex items-center gap-2 bg-[#0A0806] text-[#E3A23D] py-2 px-4 rounded-lg font-bold hover:opacity-90 transition">
            <ShoppingCart size={18} />
            <span className="text-xs font-black">{totalItemsCount}</span>
          </Link>
          {!session && (
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
          <Link href="/vincular-cuenta" onClick={() => setIsMobileMenuOpen(false)} className="font-display text-xl font-bold text-[#F5F1E6] border-b border-white/10 pb-4">Vincular Cuenta</Link>
          <Link href="/mi-cuenta" onClick={() => setIsMobileMenuOpen(false)} className="font-display text-xl font-bold text-[#F5F1E6] border-b border-white/10 pb-4">Mi Cuenta</Link>
          <div className="pt-2"><CurrencySelector /></div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-6 py-16 md:py-20 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
        <div>
          <span className="inline-flex items-center gap-2 bg-[#4A93D6] text-[#0C2438] font-bold text-xs px-4 py-2 rounded-lg border-2 border-[#0A0806] mb-6">
            <span className="flex h-2 w-2 rounded-full bg-[#0C2438] animate-pulse"></span>
            SISTEMA DE ENTREGA POR REGALO
          </span>
          <h1 className="font-display font-extrabold text-4xl md:text-5xl leading-[1.05] mb-6">
            Vinculá tu<br/><span className="text-[#E3A23D]">cuenta Epic.</span>
          </h1>
          <p className="text-[#9A9384] text-base md:text-lg mb-10 max-w-md">
            Agregá tu cuenta para poder recibir cosméticos exclusivos vía regalo, de forma segura y sin riesgo de ban.
          </p>

          <div className="space-y-4">
            {[
              { n: '1', title: 'Solicitud directa', desc: 'Cargás tu nombre y le avisamos a nuestro equipo al instante para que te agregue.' },
              { n: '2', title: 'Espera de 48h', desc: 'Por políticas de Epic Games, debemos ser amigos 48 horas antes de poder enviarte regalos.' },
              { n: '3', title: '¡Todo listo!', desc: 'Pasado ese tiempo, cualquier compra vía regalo que hagas se entrega en minutos.' },
            ].map((step) => (
              <div key={step.n} className="kk-panel rounded-2xl p-5 flex items-start gap-4">
                <div className="w-11 h-11 shrink-0 rounded-xl bg-[#E3A23D] text-[#0A0806] flex items-center justify-center font-display font-bold text-lg border-2 border-[#0A0806]">{step.n}</div>
                <div>
                  <h3 className="font-bold text-[#F5F1E6] mb-1">{step.title}</h3>
                  <p className="text-sm text-[#9A9384] leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -right-2 -bottom-2 w-full h-full bg-[#4A93D6] rounded-3xl border-[3px] border-[#0A0806]"></div>
          <div className="relative kk-panel rounded-3xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display font-bold text-xl">Vincular cuenta</h2>
                <p className="text-xs text-[#9A9384]">Registrá tu ID para poder recibir regalos</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#14110C] border-2 border-[#0A0806] flex items-center justify-center shrink-0">
                <Gamepad2 size={22} className="text-[#E3A23D]" />
              </div>
            </div>

            {enviado ? (
              <div className="text-center py-8">
                <CheckCircle2 size={40} className="mx-auto text-[#7BC77E] mb-4" />
                <p className="font-bold text-[#7BC77E] mb-2">¡Solicitud registrada!</p>
                <p className="text-sm text-[#9A9384]">Le avisamos a nuestro equipo. En cuanto te agreguen, arranca el contador de 48hs.</p>
              </div>
            ) : (
              <>
                <label className="block text-xs font-bold text-[#9A9384] uppercase tracking-widest mb-2">Tu nombre de Epic Games</label>
                <div className="relative mb-5">
                  <Gamepad2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A9384]" />
                  <input
                    type="text" value={epicId} onChange={(e) => setEpicId(e.target.value)}
                    placeholder="Ej: Ninja, Bugha..."
                    className="w-full bg-[#14110C] border-2 border-[#0A0806] rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-[#E3A23D]"
                  />
                </div>

                <div className="flex items-start gap-3 bg-[#7BC77E]/10 border border-[#7BC77E]/30 rounded-xl p-4 mb-6">
                  <ShieldCheck size={18} className="text-[#7BC77E] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-[#F5F1E6] mb-0.5">Privacidad garantizada</p>
                    <p className="text-xs text-[#9A9384] leading-relaxed">Solo usamos tu nombre para enviarte la solicitud de amistad. Nunca te vamos a pedir tu contraseña.</p>
                  </div>
                </div>

                <button
                  onClick={enviarSolicitud} disabled={enviando}
                  className="w-full bg-[#E3A23D] hover:bg-[#f0b458] disabled:opacity-40 text-[#0A0806] py-4 rounded-xl font-display font-bold text-base border-[3px] border-[#0A0806] transition-transform hover:-translate-y-0.5"
                >
                  {enviando ? 'Enviando...' : !session ? 'Iniciar sesión para continuar' : 'Enviar solicitud'}
                </button>
              </>
            )}

            {estado && (
              <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold mt-5" style={{ backgroundColor: `${estado.color}18`, color: estado.color }}>
                {estado.icon}
                <span>{estado.texto}</span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
