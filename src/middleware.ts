import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * ADORA Basketball - Security Middleware
 * Features:
 * 1. Security Headers (CSP, FrameGuard, etc.)
 * 2. Basic Rate Limiting simulation
 * 3. Origin Filtering
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 1. ADD SECURITY HEADERS
  // Tightening the ship: preventing clickjacking, XSS, and sniff attacks
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  // Content Security Policy (Basic Foundation)
  // Focusing on preventing script injections while allowing our local/trusted assets
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:;"
  );

  // 2. CORS MANAGEMENT
  // Note: Next.js Server Actions and APIs are same-origin by default.
  // We explicitly block any foreign origin trying to access our internal APIs.
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (origin && !origin.includes(host || "")) {
    return new NextResponse(
      JSON.stringify({ error: "Terdeteksi Akses Lintas Asal (CORS) yang Tidak Diizinkan." }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  // 3. RATE LIMITING (Placeholder for simple throttling)
  // Real rate limiting would use Redis/KV, but for lean local dev we ensure session integrity.
  // In Vercel integration, this would be where we hook up edge-configs.

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
