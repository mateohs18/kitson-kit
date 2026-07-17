"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body style={{ background: '#14110C', color: '#F5F1E6', fontFamily: 'sans-serif' }}>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '16px' }}>Algo salió mal</h1>
          <p style={{ color: '#9A9384', marginBottom: '32px', maxWidth: '400px' }}>
            Tuvimos un problema al cargar el sitio. Intentá de nuevo en unos segundos.
          </p>
          <button
            onClick={() => reset()}
            style={{ background: '#E3A23D', color: '#0A0806', padding: '14px 28px', borderRadius: '12px', fontWeight: 700, border: '3px solid #0A0806', cursor: 'pointer' }}
          >
            Intentar de nuevo
          </button>
        </div>
      </body>
    </html>
  );
}
