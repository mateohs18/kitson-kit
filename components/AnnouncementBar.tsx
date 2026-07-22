'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';

// ============================================================================
// BARRA DE ANUNCIOS SUPERIOR
// El texto se edita desde el panel de admin (sección "Barra de anuncios") y
// aparece en todo el sitio. Si el admin la deja vacía, no se muestra nada.
// El visitante puede cerrarla; si después cambiás el texto, vuelve a aparecer.
// ============================================================================

export default function AnnouncementBar() {
  const [banner, setBanner] = useState<{ texto: string; link: string } | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetch('/api/banner')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.texto) return;
        setBanner(d);
        try {
          // Solo la ocultamos si cerró EXACTAMENTE este mismo anuncio
          const cerrado = localStorage.getItem('kitson_banner_cerrado');
          setVisible(cerrado !== d.texto);
        } catch {
          setVisible(true);
        }
      })
      .catch(() => {});
  }, []);

  if (!banner || !visible) return null;

  const contenido = (
    <span className="font-bold text-xs md:text-sm text-[#0A0806] tracking-wide">
      {banner.texto}
      {banner.link && <span className="underline underline-offset-2 ml-1.5">Ver más →</span>}
    </span>
  );

  return (
    <div className="relative bg-[#E3A23D] border-b-4 border-[#0A0806] px-10 py-2.5 text-center">
      {banner.link ? (
        <Link href={banner.link} className="hover:opacity-80 transition">{contenido}</Link>
      ) : (
        contenido
      )}
      <button
        aria-label="Cerrar anuncio"
        onClick={() => {
          setVisible(false);
          try { localStorage.setItem('kitson_banner_cerrado', banner.texto); } catch {}
        }}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0A0806] hover:opacity-60 transition"
      >
        <X size={16} strokeWidth={3} />
      </button>
    </div>
  );
}
