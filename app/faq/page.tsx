"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession, signIn } from 'next-auth/react';
import { useCartStore } from '../../store/cartStore';
import CurrencySelector from '../../components/CurrencySelector';
import { faqs } from '../../lib/faqs';
import { ChevronDown, ChevronLeft, Menu, X, ShoppingCart, MessageCircle } from 'lucide-react';

export default function FaqPage() {
  const { data: session } = useSession();
  const totalItemsCount = useCartStore((s) => s.totalItems());
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
          <Link href="/faq" className="opacity-100 underline underline-offset-4 transition">Preguntas Frecuentes</Link>
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
          <div className="pt-2"><CurrencySelector /></div>
        </div>
      )}

      <main className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="flex items-center gap-1 text-[#9A9384] hover:text-[#E3A23D] text-sm font-bold mb-8 w-fit">
          <ChevronLeft size={16} /> Volver al inicio
        </Link>

        <h1 className="font-display font-bold text-4xl mb-3">Preguntas Frecuentes</h1>
        <p className="text-[#9A9384] mb-12">Todo lo que necesitás saber antes de comprar. Si no encontrás tu respuesta acá, escribinos.</p>

        <div className="space-y-4 mb-14">
          {faqs.map((faq, idx) => (
            <div key={idx} className="kk-panel rounded-2xl overflow-hidden">
              <button onClick={() => setOpenFaq(openFaq === idx ? null : idx)} className="w-full flex items-center justify-between p-6 text-left focus:outline-none hover:bg-white/5 transition-colors">
                <span className="font-bold text-lg text-[#F5F1E6] pr-4">{faq.q}</span>
                <ChevronDown size={22} className={`shrink-0 text-[#E3A23D] transition-transform duration-300 ${openFaq === idx ? 'rotate-180' : ''}`} />
              </button>
              <div className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${openFaq === idx ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                <p className="text-[#9A9384] leading-relaxed">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="kk-panel rounded-2xl p-8 text-center">
          <MessageCircle size={32} className="mx-auto text-[#25D366] mb-4" />
          <h2 className="font-display font-bold text-xl mb-2">¿No encontraste tu respuesta?</h2>
          <p className="text-[#9A9384] text-sm mb-6">Escribinos directo, te responde una persona, no un bot.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="https://wa.me/573156098437" target="_blank" rel="noopener noreferrer" className="bg-[#25D366] hover:opacity-90 text-white px-6 py-3 rounded-xl font-bold text-sm transition-opacity">WhatsApp</a>
            <a href="https://discord.gg/gPumDeNvp6" target="_blank" rel="noopener noreferrer" className="bg-[#5865F2] hover:opacity-90 text-white px-6 py-3 rounded-xl font-bold text-sm transition-opacity">Discord</a>
          </div>
        </div>
      </main>
    </div>
  );
}
