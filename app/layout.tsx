import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Flaming Bites — Crave It. Order It. Love It.",
    template: "%s",
  },
  description: "Gourmet burgers and comfort food, made fresh, delivered fast across the city. Order online in PKR — Cash on Delivery, JazzCash, EasyPaisa, and Bank Transfer accepted.",
  openGraph: {
    title: "Flaming Bites — Crave It. Order It. Love It.",
    description: "Gourmet burgers and comfort food, made fresh, delivered fast across the city.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
