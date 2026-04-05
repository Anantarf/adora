import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "prisma", "bcrypt"],
  turbopack: {},
};

export default nextConfig;
