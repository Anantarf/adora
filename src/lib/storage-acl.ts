export type StorageAclRole = "ADMIN" | "PARENT";

export type StorageAclLookup = {
  findPlayerAsset(fileUrl: string): Promise<{ id: string } | null>;
  findCertificate(fileUrl: string): Promise<{ id: string; playerId: string } | null>;
  isPlayerOwnedByParent(playerId: string, parentId: string): Promise<boolean>;
};

export type StorageAclDecision = {
  allowed: boolean;
  statusCode: number;
  message: string;
};

export async function authorizePrivateStorageAccess(input: { role: StorageAclRole; userId: string; fileUrl: string; lookup: StorageAclLookup }): Promise<StorageAclDecision> {
  if (input.role === "ADMIN") {
    return { allowed: true, statusCode: 200, message: "allowed" };
  }

  const playerAsset = await input.lookup.findPlayerAsset(input.fileUrl);
  if (playerAsset) {
    return {
      allowed: false,
      statusCode: 403,
      message: "File pemain hanya bisa dibuka oleh admin.",
    };
  }

  const certificate = await input.lookup.findCertificate(input.fileUrl);
  if (!certificate) {
    return {
      allowed: false,
      statusCode: 404,
      message: "File tidak ditemukan.",
    };
  }

  const owned = await input.lookup.isPlayerOwnedByParent(certificate.playerId, input.userId);
  if (!owned) {
    return {
      allowed: false,
      statusCode: 403,
      message: "File ini bukan milik akun parent ini.",
    };
  }

  return {
    allowed: true,
    statusCode: 200,
    message: "allowed",
  };
}
