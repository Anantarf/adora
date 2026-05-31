import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { fileTypeFromBuffer } from "file-type";
import { consumeFixedWindowLimit } from "@/lib/shared-rate-limit";
import { recordOperationalError, recordOperationalWarning } from "@/lib/observability";
import { buildPrivateStorageUrl, getPrivateUploadBucket } from "@/lib/supabase-storage";

const MAX_SIZE_BYTES = 2 * 1024 * 1024;
const RATE_LIMIT = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;
const UPLOAD_RATE_LIMIT_NAMESPACE = "upload-api";
const STORAGE_TIMEOUT_MS = 15_000;

const ALLOWED_TYPES = new Map<string, string>([
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".pdf", "application/pdf"],
]);

function getClientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
}

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

function resolveUploadName(assetKey: FormDataEntryValue | null, ext: string): string {
  if (typeof assetKey === "string" && assetKey.trim()) {
    return `${assetKey.trim()}${ext}`;
  }

  return `upload_${crypto.randomUUID()}${ext}`;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutCode: string) {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error(timeoutCode)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }

  const ip = getClientIp(req);
  const rateLimitResult = await consumeFixedWindowLimit(UPLOAD_RATE_LIMIT_NAMESPACE, ip, RATE_LIMIT, RATE_LIMIT_WINDOW_MS);

  if (!rateLimitResult.allowed) {
    await recordOperationalWarning({
      source: "upload-api",
      message: "Upload rate limit exceeded",
      statusCode: 429,
      metadata: { ip, count: rateLimitResult.count },
    });
    return NextResponse.json({ error: "Too many requests, please try again later." }, { status: 429 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Tidak ada file yang diunggah." }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "File tidak boleh kosong." }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: "Ukuran file melebihi batas maksimal 2MB." }, { status: 400 });
    }

    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    const expectedMime = ALLOWED_TYPES.get(ext);
    if (!expectedMime) {
      return NextResponse.json({ error: "Format file tidak didukung. Gunakan PNG, JPG, atau PDF." }, { status: 400 });
    }

    if (file.type && file.type !== expectedMime) {
      return NextResponse.json({ error: "Tipe file tidak sesuai dengan ekstensinya. Pastikan file tidak dimodifikasi." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const detected = await fileTypeFromBuffer(buffer);
    if (!detected || detected.mime !== expectedMime) {
      return NextResponse.json({ error: "Tipe file tidak cocok dengan konten aktual." }, { status: 400 });
    }

    const uniqueName = resolveUploadName(formData.get("assetKey"), ext);
    const supabase = getSupabaseClient();
    const { error } = await withTimeout(
      supabase.storage.from(getPrivateUploadBucket()).upload(uniqueName, buffer, {
        contentType: file.type || expectedMime,
        cacheControl: "3600",
        upsert: true,
      }),
      STORAGE_TIMEOUT_MS,
      "UPLOAD_STORAGE_TIMEOUT",
    );

    if (error) {
      throw error;
    }

    return NextResponse.json({ url: buildPrivateStorageUrl(uniqueName) });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UPLOAD_STORAGE_NOT_CONFIGURED") {
        await recordOperationalError({
          source: "upload-api",
          message: "Upload storage is not configured",
          error,
          statusCode: 503,
        });
        return NextResponse.json({ error: "Storage upload belum dikonfigurasi di server." }, { status: 503 });
      }

      if (error.message === "UPLOAD_STORAGE_TIMEOUT") {
        await recordOperationalError({
          source: "upload-api",
          message: "Upload storage request timed out",
          error,
          statusCode: 503,
          durationMs: STORAGE_TIMEOUT_MS,
        });
        return NextResponse.json({ error: "Storage upload sedang lambat atau tidak merespons. Coba lagi sebentar lagi." }, { status: 503 });
      }
    }

    await recordOperationalError({
      source: "upload-api",
      message: "Upload request failed",
      error,
      statusCode: 500,
    });

    return NextResponse.json({ error: "Unggahan gagal. Coba lagi atau hubungi administrator." }, { status: 500 });
  }
}
