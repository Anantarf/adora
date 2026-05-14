import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pendaftaran Basket Anak Depok | ADORA Basketball Club",
  description: "Daftarkan anak Anda ke ADORA Basketball Club untuk latihan basket di Depok. Proses pendaftaran mudah, cepat, dan 100% online.",
  alternates: {
    canonical: "https://adorabbc.com/register",
  },
  openGraph: {
    title: "Pendaftaran Basket Anak Depok | ADORA Basketball Club",
    description: "Daftarkan anak Anda ke ADORA Basketball Club untuk latihan basket di Depok. Proses pendaftaran mudah, cepat, dan 100% online.",
    url: "https://adorabbc.com/register",
    siteName: "ADORA Basketball",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pendaftaran Basket Anak Depok | ADORA Basketball Club",
    description: "Daftarkan anak Anda ke ADORA Basketball Club untuk latihan basket di Depok. Proses pendaftaran mudah, cepat, dan 100% online.",
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
