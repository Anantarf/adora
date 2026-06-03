export type StorageAclRole = "ADMIN" | "PARENT" | "COACH";

export type StorageAclLookup = {
  findCoachLicense(fileUrl: string): Promise<{ id: string } | null>;
  findPlayerAsset(fileUrl: string): Promise<{ id: string } | null>;
  findCertificate(fileUrl: string): Promise<{ id: string; playerId: string } | null>;
  findReportArchive(fileUrl: string): Promise<{ id: string; playerId: string } | null>;
  isCoachVisibleToParent(coachProfileId: string, parentId: string): Promise<boolean>;
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

  if (input.role === "COACH") {
    return {
      allowed: false,
      statusCode: 403,
      message: "Akses file privat untuk coach belum diaktifkan pada batch ini.",
    };
  }

  const playerAsset = await input.lookup.findPlayerAsset(input.fileUrl);
  if (playerAsset) {
    return {
      allowed: false,
      statusCode: 403,
      message: "File pemain hanya bisa dibuka oleh admin.",
    };
  }

  const coachLicense = await input.lookup.findCoachLicense(input.fileUrl);
  if (coachLicense) {
    const allowed = await input.lookup.isCoachVisibleToParent(coachLicense.id, input.userId);
    return {
      allowed,
      statusCode: allowed ? 200 : 403,
      message: allowed ? "allowed" : "Lisensi coach ini tidak terhubung ke pemain parent ini.",
    };
  }

  const reportArchive = await input.lookup.findReportArchive(input.fileUrl);
  if (reportArchive) {
    const owned = await input.lookup.isPlayerOwnedByParent(reportArchive.playerId, input.userId);
    return {
      allowed: owned,
      statusCode: owned ? 200 : 403,
      message: owned ? "allowed" : "Arsip rapor ini bukan milik akun parent ini.",
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
