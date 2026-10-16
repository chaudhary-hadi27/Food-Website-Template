import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { getAdminSession } from "@/lib/session";
import { and, gte, lte, desc } from "drizzle-orm";
import { resolveRangeDates, type DashboardRange } from "@/lib/dashboard-analytics";
import { serializeOrder } from "@/lib/serializers";

const VALID_RANGES: DashboardRange[] = ["today", "week", "month", "year", "custom"];

function csvEscape(value: string | number): string {
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

// Admin only — streams a CSV of orders for the selected range so staff can pull customer
// details / sales history into Excel without touching the database directly.
export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const rangeParam = searchParams.get("range") ?? "month";
  const range: DashboardRange = VALID_RANGES.includes(rangeParam as DashboardRange)
    ? (rangeParam as DashboardRange)
    : "month";

  const { from, to } = resolveRangeDates(range, searchParams.get("from"), searchParams.get("to"));

  const rows = await db
    .select()
    .from(orders)
    .where(and(gte(orders.createdAt, from), lte(orders.createdAt, to)))
    .orderBy(desc(orders.createdAt))
    .limit(20000); // generous cap — protects memory on a pathological all-time export

  const header = [
    "Reference",
    "Date",
    "Customer Name",
    "Phone",
    "Address",
    "Items",
    "Subtotal (PKR)",
    "Delivery Fee (PKR)",
    "Discount (PKR)",
    "Total (PKR)",
    "Payment Method",
    "Status",
  ];

  const lines = [header.join(",")];
  for (const row of rows) {
    const order = serializeOrder(row);
    const itemsSummary = order.items.map((i) => `${i.quantity}x ${i.name}`).join("; ");
    lines.push(
      [
        csvEscape(order.reference),
        csvEscape(new Date(order.created_at).toLocaleString("en-PK")),
        csvEscape(order.customer_name),
        csvEscape(order.customer_phone),
        csvEscape(order.customer_address),
        csvEscape(itemsSummary),
        csvEscape(order.subtotal_pkr),
        csvEscape(order.delivery_fee_pkr),
        csvEscape(order.discount_pkr),
        csvEscape(order.total_pkr),
        csvEscape(order.payment_method),
        csvEscape(order.status),
      ].join(",")
    );
  }

  const csv = lines.join("\n");
  const filename = `orders-${range}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
