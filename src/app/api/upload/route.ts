import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const ALLOWED_TYPES = new Map([
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".pdf", "application/pdf"],
]);

// Initialize Supabase Client.
// We use SERVICE_ROLE_KEY to bypass RLS since this is a server-side route protected by next-auth.
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabase = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || "", // Harus di set di .env lokal maupun Vercel
);

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
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
      return NextResponse.json({ error: "Ukuran file melebihi batas maksimal 5MB." }, { status: 400 });
    }

    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    const expectedMime = ALLOWED_TYPES.get(ext);
    if (!expectedMime) {
      return NextResponse.json({ error: "Format file tidak didukung. Gunakan PNG, JPG, atau PDF." }, { status: 400 });
    }

    if (file.type && file.type !== expectedMime) {
      return NextResponse.json({ error: "Tipe file tidak sesuai dengan ekstensinya. Pastikan file tidak dimodifikasi." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueName = `${Date.now()}-${safeName}`;

    // Upload to Supabase Storage (Bucket name: "uploads")
    const { data, error } = await supabase.storage.from("uploads").upload(uniqueName, buffer, {
      contentType: file.type || expectedMime,
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      console.error("Supabase storage error:", error);
      throw error;
    }

    // Get Public URL
    const { data: publicUrlData } = supabase.storage.from("uploads").getPublicUrl(uniqueName);

    return NextResponse.json({ url: publicUrlData.publicUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Unggahan gagal. Coba lagi atau hubungi administrator." }, { status: 500 });
  }
}
