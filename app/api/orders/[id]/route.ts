import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, coupons } from "@/lib/db/schema";
import { orderStatusUpdateSchema } from "@/lib/validations";
import { getAdminSession } from "@/lib/session";
import { eq, sql } from "drizzle-orm";
import { ORDER_STATUS_STEPS } from "@/lib/constants";
import { serializeOrder } from "@/lib/serializers";

// Admin only — looking up a single order by numeric ID is only ever done from the
// admin dashboard, which is authenticated. Customers track their own order via
// /api/orders/track/[reference] instead (see security note there).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const itemId = Number(id);
  if (!Number.isInteger(itemId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const [order] = await db.select().from(orders).where(eq(orders.id, itemId)).limit(1);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json({ order: serializeOrder(order) });
}

// Admin only — update status and/or manually override the estimated delivery time.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const itemId = Number(id);
  if (!Number.isInteger(itemId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const parsed = orderStatusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
  }
  const d = parsed.data;
  if (d.status === undefined && d.estimated_delivery_minutes === undefined && d.payment_verified === undefined) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  // Business rules (so a mis-tap or a kitchen tablet can't corrupt an order):
  //  - status only moves forward (pending → preparing → ready → delivered);
  //  - an order can be cancelled until it is delivered; finished orders are locked;
  //  - only admins can reopen / move an order backwards;
  //  - only admin/manager can mark a payment as verified.
  if (d.payment_verified !== undefined && session.role === "kitchen") {
    return NextResponse.json({ error: "Only a manager or admin can verify payments." }, { status: 403 });
  }
  if (d.status !== undefined) {
    const [current] = await db.select({ status: orders.status }).from(orders).where(eq(orders.id, itemId)).limit(1);
    if (!current) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (current.status !== d.status && session.role !== "admin") {
      const steps = ORDER_STATUS_STEPS as readonly string[];
      const from = steps.indexOf(current.status);
      const to = steps.indexOf(d.status);
      const finished = current.status === "delivered" || current.status === "cancelled";
      const ok = !finished && (d.status === "cancelled" || (from !== -1 && to > from));
      if (!ok) {
        return NextResponse.json(
          { error: `This order is "${current.status}" and cannot be changed to "${d.status}".` },
          { status: 409 }
        );
      }
    }
  }

  // One transaction: the status change and the coupon bookkeeping succeed or fail together.
  // Cancelling gives the coupon use back (so a cancelled order never "burns" a limited coupon);
  // an admin reopening a cancelled order takes it again.
  const updated = await db.transaction(async (tx) => {
    const [before] = await tx.select().from(orders).where(eq(orders.id, itemId)).for("update").limit(1);
    if (!before) return null;

    const [row] = await tx
      .update(orders)
      .set({
        ...(d.status !== undefined && { status: d.status }),
        ...(d.estimated_delivery_minutes !== undefined && {
          estimatedDeliveryMinutes: d.estimated_delivery_minutes,
        }),
        ...(d.payment_verified !== undefined && {
          paymentVerified: d.payment_verified,
        }),
      })
      .where(eq(orders.id, itemId))
      .returning();

    if (before.couponCode && d.status !== undefined && d.status !== before.status) {
      if (d.status === "cancelled") {
        await tx
          .update(coupons)
          .set({ usageCount: sql`greatest(${coupons.usageCount} - 1, 0)` })
          .where(eq(coupons.code, before.couponCode));
      } else if (before.status === "cancelled") {
        await tx
          .update(coupons)
          .set({ usageCount: sql`${coupons.usageCount} + 1` })
          .where(eq(coupons.code, before.couponCode));
      }
    }
    return row;
  });

  if (!updated) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json({ order: serializeOrder(updated) });
}
