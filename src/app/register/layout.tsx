import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pendaftaran Anggota — ADORA Basketball Club",
  description: "Daftarkan diri Anda atau anak Anda menjadi bagian dari ADORA Basketball Club. Proses mudah, cepat, dan 100% online.",
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
