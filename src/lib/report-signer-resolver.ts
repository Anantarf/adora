import type { Prisma } from "@prisma/client";

import {
  parseReportSignerHomebaseMappings,
  REPORT_SIGNER_GLOBAL_COACH_PROFILE_SETTING_KEY,
  REPORT_SIGNER_HOMEBASE_SETTING_KEY,
  resolveGlobalCoachFallback,
  type ReportSignerSnapshot,
} from "@/lib/report-signer";

type TransactionClientLike = Omit<
  Prisma.TransactionClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

type GroupSignerInput = {
  id: string;
  name: string;
  homebase: { id: string; name: string } | null;
  coachAssignment: {
    coachProfile: {
      id: string;
      fullName: string;
      signatureUrl: string | null;
    } | null;
  } | null;
};

type ReportSignerResolverContext = {
  fallbackCoachProfileId: string | null;
  fallbackCoachName: string | null;
  fallbackCoachSignUrl: string | null;
  globalCoachProfile: {
    id: string;
    fullName: string;
    signatureUrl: string | null;
  } | null;
  homebaseMappings: Map<string, string>;
  mappedCoachProfiles: Map<
    string,
    {
      id: string;
      fullName: string;
      signatureUrl: string | null;
      photoUrl: string | null;
      licenseUrl: string | null;
    }
  >;
};

const REPORT_SIGNER_SETTING_KEYS = [
  REPORT_SIGNER_GLOBAL_COACH_PROFILE_SETTING_KEY,
  "rapor_coach_name",
  "rapor_coach_sign_url",
  REPORT_SIGNER_HOMEBASE_SETTING_KEY,
] as const;

export async function getReportSignerResolverContext(tx: TransactionClientLike) {
  const settings = await tx.clubSetting.findMany({
    where: {
      key: {
        in: [...REPORT_SIGNER_SETTING_KEYS],
      },
    },
    select: {
      key: true,
      value: true,
    },
  });

  const settingsByKey = new Map(settings.map((setting) => [setting.key, setting.value]));
  const homebaseMappings = parseReportSignerHomebaseMappings(
    settingsByKey.get(REPORT_SIGNER_HOMEBASE_SETTING_KEY),
  );
  const fallbackCoachProfileId =
    settingsByKey.get(REPORT_SIGNER_GLOBAL_COACH_PROFILE_SETTING_KEY)?.trim() || null;
  const mappedCoachProfileIds = Array.from(
    new Set(
      [
        ...homebaseMappings.map((mapping) => mapping.coachProfileId),
        ...(fallbackCoachProfileId ? [fallbackCoachProfileId] : []),
      ].filter(Boolean),
    ),
  );

  const mappedCoachProfiles = mappedCoachProfileIds.length
    ? await tx.coachProfile.findMany({
        where: {
          id: { in: mappedCoachProfileIds },
          isDeleted: false,
          user: {
            isDeleted: false,
            role: "COACH",
          },
        },
        select: {
          id: true,
          fullName: true,
          signatureUrl: true,
          photoUrl: true,
          licenseUrl: true,
        },
      })
    : [];

  const globalCoachProfile = fallbackCoachProfileId
    ? mappedCoachProfiles.find((coachProfile) => coachProfile.id === fallbackCoachProfileId) ?? null
    : null;

  return {
    fallbackCoachProfileId,
    fallbackCoachName: settingsByKey.get("rapor_coach_name") ?? null,
    fallbackCoachSignUrl: settingsByKey.get("rapor_coach_sign_url") ?? null,
    globalCoachProfile,
    homebaseMappings: new Map(
      homebaseMappings.map((mapping) => [mapping.homebaseId, mapping.coachProfileId]),
    ),
    mappedCoachProfiles: new Map(
      mappedCoachProfiles.map((coachProfile) => [coachProfile.id, coachProfile]),
    ),
  } satisfies ReportSignerResolverContext;
}

export function resolveReportSignerSnapshotForGroup(
  group: GroupSignerInput | null | undefined,
  context: ReportSignerResolverContext,
): ReportSignerSnapshot & { resolutionSource: "GROUP" | "HOMEBASE" | "GLOBAL" } {
  const assignedCoach = group?.coachAssignment?.coachProfile;
  if (assignedCoach) {
    return {
      coachProfileIdSnapshot: assignedCoach.id,
      coachNameSnapshot: assignedCoach.fullName,
      coachSignUrlSnapshot: assignedCoach.signatureUrl ?? null,
      resolutionSource: "GROUP",
    };
  }

  const mappedCoachProfileId = group?.homebase?.id
    ? context.homebaseMappings.get(group.homebase.id)
    : null;
  const mappedCoach = mappedCoachProfileId
    ? context.mappedCoachProfiles.get(mappedCoachProfileId)
    : null;

  if (mappedCoach) {
    return {
      coachProfileIdSnapshot: mappedCoach.id,
      coachNameSnapshot: mappedCoach.fullName,
      coachSignUrlSnapshot: mappedCoach.signatureUrl ?? null,
      resolutionSource: "HOMEBASE",
    };
  }

  const globalCoachFallback = resolveGlobalCoachFallback({
    globalCoachProfile: context.globalCoachProfile,
    fallbackCoachName: context.fallbackCoachName,
    fallbackCoachSignUrl: context.fallbackCoachSignUrl,
  });

  return {
    coachProfileIdSnapshot: globalCoachFallback.coachProfileId,
    coachNameSnapshot: globalCoachFallback.coachName ?? null,
    coachSignUrlSnapshot: globalCoachFallback.coachSignUrl ?? null,
    resolutionSource: "GLOBAL",
  };
}
