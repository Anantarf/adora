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
    desc: "Tahap perkenalan dunia basket dengan fokus pada gerak dasar, koordinasi, dan kesenangan bermain sebagai prioritas utama.",
  },
  {
    label: "KU‑10",
    ages: "UNDER 10",
    image: "/images/programs/KU10.jpg",
    desc: "Membangun fondasi teknik dasar: dribbling, passing, dan shooting sederhana dalam suasana latihan yang menyenangkan.",
  },
  {
    label: "KU‑12",
    ages: "UNDER 12",
    image: "/images/programs/KU12.jpg",
    desc: "Pengembangan kemampuan individu dan pengenalan konsep permainan tim. Pemain mulai dilatih disiplin dan konsistensi.",
  },
  {
    label: "KU‑14",
    ages: "UNDER 14",
    image: "/images/programs/KU14.jpg",
    desc: "Peningkatan taktik, fisik, dan mental bertanding. Aktif mengikuti pertandingan uji coba dan kompetisi lokal.",
  },
  {
    label: "KU‑16",
    ages: "UNDER 16",
    image: "/images/programs/KU16.jpg",
    desc: "Persiapan kompetisi serius seperti KEJURKOT, Liga Basket, dan turnamen regional dengan standar pelatihan terstruktur.",
  },
];
