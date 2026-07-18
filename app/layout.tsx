import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { getSiteSettings } from "@/lib/get-settings";

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


export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  const accentColor = settings.accent_color || "#c1272d";

  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --color-accent: ${accentColor} !important;
                --color-accent-dark: color-mix(in srgb, ${accentColor} 85%, black) !important;
                --color-accent-light: color-mix(in srgb, ${accentColor} 10%, white) !important;
              }
            `,
          }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}