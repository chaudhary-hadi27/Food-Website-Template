import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, settings, coupons, loyaltyAccounts } from "@/lib/db/schema";
import { orderSchema } from "@/lib/validations";
import { getAdminSession } from "@/lib/session";
import { generateReference } from "@/lib/utils";
import { desc, eq, sql } from "drizzle-orm";
import { serializeOrder } from "@/lib/serializers";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// Public — placing an order requires no account, just contact + delivery details.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  // Max 10 orders per 10 minutes per IP — stops spam/fake-order flooding while
  // still allowing a genuine customer to place a few orders for a group/office.
  const limit = rateLimit(`order:${ip}`, 10, 10 * 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many orders placed recently. Please wait a few minutes and try again." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid order data" }, { status: 400 });
  }
  const data = parsed.data;

  const subtotal = data.items.reduce((sum, i) => sum + i.price_pkr * i.quantity, 0);

  const settingsRows = await db.select().from(settings);
  const settingsMap: Record<string, string> = {};
  for (const row of settingsRows) settingsMap[row.key] = row.value;

  const deliveryFee = Number(settingsMap.delivery_fee_pkr ?? 150);
  // Default delivery estimate comes from the restaurant-wide setting; admin can
  // still adjust it per order afterward (e.g. rush hour, kitchen backlog).
  const defaultMinutes = Number(settingsMap.default_delivery_minutes ?? 45);
  // How many PKR spent earns 1 loyalty point (e.g. 100 means 1 point per PKR 100).
  const pkrPerPoint = Number(settingsMap.loyalty_pkr_per_point ?? 100);

  // Validate + apply coupon server-side (never trust a discount amount from the client).
  let discount = 0;
  let appliedCouponCode: string | null = null;
  if (data.coupon_code) {
    const code = data.coupon_code.toUpperCase().trim();
    const [coupon] = await db.select().from(coupons).where(eq(coupons.code, code)).limit(1);
    const now = new Date();
    const validCoupon =
      coupon &&
      coupon.isActive &&
      (!coupon.expiresAt || new Date(coupon.expiresAt) >= now) &&
      (coupon.maxUses === null || coupon.usageCount < coupon.maxUses);

    if (validCoupon && coupon) {
      discount =
        coupon.discountType === "percent"
          ? Math.round((subtotal * coupon.discountValue) / 100)
          : Math.min(coupon.discountValue, subtotal);
      appliedCouponCode = coupon.code;
      await db
        .update(coupons)
        .set({ usageCount: sql`${coupons.usageCount} + 1` })
        .where(eq(coupons.id, coupon.id));
    }
  }

  const total = Math.max(0, subtotal - discount) + deliveryFee;
  const loyaltyPointsEarned = Math.floor(subtotal / pkrPerPoint);

  const reference = generateReference("FB-ORD");

  const [created] = await db
    .insert(orders)
    .values({
      reference,
      customerName: data.customer_name,
      customerPhone: data.customer_phone,
      customerAddress: data.customer_address,
      items: data.items,
      subtotalPkr: subtotal,
      deliveryFeePkr: deliveryFee,
      discountPkr: discount,
      couponCode: appliedCouponCode,
      loyaltyPointsEarned,
      totalPkr: total,
      paymentMethod: data.payment_method,
      status: "pending",
      estimatedDeliveryMinutes: defaultMinutes,
    })
    .returning();

  // Credit loyalty points to this phone number (creates the account if it's their first order).
  if (loyaltyPointsEarned > 0) {
    await db
      .insert(loyaltyAccounts)
      .values({ phone: data.customer_phone, points: loyaltyPointsEarned, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: loyaltyAccounts.phone,
        set: { points: sql`${loyaltyAccounts.points} + ${loyaltyPointsEarned}`, updatedAt: new Date() },
      });
  }

  return NextResponse.json({ order: serializeOrder(created) }, { status: 201 });
}

// Admin only — full order list for the dashboard.
export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db.select().from(orders).orderBy(desc(orders.createdAt));
  return NextResponse.json({ orders: rows.map(serializeOrder) });
}
