import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/parent/", "/api/"],
    },
    sitemap: "https://adorabbc.com/sitemap.xml",
  };
}
