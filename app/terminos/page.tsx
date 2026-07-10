import Link from 'next/link';
import { Shield, Clock, AlertTriangle, ChevronLeft } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Términos del Servicio',
  description: 'Términos del servicio y política de reembolsos de Kitson Kit.',
};

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-[#14110C] text-[#F5F1E6] font-body selection:bg-[#E3A23D] selection:text-[#0A0806]">
      <header className="p-6 md:px-10 border-b-4 border-[#0A0806] bg-[#E3A23D] sticky top-0 z-[100]">
        <Link href="/" className="flex items-center gap-2 text-[#0A0806] hover:opacity-70 transition-colors w-fit font-bold text-sm">
          <ChevronLeft size={20} /> Volver a la tienda
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Términos del <span className="text-[#E3A23D]">Servicio</span></h1>
          <p className="text-[#9A9384] text-lg">Última actualización: julio 2026</p>
        </div>

        <div className="space-y-12">
          <section className="kk-panel p-8 rounded-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-[#E3A23D]/10 p-3 rounded-xl text-[#E3A23D]"><Clock size={24} /></div>
              <h2 className="font-display text-2xl font-bold">1. Tiempos de entrega</h2>
            </div>
            <p className="text-[#9A9384] leading-relaxed mb-4">
              Todos los pedidos pagados con <strong className="text-[#D9D4C7]">Saldo Kitson</strong> se procesan de manera automatizada. Sin embargo, en ocasiones el envío de regalos dentro del juego puede demorar entre 1 y 15 minutos dependiendo de los servidores de Epic Games.
            </p>
            <p className="text-[#9A9384] leading-relaxed">
              Los pagos realizados mediante <strong className="text-[#D9D4C7]">Transferencia Manual</strong> están sujetos a verificación humana. El equipo revisará el comprobante subido a la plataforma y acreditará el saldo o enviará los artículos en un plazo máximo de 24 horas hábiles.
            </p>
          </section>

          <section className="kk-panel p-8 rounded-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-red-500/10 p-3 rounded-xl text-red-400"><AlertTriangle size={24} /></div>
              <h2 className="font-display text-2xl font-bold">2. Política de reembolsos</h2>
            </div>
            <p className="text-[#9A9384] leading-relaxed mb-4">
              Debido a la naturaleza de los bienes digitales (cosméticos, pases de batalla, recargas de monedas virtuales), <strong className="text-[#D9D4C7]">todas las ventas son definitivas</strong>. No ofrecemos reembolsos una vez que el artículo fue enviado a la cuenta de destino especificada.
            </p>
            <p className="text-[#9A9384] leading-relaxed">
              Solo se emitirán reembolsos (al método de pago original o como Saldo Kitson) si:
            </p>
            <ul className="list-disc list-inside text-[#9A9384] mt-4 space-y-2 ml-4">
              <li>El producto se agotó en la Tienda Diaria antes de que nuestro equipo pudiera procesar la transferencia manual.</li>
              <li>Ocurrió un error comprobable en nuestro sistema que impidió la entrega.</li>
            </ul>
          </section>

          <section className="kk-panel p-8 rounded-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-[#4A93D6]/10 p-3 rounded-xl text-[#4A93D6]"><Shield size={24} /></div>
              <h2 className="font-display text-2xl font-bold">3. Responsabilidad de la cuenta</h2>
            </div>
            <p className="text-[#9A9384] leading-relaxed mb-4">
              El cliente es responsable de proporcionar el <strong className="text-[#D9D4C7]">ID de Epic Games o GamerTag correcto</strong> al momento de finalizar la compra. Kitson Kit no se hace responsable por regalos enviados a cuentas equivocadas debido a errores tipográficos por parte del usuario.
            </p>
            <p className="text-[#9A9384] leading-relaxed">
              Operamos de forma externa e independiente a Epic Games Inc. Nos comprometemos a usar métodos de recarga 100% legales, garantizando que tu cuenta no sufrirá penalizaciones ni baneos por usar nuestros servicios.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
