import { isCurrentlyOpen, formatTimeLabel } from "@/lib/business-hours";

// One definition of "can the customer order right now?", shared by the server (the
// authority that rejects orders) and the browser (banner, disabled buttons).

export type StoreState = "open" | "closed" | "paused";

export interface StoreStatus {
  state: StoreState;
  canOrder: boolean;
  /** Short bilingual message for customers, empty when open. */
  message: string;
  minOrderPkr: number;
}

export function getStoreStatus(map: Record<string, string>, now: Date = new Date()): StoreStatus {
  const open = map.business_open_time || "12:00";
  const close = map.business_close_time || "02:00";
  const minOrderPkr = Math.max(0, Number(map.min_order_pkr ?? 0) || 0);

  if (map.orders_paused === "1") {
    return {
      state: "paused",
      canOrder: false,
      message: "Abhi orders thori der ke liye band hain (kitchen busy). Thori der baad try karein. / Orders are paused for a short while.",
      minOrderPkr,
    };
  }
  if (!isCurrentlyOpen(open, close, now)) {
    return {
      state: "closed",
      canOrder: false,
      message: `Hum abhi band hain. ${formatTimeLabel(open)} par khulte hain. / We are closed right now, opening at ${formatTimeLabel(open)}.`,
      minOrderPkr,
    };
  }
  return { state: "open", canOrder: true, message: "", minOrderPkr };
}
