import type { Metadata } from "next";
import { Poppins, Montserrat } from "next/font/google";
import "./globals.css";

// Body Font Base
const poppins = Poppins({
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

// Title Heading Font
const montserrat = Montserrat({
  variable: "--font-heading",
  weight: ["600", "700", "800", "900"],
  subsets: ["latin"],
});

import { Providers } from "@/components/providers/query-provider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  metadataBase: new URL("https://adorabbc.com"),
  title: "ADORA Basketball Club — Official Page",
  description: "ADORA Basketball Club — Membentuk generasi pemain basket berkarakter, berprestasi, dan siap bersaing di tingkat nasional. Program KU-8 hingga KU-16 di Depok.",
  keywords: ["klub basket depok", "akademi basket anak", "latihan basket depok", "sekolah basket", "adora bbc", "kejurkot depok", "pembinaan basket usia dini"],
  alternates: {
    canonical: "/",
  },
  authors: [{ name: "ADORA Basketball Club" }],
  openGraph: {
    title: "ADORA Basketball Club",
    description: "Akademi basket profesional di Depok untuk usia 7-18 tahun. Membentuk karakter dan prestasi melalui basket.",
    url: "https://adorabbc.com",
    siteName: "ADORA Basketball",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ADORA Basketball Club",
    description: "Akademi basket profesional di Depok untuk usia 7-18 tahun.",
    creator: "@adorabbc",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo-new.svg", type: "image/svg+xml", sizes: "any" },
    ],
    apple: [{ url: "/logo-new.svg", sizes: "any", type: "image/svg+xml" }],
    shortcut: "/logo-new.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${poppins.variable} ${montserrat.variable} dark scroll-smooth`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className={`antialiased min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground`}>
        <Providers>
          {children}
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
