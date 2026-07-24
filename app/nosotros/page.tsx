import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, Zap, Heart, ChevronLeft } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quiénes somos',
  description: 'Conocé la historia detrás de Kitson Kit y por qué miles de gamers confían en nosotros para sus compras en Fortnite.',
};

export default function NosotrosPage() {
  return (
    <div className="min-h-screen bg-[#14110C] text-[#F5F1E6] font-body selection:bg-[#E3A23D] selection:text-[#0A0806]">
      <header className="p-6 md:px-10 border-b-4 border-[#0A0806] bg-[#E3A23D] sticky top-0 z-[100]">
        <Link href="/" className="flex items-center gap-2 text-[#0A0806] hover:opacity-70 transition-colors w-fit font-bold text-sm">
          <ChevronLeft size={20} /> Volver a la tienda
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="text-center mb-14">
          <div className="w-20 h-20 rounded-full border-[3px] border-[#E3A23D] overflow-hidden mx-auto mb-6 bg-[#F5F1E6]">
            <Image src="/logo.jpg" alt="Kitson Kit" width={80} height={80} className="w-full h-full object-cover" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Quiénes <span className="text-[#E3A23D]">somos</span>
          </h1>
          <p className="text-[#9A9384] text-lg max-w-xl mx-auto">
            Una tienda hecha por gamers, para gamers de habla hispana en Fortnite.
          </p>
        </div>

        <div className="kk-panel p-8 rounded-3xl mb-8">
          <p className="text-[#D9D4C7] leading-relaxed mb-4">
            Kitson Kit nació de una idea simple: comprar pavos y cosméticos de Fortnite en Latinoamérica debería ser tan fácil y rápido como jugar una partida. Nada de esperas eternas, nada de procesos confusos, nada de arriesgar tu cuenta.
          </p>
          <p className="text-[#D9D4C7] leading-relaxed mb-4">
            Construimos un sistema de entrega automatizado que funciona las 24 horas, con métodos de pago pensados para México, Colombia, Perú y el resto de la región — Binance, Yape, Nequi, OXXO y transferencia bancaria, además de nuestra propia billetera con saldo.
          </p>
          <p className="text-[#D9D4C7] leading-relaxed">
            Detrás de cada pedido hay un equipo real que revisa, entrega y responde. Si alguna vez necesitás ayuda, no vas a hablar con un bot sin salida — vas a hablar con nosotros.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="kk-panel rounded-2xl p-6 text-center">
            <div className="bg-[#7BC77E]/10 p-3 rounded-xl text-[#7BC77E] w-fit mx-auto mb-4"><ShieldCheck size={24} /></div>
            <h3 className="font-display font-bold text-base mb-2">Seguridad primero</h3>
            <p className="text-[#9A9384] text-sm leading-relaxed">Nunca te pedimos tu contraseña de Epic Games. Solo tu nombre de usuario para enviarte el regalo dentro del juego.</p>
          </div>
          <div className="kk-panel rounded-2xl p-6 text-center">
            <div className="bg-[#E3A23D]/10 p-3 rounded-xl text-[#E3A23D] w-fit mx-auto mb-4"><Zap size={24} /></div>
            <h3 className="font-display font-bold text-base mb-2">Entrega automática</h3>
            <p className="text-[#9A9384] text-sm leading-relaxed">Bots propios que procesan y entregan tu compra sin esperar a que un humano esté disponible.</p>
          </div>
          <div className="kk-panel rounded-2xl p-6 text-center">
            <div className="bg-[#4A93D6]/10 p-3 rounded-xl text-[#4A93D6] w-fit mx-auto mb-4"><Heart size={24} /></div>
            <h3 className="font-display font-bold text-base mb-2">Soporte real</h3>
            <p className="text-[#9A9384] text-sm leading-relaxed">Discord y WhatsApp abiertos, con personas del otro lado — no un formulario que nadie contesta.</p>
          </div>
        </div>

        <div className="text-center mt-14">
          <p className="text-[#9A9384] mb-4">¿Dudas antes de tu primera compra?</p>
          <Link href="/faq" className="inline-block bg-[#1D1913] hover:bg-[#E3A23D] hover:text-[#0A0806] text-[#F5F1E6] px-8 py-3.5 rounded-xl font-display font-bold border-[3px] border-[#0A0806] transition-colors">
            Ver preguntas frecuentes →
          </Link>
        </div>
      </main>
    </div>
  );
}
