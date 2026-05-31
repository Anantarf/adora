import { beforeEach, describe, expect, test } from "vitest";
import type { PrismaClient } from "@prisma/client";
import type { DeepMockProxy } from "vitest-mock-extended";
import { prisma as originalPrisma } from "@/lib/prisma";
import { getPlayersPageAction } from "@/actions/players";
import { getUsersPageAction } from "@/actions/users";

const prisma = originalPrisma as unknown as DeepMockProxy<PrismaClient>;

describe("Phase 3 Scale And Pagination", () => {
  beforeEach(() => {
    prisma.player.findMany.mockReset();
    prisma.player.count.mockReset();
    prisma.user.findMany.mockReset();
    prisma.user.count.mockReset();
  });

  test("mengambil pemain admin secara paginated di level database", async () => {
    const items = [
      {
        id: "player-10",
        name: "Player 10",
        schoolOrigin: "SMP 10",
        groupId: "group-a",
        group: { id: "group-a", name: "Kelompok A" },
      },
    ];

    prisma.player.count.mockResolvedValueOnce(17);
    prisma.player.findMany.mockResolvedValueOnce(items as never);

    const result = await getPlayersPageAction({
      groupId: "group-a",
      searchQuery: "player",
      page: 2,
      pageSize: 9,
    });

    expect(prisma.player.findMany).toHaveBeenCalledWith({
      where: {
        isDeleted: false,
        groupId: "group-a",
        OR: [
          { name: { contains: "player" } },
          { firstName: { contains: "player" } },
          { lastName: { contains: "player" } },
          { schoolOrigin: { contains: "player" } },
        ],
      },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        schoolOrigin: true,
        groupId: true,
        group: { select: { id: true, name: true } },
        gender: true,
        dateOfBirth: true,
        phoneNumber: true,
        hasMedicalCondition: true,
        medicalConditionDetail: true,
        photoUrl: true,
        signatureUrl: true,
      },
      orderBy: { name: "asc" },
      skip: 9,
      take: 9,
    });
    expect(prisma.player.count).toHaveBeenCalledWith({
      where: {
        isDeleted: false,
        groupId: "group-a",
        OR: [
          { name: { contains: "player" } },
          { firstName: { contains: "player" } },
          { lastName: { contains: "player" } },
          { schoolOrigin: { contains: "player" } },
        ],
      },
    });
    expect(result).toEqual({
      items,
      total: 17,
      page: 2,
      pageSize: 9,
      totalPages: 2,
    });
  });

  test("mengambil akun admin secara paginated dengan pencarian di database", async () => {
    const items = [
      {
        id: "user-1",
        name: "Admin A",
        username: "admin-a",
        email: "admin-a@example.com",
        role: "ADMIN",
        image: null,
        _count: { player: 0 },
      },
    ];

    prisma.user.count.mockResolvedValueOnce(11);
    prisma.user.findMany.mockResolvedValueOnce(items as never);

    const result = await getUsersPageAction({
      role: "ADMIN",
      searchQuery: "admin",
      page: 2,
      pageSize: 10,
    });

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: {
        role: "ADMIN",
        isDeleted: false,
        OR: [
          { name: { contains: "admin" } },
          { username: { contains: "admin" } },
          { email: { contains: "admin" } },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        image: true,
        _count: {
          select: { player: { where: { isDeleted: false } } },
        },
      },
      orderBy: [{ username: "asc" }],
      skip: 10,
      take: 10,
    });
    expect(prisma.user.count).toHaveBeenCalledWith({
      where: {
        role: "ADMIN",
        isDeleted: false,
        OR: [
          { name: { contains: "admin" } },
          { username: { contains: "admin" } },
          { email: { contains: "admin" } },
        ],
      },
    });
    expect(result).toEqual({
      items,
      total: 11,
      page: 2,
      pageSize: 10,
      totalPages: 2,
    });
  });

  test("menolak page size berlebihan untuk list pemain", async () => {
    await expect(
      getPlayersPageAction({
        groupId: "group-a",
        page: 1,
        pageSize: 200,
      }),
    ).rejects.toThrow();
  });
});
