import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { MetaPixel } from "@/components/MetaPixel";
import { ThemeInit } from "@/components/ThemeInit";
import { EVENT } from "@/lib/config";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: `${EVENT.name} | Inscription`,
  description:
    "Inscrivez-vous à Sérénité 2026, le Salon de la Sécurité Globale — Exposants, Partenaires officiels et Visiteurs.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white">
        <ThemeInit />
        <MetaPixel />
        {children}
      </body>
    </html>
  );
}
