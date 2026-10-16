import webpush from "web-push";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

let configured = false;
function ensureConfigured() {
  if (configured) return true;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export interface NewOrderPushPayload {
  type: "NEW_ORDER";
  title: string;
  body: string;
  orderId: number;
  reference: string;
  url: string;
}

/**
 * Notifies every admin device that has enabled order alerts. Best-effort and non-blocking
 * by design — a push failure (or push not being configured at all) must never stop an order
 * from being placed. Dead subscriptions (410/404 from the push service, e.g. the browser
 * data was cleared) are cleaned up automatically.
 */
export async function sendNewOrderPush(orderId: number, reference: string, customerName: string): Promise<void> {
  if (!ensureConfigured()) {
    console.warn("[push] VAPID keys not set — skipping push notification. See CHANGES.md.");
    return;
  }

  const subs = await db.select().from(pushSubscriptions);
  if (subs.length === 0) return;

  const payload: NewOrderPushPayload = {
    type: "NEW_ORDER",
    title: "Naya Order Aa Gaya!",
    body: `${customerName} ne order diya hai — ${reference}. Dashboard check karein!`,
    orderId,
    reference,
    url: "/admin/orders",
  };
  const payloadStr = JSON.stringify(payload);

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payloadStr
        );
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          // Subscription is gone (browser data cleared, uninstalled, etc.) — remove it.
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint));
        } else {
          console.error("[push] Failed to send to a subscription:", err);
        }
      }
    })
  );
}
