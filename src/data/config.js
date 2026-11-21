/* ============================================================
   KONFIGURASI APLIKASI
   Ubah nomor WhatsApp, area, dan teks layanan di sini.
   ============================================================ */
window.DLM_CONFIG = {
  appName: "Dibeliin Lebih Murah",
  shortName: "Dibeliin",
  tagline: "Jasa order minuman & makanan, harga lebih ramah.",
  city: "Samarinda",
  region: "Kalimantan Timur",
  areaLabel: "Samarinda, Kalimantan Timur",

  // DUMMY — ganti dengan nomor admin yang sebenarnya.
  adminWhatsApp: "6281234567890",
  adminWhatsAppDisplay: "0812-3456-7890",

  currency: "IDR",
  orderPrefix: "DLM",
  serviceFeeIncluded: true,
  paymentNote: "Metode pembayaran akan diinformasikan admin melalui WhatsApp setelah pesanan dikonfirmasi.",
  operationalNote: "Jam operasional dapat berubah. Konfirmasi ketersediaan outlet via WhatsApp.",
  maxToppings: 3,

  storageKeys: {
    brand: "dlm_brand_v3",
    outlet: "dlm_outlet_v3",
    customer: "dlm_customer_v3",
    cart: "dlm_cart_v3",
    orders: "dlm_orders_v3",
    ui: "dlm_ui_v3"
  },

  steps: [
    { key: "brand", label: "Brand", title: "Pilih Brand" },
    { key: "outlet", label: "Outlet", title: "Pilih Outlet" },
    { key: "menu", label: "Menu", title: "Pilih Menu" },
    { key: "cart", label: "Keranjang", title: "Keranjang" },
    { key: "checkout", label: "Checkout", title: "Data Pemesan" }
  ]
};
