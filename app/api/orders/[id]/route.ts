import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { orderStatusUpdateSchema } from "@/lib/validations";
import { getAdminSession } from "@/lib/session";
import { eq } from "drizzle-orm";
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
  if (d.status === undefined && d.estimated_delivery_minutes === undefined) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const [updated] = await db
    .update(orders)
    .set({
      ...(d.status !== undefined && { status: d.status }),
      ...(d.estimated_delivery_minutes !== undefined && {
        estimatedDeliveryMinutes: d.estimated_delivery_minutes,
      }),
    })
    .where(eq(orders.id, itemId))
    .returning();

  if (!updated) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json({ order: serializeOrder(updated) });
}
