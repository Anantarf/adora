import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/parent/", "/api/"],
    },
    sitemap: "https://adora.club/sitemap.xml",
  };
}
