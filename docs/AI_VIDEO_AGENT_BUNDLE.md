# Paket Konteks UI/UX & Master Prompt untuk Agen AI Video (Remotion / Claude / Cursor / Runway)

Gunakan dokumen ini jika Anda ingin memberikan instruksi lengkap beserta sistem desain **JasDor RisGold (`https://jasdor.web.id`)** ke agen AI pembuat video eksternal.

---

## 1. File Kode Sumber UI/UX di Repository
Berikan 4 file berikut ke agen AI Anda agar visual video 100% identik dengan aplikasi asli:
1. `index.html` - Kerangka halaman utama, *Top Bar*, *3D Splash Screen*, dan *Bottom Navigation 5-Tab* (`Outlet`, `Menu`, `Keranjang`, `Testimoni`, `Riwayat`).
2. `src/css/app.css` - Sistem desain *Liquid Glass*, variabel CSS warna, kartu menu, badge diskon, dan layout responsif.
3. `src/js/app.js` - Komponen UI/UX:
   - Pemilihan Brand & 51 Outlet GPS (`Samarinda`, `Balikpapan`, `Tenggarong`)
   - Katalog Menu & Paket Bundling
   - Kartu Royal Blue **Perbandingan Pengeluaran (Total Beli di Toko Resmi vs Total Beli di JasDor RisGold)**
   - Modal **Struk Digital (JPG)** (`Unduh Struk (JPG)` + `Lanjut Kirim ke WA`)
   - Modal Obrolan **Testimoni Pelanggan** ala WhatsApp
4. `src/js/customizer.js` - *Bottom Sheet* varian produk (Suhu, Ukuran, Beans, Milk, Sugar, Ice, Syrup, Topping) & *Bundle Builder*.

---

## 2. Design Tokens Resmi JasDor RisGold

```json
{
  "brandName": "JasDor RisGold",
  "domain": "https://jasdor.web.id",
  "cities": ["Samarinda", "Balikpapan", "Tenggarong"],
  "officialBrands": [
    { "id": "kenangan", "name": "Kopi Kenangan", "accent": "#991B1B", "promo": "Diskon s/d 44%" },
    { "id": "fore", "name": "Fore Coffee", "accent": "#006041", "promo": "Diskon Resmi 21%" },
    { "id": "janji-jiwa", "name": "Janji Jiwa", "accent": "#E11D48", "promo": "Diskon s/d 40%" },
    { "id": "tomoro", "name": "Tomoro Coffee", "accent": "#FF5A1F", "promo": "Segera Tersedia" }
  ],
  "colors": {
    "background": "#F4F8FF",
    "surface": "#FFFFFF",
    "primaryRoyalBlue": "#0B6BCB",
    "primaryDeep": "#084F99",
    "skyHighlight": "#38BDF8",
    "emeraldSuccess": "#16A34A",
    "textPrimary": "#0F172A",
    "textSecondary": "#475569"
  },
  "fonts": {
    "heading": "Outfit (700, 800)",
    "body": "DM Sans (400, 500, 700)",
    "priceMono": "JetBrains Mono (700, 800)"
  }
}
```

---

## 3. Master Prompt Siap Salin untuk Agen AI Pembuat Video

Salin blok di bawah ini dan tempelkan ke Agen AI Video Anda:

```text
Buatkan video promosi 3D Motion Graphics bergaya Blender Product Launch (durasi 30 detik, 60 FPS, resolusi vertikal 9:16 1080x1920) untuk aplikasi web "JasDor RisGold" (https://jasdor.web.id) - layanan jasa order resmi Kopi Kenangan, Fore Coffee, dan Janji Jiwa di Samarinda, Balikpapan, dan Tenggarong dengan harga lebih hemat 21% hingga 44% dan ambil langsung di kasir outlet resmi.

Gunakan gaya visual:
- 3D Smartphone Titanium Blue melayang di studio gelap (#061229) dengan pencahayaan rim light biru-cyan (#0B6BCB & #38BDF8) dan aksen hemat hijau emerald (#16A34A).
- Kartu UI "Liquid Glass" keluar (pop-out) secara 3D dari layar HP dengan bayangan kedalaman (z-depth parallax) dan indikator sentuhan jari (touch ripple).
- Hindari penggunaan tanda strip panjang (em-dash) dan hindari ikon bintang sparkles AI; gunakan desain bersih dan profesional.

Alur 6 Scene (Total 30 Detik):
1. [00:00 - 00:04.5] HOOK: 3 kartu brand resmi (Kopi Kenangan, Fore Coffee, Janji Jiwa) mengorbit HP 3D. Kartu harga toko resmi Rp 28.000 tercoret merah dan flip 3D menjadi harga JasDor RisGold Rp 18.000 (Hemat s/d 44%). Teks: "Ngopi Resmi di Outlet Terdekat, Kok Bisa Semurah Ini?"
2. [00:04.5 - 00:10] LANGKAH 1 (PILIH OUTLET GPS): Kamera tilt isometrik. Pill kota "Samarinda • Balikpapan • Tenggarong" dan kartu cabang "Samarinda Central Plaza (0.8 km • WITA: Sedang Buka)" melayang keluar dari layar HP lalu disentuh.
3. [00:10 - 00:17] LANGKAH 2 (PILIH MENU, VARIAN & BUNDLING): Pop-out 3 layer kartu: (a) Kopi Kenangan Mantan Rp 15.000 (harga toko Rp 22.000), (b) Paket Berdua Rp 35.000 (2 Minuman + 2 Makanan), (c) Pill opsi "Ice • Regular • Normal Sugar" dan klik tombol "+ Masukkan ke Keranjang".
4. [00:17 - 00:22] LANGKAH 3 (BUKTI HEMAT): Kartu Royal Blue Perbandingan Pengeluaran melayang ke depan kamera: "Total Beli di Toko Resmi: Rp 57.000 (coret)" vs "Total di JasDor RisGold: Rp 35.000" dengan badge hijau "Hemat Rp 22.000 (39%) • Biaya Admin Rp 0!".
5. [00:22 - 00:26] LANGKAH 4 (STRUK DIGITAL JPG & WA): Kartu Struk Pemesanan Resmi (#DLM-261123-8949) keluar secara 3D dari atas HP dengan tombol "Unduh Struk Digital (JPG)" dan klik tombol hijau "Lanjut Kirim Pesanan ke WhatsApp".
6. [00:26 - 00:30] SOCIAL PROOF & CTA: 2 balon chat testimoni terverifikasi (Rating 5.0 bintang) melayang di kiri-kanan HP, ditutup kartu CTA besar: "Buka Sekarang: https://jasdor.web.id - Ambil Langsung di Kasir Outlet Resmi!".
```
