import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/get-settings";

// Served at /admin-manifest.webmanifest and linked from the admin layout's metadata —
// deliberately separate from the root /manifest.webmanifest (customer app) so staff can
// install "<Restaurant> Admin" as its own app (own icon/taskbar entry) on a Windows laptop
// via Chrome/Edge's "Install app", or "Add to Home Screen" on an Android phone. No Play
// Store submission needed for this one — it's for internal staff use, not public download.
export async function GET() {
  const settings = await getSiteSettings();
  const name = settings.restaurant_name || "Restaurant";

  return NextResponse.json(
    {
      name: `${name} Admin`,
      short_name: "Admin",
      description: `Order Desk and dashboard for ${name} staff.`,
      start_url: "/admin",
      scope: "/admin",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#D9480F",
      orientation: "any",
      icons: [
        { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
        { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
    { headers: { "Content-Type": "application/manifest+json" } }
  );
}
