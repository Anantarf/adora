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
    ages: "KELOMPOK USIA 8",
    image: "/images/programs/KU8.jpg",
    desc: "Tahap perkenalan. Fokus pada gerak dasar, koordinasi, dan kesenangan bermain atlet cilik.",
  },
  {
    label: "KU‑10",
    ages: "KELOMPOK USIA 10",
    image: "/images/programs/KU10.jpg",
    desc: "Membangun fondasi teknik dasar (dribbling, passing, shooting) dalam suasana yang menyenangkan.",
  },
  {
    label: "KU‑12",
    ages: "KELOMPOK USIA 12",
    image: "/images/programs/KU12.jpg",
    desc: "Pengembangan skill individu & pengenalan konsep tim. Dilatih kedisiplinan dan konsistensi.",
  },
  {
    label: "KU‑14",
    ages: "KELOMPOK USIA 14",
    image: "/images/programs/KU14.jpg",
    desc: "Peningkatan taktik, fisik, dan mental. Aktif mengikuti uji coba dan kompetisi lokal.",
  },
  {
    label: "KU‑16",
    ages: "KELOMPOK USIA 16",
    image: "/images/programs/KU16.jpg",
    desc: "Persiapan kompetisi (KEJURKOT, turnamen regional) dengan standar pelatihan profesional.",
  },
];
