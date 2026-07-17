# Flaming Bites — Restaurant Ordering & Reservation Platform

A full-stack restaurant website built with Next.js 16: online menu browsing, cart & checkout (PKR, COD/JazzCash/EasyPaisa/Bank Transfer), coupons, loyalty points, live order tracking with delivery-time estimates, table reservations, an English/Urdu toggle, and a complete admin dashboard with role-based staff access — no code changes needed for day-to-day operations.

## 1. Setup

### 1.1 Install dependencies
```bash
npm install
```

### 1.2 Get a free database (Postgres)
This app uses Postgres via Drizzle ORM. Works with any Postgres connection string. Two free options:

**Option A — Neon (recommended)**
1. Go to https://neon.tech → sign up free → create a project
2. Copy the connection string (starts with `postgres://`)

**Option B — Supabase**
1. Go to https://supabase.com → create a free project
2. Project Settings → Database → Connection string → URI

### 1.3 Configure environment
Copy `.env.example` to `.env.local` and fill in:
```
DATABASE_URL=your-connection-string-here
SESSION_SECRET=generate-with: openssl rand -base64 32
ADMIN_EMAIL=admin@yourrestaurant.com
ADMIN_PASSWORD=choose-a-strong-password
NEXT_PUBLIC_SITE_URL=https://yourrestaurant.com
```
`SESSION_SECRET` is required in production — the app will refuse to start without it, since it's what keeps admin logins secure.

### 1.4 Create tables and seed sample data
```bash
npm run db:push
npm run db:seed
```
This creates the database tables and adds sample menu items, default settings, and your admin login (role: `admin`).

### 1.5 Run locally
```bash
npm run dev
```
Visit http://localhost:3000 for the site, and http://localhost:3000/admin/login for the admin dashboard.

## 2. Deploying
Standard Next.js app — deploys cleanly to Vercel (recommended), Railway, or any Node host. Add the same environment variables in your host's dashboard, then run `db:push` and `db:seed` once against your production `DATABASE_URL`.

**Note on the image upload feature:** uploaded photos are saved to `public/uploads` on disk. This works great on a VPS/Railway (persistent filesystem) but **not** on Vercel, where the filesystem is temporary and uploads will disappear on redeploy. On Vercel, use the "Image URL" field with a photo hosting link instead, or swap in a cloud storage provider (S3, Cloudinary, etc.) later.

## 3. What admin can control

Every role below signs in at the same `/admin/login` — the dashboard automatically shows only what that role is allowed to touch.

| Feature | Admin | Manager | Kitchen |
|---|---|---|---|
| Dashboard & analytics | ✅ | ✅ | ✅ |
| Orders (status + delivery time) | ✅ | ✅ | ✅ |
| Reservations | ✅ | ✅ | ❌ |
| Menu (add/edit/delete/availability) | ✅ | ✅ | ❌ |
| Coupons | ✅ | ✅ | ❌ |
| Staff accounts | ✅ | ❌ | ❌ |
| Site settings | ✅ | ❌ | ❌ |

- **Menu** — add/edit/delete dishes, upload photos directly or paste a URL, toggle availability instantly, mark bestsellers
- **Orders** — live status updates (Pending → Preparing → Ready → Delivered/Cancelled), **manual per-order delivery time override**, revenue/top-sellers charts on the dashboard
- **Reservations** — confirm, decline, or mark complete
- **Coupons** — percentage or fixed-amount discount codes, usage limits, expiry dates
- **Staff** — add team members with a role (Admin/Manager/Kitchen); the system won't let you remove the last remaining Admin
- **Settings** — restaurant name, homepage copy, accent color, delivery fee, default delivery time, loyalty points ratio, contact info

## 4. Delivery time tracking
- Admin sets a **default delivery time** (minutes) under Settings — auto-applied to every new order.
- Orders page lets admin override that time per order (rush hour, kitchen backlog, etc.).
- Customers see a live countdown on `/order/[reference]`, recalculated every second.

## 5. Coupons & Loyalty Points
- Admin creates codes (e.g. `WELCOME10` for 10% off) under `/admin/coupons`. Customers apply them at checkout; the discount is always recalculated and verified server-side, never trusted from the browser.
- Every order earns loyalty points based on the "PKR spent per point" setting, tracked by phone number (no account needed). Customers check their points and past orders at `/track` by entering the phone number they ordered with.

## 6. Language toggle
A quick EN/UR toggle lives in the header (and mobile menu). It covers primary navigation, the homepage, checkout, cart, and reservations. It's a lightweight dictionary-based approach — not a full translation of every string on every page — but the core ordering flow is bilingual. Ask if you'd like fuller coverage later.

## 7. Security notes
- **Order tracking uses an unguessable reference code** (e.g. `FB-ORD-56921IVS46`), never a sequential database ID — so no one can page through orders and see other customers' names/phone/address.
- **Login and order/reservation submission are rate-limited per IP** to slow down brute-force attempts and spam. This is in-memory, which is fine for a single-server deployment; a high-traffic multi-region deployment should swap in a Redis-backed limiter.
- **`SESSION_SECRET` is required in production** — the app throws a clear error on startup if it's missing, rather than silently using a predictable fallback.
- All inputs are validated server-side with Zod before touching the database.

## 8. Payment methods (Pakistan-specific)
Cash on Delivery, JazzCash, EasyPaisa, and Bank Transfer are built into checkout as **manual-confirmation** methods (customer sends payment, admin confirms). Live JazzCash/EasyPaisa API auto-verification was intentionally left out of this build — that's a separate integration your payment provider can help wire up when you're ready to go live with automated confirmation.

## 9. Project structure
```
app/
  (marketing)/        customer site: home, menu, cart, checkout, order tracking, reservations, track (order history), about, contact
  (admin)/admin/       login (no sidebar) + role-protected dashboard (sidebar, mobile drawer)
  api/                 all backend routes
components/
  ui/                  reusable primitives + Reveal, Parallax, AnimatedCounter, T (i18n)
  layout/              Header (with language toggle), Footer
  features/            cart context, menu cards, admin sidebar, analytics charts
lib/
  db/                  Drizzle schema + client
  validations.ts       Zod schemas — all inputs validated server-side
  auth.ts / session.ts JWT-based admin session handling (includes role)
  rate-limit.ts        in-memory IP rate limiter
  i18n.tsx             English/Urdu dictionary + toggle
scripts/seed.ts         seed script for sample data + admin account
```

## 10. White-labeling for reselling to other restaurants
Everything visual (name, colors, hero copy, contact info) lives in Settings and is editable from `/admin/settings` — no code edits needed to reskin this for a new restaurant client. For a true multi-tenant version (one deployment serving many restaurants), the next step would be adding a `restaurant_id` column across tables and scoping all queries by tenant — ask if you'd like this built out next.

## 11. Known simplifications (be aware of these)
- Customer "accounts" are phone-number-based lookup, not password-protected accounts — simpler for customers, but anyone who knows a phone number could look up its order history at `/track`. Fine for most small/medium restaurants; ask if you want full password-based accounts later.
- Urdu translation covers the primary ordering flow, not every string on every page.
- Image uploads are saved to local disk — works on VPS/Railway, not on Vercel (see section 2).
# Website
