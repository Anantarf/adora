import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/coach/", "/parent/", "/api/"],
    },
    sitemap: "https://adorabbc.com/sitemap.xml",
  };
}
