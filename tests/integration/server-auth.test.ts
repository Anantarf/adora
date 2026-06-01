import { beforeEach, describe, expect, test, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import type { DeepMockProxy } from "vitest-mock-extended";
import { prisma as originalPrisma } from "@/lib/prisma";

vi.unmock("@/lib/server-auth");

const getServerSession = vi.fn();

vi.mock("next-auth/next", () => ({
  getServerSession,
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

const prisma = originalPrisma as unknown as DeepMockProxy<PrismaClient>;

describe("Server auth helpers", () => {
  beforeEach(() => {
    getServerSession.mockReset();
    prisma.user.findFirst.mockReset();
  });

  test("requireSessionRole tidak query DB untuk validasi role session", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } });
    const { requireSessionRole } = await import("@/lib/server-auth");

    const session = await requireSessionRole("ADMIN");

    expect(session.user.id).toBe("admin-1");
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
  });

  test("requireActiveUser memverifikasi user aktif di DB", async () => {
    getServerSession.mockResolvedValue({ user: { id: "parent-1", role: "PARENT", username: "old" } });
    prisma.user.findFirst.mockResolvedValue({
      id: "parent-1",
      role: "PARENT",
      username: "parent1",
      name: "Parent One",
      email: "parent@example.com",
    } as never);
    const { requireActiveUser } = await import("@/lib/server-auth");

    const session = await requireActiveUser("PARENT");

    expect(prisma.user.findFirst).toHaveBeenCalledTimes(1);
    expect(session.user.username).toBe("parent1");
  });
});
