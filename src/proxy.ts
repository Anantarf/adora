import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { consumeFixedWindowLimit } from "@/lib/shared-rate-limit";

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_API_REQUESTS_PER_MINUTE = 120;
const API_RATE_LIMIT_NAMESPACE = "proxy-api";

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfIp = request.headers.get("cf-connecting-ip");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || "127.0.0.1";
  return realIp ?? cfIp ?? "127.0.0.1";
}

// unsafe-inline dipertahankan untuk kompatibilitas Next.js hydration.
// strict-dynamic membuat browser modern mengabaikan unsafe-inline secara otomatis,
// sehingga CSP tetap lebih ketat tanpa memerlukan nonce setup di layout.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co",
  "connect-src 'self' ws: wss: https://*.supabase.co",
  "font-src 'self'",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

/**
 * ADORA Basketball — Global Unified Middleware
 * Rate limiting, security headers, CORS, dan role-based access control.
 */
export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const ip = getClientIp(request);
  const isApiRoute = pathname.startsWith("/api/");
  const shouldSkipSharedApiLimit =
    pathname === "/api/analytics/web-vitals" ||
    pathname === "/api/health/db" ||
    pathname === "/api/health/observability";

  // --- 0. RATE LIMITING ---
  if (isApiRoute && !shouldSkipSharedApiLimit) {
    try {
      const limitResult = await consumeFixedWindowLimit(
        API_RATE_LIMIT_NAMESPACE,
        ip,
        MAX_API_REQUESTS_PER_MINUTE,
        RATE_LIMIT_WINDOW_MS,
      );

      if (!limitResult.allowed) {
        return new NextResponse("Rate limit terlampaui.", { status: 429 });
      }
    } catch (error) {
      console.error("[PROXY_RATE_LIMIT_ERROR]", {
        ip,
        pathname,
        error,
      });
    }
  }

  const response = NextResponse.next();

  // --- 1. SECURITY HEADERS ---
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Content-Security-Policy", CSP);
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }

  // --- 2. CORS ---
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  const isCrossOrigin = (() => {
    if (!origin || !host) return false;
    try { return new URL(origin).hostname !== host.split(":")[0]; }
    catch { return true; }
  })();
  if (isCrossOrigin) {
    const isReadOnly = request.method === "GET" || request.method === "HEAD";
    if (!isReadOnly) {
      return new NextResponse(
        JSON.stringify({ error: "Akses lintas asal (CORS) tidak diizinkan." }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // --- 3. ROLE-BASED ACCESS CONTROL ---
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/parent") ||
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/api/parent");

  if (isProtectedRoute) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    const handleUnauthorized = (redirectUrl: string) =>
      isApiRoute
        ? new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          })
        : NextResponse.redirect(new URL(redirectUrl, request.url));

    if (!token) return handleUnauthorized("/login");
    if (pathname.startsWith("/dashboard") && token.role !== "ADMIN") return handleUnauthorized("/parent");
    if (pathname.startsWith("/parent") && token.role !== "PARENT" && token.role !== "ADMIN") return handleUnauthorized("/login");

    // Anti-bfcache: paksa hit server agar logout benar-benar bekerja
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|map|txt|xml|woff|woff2)$).*)",
  ],
};
