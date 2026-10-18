import { cache } from "react";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import type { SiteSettings } from "@/types";

export const SETTINGS_CACHE_TAG = "settings";

const DEFAULTS: SiteSettings = {
  restaurant_name: "Flaming Bites",
  hero_headline: "Crave It. Order It. Love It.",
  hero_subheadline: "Gourmet burgers and comfort food, made fresh, delivered fast.",
  hero_image_url: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=1600&q=85&auto=format",
  accent_color: "#c1272d",
  delivery_fee_pkr: 150,
  phone: "+92 300 1234567",
  address: "Main Boulevard, Gulberg, Lahore",
  whatsapp: "+923001234567",
  business_open_time: "12:00",
  business_close_time: "02:00",
  restaurant_lat: 31.5204,
  restaurant_lng: 74.3587, // Default: Lahore city center placeholder
};

// One DB read shared across requests for 60s (and refreshed instantly when an admin
// saves settings — see revalidateTag in app/api/settings/route.ts). Before this, every
// page view paid for a database round trip just to read the restaurant name.
const readSettingsMap = unstable_cache(
  async () => {
    const rows = await db.select().from(settings);
    const map: Record<string, string> = {};
    for (const row of rows) map[row.key] = row.value;
    return map;
  },
  ["site-settings"],
  { revalidate: 60, tags: [SETTINGS_CACHE_TAG] }
);

// Raw key/value settings (includes keys that are not part of SiteSettings, e.g.
// loyalty_pkr_per_point). Same cache as getSiteSettings; empty object if the DB is down.
export const getSettingsMap = cache(async (): Promise<Record<string, string>> => {
  try {
    return await readSettingsMap();
  } catch (err) {
    console.error("[getSettingsMap] DB read failed:", err);
    return {};
  }
});

// React cache() dedupes the layout + generateMetadata + page calls within one request.
export const getSiteSettings = cache(
  async (): Promise<SiteSettings & { default_delivery_minutes: number }> => {
    let map: Record<string, string> = {};
    try {
      map = await readSettingsMap();
    } catch (err) {
      // A database hiccup (cold start, missing table, build without DB access) must not
      // take the whole site — or the whole deploy — down. Fall back to the defaults.
      console.error("[getSiteSettings] using defaults, DB read failed:", err);
    }

    return {
      restaurant_name: map.restaurant_name ?? DEFAULTS.restaurant_name,
      hero_headline: map.hero_headline ?? DEFAULTS.hero_headline,
      hero_subheadline: map.hero_subheadline ?? DEFAULTS.hero_subheadline,
      hero_image_url: map.hero_image_url ?? DEFAULTS.hero_image_url,
      accent_color: map.accent_color ?? DEFAULTS.accent_color,
      delivery_fee_pkr: Number(map.delivery_fee_pkr ?? DEFAULTS.delivery_fee_pkr),
      default_delivery_minutes: Number(map.default_delivery_minutes ?? 45),
      phone: map.phone ?? DEFAULTS.phone,
      address: map.address ?? DEFAULTS.address,
      whatsapp: map.whatsapp ?? DEFAULTS.whatsapp,
      categories: map.categories,
      homepage_layout: map.homepage_layout,
      business_open_time: map.business_open_time ?? DEFAULTS.business_open_time,
      business_close_time: map.business_close_time ?? DEFAULTS.business_close_time,
      restaurant_lat: Number(map.restaurant_lat ?? DEFAULTS.restaurant_lat),
      restaurant_lng: Number(map.restaurant_lng ?? DEFAULTS.restaurant_lng),
    };
  }
);
