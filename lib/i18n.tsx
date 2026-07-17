"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type Lang = "en" | "ur";

const DICTIONARY: Record<string, { en: string; ur: string }> = {
  nav_menu: { en: "Menu", ur: "مینیو" },
  nav_reservations: { en: "Reservations", ur: "بکنگ" },
  nav_about: { en: "About", ur: "ہمارے بارے میں" },
  nav_contact: { en: "Contact", ur: "رابطہ" },
  nav_my_orders: { en: "My Orders", ur: "میرے آرڈرز" },
  nav_order_now: { en: "Order Now", ur: "ابھی آرڈر کریں" },
  hero_order_now: { en: "Order Now", ur: "ابھی آرڈر کریں" },
  hero_book_table: { en: "Book a Table", ur: "میز بک کریں" },
  explore_menu: { en: "Explore the Menu", ur: "مینیو دیکھیں" },
  customer_favorites: { en: "Customer Favorites", ur: "پسندیدہ ڈشز" },
  view_full_menu: { en: "View full menu →", ur: "مکمل مینیو دیکھیں →" },
  loved_by_regulars: { en: "Loved by Regulars", ur: "ہمارے مستقل گاہکوں کی پسند" },
  our_menu: { en: "Our Menu", ur: "ہمارا مینیو" },
  search_dish: { en: "Search for a dish...", ur: "ڈش تلاش کریں..." },
  add_to_cart: { en: "Add to cart", ur: "کارٹ میں شامل کریں" },
  your_cart: { en: "Your Cart", ur: "آپ کا کارٹ" },
  cart_empty: { en: "Your cart is empty", ur: "آپ کا کارٹ خالی ہے" },
  browse_menu: { en: "Browse the Menu", ur: "مینیو دیکھیں" },
  proceed_checkout: { en: "Proceed to Checkout", ur: "چیک آؤٹ کریں" },
  checkout: { en: "Checkout", ur: "چیک آؤٹ" },
  full_name: { en: "Full Name", ur: "پورا نام" },
  phone_number: { en: "Phone Number", ur: "فون نمبر" },
  delivery_address: { en: "Delivery Address", ur: "ڈیلیوری ایڈریس" },
  payment_method: { en: "Payment Method", ur: "ادائیگی کا طریقہ" },
  place_order: { en: "Place Order", ur: "آرڈر کریں" },
  order_summary: { en: "Order Summary", ur: "آرڈر کی تفصیل" },
  subtotal: { en: "Subtotal", ur: "ذیلی کل" },
  delivery_fee: { en: "Delivery Fee", ur: "ڈیلیوری فیس" },
  total: { en: "Total", ur: "کل رقم" },
  book_a_table: { en: "Book a Table", ur: "میز بک کریں" },
  request_reservation: { en: "Request Reservation", ur: "بکنگ کی درخواست دیں" },
  number_of_guests: { en: "Number of Guests", ur: "مہمانوں کی تعداد" },
  date: { en: "Date", ur: "تاریخ" },
  time: { en: "Time", ur: "وقت" },
  get_in_touch: { en: "Get in Touch", ur: "ہم سے رابطہ کریں" },
  call_us: { en: "Call Us", ur: "ہمیں کال کریں" },
  visit_us: { en: "Visit Us", ur: "ہمیں ملیں" },
  our_story: { en: "Our Story", ur: "ہماری کہانی" },
};

type DictKey = keyof typeof DICTIONARY;

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: DictKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);
const STORAGE_KEY = "flaming-bites-lang";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (saved === "en" || saved === "ur") setLangState(saved);
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const t = useCallback(
    (key: DictKey) => DICTIONARY[key]?.[lang] ?? DICTIONARY[key]?.en ?? String(key),
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      <div dir={lang === "ur" ? "rtl" : "ltr"}>{children}</div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
