import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/lib/get-settings";

// This becomes /manifest.webmanifest automatically (Next.js file convention). It's what
// Chrome/Edge use to decide the site is installable, and what the Play Store TWA wrapper
// points at — so name/icons here should stay accurate once you go live.
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getSiteSettings();
  const name = settings.restaurant_name || "Restaurant";

  return {
    name: `${name} — Order Online`,
    short_name: name,
    description: `Order food online from ${name} — fast delivery across the city.`,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#D9480F",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
