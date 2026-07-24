import Link from 'next/link';
import { Shield, Database, Share2, UserCheck, Mail, ChevronLeft } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description: 'Qué datos recopila Kitson Kit, para qué los usa y cuáles son tus derechos.',
};

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-[#14110C] text-[#F5F1E6] font-body selection:bg-[#E3A23D] selection:text-[#0A0806]">
      <header className="p-6 md:px-10 border-b-4 border-[#0A0806] bg-[#E3A23D] sticky top-0 z-[100]">
        <Link href="/" className="flex items-center gap-2 text-[#0A0806] hover:opacity-70 transition-colors w-fit font-bold text-sm">
          <ChevronLeft size={20} /> Volver a la tienda
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Política de <span className="text-[#E3A23D]">Privacidad</span></h1>
          <p className="text-[#9A9384] text-lg">Última actualización: julio 2026</p>
        </div>

        <div className="space-y-12">
          <section className="kk-panel p-8 rounded-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-[#E3A23D]/10 p-3 rounded-xl text-[#E3A23D]"><Database size={24} /></div>
              <h2 className="font-display text-2xl font-bold">1. Qué datos recopilamos</h2>
            </div>
            <p className="text-[#9A9384] leading-relaxed mb-4">
              Para poder entregarte tus compras necesitamos algunos datos, y solo pedimos los mínimos indispensables:
            </p>
            <ul className="text-[#9A9384] leading-relaxed space-y-2 list-disc pl-5">
              <li><strong className="text-[#D9D4C7]">Email y nombre</strong>: los recibimos cuando iniciás sesión con Google, Discord o correo y contraseña. Los usamos para identificar tus pedidos y avisarte cuando se entregan.</li>
              <li><strong className="text-[#D9D4C7]">Tu nombre de usuario público de Epic Games</strong>: es lo único que necesitamos para enviarte regalos dentro del juego. <strong className="text-[#D9D4C7]">Nunca te pedimos tu contraseña ni acceso a tu cuenta.</strong></li>
              <li><strong className="text-[#D9D4C7]">Comprobantes de pago</strong>: si pagás por transferencia, guardamos la imagen del comprobante que subís, únicamente para verificar tu pago.</li>
              <li><strong className="text-[#D9D4C7]">Reseñas y fotos</strong>: si dejás una reseña, se publica con el nombre que elijas mostrar.</li>
            </ul>
          </section>

          <section className="kk-panel p-8 rounded-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-[#4A93D6]/10 p-3 rounded-xl text-[#4A93D6]"><Shield size={24} /></div>
              <h2 className="font-display text-2xl font-bold">2. Para qué los usamos</h2>
            </div>
            <p className="text-[#9A9384] leading-relaxed mb-4">
              Usamos tus datos exclusivamente para operar la tienda: procesar y entregar tus pedidos, gestionar tu saldo, enviarte emails sobre el estado de tus compras (confirmación, entrega, y el aviso de las 48 horas de amistad) y darte soporte.
            </p>
            <p className="text-[#9A9384] leading-relaxed">
              <strong className="text-[#D9D4C7]">No vendemos, alquilamos ni compartimos tus datos con fines publicitarios.</strong> No te enviamos emails de marketing sin tu consentimiento: solo mensajes transaccionales sobre tus propios pedidos.
            </p>
          </section>

          <section className="kk-panel p-8 rounded-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-[#7BC77E]/10 p-3 rounded-xl text-[#7BC77E]"><Share2 size={24} /></div>
              <h2 className="font-display text-2xl font-bold">3. Con quién se comparten</h2>
            </div>
            <p className="text-[#9A9384] leading-relaxed mb-4">
              Para funcionar, el sitio se apoya en servicios de terceros que procesan datos en nuestro nombre:
            </p>
            <ul className="text-[#9A9384] leading-relaxed space-y-2 list-disc pl-5">
              <li><strong className="text-[#D9D4C7]">Supabase</strong>: base de datos donde se almacenan cuentas, pedidos y saldos.</li>
              <li><strong className="text-[#D9D4C7]">Brevo</strong>: plataforma con la que enviamos los emails transaccionales.</li>
              <li><strong className="text-[#D9D4C7]">Google y Discord</strong>: solo si elegís iniciar sesión con ellos; nos comparten tu email y nombre, nada más.</li>
            </ul>
            <p className="text-[#9A9384] leading-relaxed mt-4">
              Cada uno de estos proveedores tiene sus propias políticas de seguridad y privacidad, y solo accede a los datos necesarios para su función.
            </p>
          </section>

          <section className="kk-panel p-8 rounded-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-[#E3A23D]/10 p-3 rounded-xl text-[#E3A23D]"><UserCheck size={24} /></div>
              <h2 className="font-display text-2xl font-bold">4. Tus derechos</h2>
            </div>
            <p className="text-[#9A9384] leading-relaxed mb-4">
              Tus datos son tuyos. En cualquier momento podés pedirnos:
            </p>
            <ul className="text-[#9A9384] leading-relaxed space-y-2 list-disc pl-5">
              <li>Ver qué datos tenemos sobre vos.</li>
              <li>Corregir datos incorrectos (por ejemplo, tu Epic ID).</li>
              <li>Eliminar tu cuenta y tus datos personales. Los registros de pedidos ya completados pueden conservarse el tiempo mínimo necesario por razones contables y de prevención de fraude.</li>
            </ul>
          </section>

          <section className="kk-panel p-8 rounded-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-[#4A93D6]/10 p-3 rounded-xl text-[#4A93D6]"><Mail size={24} /></div>
              <h2 className="font-display text-2xl font-bold">5. Contacto</h2>
            </div>
            <p className="text-[#9A9384] leading-relaxed">
              Para cualquier consulta sobre tus datos, escribinos por Discord o WhatsApp — los mismos canales de soporte de la tienda. Te responde una persona, no un bot. También podés revisar nuestros <Link href="/terminos" className="text-[#E3A23D] hover:underline">Términos del Servicio</Link>.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
