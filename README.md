# Dibeliin Lebih Murah

Aplikasi web **mobile-first** untuk jasa order minuman & makanan di **Samarinda,
Kalimantan Timur**. Pelanggan memilih brand, outlet, menu, mengatur varian, lalu
mengirim pesanan yang sudah rapi ke WhatsApp admin.

Brand yang tersedia: **Tomoro Coffee, Fore Coffee, Kopi Kenangan, Janji Jiwa**.

---

## Menjalankan

Tidak perlu build tool. Cukup jalankan static server dari folder proyek:

```bash
python -m http.server 8000
```

Lalu buka `http://localhost:8000`.

> Buka lewat server, bukan double-click `index.html`. Protokol `file://`
> membatasi `localStorage` dan perilaku browser lainnya.

---

## Alur pemesanan

```text
[1] Pilih Brand → [2] Pilih Outlet → [3] Pilih Menu
                                           ↓
[5] Data Pemesan & WhatsApp ← [4] Keranjang
```

1. **Brand** — dashboard, promo, best seller, riwayat pesanan terakhir.
2. **Outlet** — pencarian, filter area, status buka, jarak (dummy).
3. **Menu** — pencarian, kategori, urutan, kartu produk, bottom sheet varian.
4. **Keranjang** — ubah jumlah, hapus, ringkasan hemat & total.
5. **Data pemesan** — nama, WhatsApp, pickup/delivery, alamat, catatan.
6. **WhatsApp** — pesan pesanan terformat rapi + kode pesanan.

---

## Struktur file

```text
index.html                  Shell aplikasi
manifest / favicon
src/
  css/app.css               Design system + seluruh komponen
  data/
    config.js               Nomor WA, kota, teks, storage key
    brands.js               4 brand + menu + grup opsi
    outlets.js              Outlet dummy Samarinda
  js/
    icons.js                Registry ikon Lucide/Simple Icons
    utils.js                Helper format, storage, validasi
    store.js                State brand/outlet/pelanggan + hash router
    cart.js                 Cart store + localStorage
    customizer.js           Bottom sheet varian produk
    whatsapp.js             Penyusun pesan & URL wa.me
    app.js                  Controller utama semua layar
  assets/
    products/               Foto dummy (WebP)
    icons/                  Ikon UI & WhatsApp
    payments/               Logo pembayaran
    brands/                 (kosong) tempat logo resmi nanti
    favicon.svg
    ATTRIBUTION.md          Lisensi aset
```

---

## Yang wajib diganti sebelum produksi

### 1. Nomor WhatsApp admin

Edit `src/data/config.js`:

```js
adminWhatsApp: "6281234567890",        // nomor dummy
adminWhatsAppDisplay: "0812-3456-7890",
```

Gunakan format kode negara tanpa `+` (contoh `62812xxxxxxx`).

### 2. Outlet

Edit `src/data/outlets.js`. Saat ini berisi 5 outlet dummy per brand di
Samarinda (Big Mall, Samarinda Central Plaza, Gajah Mada, dll). Ganti nama,
alamat, jam buka, dan jarak dengan data asli.

### 3. Menu & harga

Edit `src/data/brands.js`. Data sekarang adalah **dummy realistis**:
9 menu per brand, harga promo & harga coret, kategori, deskripsi, dan grup opsi.

Setiap item punya:

- `priceOriginal` — harga normal (coret)
- `priceDiscount` — harga yang dibayar pelanggan
- `optionGroups` — suhu, ukuran, gula, es, susu, topping, tambahan
- `type: "drink"` atau `"food"` — makanan otomatis tanpa opsi minuman

Harga sudah dianggap **termasuk biaya jasa** (`serviceFeeIncluded: true`),
sesuai permintaan. Tidak ada biaya jasa terpisah di checkout.

### 4. Logo brand resmi

Saat file logo dikirim:

1. Simpan di `src/assets/brands/`, misal `tomoro.svg`.
2. Isi properti `logo` pada brand di `src/data/brands.js`:

```js
logo: "src/assets/brands/tomoro.svg",
```

Jika `logo` kosong, aplikasi memakai **monogram tipografis** (T/F/K/J) dengan
warna brand. Tidak ada logo hasil generate.

### 5. Pembayaran

Aplikasi **tidak** menampilkan QRIS atau nomor rekening. Sesuai permintaan,
detail pembayaran dikirim admin lewat WhatsApp. Ubah teksnya di:

```js
paymentNote: "Metode pembayaran akan diinformasikan admin melalui WhatsApp ...",
```

Logo pembayaran di halaman checkout hanya informasi metode umum. Untuk
produksi, gunakan logo resmi/berizin (lihat `src/assets/ATTRIBUTION.md`).

### 6. Teks layanan

Semua teks utama (nama aplikasi, kota, catatan operasional, prefix kode
pesanan) ada di `src/data/config.js`.

---

## Mengubah tampilan

- **Warna & radius** — variabel di bagian `:root` pada `src/css/app.css`.
- **Font** — Plus Jakarta Sans dari Google Fonts (400–800).
- **Aksen brand** — `accent`, `accentSoft`, `accentDeep` di `brands.js`.
  Warna utama aplikasi tetap biru (`--primary`).
- **Animasi** — `reveal` (IntersectionObserver), transisi tombol, bottom sheet,
  bottom bar. Semua dimatikan otomatis saat `prefers-reduced-motion`.

---

## Fitur teknis

- Hash routing (`#/brand`, `#/outlet`, `#/menu`, `#/cart`, `#/checkout`) sehingga
  tombol back browser berfungsi.
- State brand/outlet/pelanggan/keranjang disimpan di `localStorage`.
- Keranjang tidak bisa mencampur brand; muncul konfirmasi sebelum mengosongkan.
- Validasi inline nama, nomor WhatsApp, dan alamat delivery.
- Bottom sheet dengan focus trap, Escape, klik backdrop, dan scroll lock.
- `aria-live` untuk toast, badge keranjang, dan progress.
- Fallback gambar rusak + empty state.
- Tanpa framework, tanpa build step, tanpa dependensi runtime.

---

## Catatan data dummy

- Nomor WhatsApp masih dummy.
- Outlet dan menu adalah contoh; belum data resmi.
- Foto produk dari Unsplash, bukan foto menu asli.
- Jarak outlet hanya ilustrasi.
- Riwayat pesanan disimpan lokal di browser pelanggan, bukan server.

---

## Lisensi aset

Lihat [`src/assets/ATTRIBUTION.md`](src/assets/ATTRIBUTION.md). Beberapa logo
pihak ketiga memiliki lisensi non-komersial / share-alike dan merek dagang
masing-masing. Ganti dengan aset resmi sebelum dipakai komersial.
