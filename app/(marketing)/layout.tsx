import { CartProvider } from "@/components/features/cart/cart-context";
import { LanguageProvider } from "@/lib/i18n";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BottomNav } from "@/components/layout/bottom-nav";
import { FloatingCartBar } from "@/components/features/cart/floating-cart-bar";
import { getSiteSettings, getSettingsMap } from "@/lib/get-settings";
import { StoreProvider } from "@/components/features/store/store-context";
import { StoreBanner } from "@/components/features/store/store-banner";


export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  const map = await getSettingsMap();
  const storeInputs = {
    business_open_time: map.business_open_time || "12:00",
    business_close_time: map.business_close_time || "02:00",
    orders_paused: map.orders_paused || "0",
    min_order_pkr: map.min_order_pkr || "0",
  };

  return (
    <LanguageProvider>
      <StoreProvider inputs={storeInputs}>
      <CartProvider>
        <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
          <Header restaurantName={settings.restaurant_name} />
          <StoreBanner />
          <main className="flex-1 pb-16 md:pb-0">{children}</main>
          <Footer settings={settings} />
          <FloatingCartBar />
          <BottomNav />
        </div>
      </CartProvider>
      </StoreProvider>
    </LanguageProvider>
  );
}
