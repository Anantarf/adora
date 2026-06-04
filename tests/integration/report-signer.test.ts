import { describe, expect, test } from "vitest";

import {
  buildReportArchiveSnapshot,
  freezeHistoricalSnapshot,
  resolveCoachSignerName,
} from "@/lib/report-signer";

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
        coachAssignment: {
          coachProfile: {
            id: "coach-profile-1",
            fullName: "Coach Rama",
          },
        },
      },
    });

    expect(snapshot).toEqual({
      groupId: "group-1",
      groupNameSnapshot: "KU-14 Inti",
      homebaseIdSnapshot: "homebase-1",
      homebaseNameSnapshot: "ADORA Gandul",
      coachProfileIdSnapshot: "coach-profile-1",
      coachNameSnapshot: "Coach Rama",
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
