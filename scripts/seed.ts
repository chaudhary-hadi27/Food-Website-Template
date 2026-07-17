import { config } from "dotenv";
import bcrypt from "bcryptjs";
import ws from "ws"; // <-- Add this import

// 1. Force environment variables to load first!
config({ path: ".env.local" });
config();

// 2. Assign WebSocket globally so the Neon Serverless driver can use it in a Node script
if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = ws as any;
}

async function seed() {
  // 3. Dynamically import database elements AFTER envs and WS are fully ready
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
    restaurant_name: "Fast Food",
    hero_headline: "Crave It. Order It. Love It.",
    hero_subheadline: "Gourmet burgers and comfort food, made fresh, delivered fast — all across the city.",
    accent_color: "#c1272d",
    delivery_fee_pkr: "150",
    default_delivery_minutes: "45",
    phone: "+92 300 1234567",
    address: "Main Boulevard, Gulberg, Lahore",
    whatsapp: "+923001234567",
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
    const email = process.env.ADMIN_EMAIL || "admin@restaurant.pk";
    const password = process.env.ADMIN_PASSWORD || "admin123";
    const passwordHash = await bcrypt.hash(password, 10);
    await db.insert(admins).values({ email, passwordHash });
    console.log(`✓ Admin account created: ${email} (password from ADMIN_PASSWORD env, or default)`);
  } else {
    console.log("→ Admin account already exists, skipping");
  }

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
