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
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  turbopack: {},
};

export default nextConfig;
