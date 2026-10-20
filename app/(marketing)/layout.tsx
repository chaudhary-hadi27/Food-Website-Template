import { CartProvider } from "@/components/features/cart/cart-context";
import { LanguageProvider } from "@/lib/i18n";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BottomNav } from "@/components/layout/bottom-nav";
import { FloatingCartBar } from "@/components/features/cart/floating-cart-bar";
import { getSiteSettings } from "@/lib/get-settings";


export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();

  return (
    <LanguageProvider>
      <CartProvider>
        <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
          <Header restaurantName={settings.restaurant_name} />
          <main className="flex-1 pb-16 md:pb-0">{children}</main>
          <Footer settings={settings} />
          <FloatingCartBar />
          <BottomNav />
        </div>
      </CartProvider>
    </LanguageProvider>
  );
}
