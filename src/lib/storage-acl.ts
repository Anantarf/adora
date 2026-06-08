import { isExpectedPrivateUploadUrl } from "@/lib/private-upload";

export type StorageAclRole = "ADMIN" | "PARENT" | "COACH";

export type StorageAclLookup = {
  findCoachAsset(fileUrl: string): Promise<{ id: string; userId: string; isLicense: boolean } | null>;
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
    const isOwnCoachUpload = isExpectedPrivateUploadUrl(input.fileUrl, {
      allowedPrefixes: [
        `coach_photo_${input.userId}_`,
        `coach_license_${input.userId}_`,
        `coach_signature_${input.userId}_`,
      ],
      allowedExtensions: [".png", ".jpg", ".jpeg"],
    });

    if (!isOwnCoachUpload) {
      return {
        allowed: false,
        statusCode: 403,
        message: "File privat ini bukan unggahan yang terikat ke akun coach ini.",
      };
    }

    const coachAsset = await input.lookup.findCoachAsset(input.fileUrl);
    if (coachAsset && coachAsset.userId === input.userId) {
      return { allowed: true, statusCode: 200, message: "allowed" };
    }

    return {
      allowed: false,
      statusCode: 403,
      message: "File privat ini bukan milik akun coach ini.",
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

  const coachAsset = await input.lookup.findCoachAsset(input.fileUrl);
  if (coachAsset) {
    const allowed = await input.lookup.isCoachVisibleToParent(coachAsset.id, input.userId);
    return {
      allowed,
      statusCode: allowed ? 200 : 403,
      message: allowed
        ? "allowed"
        : coachAsset.isLicense
          ? "Lisensi coach ini tidak terhubung ke pemain parent ini."
          : "Foto coach ini tidak terhubung ke pemain parent ini.",
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
