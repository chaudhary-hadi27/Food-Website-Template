// Homepage sections are simply the menu categories, in the order the admin chose.
// The admin can only (a) reorder categories and (b) hide a whole category row.
// Items are NOT picked by hand: every available item of a category shows up automatically
// (new items appear on their own, sold-out / deleted items disappear on their own).

export interface HomepageSection {
  category: string;
  show: boolean;
}

export const DEFAULT_CATEGORIES = ["Gourmet Burgers", "Premium Sides", "Artisan Drinks", "Desserts"];

export function parseCategories(raw: string | undefined | null): string[] {
  try {
    const parsed = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed)) {
      const list = parsed.filter((c): c is string => typeof c === "string" && c.trim().length > 0);
      if (list.length) return list;
    }
  } catch {
    /* fall through to defaults */
  }
  return DEFAULT_CATEGORIES;
}

/**
 * Merge the saved layout (old format with limit/productIds is tolerated and those fields
 * are ignored) with the live category list: unknown categories are dropped, brand-new
 * categories are appended visible.
 */
export function resolveSections(categories: string[], rawLayout: string | undefined | null): HomepageSection[] {
  let saved: { category?: unknown; show?: unknown }[] = [];
  try {
    const parsed = rawLayout ? JSON.parse(rawLayout) : [];
    if (Array.isArray(parsed)) saved = parsed;
  } catch {
    /* ignore malformed JSON */
  }

  const known = new Set(categories);
  const out: HomepageSection[] = [];
  const seen = new Set<string>();
  for (const s of saved) {
    if (typeof s?.category === "string" && known.has(s.category) && !seen.has(s.category)) {
      out.push({ category: s.category, show: s.show !== false });
      seen.add(s.category);
    }
  }
  for (const c of categories) if (!seen.has(c)) out.push({ category: c, show: true });
  return out;
}
