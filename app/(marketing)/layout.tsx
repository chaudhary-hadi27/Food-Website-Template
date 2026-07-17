import { CartProvider } from "@/components/features/cart/cart-context";
import { LanguageProvider } from "@/lib/i18n";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { FloatingCartBar } from "@/components/features/cart/floating-cart-bar";
import { getSiteSettings } from "@/lib/get-settings";

export const dynamic = "force-dynamic";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();

  return (
    <LanguageProvider>
      <CartProvider>
        <Header restaurantName={settings.restaurant_name} />
        <main>{children}</main>
        <Footer settings={settings} />
        <FloatingCartBar />
      </CartProvider>
    </LanguageProvider>
  );
}
