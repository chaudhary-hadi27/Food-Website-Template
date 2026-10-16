"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type Lang = "en" | "ur";

const DICTIONARY: Record<string, { en: string; ur: string }> = {
  nav_menu:           { en: "Menu",           ur: "Menu" },
  nav_contact:        { en: "Contact",         ur: "Contact Karen" },
  nav_my_orders:      { en: "My Orders",       ur: "Mere Orders" },
  nav_order_now:      { en: "Order Now",       ur: "Abhi Order Karen" },
  hero_order_now:     { en: "Order Now",       ur: "Abhi Order Karen" },
  explore_menu:       { en: "Explore the Menu",ur: "Menu Dekhein" },
  customer_favorites: { en: "Fan Favourites",  ur: "Sab ki Pasand" },
  view_full_menu:     { en: "View full menu →", ur: "Poora Menu Dekhein →" },
  loved_by_regulars:  { en: "What Our Guests Say", ur: "Hamare Mehmanon ki Rai" },
  our_menu:           { en: "Our Menu",        ur: "Hamara Menu" },
  search_dish:        { en: "Search for a dish...", ur: "Dish talaash karein..." },
  add_to_cart:        { en: "Add to cart",     ur: "Cart mein daalo" },
  your_cart:          { en: "Your Cart",        ur: "Aapka Cart" },
  cart_empty:         { en: "Your cart is empty", ur: "Cart khali hai" },
  cart_empty_desc:    { en: "Looks like you haven't added anything yet.", ur: "Aisa lagta hai ke aap ne abhi tak koi cheez add nahi ki." },
  each:               { en: "each",             ur: "har ek" },
  browse_menu:        { en: "Browse the Menu", ur: "Menu Dekhein" },
  proceed_checkout:   { en: "Proceed to Checkout", ur: "Checkout Karen" },
  checkout:           { en: "Checkout",         ur: "Checkout" },
  full_name:          { en: "Full Name",        ur: "Poora Naam" },
  phone_number:       { en: "Phone Number",     ur: "Phone Number" },
  delivery_address:   { en: "Delivery Address", ur: "Delivery ka Pata" },
  payment_method:     { en: "Payment Method",   ur: "Payment ka Tareeqa" },
  place_order:        { en: "Place Order",      ur: "Order Karein" },
  order_summary:      { en: "Order Summary",    ur: "Order ki Details" },
  subtotal:           { en: "Subtotal",          ur: "Subtotal" },
  delivery_fee:       { en: "Delivery Fee",      ur: "Delivery Fee" },
  total:              { en: "Total",             ur: "Kul Raqam" },
  get_in_touch:       { en: "Get in Touch",     ur: "Hamse Raabta Karen" },
  call_us:            { en: "Call Us",           ur: "Call Karen" },
  visit_us:           { en: "Visit Us",          ur: "Milen Hamarey Saath" },
  
  // NEW VISUAL & STATS KEYS
  customer_love:       { en: "Customer Love",     ur: "Hamare Customers ka Pyar" },
  what_locals_say:     { en: "What locals say",   ur: "Yahan ke logon ki pasand" },
  happy_customers_cnt: { en: "50+ happy customers",ur: "50+ khush customers" },
  happy_customers:     { en: "Happy Customers",   ur: "Khush Customers" },
  avg_rating:          { en: "Avg Rating",        ur: "Avg Rating" },
  avg_delivery:        { en: "Avg Delivery",      ur: "Delivery Time" },
  browse_by_category:  { en: "Browse by Category",ur: "Category Ke Mutabiq Dekhein" },
  view_all:            { en: "View all",          ur: "Sab dekhein" },
  every_bite_memory:   { en: "Every bite is a memory.", ur: "Har nivala ek yaadgar." },
  
  // CONTACT PAGE KEYS
  lets_connect:        { en: "Let's Connect",     ur: "Humse Raabta Karein" },
  contact_subtitle:    { en: "Questions, feedback, or bulk orders — we'd love to hear from you.", ur: "Sawaal, feedback, ya bulk orders ke liye — hum aapki sunna chahenge." },
  direct_line_answers: { en: "Direct line for quick answers", ur: "Fauri raabte ke liye" },
  quick_chat_whatsapp: { en: "Quick chat, order updates & more", ur: "Fauri chat aur order updates" },
  chat_now:            { en: "Chat Now",          ur: "Abhi Chat Karein" },
  come_say_hello:      { en: "Come say hello in person", ur: "Humse tashreef lakar milen" },
  working_hours:       { en: "Working Hours",     ur: "Kaam ke Aukaat" },
  working_hours_desc:  { en: "We're here to serve you fresh & hot throughout the week.", ur: "Hum poora hafta aapko garm aur taaza khana pesh karte hain." },
  order_via_whatsapp:  { en: "Order via WhatsApp", ur: "WhatsApp Par Order Karen" },

  // CART & CHECKOUT KEYS
  payment_cash:        { en: "Cash on Delivery",  ur: "Cash on Delivery (COD)" },
  coupon_code_lbl:     { en: "Coupon Code",       ur: "Coupon Code" },
  apply_btn:           { en: "Apply",             ur: "Lagayein" },
  enter_coupon_lbl:    { en: "Enter coupon code", ur: "Coupon code likhein" },
  your_name:           { en: "Your Name",         ur: "Aapka Naam" },
  phone_number_pak:    { en: "Pakistani Mobile Number", ur: "Pakistani Mobile Number" },
  estimated_delivery:  { en: "Estimated Delivery", ur: "Delivery ka Time" },
  order_placed_title:  { en: "Order Placed Successfully!", ur: "Order Kamyabi Se Ho Gaya!" },
  order_reference_lbl: { en: "Order Reference",    ur: "Order Number" },
  track_order_btn:     { en: "Track Order",       ur: "Order Track Karen" },
  payment_proof_upload: { en: "Upload Payment Proof", ur: "Payment ki Raseed Upload Karen" },

  // LOCATION PICKER KEYS
  use_current_location: { en: "Use My Current Location", ur: "Meri Mojooda Location Istemal Karen" },
  detecting_location:   { en: "Detecting your location…", ur: "Location talaash ki ja rahi hai…" },
  location_detected:    { en: "Location detected", ur: "Location mil gayi" },
  not_your_location:    { en: "Doesn't look right? Enter address manually", ur: "Sahi nahi lag raha? Pata khud likhen" },
  drag_pin_hint:        { en: "Drag the pin to your exact location", ur: "Pin ko apni sahi jagah par drag karein" },
  location_error:       { en: "Couldn't get your location. Please enter your address manually.", ur: "Location nahi mil saki. Baraye meherbani pata khud likhen." },

  // HOME TESTIMONIALS & OTHER TEXTS
  hungry_order_in_minutes: { en: "Hungry? Order in minutes.", ur: "Bhook lagi hai? Fauri order karein." },
  payment_methods_sub: { en: "COD · JazzCash · EasyPaisa · Bank Transfer", ur: "COD · JazzCash · EasyPaisa · Bank Transfer" },
  start_your_order:    { en: "Start Your Order",   ur: "Apna Order Shuru Karen" },

  review_1_text: { en: "Best pizza in the area! Crust is always perfect and delivery is fast. Our Friday family tradition now.", ur: "Is ilaake ka sab se behtareen pizza! Crust hamesha lajawab hota hai aur delivery tez hai. Ab hamari har juma ki family tradition ban chuki hai." },
  review_1_loc:  { en: "Bismillah Colony", ur: "Bismillah Colony" },
  review_1_item: { en: "Pepperoni Pizza", ur: "Pepperoni Pizza" },
  review_1_date: { en: "2 days ago", ur: "2 din pehle" },

  review_2_text: { en: "Chicken tikka pizza was a hit at our dawat. Proper cheese pull and desi flavors. Everyone asked for the number!", ur: "Chicken tikka pizza hamari dawat par buhat pasand kiya gaya. Behtareen cheese aur desi zaiqa. Sab ne number manga!" },
  review_2_loc:  { en: "Al Ahmed Garden", ur: "Al Ahmed Garden" },
  review_2_item: { en: "Chicken Tikka", ur: "Chicken Tikka" },
  review_2_date: { en: "5 days ago", ur: "5 din pehle" },

  review_3_text: { en: "Large pizza easily feeds 4. Their garlic bread is a must-try. Been ordering weekly for a month now!", ur: "Bara pizza aaram se 4 logon ke liye kafi hai. Inki garlic bread lazmi try karen. Ek mahine se har hafte order kar rahe hain!" },
  review_3_loc:  { en: "Green Land Society", ur: "Green Land Society" },
  review_3_item: { en: "Supreme Pizza", ur: "Supreme Pizza" },
  review_3_date: { en: "1 week ago", ur: "1 hafta pehle" },

  review_4_text: { en: "Cheese burst crust is a game changer! Kids loved it. Great for birthday parties. Highly recommended.", ur: "Cheese burst crust wakai kamaal hai! Bachon ko buhat pasand aaya. Birthday parties ke liye behtareen. Buhat recommended hai." },
  review_4_loc:  { en: "Bismillah Colony", ur: "Bismillah Colony" },
  review_4_item: { en: "Cheese Burst", ur: "Cheese Burst" },
  review_4_date: { en: "3 days ago", ur: "3 din pehle" },

  review_5_text: { en: "Spicy beef with extra jalapeños is my go-to. Consistent quality every time. Staff remembered my address!", ur: "Spicy beef aur jalapeños mera pasandida hai. Hamesha ek jaisa behtareen zaiqa. Staff ko mera pata bhi yaad ho gaya hai!" },
  review_5_loc:  { en: "Al Ahmed Garden", ur: "Al Ahmed Garden" },
  review_5_item: { en: "Spicy Beef", ur: "Spicy Beef" },
  review_5_date: { en: "1 day ago", ur: "1 din pehle" },

  review_6_text: { en: "BBQ chicken pizza was delicious! Smoky flavor, tender chicken. Finally a place that delivers hot to our area.", ur: "BBQ chicken pizza buhat mazedar tha! Smoky flavor aur narm chicken. Aakhir kaar ek aisi jagah mili jo hamare ilaake mein garm khana deliver karti hai." },
  review_6_loc:  { en: "Green Land Society", ur: "Green Land Society" },
  review_6_item: { en: "BBQ Chicken", ur: "BBQ Chicken" },
  review_6_date: { en: "4 days ago", ur: "4 din pehle" },
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
      <div dir="ltr">{children}</div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
