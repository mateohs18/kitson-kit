import { supabaseAdmin } from '../lib/supabase-admin';
import { faqs } from '../lib/faqs';

// ============================================================================
// DATOS ESTRUCTURADOS (JSON-LD) PARA GOOGLE
//
// Componente de SERVIDOR (sin "use client"): se renderiza en el HTML inicial,
// que es lo que Google lee. Genera dos bloques:
//
//  1. OnlineStore con AggregateRating calculado desde tus reseñas REALES en
//     Supabase -> habilita las estrellitas en los resultados de búsqueda.
//  2. FAQPage con tus preguntas frecuentes -> Google puede mostrar tus
//     respuestas desplegables directamente en el resultado.
//
// Para una tienda nueva, salir en Google con estrellas y FAQ visibles es de
// las señales de confianza más fuertes que existen.
// ============================================================================

let ratingCache: { value: object; fetchedAt: number } | null = null;

export default async function StructuredData() {
  try {
    return await generarJsonLd();
  } catch (e) {
    // Ante cualquier problema (env faltante, DB caída), el sitio carga igual sin JSON-LD
    console.error('StructuredData falló (no crítico):', e);
    return null;
  }
}

async function generarJsonLd() {
  // Rating real desde la base — cacheado 10 min para no consultar en cada visita.
  // Si algo falla, simplemente no lo incluimos.
  let aggregateRating: object | null = ratingCache && Date.now() - ratingCache.fetchedAt < 10 * 60 * 1000
    ? ratingCache.value
    : null;
  if (!aggregateRating) {
    try {
      const { data: reviews } = await supabaseAdmin.from('reviews').select('rating');
      if (reviews && reviews.length > 0) {
        const avg = reviews.reduce((acc, r) => acc + Number(r.rating || 0), 0) / reviews.length;
        aggregateRating = {
          '@type': 'AggregateRating',
          ratingValue: Number(avg.toFixed(1)),
          reviewCount: reviews.length,
          bestRating: 5,
          worstRating: 1,
        };
        ratingCache = { value: aggregateRating, fetchedAt: Date.now() };
      }
    } catch {
      // sin rating, pero el resto del JSON-LD sale igual
    }
  }

  const tienda = {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    name: 'Kitson Kit',
    url: 'https://kitson-kit.store',
    logo: 'https://kitson-kit.store/logo.jpg',
    image: 'https://kitson-kit.store/logo.jpg',
    description:
      'Tienda de recargas de pavos, cosméticos y suscripciones de Fortnite con entrega automatizada. Métodos de pago locales para México, Colombia, Perú y el resto del mundo.',
    priceRange: '$',
    paymentAccepted: ['Binance', 'Yape', 'Nequi', 'Transferencia Bancaria', 'OXXO'],
    areaServed: ['MX', 'CO', 'PE', 'AR', 'US'],
    ...(aggregateRating ? { aggregateRating } : {}),
  };

  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(tienda) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage) }}
      />
    </>
  );
}
