import { NextRequest, NextResponse, after } from "next/server";
import { db } from "@/lib/db";
import { orders, coupons, loyaltyAccounts, menuItems } from "@/lib/db/schema";
import { orderSchema } from "@/lib/validations";
import { getAdminSession } from "@/lib/session";
import { generateOrderReference } from "@/lib/utils";
import { desc, eq, gte, lte, lt, and, or, isNull, inArray, sql } from "drizzle-orm";
import { serializeOrder } from "@/lib/serializers";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { verifyPaymentReceipt } from "@/lib/ocr";
import { getSiteSettings, getSettingsMap } from "@/lib/get-settings";
import { getCurrentBusinessDayStart } from "@/lib/business-hours";
import { resolveRangeDates, type DashboardRange } from "@/lib/dashboard-analytics";
import { sendNewOrderPush } from "@/lib/push";

const VALID_RANGES: DashboardRange[] = ["today", "week", "month", "year", "custom"];

// Public — placing an order requires no account, just contact + delivery details.
//
// Built to survive a rush (1000+ people at once):
//  * prices come from the database, never from the browser (a customer could otherwise
//    POST price_pkr: 1 for every dish);
//  * coupon redemption, reference numbering, the order insert and loyalty points all happen
//    in ONE transaction — either the whole order is saved or nothing is, and a coupon can
//    never be used past its limit even when many people redeem it at the same instant;
//  * receipt OCR and the staff push notification run AFTER the response is sent, so the
//    customer never waits on them.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  // Max 10 orders per 10 minutes per IP — stops spam/fake-order flooding while
  // still allowing a genuine customer to place a few orders for a group/office.
  const limit = await rateLimit(`order:${ip}`, 10, 10 * 60_000);
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

  // Settings (cached, shared across requests) and the real menu prices, in parallel.
  const requestedIds = [...new Set(data.items.map((i) => i.menu_item_id))];
  const [settingsMap, menuRows] = await Promise.all([
    getSettingsMap(),
    db
      .select({
        id: menuItems.id,
        name: menuItems.name,
        pricePkr: menuItems.pricePkr,
        isAvailable: menuItems.isAvailable,
      })
      .from(menuItems)
      .where(inArray(menuItems.id, requestedIds)),
  ]);

  const menuById = new Map(menuRows.map((m) => [m.id, m]));
  const lines: { menu_item_id: number; name: string; price_pkr: number; quantity: number }[] = [];
  for (const item of data.items) {
    const menuItem = menuById.get(item.menu_item_id);
    if (!menuItem) {
      return NextResponse.json(
        { error: `"${item.name}" is no longer on the menu. Please refresh and try again.` },
        { status: 400 }
      );
    }
    if (!menuItem.isAvailable) {
      return NextResponse.json(
        { error: `"${menuItem.name}" is currently unavailable. Please remove it from your cart.` },
        { status: 400 }
      );
    }
    lines.push({
      menu_item_id: menuItem.id,
      name: menuItem.name,
      price_pkr: menuItem.pricePkr,
      quantity: item.quantity,
    });
  }

  const subtotal = lines.reduce((sum, i) => sum + i.price_pkr * i.quantity, 0);

  const deliveryFee = Number(settingsMap.delivery_fee_pkr ?? 150);
  // Default delivery estimate comes from the restaurant-wide setting; admin can
  // still adjust it per order afterward (e.g. rush hour, kitchen backlog).
  const defaultMinutes = Number(settingsMap.default_delivery_minutes ?? 45);
  // How many PKR spent earns 1 loyalty point (e.g. 100 means 1 point per PKR 100).
  const pkrPerPoint = Number(settingsMap.loyalty_pkr_per_point ?? 100) || 100;
  const loyaltyPointsEarned = Math.floor(subtotal / pkrPerPoint);
  const couponInput = data.coupon_code?.toUpperCase().trim();

  let created: typeof orders.$inferSelect;
  try {
    created = await db.transaction(async (tx) => {
      // Redeem the coupon atomically: the WHERE clause re-checks active / expiry / usage
      // limit at the moment of the update, so it cannot be over-used by a burst of orders.
      let discount = 0;
      let appliedCouponCode: string | null = null;
      if (couponInput) {
        const [redeemed] = await tx
          .update(coupons)
          .set({ usageCount: sql`${coupons.usageCount} + 1` })
          .where(
            and(
              eq(coupons.code, couponInput),
              eq(coupons.isActive, 1),
              or(isNull(coupons.expiresAt), gte(coupons.expiresAt, new Date())),
              or(isNull(coupons.maxUses), lt(coupons.usageCount, coupons.maxUses))
            )
          )
          .returning();
        if (redeemed) {
          discount =
            redeemed.discountType === "percent"
              ? Math.round((subtotal * redeemed.discountValue) / 100)
              : Math.min(redeemed.discountValue, subtotal);
          appliedCouponCode = redeemed.code;
        }
      }

      const total = Math.max(0, subtotal - discount) + deliveryFee;

      // The order number comes straight from the database's own ID counter (nextval), which
      // hands every concurrent request a different number without making them wait in line —
      // no lock, no count(*) over the whole table. Reference looks like ODR-Jul-26-001.
      const idRows = await tx.execute(sql`select nextval(pg_get_serial_sequence('orders', 'id')) as id`);
      const orderId = Number((idRows as unknown as { id: string | number }[])[0].id);
      const reference = generateOrderReference(orderId - 1);

      const [row] = await tx
        .insert(orders)
        .values({
          id: orderId,
          reference,
          customerName: data.customer_name,
          customerPhone: data.customer_phone,
          customerAddress: data.customer_address,
          customerLat: data.customer_lat ?? null,
          customerLng: data.customer_lng ?? null,
          items: lines,
          subtotalPkr: subtotal,
          deliveryFeePkr: deliveryFee,
          discountPkr: discount,
          couponCode: appliedCouponCode,
          loyaltyPointsEarned,
          totalPkr: total,
          paymentMethod: data.payment_method,
          paymentProofUrl: data.payment_proof_url ?? "",
          paymentOcrResult: "",
          status: "pending",
          estimatedDeliveryMinutes: defaultMinutes,
        })
        .returning();

      // Credit loyalty points to this phone number (creates the account on first order).
      if (loyaltyPointsEarned > 0) {
        await tx
          .insert(loyaltyAccounts)
          .values({ phone: data.customer_phone, points: loyaltyPointsEarned, updatedAt: new Date() })
          .onConflictDoUpdate({
            target: loyaltyAccounts.phone,
            set: { points: sql`${loyaltyAccounts.points} + ${loyaltyPointsEarned}`, updatedAt: new Date() },
          });
      }

      return row;
    });
  } catch (err) {
    console.error("[orders] could not save order:", err);
    return NextResponse.json(
      { error: "We could not save your order right now. Please try again in a moment." },
      { status: 500 }
    );
  }

  // Runs after the response has been sent. A failure here must never affect the customer.
  after(async () => {
    if (data.payment_method !== "cod" && data.payment_proof_url) {
      try {
        const ocr = await verifyPaymentReceipt(data.payment_proof_url);
        await db.update(orders).set({ paymentOcrResult: ocr.analysis }).where(eq(orders.id, created.id));
      } catch (e) {
        console.error("[ocr] receipt check failed:", e);
      }
    }
    try {
      await sendNewOrderPush(created.id, created.reference, created.customerName);
    } catch (e) {
      console.error("[push] sendNewOrderPush failed:", e);
    }
  });

  return NextResponse.json({ order: serializeOrder(created) }, { status: 201 });
}

// Admin only — order list.
// ?scope=today (default) — the live Order Desk: only orders since the current business
//   day started (anchored to the counter's closing time in Settings, not midnight), so
//   the list naturally empties out right after close instead of piling up forever.
// ?scope=all — the History page: every order, with optional ?limit=&offset= paging.
export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope") === "all" ? "all" : "today";
  const limitParam = searchParams.get("limit");
  const offsetParam = searchParams.get("offset");
  const limit = limitParam ? Math.min(Math.max(Number(limitParam) || 0, 1), 500) : undefined;
  const offset = offsetParam ? Math.max(Number(offsetParam) || 0, 0) : 0;

  if (scope === "today") {
    const settings = await getSiteSettings();
    const businessDayStart = getCurrentBusinessDayStart(settings.business_close_time);
    const rows = await db
      .select()
      .from(orders)
      .where(gte(orders.createdAt, businessDayStart))
      .orderBy(desc(orders.createdAt));

    return NextResponse.json({
      orders: rows.map(serializeOrder),
      total: rows.length,
      hasMore: false,
      businessDayStart: businessDayStart.toISOString(),
    });
  }

  const [{ count: totalCount }] = await db.select({ count: sql<number>`count(*)` }).from(orders);

  // History page: optional ?range=today|week|month|year|custom (+from/to) narrows the window;
  // omitting range keeps the original "everything" behavior.
  const rangeParam = searchParams.get("range");
  const whereClause =
    rangeParam && VALID_RANGES.includes(rangeParam as DashboardRange)
      ? (() => {
          const { from, to } = resolveRangeDates(
            rangeParam as DashboardRange,
            searchParams.get("from"),
            searchParams.get("to")
          );
          return and(gte(orders.createdAt, from), lte(orders.createdAt, to));
        })()
      : undefined;

  const filteredCountRows = whereClause
    ? await db.select({ count: sql<number>`count(*)` }).from(orders).where(whereClause)
    : null;
  const total = Number((filteredCountRows ? filteredCountRows[0]?.count : totalCount) ?? 0);

  const baseQuery = whereClause
    ? db.select().from(orders).where(whereClause).orderBy(desc(orders.createdAt)).offset(offset)
    : db.select().from(orders).orderBy(desc(orders.createdAt)).offset(offset);
  const rows = limit ? await baseQuery.limit(limit) : await baseQuery;

  return NextResponse.json({
    orders: rows.map(serializeOrder),
    total,
    hasMore: limit ? offset + rows.length < total : false,
  });
}
