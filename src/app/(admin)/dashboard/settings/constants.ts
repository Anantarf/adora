export type AssetKey = "rapor_header_url" | "rapor_ceo_sign_url" | "rapor_coach_sign_url" | "rapor_stamp_url";

export type AssetConfig = {
  key: AssetKey;
  label: string;
  description: string;
  accept: string;
  maxSizeLabel: string;
};

export const ASSET_KEYS: AssetConfig[] = [
  {
    key: "rapor_header_url",
    label: "Template Kertas Rapor (Paper Background)",
    description: "Utamakan format PDF agar ukuran rapor tetap ringan. PNG/JPG hanya cocok untuk kop surat ringan, bukan background full-page resolusi besar.",
    accept: ".png,.jpg,.jpeg,.pdf",
    maxSizeLabel: "Maks 1MB",
  },
  {
    key: "rapor_ceo_sign_url",
    label: "Tanda Tangan CEO",
    description: "Unggah tanda tangan CEO dalam format PNG transparan.",
    accept: ".png",
    maxSizeLabel: "Maks 300KB",
  },
  {
    key: "rapor_coach_sign_url",
    label: "Tanda Tangan Coach Umum Cadangan",
    description: "Dipakai hanya jika coach umum belum dipilih dari data coach aktif atau coach terpilih belum punya tanda tangan.",
    accept: ".png",
    maxSizeLabel: "Maks 300KB",
  },
  {
    key: "rapor_stamp_url",
    label: "Stempel Digital",
    description: "Unggah stempel resmi ADORA BBC dalam format PNG transparan.",
    accept: ".png",
    maxSizeLabel: "Maks 300KB",
  },
];

export const SIGNER_KEYS = [
  { key: "rapor_ceo_name", label: "Nama CEO", placeholder: "Contoh: M. Arief, S.Ak" },
];

export function getAssetPreviewMeta(key: AssetKey) {
  if (key === "rapor_header_url") {
    return {
      badge: "Template",
      frameClass: "bg-white/5",
      fallbackClass: "bg-red-500/10 text-red-500",
      helperText: "Digunakan sebagai latar rapor",
    };
  }

  if (key === "rapor_stamp_url") {
    return {
      badge: "Stempel",
      frameClass: "bg-[linear-gradient(45deg,rgba(255,255,255,0.06)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.06)_75%,transparent_75%,transparent)] bg-[length:14px_14px]",
      fallbackClass: "bg-sky-500/10 text-sky-400",
      helperText: "Digunakan saat rapor dicetak",
    };
  }

  return {
    badge: "Tanda Tangan",
    frameClass: "bg-[linear-gradient(45deg,rgba(255,255,255,0.06)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.06)_75%,transparent_75%,transparent)] bg-[length:14px_14px]",
    fallbackClass: "bg-indigo-500/10 text-indigo-400",
    helperText: "Digunakan saat rapor dicetak",
  };
}
