import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const routes = ["", "/menu", "/contact", "/track"];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" || route === "/menu" ? "daily" : "weekly",
    priority: route === "" ? 1 : route === "/menu" ? 0.9 : 0.6,
  }));
}
