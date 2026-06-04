import { beforeEach, describe, expect, test, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import type { DeepMockProxy } from "vitest-mock-extended";
import { prisma as originalPrisma } from "@/lib/prisma";

const getServerSession = vi.fn();

vi.mock("next-auth/next", () => ({
  getServerSession,
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

const prisma = originalPrisma as unknown as DeepMockProxy<PrismaClient>;

describe("PDF report route", () => {
  beforeEach(() => {
    getServerSession.mockReset();
    prisma.player.findUnique.mockReset();
  });

  test("mengembalikan 401 bila sesi tidak ada", async () => {
    getServerSession.mockResolvedValue(null);
    const { GET } = await import("@/app/api/report/pdf/route");

    const response = await GET(new Request("http://localhost/api/report/pdf?playerId=player-1") as never);

    expect(response.status).toBe(401);
  });

  test("mengembalikan 403 bila role tidak diizinkan", async () => {
    getServerSession.mockResolvedValue({ user: { id: "user-1", role: "COACH" } });
    const { GET } = await import("@/app/api/report/pdf/route");

    const response = await GET(new Request("http://localhost/api/report/pdf?playerId=player-1") as never);

    expect(response.status).toBe(403);
  });

  test("mengembalikan 404 bila pemain tidak ditemukan", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } });
    prisma.player.findUnique.mockResolvedValue(null);
    const { GET } = await import("@/app/api/report/pdf/route");

    const response = await GET(new Request("http://localhost/api/report/pdf?playerId=player-1") as never);

    expect(response.status).toBe(404);
  });

  test("mengembalikan 403 bila parent mengakses anak lain", async () => {
    getServerSession.mockResolvedValue({ user: { id: "parent-1", role: "PARENT" } });
    prisma.player.findUnique.mockResolvedValue({
      id: "player-1",
      name: "Pemain A",
      parentId: "parent-2",
      dateOfBirth: new Date("2015-01-01"),
      schoolOrigin: "SD Test",
      group: { name: "KU-12" },
      statistic: [],
      attendance: [],
      certificate: [],
      _count: { certificate: 0, statistic: 0 },
    } as never);
    const { GET } = await import("@/app/api/report/pdf/route");

    const response = await GET(new Request("http://localhost/api/report/pdf?playerId=player-1") as never);

    expect(response.status).toBe(403);
  });

  test("mengembalikan HTML printable saat data valid", async () => {
    getServerSession.mockResolvedValue({ user: { id: "parent-1", role: "PARENT" } });
    prisma.player.findUnique.mockResolvedValue({
      id: "player-1",
      name: "Pemain A",
      parentId: "parent-1",
      dateOfBirth: new Date("2015-01-01"),
      schoolOrigin: "SD Test",
      group: { name: "KU-12" },
      statistic: [
        {
          date: new Date("2026-05-01"),
          metricsJson: {
            dribble: { inAndOut: 8, crossover: 7, vLeft: 6, vRight: 6, betweenLegsLeft: 5, betweenLegsRight: 5 },
            passing: { chestPass: 8, bouncePass: 7, overheadPass: 7 },
            layUp: 8,
            shooting: 7,
            notes: "Konsisten meningkat",
          },
        },
      ],
      attendance: [{ status: "HADIR" }, { status: "ALPA" }],
      certificate: [{ title: "Juara 1", uploadedAt: new Date("2026-03-01") }],
      _count: { certificate: 1, statistic: 1 },
    } as never);
    const { GET } = await import("@/app/api/report/pdf/route");

    const response = await GET(new Request("http://localhost/api/report/pdf?playerId=player-1") as never);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/html");
    expect(html).toContain("Pemain A");
    expect(html).toContain("Konsisten meningkat");
  });

  test("tetap merender laporan saat metrics lama tersimpan sebagai string JSON", async () => {
    getServerSession.mockResolvedValue({ user: { id: "parent-1", role: "PARENT" } });
    prisma.player.findUnique.mockResolvedValue({
      id: "player-1",
      name: "Pemain B",
      parentId: "parent-1",
      dateOfBirth: new Date("2015-01-01"),
      schoolOrigin: "SD Test",
      group: { name: "KU-12" },
      statistic: [
        {
          date: new Date("2026-05-01"),
          metricsJson: JSON.stringify({
            dribble: { inAndOut: 8, crossover: 7, vLeft: 6, vRight: 6, betweenLegsLeft: 5, betweenLegsRight: 5 },
            passing: { chestPass: 8, bouncePass: 7, overheadPass: 7 },
            layUp: 8,
            shooting: 7,
            notes: "Masih konsisten",
          }),
        },
      ],
      attendance: [{ status: "HADIR" }, { status: "HADIR" }],
      certificate: [],
      _count: { certificate: 0, statistic: 1 },
    } as never);
    const { GET } = await import("@/app/api/report/pdf/route");

    const response = await GET(new Request("http://localhost/api/report/pdf?playerId=player-1") as never);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("Pemain B");
    expect(html).toContain("Masih konsisten");
  });

  test("merender laporan format v2 dengan catatan pelatih dan aspek dinamis", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } });
    prisma.player.findUnique.mockResolvedValue({
      id: "player-1",
      name: "Pemain C",
      parentId: "parent-1",
      dateOfBirth: new Date("2014-01-01"),
      schoolOrigin: "SD Test",
      group: { name: "KU-14" },
      statistic: [
        {
          date: new Date("2026-06-01"),
          metricsJson: {
            version: "v2",
            categories: [
              {
                id: "dribble",
                label: "Dribble",
                weight: 50,
                items: [
                  { id: "cross", label: "Crossover", maxScore: 10, score: 8 },
                  { id: "control", label: "Ball Control", maxScore: 10, score: 9 },
                ],
              },
            ],
            attendance: {
              label: "Presensi",
              weight: 10,
              score: 100,
              counts: { HADIR: 2, IZIN: 0, SAKIT: 0, ALPA: 0 },
              totalSessions: 2,
            },
            notes: "Progres sangat baik",
            grading: [
              { letter: "A", label: "SANGAT BAIK", minScore: 80 },
              { letter: "B", label: "BAIK", minScore: 70 },
              { letter: "C", label: "CUKUP", minScore: 60 },
              { letter: "D", label: "KURANG", minScore: 0 },
            ],
          },
        },
      ],
      attendance: [{ status: "HADIR" }, { status: "HADIR" }],
      certificate: [],
      _count: { certificate: 0, statistic: 1 },
    } as never);
    const { GET } = await import("@/app/api/report/pdf/route");

    const response = await GET(new Request("http://localhost/api/report/pdf?playerId=player-1") as never);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("Pemain C");
    expect(html).toContain("Progres sangat baik");
    expect(html).toContain("Ball Control");
  });
});
