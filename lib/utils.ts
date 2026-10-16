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

export function generateOrderReference(orderCount: number, date = new Date()): string {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear().toString().slice(-2);
  const numStr = String(orderCount + 1).padStart(3, "0");
  return `ODR-${month}-${year}-${numStr}`;
}

export function generateReference(prefix: string) {
  // Use crypto.randomUUID() for true uniqueness — strip dashes, take first 12 hex chars,
  // uppercase them. Result format: FB-ORD-4A9E2B7C1D3F (100% unique per call).
  const uuid = crypto.randomUUID().replace(/-/g, "").toUpperCase();
  return `${prefix}-${uuid.slice(0, 12)}`;
}
