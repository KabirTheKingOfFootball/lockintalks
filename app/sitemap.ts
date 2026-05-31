import type { MetadataRoute } from "next";
import { getLiveCompetitions } from "@/lib/competitions";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://lockintalks.com";
  const routes = ["", "/about", "/faq", "/competitions", "/login", "/signup", "/contact", "/dashboard", "/terms", "/privacy", "/refund-policy", "/pricing", "/shipping-policy"].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date()
  }));
  const { competitions } = await getLiveCompetitions();
  const competitionRoutes = competitions.map((competition) => ({
    url: `${baseUrl}/competitions/${competition.slug}`,
    lastModified: new Date()
  }));

  return [...routes, ...competitionRoutes];
}
