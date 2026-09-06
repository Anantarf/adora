import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const SECURITY_HEADER_VALUES = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

function getSupabaseOrigin() {
  const configuredUrl = process.env.SUPABASE_URL?.trim();
  if (!configuredUrl) {
    return null;
  }

  try {
    return new URL(configuredUrl).origin;
  } catch {
    return null;
  }
}

function buildCsp(nonce: string) {
  const scriptSrc = ["'self'", `'nonce-${nonce}'`];
  const supabaseOrigin = getSupabaseOrigin();
  const remoteStorageSources = ["https://*.supabase.co"];

  if (supabaseOrigin && !remoteStorageSources.includes(supabaseOrigin)) {
    remoteStorageSources.push(supabaseOrigin);
  }

  if (process.env.NODE_ENV !== "production") {
    scriptSrc.push("'unsafe-inline'");
    scriptSrc.push("'unsafe-eval'");
  }

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${remoteStorageSources.join(" ")}`,
    `connect-src 'self' ws: wss: ${remoteStorageSources.join(" ")}`,
    "font-src 'self'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "report-uri /api/csp-report",
    "report-to csp-endpoint",
  ].join("; ");
}

function applySecurityHeaders(response: NextResponse, csp: string) {
  response.headers.set("Reporting-Endpoints", `csp-endpoint="/api/csp-report"`);

  for (const [key, value] of Object.entries(SECURITY_HEADER_VALUES)) {
    response.headers.set(key, value);
  }

  response.headers.set("Content-Security-Policy", csp);

  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
  }
}

function securedJsonResponse(body: unknown, status: number, csp: string) {
  const response = NextResponse.json(body, { status });
  applySecurityHeaders(response, csp);
  return response;
}

function securedRedirectResponse(url: URL, csp: string) {
  const response = NextResponse.redirect(url);
  applySecurityHeaders(response, csp);
  return response;
}

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce);

  if (pathname.startsWith("/api/auth")) {
    const response = NextResponse.next({
      request: {
        headers: new Headers(request.headers),
      },
    });
    applySecurityHeaders(response, csp);
    return response;
  }

  const isApiRoute = pathname.startsWith("/api/");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  const securedResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  applySecurityHeaders(securedResponse, csp);

  const origin = request.headers.get("origin");
  const isCrossOrigin = (() => {
    if (!origin) {
      return false;
    }

    try {
      const originUrl = new URL(origin);
      const expectedUrl = new URL(request.nextUrl.origin);
      const forwardedProto = request.headers.get("x-forwarded-proto");
      const expectedScheme = forwardedProto ? `${forwardedProto}:` : expectedUrl.protocol;
      const expectedHost = request.headers.get("host") || expectedUrl.host;

      const normalizedExpectedOrigin = `${expectedScheme}//${expectedHost}`.toLowerCase();
      return originUrl.origin.toLowerCase() !== normalizedExpectedOrigin;
    } catch {
      return true;
    }
  })();

  if (isCrossOrigin) {
    const isReadOnly = request.method === "GET" || request.method === "HEAD";
    if (!isReadOnly) {
      return securedJsonResponse({ error: "Akses lintas asal (CORS) tidak diizinkan." }, 403, csp);
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
        ? securedJsonResponse({ error: "Unauthorized" }, 401, csp)
        : securedRedirectResponse(new URL(redirectUrl, request.url), csp);

    if (!token) {
      return handleUnauthorized("/login");
    }

    if (
      (pathname.startsWith("/dashboard") || pathname.startsWith("/api/admin")) &&
      token.role !== "ADMIN"
    ) {
      return handleUnauthorized(token.role === "COACH" ? "/coach" : "/parent");
    }

    if (
      (pathname.startsWith("/coach") || pathname.startsWith("/api/coach")) &&
      token.role !== "COACH"
    ) {
      return handleUnauthorized(token.role === "ADMIN" ? "/dashboard" : "/parent");
    }

    if (
      (pathname.startsWith("/parent") || pathname.startsWith("/api/parent")) &&
      token.role !== "PARENT"
    ) {
      return handleUnauthorized(token.role === "ADMIN" ? "/dashboard" : "/coach");
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
