import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

function buildCsp() {
  const scriptSrc = ["'self'", "'unsafe-inline'"];

  if (process.env.NODE_ENV !== "production") {
    scriptSrc.push("'unsafe-eval'");
  }

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.supabase.co",
    "connect-src 'self' ws: wss: https://*.supabase.co",
    "font-src 'self'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const csp = buildCsp();

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const isApiRoute = pathname.startsWith("/api/");
  const securedResponse = NextResponse.next();

  securedResponse.headers.set("X-Frame-Options", "DENY");
  securedResponse.headers.set("X-Content-Type-Options", "nosniff");
  securedResponse.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  securedResponse.headers.set("X-XSS-Protection", "1; mode=block");
  securedResponse.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  securedResponse.headers.set("Content-Security-Policy", csp);

  if (process.env.NODE_ENV === "production") {
    securedResponse.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
  }

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  const isCrossOrigin = (() => {
    if (!origin || !host) {
      return false;
    }

    try {
      return new URL(origin).hostname !== host.split(":")[0];
    } catch {
      return true;
    }
  })();

  if (isCrossOrigin) {
    const isReadOnly = request.method === "GET" || request.method === "HEAD";
    if (!isReadOnly) {
      return new NextResponse(
        JSON.stringify({ error: "Akses lintas asal (CORS) tidak diizinkan." }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }
  }

  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/coach") ||
    pathname.startsWith("/parent") ||
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/api/parent") ||
    pathname.startsWith("/api/coach");

  if (isProtectedRoute) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    const handleUnauthorized = (redirectUrl: string) =>
      isApiRoute
        ? new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          })
        : NextResponse.redirect(new URL(redirectUrl, request.url));

    if (!token) {
      return handleUnauthorized("/login");
    }

    if (pathname.startsWith("/dashboard") && token.role !== "ADMIN") {
      return handleUnauthorized(token.role === "PARENT" ? "/parent" : "/login");
    }

    if (pathname.startsWith("/coach") && token.role !== "COACH") {
      return handleUnauthorized(token.role === "ADMIN" ? "/dashboard" : "/login");
    }

    if (
      pathname.startsWith("/parent") &&
      token.role !== "PARENT" &&
      token.role !== "ADMIN"
    ) {
      return handleUnauthorized("/login");
    }

    securedResponse.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    securedResponse.headers.set("Pragma", "no-cache");
    securedResponse.headers.set("Expires", "0");
  }

  return securedResponse;
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|map|txt|xml|woff|woff2)$).*)",
  ],
};
