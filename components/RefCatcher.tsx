'use client';

import { useEffect } from 'react';

// Si alguien llega con un link de referido (kitson-kit.store/?ref=KIT-XXXXXX),
// guardamos el código para atribuirlo cuando haga su primera compra.
// Es invisible: no renderiza nada.
export default function RefCatcher() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref && /^KIT-[A-Z0-9]{4,10}$/i.test(ref.trim())) {
        localStorage.setItem('kitson_ref', ref.trim().toUpperCase());
      }
    } catch {
      // sin localStorage (modo incógnito estricto), no pasa nada
    }
  }, []);

  return null;
}
