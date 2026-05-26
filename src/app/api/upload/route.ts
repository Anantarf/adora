import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { fileTypeFromBuffer } from "file-type";
import { consumeFixedWindowLimit } from "@/lib/shared-rate-limit";

const MAX_SIZE_BYTES = 2 * 1024 * 1024;
const RATE_LIMIT = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;
const UPLOAD_RATE_LIMIT_NAMESPACE = "upload-api";

const ALLOWED_TYPES = new Map<string, string>([
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".pdf", "application/pdf"],
]);

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabase = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
);

function getClientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
}

function resolveUploadName(assetKey: FormDataEntryValue | null, ext: string): string {
  if (typeof assetKey === "string" && assetKey.trim()) {
    return `${assetKey.trim()}${ext}`;
  }

  return `upload_${crypto.randomUUID()}${ext}`;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const ip = getClientIp(req);
  const rateLimitResult = await consumeFixedWindowLimit(
    UPLOAD_RATE_LIMIT_NAMESPACE,
    ip,
    RATE_LIMIT,
    RATE_LIMIT_WINDOW_MS,
  );

  if (!rateLimitResult.allowed) {
    return NextResponse.json({ error: "Too many requests, please try again later." }, { status: 429 });
  }

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
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
    const { error } = await supabase.storage.from("uploads").upload(uniqueName, buffer, {
      contentType: file.type || expectedMime,
      cacheControl: "3600",
      upsert: true,
    });

    if (error) {
      console.error("Supabase storage error:", error);
      throw error;
    }

    const { data: publicUrlData } = supabase.storage.from("uploads").getPublicUrl(uniqueName);
    return NextResponse.json({ url: publicUrlData.publicUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Unggahan gagal. Coba lagi atau hubungi administrator." }, { status: 500 });
  }
}
