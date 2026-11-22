/* ============================================================
   DATA OUTLET SAMARINDA — KOORDINAT GPS ASLI (REAL HAVERSINE)
   Jarak dihitung secara real-time dari GPS perangkat pelanggan.
   ============================================================ */
(function () {
  "use strict";

  const outlet = (brandId, slug, name, area, address, hours, lat, lng) => ({
    id: `${brandId}-${slug}`,
    brandId,
    name,
    area,
    address,
    hours: hours || "08:00 - 22:00",
    lat: typeof lat === "number" ? lat : null,
    lng: typeof lng === "number" ? lng : null,
    distance: null,
    isOpen: true,
    mapsQuery: `${name}, ${address}, Samarinda`
  });

  window.DLM_OUTLETS = [
    // ================= TOMORO =================
    outlet("tomoro", "bigmall", "Big Mall Samarinda", "Samarinda Ulu", "Jl. Untung Suropati No. 8, Samarinda Ulu", "10:00 - 22:00", -0.52598, 117.11557),
    outlet("tomoro", "scp", "Samarinda Central Plaza", "Samarinda Kota", "Jl. Pelita No. 1, Samarinda Kota", "10:00 - 21:30", -0.50353, 117.15492),
    outlet("tomoro", "gajahmada", "Jl. Gajah Mada", "Samarinda Ulu", "Jl. Gajah Mada No. 45, Samarinda Ulu", "08:00 - 22:00", -0.49500, 117.14800),
    outlet("tomoro", "samarindasquare", "Samarinda Square", "Samarinda Ilir", "Jl. Mulawarman No. 12, Samarinda Ilir", "10:00 - 22:00", -0.46971, 117.14689),
    outlet("tomoro", "pahlawan", "Jl. Pahlawan", "Samarinda Seberang", "Jl. Pahlawan No. 88, Samarinda Seberang", "08:00 - 22:00", -0.48820, 117.14670),

    // ================= FORE =================
    outlet("fore", "bigmall", "Big Mall Samarinda", "Samarinda Ulu", "Jl. Untung Suropati No. 8, Samarinda Ulu", "10:00 - 22:00", -0.52598, 117.11557),
    outlet("fore", "citycentrum", "City Centrum Samarinda", "Samarinda Ulu", "Jl. Gajah Mada No. 1, Samarinda Ulu", "10:00 - 21:30", -0.50329, 117.15201),
    outlet("fore", "basuki", "Jl. Basuki Rahmat", "Samarinda Kota", "Jl. Basuki Rahmat No. 22, Samarinda Kota", "08:00 - 22:00", -0.49100, 117.15200),
    outlet("fore", "scp", "Samarinda Central Plaza", "Samarinda Kota", "Jl. Pelita No. 1, Samarinda Kota", "10:00 - 21:30", -0.50353, 117.15492),
    outlet("fore", "juanda", "Jl. Ir. H. Juanda", "Samarinda Ilir", "Jl. Ir. H. Juanda No. 15, Samarinda Ilir", "08:00 - 22:00", -0.49750, 117.13500),

    // ================= KOPI KENANGAN =================
    outlet("kenangan", "scp", "Samarinda Central Plaza", "Samarinda Kota", "Jl. Pelita No. 1, Samarinda Kota", "10:00 - 21:30", -0.50353, 117.15492),
    outlet("kenangan", "bigmall", "Big Mall Samarinda", "Samarinda Ulu", "Jl. Untung Suropati No. 8, Samarinda Ulu", "10:00 - 22:00", -0.52598, 117.11557),
    outlet("kenangan", "dahlan", "Jl. KH Ahmad Dahlan", "Samarinda Ulu", "Jl. KH Ahmad Dahlan No. 27, Samarinda Ulu", "08:00 - 22:00", -0.48050, 117.14300),
    outlet("kenangan", "lembuswana", "Lembuswana Cafe & Resto", "Samarinda Ulu", "Jl. S. Parman No. 21, Samarinda Ulu", "09:00 - 22:00", -0.47515, 117.14719),
    outlet("kenangan", "alimuddin", "Jl. Sultan Alimuddin", "Samarinda Seberang", "Jl. Sultan Alimuddin No. 10, Samarinda Seberang", "08:00 - 21:30", -0.48200, 117.15600),

    // ================= JANJI JIWA =================
    outlet("janji-jiwa", "gajahmada", "Jl. Gajah Mada", "Samarinda Ulu", "Jl. Gajah Mada No. 56, Samarinda Ulu", "08:00 - 22:00", -0.49500, 117.14800),
    outlet("janji-jiwa", "samarindasquare", "Samarinda Square", "Samarinda Ilir", "Jl. Mulawarman No. 12, Samarinda Ilir", "10:00 - 22:00", -0.46971, 117.14689),
    outlet("janji-jiwa", "hidayatullah", "Jl. P. Hidayatullah", "Samarinda Ulu", "Jl. P. Hidayatullah No. 33, Samarinda Ulu", "08:00 - 22:00", -0.49350, 117.15050),
    outlet("janji-jiwa", "bigmall", "Big Mall Samarinda", "Samarinda Ulu", "Jl. Untung Suropati No. 8, Samarinda Ulu", "10:00 - 22:00", -0.52598, 117.11557),
    outlet("janji-jiwa", "yamin", "Jl. M. Yamin", "Samarinda Seberang", "Jl. M. Yamin No. 18, Samarinda Seberang", "08:00 - 21:30", -0.51500, 117.14100)
  ];
})();
