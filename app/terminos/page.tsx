import Link from 'next/link';
import { Shield, Clock, AlertTriangle, ChevronLeft } from 'lucide-react';

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-500">
      <header className="p-6 md:px-10 border-b border-white/5 bg-[#050505]/95 backdrop-blur-xl sticky top-0 z-[100]">
        <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-orange-500 transition-colors w-fit font-bold text-sm">
          <ChevronLeft size={20} /> Volver a la tienda
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black mb-4">Términos del <span className="text-orange-500">Servicio</span></h1>
          <p className="text-gray-400 text-lg">Última actualización: Julio 2026</p>
        </div>

        <div className="space-y-12">
          <section className="bg-[#0A0A0A] p-8 rounded-3xl border border-white/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-orange-500/10 p-3 rounded-xl text-orange-500"><Clock size={24} /></div>
              <h2 className="text-2xl font-black">1. Tiempos de Entrega</h2>
            </div>
            <p className="text-gray-400 leading-relaxed mb-4">
              Todos los pedidos pagados con <strong>Saldo Kitson</strong> se procesan de manera automatizada. Sin embargo, en ocasiones el envío de regalos dentro del juego puede demorar entre 1 a 15 minutos dependiendo de los servidores de Epic Games.
            </p>
            <p className="text-gray-400 leading-relaxed">
              Los pagos realizados mediante <strong>Transferencia Manual</strong> están sujetos a verificación humana. El equipo revisará el comprobante subido a la plataforma y acreditará el saldo/enviará los artículos en un plazo máximo de 24 horas hábiles.
            </p>
          </section>

          <section className="bg-[#0A0A0A] p-8 rounded-3xl border border-white/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-red-500/10 p-3 rounded-xl text-red-500"><AlertTriangle size={24} /></div>
              <h2 className="text-2xl font-black">2. Política de Reembolsos</h2>
            </div>
            <p className="text-gray-400 leading-relaxed mb-4">
              Debido a la naturaleza de los bienes digitales (cosméticos, pases de batalla, recargas de monedas virtuales), <strong>todas las ventas son definitivas</strong>. No ofrecemos reembolsos una vez que el artículo ha sido enviado a la cuenta de destino especificada.
            </p>
            <p className="text-gray-400 leading-relaxed">
              Solo se emitirán reembolsos (al método de pago original o como Saldo Kitson) si:
            </p>
            <ul className="list-disc list-inside text-gray-400 mt-4 space-y-2 ml-4">
              <li>El producto se agotó en la Tienda Diaria antes de que nuestro equipo pudiera procesar la transferencia manual.</li>
              <li>Ocurrió un error comprobable en nuestro sistema que impidió la entrega.</li>
            </ul>
          </section>

          <section className="bg-[#0A0A0A] p-8 rounded-3xl border border-white/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-500/10 p-3 rounded-xl text-blue-500"><Shield size={24} /></div>
              <h2 className="text-2xl font-black">3. Responsabilidad de la Cuenta</h2>
            </div>
            <p className="text-gray-400 leading-relaxed mb-4">
              El cliente es absolutamente responsable de proporcionar el <strong>ID de Epic Games o GamerTag correcto</strong> al momento de finalizar la compra. Kitson Kit no se hace responsable por regalos enviados a cuentas equivocadas debido a errores tipográficos por parte del usuario.
            </p>
            <p className="text-gray-400 leading-relaxed">
              Operamos de forma externa e independiente a Epic Games Inc. Nos comprometemos a usar métodos de recarga 100% legales, garantizando que tu cuenta no sufrirá penalizaciones ni baneos por usar nuestros servicios.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}