import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const ALLOWED_TYPES = new Map([
  [".png",  "image/png"],
  [".jpg",  "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".pdf",  "application/pdf"],
]);

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
      return NextResponse.json(
        { error: "Format file tidak didukung. Gunakan PNG, JPG, atau PDF." },
        { status: 400 }
      );
    }

    // Validasi MIME type aktual (bukan hanya ekstensi)
    if (file.type && file.type !== expectedMime) {
      return NextResponse.json(
        { error: "Tipe file tidak sesuai dengan ekstensinya. Pastikan file tidak dimodifikasi." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueName = `${Date.now()}-${safeName}`;
    await writeFile(join(uploadDir, uniqueName), buffer);

    return NextResponse.json({ url: `/uploads/${uniqueName}` });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Unggahan gagal. Coba lagi atau hubungi administrator." },
      { status: 500 }
    );
  }
}
