# Empathy Map — Flaming Bites Restaurant Platform

## Target Users
1. **Hungry customer (mobile, in a hurry)** — wants to decide what to eat and order in under 2 minutes
2. **Returning customer** — wants to reorder their usual without re-browsing the whole menu
3. **Customer planning ahead** — wants to book a table for a specific date/time without calling
4. **Restaurant owner/admin (non-technical)** — wants to run the entire business from one dashboard without calling a developer

## Pain Points We're Solving
1. Menus that are hard to scan on mobile (tiny text, no photos, no prices visible)
2. No visibility into order status after placing it — anxiety of "did they even get my order?"
3. Reservation by phone call is slow, no confirmation, easy to forget
4. Admin has to ask a developer for every small change (price update, new dish, disabling an item that's out of stock)
5. No PKR-native payment options (COD / JazzCash / EasyPaisa) — international-only checkouts don't work for local customers

## Emotional Journey
Anxious (unsure what to order, is the site trustworthy?) → Curious (browsing categories, seeing photos/prices) → Confident (cart total is clear, payment method is familiar/local) → Satisfied (order confirmed, status visible) → Loyal (comes back because reordering is one click)

## Cognitive Load Check
- Menu browsing: category tabs + search, no login required to browse
- Ordering: cart always visible, total always visible in PKR, 3-step checkout max
- Reservation: single form, no account required, instant confirmation
- Admin: one dashboard, plain-language labels, no jargon, every action has an undo/confirm step

## Retention Hooks
- Order status tracking (reduces anxiety, builds trust)
- "Order again" one-click reorder from history
- Reservation confirmation with reference number
- Admin sees live orders/reservations without refreshing (polling)

## UI → Backend Contract (per skill requirement)
| UI Element | Backend |
|---|---|
| Menu grid | `/api/menu` (SQLite-backed), categories + items |
| Cart + Checkout | Client cart state → `/api/orders` POST → persisted order |
| Order status page | `/api/orders/[id]` GET |
| Reservation form | `/api/reservations` POST → persisted, confirmation number |
| Admin menu CRUD | `/api/menu` POST/PATCH/DELETE, authenticated |
| Admin orders view | `/api/orders` GET/PATCH (status update), authenticated |
| Admin reservations view | `/api/reservations` GET/PATCH, authenticated |
| Admin settings (site name, hero text, accent color) | `/api/settings` GET/PATCH, authenticated |
| Admin login | `/api/auth/login` (credential check + session cookie) |
