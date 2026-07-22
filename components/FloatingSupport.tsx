'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

// ============================================================================
// BOTONES FLOTANTES DE SOPORTE (WhatsApp / Discord)
// Los links se configuran desde el panel de admin. Si están vacíos, no se
// muestra nada. No aparecen en el panel de admin para no estorbar.
// ============================================================================

export default function FloatingSupport() {
  const pathname = usePathname();
  const [links, setLinks] = useState<{ whatsapp: string; discord: string } | null>(null);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    fetch('/api/soporte')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d && (d.whatsapp || d.discord)) setLinks(d); })
      .catch(() => {});
  }, []);

  if (!links || pathname?.startsWith('/admin')) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[150] flex flex-col items-end gap-3">
      {abierto && (
        <div className="flex flex-col gap-2.5 items-end">
          {links.whatsapp && (
            <a
              href={links.whatsapp} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2.5 bg-[#25D366] text-[#0A0806] pl-4 pr-5 py-3 rounded-2xl font-display font-bold text-sm border-[3px] border-[#0A0806] shadow-lg transition-transform hover:-translate-y-0.5"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.83 14.12c-.25.7-1.44 1.33-2 1.41-.53.08-1.2.11-1.94-.12-.45-.14-1.02-.33-1.76-.65-3.09-1.33-5.11-4.44-5.26-4.65-.15-.2-1.26-1.67-1.26-3.19 0-1.52.8-2.27 1.08-2.58.28-.31.62-.39.82-.39.21 0 .41 0 .59.01.19.01.44-.07.69.53.25.61.86 2.1.94 2.25.08.15.13.33.02.53-.1.2-.15.33-.31.51-.15.18-.32.4-.46.54-.15.15-.31.32-.13.62.18.31.79 1.31 1.7 2.12 1.17 1.04 2.16 1.37 2.46 1.52.31.15.49.13.67-.08.18-.2.77-.89.97-1.2.2-.31.41-.25.69-.15.28.1 1.79.84 2.09.99.31.15.51.23.59.36.07.13.07.72-.19 1.42z"/></svg>
              WhatsApp
            </a>
          )}
          {links.discord && (
            <a
              href={links.discord} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2.5 bg-[#5865F2] text-white pl-4 pr-5 py-3 rounded-2xl font-display font-bold text-sm border-[3px] border-[#0A0806] shadow-lg transition-transform hover:-translate-y-0.5"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden><path d="M20.32 4.37a19.8 19.8 0 0 0-4.89-1.52.07.07 0 0 0-.08.04c-.21.38-.44.87-.6 1.25a18.3 18.3 0 0 0-5.5 0 12.6 12.6 0 0 0-.61-1.25.08.08 0 0 0-.08-.04 19.74 19.74 0 0 0-4.88 1.52.07.07 0 0 0-.03.03C.53 9.05-.32 13.58.1 18.06a.08.08 0 0 0 .03.05 19.9 19.9 0 0 0 6 3.03.08.08 0 0 0 .08-.03c.46-.63.87-1.3 1.22-2a.08.08 0 0 0-.04-.1 13.1 13.1 0 0 1-1.87-.9.08.08 0 0 1-.01-.13c.13-.09.25-.19.37-.29a.07.07 0 0 1 .08-.01c3.93 1.8 8.18 1.8 12.06 0a.07.07 0 0 1 .08.01c.12.1.25.2.37.29a.08.08 0 0 1 0 .13c-.6.35-1.22.65-1.87.9a.08.08 0 0 0-.04.1c.36.7.77 1.37 1.22 2a.08.08 0 0 0 .08.03 19.84 19.84 0 0 0 6.01-3.03.08.08 0 0 0 .03-.05c.5-5.18-.84-9.67-3.55-13.66a.06.06 0 0 0-.03-.03zM8.02 15.33c-1.18 0-2.16-1.08-2.16-2.42 0-1.33.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.34-.96 2.42-2.16 2.42zm7.97 0c-1.18 0-2.16-1.08-2.16-2.42 0-1.33.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.34-.95 2.42-2.16 2.42z"/></svg>
              Discord
            </a>
          )}
        </div>
      )}
      <button
        onClick={() => setAbierto(!abierto)}
        aria-label="Soporte"
        className={`w-14 h-14 rounded-full border-[3px] border-[#0A0806] shadow-xl flex items-center justify-center transition-all hover:scale-105 ${abierto ? 'bg-[#1D1913] text-[#F5F1E6] rotate-45' : 'bg-[#E3A23D] text-[#0A0806]'}`}
      >
        {abierto ? (
          <span className="font-display font-black text-2xl leading-none">+</span>
        ) : (
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
        )}
      </button>
    </div>
  );
}
