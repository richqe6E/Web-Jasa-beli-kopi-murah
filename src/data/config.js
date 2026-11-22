/* ============================================================
   KONFIGURASI APLIKASI & SUPABASE (V4 OFFICIAL CATALOG & ADS)
   Ubah nomor WhatsApp, area, dan teks layanan di sini.
   ============================================================ */
window.DLM_CONFIG = {
  appName: "Dibeliin Lebih Murah",
  shortName: "Dibeliin",
  tagline: "Jasa order minuman & makanan resmi lebih hemat.",
  city: "Samarinda, Balikpapan & Tenggarong",
  region: "Kalimantan Timur",
  areaLabel: "Samarinda, Balikpapan & Tenggarong • Kalimantan Timur",

  // Supabase Cloud Integration (ap-southeast-1)
  supabaseUrl: "https://qfjjhnudiyybuqddwlav.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmampobnVkaXl5YnVxZGR3bGF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUyNTE3NzcsImV4cCI6MjExMDgyNzc3N30.IwJMkRvkIrSPCN8QUGApT-z8IaJJRknQcVEKT15mKzc",
  supabasePublishableKey: "sb_publishable_S1CYFAZFtWPxKjvqMKmMNQ_WUyOrQy0",

  // Nomor WhatsApp Admin (bisa diubah langsung dari halaman Admin)
  adminWhatsApp: "6281234567890",
  adminWhatsAppDisplay: "0812-3456-7890",

  currency: "IDR",
  orderPrefix: "DLM",
  serviceFeeIncluded: false,
  serviceFeeMode: "partner_exact",
  defaultServiceFeePerItem: 0,
  defaultServiceFeePerOrder: 2000,
  defaultCostRatioPercent: 52,

  paymentNote: "Metode pembayaran akan diinformasikan admin melalui WhatsApp setelah pesanan dikonfirmasi.",
  operationalNote: "Harga sudah termasuk diskon jasa order. Ketersediaan menu mengikuti outlet Samarinda yang dipilih.",
  maxToppings: 3,

  // Logo resmi permanen dari folder Logo Outlate dan Brand (terkunci)
  lockedBrandLogos: {
    "tomoro": "src/assets/brands/tomoro-official.webp",
    "fore": "src/assets/brands/fore-emblem.webp",
    "kenangan": "src/assets/brands/kenangan-official.webp",
    "janji-jiwa": "src/assets/brands/janji-jiwa-official.webp"
  },

  lockedBrandWordmarks: {
    "tomoro": "src/assets/brands/tomoro-official.webp",
    "fore": "src/assets/brands/fore-official.webp",
    "kenangan": "src/assets/brands/kenangan-wordmark.webp",
    "janji-jiwa": "src/assets/brands/janji-jiwa-wordmark.webp"
  },

  // Intro Splash Promo Stories saat pertama kali website dibuka (V5 HD 4:5 Clean Posters)
  splashPromos: [
    {
      id: "splash-tomoro-montblanc",
      brandId: "tomoro",
      brandName: "Tomoro Coffee",
      logo: "src/assets/brands/tomoro-official.webp",
      image: "src/assets/ads/tomoro/v5/01-mont-blanc-poster.webp",
      accent: "#FF5A1F"
    },
    {
      id: "splash-kenangan-purplecloud",
      brandId: "kenangan",
      brandName: "Kopi Kenangan",
      logo: "src/assets/brands/kenangan-official.webp",
      image: "src/assets/ads/kenangan/v5/01-purple-cloud-haechan.webp",
      accent: "#991B1B"
    },
    {
      id: "splash-fore-saltbread",
      brandId: "fore",
      brandName: "Fore Coffee",
      logo: "src/assets/brands/fore-emblem.webp",
      image: "src/assets/ads/fore/v5/01-salt-bread-meet.webp",
      accent: "#006041"
    },
    {
      id: "splash-janjijiwa-blooming",
      brandId: "janji-jiwa",
      brandName: "Janji Jiwa",
      logo: "src/assets/brands/janji-jiwa-official.webp",
      image: "src/assets/ads/janji-jiwa/v5/01-blooming-holiday.webp",
      accent: "#E11D48"
    }
  ],

  // Slider Kartu Iklan Resmi HD 4:5 pada Halaman Utama Outlet (#/outlet)
  promoSlides: [
    {
      id: "ad-tomoro-1",
      brandId: "tomoro",
      brandName: "Tomoro Coffee",
      title: "Tomoro Mont Blanc Series",
      image: "src/assets/ads/tomoro/v5/01-mont-blanc-poster.webp",
      accent: "#FF5A1F"
    },
    {
      id: "ad-kenangan-1",
      brandId: "kenangan",
      brandName: "Kopi Kenangan",
      title: "Kopi Kenangan Purple Cloud Series",
      image: "src/assets/ads/kenangan/v5/01-purple-cloud-haechan.webp",
      accent: "#991B1B"
    },
    {
      id: "ad-fore-1",
      brandId: "fore",
      brandName: "Fore Coffee",
      title: "Fore Coffee Salt Bread Series",
      image: "src/assets/ads/fore/v5/01-salt-bread-meet.webp",
      accent: "#006041"
    },
    {
      id: "ad-janji-1",
      brandId: "janji-jiwa",
      brandName: "Janji Jiwa",
      title: "Janji Jiwa Blooming Holiday Series",
      image: "src/assets/ads/janji-jiwa/v5/01-blooming-holiday.webp",
      accent: "#E11D48"
    },
    {
      id: "ad-tomoro-2",
      brandId: "tomoro",
      brandName: "Tomoro Coffee",
      title: "Tomoro Triple Pistachio Series",
      image: "src/assets/ads/tomoro/v5/03-triple-pistachio-choco.webp",
      accent: "#FF5A1F"
    },
    {
      id: "ad-kenangan-2",
      brandId: "kenangan",
      brandName: "Kopi Kenangan",
      title: "Kopi Kenangan Secret Recipe Black Aren",
      image: "src/assets/ads/kenangan/v5/03-kopi-susu-black-aren.webp",
      accent: "#991B1B"
    },
    {
      id: "ad-fore-2",
      brandId: "fore",
      brandName: "Fore Coffee",
      title: "Fore Coffee Salt Bread Irresistible Bite",
      image: "src/assets/ads/fore/v5/02-salt-bread-bite.webp",
      accent: "#006041"
    },
    {
      id: "ad-janji-2",
      brandId: "janji-jiwa",
      brandName: "Janji Jiwa",
      title: "Janji Jiwa Ube Series",
      image: "src/assets/ads/janji-jiwa/v5/02-ube-series.webp",
      accent: "#E11D48"
    }
  ],

  storageKeys: {
    deviceId: "dlm_device_id_v1",
    splashSeen: "dlm_splash_seen_session_v5",
    brand: "dlm_brand_v6",
    outlet: "dlm_outlet_v6",
    customer: "dlm_customer_v6",
    cart: "dlm_cart_v6",
    orders: "dlm_orders_v5",
    catalogCache: "dlm_catalog_cache_v7"
  },

  navTabs: [
    { key: "outlet", label: "Outlet", icon: "store" },
    { key: "menu", label: "Menu", icon: "cup-soda" },
    { key: "cart", label: "Keranjang", icon: "shopping-bag" },
    { key: "history", label: "Riwayat", icon: "receipt" }
  ]
};
