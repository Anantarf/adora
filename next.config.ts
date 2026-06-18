import type { NextConfig } from "next";

const disableOptimizePackageImports = process.env.NEXT_DISABLE_OPTIMIZE_PACKAGE_IMPORTS === "1";
const supabaseOrigin = (() => {
  const configuredUrl = process.env.SUPABASE_URL?.trim();
  if (!configuredUrl) {
    return null;
  }

  try {
    return new URL(configuredUrl).origin;
  } catch {
    return null;
  }
})();
const remoteStorageSources = ["https://*.supabase.co", supabaseOrigin].filter(Boolean).join(" ");

const staticCsp = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${remoteStorageSources}`,
  `connect-src 'self' ${remoteStorageSources}`,
  "font-src 'self'",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "report-uri /api/csp-report",
  "report-to csp-endpoint",
].join("; ");

const commonSecurityHeaders = [
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const staticCspHeader = { key: "Content-Security-Policy", value: staticCsp };

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: commonSecurityHeaders,
      },
      {
        source: "/_next/:path*",
        headers: [staticCspHeader],
      },
      {
        source: "/images/:path*",
        headers: [staticCspHeader],
      },
      {
        source: "/favicon.ico",
        headers: [staticCspHeader],
      },
      {
        source: "/logo-adora.png",
        headers: [staticCspHeader],
      },
      {
        source: "/logo-adora-full.png",
        headers: [staticCspHeader],
      },
      {
        source: "/logo-new.svg",
        headers: [staticCspHeader],
      },
      {
        source: "/template-rapor-sd.pdf",
        headers: [staticCspHeader],
      },
      {
        source: "/robots.txt",
        headers: [staticCspHeader],
      },
      {
        source: "/.well-known/security.txt",
        headers: [staticCspHeader],
      },
      {
        source: "/api/auth/:path*",
        headers: [staticCspHeader],
      },
    ];
  },
  serverExternalPackages: ["@prisma/client", "prisma", "bcryptjs", "bcrypt", "sharp"],
  experimental: disableOptimizePackageImports
    ? {}
    : {
        optimizePackageImports: ["lucide-react", "recharts", "@fullcalendar/react", "@fullcalendar/daygrid", "@fullcalendar/timegrid", "@fullcalendar/interaction"],
      },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [40, 50, 75],
    deviceSizes: [480, 640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co" /* Supabase Storage Domain */,
        port: "",
        pathname: "/**",
      },
    ],
  },
  turbopack: {},
};

export default nextConfig;
