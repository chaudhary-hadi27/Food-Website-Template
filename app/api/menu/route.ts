import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { menuItems } from "@/lib/db/schema";
import { menuItemSchema } from "@/lib/validations";
import { getAdminSession } from "@/lib/session";
import { desc } from "drizzle-orm";
import { serializeMenuItem } from "@/lib/serializers";

// Public — anyone browsing the site needs the menu, no auth required.
export async function GET() {
  const rows = await db.select().from(menuItems).orderBy(desc(menuItems.isBestseller), menuItems.category);
  return NextResponse.json({ items: rows.map(serializeMenuItem) });
}

// Admin only — creating a new dish.
export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = menuItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
  }

  const data = parsed.data;
  const [created] = await db
    .insert(menuItems)
    .values({
      name: data.name,
      description: data.description,
      category: data.category,
      pricePkr: data.price_pkr,
      imageUrl: data.image_url,
      isAvailable: data.is_available,
      isBestseller: data.is_bestseller,
      rating: data.rating,
    })
    .returning();

  return NextResponse.json({ item: serializeMenuItem(created) }, { status: 201 });
}
