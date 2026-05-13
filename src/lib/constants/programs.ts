/** Data murni programs tanpa JSX, bisa dipakai di Server/Client/API */
export type Program = {
  label: string;
  ages: string;
  /** Path ke foto kegiatan/pemain di /public. null = tampilkan placeholder. */
  image: string | null;
  desc: string;
};

export const PROGRAMS: readonly Program[] = [
  {
    label: "KU‑8",
    ages: "UNDER 8",
    image: "/images/programs/KU8.jpg",
    desc: "Akademi basket Depok tahap perkenalan. Fokus pada gerak dasar, koordinasi, dan kesenangan bermain sebagai prioritas utama bagi atlet cilik.",
  },
  {
    label: "KU‑10",
    ages: "UNDER 10",
    image: "/images/programs/KU10.jpg",
    desc: "Membangun fondasi teknik dasar basket: dribbling, passing, dan shooting sederhana dalam suasana latihan yang menyenangkan di Depok.",
  },
  {
    label: "KU‑12",
    ages: "UNDER 12",
    image: "/images/programs/KU12.jpg",
    desc: "Pengembangan kemampuan individu dan pengenalan konsep permainan tim. Pemain akademi mulai dilatih disiplin dan konsistensi tinggi.",
  },
  {
    label: "KU‑14",
    ages: "UNDER 14",
    image: "/images/programs/KU14.jpg",
    desc: "Peningkatan taktik, fisik, dan mental bertanding. Atlet aktif mengikuti pertandingan uji coba dan kompetisi basket lokal Depok.",
  },
  {
    label: "KU‑16",
    ages: "UNDER 16",
    image: "/images/programs/KU16.jpg",
    desc: "Persiapan kompetisi serius seperti KEJURKOT, Liga Basket Depok, dan turnamen regional dengan standar pelatihan atlet profesional terstruktur.",
  },
];
