import { unstable_cache } from "next/cache";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { menuItems } from "@/lib/db/schema";
import { serializeMenuItem } from "@/lib/serializers";
import type { MenuItem } from "@/types";

export const MENU_CACHE_TAG = "menu";

// The whole menu is small (tens of rows), so it is read ONCE and shared by the homepage,
// the menu page and /api/menu for 60s instead of every visitor triggering their own
// queries. Admin edits call revalidateTag(MENU_CACHE_TAG) so changes show up immediately.
const readMenu = unstable_cache(
  async (): Promise<MenuItem[]> => {
    const rows = await db
      .select()
      .from(menuItems)
      .orderBy(desc(menuItems.isBestseller), menuItems.category);
    return rows.map(serializeMenuItem);
  },
  ["menu-all"],
  { revalidate: 60, tags: [MENU_CACHE_TAG] }
);

export async function getCachedMenu(): Promise<MenuItem[]> {
  try {
    return await readMenu();
  } catch (err) {
    // Only while building (no database reachable) do we fall back to an empty menu.
    // At runtime we re-throw so a hiccup keeps serving the last good page instead of
    // caching an empty one.
    if (process.env.NEXT_PHASE === "phase-production-build") {
      console.error("[getCachedMenu] DB unavailable during build, using empty menu:", err);
      return [];
    }
    throw err;
  }
}

// Fresh, uncached read — used by the admin panel so staff always see what they just saved.
export async function getFreshMenu(): Promise<MenuItem[]> {
  const rows = await db
    .select()
    .from(menuItems)
    .orderBy(desc(menuItems.isBestseller), menuItems.category);
  return rows.map(serializeMenuItem);
}
