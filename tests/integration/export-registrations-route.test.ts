import { beforeEach, describe, expect, test, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import type { DeepMockProxy } from "vitest-mock-extended";
import { prisma as originalPrisma } from "@/lib/prisma";
import { recordOperationalWarning } from "@/lib/observability";

const getServerSession = vi.fn();

vi.mock("next-auth/next", () => ({
  getServerSession,
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/observability", async () => {
  const actual = await vi.importActual<typeof import("@/lib/observability")>("@/lib/observability");
  return {
    ...actual,
    recordOperationalWarning: vi.fn(),
    recordOperationalError: vi.fn(),
  };
});

const prisma = originalPrisma as unknown as DeepMockProxy<PrismaClient>;

describe("Export registrations route", () => {
  beforeEach(() => {
    getServerSession.mockReset();
    prisma.registration.count.mockReset();
    vi.mocked(recordOperationalWarning).mockReset();
  });

  test("mengembalikan 401 bila bukan admin", async () => {
    getServerSession.mockResolvedValue(null);
    const { GET } = await import("@/app/api/export/registrations/route");

    const response = await GET(new Request("http://localhost/api/export/registrations?filter=all"));

    expect(response.status).toBe(401);
  }, 15_000);

  test("mengembalikan 400 untuk filter invalid", async () => {
    getServerSession.mockResolvedValue({ user: { role: "ADMIN" } });
    const { GET } = await import("@/app/api/export/registrations/route");

    const response = await GET(new Request("http://localhost/api/export/registrations?filter=invalid"));

    expect(response.status).toBe(400);
  }, 15_000);

  test("mengembalikan 413 saat jumlah data melebihi limit", async () => {
    getServerSession.mockResolvedValue({ user: { role: "ADMIN" } });
    prisma.registration.count.mockResolvedValue(10_000);
    const { GET } = await import("@/app/api/export/registrations/route");

    const response = await GET(new Request("http://localhost/api/export/registrations?filter=all"));
    const body = await response.json();

    expect(response.status).toBe(413);
    expect(body.error).toContain("Jumlah data terlalu besar");
    expect(recordOperationalWarning).toHaveBeenCalledTimes(1);
  });
});
