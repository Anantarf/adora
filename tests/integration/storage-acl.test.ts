import { describe, expect, test } from "vitest";
import { authorizePrivateStorageAccess } from "@/lib/storage-acl";

const baseLookup = {
  findCoachAsset: async () => null,
  findPlayerAsset: async () => null,
  findCertificate: async () => null,
  findCoachLicense: async () => null,
  findReportArchive: async () => null,
  isCoachVisibleToParent: async () => false,
  isPlayerOwnedByParent: async () => false,
};

describe("Private storage ACL", () => {
  test("admin dapat membuka semua file", async () => {
    const decision = await authorizePrivateStorageAccess({
      role: "ADMIN",
      userId: "admin-1",
      fileUrl: "/api/storage/uploads/certificate-001.pdf",
      lookup: {
        ...baseLookup,
        findPlayerAsset: async () => ({ id: "player-1" }),
        findCertificate: async () => ({ id: "cert-1", playerId: "player-1" }),
      },
    });

    expect(decision.allowed).toBe(true);
    expect(decision.statusCode).toBe(200);
  });

  test("parent dapat membuka asset pemain miliknya sendiri", async () => {
    const decision = await authorizePrivateStorageAccess({
      role: "PARENT",
      userId: "parent-1",
      fileUrl: "/api/storage/uploads/player-photo.png",
      lookup: {
        ...baseLookup,
        findPlayerAsset: async () => ({ id: "player-1" }),
        isPlayerOwnedByParent: async (playerId, parentId) => playerId === "player-1" && parentId === "parent-1",
      },
    });

    expect(decision.allowed).toBe(true);
    expect(decision.statusCode).toBe(200);
  });

  test("parent tidak dapat membuka asset pemain akun lain", async () => {
    const decision = await authorizePrivateStorageAccess({
      role: "PARENT",
      userId: "parent-1",
      fileUrl: "/api/storage/uploads/player-photo.png",
      lookup: {
        ...baseLookup,
        findPlayerAsset: async () => ({ id: "player-2" }),
      },
    });

    expect(decision.allowed).toBe(false);
    expect(decision.statusCode).toBe(403);
  });

  test("parent dapat membuka certificate yang terkait dengan pemainnya", async () => {
    const decision = await authorizePrivateStorageAccess({
      role: "PARENT",
      userId: "parent-1",
      fileUrl: "/api/storage/uploads/certificate-002.pdf",
      lookup: {
        ...baseLookup,
        findCertificate: async () => ({ id: "cert-2", playerId: "player-2" }),
        isPlayerOwnedByParent: async (playerId, parentId) => playerId === "player-2" && parentId === "parent-1",
      },
    });

    expect(decision.allowed).toBe(true);
    expect(decision.statusCode).toBe(200);
  });

  test("file tak dikenal ditolak", async () => {
    const decision = await authorizePrivateStorageAccess({
      role: "PARENT",
      userId: "parent-1",
      fileUrl: "/api/storage/uploads/orphan.pdf",
      lookup: baseLookup,
    });

    expect(decision.allowed).toBe(false);
    expect(decision.statusCode).toBe(404);
  });

  test("coach dapat membuka file profilnya sendiri", async () => {
    const decision = await authorizePrivateStorageAccess({
      role: "COACH",
      userId: "coach-user-1",
      fileUrl: "/api/storage/uploads/coach_license_coach-user-1_123.jpg",
      lookup: {
        ...baseLookup,
        findCoachAsset: async () => ({
          id: "coach-profile-1",
          userId: "coach-user-1",
          isLicense: true,
        }),
      },
    });

    expect(decision.allowed).toBe(true);
    expect(decision.statusCode).toBe(200);
  });

  test("coach tidak dapat membuka file coach lain", async () => {
    const decision = await authorizePrivateStorageAccess({
      role: "COACH",
      userId: "coach-user-1",
      fileUrl: "/api/storage/uploads/coach_license_coach-user-1_123.jpg",
      lookup: {
        ...baseLookup,
        findCoachAsset: async () => ({
          id: "coach-profile-2",
          userId: "coach-user-2",
          isLicense: true,
        }),
      },
    });

    expect(decision.allowed).toBe(false);
    expect(decision.statusCode).toBe(403);
  });
});
