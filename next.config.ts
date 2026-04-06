import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "prisma", "bcrypt"],
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', '@fullcalendar/react', '@fullcalendar/daygrid', '@fullcalendar/timegrid', '@fullcalendar/interaction'],
  },
  turbopack: {},
};

export default nextConfig;
