export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatPKR(amount: number) {
  return `PKR ${amount.toLocaleString("en-PK")}`;
}

/**
 * Builds a wa.me share link containing the order + a Google Maps link to the delivery
 * address, so an admin/dispatcher can forward it to whichever rider is available — no
 * fixed rider phone number needed, they just pick the WhatsApp contact when it opens.
 */
export function buildRiderShareWhatsAppUrl(order: {
  reference: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_lat: number | null;
  customer_lng: number | null;
}): string {
  const mapsLink =
    order.customer_lat != null && order.customer_lng != null
      ? `https://www.google.com/maps?q=${order.customer_lat},${order.customer_lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.customer_address)}`;
  const message = [
    `📦 Delivery: ${order.reference}`,
    `👤 ${order.customer_name}`,
    `📞 ${order.customer_phone}`,
    `📍 ${order.customer_address}`,
    "",
    mapsLink,
  ].join("\n");
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

/**
 * Compact currency formatting for tight spaces (e.g. mobile dashboard stat tiles)
 * so a big number never overflows its box — "PKR 45,231" becomes "PKR 45.2K".
 * Pair with a `title` attribute using formatPKR() for the exact figure on hover/long-press.
 */
export function formatPKRCompact(amount: number) {
  const compact = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
  return `PKR ${compact}`;
}

/** Compact plain-number formatting for counts (orders, items) — same overflow-safety as above. */
export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

/**
 * Great-circle distance between two lat/lng points in kilometers (Haversine formula).
 * Used to show delivery distance from the restaurant to a customer's pinned location.
 */
export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function normalizePhone(input: string): string {
  if (!input) return "";
  const cleaned = input.trim().replace(/[\s\-\(\)]/g, "");
  const digits = cleaned.replace(/\D/g, "");

  // Convert +923001234567 or 923001234567 -> 03001234567
  if (digits.startsWith("92") && digits.length === 12) {
    return "0" + digits.slice(2);
  }
  // Convert 3001234567 -> 03001234567
  if (digits.length === 10 && digits.startsWith("3")) {
    return "0" + digits;
  }
  // Convert 03001234567 -> 03001234567
  if (digits.length === 11 && digits.startsWith("0")) {
    return digits;
  }

  return digits || input;
}

// Short, human-friendly order code like "K7Q2X9" — easy to read out over the phone or type
// from a WhatsApp message. 6 characters from a 32-symbol alphabet (no 0/O/1/I look-alikes)
// is ~1 billion combinations and is RANDOM, so one order number reveals nothing about any
// other order. (The old ODR-Jul-26-001 style was sequential, so anyone could count up.)
// Always contains at least one letter so it can never be mistaken for a phone number.
const REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateShortReference(length = 6): string {
  for (;;) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    // 256 is a multiple of 32, so "% 32" is perfectly uniform (no modulo bias).
    const code = Array.from(bytes, (b) => REF_ALPHABET[b % 32]).join("");
    if (/[A-Z]/.test(code)) return code;
  }
}

export function generateReference(prefix: string) {
  // Use crypto.randomUUID() for true uniqueness — strip dashes, take first 12 hex chars,
  // uppercase them. Result format: FB-ORD-4A9E2B7C1D3F (100% unique per call).
  const uuid = crypto.randomUUID().replace(/-/g, "").toUpperCase();
  return `${prefix}-${uuid.slice(0, 12)}`;
}

/**
 * Asks the image host for a smaller, modern-format copy instead of the full-size original
 * (a 3 MB phone photo for a 300 px card is the single biggest cause of slow menus on mobile
 * data). Cloudinary: auto format + auto quality + width cap. Unsplash: width + auto format.
 * Any other URL (or a local /uploads path) is returned unchanged.
 */
export function optimizeImageUrl(url: string, width = 640): string {
  if (!url) return url;
  const cloudinary = url.match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.*)$/);
  if (cloudinary) {
    if (/^(?:[a-z]+_[^/,]+,?)*(?:f_auto|q_auto)/.test(cloudinary[2])) return url; // already optimised
    return `${cloudinary[1]}f_auto,q_auto,w_${width},c_limit/${cloudinary[2]}`;
  }
  if (url.startsWith("https://images.unsplash.com/")) {
    try {
      const u = new URL(url);
      u.searchParams.set("w", String(width));
      u.searchParams.set("auto", "format");
      return u.toString();
    } catch {
      return url;
    }
  }
  return url;
}
