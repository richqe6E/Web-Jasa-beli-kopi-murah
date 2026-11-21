/* ============================================================
   KONFIGURASI APLIKASI & SUPABASE (V4 OFFICIAL CATALOG & ADS)
   Ubah nomor WhatsApp, area, dan teks layanan di sini.
   ============================================================ */
window.DLM_CONFIG = {
  appName: "Dibeliin Lebih Murah",
  shortName: "Dibeliin",
  tagline: "Jasa order minuman & makanan resmi lebih hemat.",
  city: "Samarinda",
  region: "Kalimantan Timur",
  areaLabel: "Samarinda, Kalimantan Timur",

  // Supabase Cloud Integration (ap-southeast-1)
  supabaseUrl: "https://qfjjhnudiyybuqddwlav.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmampobnVkaXl5YnVxZGR3bGF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUyNTE3NzcsImV4cCI6MjExMDgyNzc3N30.IwJMkRvkIrSPCN8QUGApT-z8IaJJRknQcVEKT15mKzc",
  supabasePublishableKey: "sb_publishable_S1CYFAZFtWPxKjvqMKmMNQ_WUyOrQy0",

  // Nomor WhatsApp Admin (bisa diubah langsung dari halaman Admin)
  adminWhatsApp: "6281234567890",
  adminWhatsAppDisplay: "0812-3456-7890",

  currency: "IDR",
  orderPrefix: "DLM",
  serviceFeeIncluded: true,
  serviceFeeMode: "included_per_item",
  defaultServiceFeePerItem: 2000,
  defaultServiceFeePerOrder: 0,
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

  // Intro Splash Promo Stories saat pertama kali website dibuka
  splashPromos: [
    {
      id: "splash-tomoro-montblanc",
      brandId: "tomoro",
      brandName: "Tomoro Coffee",
      logo: "src/assets/brands/tomoro-official.webp",
      badge: "SPESIAL TOMORO • DISKON S/D 45%",
      title: "Mont Blanc Series & Master S.O.E.",
      subtitle: "Cokelat spesial Pipiltin Cocoa & 100% Arabica lebih hemat lewat Dibeliin Lebih Murah.",
      image: "src/assets/ads/tomoro/01-mont-blanc-series-poster.webp",
      secondaryImage: "src/assets/ads/tomoro/08-banner-mont-blanc-series.webp",
      accent: "#FF5A1F"
    },
    {
      id: "splash-kenangan-purplecloud",
      brandId: "kenangan",
      brandName: "Kopi Kenangan",
      logo: "src/assets/brands/kenangan-official.webp",
      badge: "NEW PURPLE CLOUD • HEMAT 42%",
      title: "Purple Cloud Series & 2 Mantan 29RB",
      subtitle: "Taro Cloud Matcha, Taro Cloud Latte & Kopi Kenangan Mantan harga spesial setiap hari.",
      image: "src/assets/ads/kenangan/01-purple-cloud-series-haechan.webp",
      secondaryImage: "src/assets/ads/kenangan/02-2-kopi-kenangan-mantan-29rb.webp",
      accent: "#991B1B"
    },
    {
      id: "splash-fore-saltbread",
      brandId: "fore",
      brandName: "Fore Coffee",
      logo: "src/assets/brands/fore-emblem.webp",
      badge: "FORE COFFEE • HEMAT S/D 50%",
      title: "New Salt Bread Combo & Kopi Dari Tani",
      subtitle: "Salt Bread hangat gurih berpadu Butterscotch Sea Salt Latte favoritmu di Samarinda.",
      image: "src/assets/ads/fore/02-salt-bread-combo-36k.webp",
      secondaryImage: "src/assets/ads/fore/03-bundle-junior-and-me-49k.webp",
      accent: "#006041"
    },
    {
      id: "splash-janjijiwa-japan",
      brandId: "janji-jiwa",
      brandName: "Janji Jiwa",
      logo: "src/assets/brands/janji-jiwa-official.webp",
      badge: "JANJI JIWA • PROMO COMBO 30K",
      title: "1 Jiwa Toast + 1 Drink & Twist of Japan",
      subtitle: "Nikmati Borneo Latte, Crispy Chicken Mentai Toast, hingga Ultimate Holiday Set.",
      image: "src/assets/ads/janji-jiwa/05-1-toast-1-drink-30k.webp",
      secondaryImage: "src/assets/ads/janji-jiwa/03-twist-of-japan-toast-drink.webp",
      accent: "#E11D48"
    }
  ],

  // Slider Kartu Iklan Resmi pada Halaman Utama Outlet (#/outlet)
  promoSlides: [
    {
      id: "ad-tomoro-1",
      brandId: "tomoro",
      brandName: "Tomoro Coffee",
      badge: "TOMORO • MONT BLANC SERIES",
      title: "Mocha & Choco Mont Blanc by Pipiltin",
      subtitle: "Promo mulai Rp 18.500 sudah termasuk biaya jasa",
      image: "src/assets/ads/tomoro/08-banner-mont-blanc-series.webp"
    },
    {
      id: "ad-kenangan-1",
      brandId: "kenangan",
      brandName: "Kopi Kenangan",
      badge: "KOPI KENANGAN • PURPLE CLOUD",
      title: "New Purple Cloud Series x NCT Haechan",
      subtitle: "Taro Cloud Matcha & Latte diskon spesial setiap hari",
      image: "src/assets/ads/kenangan/01-purple-cloud-series-haechan.webp"
    },
    {
      id: "ad-fore-1",
      brandId: "fore",
      brandName: "Fore Coffee",
      badge: "FORE COFFEE • SALT BREAD COMBO",
      title: "Deliciously Buttery Salt Bread + Kopi Fore",
      subtitle: "Tersedia di seluruh cabang Fore Coffee Samarinda",
      image: "src/assets/ads/fore/02-salt-bread-combo-36k.webp"
    },
    {
      id: "ad-janji-1",
      brandId: "janji-jiwa",
      brandName: "Janji Jiwa",
      badge: "JANJI JIWA • COMBO HEMAT",
      title: "1 Jiwa Toast + 1 Drink Mulai 30K",
      subtitle: "Paduan roti panggang renyah & kopi susu dari hati",
      image: "src/assets/ads/janji-jiwa/05-1-toast-1-drink-30k.webp"
    },
    {
      id: "ad-kenangan-2",
      brandId: "kenangan",
      brandName: "Kopi Kenangan",
      badge: "KOPI KENANGAN • DUO MANTAN",
      title: "2 Kopi Kenangan Mantan Lebih Hemat",
      subtitle: "Pesan bareng teman lebih murah tanpa minimal order",
      image: "src/assets/ads/kenangan/02-2-kopi-kenangan-mantan-29rb.webp"
    },
    {
      id: "ad-tomoro-2",
      brandId: "tomoro",
      brandName: "Tomoro Coffee",
      badge: "TOMORO • DAILY DUO BUNDLE",
      title: "Daily Duo Bundle: Kopi + Pastry Hangat",
      subtitle: "Aren Latte + Croissant / Danish harga spesial",
      image: "src/assets/ads/tomoro/09-banner-monthly-promo-daily-duo-bundle.webp"
    },
    {
      id: "ad-fore-2",
      brandId: "fore",
      brandName: "Fore Coffee",
      badge: "FORE • BUNDLE JUNIOR & ME",
      title: "Fore Junior & Kopi Dari Tani Favorit",
      subtitle: "Butterscotch Milk Crumble + Kopi Dari Tani",
      image: "src/assets/ads/fore/03-bundle-junior-and-me-49k.webp"
    },
    {
      id: "ad-janji-2",
      brandId: "janji-jiwa",
      brandName: "Janji Jiwa",
      badge: "JANJI JIWA x CHEF RAY JANSON",
      title: "A Twist of Japan: Menchi Katsu & Goma Toast",
      subtitle: "Edisi kolaborasi spesial + 1 minuman segar",
      image: "src/assets/ads/janji-jiwa/03-twist-of-japan-toast-drink.webp"
    }
  ],

  storageKeys: {
    deviceId: "dlm_device_id_v1",
    splashSeen: "dlm_splash_seen_session_v4",
    brand: "dlm_brand_v6",
    outlet: "dlm_outlet_v6",
    customer: "dlm_customer_v6",
    cart: "dlm_cart_v6",
    orders: "dlm_orders_v5",
    catalogCache: "dlm_catalog_cache_v6"
  },

  navTabs: [
    { key: "outlet", label: "Outlet", icon: "store" },
    { key: "menu", label: "Menu", icon: "cup-soda" },
    { key: "cart", label: "Keranjang", icon: "shopping-bag" },
    { key: "history", label: "Riwayat", icon: "receipt" }
  ]
};
