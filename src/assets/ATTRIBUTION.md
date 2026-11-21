# Atribusi Aset & Lisensi

Proyek ini memakai aset visual dari sumber terbuka. Sebelum dipakai komersial,
baca catatan penting di bagian bawah.

## Ikon antarmuka

- **Lucide** — https://lucide.dev — lisensi **ISC**.
  File SVG disimpan di `src/assets/icons/lucide/`.
- **Simple Icons** — https://simpleicons.org — lisensi **CC0 1.0**.
  Dipakai untuk mark WhatsApp di `src/assets/icons/whatsapp.svg`.
  Merek dagang tetap milik pemiliknya.

## Logo pembayaran & bank

- **idn-finlogos** — https://github.com/hafidznoor/idn-finlogos
  - Kode/build: MIT.
  - **Aset SVG logo: CC BY-NC 4.0 (non-komersial).**
  - File: `qris.svg`, `gopay.svg`, `ovo.svg`, `dana.svg`, `shopeepay.svg`,
    `bca.svg`, `mandiri.svg`, `bri.svg`, `bni.svg` di `src/assets/payments/`.
- **datatrans/payment-logos** — https://github.com/datatrans/payment-logos
  - Lisensi **CC BY-SA 4.0**.
  - File: `visa.svg`, `mastercard.svg`, `jcb.svg`.

## Foto produk

Foto di `src/assets/products/` berasal dari **Unsplash**
(https://unsplash.com) dan tunduk pada **Unsplash License**.
Foto hanya ilustrasi/dummy; ganti dengan foto produk resmi bila tersedia.

## Tipografi

- **Plus Jakarta Sans** — lisensi **SIL Open Font License 1.1**,
  dimuat dari Google Fonts.

## Lisensi perangkat lunak

Kode aplikasi ini ditulis khusus untuk proyek ini. Ikon dan logo pihak ketiga
tetap tunduk pada lisensi masing-masing di atas.

---

## PENTING untuk penggunaan komersial

1. **Logo bank/e-wallet/QRIS bukan milik proyek ini.** Hak merek tetap pada
   pemiliknya. Untuk situs komersial, gunakan aset resmi dari masing-masing
   penyedia atau minta izin tertulis.
2. **idn-finlogos aset SVG berlisensi CC BY-NC 4.0** — tidak untuk penggunaan
   komersial tanpa izin. Ganti dengan logo resmi sebelum situs dipakai untuk
   transaksi nyata.
3. **datatrans/payment-logos berlisensi CC BY-SA 4.0** — wajib atribusi dan
   share-alike bila didistribusikan ulang.
4. **Logo brand kopi** (Tomoro, Fore, Kopi Kenangan, Janji Jiwa) adalah merek
   dagang pemiliknya. Saat ini aplikasi memakai monogram tipografis. Jika logo
   resmi dikirim, simpan file di `src/assets/brands/` dan isi properti `logo`
   pada data brand. Pastikan Anda punya hak memakainya.
5. QRIS dan rekening **tidak** ditampilkan di aplikasi ini. Detail pembayaran
   dikirim admin melalui WhatsApp untuk menghindari QR/placeholder palsu.
