import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/session";
import { getDashboardAnalytics, type DashboardRange } from "@/lib/dashboard-analytics";

const VALID_RANGES: DashboardRange[] = ["today", "week", "month", "year", "custom"];

// Admin only — powers the dashboard's stat cards + charts. Accepts an optional
// ?range=today|week|month|year|custom (default "today"), and ?from=&to= (YYYY-MM-DD)
// when range=custom.
export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const rangeParam = searchParams.get("range") ?? "today";
  const range: DashboardRange = VALID_RANGES.includes(rangeParam as DashboardRange)
    ? (rangeParam as DashboardRange)
    : "today";

  if (range === "custom") {
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (!from || !to) {
      return NextResponse.json({ error: "Custom range requires both from and to dates" }, { status: 400 });
    }
    if (new Date(from) > new Date(to)) {
      return NextResponse.json({ error: "'from' date must be before 'to' date" }, { status: 400 });
    }
  }

  const data = await getDashboardAnalytics(range, searchParams.get("from"), searchParams.get("to"));
  return NextResponse.json(data);
}
