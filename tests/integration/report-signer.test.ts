import { describe, expect, test, vi } from "vitest";

import {
  buildReportArchiveSnapshot,
  freezeHistoricalSnapshot,
  resolveCoachSignerName,
} from "@/lib/report-signer";
import { getReportSignerResolverContext } from "@/lib/report-signer-resolver";

describe("Report signer helpers", () => {
  test("mengutamakan nama coach dari assignment grup untuk signer", () => {
    expect(resolveCoachSignerName("Coach Aktif", "Coach Fallback")).toBe("Coach Aktif");
  });

  test("memakai fallback bila assignment grup belum ada", () => {
    expect(resolveCoachSignerName("", "Coach Fallback")).toBe("Coach Fallback");
  });

  test("membangun snapshot histori coach dan homebase dari grup aktif", () => {
    const snapshot = buildReportArchiveSnapshot({
      group: {
        id: "group-1",
        name: "KU-14 Inti",
        homebase: {
          id: "homebase-1",
          name: "ADORA Gandul",
        },
      },
      signer: {
        coachProfileIdSnapshot: "coach-profile-1",
        coachNameSnapshot: "Coach Rama",
        coachSignUrlSnapshot: "url-to-signature",
      },
    });

    expect(snapshot).toEqual({
      groupId: "group-1",
      groupNameSnapshot: "KU-14 Inti",
      homebaseIdSnapshot: "homebase-1",
      homebaseNameSnapshot: "ADORA Gandul",
      coachProfileIdSnapshot: "coach-profile-1",
      coachNameSnapshot: "Coach Rama",
      coachSignUrlSnapshot: "url-to-signature",
    });
  });

  test("mempertahankan snapshot histori lama saat ada revisi baru", () => {
    const frozen = freezeHistoricalSnapshot(
      {
        groupIdSnapshot: "group-old",
        coachNameSnapshot: "Coach Lama",
      },
      {
        groupIdSnapshot: "group-new",
        coachNameSnapshot: "Coach Baru",
      },
    );

    expect(frozen).toEqual({
      groupIdSnapshot: "group-old",
      coachNameSnapshot: "Coach Lama",
    });
  });
});

describe("Report signer resolver", () => {
  test("hanya memakai profil coach dari user aktif role COACH", async () => {
    const tx = {
      clubSetting: {
        findMany: vi.fn().mockResolvedValue([
          {
            key: "report_signer_global_coach_profile_id",
            value: "coach-profile-1",
          },
          {
            key: "report_signer_homebase_json",
            value: JSON.stringify([
              {
                homebaseId: "homebase-1",
                coachProfileId: "coach-profile-2",
              },
            ]),
          },
        ]),
      },
      coachProfile: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };

    const context = await getReportSignerResolverContext(tx as never);

    expect(tx.coachProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isDeleted: false,
          user: {
            isDeleted: false,
            role: "COACH",
          },
        }),
      }),
    );
    expect(context.globalCoachProfile).toBeNull();
    expect(context.mappedCoachProfiles.size).toBe(0);
  });
});
