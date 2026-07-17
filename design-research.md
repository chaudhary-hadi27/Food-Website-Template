# Design Research — Restaurant Industry

## Reference Analysis (per client's explicit direction: white/minimal base, single accent)
- **Apple.com**: white background, huge product photography, one accent color used sparingly on CTAs only, generous whitespace
- **Stripe.com**: neutral base + single brand accent, smooth scroll-linked animations, clear typographic hierarchy
- **Sweetgreen / Cava (US fast-casual)**: white/cream base, food photography as the hero, category pills, minimal chrome
- **Foodpanda / Careem (regional food delivery)**: sticky cart summary, live order tracking, PKR-native checkout, WhatsApp support links

## Color Decision
Client explicitly requested: white background, minimal palette, most big websites use 1 dominant accent, not a busy multi-color scheme.

- **Background**: `#FFFFFF` / off-white surface `#FAFAF8`
- **Text primary**: `#1A1A1A` (charcoal, not pure black)
- **Text secondary**: `#6B6B6B`
- **Accent (single, swappable per client for white-label reuse)**: `#C1272D` (appetite-triggering red, matches food/restaurant industry psychology) with a warm gold `#C9A227` used only as a secondary/rare highlight (badges, ratings)
- **Border/neutral**: `#E5E5E5`
- Max 2 accents total (red primary CTA, gold secondary) — stays under the 3-accent ceiling and keeps the site calm/premium rather than busy

## Typography
- One font family, two roles: `Inter` for UI/body, `Playfair Display` for hero/display headings only (premium serif contrast, matches "CRAVE IT" style headline energy without going full-dark-theme)

## Spacing Rhythm
Content-heavy site → 8px base scale (8/16/24/32/48/64/96)

## Trust Signals to Include
- Star ratings on menu items
- "X orders today" live counter (real, derived from DB — not fake)
- Order status transparency (Pending → Preparing → Ready → Delivered)
- Reservation confirmation reference number

## Interaction Patterns
- Sticky header (logo, search, cart badge)
- Scroll fade-in for sections (respects prefers-reduced-motion)
- Hover lift + image zoom on menu cards
- Skeleton loading states for menu/orders
- Floating cart summary bar once first item added
