import { describe, expect, test } from "vitest";
import { authorizePrivateStorageAccess } from "@/lib/storage-acl";

describe("Private storage ACL", () => {
  test("admin dapat membuka semua file", async () => {
    const decision = await authorizePrivateStorageAccess({
      role: "ADMIN",
      userId: "admin-1",
      fileUrl: "/api/storage/uploads/certificate-001.pdf",
      lookup: {
        findPlayerAsset: async () => ({ id: "player-1" }),
        findCertificate: async () => ({ id: "cert-1", playerId: "player-1", groupId: null }),
        isPlayerOwnedByParent: async () => false,
        isParentPlayerInGroup: async () => false,
      },
    });

    expect(decision.allowed).toBe(true);
    expect(decision.statusCode).toBe(200);
  });

  test("parent tidak dapat membuka asset pemain", async () => {
    const decision = await authorizePrivateStorageAccess({
      role: "PARENT",
      userId: "parent-1",
      fileUrl: "/api/storage/uploads/player-photo.png",
      lookup: {
        findPlayerAsset: async () => ({ id: "player-1" }),
        findCertificate: async () => null,
        isPlayerOwnedByParent: async () => false,
        isParentPlayerInGroup: async () => false,
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
        findPlayerAsset: async () => null,
        findCertificate: async () => ({ id: "cert-2", playerId: "player-2", groupId: null }),
        isPlayerOwnedByParent: async (playerId, parentId) => playerId === "player-2" && parentId === "parent-1",
        isParentPlayerInGroup: async () => false,
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
      lookup: {
        findPlayerAsset: async () => null,
        findCertificate: async () => null,
        isPlayerOwnedByParent: async () => false,
      },
    });

    expect(decision.allowed).toBe(false);
    expect(decision.statusCode).toBe(404);
  });
});
