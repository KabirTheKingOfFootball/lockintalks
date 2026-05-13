import type { MetadataRoute } from "next";
import { competitions } from "@/data/competitions";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://lockintalks.com";
  const routes = ["", "/competitions", "/login", "/signup", "/contact", "/dashboard"].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date()
  }));
  const competitionRoutes = competitions.map((competition) => ({
    url: `${baseUrl}/competitions/${competition.slug}`,
    lastModified: new Date()
  }));

  return [...routes, ...competitionRoutes];
}
