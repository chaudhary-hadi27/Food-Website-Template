export const CATEGORIES = ["Gourmet Burgers", "Premium Sides", "Artisan Drinks", "Desserts"] as const;

export const PAYMENT_METHODS: { value: string; label: string; hint: string }[] = [
  { value: "cod", label: "Cash on Delivery", hint: "Pay in cash when your order arrives" },
  { value: "jazzcash", label: "JazzCash", hint: "Send payment to our JazzCash number, we'll confirm by SMS" },
  { value: "easypaisa", label: "EasyPaisa", hint: "Send payment to our EasyPaisa number, we'll confirm by SMS" },
  { value: "bank_transfer", label: "Bank Transfer", hint: "Transfer to our bank account, share the receipt on WhatsApp" },
];

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Order received",
  preparing: "Being prepared",
  ready: "Ready for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_STEPS = ["pending", "preparing", "ready", "delivered"] as const;

/**
 * Simplified admin order-desk filter groups. The underlying kitchen workflow still has
 * 5 granular statuses (pending → preparing → ready → delivered / cancelled), but the
 * admin filter bar groups them into 4 buckets so staff aren't hunting through tabs:
 * everything not yet delivered/cancelled counts as "Preparing".
 */
export const ORDER_FILTER_GROUPS: { key: "all" | "preparing" | "delivered" | "cancelled"; label: string; statuses: readonly string[] }[] = [
  { key: "all", label: "All", statuses: ["pending", "preparing", "ready", "delivered", "cancelled"] },
  { key: "preparing", label: "Preparing", statuses: ["pending", "preparing", "ready"] },
  { key: "delivered", label: "Delivered", statuses: ["delivered"] },
  { key: "cancelled", label: "Cancel", statuses: ["cancelled"] },
];

/**
 * Restaurant's own coordinates — used to calculate delivery distance in the admin
 * order preview map. ⚠️ UPDATE THESE to your actual restaurant location (you can find
 * exact lat/lng by right-clicking your location on https://www.google.com/maps or
 * https://www.openstreetmap.org and copying the coordinates shown).
 */
export const RESTAURANT_COORDS = { lat: 31.5204, lng: 74.3587 }; // Default: Lahore, Pakistan

// "Received" (pending) orders are badged neutral/white by default; delivered and cancelled
// already map to the app's light-green / light-red badge colors. Shared by the Order Desk
// and History pages so both look identical.
export const STATUS_BADGE_VARIANT: Record<string, "neutral" | "accent" | "gold" | "success" | "warning" | "error"> = {
  pending: "neutral",
  preparing: "accent",
  ready: "gold",
  delivered: "success",
  cancelled: "error",
};

// Subtle row tint in order lists so status is scannable at a glance — pending/preparing/
// ready stay the default white background, delivered/cancelled get a light tint matching
// their badge colors.
export const ROW_STATUS_BG: Partial<Record<string, string>> = {
  delivered: "bg-[#e8f5ea]/60 hover:bg-[#e8f5ea]",
  cancelled: "bg-[#fbe9e9]/60 hover:bg-[#fbe9e9]",
};

export const RESERVATION_STATUS_LABELS: Record<string, string> = {
  pending: "Awaiting confirmation",
  confirmed: "Confirmed",
  declined: "Declined",
  completed: "Completed",
};
