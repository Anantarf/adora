import { describe, expect, test, vi } from "vitest";

import {
  buildReportArchiveSnapshot,
  freezeHistoricalSnapshot,
  resolveCoachSignerName,
  serializeReportSignerHomebaseMappings,
} from "@/lib/report-signer";
import { getReportSignerResolverContext } from "@/lib/report-signer-resolver";
import { normalizeClubSettingValue } from "@/lib/validation/club-setting";

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

  test("mengizinkan coach yang sama menangani lebih dari satu lokasi", () => {
    expect(
      serializeReportSignerHomebaseMappings([
        { homebaseId: "homebase-1", coachProfileId: "coach-profile-1" },
        { homebaseId: "homebase-2", coachProfileId: "coach-profile-1" },
      ]),
    ).toBe(
      JSON.stringify([
        { homebaseId: "homebase-1", coachProfileId: "coach-profile-1" },
        { homebaseId: "homebase-2", coachProfileId: "coach-profile-1" },
      ]),
    );
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

describe("Club setting value validation", () => {
  test("menolak URL aset rapor yang bukan dari upload privat sesuai key", () => {
    expect(() =>
      normalizeClubSettingValue("rapor_ceo_sign_url", "/api/storage/uploads/rapor_header_url_x.png"),
    ).toThrow("Tanda tangan CEO tidak valid");
  });

  test("menormalisasi nama signer", () => {
    expect(normalizeClubSettingValue("rapor_ceo_name", "  CEO ADORA BBC  ")).toBe("CEO ADORA BBC");
  });
});
