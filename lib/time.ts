// Everything that depends on "what time is it at the restaurant" goes through here.
//
// Why: on Vercel (and most servers) the clock runs in UTC. Pakistan is UTC+5, so code like
// `new Date().getHours()` or `setHours(0,0,0,0)` silently ends "today" at 5 AM and reports
// open/closed 5 hours wrong. All business time is therefore computed explicitly in one
// timezone (default Asia/Karachi; override with NEXT_PUBLIC_BUSINESS_TZ).

const RAW_TZ = process.env.NEXT_PUBLIC_BUSINESS_TZ || "Asia/Karachi";
export const BUSINESS_TZ = /^[A-Za-z_]+(\/[A-Za-z_+\-0-9]+)*$/.test(RAW_TZ) ? RAW_TZ : "Asia/Karachi";

export interface ZonedParts {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
}

const fmtCache = new Map<string, Intl.DateTimeFormat>();
function formatter(tz: string) {
  let f = fmtCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
    fmtCache.set(tz, f);
  }
  return f;
}

/** Wall-clock parts of an instant in the business timezone. */
export function zonedParts(date: Date, tz: string = BUSINESS_TZ): ZonedParts {
  const p: Record<string, number> = {};
  for (const part of formatter(tz).formatToParts(date)) {
    if (part.type !== "literal") p[part.type] = Number(part.value);
  }
  return { year: p.year, month: p.month, day: p.day, hour: p.hour === 24 ? 0 : p.hour, minute: p.minute };
}

/** The instant at which the wall clock in `tz` shows the given date/time. */
export function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  ms = 0,
  tz: string = BUSINESS_TZ
): Date {
  const asUtc = Date.UTC(year, month - 1, day, hour, minute, 0, ms);
  // Offset of the zone at (roughly) that instant; one correction pass handles DST edges.
  const guess = new Date(asUtc);
  const g = zonedParts(guess, tz);
  const offset = Date.UTC(g.year, g.month - 1, g.day, g.hour, g.minute) - Math.floor(asUtc / 60000) * 60000;
  const first = new Date(asUtc - offset);
  const f = zonedParts(first, tz);
  const offset2 = Date.UTC(f.year, f.month - 1, f.day, f.hour, f.minute) - Math.floor(first.getTime() / 60000) * 60000;
  return new Date(asUtc - offset2);
}

/** 00:00:00.000 of the business-timezone day that contains `date`, shifted by `addDays`. */
export function startOfZonedDay(date: Date, addDays = 0, tz: string = BUSINESS_TZ): Date {
  const p = zonedParts(date, tz);
  const d = new Date(Date.UTC(p.year, p.month - 1, p.day + addDays));
  return zonedTimeToUtc(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), 0, 0, 0, tz);
}

/** 23:59:59.999 of the business-timezone day that contains `date`. */
export function endOfZonedDay(date: Date, tz: string = BUSINESS_TZ): Date {
  return new Date(startOfZonedDay(date, 1, tz).getTime() - 1);
}

/** Minutes since local midnight in the business timezone. */
export function minutesOfDay(date: Date, tz: string = BUSINESS_TZ): number {
  const p = zonedParts(date, tz);
  return p.hour * 60 + p.minute;
}

/** "2026-10-20" for the business-timezone calendar day of `date`. */
export function zonedDateKey(date: Date, tz: string = BUSINESS_TZ): string {
  const p = zonedParts(date, tz);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** Parse "YYYY-MM-DD" (or an ISO string starting with it) as a business-timezone day start. */
export function parseZonedDateStart(value: string, tz: string = BUSINESS_TZ): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value ?? "");
  if (!m) return null;
  return zonedTimeToUtc(Number(m[1]), Number(m[2]), Number(m[3]), 0, 0, 0, tz);
}
