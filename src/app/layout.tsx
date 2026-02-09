import type { Metadata } from "next";
import type { Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeScript from "@/styles/theme/ThemeScript";
import GravityStarsBackground from "@/components/background/GravityStarsBackground";
import { I18nProvider } from "@/i18n/i18n";
import ViewportLock from "@/app/ViewportLock";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CriptoCard - Tarjeta virtual",
  description: "Criptocard es una experiencia de tarjeta cripto dentro de Telegram para recargar y gastar en todo el mundo.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
        <meta name="screen-orientation" content="portrait" />
        <meta name="x5-orientation" content="portrait" />
        <meta name="x5-fullscreen" content="true" />
        <meta name="x5-page-mode" content="app" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ViewportLock />
        <GravityStarsBackground />
        <div className="relative z-10">
          <I18nProvider>{children}</I18nProvider>
        </div>
      </body>
    </html>
  );
}
