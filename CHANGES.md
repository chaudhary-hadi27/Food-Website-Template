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
