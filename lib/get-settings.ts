import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import type { SiteSettings } from "@/types";

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

export async function getSiteSettings(): Promise<SiteSettings & { default_delivery_minutes: number }> {
  const rows = await db.select().from(settings);
  const map: Record<string, string> = {};
  for (const row of rows) map[row.key] = row.value;

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
