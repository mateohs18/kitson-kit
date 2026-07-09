import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "../components/AuthProvider"; // Ajusta la ruta de tu AuthProvider si es distinta

export const metadata: Metadata = {
  title: "Kitson Kit | El Siguiente Nivel Para Tu Cuenta",
  description: "Adquiere cosméticos exclusivos, recargas de pavos y suscripciones de forma automatizada, segura y 100% legal.",
  keywords: ["fortnite", "pavos", "recargas", "skins", "kitson kit", "billetera gamer"],
  authors: [{ name: "Kitson Kit" }],
  
  // METADATOS PARA DISCORD, WHATSAPP Y FACEBOOK (OpenGraph)
  openGraph: {
    title: "Kitson Kit — Sube de Nivel Al Instante",
    description: "Recargas automáticas y skins exclusivas en menos de 5 minutos. Operaciones blindadas y sin riesgo de ban.",
    url: "https://kitson-kit.up.railway.app",
    siteName: "Kitson Kit",
    images: [
      {
        url: "/logo.jpg", // Aquí Next.js tomará tu logo automáticamente para la tarjeta de previsualización
        width: 1200,
        height: 630,
        alt: "Kitson Kit e-Commerce",
      },
    ],
    locale: "es_ES",
    type: "website",
  },

  // METADATOS PARA TWITTER / X
  twitter: {
    card: "summary_large_image",
    title: "Kitson Kit | Billetera y Recargas Gamer",
    description: "Adquiere tus cosméticos de Fortnite de forma automatizada y segura.",
    images: ["/logo.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className="antialiased bg-[#050505]">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}