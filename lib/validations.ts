import { z } from "zod";
import { normalizePhone } from "@/lib/utils";

const phoneSchema = z
  .string()
  .min(1, "Phone number is required")
  .transform((val) => normalizePhone(val))
  .refine((val) => /^03\d{9}$/.test(val), {
    message: "Enter a valid mobile number (e.g. 03001234567, +923001234567, or 923001234567)",
  });

export const menuItemSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(300).default(""),
  category: z.string().min(1).max(80),
  price_pkr: z.number().int().positive().max(1_000_000),
  image_url: z.string().max(500).default(""),
  is_available: z.union([z.literal(0), z.literal(1)]).default(1),
  is_bestseller: z.union([z.literal(0), z.literal(1)]).default(0),
  rating: z.number().min(0).max(5).default(4.5),
});

export const menuItemUpdateSchema = menuItemSchema.partial();

export const orderItemSchema = z.object({
  menu_item_id: z.number().int().positive(),
  name: z.string().min(1),
  price_pkr: z.number().int().nonnegative(),
  quantity: z.number().int().positive().max(50),
});

export const orderSchema = z.object({
  customer_name: z.string().min(2).max(100),
  customer_phone: phoneSchema,
  customer_address: z.string().min(5).max(300),
  // Present only when the customer auto-detected their location via the map picker.
  customer_lat: z.number().min(-90).max(90).optional(),
  customer_lng: z.number().min(-180).max(180).optional(),
  items: z.array(orderItemSchema).min(1),
  payment_method: z.enum(["cod", "jazzcash", "easypaisa", "bank_transfer"]),
  payment_proof_url: z.string().max(500).optional(),
  coupon_code: z.string().max(30).optional(),
});

export const orderStatusUpdateSchema = z.object({
  status: z.enum(["pending", "preparing", "ready", "delivered", "cancelled"]).optional(),
  // Admin can manually override the estimated delivery time for this specific order
  // (e.g. extend during rush hour, shorten if kitchen is quiet).
  estimated_delivery_minutes: z.number().int().min(5).max(240).optional(),
  payment_verified: z.union([z.literal(0), z.literal(1)]).optional(),
});

export const reservationSchema = z.object({
  customer_name: z.string().min(2).max(100),
  customer_phone: phoneSchema,
  party_size: z.number().int().min(1).max(30),
  reservation_date: z.string().min(4),
  reservation_time: z.string().min(1),
  special_requests: z.string().max(300).default(""),
});

export const reservationStatusUpdateSchema = z.object({
  status: z.enum(["pending", "confirmed", "declined", "completed"]),
});

export const settingsUpdateSchema = z.object({
  restaurant_name: z.string().min(2).max(80).optional(),
  hero_headline: z.string().min(2).max(120).optional(),
  hero_subheadline: z.string().min(2).max(200).optional(),
  hero_image_url: z.string().max(500).optional(),
  delivery_fee_pkr: z.number().int().nonnegative().max(10000).optional(),
  default_delivery_minutes: z.number().int().min(5).max(240).optional(),
  loyalty_pkr_per_point: z.number().int().positive().max(100000).optional(),
  phone: z.string().max(30).optional(),
  address: z.string().max(200).optional(),
  whatsapp: z.string().max(30).optional(),
  // Dynamic category list (JSON array string)
  categories: z.string().max(2000).optional(),
  // Homepage drag-and-drop layout (JSON array string)
  homepage_layout: z.string().max(10000).optional(),
  // Real customer reviews shown on the homepage (JSON array string of {name, text, item?}).
  homepage_reviews: z.string().max(8000).optional(),
  // "HH:mm" 24-hour — validated loosely here; lib/business-hours.ts is forgiving of edge cases.
  business_open_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Use 24-hour HH:mm format")
    .optional(),
  business_close_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Use 24-hour HH:mm format")
    .optional(),
  // Optional pre-recorded voice clip (e.g. hosted on Cloudinary) played on new orders.
  // Empty/omitted falls back to the browser's built-in speech synthesis automatically.
  new_order_alert_audio_url: z.string().max(500).optional(),
  restaurant_lat: z.number().min(-90).max(90).optional(),
  restaurant_lng: z.number().min(-180).max(180).optional(),
});

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const staffCreateSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(100),
  role: z.enum(["admin", "manager", "kitchen"]),
});

export const staffUpdateSchema = z.object({
  role: z.enum(["admin", "manager", "kitchen"]).optional(),
  password: z.string().min(6).max(100).optional(),
});

export const couponSchema = z.object({
  code: z.string().min(3).max(30).transform((s) => s.toUpperCase()),
  discount_type: z.enum(["percent", "fixed"]),
  discount_value: z.number().int().positive(),
  is_active: z.union([z.literal(0), z.literal(1)]).default(1),
  max_uses: z.number().int().positive().nullable().optional(),
  expires_at: z.string().nullable().optional(),
});

export const couponUpdateSchema = couponSchema.partial();

export const applyCouponSchema = z.object({
  code: z.string().min(1).max(30),
  subtotal_pkr: z.number().int().positive(),
});
