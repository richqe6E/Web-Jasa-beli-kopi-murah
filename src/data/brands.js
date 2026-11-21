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

  const tempGroup = () => ({
    id: "temp", label: "Suhu Penyajian", helper: "Pilih 1", type: "single", required: true,
    defaultOptionId: "iced",
    options: [opt("iced", "Iced (Dingin)", 0, "Segar dengan es"), opt("hot", "Hot (Panas)", 0, "Disajikan hangat")]
  });

  const sizeGroup = (largePrice) => ({
    id: "size", label: "Ukuran Cup", helper: "Pilih 1", type: "single", required: true,
    defaultOptionId: "regular",
    options: [
      opt("regular", "Regular", 0, "16 oz"),
      opt("large", "Large", largePrice || 3500, "22 oz")
    ]
  });

  const sugarGroup = () => ({
    id: "sugar", label: "Takaran Gula", helper: "Pilih 1", type: "single", required: true,
    defaultOptionId: "normal",
    options: [
      opt("normal", "Normal Sugar (100%)", 0, "Manis pas"),
      opt("less", "Less Sugar (70%)", 0, "Lebih ringan"),
      opt("half", "Half Sugar (50%)", 0, "Setengah takaran"),
      opt("none", "No Sugar (0%)", 0, "Tanpa gula")
    ]
  });

  const iceGroup = () => ({
    id: "ice", label: "Takaran Es", helper: "Pilih 1", type: "single", required: true,
    defaultOptionId: "normal",
    dependsOn: { groupId: "temp", optionId: "iced" },
    options: [
      opt("normal", "Normal Ice", 0, "Es standar"),
      opt("less", "Less Ice", 0, "Sedikit es"),
      opt("none", "No Ice", 0, "Tanpa es")
    ]
  });

  const milkGroup = () => ({
    id: "milk", label: "Pilihan Susu", helper: "Pilih 1", type: "single", required: true,
    defaultOptionId: "fresh",
    options: [
      opt("fresh", "Fresh Milk", 0, "Susu segar standar"),
      opt("oat", "Oat Milk (Oatside)", 6000, "Plant-based creamy")
    ]
  });

  const drinkToppings = () => ({
    id: "toppings", label: "Extra Topping", helper: "Maksimal 3", type: "multiple", required: false,
    max: 3,
    options: [
      opt("extra-shot", "Extra Espresso Shot", 5000, "Lebih bold"),
      opt("grass-jelly", "Grass Jelly / Cincau", 4000, "Kenyal segar"),
      opt("boba", "Brown Sugar Boba", 4000, "Manis legit"),
      opt("cheese-foam", "Sea Salt / Cheese Cloud", 6000, "Gurih creamy")
    ]
  });

  const foodAddons = () => ({
    id: "addons", label: "Tambahan Makanan", helper: "Opsional", type: "multiple", required: false,
    max: 3,
    options: [
      opt("warm-up", "Panaskan / Panggang Hangat", 0, "Siap santap"),
      opt("extra-sauce", "Extra Saus / Cheese / Butter", 4000, "Lebih nikmat")
    ]
  });

  function hydrateItem(item) {
    const lowName = String(item.name || "").toLowerCase();
    const lowCat = String(item.category || "").toLowerCase();
    const is1L = lowName.includes("1l") || lowCat.includes("1 liter") || lowName.includes("seliter");
    const isMerch = lowCat.includes("merchandise") || lowName.includes("mineral") || lowName.includes("pristine");

    let optionGroups = [];
    if (item.type === "drink" && !is1L && !isMerch) {
      const isIceOnly = lowCat.includes("frappe") || lowCat.includes("blended") || lowCat.includes("breeze") || lowCat.includes("refresher");
      if (!isIceOnly) optionGroups.push(tempGroup());
      optionGroups.push(sizeGroup(3500));
      optionGroups.push(sugarGroup());
      if (!isIceOnly) optionGroups.push(iceGroup());
      if (lowName.includes("latte") || lowName.includes("milk") || lowName.includes("kopi susu") || lowName.includes("mantan") || lowName.includes("matcha") || lowName.includes("choco")) {
        optionGroups.push(milkGroup());
      }
      optionGroups.push(drinkToppings());
    } else if (item.type === "food" && !isMerch) {
      optionGroups.push(foodAddons());
    }

    const rawSold = String(item.sold || "1k+").toLowerCase();
    const soldNum = parseFloat(rawSold.replace(/[^\d.]/g, "")) || 1;
    const soldCount = Math.round(rawSold.includes("k") ? soldNum * 1000 : soldNum);

    return Object.assign({}, item, {
      isAvailable: item.isAvailable !== false,
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
