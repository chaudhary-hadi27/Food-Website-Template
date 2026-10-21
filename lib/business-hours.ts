/**
 * A restaurant's "today" doesn't end at midnight — it ends when the counter closes,
 * whether that's 2am, 4am, or right at midnight. Everything here is anchored to a single
 * daily event — the closing time — rather than the calendar day, so a shift that runs
 * past midnight (e.g. open 12:00, close 02:00) still resets at the right moment.
 */

import { zonedParts, zonedTimeToUtc, minutesOfDay } from "@/lib/time";

/** Parses "HH:mm" into minutes-since-midnight. Falls back to 0 on bad input. */
export function parseTimeToMinutes(hhmm: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm?.trim() ?? "");
  if (!match) return 0;
  const h = Math.min(23, Math.max(0, Number(match[1])));
  const m = Math.min(59, Math.max(0, Number(match[2])));
  return h * 60 + m;
}

/** The instant of "today" (restaurant timezone, relative to `now`) at the given minutes-since-midnight. */
function dateAtMinutes(now: Date, minutes: number, dayOffset = 0): Date {
  const p = zonedParts(now);
  const d = new Date(Date.UTC(p.year, p.month - 1, p.day + dayOffset));
  return zonedTimeToUtc(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), Math.floor(minutes / 60), minutes % 60);
}

/**
 * The start of the *current* business day — the most recent closing-time instant at or
 * before `now`. Everything created after that instant belongs to "today"; the moment the
 * next closing time passes, this rolls forward and the Order Desk naturally empties out
 * for the next shift.
 */
export function getCurrentBusinessDayStart(closeTime: string, now: Date = new Date()): Date {
  const closeMinutes = parseTimeToMinutes(closeTime);
  const todaysClose = dateAtMinutes(now, closeMinutes);
  if (now.getTime() >= todaysClose.getTime()) {
    return todaysClose;
  }
  return dateAtMinutes(now, closeMinutes, -1);
}

/** Whether the restaurant is currently within its open/close window (handles overnight shifts). */
export function isCurrentlyOpen(openTime: string, closeTime: string, now: Date = new Date()): boolean {
  const openMinutes = parseTimeToMinutes(openTime);
  const closeMinutes = parseTimeToMinutes(closeTime);
  const nowMinutes = minutesOfDay(now);

  if (openMinutes === closeMinutes) return true; // 24 hours
  if (closeMinutes > openMinutes) {
    // Same-day shift, e.g. 09:00–23:00
    return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
  }
  // Overnight shift, e.g. 12:00–02:00
  return nowMinutes >= openMinutes || nowMinutes < closeMinutes;
}

/** "12:00" -> "12:00 PM" for display in Settings and the Order Desk header. */
export function formatTimeLabel(hhmm: string): string {
  const minutes = parseTimeToMinutes(hhmm);
  const h24 = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}
