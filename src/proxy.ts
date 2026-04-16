import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { LRUCache } from "lru-cache";

const LOGIN_WINDOW_MS = 60 * 1000;
const MAX_LOGIN_ATTEMPTS_PER_MINUTE = process.env.NODE_ENV === "development" ? 20 : 5;
const MAX_API_REQUESTS_PER_MINUTE = 120;

const loginRateLimit = new LRUCache<string, number>({
  max: 1000,
  ttl: LOGIN_WINDOW_MS,
});

const apiRateLimit = new LRUCache<string, number>({
  max: 2000,
  ttl: LOGIN_WINDOW_MS,
});

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfIp = request.headers.get("cf-connecting-ip");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "127.0.0.1";
  }

  return realIp ?? cfIp ?? "127.0.0.1";
}

/**
 * ADORA Basketball - Global Unified Middleware
 * Menggabungkan Security Headers dan Proteksi Role-Based (NextAuth).
 */
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const ip = getClientIp(request);
  const isLoginAction = request.method === "POST" && pathname.startsWith("/api/auth/callback/credentials");
  const isApiRoute = pathname.startsWith("/api/");

  // --- 0. LAYER RATE LIMITING ---
  if (isLoginAction) {
    const loginAttemptCount = (loginRateLimit.get(ip) ?? 0) + 1;
    loginRateLimit.set(ip, loginAttemptCount);

    if (loginAttemptCount > MAX_LOGIN_ATTEMPTS_PER_MINUTE) {
      return new NextResponse("Terlalu banyak percobaan login. Harap tunggu 1 menit.", {
        status: 429,
        headers: { "Content-Type": "text/plain" },
      });
    }
  }

  if (isApiRoute) {
    const apiRequestCount = (apiRateLimit.get(ip) ?? 0) + 1;
    apiRateLimit.set(ip, apiRequestCount);

    if (apiRequestCount > MAX_API_REQUESTS_PER_MINUTE) {
      return new NextResponse("Rate limit terlampaui.", { status: 429 });
    }
  }

  const response = NextResponse.next();

  // --- 1. LAYER KEAMANAN (Global) ---
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  response.headers.set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:;");

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
      return new NextResponse(JSON.stringify({ error: "Terdeteksi Akses Lintas Asal (CORS) yang Tidak Diizinkan." }), { status: 403, headers: { "Content-Type": "application/json" } });
    }
  }

  // --- 3. LAYER OTORISASI (Role-Based Access Control) ---
  const isProtectedRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/parent") || pathname.startsWith("/api/admin") || pathname.startsWith("/api/parent");

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
    if (pathname.startsWith("/parent") && token.role !== "PARENT" && token.role !== "ADMIN") {
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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|map|txt|xml|woff|woff2)$).*)"],
};
