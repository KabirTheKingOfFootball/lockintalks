import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter, Playfair_Display } from "next/font/google";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { launchSiteUrl } from "@/lib/competition-defaults";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  preload: true
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || launchSiteUrl),
  title: {
    default: "LockInTalks | Online Public Speaking Competitions",
    template: "%s | LockInTalks"
  },
  description:
    "LockInTalks is an online public speaking competition platform where kids and teenagers build confidence, communication skills, and stage readiness.",
  keywords: ["public speaking", "kids competitions", "teen debate", "online speaking", "speech contests"],
  openGraph: {
    title: "LockInTalks",
    description: "Structured online speaking competitions for young voices.",
    url: "/",
    siteName: "LockInTalks",
    images: [{ url: "/lockintalks-logo.png", width: 1254, height: 1254, alt: "LockInTalks logo" }],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "LockInTalks",
    description: "Speak. Inspire. Lead.",
    images: ["/lockintalks-logo.png"]
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
