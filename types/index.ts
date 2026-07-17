export type MenuCategory =
  | "Gourmet Burgers"
  | "Premium Sides"
  | "Artisan Drinks"
  | "Desserts";

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
  items: OrderItem[];
  subtotal_pkr: number;
  delivery_fee_pkr: number;
  discount_pkr: number;
  coupon_code: string | null;
  loyalty_points_earned: number;
  total_pkr: number;
  payment_method: PaymentMethod;
  status: OrderStatus;
  estimated_delivery_minutes: number;
  created_at: string;
}

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
  accent_color: string;
  delivery_fee_pkr: number;
  phone: string;
  address: string;
  whatsapp: string;
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
