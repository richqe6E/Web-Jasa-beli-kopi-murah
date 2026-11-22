/* ============================================================
   DATA OUTLET KALTIM (SAMARINDA • BALIKPAPAN • TENGGARONG)
   51 Outlet Resmi Terverifikasi + Koordinat GPS & Jam Operasional
   Tomoro Coffee: Coming Soon (belum ada outlet aktif)
   ============================================================ */
(function () {
  "use strict";

  const outlet = (id, brandId, name, area, address, hours, lat, lng) => ({
    id,
    brandId,
    name,
    area,
    address,
    hours: hours || "08:00 - 22:00",
    lat: typeof lat === "number" ? lat : null,
    lng: typeof lng === "number" ? lng : null,
    distance: null,
    isOpen: true,
    mapsQuery: `${name}, ${address}`
  });

  window.DLM_OUTLETS = [
    outlet("fore-bung-tomo-samarinda", "fore", "Bung Tomo Samarinda", "Samarinda", "Jl. Bung Tomo No.123, Rapak Dalam, Kec. Loa Janan Ilir, Kota Samarinda, Kalimantan Timur", "10:00 - 22:00", -0.511154, 117.147527),
    outlet("fore-bhayangkara-samarinda", "fore", "Bhayangkara Samarinda", "Samarinda", "Jl. Bhayangkara No.33, Bugis, Kec. Samarinda Kota, Kota Samarinda, Kalimantan Timur", "07:00 - 22:00", -0.492585, 117.144771),
    outlet("fore-samarinda-city-centrum", "fore", "Samarinda City Centrum", "Samarinda", "Jl. Mulawarman No.171, Karang Mumus, Kec. Samarinda Kota, Kota Samarinda, Kalimantan Timur 75242", "08:00 - 22:00", -0.50311, 117.15204),
    outlet("fore-ahmad-yani-samarinda", "fore", "Ahmad Yani Samarinda", "Samarinda", "Jl. Ahmad Yani No. 9, Sungai Pinang Dalam, Kec. Sungai Pinang, Kota Samarinda, Kalimantan Timur", "07:00 - 23:00", -0.477072, 117.156181),
    outlet("fore-mall-balikpapan-baru", "fore", "Mall Balikpapan Baru", "Balikpapan", "Jl. Belakang Mall BB, Damai, Kec. Balikpapan Selatan, Kota Balikpapan, Kalimantan Timur 76114 (Lantai GF)", "08:00 - 22:00", -1.272638, 116.851456),
    outlet("fore-e-walk-balikpapan-superblock", "fore", "E-Walk Balikpapan Superblock", "Balikpapan", "Superblock E. Walk Mall, Jl. Jenderal Sudirman Lantai GF Unit 12, Gunung Bahagia, Kota Balikpapan", "08:00 - 22:00", -1.273539, 116.859171),
    outlet("fore-mt-haryono-balikpapan", "fore", "MT. Haryono Balikpapan", "Balikpapan", "Jl. MT Haryono No.95 - 96, Damai, Kec. Balikpapan Kota, Kota Balikpapan, Kalimantan Timur", "07:00 - 23:00", -1.260694, 116.86276),
    outlet("janji-jiwa-mulawarman", "janji-jiwa", "Janji Jiwa - Mulawarman", "Samarinda", "Jl. Mulawarman No.12, Karang Mumus, Kec. Samarinda Kota, Kota Samarinda, Kalimantan Timur 75113", "24 Jam", -0.50522, 117.156209),
    outlet("janji-jiwa-ruko-merak-samarinda", "janji-jiwa", "Janji Jiwa - Ruko Merak Samarinda", "Samarinda", "Ruko Merak B/14, Jl. Hasan Basri, Kelurahan Bandara, Kecamatan Sungai Pinang, Kota Samarinda, Kalimantan Timur 75242", "08:00 - 22:00", -0.48077, 117.152191),
    outlet("janji-jiwa-ruko-wahid-hasyim-samarinda", "janji-jiwa", "Janji Jiwa - Ruko Wahid Hasyim Samarinda", "Samarinda", "Jl. Wahid Hasyim 1 RT.13 RW.00, Kelurahan Sempaja Selatan, Kecamatan Samarinda Utara, Kota Samarinda, Kalimantan Timur", "08:00 - 23:00", -0.45118, 117.153038),
    outlet("janji-jiwa-indrakila", "janji-jiwa", "Janji Jiwa - Indrakila", "Balikpapan", "Jl. Indrakila 17B, Kel. Gunung Samarinda Baru, Kec. Balikpapan Utara, Balikpapan, Kalimantan Timur 76125", "08:30 - 22:00", -1.233974, 116.844429),
    outlet("janji-jiwa-jendral-sudirman-balikpapan", "janji-jiwa", "Janji Jiwa - Jendral Sudirman Balikpapan", "Balikpapan", "Jl. Jend. Sudirman No. 32, RT. 004, Kel. Damai, Kec. Balikpapan Kota, Balikpapan, Kalimantan Timur 76114", "08:00 - 22:00", -1.272026, 116.852499),
    outlet("janji-jiwa-grand-city-palladium", "janji-jiwa", "Janji Jiwa - Grand City Palladium", "Balikpapan", "Grand City Ruko Palladium Blok I-2, Jalan Grand City, Batu Ampar, Kec. Balikpapan Utara, Kota Balikpapan, Kalimantan Timur", "10:00 - 22:00", -1.2243, 116.8765),
    outlet("janji-jiwa-tenggarong", "janji-jiwa", "Janji Jiwa - Tenggarong", "Tenggarong", "Kawasan Pertokoan YPPKP Ribathul Khail, Jl. KH Ahmad Muksin No. 70, RT. 027, Timbau, Tenggarong, Kutai Kartanegara", "08:00 - 23:00", -0.430443, 116.995042),
    outlet("kenangan-ruko-ir-h-juanda-samarinda", "kenangan", "Ruko Ir H Juanda Samarinda", "Samarinda", "Jl. Ir. H. Juanda, Air Hitam, Kec. Samarinda Ulu, Kota Samarinda, Kalimantan Timur 75243", "08:00 - 23:30", -0.483, 117.1301),
    outlet("kenangan-ruko-alaya-samarinda", "kenangan", "Ruko Alaya Samarinda", "Samarinda", "Jl. Ruko Alaya Junction, Sungai Pinang Dalam, Kec. Sungai Pinang, Kota Samarinda, Kalimantan Timur 75243", "08:00 - 22:00", -0.4673, 117.1749),
    outlet("kenangan-ruko-bung-tomo-samarinda", "kenangan", "Ruko Bung Tomo Samarinda", "Samarinda", "Jl. Bung Tomo No. 68 e, Sungai Keledang, Kec. Samarinda Seberang, Kota Samarinda, Kalimantan Timur", "08:00 - 22:00", -0.515255, 117.127829),
    outlet("kenangan-samarinda-central-plaza", "kenangan", "Samarinda Central Plaza", "Samarinda", "Samarinda Central Plaza, Jl. Pulau Irian No.1, Karang Mumus, Kec. Samarinda Kota, Kota Samarinda, Kalimantan Timur 75113", "10:00 - 22:00", -0.503624, 117.155121),
    outlet("kenangan-ruko-jl-jakarta-samarinda", "kenangan", "Ruko Jl Jakarta Samarinda", "Samarinda", "Jl. Jakarta RT 81, Kel. Loa Bakung, Kec. Sungai Kunjang, Kota Samarinda, Kalimantan Timur 75243", "08:00 - 22:00", -0.52447, 117.092035),
    outlet("kenangan-ruko-pm-noor-samarinda", "kenangan", "Ruko PM Noor Samarinda", "Samarinda", "Ruko PM Noor Unit No.2, Jl. PM. Noor, Sempaja Selatan, Kec. Samarinda Utara, Kota Samarinda", "08:00 - 22:00", -0.452096, 117.157114),
    outlet("kenangan-danau-toba-samarinda", "kenangan", "Danau Toba Samarinda", "Samarinda", "Jl. Danau Toba, Sungai Pinang Luar, Kec. Samarinda Kota, Kota Samarinda, Kalimantan Timur 75117", "08:00 - 22:00", -0.495259, 117.152395),
    outlet("kenangan-big-mall-samarinda", "kenangan", "Big Mall Samarinda", "Samarinda", "Big Mall Samarinda, Lantai GF, Jl. Untung Suropati No.08, Karang Asam Ulu, Kec. Sungai Kunjang, Kota Samarinda, Kalimantan Timur", "10:00 - 22:00", -0.526162, 117.115922),
    outlet("kenangan-sutoyo-samarinda", "kenangan", "Sutoyo Samarinda", "Samarinda", "Jl. Mayjen Sutoyo No.1A, Sungai Pinang Dalam, Kec. Sungai Pinang, Kota Samarinda, Kalimantan Timur", "08:00 - 22:00", -0.476014, 117.168729),
    outlet("kenangan-ruko-cipto-mangunkusumo-samarinda", "kenangan", "Ruko Cipto Mangunkusumo Samarinda", "Samarinda", "Jl. Cipto Mangunkusumo No. 7, RT 19, Kel. Simpang Tiga, Kec. Loa Janan Ilir, Kota Samarinda", "08:00 - 22:00", -0.571513, 117.086977),
    outlet("kenangan-pertamina-coco-61-751-01-kesuma-bangsa-s", "kenangan", "Pertamina COCO 61.751.01 Kesuma Bangsa Samarinda", "Samarinda", "SPBU Pertamina COCO 61.751.01 Kesuma Bangsa Samarinda (Container), Jalan Kesuma Bangsa, Bugis, Kec. Samarinda Ulu", "07:00 - 22:00", -0.489918, 117.146302),
    outlet("kenangan-pertamina-dodo-64-751-14-jl-urip-sumohar", "kenangan", "Pertamina DODO 64.751.14 Jl.Urip Sumoharjo", "Samarinda", "SPBU Pertamina DODO 64.751.14 Jl. Urip Sumoharjo, Jl. Urip Sumoharjo No.111, Sidomulyo, Kec. Samarinda Ilir, Kota Samarinda", "07:00 - 22:00", -0.491799, 117.162268),
    outlet("kenangan-pertamina-karang-asam", "kenangan", "Pertamina Karang Asam", "Samarinda", "SPBU Pertamina COCO 61.751.02 Slamet Riyadi Samarinda, Jalan Slamet Riyadi, Karang Asam Ulu, Tlk. Lerong Ulu", "07:00 - 22:00", -0.501114, 117.124068),
    outlet("kenangan-rest-area-km-36b-samarinda", "kenangan", "Rest Area KM 36B Samarinda", "Samboja", "Tol Samarinda–Balikpapan Km 36, Bukit Merdeka, Samboja, Kab. Kutai Kartanegara, Kalimantan Timur", "07:00 - 22:00", -0.967597, 117.002952),
    outlet("kenangan-rs-abdul-wahab-sjahranie-samarinda", "kenangan", "RS Abdul Wahab Sjahranie Samarinda", "Samarinda", "RS Abdul Wahab Sjahranie Samarinda, Jl. Palang Merah No.1, Sidodadi, Kec. Samarinda Ulu, Kota Samarinda, Kalimantan Timur", "08:00 - 23:00", -0.480086, 117.145379),
    outlet("kenangan-rs-samarinda-medika-citra", "kenangan", "RS Samarinda Medika Citra", "Samarinda", "RS Samarinda Medika Citra (DOCO), Jl. Kadrie Oening No.85, RT.35, Air Putih, Kec. Samarinda Ulu, Kota Samarinda, Kalimantan Timur", "07:00 - 22:00", -0.472829, 117.124687),
    outlet("kenangan-ruko-m-yamin-samarinda", "kenangan", "Ruko M Yamin Samarinda", "Samarinda", "Jl. M. Yamin Square Blok A No 6, Gn. Kelua, Kec. Samarinda Ulu, Kota Samarinda, Kalimantan Timur", "08:00 - 22:00", -0.475479, 117.146302),
    outlet("kenangan-ruko-merak-samarinda", "kenangan", "Ruko Merak Samarinda", "Samarinda", "Jl. Hasan Basri, Komp. Ruko Merak Blok B No. 11, Samarinda", "08:00 - 22:00", -0.48077, 117.152191),
    outlet("kenangan-slamet-riyadi-samarinda", "kenangan", "Slamet Riyadi Samarinda", "Samarinda", "Jl. Slamet Riyadi No.4, Karang Asam Ilir, Kec. Sungai Kunjang, Kota Samarinda, Kalimantan Timur 75126", "08:00 - 23:30", -0.510736, 117.11757),
    outlet("kenangan-ruko-mekarsari-balikpapan", "kenangan", "Ruko Mekarsari Balikpapan", "Balikpapan", "Jl. Ahmad Yani, Mekarsari, Kec. Balikpapan Tengah, Kota Balikpapan, Kalimantan Timur 76113", "08:00 - 22:00", -1.256395, 116.838756),
    outlet("kenangan-ruko-ruhui-rahayu-balikpapan", "kenangan", "Ruko Ruhui Rahayu Balikpapan", "Balikpapan", "Jl. Ruhui Rahayu 1, Gn. Bahagia, Kec. Balikpapan Selatan, Kota Balikpapan, Kalimantan Timur", "08:00 - 23:00", -1.239893, 116.873676),
    outlet("kenangan-ruko-muara-rapak-balikpapan", "kenangan", "Ruko Muara Rapak Balikpapan", "Balikpapan", "Jl. Soekarno Hatta No. 16 RT 4 RW 0, Kel. Muara Rapak, Kec. Balikpapan Utara, Kota Balikpapan", "08:00 - 22:00", -1.229108, 116.839771),
    outlet("kenangan-ruko-jl-mt-haryono-balikpapan", "kenangan", "Ruko Jl. MT Haryono Balikpapan", "Balikpapan", "Jl. MT Haryono, Damai, Kec. Balikpapan Kota, Kota Balikpapan, Kalimantan Timur 76114", "08:00 - 23:30", -1.264791, 116.859153),
    outlet("kenangan-ruko-jenderal-sudirman-balikpapan", "kenangan", "Ruko Jenderal Sudirman Balikpapan", "Balikpapan", "Jl. Jenderal Sudirman No. 17-18, Klandasan Ilir, Kec. Balikpapan Kota, Kota Balikpapan", "08:00 - 23:00", -1.277132, 116.839655),
    outlet("kenangan-spbu-sepinggan-balikpapan", "kenangan", "SPBU Sepinggan Balikpapan", "Balikpapan", "Jl. Marsma R. Iswahyudi No. 65, Sepinggan, Kec. Balikpapan Selatan, Kota Balikpapan, Kalimantan Timur", "24 Jam", -1.264947, 116.885577),
    outlet("kenangan-plaza-bunsay-drive-thru", "kenangan", "Plaza Bunsay (Drive Thru)", "Balikpapan", "Plaza Bunsay (Drive Thru), Jl. Letjen Suprapto, Baru Ilir, Kec. Balikpapan Barat, Kota Balikpapan, Kalimantan Timur 76123", "08:00 - 23:00", -1.2343, 116.8241),
    outlet("kenangan-ruko-pasar-segar", "kenangan", "Ruko Pasar Segar", "Balikpapan", "Jl. Segar Blok RB - 10 RT 026 RW 00, Gn. Samarinda Baru, Kec. Balikpapan Utara, Kota Balikpapan", "08:00 - 22:00", -1.2441, 116.8575),
    outlet("kenangan-e-walk-balikpapan", "kenangan", "E WALK BALIKPAPAN", "Balikpapan", "E Walk Balikpapan, Lantai GF Island B2, Gn. Bahagia, Kec. Balikpapan Selatan, Kota Balikpapan", "10:00 - 22:00", -1.273539, 116.859171),
    outlet("kenangan-ruko-ahmad-yani-balikpapan", "kenangan", "Ruko Ahmad Yani Balikpapan", "Balikpapan", "Jl. Jend. A. Yani No. 33, RT 039, Kel. Klandasan Ilir, Kec. Balikpapan Kota, Kota Balikpapan, Kalimantan Timur", "08:00 - 22:00", -1.271181, 116.83831),
    outlet("kenangan-ruko-balikpapan-superblock", "kenangan", "Ruko Balikpapan Superblock", "Balikpapan", "Ruko Balikpapan Superblock, Unit A19, Jl. Jenderal Sudirman, Gunung Bahagia, Kec. Balikpapan Selatan, Kota Balikpapan", "08:00 - 23:00", -1.2732, 116.8593),
    outlet("kenangan-ruko-batu-ampar-balikpapan", "kenangan", "Ruko Batu Ampar Balikpapan", "Balikpapan", "Jl. Soekarno Hatta KM 6, Batu Ampar, Kec. Balikpapan Utara, Kota Balikpapan", "08:00 - 23:00", -1.213555, 116.85803),
    outlet("kenangan-ruko-manggar-balikpapan", "kenangan", "Ruko Manggar Balikpapan", "Balikpapan", "Jl. Mulawarman No. 6E RT.54, Kel. Manggar, Kec. Balikpapan Timur, Kota Balikpapan, Kalimantan Timur", "08:00 - 22:30", -1.227359, 116.94645),
    outlet("kenangan-ruko-mt-haryono-balikpapan-2", "kenangan", "Ruko MT Haryono Balikpapan 2", "Balikpapan", "Jl. MT Haryono, Batu Ampar, Kec. Balikpapan Utara, Kota Balikpapan, Kalimantan Timur 76114", "08:00 - 23:30", -1.219821, 116.861306),
    outlet("kenangan-ruko-mulawarman-balikpapan", "kenangan", "Ruko Mulawarman Balikpapan", "Balikpapan", "Jl. Mulawarman No. 94, Sepinggan, Kec. Balikpapan Selatan, Kota Balikpapan, Kalimantan Timur", "08:00 - 22:00", -1.258151, 116.907183),
    outlet("kenangan-ruko-soekarno-hatta-balikpapan", "kenangan", "Ruko Soekarno Hatta Balikpapan", "Balikpapan", "Jl. Soekarno Hatta KM 3.5, Batu Ampar, Kec. Balikpapan Utara, Kota Balikpapan, Kalimantan Timur", "08:00 - 22:00", -1.2224, 116.8466),
    outlet("kenangan-danau-semayang-tenggarong", "kenangan", "Danau Semayang Tenggarong", "Tenggarong", "Jl. Danau Semayang, Melayu, Kec. Tenggarong, Kabupaten Kutai Kartanegara, Kalimantan Timur", "08:00 - 22:00", -0.418431, 116.987276),
    outlet("kenangan-ruko-ahmad-muksin-tenggarong", "kenangan", "Ruko Ahmad Muksin Tenggarong", "Tenggarong", "Jl. KH. Ahmad Muksin, Timbau, Kec. Tenggarong, Kab. Kutai Kartanegara, Kalimantan Timur", "08:00 - 23:25", -0.430443, 116.995042)
  ];
})();
