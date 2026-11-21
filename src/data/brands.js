/* ============================================================
   DATA BRAND & MENU (DUMMY)
   Harga masih contoh. Ganti dengan daftar resmi saat sudah siap.
   ============================================================ */
(function () {
  "use strict";

  const opt = (id, label, price, note) => ({ id, label, price: price || 0, note: note || "" });

  const tempGroup = () => ({
    id: "temp", label: "Suhu", helper: "Pilih 1", type: "single", required: true,
    defaultOptionId: "iced",
    options: [opt("iced", "Iced", 0, "Dingin"), opt("hot", "Hot", 0, "Panas")]
  });

  const sizeGroup = (largePrice) => ({
    id: "size", label: "Ukuran", helper: "Pilih 1", type: "single", required: true,
    defaultOptionId: "regular",
    options: [
      opt("regular", "Regular", 0, "16 oz"),
      opt("large", "Large", largePrice || 3000, "22 oz")
    ]
  });

  const sugarGroup = () => ({
    id: "sugar", label: "Tingkat Gula", helper: "Pilih 1", type: "single", required: true,
    defaultOptionId: "normal",
    options: [
      opt("normal", "100%", 0, "Normal"),
      opt("less", "70%", 0, "Less sugar"),
      opt("half", "50%", 0, "Half sugar"),
      opt("none", "0%", 0, "No sugar")
    ]
  });

  const iceGroup = () => ({
    id: "ice", label: "Porsi Es", helper: "Pilih 1", type: "single", required: true,
    defaultOptionId: "normal",
    dependsOn: { groupId: "temp", optionId: "iced" },
    options: [
      opt("normal", "Normal", 0, "Es normal"),
      opt("less", "Less", 0, "Sedikit es"),
      opt("none", "No Ice", 0, "Tanpa es")
    ]
  });

  const milkGroup = (options) => ({
    id: "milk", label: "Pilihan Susu", helper: "Pilih 1", type: "single", required: true,
    defaultOptionId: options[0].id,
    options
  });

  const toppingGroup = (options) => ({
    id: "toppings", label: "Topping", helper: "Bisa lebih dari 1", type: "multiple", required: false,
    max: 3,
    options
  });

  const addonGroup = (options) => ({
    id: "addons", label: "Tambahan", helper: "Bisa lebih dari 1", type: "multiple", required: false,
    max: 3,
    options
  });

  function drink(cfg) {
    const groups = [];
    if (cfg.allowHot) groups.push(tempGroup());
    if (cfg.allowLarge !== false) groups.push(sizeGroup(cfg.largePrice || 3000));
    groups.push(sugarGroup());
    groups.push(iceGroup());
    if (cfg.milks && cfg.milks.length > 1) groups.push(milkGroup(cfg.milks));
    if (cfg.toppings && cfg.toppings.length) groups.push(toppingGroup(cfg.toppings));

    return {
      id: cfg.id,
      brandId: cfg.brandId,
      name: cfg.name,
      category: cfg.category,
      type: "drink",
      description: cfg.description,
      info: cfg.info || "Disajikan segar • 16 oz",
      image: cfg.image,
      priceOriginal: cfg.priceOriginal,
      priceDiscount: cfg.priceDiscount,
      isBestSeller: !!cfg.isBestSeller,
      rating: cfg.rating || "4.8",
      sold: cfg.sold || "1k+",
      optionGroups: groups
    };
  }

  function food(cfg) {
    return {
      id: cfg.id,
      brandId: cfg.brandId,
      name: cfg.name,
      category: cfg.category,
      type: "food",
      description: cfg.description,
      info: cfg.info || "Disajikan hangat • Porsi 1",
      image: cfg.image,
      priceOriginal: cfg.priceOriginal,
      priceDiscount: cfg.priceDiscount,
      isBestSeller: !!cfg.isBestSeller,
      rating: cfg.rating || "4.7",
      sold: cfg.sold || "500+",
      optionGroups: cfg.addons && cfg.addons.length ? [addonGroup(cfg.addons)] : []
    };
  }

  const milks = {
    freshOat: [opt("fresh", "Fresh Milk", 0, "Susu segar"), opt("oat", "Oat Milk", 6000, "Oatside")],
    freshSoy: [opt("fresh", "Fresh Milk", 0, "Susu segar"), opt("soy", "Soy Milk", 5000, "Susu kedelai")],
    freshOnly: [opt("fresh", "Fresh Milk", 0, "Susu segar")]
  };

  const brands = [
    {
      id: "tomoro",
      name: "Tomoro Coffee",
      shortName: "Tomoro",
      monogram: "T",
      logo: "", // isi path logo resmi nanti, contoh: "src/assets/brands/tomoro.svg"
      tagline: "Master coffee at accessible price",
      description: "Kopi susu favorit dengan racikan espresso dan gula aren pilihan.",
      promoBadge: "Diskon s/d 45%",
      accent: "#EA580C",
      accentSoft: "#FFF1E8",
      accentDeep: "#9A3412",
      rating: "4.9",
      totalSold: "10k+",
      logoIcon: "coffee",
      categories: ["Semua", "Signature", "Oat Series", "Non-Coffee", "Snack"],
      items: [
        drink({
          id: "tm-aren-latte", brandId: "tomoro", name: "Tomoro Aren Latte", category: "Signature",
          description: "Espresso arabica premium berpadu gula aren murni dan susu segar dingin.",
          info: "Espresso • gula aren • susu segar • 16 oz",
          image: "src/assets/products/aren-latte.webp",
          priceOriginal: 22000, priceDiscount: 14500, isBestSeller: true, sold: "5k+",
          allowHot: true, largePrice: 3000, milks: milks.freshOat,
          toppings: [opt("grass-jelly", "Grass Jelly", 4000), opt("extra-shot", "Extra Espresso", 5000), opt("cheese-foam", "Cheese Foam", 6000)]
        }),
        drink({
          id: "tm-oat-latte", brandId: "tomoro", name: "Manuka Oat Latte", category: "Oat Series",
          description: "Manis alami madu manuka dengan susu gandum Oatside dan espresso aromatik.",
          info: "Espresso • manuka honey • oat milk • 16 oz",
          image: "src/assets/products/oat-latte.webp",
          priceOriginal: 28000, priceDiscount: 18000, isBestSeller: true, sold: "3k+",
          allowHot: true, largePrice: 3000,
          milks: [opt("oat", "Oat Milk", 0, "Oatside"), opt("fresh", "Fresh Milk", 0, "Susu segar")],
          toppings: [opt("grass-jelly", "Grass Jelly", 4000), opt("extra-shot", "Extra Espresso", 5000)]
        }),
        drink({
          id: "tm-coconut-latte", brandId: "tomoro", name: "Tomoro Coconut Latte", category: "Signature",
          description: "Segarnya air kelapa alami berpadu lembut dengan racikan espresso khas Tomoro.",
          info: "Espresso • coconut blend • 16 oz • iced",
          image: "src/assets/products/coconut-latte.webp",
          priceOriginal: 25000, priceDiscount: 16500, sold: "2k+",
          allowHot: false, largePrice: 3000, milks: milks.freshOnly,
          toppings: [opt("coconut-jelly", "Coconut Jelly", 4000), opt("extra-shot", "Extra Espresso", 5000)]
        }),
        drink({
          id: "tm-butterscotch", brandId: "tomoro", name: "Butterscotch Sea Salt Latte", category: "Signature",
          description: "Karamel butterscotch legit dengan sea salt cream di atas espresso pilihan.",
          info: "Espresso • butterscotch • sea salt cream • 16 oz",
          image: "src/assets/products/butterscotch.webp",
          priceOriginal: 29000, priceDiscount: 17500, sold: "2k+",
          allowHot: true, largePrice: 3000, milks: milks.freshOat,
          toppings: [opt("caramel", "Caramel Drizzle", 4000), opt("extra-shot", "Extra Espresso", 5000)]
        }),
        drink({
          id: "tm-americano", brandId: "tomoro", name: "Americano", category: "Signature",
          description: "Espresso murni dengan air mineral, ringan dan clean untuk pecinta kopi hitam.",
          info: "Espresso • air mineral • 16 oz",
          image: "src/assets/products/americano.webp",
          priceOriginal: 18000, priceDiscount: 11000, sold: "1k+",
          allowHot: true, largePrice: 3000, milks: [],
          toppings: [opt("extra-shot", "Extra Espresso", 5000)]
        }),
        drink({
          id: "tm-matcha", brandId: "tomoro", name: "Matcha Green Tea Latte", category: "Non-Coffee",
          description: "Matcha Jepang dengan susu lembut, earthy dan tidak terlalu manis.",
          info: "Uji matcha • susu • 16 oz",
          image: "src/assets/products/matcha-latte.webp",
          priceOriginal: 30000, priceDiscount: 18000, sold: "1k+",
          allowHot: true, largePrice: 3000, milks: milks.freshOat,
          toppings: [opt("cheese-foam", "Cheese Foam", 6000)]
        }),
        drink({
          id: "tm-jasmine", brandId: "tomoro", name: "Jasmine Green Tea Cheese", category: "Non-Coffee",
          description: "Teh hijau melati pegunungan dengan lapisan cheese foam gurih manis.",
          info: "Teh melati • cheese foam • 16 oz",
          image: "src/assets/products/jasmine-tea.webp",
          priceOriginal: 20000, priceDiscount: 13000, sold: "900+",
          allowHot: true, largePrice: 3000, milks: [],
          toppings: [opt("grass-jelly", "Grass Jelly", 4000), opt("cheese-foam", "Extra Cheese Foam", 6000)]
        }),
        food({
          id: "tm-croissant", brandId: "tomoro", name: "Choco Butter Croissant", category: "Snack",
          description: "Pastry renyah butter Prancis dengan isian cokelat Belgia yang lumer.",
          info: "Butter croissant • cokelat Belgia • mengandung gluten",
          image: "src/assets/products/croissant.webp",
          priceOriginal: 22000, priceDiscount: 15000, sold: "700+",
          addons: [opt("extra-butter", "Extra Butter", 3000), opt("choco-drizzle", "Chocolate Drizzle", 3000)]
        }),
        food({
          id: "tm-donut", brandId: "tomoro", name: "Sugar Glaze Donut", category: "Snack",
          description: "Donat empuk dengan glaze manis tipis, cocok menemani kopi.",
          info: "Donat • gula glaze • mengandung gluten",
          image: "src/assets/products/donut.webp",
          priceOriginal: 15000, priceDiscount: 10000, sold: "400+",
          addons: [opt("choco-drizzle", "Chocolate Drizzle", 3000)]
        })
      ]
    },
    {
      id: "fore",
      name: "Fore Coffee",
      shortName: "Fore",
      monogram: "F",
      logo: "",
      tagline: "Grind the essentials",
      description: "Kopi artisan dengan karakter kuat dan bahan berkualitas.",
      promoBadge: "Diskon s/d 50%",
      accent: "#059669",
      accentSoft: "#ECFDF5",
      accentDeep: "#065F46",
      rating: "4.9",
      totalSold: "15k+",
      logoIcon: "leaf",
      categories: ["Semua", "Signature", "Artisan Coffee", "Non-Coffee", "Pastry"],
      items: [
        drink({
          id: "fr-butterscotch", brandId: "fore", name: "Butterscotch Sea Salt Latte", category: "Signature",
          description: "Kombinasi butterscotch karamel dan sea salt cream di atas espresso pilihan.",
          info: "Espresso • butterscotch • sea salt cream • 16 oz",
          image: "src/assets/products/butterscotch.webp",
          priceOriginal: 31000, priceDiscount: 17500, isBestSeller: true, sold: "6k+",
          allowHot: true, largePrice: 4000, milks: milks.freshOat,
          toppings: [opt("caramel", "Caramel Drizzle", 4000), opt("extra-shot", "Extra Espresso", 5000)]
        }),
        drink({
          id: "fr-pandan", brandId: "fore", name: "Pandan Latte", category: "Signature",
          description: "Wangi daun pandan alami berpadu harmonis dengan espresso dan susu gurih.",
          info: "Espresso • pandan • susu • 16 oz",
          image: "src/assets/products/pandan-latte.webp",
          priceOriginal: 29000, priceDiscount: 16000, isBestSeller: true, sold: "4k+",
          allowHot: true, largePrice: 4000, milks: milks.freshOat,
          toppings: [opt("grass-jelly", "Grass Jelly", 4000), opt("extra-shot", "Extra Espresso", 5000)]
        }),
        drink({
          id: "fr-aren", brandId: "fore", name: "Fore Aren Latte", category: "Signature",
          description: "Kopi susu gula aren lokal dengan espresso khas Fore yang bold.",
          info: "Espresso • gula aren • susu • 16 oz",
          image: "src/assets/products/fore-aren.webp",
          priceOriginal: 25000, priceDiscount: 14000, sold: "3k+",
          allowHot: true, largePrice: 4000, milks: milks.freshSoy,
          toppings: [opt("boba", "Boba Aren", 4000), opt("extra-shot", "Extra Espresso", 5000)]
        }),
        drink({
          id: "fr-matcha", brandId: "fore", name: "Matcha Green Tea Latte", category: "Non-Coffee",
          description: "Pure Japanese Uji matcha dengan susu murni, earthy dan autentik.",
          info: "Uji matcha • susu • 16 oz",
          image: "src/assets/products/matcha-latte.webp",
          priceOriginal: 33000, priceDiscount: 19500, sold: "2k+",
          allowHot: true, largePrice: 4000, milks: milks.freshOat,
          toppings: [opt("cheese-foam", "Cheese Foam", 6000)]
        }),
        drink({
          id: "fr-americano", brandId: "fore", name: "Americano", category: "Artisan Coffee",
          description: "Espresso artisan dengan air mineral, clean dan menyegarkan.",
          info: "Espresso • air mineral • 16 oz",
          image: "src/assets/products/americano.webp",
          priceOriginal: 20000, priceDiscount: 12000, sold: "1k+",
          allowHot: true, largePrice: 4000, milks: [],
          toppings: [opt("extra-shot", "Extra Espresso", 5000)]
        }),
        drink({
          id: "fr-kopi-susu", brandId: "fore", name: "Kopi Susu Fore", category: "Artisan Coffee",
          description: "Perpaduan espresso dan susu segar dengan manis yang pas.",
          info: "Espresso • susu segar • 16 oz",
          image: "src/assets/products/iced-coffee.webp",
          priceOriginal: 24000, priceDiscount: 14000, sold: "2k+",
          allowHot: true, largePrice: 4000, milks: milks.freshOat,
          toppings: [opt("grass-jelly", "Grass Jelly", 4000)]
        }),
        drink({
          id: "fr-chocolate", brandId: "fore", name: "Signature Chocolate", category: "Non-Coffee",
          description: "Cokelat pekat creamy dengan susu segar, manis dan menenangkan.",
          info: "Cokelat • susu • 16 oz",
          image: "src/assets/products/chocolate.webp",
          priceOriginal: 28000, priceDiscount: 17000, sold: "1k+",
          allowHot: true, largePrice: 4000, milks: milks.freshOat,
          toppings: [opt("choco-chip", "Choco Chip", 3000)]
        }),
        food({
          id: "fr-croissant", brandId: "fore", name: "Butter Croissant", category: "Pastry",
          description: "Croissant butter berlapis, renyah di luar dan lembut di dalam.",
          info: "Butter croissant • mengandung gluten",
          image: "src/assets/products/croissant.webp",
          priceOriginal: 24000, priceDiscount: 16000, sold: "800+",
          addons: [opt("extra-butter", "Extra Butter", 3000), opt("choco-drizzle", "Chocolate Drizzle", 3000)]
        }),
        food({
          id: "fr-bagel", brandId: "fore", name: "Bagel Cream Cheese", category: "Pastry",
          description: "Bagel panggang dengan cream cheese lembut dan gurih.",
          info: "Bagel • cream cheese • mengandung gluten & dairy",
          image: "src/assets/products/bagel.webp",
          priceOriginal: 26000, priceDiscount: 17000, sold: "600+",
          addons: [opt("extra-cream", "Extra Cream Cheese", 4000)]
        })
      ]
    },
    {
      id: "kenangan",
      name: "Kopi Kenangan",
      shortName: "Kenangan",
      monogram: "K",
      logo: "",
      tagline: "Kopi kenangan mantan & kisah manis",
      description: "Kopi susu gula aren legendaris dengan karakter bold dan harum.",
      promoBadge: "Diskon s/d 42%",
      accent: "#B45309",
      accentSoft: "#FFFBEB",
      accentDeep: "#78350F",
      rating: "4.8",
      totalSold: "25k+",
      logoIcon: "coffee",
      categories: ["Semua", "Kenangan Mantan", "Kopi", "Tea & Milk", "Non-Coffee", "Roti"],
      items: [
        drink({
          id: "kn-mantan", brandId: "kenangan", name: "Kopi Kenangan Mantan", category: "Kenangan Mantan",
          description: "Kopi susu gula aren legendaris dengan karakter bold dan harum aren khas.",
          info: "Espresso • gula aren • susu segar • 16 oz",
          image: "src/assets/products/kenangan-mantan.webp",
          priceOriginal: 20000, priceDiscount: 12500, isBestSeller: true, sold: "10k+",
          allowHot: true, largePrice: 3500, milks: milks.freshOat,
          toppings: [opt("boba", "Boba Kenangan", 4000), opt("cincau", "Cincau", 4000), opt("extra-shot", "Extra Espresso", 5000)]
        }),
        drink({
          id: "kn-avocado", brandId: "kenangan", name: "Avocado Coffee", category: "Kenangan Mantan",
          description: "Alpukat segar kental dengan espresso dan es krim vanilla.",
          info: "Alpukat • espresso • es krim vanilla • 16 oz",
          image: "src/assets/products/avocado-coffee.webp",
          priceOriginal: 29000, priceDiscount: 18000, sold: "2k+",
          allowHot: false, largePrice: 3500, milks: milks.freshOnly,
          toppings: [opt("ice-cream", "Es Krim Vanilla", 5000)]
        }),
        drink({
          id: "kn-milk-tea", brandId: "kenangan", name: "Kenangan Milk Tea with Boba", category: "Tea & Milk",
          description: "Teh hitam aromatik dengan susu lembut dan boba kenyal manis.",
          info: "Teh hitam • susu • boba • 16 oz",
          image: "src/assets/products/milk-tea.webp",
          priceOriginal: 24000, priceDiscount: 15000, isBestSeller: true, sold: "3k+",
          allowHot: false, largePrice: 3500, milks: milks.freshOnly,
          toppings: [opt("extra-boba", "Extra Boba", 4000), opt("cincau", "Cincau", 4000)]
        }),
        drink({
          id: "kn-kopi-susu", brandId: "kenangan", name: "Kopi Susu Kenangan", category: "Kopi",
          description: "Kopi susu klasik dengan espresso dan susu segar, manis pas.",
          info: "Espresso • susu segar • 16 oz",
          image: "src/assets/products/iced-coffee.webp",
          priceOriginal: 22000, priceDiscount: 13000, sold: "2k+",
          allowHot: true, largePrice: 3500, milks: milks.freshOat,
          toppings: [opt("boba", "Boba", 4000)]
        }),
        drink({
          id: "kn-americano", brandId: "kenangan", name: "Americano", category: "Kopi",
          description: "Espresso dengan air mineral, ringan untuk menemani aktivitas.",
          info: "Espresso • air mineral • 16 oz",
          image: "src/assets/products/americano.webp",
          priceOriginal: 18000, priceDiscount: 10000, sold: "1k+",
          allowHot: true, largePrice: 3500, milks: [],
          toppings: [opt("extra-shot", "Extra Espresso", 5000)]
        }),
        drink({
          id: "kn-matcha", brandId: "kenangan", name: "Matcha Latte", category: "Non-Coffee",
          description: "Matcha lembut dengan susu segar, cocok untuk pecinta non-kopi.",
          info: "Matcha • susu • 16 oz",
          image: "src/assets/products/matcha-latte.webp",
          priceOriginal: 28000, priceDiscount: 17000, sold: "900+",
          allowHot: true, largePrice: 3500, milks: milks.freshOat,
          toppings: [opt("cheese-foam", "Cheese Foam", 6000)]
        }),
        drink({
          id: "kn-chocolate", brandId: "kenangan", name: "Chocolate Kenangan", category: "Non-Coffee",
          description: "Cokelat creamy dengan susu segar, manis dan comforting.",
          info: "Cokelat • susu • 16 oz",
          image: "src/assets/products/chocolate.webp",
          priceOriginal: 26000, priceDiscount: 16000, sold: "800+",
          allowHot: true, largePrice: 3500, milks: milks.freshOnly,
          toppings: [opt("choco-chip", "Choco Chip", 3000)]
        }),
        food({
          id: "kn-roti-daging", brandId: "kenangan", name: "Roti Daging Asap Keju", category: "Roti",
          description: "Roti lembut isi smoked beef premium dan keju melted yang wangi.",
          info: "Roti • smoked beef • keju • mengandung gluten & dairy",
          image: "src/assets/products/roti-daging.webp",
          priceOriginal: 18000, priceDiscount: 12000, sold: "1k+",
          addons: [opt("extra-cheese", "Extra Keju", 4000), opt("extra-beef", "Extra Smoked Beef", 5000)]
        }),
        food({
          id: "kn-croissant", brandId: "kenangan", name: "Croissant Butter", category: "Roti",
          description: "Croissant butter renyah, pas untuk teman kopi susu.",
          info: "Butter croissant • mengandung gluten",
          image: "src/assets/products/croissant.webp",
          priceOriginal: 20000, priceDiscount: 13000, sold: "500+",
          addons: [opt("extra-butter", "Extra Butter", 3000)]
        })
      ]
    },
    {
      id: "janji-jiwa",
      name: "Janji Jiwa",
      shortName: "Janji Jiwa",
      monogram: "J",
      logo: "",
      tagline: "Kopi dari hati & jiwa toast",
      description: "Kopi dari hati dengan racikan lokal dan camilan toast renyah.",
      promoBadge: "Diskon s/d 40%",
      accent: "#DC2626",
      accentSoft: "#FEF2F2",
      accentDeep: "#991B1B",
      rating: "4.9",
      totalSold: "18k+",
      logoIcon: "heart",
      categories: ["Semua", "Kopi Jiwa", "Tea & Milk", "Non-Coffee", "Toast"],
      items: [
        drink({
          id: "jj-kopi-susu", brandId: "janji-jiwa", name: "Es Kopi Susu Jiwa", category: "Kopi Jiwa",
          description: "Espresso robusta & arabica dengan gula aren dan susu segar murni.",
          info: "Espresso • gula aren • susu segar • 16 oz",
          image: "src/assets/products/iced-coffee.webp",
          priceOriginal: 20000, priceDiscount: 12500, isBestSeller: true, sold: "8k+",
          allowHot: true, largePrice: 3500, milks: milks.freshOat,
          toppings: [opt("coffee-jelly", "Coffee Jelly", 4000), opt("cincau", "Cincau Jiwa", 4000), opt("extra-shot", "Extra Espresso", 5000)]
        }),
        drink({
          id: "jj-kopi-soklat", brandId: "janji-jiwa", name: "Es Kopi Soklat", category: "Kopi Jiwa",
          description: "Espresso mantap dengan cokelat kental signature yang creamy.",
          info: "Espresso • cokelat • susu • 16 oz",
          image: "src/assets/products/kopi-soklat.webp",
          priceOriginal: 22000, priceDiscount: 14000, isBestSeller: true, sold: "4k+",
          allowHot: true, largePrice: 3500, milks: milks.freshOnly,
          toppings: [opt("choco-chip", "Choco Chip", 3000), opt("coffee-jelly", "Coffee Jelly", 4000)]
        }),
        drink({
          id: "jj-earl-grey", brandId: "janji-jiwa", name: "Earl Grey Milk Tea", category: "Tea & Milk",
          description: "Aroma bergamot Earl Grey dengan susu manis gurih dan lembut.",
          info: "Earl Grey • susu • 16 oz",
          image: "src/assets/products/milk-tea.webp",
          priceOriginal: 24000, priceDiscount: 15500, sold: "2k+",
          allowHot: false, largePrice: 3500, milks: milks.freshOnly,
          toppings: [opt("boba", "Boba Jiwa", 4000)]
        }),
        drink({
          id: "jj-americano", brandId: "janji-jiwa", name: "Americano", category: "Kopi Jiwa",
          description: "Espresso dengan air mineral, clean dan kuat.",
          info: "Espresso • air mineral • 16 oz",
          image: "src/assets/products/americano.webp",
          priceOriginal: 18000, priceDiscount: 11000, sold: "1k+",
          allowHot: true, largePrice: 3500, milks: [],
          toppings: [opt("extra-shot", "Extra Espresso", 5000)]
        }),
        drink({
          id: "jj-matcha", brandId: "janji-jiwa", name: "Matcha Latte", category: "Non-Coffee",
          description: "Matcha dengan susu lembut, earthy dan menenangkan.",
          info: "Matcha • susu • 16 oz",
          image: "src/assets/products/matcha-latte.webp",
          priceOriginal: 28000, priceDiscount: 17000, sold: "900+",
          allowHot: true, largePrice: 3500, milks: milks.freshOat,
          toppings: [opt("cheese-foam", "Cheese Foam", 6000)]
        }),
        drink({
          id: "jj-chocolate", brandId: "janji-jiwa", name: "Chocolate Jiwa", category: "Non-Coffee",
          description: "Cokelat creamy dengan susu segar, manis dan comforting.",
          info: "Cokelat • susu • 16 oz",
          image: "src/assets/products/chocolate.webp",
          priceOriginal: 25000, priceDiscount: 15000, sold: "700+",
          allowHot: true, largePrice: 3500, milks: milks.freshOnly,
          toppings: [opt("choco-chip", "Choco Chip", 3000)]
        }),
        food({
          id: "jj-toast-mentai", brandId: "janji-jiwa", name: "Jiwa Toast: Crispy Chicken Mentai", category: "Toast",
          description: "Roti panggang tebal isi ayam krispi dengan saus mentai gurih pedas.",
          info: "Toast • ayam krispi • saus mentai • mengandung gluten & dairy",
          image: "src/assets/products/toast-mentai.webp",
          priceOriginal: 32000, priceDiscount: 22000, isBestSeller: true, sold: "2k+",
          addons: [opt("extra-cheese", "Extra Keju", 4000), opt("extra-mentai", "Extra Saus Mentai", 3000)]
        }),
        food({
          id: "jj-toast-egg", brandId: "janji-jiwa", name: "Jiwa Toast: Egg and Cheese", category: "Toast",
          description: "Omelette telur fluffy dengan keju melted di dalam toast butter renyah.",
          info: "Toast • telur • keju • mengandung gluten & dairy",
          image: "src/assets/products/toast-egg.webp",
          priceOriginal: 26000, priceDiscount: 17500, sold: "1k+",
          addons: [opt("extra-cheese", "Extra Keju", 4000)]
        }),
        food({
          id: "jj-croissant", brandId: "janji-jiwa", name: "Croissant Butter", category: "Toast",
          description: "Croissant butter renyah dengan aroma mentega yang kuat.",
          info: "Butter croissant • mengandung gluten",
          image: "src/assets/products/croissant.webp",
          priceOriginal: 20000, priceDiscount: 13000, sold: "500+",
          addons: [opt("extra-butter", "Extra Butter", 3000)]
        })
      ]
    }
  ];

  window.DLM_BRANDS = brands;
})();
