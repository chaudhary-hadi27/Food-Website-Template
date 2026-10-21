#!/usr/bin/env node
// Real-world scenario tests. Run against a LOCAL or STAGING server (never production — it
// creates test dishes, coupons and orders, and changes opening hours temporarily):
//
//   BASE_URL=http://localhost:3000 SESSION_SECRET=<same secret the server uses> npm run test:scenarios
//
// Every check below is something that really happens to a food business: closing time, a
// kitchen that is overloaded, a dish that sells out while it sits in someone's cart, a customer
// who taps "Place order" five times on a slow connection, a limited coupon during a rush, etc.

import { SignJWT } from "jose";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const SECRET = process.env.SESSION_SECRET;
if (!SECRET) {
  console.error("Set SESSION_SECRET (same value the server uses) so the tests can act as an admin.");
  process.exit(2);
}

let ipCounter = 0;
const freshIp = () => `10.77.${(ipCounter >> 8) & 255}.${ipCounter++ & 255}`;
let phoneCounter = Math.floor(Math.random() * 40_000_000);
const freshPhone = () => `0345${String(1_000_000 + phoneCounter++).padStart(7, "0")}`.slice(0, 11);

async function token(role) {
  return new SignJWT({ email: `${role}@test.local`, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(SECRET));
}

async function call(method, path, { body, role, ip } = {}) {
  const headers = { "content-type": "application/json", "x-forwarded-for": ip || freshIp() };
  if (role) headers.cookie = `fb_admin_session=${await token(role)}`;
  const res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* not json */
  }
  return { status: res.status, json };
}

const results = [];
async function scenario(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`  ✓ ${name}`);
  } catch (e) {
    results.push({ name, ok: false, err: e.message });
    console.log(`  ✗ ${name}\n      ${e.message}`);
  }
}
function expect(cond, msg) {
  if (!cond) throw new Error(msg);
}
function eq(actual, expected, what) {
  if (actual !== expected) throw new Error(`${what}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

const orderBody = (items, extra = {}) => ({
  customer_name: "Scenario Tester",
  customer_phone: freshPhone(),
  customer_address: "House 1, Street 2, Gulberg, Lahore",
  payment_method: "cod",
  items,
  ...extra,
});
const line = (id, quantity = 1, price = 1) => ({ menu_item_id: id, name: "x", price_pkr: price, quantity });

async function setSettings(obj) {
  const r = await call("PATCH", "/api/settings", { body: obj, role: "admin" });
  expect(r.status === 200, `settings PATCH failed (${r.status}) ${JSON.stringify(r.json)}`);
}
async function makeDish(name, price, extra = {}) {
  const r = await call("POST", "/api/menu", {
    role: "admin",
    body: { name, description: "scenario test dish", category: "Scenario Tests", price_pkr: price, image_url: "", is_available: 1, is_bestseller: 0, rating: 4.5, ...extra },
  });
  expect(r.status === 201, `could not create dish (${r.status}) ${JSON.stringify(r.json)}`);
  return r.json.item;
}
async function makeCoupon(code, value, maxUses) {
  const r = await call("POST", "/api/coupons", {
    role: "admin",
    body: { code, discount_type: "fixed", discount_value: value, is_active: 1, max_uses: maxUses },
  });
  expect(r.status === 201 || r.status === 200, `could not create coupon (${r.status}) ${JSON.stringify(r.json)}`);
}
async function couponUsage(code) {
  const r = await call("GET", "/api/coupons", { role: "admin" });
  const c = (r.json?.coupons ?? []).find((x) => x.code === code.toUpperCase());
  return c ? c.usage_count : null;
}

const stamp = Date.now().toString(36).toUpperCase();

console.log(`\nScenario tests against ${BASE}\n`);

await setSettings({ orders_paused: 0, min_order_pkr: 0, business_open_time: "00:00", business_close_time: "23:59", delivery_fee_pkr: 100 });
const burger = await makeDish(`Test Burger ${stamp}`, 500);
const fries = await makeDish(`Test Fries ${stamp}`, 200);

console.log("Ordering rules");
await scenario("normal order is saved with a SHORT code and DB prices (customer-sent price ignored)", async () => {
  const r = await call("POST", "/api/orders", { body: orderBody([line(burger.id, 2, 1), line(fries.id, 1, 1)]) });
  eq(r.status, 201, "status");
  eq(r.json.order.subtotal_pkr, 1200, "subtotal");
  eq(r.json.order.total_pkr, 1300, "total (subtotal + 100 delivery)");
  expect(/^[A-Z2-9]{6}$/.test(r.json.order.reference), `reference "${r.json.order.reference}" is not a 6-char code`);
});

await scenario("phone formats +92 / 92 / 03 are stored the same way", async () => {
  const base = String(Math.floor(2_000_000 + Math.random() * 7_000_000)).padStart(7, "0");
  const forms = [`+92345${base}`, `92345${base}`, `0345${base}`, `345${base}`];
  const phones = new Set();
  for (const p of forms) {
    const r = await call("POST", "/api/orders", { body: orderBody([line(fries.id)], { customer_phone: p }) });
    expect(r.status === 201 || r.status === 200 || r.status === 429, `unexpected ${r.status} for ${p}`);
    if (r.json?.order) phones.add(r.json.order.customer_phone);
  }
  eq(phones.size, 1, "distinct stored phone numbers");
});

await scenario("invalid carts are refused (empty, 41 lines, quantity 51, bad phone)", async () => {
  eq((await call("POST", "/api/orders", { body: orderBody([]) })).status, 400, "empty cart");
  eq((await call("POST", "/api/orders", { body: orderBody(Array.from({ length: 41 }, () => line(burger.id))) })).status, 400, "41 lines");
  eq((await call("POST", "/api/orders", { body: orderBody([line(burger.id, 51)]) })).status, 400, "quantity 51");
  eq((await call("POST", "/api/orders", { body: orderBody([line(burger.id)], { customer_phone: "12345" }) })).status, 400, "bad phone");
});

await scenario("online payment without a screenshot is refused", async () => {
  const r = await call("POST", "/api/orders", { body: orderBody([line(burger.id)], { payment_method: "jazzcash" }) });
  eq(r.status, 400, "status");
  eq(r.json.code, "proof_required", "code");
});

console.log("\nShop state");
await scenario("PAUSED: orders refused with a clear message, accepted again after un-pausing", async () => {
  await setSettings({ orders_paused: 1 });
  const r = await call("POST", "/api/orders", { body: orderBody([line(burger.id)]) });
  eq(r.status, 409, "status while paused");
  eq(r.json.code, "paused", "code");
  await setSettings({ orders_paused: 0 });
  eq((await call("POST", "/api/orders", { body: orderBody([line(burger.id)]) })).status, 201, "status after resume");
});

await scenario("CLOSED hours: orders refused outside opening hours", async () => {
  const now = new Date();
  const karachiMinutes = (now.getUTCHours() * 60 + now.getUTCMinutes() + 300) % 1440;
  const open = (karachiMinutes + 120) % 1440; // opens in 2 hours
  const close = (karachiMinutes + 180) % 1440; // closes in 3 hours  => closed right now
  const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  await setSettings({ business_open_time: hhmm(open), business_close_time: hhmm(close) });
  const r = await call("POST", "/api/orders", { body: orderBody([line(burger.id)]) });
  await setSettings({ business_open_time: "00:00", business_close_time: "23:59" });
  eq(r.status, 409, "status while closed");
  eq(r.json.code, "closed", "code");
});

await scenario("MINIMUM ORDER enforced on the server", async () => {
  await setSettings({ min_order_pkr: 1000 });
  const small = await call("POST", "/api/orders", { body: orderBody([line(fries.id)]) });
  const big = await call("POST", "/api/orders", { body: orderBody([line(burger.id, 2)]) });
  await setSettings({ min_order_pkr: 0 });
  eq(small.status, 400, "small basket");
  eq(small.json.code, "min_order", "code");
  eq(big.status, 201, "big basket");
});

console.log("\nMenu changing under the customer");
await scenario("dish sold out while in cart -> refused; available again -> accepted", async () => {
  const dish = await makeDish(`Sellout ${stamp}`, 300);
  await call("PATCH", `/api/menu/${dish.id}`, { role: "admin", body: { is_available: 0 } });
  const r1 = await call("POST", "/api/orders", { body: orderBody([line(dish.id)]) });
  await call("PATCH", `/api/menu/${dish.id}`, { role: "admin", body: { is_available: 1 } });
  const r2 = await call("POST", "/api/orders", { body: orderBody([line(dish.id)]) });
  eq(r1.status, 400, "sold out");
  eq(r2.status, 201, "available again");
});

await scenario("dish deleted while in cart -> refused with a message", async () => {
  const dish = await makeDish(`Deleted ${stamp}`, 300);
  await call("DELETE", `/api/menu/${dish.id}`, { role: "admin" });
  const r = await call("POST", "/api/orders", { body: orderBody([line(dish.id)]) });
  eq(r.status, 400, "status");
});

await scenario("price raised after the customer saw the total -> 409 price_changed, nothing charged, coupon NOT used", async () => {
  const dish = await makeDish(`Pricey ${stamp}`, 400);
  const code = `PC${stamp}`;
  await makeCoupon(code, 50, 10);
  await call("PATCH", `/api/menu/${dish.id}`, { role: "admin", body: { price_pkr: 450 } });
  const stale = 400 - 50 + 100; // what the customer's screen said
  const r = await call("POST", "/api/orders", { body: orderBody([line(dish.id)], { coupon_code: code, expected_total: stale }) });
  eq(r.status, 409, "status");
  eq(r.json.code, "price_changed", "code");
  eq(r.json.new_total, 450 - 50 + 100, "new_total");
  eq(await couponUsage(code), 0, "coupon usage after refused order");
  const ok = await call("POST", "/api/orders", { body: orderBody([line(dish.id)], { coupon_code: code, expected_total: r.json.new_total }) });
  eq(ok.status, 201, "retry with the new total");
});

console.log("\nDouble taps, spam and rushes");
await scenario("same basket tapped 6 times at once -> ONE order", async () => {
  const body = orderBody([line(burger.id, 3)]);
  const rs = await Promise.all(Array.from({ length: 6 }, () => call("POST", "/api/orders", { body })));
  const refs = new Set(rs.filter((r) => r.json?.order).map((r) => r.json.order.reference));
  eq(refs.size, 1, "distinct orders created");
});

await scenario("one phone number can't hold more than 3 active orders (prank/spam guard)", async () => {
  const phone = freshPhone();
  const statuses = [];
  for (let i = 1; i <= 4; i++) {
    const r = await call("POST", "/api/orders", { body: orderBody([line(burger.id, i)], { customer_phone: phone }) });
    statuses.push(r.status);
  }
  eq(statuses.join(","), "201,201,201,429", "statuses for 4 different baskets from one phone");
});

await scenario("per-IP rate limit stops order flooding", async () => {
  const ip = freshIp();
  let blocked = 0;
  for (let i = 0; i < 14; i++) {
    const r = await call("POST", "/api/orders", { ip, body: orderBody([line(fries.id, 1 + (i % 5))]) });
    if (r.status === 429) blocked++;
  }
  expect(blocked >= 3, `expected some 429s, saw ${blocked}`);
});

await scenario("LIMITED COUPON in a rush: 40 parallel orders, coupon max 7 -> exactly 7 discounted", async () => {
  const dish = await makeDish(`Rush ${stamp}`, 600);
  const code = `RUSH${stamp}`;
  await makeCoupon(code, 100, 7);
  const rs = await Promise.all(
    Array.from({ length: 40 }, () => call("POST", "/api/orders", { body: orderBody([line(dish.id)], { coupon_code: code }) }))
  );
  const created = rs.filter((r) => r.status === 201).length;
  const discounted = rs.filter((r) => r.json?.order?.discount_pkr === 100).length;
  eq(created, 40, "orders created");
  eq(discounted, 7, "orders that got the discount");
  eq(await couponUsage(code), 7, "coupon usage counter");
});

console.log("\nStaff actions");
await scenario("cancelling an order gives the coupon use back; reopening takes it again", async () => {
  const code = `CX${stamp}`;
  await makeCoupon(code, 50, 3);
  const o = await call("POST", "/api/orders", { body: orderBody([line(burger.id)], { coupon_code: code }) });
  eq(o.status, 201, "create");
  eq(await couponUsage(code), 1, "usage after order");
  await call("PATCH", `/api/orders/${o.json.order.id}`, { role: "manager", body: { status: "cancelled" } });
  eq(await couponUsage(code), 0, "usage after cancel");
  await call("PATCH", `/api/orders/${o.json.order.id}`, { role: "admin", body: { status: "pending" } });
  eq(await couponUsage(code), 1, "usage after admin reopen");
});

await scenario("status only moves forward; finished orders are locked; kitchen can't verify payment", async () => {
  const o = (await call("POST", "/api/orders", { body: orderBody([line(burger.id)]) })).json.order;
  const patch = (role, body) => call("PATCH", `/api/orders/${o.id}`, { role, body }).then((r) => r.status);
  eq(await patch("kitchen", { status: "preparing" }), 200, "kitchen -> preparing");
  eq(await patch("kitchen", { payment_verified: 1 }), 403, "kitchen verifies payment");
  eq(await patch("manager", { status: "pending" }), 409, "backwards");
  eq(await patch("manager", { status: "delivered" }), 200, "-> delivered");
  eq(await patch("manager", { status: "cancelled" }), 409, "cancel delivered order");
  eq(await patch("admin", { status: "pending" }), 200, "admin reopen");
});

await scenario("admin-only endpoints reject anonymous callers", async () => {
  for (const [m, p] of [["GET", "/api/orders"], ["GET", "/api/analytics?range=today"], ["GET", "/api/coupons"], ["GET", "/api/orders/pending-count"], ["PATCH", "/api/orders/1"]]) {
    eq((await call(m, p, { body: m === "PATCH" ? { status: "ready" } : undefined })).status, 401, `${m} ${p}`);
  }
});

console.log("\nPrivacy and tracking");
await scenario("public tracking hides id, GPS, screenshot and masks name/phone/address", async () => {
  const phone = freshPhone();
  const o = (await call("POST", "/api/orders", { body: orderBody([line(burger.id)], { customer_phone: phone, customer_name: "Ahmed Raza Khan", customer_lat: 31.5, customer_lng: 74.3 }) })).json.order;
  const t = await call("GET", `/api/orders/track/${o.reference}`);
  eq(t.status, 200, "track status");
  const pub = t.json.order ?? t.json;
  for (const k of ["id", "customer_lat", "customer_lng", "payment_proof_url", "payment_ocr_result"]) expect(!(k in pub), `public order leaks "${k}"`);
  expect(!JSON.stringify(pub).includes(phone), "full phone number leaked");
  expect(!JSON.stringify(pub).includes("Raza"), "middle/last name leaked");
  const lower = await call("GET", `/api/orders/track/${o.reference.toLowerCase()}`);
  eq(lower.status, 200, "lower-case code also works (customers type it that way)");
});

await scenario("tracking an unknown code is a clean 404", async () => {
  eq((await call("GET", "/api/orders/track/ZZZZZZ")).status, 404, "status");
});

console.log("\nReporting");
await scenario("dashboard: chart totals add up to the headline totals for every range", async () => {
  for (const range of ["today", "week", "month", "year"]) {
    const r = await call("GET", `/api/analytics?range=${range}`, { role: "admin" });
    eq(r.status, 200, `${range} status`);
    const chartRevenue = r.json.revenueSeries.reduce((s, b) => s + b.revenue, 0);
    const chartOrders = r.json.revenueSeries.reduce((s, b) => s + b.orders, 0);
    eq(chartRevenue, r.json.revenuePkr, `${range}: chart revenue vs headline`);
    expect(chartOrders <= r.json.orderCount, `${range}: chart counts more orders than headline`);
  }
});

// clean up what we can
await setSettings({ orders_paused: 0, min_order_pkr: 0, business_open_time: "12:00", business_close_time: "02:00" });

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} scenarios passed`);
process.exit(failed.length ? 1 : 0);
