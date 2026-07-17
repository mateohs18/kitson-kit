import type { Metadata } from "next";
import { Baloo_2, Work_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "../components/AuthProvider";

const baloo = Baloo_2({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
});

const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-mono-kk",
});

export const metadata: Metadata = {
  // 1. Añadimos el dominio base para que Next.js entienda las rutas
  metadataBase: new URL("https://kitson-kit.store"),
  
  title: {
    default: "Kitson Kit | El Siguiente Nivel Para Tu Cuenta",
    template: "%s | Kitson Kit",
  },
  description: "Adquiere cosméticos exclusivos, recargas de pavos y suscripciones de forma automatizada, segura y 100% legal.",
  keywords: ["fortnite", "pavos", "recargas", "skins", "kitson kit", "billetera gamer"],
  authors: [{ name: "Kitson Kit" }],
  
  openGraph: {
    title: "Kitson Kit — Sube de Nivel Al Instante",
    description: "Recargas automáticas y skins exclusivas en menos de 5 minutos. Operaciones blindadas y sin riesgo de ban.",
    url: "https://kitson-kit.store",
    siteName: "Kitson Kit",
    images: [
      {
        url: "https://kitson-kit.store/logo.jpg", 
        width: 1200,
        height: 630,
        alt: "Kitson Kit e-Commerce",
      },
    ],
    locale: "es_ES",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Kitson Kit | Billetera y Recargas Gamer",
    description: "Adquiere tus cosméticos de Fortnite de forma automatizada y segura.",
    images: ["https://kitson-kit.store/logo.jpg"], 
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className={`${baloo.variable} ${workSans.variable} ${plexMono.variable} antialiased bg-[#14110C] font-body`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}