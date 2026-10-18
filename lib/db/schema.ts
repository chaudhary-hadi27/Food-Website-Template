import {
  pgTable,
  serial,
  text,
  integer,
  real,
  timestamp,
  jsonb,
  varchar,
  index,
} from "drizzle-orm/pg-core";

export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description").notNull().default(""),
  category: varchar("category", { length: 60 }).notNull(),
  pricePkr: integer("price_pkr").notNull(),
  imageUrl: text("image_url").notNull().default(""),
  isAvailable: integer("is_available").notNull().default(1),
  isBestseller: integer("is_bestseller").notNull().default(0),
  rating: real("rating").notNull().default(4.5),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  // Homepage + menu filter by category and availability.
  index("menu_items_category_idx").on(t.category),
  index("menu_items_bestseller_idx").on(t.isBestseller),
]);

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  reference: varchar("reference", { length: 40 }).notNull().unique(),
  customerName: varchar("customer_name", { length: 120 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 20 }).notNull(),
  customerAddress: text("customer_address").notNull().default(""),
  // Populated only when the customer used "Use My Current Location" at checkout
  // (browser geolocation + reverse geocoding). Null when they typed the address manually.
  customerLat: real("customer_lat"),
  customerLng: real("customer_lng"),
  items: jsonb("items").notNull(),
  subtotalPkr: integer("subtotal_pkr").notNull(),
  deliveryFeePkr: integer("delivery_fee_pkr").notNull(),
  discountPkr: integer("discount_pkr").notNull().default(0),
  couponCode: varchar("coupon_code", { length: 30 }),
  loyaltyPointsEarned: integer("loyalty_points_earned").notNull().default(0),
  totalPkr: integer("total_pkr").notNull(),
  paymentMethod: varchar("payment_method", { length: 30 }).notNull(),
  // Payment proof: screenshot uploaded by customer for JazzCash/EasyPaisa/bank transfer.
  paymentProofUrl: text("payment_proof_url").default(""),
  paymentVerified: integer("payment_verified").notNull().default(0),
  paymentOcrResult: text("payment_ocr_result").default(""),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  // Delivery time tracking: defaults to the restaurant-wide setting at order time,
  // but admin can manually shorten/extend it per order (e.g. rush hour, item out of stock).
  estimatedDeliveryMinutes: integer("estimated_delivery_minutes").notNull().default(45),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  // Order desk, history and analytics all filter/sort by time; tracking looks up by phone;
  // the kitchen badge counts by status.
  index("orders_created_at_idx").on(t.createdAt),
  index("orders_customer_phone_idx").on(t.customerPhone),
  index("orders_status_created_idx").on(t.status, t.createdAt),
]);

export const reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  reference: varchar("reference", { length: 40 }).notNull().unique(),
  customerName: varchar("customer_name", { length: 120 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 20 }).notNull(),
  partySize: integer("party_size").notNull(),
  reservationDate: varchar("reservation_date", { length: 20 }).notNull(),
  reservationTime: varchar("reservation_time", { length: 20 }).notNull(),
  specialRequests: text("special_requests").notNull().default(""),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  key: varchar("key", { length: 60 }).primaryKey(),
  value: text("value").notNull(),
});

export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 120 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  // "admin" = full control, "manager" = menu/orders/reservations/coupons (no staff/settings),
  // "kitchen" = orders only (view + update status, no pricing/settings access)
  role: varchar("role", { length: 20 }).notNull().default("admin"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 30 }).notNull().unique(),
  discountType: varchar("discount_type", { length: 10 }).notNull(), // "percent" | "fixed"
  discountValue: integer("discount_value").notNull(),
  isActive: integer("is_active").notNull().default(1),
  usageCount: integer("usage_count").notNull().default(0),
  maxUses: integer("max_uses"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const loyaltyAccounts = pgTable("loyalty_accounts", {
  phone: varchar("phone", { length: 20 }).primaryKey(),
  points: integer("points").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// One row per admin browser/device that has enabled "New Order Alerts". A single admin
// can have several (phone + desktop), and each is pinged independently on every new order.
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
