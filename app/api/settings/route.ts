import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { SETTINGS_CACHE_TAG } from "@/lib/get-settings";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { settingsUpdateSchema } from "@/lib/validations";
import { getAdminSession } from "@/lib/session";

async function readAllSettings() {
  const rows = await db.select().from(settings);
  const map: Record<string, string> = {};
  for (const row of rows) map[row.key] = row.value;
  return map;
}

// Public — the site itself needs restaurant name, hero copy, delivery fee, contact info.
export async function GET() {
  const map = await readAllSettings();
  return NextResponse.json({ settings: map });
}

// Admin only — every one of these fields is editable from the dashboard, no code changes needed.
export async function PATCH(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = settingsUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
  }

  const entries = Object.entries(parsed.data).filter(([, v]) => v !== undefined) as [string, string | number][];
  for (const [key, value] of entries) {
    await db
      .insert(settings)
      .values({ key, value: String(value) })
      .onConflictDoUpdate({ target: settings.key, set: { value: String(value) } });
  }

  // Make the cached copy used by every page refresh on the next visit.
  revalidateTag(SETTINGS_CACHE_TAG, { expire: 0 });

  const map = await readAllSettings();
  return NextResponse.json({ settings: map });
}
