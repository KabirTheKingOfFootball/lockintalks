import type { MetadataRoute } from "next";
import { launchSiteUrl } from "@/lib/competition-defaults";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || launchSiteUrl;
  return {
    rules: {
      userAgent: "*",
      allow: "/"
    },
    sitemap: `${baseUrl}/sitemap.xml`
  };
}
