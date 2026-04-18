export type GroupMetaConfig = {
  targetKu?: number;
  schoolLevel?: string;
};

export function parseGroupMetaDescription(description?: string | null): GroupMetaConfig {
  if (!description || !description.trim().startsWith("{")) {
    return {};
  }

  try {
    const parsed = JSON.parse(description) as Partial<GroupMetaConfig>;
    return {
      targetKu: typeof parsed.targetKu === "number" ? parsed.targetKu : undefined,
      schoolLevel: typeof parsed.schoolLevel === "string" ? parsed.schoolLevel : undefined,
    };
  } catch {
    return {};
  }
}

export function getGroupDisplayDescription(description?: string | null): string {
  const parsed = parseGroupMetaDescription(description);
  if (parsed.schoolLevel) return parsed.schoolLevel;
  if (parsed.targetKu) return `${parsed.targetKu} Tahun`;
  return description || "";
}

export function buildGroupDescriptionPayload(config: GroupMetaConfig): string {
  const payload: GroupMetaConfig = {
    targetKu: config.targetKu,
    schoolLevel: config.schoolLevel,
  };

  if (!payload.targetKu && !payload.schoolLevel) {
    return "";
  }

  return JSON.stringify(payload);
}
