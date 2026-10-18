import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { menuItems } from "@/lib/db/schema";
import { menuItemSchema } from "@/lib/validations";
import { getAdminSession } from "@/lib/session";
import { serializeMenuItem } from "@/lib/serializers";
import { MENU_CACHE_TAG, getCachedMenu, getFreshMenu } from "@/lib/menu-cache";

// Public — anyone browsing the site needs the menu, no auth required.
// Served from a shared cache and allowed to sit on the CDN for 60s (then served stale
// while it refreshes), so a rush of visitors hits the database about once a minute.
// The admin panel asks for ?admin=1 and always gets live data, never a cached copy.
export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("admin") === "1") {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ items: await getFreshMenu() }, { headers: { "Cache-Control": "no-store" } });
  }

  const items = await getCachedMenu();
  return NextResponse.json(
    { items },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
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

  revalidateTag(MENU_CACHE_TAG, { expire: 0 });
  return NextResponse.json({ item: serializeMenuItem(created) }, { status: 201 });
}
