import type { NextConfig } from "next";

const disableOptimizePackageImports = process.env.NEXT_DISABLE_OPTIMIZE_PACKAGE_IMPORTS === "1";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@prisma/client", "prisma", "bcryptjs", "bcrypt", "sharp"],
  experimental: disableOptimizePackageImports
    ? {}
    : {
        optimizePackageImports: ["lucide-react", "recharts", "@fullcalendar/react", "@fullcalendar/daygrid", "@fullcalendar/timegrid", "@fullcalendar/interaction"],
      },
  images: {
    formats: ["image/avif", "image/webp"],
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
