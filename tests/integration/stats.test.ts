import { beforeEach, describe, expect, test } from "vitest";
import { submitAttendanceAction, submitStatisticAction } from "@/actions/stats";
import { prisma as originalPrisma } from "@/lib/prisma";
import type { PrismaClient } from "@prisma/client";
import type { DeepMockProxy } from "vitest-mock-extended";

const prisma = originalPrisma as unknown as DeepMockProxy<PrismaClient>;

describe("Statistics And Attendance Failure Paths", () => {
  beforeEach(() => {
    prisma.$transaction.mockImplementation(async (callback) => {
      if (typeof callback === "function") {
        return callback(prisma);
      }

      return [];
    });
  });

  test("menggagalkan submit presensi jika agenda tidak ditemukan", async () => {
    prisma.event.findUnique.mockResolvedValue(null);

    await expect(
      submitAttendanceAction({
        date: "2025-05-27",
        eventId: "missing-event",
        playerStatuses: [{ playerId: "player-1", status: "HADIR" }],
      }),
    ).rejects.toThrow("Agenda untuk presensi tidak ditemukan atau sudah dihapus.");
  });

  test("menggagalkan submit nilai jika pemain tidak ditemukan", async () => {
    prisma.player.findUnique.mockResolvedValue(null);

    await expect(
      submitStatisticAction({
        playerId: "missing-player",
        periodId: "period-1",
        status: "Draft",
        metrics: {
          dribble: {
            inAndOut: 1,
            crossover: 1,
            vLeft: 1,
            vRight: 1,
            betweenLegsLeft: 1,
            betweenLegsRight: 1,
          },
          passing: {
            chestPass: 1,
            bouncePass: 1,
            overheadPass: 1,
          },
          layUp: 1,
          shooting: 1,
        },
      }),
    ).rejects.toThrow("Pemain untuk input nilai tidak ditemukan.");
  });

  test("menggagalkan submit nilai jika payload metrik rusak", async () => {
    await expect(
      submitStatisticAction({
        playerId: "",
        periodId: "",
        status: "Published",
        metrics: {
          dribble: {
            inAndOut: "bad",
          },
        } as never,
      }),
    ).rejects.toThrow("Payload nilai tidak valid. Periksa pemain, periode, dan nilai yang dikirim.");
  });
});
