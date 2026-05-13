import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://lockintalks.com"),
  title: {
    default: "LockInTalks | Online Public Speaking Competitions",
    template: "%s | LockInTalks"
  },
  description:
    "LockInTalks is a premium online public speaking competition platform where kids and teenagers build confidence, compete globally, and earn recognition.",
  keywords: ["public speaking", "kids competitions", "teen debate", "online speaking", "speech contests"],
  openGraph: {
    title: "LockInTalks",
    description: "The global youth speaking championship platform.",
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
      </body>
    </html>
  );
}
