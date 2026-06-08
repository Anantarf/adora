export const REPORT_SIGNER_HOMEBASE_SETTING_KEY = "report_signer_homebase_json";

export type ReportSignerHomebaseMapping = {
  homebaseId: string;
  coachProfileId: string;
};

export type ReportSignerSnapshot = {
  coachProfileIdSnapshot: string | null;
  coachNameSnapshot: string | null;
  coachSignUrlSnapshot: string | null;
};

export function resolveCoachSignerName(
  assignedCoachName?: string | null,
  fallbackCoachName?: string | null,
) {
  const normalizedAssignedCoachName = assignedCoachName?.trim();
  if (normalizedAssignedCoachName) {
    return normalizedAssignedCoachName;
  }

  const normalizedFallbackCoachName = fallbackCoachName?.trim();
  return normalizedFallbackCoachName || undefined;
}

export function resolveCoachSignerAssetUrl(
  assignedCoachSignUrl?: string | null,
  fallbackCoachSignUrl?: string | null,
) {
  const normalizedAssignedCoachSignUrl = assignedCoachSignUrl?.trim();
  if (normalizedAssignedCoachSignUrl) {
    return normalizedAssignedCoachSignUrl;
  }

  const normalizedFallbackCoachSignUrl = fallbackCoachSignUrl?.trim();
  return normalizedFallbackCoachSignUrl || undefined;
}

export function parseReportSignerHomebaseMappings(rawValue: string | null | undefined) {
  if (!rawValue?.trim()) {
    return [] as ReportSignerHomebaseMapping[];
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;
    if (!Array.isArray(parsed)) {
      return [] as ReportSignerHomebaseMapping[];
    }

    return parsed
      .filter((item): item is ReportSignerHomebaseMapping => {
        return Boolean(
          item &&
            typeof item === "object" &&
            typeof (item as { homebaseId?: unknown }).homebaseId === "string" &&
            typeof (item as { coachProfileId?: unknown }).coachProfileId === "string",
        );
      })
      .map((item) => ({
        homebaseId: item.homebaseId.trim(),
        coachProfileId: item.coachProfileId.trim(),
      }))
      .filter((item) => item.homebaseId && item.coachProfileId);
  } catch {
    return [] as ReportSignerHomebaseMapping[];
  }
}

export function serializeReportSignerHomebaseMappings(mappings: ReportSignerHomebaseMapping[]) {
  return JSON.stringify(
    mappings
      .map((mapping) => ({
        homebaseId: mapping.homebaseId.trim(),
        coachProfileId: mapping.coachProfileId.trim(),
      }))
      .filter((mapping) => mapping.homebaseId && mapping.coachProfileId),
  );
}

export function buildReportArchiveSnapshot(input: {
  group: {
    id: string;
    name: string;
    homebase: { id: string; name: string } | null;
  };
  signer?: ReportSignerSnapshot;
}) {
  return {
    groupId: input.group.id,
    groupNameSnapshot: input.group.name,
    homebaseIdSnapshot: input.group.homebase?.id ?? null,
    homebaseNameSnapshot: input.group.homebase?.name ?? null,
    coachProfileIdSnapshot: input.signer?.coachProfileIdSnapshot ?? null,
    coachNameSnapshot: input.signer?.coachNameSnapshot ?? null,
    coachSignUrlSnapshot: input.signer?.coachSignUrlSnapshot ?? null,
  };
}

export function freezeHistoricalSnapshot<T extends Record<string, unknown>>(
  existingSnapshot: T | null,
  nextSnapshot: T,
) {
  return existingSnapshot ?? nextSnapshot;
}
