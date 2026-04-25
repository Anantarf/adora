/** Data murni programs — tanpa JSX, bisa dipakai di Server/Client/API */
export const PROGRAMS = [
  {
    label: "KU‑7",
    ages: "7 – 9 Tahun",
    iconName: "Sprout" as const,
    desc: "Program Kids perdana ADORA: mengenalkan dunia basket melalui permainan, gerak dasar, dan kecintaan terhadap olahraga sejak usia belia.",
  },
  {
    label: "KU‑10",
    ages: "10 – 12 Tahun",
    iconName: "Target" as const,
    desc: "Fondasi teknik dan ball-handling yang kuat. Pemain mulai dikenalkan pada sistem latihan terstruktur khas ADORA.",
  },
  {
    label: "KU‑15",
    ages: "13 – 15 Tahun",
    iconName: "Flame" as const,
    desc: "Pengembangan taktik, fisik, dan mental kompetisi. Pemain aktif mengikuti sparing day, ASBC, dan Liga Basket.",
  },
  {
    label: "KU‑18",
    ages: "16 – 18 Tahun",
    iconName: "Trophy" as const,
    desc: "Persiapan menuju KEJURKOT dan turnamen nasional dengan standar pelatihan profesional dan program Camp ADORA.",
  },
] as const;

export type ProgramIconName = typeof PROGRAMS[number]["iconName"];
