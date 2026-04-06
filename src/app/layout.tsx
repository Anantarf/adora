import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Bebas_Neue } from "next/font/google";
import "./globals.css";

// Body Font Base
const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

// Title Heading Font
const bebasNeue = Bebas_Neue({
  variable: "--font-heading",
  weight: "400",
  subsets: ["latin"],
});

import { Providers } from "@/components/providers/query-provider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "ADORA Basketball Club | Akademi Basket Profesional Indonesia",
  description:
    "ADORA Basketball Club — Membentuk generasi atlet basket berkarakter, berprestasi, dan siap bersaing di tingkat nasional. Program KU-10, KU-15, KU-18.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable} ${bebasNeue.variable} dark scroll-smooth`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className={`antialiased min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground`}>
        <Providers>
          {children}
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
