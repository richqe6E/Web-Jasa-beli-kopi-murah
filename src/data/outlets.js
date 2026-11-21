/* ============================================================
   DATA OUTLET — DUMMY, FOKUS SAMARINDA
   Nama & alamat contoh. Ganti dengan daftar outlet resmi.
   ============================================================ */
(function () {
  "use strict";

  const outlet = (brandId, slug, name, area, address, hours, distance) => ({
    id: `${brandId}-${slug}`,
    brandId,
    name,
    area,
    address,
    hours: hours || "08:00 - 22:00",
    distance: distance || "1.0 km",
    isOpen: true,
    mapsQuery: `${name}, ${address}, Samarinda`
  });

  window.DLM_OUTLETS = [
    // ================= TOMORO =================
    outlet("tomoro", "bigmall", "Big Mall Samarinda", "Samarinda Ulu", "Jl. Untung Suropati No. 8, Samarinda Ulu", "10:00 - 22:00", "0.8 km"),
    outlet("tomoro", "scp", "Samarinda Central Plaza", "Samarinda Kota", "Jl. Pelita No. 1, Samarinda Kota", "10:00 - 21:30", "1.2 km"),
    outlet("tomoro", "gajahmada", "Jl. Gajah Mada", "Samarinda Ulu", "Jl. Gajah Mada No. 45, Samarinda Ulu", "08:00 - 22:00", "1.9 km"),
    outlet("tomoro", "samarindasquare", "Samarinda Square", "Samarinda Ilir", "Jl. Mulawarman No. 12, Samarinda Ilir", "10:00 - 22:00", "2.6 km"),
    outlet("tomoro", "pahlawan", "Jl. Pahlawan", "Samarinda Seberang", "Jl. Pahlawan No. 88, Samarinda Seberang", "08:00 - 22:00", "4.1 km"),

    // ================= FORE =================
    outlet("fore", "bigmall", "Big Mall Samarinda", "Samarinda Ulu", "Jl. Untung Suropati No. 8, Samarinda Ulu", "10:00 - 22:00", "0.9 km"),
    outlet("fore", "citycentrum", "City Centrum Samarinda", "Samarinda Ulu", "Jl. Gajah Mada No. 1, Samarinda Ulu", "10:00 - 21:30", "1.4 km"),
    outlet("fore", "basuki", "Jl. Basuki Rahmat", "Samarinda Kota", "Jl. Basuki Rahmat No. 22, Samarinda Kota", "08:00 - 22:00", "2.0 km"),
    outlet("fore", "scp", "Samarinda Central Plaza", "Samarinda Kota", "Jl. Pelita No. 1, Samarinda Kota", "10:00 - 21:30", "2.7 km"),
    outlet("fore", "juanda", "Jl. Ir. H. Juanda", "Samarinda Ilir", "Jl. Ir. H. Juanda No. 15, Samarinda Ilir", "08:00 - 22:00", "3.8 km"),

    // ================= KOPI KENANGAN =================
    outlet("kenangan", "scp", "Samarinda Central Plaza", "Samarinda Kota", "Jl. Pelita No. 1, Samarinda Kota", "10:00 - 21:30", "1.0 km"),
    outlet("kenangan", "bigmall", "Big Mall Samarinda", "Samarinda Ulu", "Jl. Untung Suropati No. 8, Samarinda Ulu", "10:00 - 22:00", "1.3 km"),
    outlet("kenangan", "dahlan", "Jl. KH Ahmad Dahlan", "Samarinda Ulu", "Jl. KH Ahmad Dahlan No. 27, Samarinda Ulu", "08:00 - 22:00", "2.1 km"),
    outlet("kenangan", "lembuswana", "Lembuswana Cafe & Resto", "Samarinda Ulu", "Jl. S. Parman No. 21, Samarinda Ulu", "09:00 - 22:00", "3.0 km"),
    outlet("kenangan", "alimuddin", "Jl. Sultan Alimuddin", "Samarinda Seberang", "Jl. Sultan Alimuddin No. 10, Samarinda Seberang", "08:00 - 21:30", "4.5 km"),

    // ================= JANJI JIWA =================
    outlet("janji-jiwa", "gajahmada", "Jl. Gajah Mada", "Samarinda Ulu", "Jl. Gajah Mada No. 56, Samarinda Ulu", "08:00 - 22:00", "1.1 km"),
    outlet("janji-jiwa", "samarindasquare", "Samarinda Square", "Samarinda Ilir", "Jl. Mulawarman No. 12, Samarinda Ilir", "10:00 - 22:00", "1.8 km"),
    outlet("janji-jiwa", "hidayatullah", "Jl. P. Hidayatullah", "Samarinda Ulu", "Jl. P. Hidayatullah No. 33, Samarinda Ulu", "08:00 - 22:00", "2.4 km"),
    outlet("janji-jiwa", "bigmall", "Big Mall Samarinda", "Samarinda Ulu", "Jl. Untung Suropati No. 8, Samarinda Ulu", "10:00 - 22:00", "3.2 km"),
    outlet("janji-jiwa", "yamin", "Jl. M. Yamin", "Samarinda Seberang", "Jl. M. Yamin No. 18, Samarinda Seberang", "08:00 - 21:30", "4.8 km")
  ];
})();
