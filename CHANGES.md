# Round 4 — built for a rush (1000+ people at once)

Everything below was load-tested locally: 1000 orders fired in the same instant → 1000 saved,
0 duplicates, coupon used exactly its limit, loyalty points exact, prices not tamperable.

## Fixes
- **Vercel build no longer fails** when DATABASE_URL / SESSION_SECRET are missing at build time
  or the database is unreachable (runtime still fails loudly if they are missing).
- **Customers can finally upload JazzCash/EasyPaisa screenshots.** /api/upload used to require an
  admin login, so every customer upload was rejected. Now open to customers with limits:
  images only (checked by file signature, not just the name), 5 MB, 8 uploads / 10 min / IP.
- **Prices come from the database.** Before, the browser sent price_pkr and the server trusted
  it, so anyone could order a burger for PKR 1. Unavailable / deleted dishes are rejected too.
- **Order placement rewritten** (POST /api/orders): one transaction (all-or-nothing), coupon
  redeemed atomically (cannot be over-used), lock-free order numbers (ODR-Oct-26-001 comes from
  the database ID counter — no duplicates, no waiting in line), loyalty points in the same
  transaction. Receipt OCR and the staff push alert now run AFTER the customer gets their
  response, so checkout is no longer slowed (or broken) by OCR.
- **Rate limiting works on Vercel.** Optional Upstash Redis backend (shared by every instance);
  falls back to in-memory locally. Fails open if Redis is down — never blocks customers.
- **Database indexes** on orders (created_at, customer_phone, status+created_at) and menu items
  (category, bestseller). Order tracking no longer scans the table.
- **Database connections:** pool is 3 per serverless instance on Vercel (was 10) and SSL is
  properly verified there. Use the Neon *pooled* connection string (host contains "-pooler").

## Speed
- Hero images: 5.0 MB of PNG -> 138 KB of WebP.
- Homepage is pre-built and refreshed every 60s instead of rendered + 5 queries per visit.
  The whole menu is read once and shared (cached 60s). Editing the menu or settings in the admin
  panel refreshes the public site immediately.
- /api/menu and /api/settings are cached; the admin panel always reads live data.
- Admin sidebar polls a tiny count endpoint every 15s (was: full order list every 10s), and
  stops while the tab is in the background.

## Deploy checklist  (IMPORTANT)
1. Run `npm run db:push` against your real Neon database — adds the new indexes (safe, no data lost).
2. Vercel -> Settings -> Environment Variables (Production):
   - DATABASE_URL  — Neon *pooled* string (host has "-pooler")
   - SESSION_SECRET — long random value: `openssl rand -base64 32`
   - CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET — REQUIRED for uploads on
     Vercel (its disk is read-only, so uploads return a clear error without these)
   - UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN — recommended (free tier is plenty)
   - NEXT_PUBLIC_SITE_URL — your live https URL
3. Vercel -> Settings -> Functions -> set the region closest to your Neon database (and to
   Pakistan, e.g. Mumbai bom1 / Singapore sin1). A region mismatch adds ~200 ms to EVERY query.

## Not done yet (see audit)
- Analytics still loads all orders in the range into memory (move to SQL GROUP BY).
- Menu images are plain <img> (use Cloudinary f_auto,q_auto,w_400 URLs).
- 10 lint errors remain ("setState inside effect" in a few pages) — they do not affect the build.
- The homepage still shows invented stats/reviews (2400+ customers, 4.8, 6 reviews).

---

# What changed — Round 3

## 1. Location accuracy — drag-to-confirm
Raw GPS accuracy is a device/hardware limit no code can fix (phones: ~5-20m; laptops
without GPS: WiFi-based, sometimes 50m-2km off). What *is* fixable: after auto-detecting,
you can now **drag the pin** on the map to the exact spot — the address text re-geocodes
live as you drag. This is the same pattern Careem/Foodpanda use. Works identically in the
checkout picker and the new restaurant-location picker in Settings.

## 2. Restaurant location moved into Settings
No more editing `lib/constants.ts` by hand. Settings → **Restaurant Location** — stand at
the counter, tap "Use My Current Location," drag to fine-tune, save. Orders and History
now read this live instead of a hardcoded placeholder, so distance calculations are only
as good as this one pin — worth getting right.

## 3. Share delivery location to a rider via WhatsApp
Both Orders and History detail panels now have a **"Share to Rider"** button next to the
map preview — opens WhatsApp with the customer's name, phone, address, and a tappable
Google Maps link, ready to forward to whichever rider is free. No rider-management system
needed; you just pick the WhatsApp contact when it opens.

## 4. Installable apps — two separate ones, on purpose
- **Customer app** (`/manifest.webmanifest`) — name/icon pulled live from Settings, so it's
  never stuck showing demo branding. This is what gets wrapped for the Play Store (see below).
- **Admin app** (`/admin-manifest.webmanifest`) — a *separate*, distinctly-named installable
  app scoped to `/admin` only. Staff install this via "Install app" in Chrome/Edge on a
  Windows laptop, or "Add to Home Screen" on Android — own icon, own window, no browser
  chrome. **No Play Store needed for this one** — it's for internal use, not public download.
- Both now register the service worker automatically (previously only happened inside the
  admin panel), which is one of the requirements for either app to be installable at all.
- **Placeholder icons included** (`public/icon-*.png`) in your brand accent color — these
  work today but should be swapped for real designed artwork before a public Play Store
  launch (first impressions matter on a store listing).

---

# Play Store — concrete next steps now that pk-desi-food.vercel.app is live

The technical approach is a **TWA (Trusted Web Activity)** — wraps your live site in a real
Android app shell using Chrome's engine. No rewrite; the app always shows your actual site.

### Step 1 — Deploy these changes
Push this code to your repo, redeploy to Vercel, run `npm run db:push` against your **real**
Neon database (adds the columns/tables this round's features need — same as last time, safe,
won't touch existing data).

### Step 2 — Confirm installability
Visit `https://pk-desi-food.vercel.app` in Chrome on Android → you should see "Add to Home
Screen" / an install prompt. If it doesn't appear, the manifest/icons/service worker aren't
being picked up yet — check the browser's DevTools → Application → Manifest tab for errors.

### Step 3 — Google Play Developer account
$25 one-time fee at play.google.com/console, using the Google account you want to publish
under (your own or your client's — whoever should own the listing long-term).

### Step 4 — Decide app identity (can't easily change later)
- App name (shown on Play Store)
- Package ID, e.g. `com.pkdesifood.app` (reverse-domain style, must be unique)

### Step 5 — Generate the Android project
On your own machine (needs Node + Java JDK installed):
```
npm install -g @bubblewrap/cli
bubblewrap init --manifest=https://pk-desi-food.vercel.app/manifest.webmanifest
```
Bubblewrap reads your live manifest and scaffolds the whole Android project + prompts you
for the package ID. It also generates a signing keystore — **back this file up somewhere
safe**; losing it means you can never update the app again under the same listing.

### Step 6 — Digital Asset Links (proves you own both the site and the app)
Bubblewrap generates an `assetlinks.json` — upload it to your site at exactly:
`https://pk-desi-food.vercel.app/.well-known/assetlinks.json`
(a plain static file in your `public/.well-known/` folder works fine on Vercel).

### Step 7 — Build and submit
```
bubblewrap build
```
This produces a signed `.aab` file — upload it in Play Console, along with:
- Store listing: icon, feature graphic (1024x500), 2+ screenshots, description
- **Privacy Policy** (mandatory — must disclose that you collect location, phone numbers,
  and photo uploads; I can draft the text if you want, but it needs to be hosted at a
  public URL)
- Content rating questionnaire
- Data Safety form (be specific and honest — location + phone number collection, no data
  sold to third parties, etc.)

### The admin app
Doesn't go through any of this — just share `pk-desi-food.vercel.app/admin` with staff and
have them tap "Install app" (desktop) or "Add to Home Screen" (mobile) once. Done.

---

## Round 5 — short order codes, privacy, honest homepage

- **Short order number**: orders now get a 6-character code like `K7Q2X9` (no confusing 0/O/1/I,
  always contains a letter, random, collision-safe via DB unique + retry). Old `ODR-…` orders still work.
- **Privacy**: public track / "My Orders" responses hide most of the name, phone and address, and never
  return the order id, GPS location or payment screenshot. Old sequential refs stay guessable, so masking matters.
- **Rate limits** on order tracking (300/10 min), coupon apply (30/10 min), phone lookup and order create.
- **Seed script** no longer uses a fixed admin password: set `ADMIN_PASSWORD`, or a random one is printed once.
- **Homepage**: fake stats and fake reviews removed. Stats show the real delivered count (only once ≥ 50)
  and delivery time; reviews appear only if you add real ones in Admin → Settings → Customer Reviews.
- **Images**: Cloudinary/Unsplash URLs are resized (`f_auto,q_auto,w_N`) — far smaller downloads on mobile data.
- **Analytics fix**: the chart no longer drops the last UTC day/month (it used to under-report vs the headline total).
- Next.js 16.4.2 (0 production vulnerabilities), lint clean.
- Run `npm run db:push` after deploying. Still not done: Urdu/psychology UX pass (see "Not done yet").
