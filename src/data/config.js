/* ============================================================
   KONFIGURASI APLIKASI & SUPABASE
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
  defaultCostRatioPercent: 55,

  paymentNote: "Metode pembayaran akan diinformasikan admin melalui WhatsApp setelah pesanan dikonfirmasi.",
  operationalNote: "Harga sudah termasuk diskon jasa order. Ketersediaan menu mengikuti outlet Samarinda yang dipilih.",
  maxToppings: 3,

  // Logo resmi permanen (terkunci agar tidak tertimpa foto lain)
  lockedBrandLogos: {
    "tomoro": "src/assets/brands/tomoro-official.webp",
    "fore": "src/assets/brands/fore-official.webp",
    "kenangan": "src/assets/brands/kenangan-official.webp",
    "janji-jiwa": "src/assets/brands/janji-jiwa-official.svg"
  },

  // Slider iklan & promo otomatis pada halaman Pilih Outlet
  promoSlides: [
    {
      id: "slide-delight",
      badge: "PROMO JASTIP KOPI",
      title: "Diskon s/d 50% Semua Brand Favorit",
      subtitle: "Pilih outlet terdekat di Samarinda, atur varian minumanmu, bayar jauh lebih hemat!",
      image: "src/assets/vectors/coffee-delight-hero.svg",
      brandId: "tomoro",
      theme: "blue"
    },
    {
      id: "slide-tomoro",
      badge: "TOMORO COFFEE • HEMAT 45%",
      title: "Aren Latte & Mont Blanc Series",
      subtitle: "Mulai Rp 11.000-an sudah termasuk biaya jasa. Tersedia di Big Mall, SCP & Gajah Mada.",
      image: "src/assets/banners/banner-tomoro.webp",
      brandId: "tomoro",
      theme: "orange"
    },
    {
      id: "slide-kenangan",
      badge: "KOPI KENANGAN • DISKON 42%",
      title: "Kenangan Mantan & Cloud Series",
      subtitle: "Racikan gula aren favorit harga spesial setiap hari tanpa minimal order.",
      image: "src/assets/banners/banner-kenangan.webp",
      brandId: "kenangan",
      theme: "amber"
    },
    {
      id: "slide-fore",
      badge: "FORE COFFEE • HEMAT 50%",
      title: "Butterscotch Sea Salt & Salt Bread",
      subtitle: "Kopi artisan & pastry hangat Fore Coffee, tinggal pilih cabang terdekatmu.",
      image: "src/assets/banners/banner-fore.webp",
      brandId: "fore",
      theme: "emerald"
    }
  ],

  storageKeys: {
    deviceId: "dlm_device_id_v1",
    brand: "dlm_brand_v5",
    outlet: "dlm_outlet_v5",
    customer: "dlm_customer_v5",
    cart: "dlm_cart_v5",
    orders: "dlm_orders_v5",
    catalogCache: "dlm_catalog_cache_v5"
  },

  navTabs: [
    { key: "outlet", label: "Outlet", icon: "store" },
    { key: "menu", label: "Menu", icon: "cup-soda" },
    { key: "cart", label: "Keranjang", icon: "shopping-bag" },
    { key: "history", label: "Riwayat", icon: "receipt" }
  ]
};
