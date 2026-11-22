/* ============================================================
   KATALOG RESMI 4 BRAND KOPI & MAKANAN (AGGREGATOR & HYDRATOR)
   Data masing-masing brand dipisah rapi di folder src/data/brands/:
   - src/data/brands/tomoro.js     (63 Menu, 10 Kartu Iklan)
   - src/data/brands/fore.js       (80 Menu, 5 Kartu Iklan)
   - src/data/brands/kenangan.js   (80 Menu, 6 Kartu Iklan)
   - src/data/brands/janji-jiwa.js (104 Menu, 8 Kartu Iklan)
   ============================================================ */
(function () {
  "use strict";

  const opt = (id, label, price, note) => ({ id, label, price: price || 0, note: note || "" });

  /* ============================================================
     KOPI KENANGAN OPTION BUILDERS (Sesuai Reseller Partner)
     ============================================================ */
  const kenanganTempGroup = (hasHot) => ({
    id: "temp", label: "Temperature", helper: "Wajib • Pilih 1", type: "single", required: true,
    defaultOptionId: "ice",
    options: hasHot
      ? [opt("ice", "Ice", 0, "Dingin segar"), opt("hot", "Hot", 0, "Disajikan hangat")]
      : [opt("ice", "Ice", 0, "Hanya tersedia dingin")]
  });

  const kenanganSizeGroup = (allowLarge) => ({
    id: "size", label: "Size / Ukuran", helper: allowLarge ? "Wajib • Jumbo nonaktif" : "Wajib • Pilih 1", type: "single", required: true,
    defaultOptionId: "regular",
    options: allowLarge
      ? [
          opt("regular", "Regular", 0, "Ukuran standar"),
          opt("large", "Large", 5000, "Porsi lebih besar")
        ]
      : [opt("regular", "Regular", 0, "Ukuran standar")]
  });

  const kenanganBeansGroup = (variant) => {
    if (variant === "drip-brew") {
      return {
        id: "beans", label: "Beans", helper: "Wajib • Pilih 1", type: "single", required: true,
        defaultOptionId: "bhadrika",
        options: [opt("bhadrika", "Bhadrika Pollung", 0, "Single origin"), opt("bajawa", "Flores Bajawa", 0, "Single origin")]
      };
    }
    if (variant === "steep-box") {
      return {
        id: "beans", label: "Beans", helper: "Wajib • Pilih 1", type: "single", required: true,
        defaultOptionId: "peach",
        options: [opt("peach", "Peach Terrain", 0, "Isi 5 sachet"), opt("floral", "Floral Highland", 0, "Isi 5 sachet")]
      };
    }
    return {
      id: "beans", label: "Beans", helper: "Wajib • Pilih 1", type: "single", required: true,
      defaultOptionId: "kenangan-blend",
      options: [
        opt("kenangan-blend", "Kenangan Blend", 0, "House blend resmi"),
        opt("juwara-beans", "Juwara Beans", 3000, "100% Arabika pilihan")
      ]
    };
  };

  const kenanganMilkGroup = () => ({
    id: "milk", label: "Milk Option", helper: "Wajib • Pilih 1", type: "single", required: true,
    defaultOptionId: "milk",
    options: [
      opt("milk", "Milk", 0, "Susu segar standar"),
      opt("oatside", "Oatside", 3000, "Susu oat creamy")
    ]
  });

  const kenanganSugarGroup = (defaultId) => ({
    id: "sugar", label: "Sugar Level", helper: "Wajib • Pilih 1", type: "single", required: true,
    defaultOptionId: defaultId || "normal",
    options: [
      opt("normal", "Normal Sugar", 0, "Takaran standar"),
      opt("less", "Less Sugar", 0, "Manis lebih ringan"),
      opt("no", "No Sugar", 0, "Tanpa gula tambahan")
    ]
  });

  const kenanganIceGroup = (isFrappe, hasHot) => {
    const group = {
      id: "ice", label: "Ice Level", helper: "Wajib • Pilih 1", type: "single", required: true,
      defaultOptionId: "normal",
      options: isFrappe
        ? [opt("normal", "Normal Ice", 0, "Es standar"), opt("less", "Less Ice", 0, "Sedikit es")]
        : [opt("normal", "Normal Ice", 0, "Es standar"), opt("less", "Less Ice", 0, "Sedikit es"), opt("no", "No Ice", 0, "Tanpa es")]
    };
    if (hasHot) group.dependsOn = { groupId: "temp", optionId: "ice" };
    return group;
  };

  const kenanganWhippedGroup = () => ({
    id: "whipped", label: "Whipped Cream", helper: "Wajib • Pilih 1", type: "single", required: true,
    defaultOptionId: "no-whipped",
    options: [opt("no-whipped", "No Whipped Cream", 0, "Gratis • Tanpa whipped cream")]
  });

  const kenanganSyrupGroup = () => ({
    id: "syrup", label: "Syrup", helper: "Opsional • Boleh pilih lebih dari 1", type: "multiple", required: false,
    max: 6,
    options: [
      opt("vanilla-syrup", "Vanilla Syrup", 6000, "Aroma vanilla"),
      opt("hazelnut-syrup", "Hazelnut Syrup", 6000, "Aroma hazelnut"),
      opt("caramel-syrup", "Caramel Syrup", 6000, "Manis karamel"),
      opt("salted-caramel", "Salted Caramel Sauce", 6000, "Gurih manis"),
      opt("choco-sauce", "Choco Sauce", 6000, "Saus cokelat"),
      opt("butterscotch-sauce", "Butterscotch Sauce", 6000, "Saus butterscotch")
    ]
  });

  const kenanganToppingGroup = (omitAren) => {
    const opts = [
      opt("shot-kenangan", "Espresso Shot Kenangan Blend", 6000, "Ekstra shot kopi"),
      opt("shot-juwara", "Espresso Shot Juwara Beans", 6000, "Ekstra shot Arabika"),
      opt("grass-jelly", "Grass Jelly", 6000, "Cincau segar"),
      opt("oreo", "Oreo", 6000, "Remah Oreo"),
      opt("caramel-crumble", "Caramel Crumble", 6000, "Taburan renyah")
    ];
    if (!omitAren) opts.push(opt("gula-aren", "Gula Aren", 6000, "Ekstra gula aren"));
    return {
      id: "toppings", label: "Topping", helper: "Opsional • Boleh pilih lebih dari 1", type: "multiple", required: false,
      max: 6,
      options: opts
    };
  };

  /* ============================================================
     FORE COFFEE OPTION BUILDERS (Sesuai Reseller Partner)
     ============================================================ */
  const foreSizeGroup = () => ({
    id: "size", label: "Size", helper: "Wajib • Pilih 1", type: "single", required: true,
    defaultOptionId: "regular",
    options: [
      opt("regular", "Reguler", 0, "Ukuran reguler"),
      opt("large", "Large", 7000, "Porsi puas")
    ]
  });

  const foreSweetnessGroup = () => ({
    id: "sweetness", label: "Sweetness", helper: "Wajib • Pilih 1", type: "single", required: true,
    defaultOptionId: "normal",
    options: [
      opt("normal", "Normal Sweet", 0, "Manis standar"),
      opt("less", "Less Sweet", 0, "Kurangi manis")
    ]
  });

  const foreIceGroup = () => ({
    id: "ice", label: "Ice Cube", helper: "Wajib • Pilih 1", type: "single", required: true,
    defaultOptionId: "normal",
    options: [
      opt("normal", "Normal Ice", 0, "Es standar"),
      opt("less", "Less Ice", 0, "Sedikit es"),
      opt("more", "More Ice", 0, "Ekstra es"),
      opt("no", "No Ice", 0, "Tanpa es"),
      opt("separate", "Ice Separately / Dipisah", 0, "Es dipisah")
    ]
  });

  /* ============================================================
     JANJI JIWA OPTION BUILDERS (Sesuai Reseller Partner)
     ============================================================ */
  const janjiSizeGroup = () => ({
    id: "size", label: "Size", helper: "Wajib • Pilih 1", type: "single", required: true,
    defaultOptionId: "regular",
    options: [
      opt("regular", "Reguler", 0, "Ukuran reguler"),
      opt("large", "Large", 6000, "Porsi puas")
    ]
  });

  const janjiSugarGroup = () => ({
    id: "sugar", label: "Sugar", helper: "Wajib • Pilih 1", type: "single", required: true,
    defaultOptionId: "with-sugar",
    options: [
      opt("with-sugar", "With Sugar", 0, "Gula standar"),
      opt("no-sugar", "No Sugar", 0, "Tanpa gula")
    ]
  });

  const janjiIceGroup = () => ({
    id: "ice", label: "Ice", helper: "Wajib • Pilih 1", type: "single", required: true,
    defaultOptionId: "normal",
    options: [
      opt("normal", "Normal Ice", 0, "Es standar"),
      opt("less", "Less Ice", 0, "Sedikit es"),
      opt("no", "No Ice", 0, "Tanpa es")
    ]
  });

  function hydrateItem(item) {
    const brandId = String(item.brandId || "");
    const lowName = String(item.name || "").toLowerCase();
    const lowCat = String(item.category || "").toLowerCase();
    const is1L = lowName.includes("1l") || lowCat.includes("1l") || lowCat.includes("1 liter") || lowCat.includes("bottled") || lowCat.includes("menu favorit");

    let optionGroups = [];
    let showNotes = true;

    if (brandId === "kenangan") {
      showNotes = true;
      if (lowName.includes("steep coffee bag")) {
        optionGroups = [kenanganBeansGroup("steep-box")];
        showNotes = false;
      } else if (lowName.includes("drip bag coffee (sachet)")) {
        optionGroups = [];
      } else if (lowCat.includes("manual brew") || lowName.includes("drip bag coffee (brewed)")) {
        optionGroups = [
          kenanganTempGroup(true),
          kenanganSizeGroup(false),
          kenanganBeansGroup("drip-brew"),
          kenanganSugarGroup("no"),
          kenanganIceGroup(false, true)
        ];
      } else if (item.type === "food") {
        optionGroups = [];
      } else {
        const isFrappe = lowCat.includes("frappe");
        const isIceOnly = isFrappe || lowName.includes("avocado") || lowName.includes("dua shot iced shaken") || lowName.includes("lemonade") || lowName.includes("oreo") || lowName.includes("crumble") || lowName.includes("oatside") || lowName.includes("loaded") || lowName.includes("grass jelly");
        const hasHot = !isIceOnly;
        const isCoffee = lowCat.includes("coffee") || lowName.includes("latte") || lowName.includes("espresso") || lowName.includes("americano") || lowName.includes("cappuccino") || lowName.includes("macchiato") || lowName.includes("shaken") || lowName.includes("mantan") || lowName.includes("aren");
        const hasMilk = !lowName.includes("americano") && !lowName.includes("lemonade") && !lowName.includes("lemon black tea") && !lowName.includes("earl grey tea") && !lowName.includes("raspberry hibiscus");
        const sugarDef = lowName.includes("americano") ? "no" : "normal";

        optionGroups.push(kenanganTempGroup(hasHot));
        optionGroups.push(kenanganSizeGroup(true));
        if (isCoffee) optionGroups.push(kenanganBeansGroup("espresso"));
        if (hasMilk) optionGroups.push(kenanganMilkGroup());
        optionGroups.push(kenanganSugarGroup(sugarDef));
        optionGroups.push(kenanganIceGroup(isFrappe, hasHot));
        if (isFrappe) optionGroups.push(kenanganWhippedGroup());
        optionGroups.push(kenanganSyrupGroup());
        optionGroups.push(kenanganToppingGroup(lowName.includes("butterscotch")));
      }
    } else if (brandId === "fore") {
      if (item.type === "food" || lowCat.includes("fore deli")) {
        optionGroups = [];
        showNotes = false;
      } else if (is1L) {
        optionGroups = [foreSweetnessGroup()];
        showNotes = true;
      } else {
        optionGroups = [foreSizeGroup(), foreSweetnessGroup(), foreIceGroup()];
        showNotes = false;
      }
    } else if (brandId === "janji-jiwa") {
      showNotes = true;
      if (item.type === "food" || is1L) {
        optionGroups = [];
      } else {
        optionGroups = [janjiSizeGroup(), janjiSugarGroup(), janjiIceGroup()];
      }
    } else {
      // Tomoro / generic fallback
      showNotes = true;
      if (item.type === "drink" && !is1L) {
        optionGroups = [janjiSizeGroup(), janjiSugarGroup(), janjiIceGroup()];
      }
    }

    const rawSold = String(item.sold || "1k+").toLowerCase();
    const soldNum = parseFloat(rawSold.replace(/[^\d.]/g, "")) || 1;
    const soldCount = Math.round(rawSold.includes("k") ? soldNum * 1000 : soldNum);

    return Object.assign({}, item, {
      isAvailable: item.isAvailable !== false,
      showNotes,
      soldCount,
      optionGroups: Array.isArray(item.optionGroups) && item.optionGroups.length ? item.optionGroups : optionGroups
    });
  }

  const ORDER = ["tomoro", "fore", "kenangan", "janji-jiwa"];
  const modules = window.DLM_BRAND_MODULES || {};
  const RAW_BRANDS = ORDER.map(id => modules[id]).filter(Boolean);

  window.DLM_HYDRATE_ITEM = hydrateItem;
  window.DLM_BRANDS = RAW_BRANDS.map(brand => Object.assign({}, brand, {
    items: (brand.items || []).map(hydrateItem)
  }));
})();
