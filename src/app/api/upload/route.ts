import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-error";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { fileTypeFromBuffer } from "file-type";
import { consumeFixedWindowLimit } from "@/lib/shared-rate-limit";
import { withTimeout } from "@/lib/async-utils";
import { RATE_LIMIT_POLICIES } from "@/lib/constants/rate-limits";
import { recordOperationalError, recordOperationalWarning } from "@/lib/observability";
import { buildPrivateStorageUrl, getPrivateUploadBucket } from "@/lib/supabase-storage";
import { getClientIp } from "@/lib/client-ip";

const MAX_SIZE_BYTES = 2 * 1024 * 1024;
const STORAGE_TIMEOUT_MS = 15_000;

const ALLOWED_TYPES = new Map<string, string>([
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".pdf", "application/pdf"],
]);

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg"] as const;
const IMAGE_AND_PDF_EXTENSIONS = [...IMAGE_EXTENSIONS, ".pdf"] as const;

type UploadPolicy = {
  allowedRoles: Array<"ADMIN" | "COACH">;
  match: (assetKey: string) => boolean;
  allowedExtensions: readonly string[];
  maxSizeBytes?: number;
};

const UPLOAD_POLICIES: UploadPolicy[] = [
  {
    allowedRoles: ["ADMIN", "COACH"],
    match: (assetKey: string) => /^coach_photo_[A-Za-z0-9_-]+_\d+$/.test(assetKey),
    allowedExtensions: IMAGE_EXTENSIONS,
  },
  {
    allowedRoles: ["ADMIN", "COACH"],
    match: (assetKey: string) => /^coach_license_[A-Za-z0-9_-]+_\d+$/.test(assetKey),
    allowedExtensions: IMAGE_EXTENSIONS,
  },
  {
    allowedRoles: ["ADMIN", "COACH"],
    match: (assetKey: string) => /^coach_signature_[A-Za-z0-9_-]+_\d+$/.test(assetKey),
    allowedExtensions: [".png"] as const,
    maxSizeBytes: 300 * 1024,
  },
  {
    allowedRoles: ["ADMIN"],
    match: (assetKey: string) => /^player_photo_\d+$/.test(assetKey),
    allowedExtensions: IMAGE_EXTENSIONS,
  },
  {
    allowedRoles: ["ADMIN"],
    match: (assetKey: string) => /^player_signature_\d+$/.test(assetKey),
    allowedExtensions: IMAGE_EXTENSIONS,
  },
  {
    allowedRoles: ["ADMIN"],
    match: (assetKey: string) => /^report_archive_[A-Za-z0-9_-]+_[A-Za-z0-9_-]+_\d+$/.test(assetKey),
    allowedExtensions: IMAGE_AND_PDF_EXTENSIONS,
  },
  {
    allowedRoles: ["ADMIN"],
    match: (assetKey: string) => assetKey === "rapor_header_url",
    allowedExtensions: IMAGE_AND_PDF_EXTENSIONS,
    maxSizeBytes: 1 * 1024 * 1024,
  },
  {
    allowedRoles: ["ADMIN"],
    match: (assetKey: string) =>
      assetKey === "rapor_ceo_sign_url" ||
      assetKey === "rapor_coach_sign_url" ||
      assetKey === "rapor_stamp_url",
    allowedExtensions: [".png"] as const,
  },
];

function getSupabaseUrl() {
  const serverUrl = process.env.SUPABASE_URL?.trim();
  if (serverUrl) {
    return serverUrl;
  }

  return "";
}

function getSupabaseClient() {
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("UPLOAD_STORAGE_NOT_CONFIGURED");
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

function resolveUploadTarget(
  assetKey: FormDataEntryValue | null,
  ext: string,
  role: "ADMIN" | "COACH",
) {
  if (typeof assetKey !== "string" || !assetKey.trim()) {
    throw new Error("UPLOAD_ASSET_KEY_REQUIRED");
  }

  const normalizedAssetKey = assetKey.trim();
  const policy = UPLOAD_POLICIES.find((item) => item.match(normalizedAssetKey));
  if (!policy) {
    throw new Error("UPLOAD_ASSET_KEY_INVALID");
  }

  if (!policy.allowedRoles.includes(role)) {
    throw new Error("UPLOAD_ASSET_ROLE_FORBIDDEN");
  }

  if (!policy.allowedExtensions.includes(ext)) {
    throw new Error("UPLOAD_ASSET_EXTENSION_INVALID");
  }

  return {
    assetKey: normalizedAssetKey,
    maxSizeBytes: policy.maxSizeBytes ?? MAX_SIZE_BYTES,
    objectKey: `${normalizedAssetKey}_${crypto.randomUUID()}${ext}`,
  };
}
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "COACH")) {
    return apiError("UNAUTHORIZED", "Tidak diizinkan.", 401);
  }

  const ip = getClientIp(req);
  const rateLimitResult = await consumeFixedWindowLimit(RATE_LIMIT_POLICIES.upload.namespace, ip, RATE_LIMIT_POLICIES.upload.limit, RATE_LIMIT_POLICIES.upload.windowMs);

  if (!rateLimitResult.allowed) {
    await recordOperationalWarning({
      source: "upload-api",
      message: "Upload rate limit exceeded",
      statusCode: 429,
      metadata: { ip, count: rateLimitResult.count },
    });
    return apiError("RATE_LIMITED", "Too many requests, please try again later.", 429);
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return apiError("BAD_REQUEST", "Tidak ada file yang diunggah.", 400);
    }

    if (file.size === 0) {
      return apiError("BAD_REQUEST", "File tidak boleh kosong.", 400);
    }

    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    const expectedMime = ALLOWED_TYPES.get(ext);
    if (!expectedMime) {
      return apiError("BAD_REQUEST", "Format file tidak didukung. Gunakan PNG, JPG, atau PDF.", 400);
    }

    if (file.type && file.type !== expectedMime) {
      return apiError("BAD_REQUEST", "Tipe file tidak sesuai dengan ekstensinya. Pastikan file tidak dimodifikasi.", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const detected = await fileTypeFromBuffer(buffer);
    if (!detected || detected.mime !== expectedMime) {
      return apiError("BAD_REQUEST", "Tipe file tidak cocok dengan konten aktual.", 400);
    }

    const uploadTarget = resolveUploadTarget(
      formData.get("assetKey"),
      ext,
      session.user.role,
    );

    if (file.size > MAX_SIZE_BYTES) {
      return apiError("BAD_REQUEST", "Ukuran file melebihi batas maksimal 2MB.", 400);
    }

    if (file.size > uploadTarget.maxSizeBytes) {
      const maxSizeMb = uploadTarget.maxSizeBytes >= 1024 * 1024
        ? `${uploadTarget.maxSizeBytes / (1024 * 1024)}MB`
        : `${Math.round(uploadTarget.maxSizeBytes / 1024)}KB`;
      return NextResponse.json({
        error: `Ukuran file melebihi batas maksimal ${maxSizeMb} untuk aset ini.`,
      }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    const { error } = await withTimeout(
      supabase.storage.from(getPrivateUploadBucket()).upload(uploadTarget.objectKey, buffer, {
        contentType: file.type || expectedMime,
        cacheControl: "3600",
        upsert: false,
      }),
      STORAGE_TIMEOUT_MS,
      "UPLOAD_STORAGE_TIMEOUT",
    );

    if (error) {
      throw error;
    }

    return NextResponse.json({ url: buildPrivateStorageUrl(uploadTarget.objectKey) });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UPLOAD_ASSET_KEY_REQUIRED") {
        return apiError("BAD_REQUEST", "Jenis unggahan tidak dikenali.", 400);
      }

      if (error.message === "UPLOAD_ASSET_KEY_INVALID") {
        return apiError("BAD_REQUEST", "Jenis unggahan tidak diizinkan.", 400);
      }

      if (error.message === "UPLOAD_ASSET_EXTENSION_INVALID") {
        return apiError("BAD_REQUEST", "Format file tidak sesuai untuk jenis unggahan ini.", 400);
      }

      if (error.message === "UPLOAD_ASSET_ROLE_FORBIDDEN") {
        return apiError("FORBIDDEN", "Akun ini tidak diizinkan mengunggah jenis file tersebut.", 403);
      }

      if (error.message === "UPLOAD_STORAGE_NOT_CONFIGURED") {
        await recordOperationalError({
          source: "upload-api",
          message: "Upload storage is not configured",
          error,
          statusCode: 503,
        });
        return apiError("SERVICE_UNAVAILABLE", "Storage upload belum dikonfigurasi di server.", 503);
      }

      if (error.message === "UPLOAD_STORAGE_TIMEOUT") {
        await recordOperationalError({
          source: "upload-api",
          message: "Upload storage request timed out",
          error,
          statusCode: 503,
          durationMs: STORAGE_TIMEOUT_MS,
        });
        return apiError("SERVICE_UNAVAILABLE", "Storage upload sedang lambat atau tidak merespons. Coba lagi sebentar lagi.", 503);
      }
    }

    await recordOperationalError({
      source: "upload-api",
      message: "Upload request failed",
      error,
      statusCode: 500,
    });

    return apiError("INTERNAL_ERROR", "Unggahan gagal. Coba lagi atau hubungi administrator.", 500);
  }
}
