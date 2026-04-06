import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * ADORA Basketball - Global Unified Middleware
 * Menggabungkan Security Headers (dari proxy) dan Proteksi Kelompok (NextAuth).
 */
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const response = NextResponse.next();

  // --- 1. LAYER KEAMANAN (Global) ---
  // Kita tambahkan header keamanan ke setiap response
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );
  
  // Content Security Policy (Dasar)
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:;"
  );

  // --- 2. LAYER CORS ---
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && !origin.includes(host || "")) {
    // Abaikan CORS yang tidak dikenal untuk rute internal
    if (pathname.startsWith("/api/")) {
        return new NextResponse(
          JSON.stringify({ error: "Terdeteksi Akses Lintas Asal (CORS) yang Tidak Diizinkan." }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
    }
  }

  // --- 3. LAYER OTORISASI (Role-Based Access Control) ---
  // Cek jika rute ini butuh proteksi (dashboard, parent, api internal)
  const isProtectedRoute = 
    pathname.startsWith("/dashboard") || 
    pathname.startsWith("/parent") || 
    pathname.startsWith("/api/admin") || 
    pathname.startsWith("/api/parent");

  if (isProtectedRoute) {
    const token = await getToken({ 
        req: request,
        secret: process.env.NEXTAUTH_SECRET 
    });

    // A. Tidak Login -> Tendang ke Login Root
    if (!token) {
        const loginUrl = new URL("/", request.url);
        return NextResponse.redirect(loginUrl);
    }

    // B. Proteksi Admin (/dashboard)
    if (pathname.startsWith("/dashboard") && token.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/", request.url));
    }

    // C. Proteksi Parent (/parent)
    // Admin diperbolehkan akses rute orang tua untuk monitoring
    if (pathname.startsWith("/parent") && token.role !== "PARENT" && token.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

// Konfigurasi Matcher Terpadu
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api/auth (NextAuth)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
