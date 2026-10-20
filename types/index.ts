// Categories are fully dynamic (admin can add/rename them), so this is just text.
export type MenuCategory = string;

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  category: MenuCategory;
  price_pkr: number;
  image_url: string;
  is_available: 0 | 1;
  is_bestseller: 0 | 1;
  rating: number;
  created_at: string;
}

export type OrderStatus = "pending" | "preparing" | "ready" | "delivered" | "cancelled";
export type PaymentMethod = "cod" | "jazzcash" | "easypaisa" | "bank_transfer";

export interface OrderItem {
  menu_item_id: number;
  name: string;
  price_pkr: number;
  quantity: number;
}

export interface Order {
  id: number;
  reference: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  // Set only when the customer auto-detected their location at checkout; null for manual addresses.
  customer_lat: number | null;
  customer_lng: number | null;
  items: OrderItem[];
  subtotal_pkr: number;
  delivery_fee_pkr: number;
  discount_pkr: number;
  coupon_code: string | null;
  loyalty_points_earned: number;
  total_pkr: number;
  payment_method: PaymentMethod;
  payment_proof_url: string;
  payment_verified: 0 | 1;
  payment_ocr_result: string;
  status: OrderStatus;
  estimated_delivery_minutes: number;
  created_at: string;
}

// What the PUBLIC (no-login) order endpoints return. Deliberately has no database id, no
// location, no payment screenshot and no OCR text, and the name / phone / address are
// partially hidden — a stranger who guesses or finds an order number sees nothing they
// could use to find, call or visit the customer.
export type PublicOrder = Omit<
  Order,
  "id" | "customer_lat" | "customer_lng" | "payment_proof_url" | "payment_ocr_result"
>;

export type ReservationStatus = "pending" | "confirmed" | "declined" | "completed";

export interface Reservation {
  id: number;
  reference: string;
  customer_name: string;
  customer_phone: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  special_requests: string;
  status: ReservationStatus;
  created_at: string;
}

export type AdminRole = "admin" | "manager" | "kitchen";

export interface AdminUser {
  id: number;
  email: string;
  role: AdminRole;
  created_at: string;
}

export interface SiteSettings {
  restaurant_name: string;
  hero_headline: string;
  hero_subheadline: string;
  hero_image_url?: string;
  delivery_fee_pkr: number;
  phone: string;
  address: string;
  whatsapp: string;
  categories?: string;
  homepage_layout?: string;
  // "HH:mm" 24-hour, local restaurant time. business_close_time may be earlier in the
  // clock than business_open_time (e.g. open 12:00, close 02:00) — that's how a shift
  // spanning midnight is expressed; see lib/business-hours.ts for how it's interpreted.
  business_open_time: string;
  business_close_time: string;
  // Set from Settings → Restaurant Location — falls back to a Lahore placeholder until
  // the admin sets the real coordinates.
  restaurant_lat: number;
  restaurant_lng: number;
  // Optional, entered by the restaurant in Settings: REAL customer reviews (JSON array of
  // {name, text, item?}). The homepage reviews section is hidden unless some are set.
  homepage_reviews?: string;
}

export interface CartLine {
  menu_item_id: number;
  name: string;
  price_pkr: number;
  image_url: string;
  quantity: number;
}

export type DiscountType = "percent" | "fixed";

export interface Coupon {
  id: number;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  is_active: 0 | 1;
  usage_count: number;
  max_uses: number | null;
  expires_at: string | null;
  created_at: string;
}

export interface LoyaltyAccount {
  phone: string;
  points: number;
  updated_at: string;
}
