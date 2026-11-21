/* ============================================================
   KONFIGURASI APLIKASI & SUPABASE
   Ubah nomor WhatsApp, area, dan teks layanan di sini.
   ============================================================ */
window.DLM_CONFIG = {
  appName: "Dibeliin Lebih Murah",
  shortName: "Dibeliin",
  tagline: "Jasa order minuman & makanan, harga lebih ramah.",
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
  operationalNote: "Jam operasional dapat berubah. Konfirmasi ketersediaan outlet via WhatsApp.",
  maxToppings: 3,

  storageKeys: {
    brand: "dlm_brand_v4",
    outlet: "dlm_outlet_v4",
    customer: "dlm_customer_v4",
    cart: "dlm_cart_v4",
    orders: "dlm_orders_v4",
    catalogCache: "dlm_catalog_cache_v4"
  },

  steps: [
    { key: "brand", label: "Brand", title: "Pilih Brand" },
    { key: "outlet", label: "Outlet", title: "Pilih Outlet" },
    { key: "menu", label: "Menu", title: "Pilih Menu" },
    { key: "cart", label: "Keranjang", title: "Keranjang" },
    { key: "checkout", label: "Checkout", title: "Data Pemesan" }
  ]
};
