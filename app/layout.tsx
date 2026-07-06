import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./Providers";

export const metadata: Metadata = {
  title: "Kitson Kit | Tienda de Recargas",
  description: "Consigue tus recargas al mejor precio. Entrega rápida y segura.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased bg-gray-900 text-white">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}