import { config } from "dotenv";
config({ path: ".env.local" });
config();
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

async function seed() {
  // Dynamic imports — deliberately not static top-level imports. ES module imports are
  // hoisted above all other code regardless of source order, so a static `import { db }`
  // here would run (and lib/db/index.ts's "is DATABASE_URL set?" check would fire) before
  // the config() calls above ever execute. Dynamic imports run in real execution order.
  const { db } = await import("../lib/db");
  const { menuItems, settings, admins } = await import("../lib/db/schema");
  const existing = await db.select().from(menuItems).limit(1);
  if (existing.length === 0) {
    await db.insert(menuItems).values([
      { name: "The Signature Wagyu Cheeseburger", description: "Wagyu beef patty, aged cheddar, caramelized onions, house sauce, brioche bun.", category: "Gourmet Burgers", pricePkr: 1900, imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80", isAvailable: 1, isBestseller: 1, rating: 4.9 },
      { name: "Smoky BBQ Chicken Burger", description: "Grilled chicken thigh, smoked BBQ glaze, crispy onions, coleslaw.", category: "Gourmet Burgers", pricePkr: 1450, imageUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80", isAvailable: 1, isBestseller: 0, rating: 4.6 },
      { name: "Truffle Oil Chili Fries", description: "Hand-cut fries, truffle oil, chili flakes, parmesan.", category: "Premium Sides", pricePkr: 1200, imageUrl: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&q=80", isAvailable: 1, isBestseller: 1, rating: 4.7 },
      { name: "Loaded Nacho Platter", description: "Corn tortilla chips, melted cheese, jalapeños, salsa, sour cream.", category: "Premium Sides", pricePkr: 1350, imageUrl: "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=800&q=80", isAvailable: 1, isBestseller: 0, rating: 4.5 },
      { name: "Artisan Oreo Shake", description: "Vanilla bean ice cream, crushed Oreo, whipped cream.", category: "Artisan Drinks", pricePkr: 950, imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80", isAvailable: 1, isBestseller: 1, rating: 4.8 },
      { name: "Fresh Mint Lemonade", description: "Muddled mint, fresh lemon, soda, mint leaf garnish.", category: "Artisan Drinks", pricePkr: 550, imageUrl: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=800&q=80", isAvailable: 1, isBestseller: 0, rating: 4.4 },
      { name: "Belgian Chocolate Mousse", description: "Dark Belgian chocolate mousse, cocoa dust, gold leaf.", category: "Desserts", pricePkr: 1100, imageUrl: "https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?w=800&q=80", isAvailable: 1, isBestseller: 1, rating: 4.9 },
      { name: "Classic New York Cheesecake", description: "Baked cheesecake, berry compote, graham crust.", category: "Desserts", pricePkr: 950, imageUrl: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=800&q=80", isAvailable: 1, isBestseller: 0, rating: 4.6 },
    ]);
    console.log("✓ Menu items seeded");
  } else {
    console.log("→ Menu items already exist, skipping");
  }

  const defaultSettings: Record<string, string> = {
    restaurant_name: "Flaming Bites",
    hero_headline: "Crave It. Order It. Love It.",
    hero_subheadline: "Gourmet burgers and comfort food, made fresh, delivered fast — all across the city.",
    accent_color: "#c1272d",
    delivery_fee_pkr: "150",
    default_delivery_minutes: "45",
    loyalty_pkr_per_point: "100",
    phone: "+92 300 1234567",
    address: "Main Boulevard, Gulberg, Lahore",
    whatsapp: "+923001234567",
    business_open_time: "12:00",
    business_close_time: "02:00",
  };

  for (const [key, value] of Object.entries(defaultSettings)) {
    await db
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: settings.key, set: { value } });
  }
  console.log("✓ Settings seeded");

  const existingAdmin = await db.select().from(admins).limit(1);
  if (existingAdmin.length === 0) {
    const email = process.env.ADMIN_EMAIL || "admin@flamingbites.pk";
    // No built-in default password (a published default is a backdoor on every new site).
    // Use ADMIN_PASSWORD if you set it, otherwise a random one is generated and shown ONCE.
    const generated = !process.env.ADMIN_PASSWORD;
    const password = process.env.ADMIN_PASSWORD || randomBytes(9).toString("base64url");
    const passwordHash = await bcrypt.hash(password, 10);
    await db.insert(admins).values({ email, passwordHash, role: "admin" });
    console.log(`✓ Admin account created: ${email}`);
    if (generated) {
      console.log(`  Generated password (shown only once — save it now): ${password}`);
    } else {
      console.log("  Password taken from the ADMIN_PASSWORD environment variable.");
    }
  } else {
    console.log("→ Admin account already exists, skipping");
  }

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
