"use client";

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  // Aquí está la corrección: usamos las etiquetas <SessionProvider>
  return <SessionProvider>{children}</SessionProvider>;
}