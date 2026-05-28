export type GroupCategory = "SEKOLAH" | "KELOMPOK_UMUR";

export type GroupMetaConfig = {
  category?: GroupCategory;
  targetKu?: number;
  schoolLevel?: string;
};

export function parseGroupMetaDescription(description?: string | null): GroupMetaConfig {
  if (!description || !description.trim().startsWith("{")) {
    return {};
  }

  try {
    const parsed = JSON.parse(description) as Partial<GroupMetaConfig>;
    const targetKu = typeof parsed.targetKu === "number" ? parsed.targetKu : typeof parsed.targetKu === "string" ? parseInt(parsed.targetKu, 10) : undefined;
    return {
      category: parsed.category === "SEKOLAH" || parsed.category === "KELOMPOK_UMUR" ? parsed.category : undefined,
      targetKu: Number.isFinite(targetKu) ? targetKu : undefined,
      schoolLevel: typeof parsed.schoolLevel === "string" ? parsed.schoolLevel : undefined,
    };
  } catch {
    return {};
  }
}

export function getGroupCategoryLabel(category?: GroupCategory | null): string {
  if (category === "SEKOLAH") return "Sekolah";
  if (category === "KELOMPOK_UMUR") return "Kelompok Umur";
  return "Kelompok";
}

export function normalizeGroupMeta(config: GroupMetaConfig): Required<Pick<GroupMetaConfig, "category">> & Omit<GroupMetaConfig, "category"> {
  const category: GroupCategory =
    config.category ??
    (config.schoolLevel ? "SEKOLAH" : "KELOMPOK_UMUR");

  return {
    category,
    targetKu: category === "KELOMPOK_UMUR" ? config.targetKu : undefined,
    schoolLevel: category === "SEKOLAH" ? config.schoolLevel : undefined,
  };
}

export function getGroupDisplayDescription(input?: {
  category?: GroupCategory | null;
  targetKu?: number | null;
  schoolLevel?: string | null;
  description?: string | null;
}): string {
  const parsedLegacy = parseGroupMetaDescription(input?.description);
  const category = input?.category ?? parsedLegacy.category;
  const schoolLevel = input?.schoolLevel ?? parsedLegacy.schoolLevel;
  const targetKu = input?.targetKu ?? parsedLegacy.targetKu;

  if (category === "SEKOLAH" && schoolLevel) return schoolLevel;
  if (category === "KELOMPOK_UMUR" && targetKu) return `KU ${targetKu}`;
  if (schoolLevel) return schoolLevel;
  if (targetKu) return `${targetKu} Tahun`;
  return input?.description || "";
}

export function buildLegacyGroupDescriptionPayload(config: GroupMetaConfig): string {
  const payload = normalizeGroupMeta(config);

  if (!payload.targetKu && !payload.schoolLevel) {
    return "";
  }

  return JSON.stringify(payload);
}
