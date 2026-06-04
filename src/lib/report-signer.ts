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

export function buildReportArchiveSnapshot(input: {
  group: {
    id: string;
    name: string;
    homebase: { id: string; name: string } | null;
    coachAssignment: {
      coachProfile: {
        id: string;
        fullName: string;
      } | null;
    } | null;
  };
}) {
  return {
    groupId: input.group.id,
    groupNameSnapshot: input.group.name,
    homebaseIdSnapshot: input.group.homebase?.id ?? null,
    homebaseNameSnapshot: input.group.homebase?.name ?? null,
    coachProfileIdSnapshot: input.group.coachAssignment?.coachProfile?.id ?? null,
    coachNameSnapshot: input.group.coachAssignment?.coachProfile?.fullName ?? null,
  };
}

export function freezeHistoricalSnapshot<T extends Record<string, unknown>>(
  existingSnapshot: T | null,
  nextSnapshot: T,
) {
  return existingSnapshot ?? nextSnapshot;
}
