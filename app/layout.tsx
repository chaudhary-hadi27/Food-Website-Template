import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { getSiteSettings } from "@/lib/get-settings";
import { RippleEffect } from "@/components/ui/ripple-effect";
import { PageTransitionProvider } from "@/components/ui/page-transition-provider";
import { ServiceWorkerRegistrar } from "@/components/ui/service-worker-registrar";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

// Pages that are pre-rendered at build time re-check settings (name, tagline) every
// minute instead of keeping the build-time copy until the next deploy.
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const name = settings.restaurant_name || "Flaming Bites";
  const tagline = settings.hero_headline || "Crave It. Order It. Love It.";
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
    title: {
      default: `${name} — ${tagline}`,
      template: `%s | ${name}`,
    },
    description:
      settings.hero_subheadline ||
      "Gourmet burgers and comfort food, made fresh, delivered fast. Order online in PKR — Cash on Delivery, JazzCash, EasyPaisa, and Bank Transfer accepted.",
    openGraph: {
      title: `${name} — ${tagline}`,
      description: settings.hero_subheadline || "Gourmet burgers and comfort food, made fresh, delivered fast.",
      type: "website",
    },
    robots: { index: true, follow: true },
  };
}


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="antialiased">
        <RippleEffect />
        <PageTransitionProvider />
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  );
}