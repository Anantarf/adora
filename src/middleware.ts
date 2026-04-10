import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * ADORA Basketball - Global Unified Middleware
 * Menggabungkan Security Headers dan Proteksi Role-Based (NextAuth).
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const response = NextResponse.next();

  // --- 1. LAYER KEAMANAN (Global) ---
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:;"
  );

  // --- 2. LAYER CORS ---
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  const isCrossOrigin = (() => {
    if (!origin || !host) return false;
    try {
      return new URL(origin).hostname !== host.split(":")[0];
    } catch {
      return true;
    }
  })();
  if (isCrossOrigin) {
    if (pathname.startsWith("/api/")) {
      return new NextResponse(
        JSON.stringify({ error: "Terdeteksi Akses Lintas Asal (CORS) yang Tidak Diizinkan." }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // --- 3. LAYER OTORISASI (Role-Based Access Control) ---
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/parent") ||
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/api/parent");

  if (isProtectedRoute) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // A. Tidak Login -> Redirect ke Login
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // B. Proteksi Admin (/dashboard) — non-admin dikembalikan ke portal orang tua
    if (pathname.startsWith("/dashboard") && token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/parent", request.url));
    }

    // C. Proteksi Parent (/parent) — hanya PARENT dan ADMIN yang boleh
    if (
      pathname.startsWith("/parent") &&
      token.role !== "PARENT" &&
      token.role !== "ADMIN"
    ) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Anti-bfcache: paksa hit server agar logout benar-benar bekerja
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

  return response;
}

// Konfigurasi Matcher: semua route kecuali static & auth NextAuth
export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
