import { unstable_cache } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";

// A REAL number for the homepage ("N+ orders delivered"), counted from the orders table and
// cached for 10 minutes. It replaces the invented "2400+ happy customers" that used to be
// hard-coded for every restaurant.
const readDeliveredCount = unstable_cache(
  async (): Promise<number> => {
    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.status, "delivered"));
    return Number(row?.count ?? 0);
  },
  ["delivered-order-count"],
  { revalidate: 600 }
);

export async function getDeliveredOrderCount(): Promise<number> {
  try {
    return await readDeliveredCount();
  } catch (err) {
    console.error("[getDeliveredOrderCount] failed, hiding the stat:", err);
    return 0;
  }
}
