/* ============================================================
   DIBELIIN LEBIH MURAH — APP CONTROLLER
   Mobile-first ordering flow:
   Brand -> Outlet -> Menu -> Cart -> Checkout -> WhatsApp
   ============================================================ */
(function () {
  "use strict";

  const CFG = window.DLM_CONFIG;
  const U = window.DLM_UTIL;
  const ICON = window.DLM_ICONS;
  const STORE = window.DLM_STORE;
  const CART = window.DLM_CART;
  const CUSTOMIZER = window.DLM_CUSTOMIZER;
  const WA = window.DLM_WA;

  const $ = (selector, root) => (root || document).querySelector(selector);
  const $$ = (selector, root) => Array.from((root || document).querySelectorAll(selector));

  let firstRender = true;
  let toastTimer = null;
  let lastSuccess = null;
  let confirmCallback = null;
  let revealObserver = null;
  let modalLastFocus = null;

  const debouncedOutletList = U.debounce(() => {
    if (STORE.getRoute() === "outlet") renderOutletList();
  }, 140);

  const debouncedMenuGrid = U.debounce(() => {
    if (STORE.getRoute() === "menu") renderMenuGrid();
  }, 140);

  /* ============================================================
     ROUTER & SHELL
     ============================================================ */

  function init() {
    renderRoute();
    window.addEventListener("hashchange", renderRoute);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    CART.subscribe(summary => {
      updateCartBadge(summary);
      renderBottomBar(STORE.getRoute());
    });
    document.addEventListener("click", handleClick);
    document.addEventListener("input", handleInput);
    document.addEventListener("change", handleChange);
    document.addEventListener("keydown", handleKeydown);
  }

  function handleScroll() {
    const topBar = $(".app-top");
    if (topBar) topBar.classList.toggle("is-scrolled", window.scrollY > 6);
  }

  function setupReveal() {
    const elements = $$(".reveal");
    if (!("IntersectionObserver" in window)) {
      elements.forEach(el => el.classList.add("is-in"));
      return;
    }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          revealObserver.unobserve(entry.target);
        });
      }, { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });
    }
    elements.forEach((el, index) => {
      if (el.classList.contains("is-in")) return;
      if (!el.style.getPropertyValue("--reveal-delay")) {
        el.style.setProperty("--reveal-delay", `${Math.min(index, 8) * 45}ms`);
      }
      revealObserver.observe(el);
    });
  }

  function renderRoute() {
    const route = STORE.getRoute();

    if (!STORE.canEnter(route)) {
      const fallback = route === "outlet" ? "brand" : (STORE.state.selectedBrandId ? "outlet" : "brand");
      STORE.navigate(fallback, true);
      return renderRoute();
    }

    if (route === "checkout" && CART.getSummary().totalItems === 0) {
      STORE.navigate("cart", true);
      return renderRoute();
    }

    renderHeader(route);
    renderProgress(route);

    if (route === "brand") renderBrandStep();
    else if (route === "outlet") renderOutletStep();
    else if (route === "menu") renderMenuStep();
    else if (route === "cart") renderCartStep();
    else if (route === "checkout") renderCheckoutStep();

    renderBottomBar(route);
    updateCartBadge(CART.getSummary());
    setupReveal();

    if (firstRender) {
      firstRender = false;
      U.scrollTop(false);
    } else {
      U.scrollTop(true);
    }

    const mainEl = $("#app-main");
    if (mainEl && !document.body.classList.contains("modal-open")) {
      mainEl.focus({ preventScroll: true });
    }
  }

  function renderHeader(route) {
    const header = $("#app-header");
    if (!header) return;
    const step = STORE.stepIndex(route);
    const brand = STORE.getBrand();
    const outlet = STORE.getOutlet();

    let eyebrow = `${CFG.city} • Minuman & makanan`;
    let title = "Dibeliin Lebih Murah";

    if (step === 1) {
      eyebrow = "Langkah 2 dari 5";
      title = "Pilih Outlet";
    } else if (step === 2) {
      eyebrow = `Langkah 3 dari 5 • ${brand ? brand.shortName : ""}`;
      title = "Pilih Menu";
    } else if (step === 3) {
      eyebrow = "Langkah 4 dari 5";
      title = "Keranjang";
    } else if (step === 4) {
      eyebrow = "Langkah 5 dari 5";
      title = "Data Pemesan";
    }

    const left = step > 0
      ? `<button type="button" class="icon-btn header-back" data-action="back" aria-label="Kembali">${ICON.icon("chevron-left", "w-5 h-5", 2.4)}</button>`
      : `<div class="logo-mark" aria-hidden="true">${ICON.icon("coffee", "w-5 h-5", 2)}</div>`;

    header.innerHTML = `
      <div class="header-left">
        ${left}
        <div class="header-copy">
          <span class="header-eyebrow">${U.esc(eyebrow)}</span>
          <h1 class="header-title">${U.esc(title)}</h1>
          ${step === 2 && outlet ? `<span class="header-subtitle">${U.esc(outlet.name)}</span>` : ""}
        </div>
      </div>
      <button type="button" class="cart-btn" data-action="go-cart" aria-label="Buka keranjang">
        ${ICON.icon("shopping-bag", "w-5 h-5", 2)}
        <span class="cart-badge is-hidden" id="cart-badge">0</span>
      </button>
    `;
  }

  function renderProgress(route) {
    const progress = $("#step-progress");
    if (!progress) return;
    const step = STORE.stepIndex(route);
    if (step === 0) {
      progress.innerHTML = "";
      progress.classList.add("is-hidden");
      return;
    }
    progress.classList.remove("is-hidden");
    progress.innerHTML = `
      <div class="step-progress-inner">
        <div class="step-bars" role="progressbar" aria-valuemin="1" aria-valuemax="5" aria-valuenow="${step + 1}" aria-label="Langkah ${step + 1} dari 5: ${U.esc(CFG.steps[step].label)}">
          ${CFG.steps.map((s, i) => `<span class="step-bar ${i <= step ? "is-done" : ""} ${i === step ? "is-current" : ""}"></span>`).join("")}
        </div>
      </div>
    `;
  }

  function renderBottomBar(route) {
    const bar = $("#bottom-bar");
    if (!bar) return;
    const summary = CART.getSummary();
    let html = "";

    if (route === "menu" && summary.totalItems > 0) {
      html = `
        <div class="bottom-bar-inner">
          <button type="button" class="bottom-cart-summary" data-action="go-cart">
            <span class="bottom-cart-icon">${ICON.icon("shopping-bag", "w-5 h-5", 2)}<span>${summary.totalItems}</span></span>
            <span class="bottom-cart-copy"><small>Total pesanan</small><strong>${U.rp(summary.subtotal)}</strong></span>
          </button>
          <button type="button" class="btn-primary btn-bottom" data-action="go-cart">
            Lihat Keranjang ${ICON.icon("arrow-right", "w-4 h-4", 2.4)}
          </button>
        </div>
      `;
    } else if (route === "cart" && summary.totalItems > 0) {
      html = `
        <div class="bottom-bar-inner">
          <div class="bottom-total"><small>Total</small><strong>${U.rp(summary.grandTotal)}</strong></div>
          <button type="button" class="btn-primary btn-bottom" data-action="go-checkout">
            Lanjut Isi Data ${ICON.icon("arrow-right", "w-4 h-4", 2.4)}
          </button>
        </div>
      `;
    } else if (route === "checkout" && summary.totalItems > 0) {
      html = `
        <div class="bottom-bar-inner">
          <div class="bottom-total"><small>Total</small><strong>${U.rp(summary.grandTotal)}</strong></div>
          <button type="button" class="btn-wa btn-bottom" data-action="submit-order">
            ${ICON.brand("whatsapp", "w-4 h-4")} Kirim Pesanan
          </button>
        </div>
      `;
    }

    if (!html) {
      bar.innerHTML = "";
      bar.classList.remove("is-visible");
      document.body.classList.remove("has-bottom-bar");
      return;
    }

    bar.innerHTML = html;
    bar.classList.add("is-visible");
    document.body.classList.add("has-bottom-bar");
  }

  function updateCartBadge(summary) {
    const badge = $("#cart-badge");
    if (!badge) return;
    badge.textContent = String(summary.totalItems);
    badge.classList.toggle("is-hidden", summary.totalItems === 0);

    const cartButton = badge.closest(".cart-btn");
    if (cartButton) {
      cartButton.setAttribute(
        "aria-label",
        summary.totalItems > 0
          ? `Buka keranjang, ${summary.totalItems} item`
          : "Buka keranjang, kosong"
      );
    }
  }

  /* ============================================================
     STEP 1 — BRAND DASHBOARD
     ============================================================ */

  function renderBrandStep() {
    const main = $("#app-main");
    if (!main) return;

    const promos = window.DLM_BRANDS
      .map(brand => ({ brand, item: brand.items.find(item => item.isBestSeller) }))
      .filter(entry => entry.item)
      .slice(0, 4);

    const lastOrder = WA.getLastOrder();

    main.innerHTML = `
      <section class="hero-card reveal">
        <div class="hero-media">
          <div class="media-fallback">${ICON.icon("coffee", "w-14 h-14", 1.4)}</div>
          ${U.imageTag("src/assets/products/hero-coffee.webp", "Suasana kedai kopi", "hero-img", true)}
          <div class="hero-shade"></div>
        </div>
        <div class="hero-content">
          <span class="hero-eyebrow">${ICON.icon("map-pin", "w-3.5 h-3.5", 2.2)} ${CFG.city}, ${CFG.region}</span>
          <h2 class="hero-title">Minuman favorit,<br><span>harga lebih ramah.</span></h2>
          <p class="hero-text">Pesan dari Tomoro, Fore, Kopi Kenangan, dan Janji Jiwa. Harga sudah termasuk biaya jasa.</p>
          <div class="hero-brand-row">
            ${window.DLM_BRANDS.map(brand => `<span class="hero-brand-dot" style="--dot:${brand.accent}" title="${U.esc(brand.name)}">${U.esc(brand.monogram)}</span>`).join("")}
            <span class="hero-brand-note">4 brand pilihan</span>
          </div>
        </div>
      </section>

      <section class="section reveal">
        <div class="section-head">
          <div>
            <p class="eyebrow">Mulai dari sini</p>
            <h2 class="section-title">Pilih brand favoritmu</h2>
          </div>
          <span class="section-count">4 brand</span>
        </div>
        <div class="brand-grid">
          ${window.DLM_BRANDS.map(brand => brandCard(brand)).join("")}
        </div>
      </section>

      <section class="section reveal">
        <div class="section-head">
          <div>
            <p class="eyebrow">Lagi promo</p>
            <h2 class="section-title">Paling dicari minggu ini</h2>
          </div>
          <span class="section-count">${promos.length} menu</span>
        </div>
        <div class="h-scroll promo-rail">
          ${promos.map(entry => promoCard(entry.brand, entry.item)).join("")}
        </div>
      </section>

      ${lastOrder ? lastOrderSection(lastOrder) : ""}

      <section class="section reveal">
        <div class="section-head">
          <div>
            <p class="eyebrow">Cara pesan</p>
            <h2 class="section-title">Tiga langkah, pesanan siap</h2>
          </div>
        </div>
        <div class="steps-list">
          <div class="step-item">
            <span class="step-icon">${ICON.icon("store", "w-5 h-5", 2)}</span>
            <div><strong>Pilih brand & outlet</strong><p>Tentukan cabang Samarinda yang paling dekat.</p></div>
          </div>
          <div class="step-item">
            <span class="step-icon">${ICON.icon("cup-soda", "w-5 h-5", 2)}</span>
            <div><strong>Pilih menu & custom</strong><p>Atur ukuran, gula, es, susu, dan topping.</p></div>
          </div>
          <div class="step-item">
            <span class="step-icon">${ICON.brand("whatsapp", "w-5 h-5")}</span>
            <div><strong>Checkout via WhatsApp</strong><p>Pesanan dikirim rapi, admin konfirmasi pembayaran.</p></div>
          </div>
        </div>
      </section>

      <section class="trust-row reveal">
        <div class="trust-item">
          <span class="trust-icon">${ICON.icon("badge-percent", "w-5 h-5", 2)}</span>
          <strong>Harga lebih murah</strong>
          <small>Hemat sampai 50%</small>
        </div>
        <div class="trust-item">
          <span class="trust-icon">${ICON.icon("timer", "w-5 h-5", 2)}</span>
          <strong>Respon cepat</strong>
          <small>Admin bantu via WA</small>
        </div>
        <div class="trust-item">
          <span class="trust-icon">${ICON.icon("shield-check", "w-5 h-5", 2)}</span>
          <strong>Pesanan rapi</strong>
          <small>Rincian jelas</small>
        </div>
      </section>

      <footer class="app-footer reveal">
        <div class="footer-brand">${ICON.icon("coffee", "w-4 h-4", 2)} ${CFG.appName}</div>
        <p>Layanan order minuman & makanan • ${CFG.city}</p>
        <p>Harga sudah termasuk biaya jasa. Pembayaran dikonfirmasi admin via WhatsApp.</p>
      </footer>
    `;
  }

  function brandMark(brand, className) {
    if (brand.logo) {
      return `<span class="${className} brand-logo"><img src="${U.esc(brand.logo)}" alt="" loading="lazy" decoding="async"></span>`;
    }
    return `<span class="${className}">${U.esc(brand.monogram)}</span>`;
  }

  function brandCard(brand) {
    return `
      <button type="button" class="brand-card" data-brand-id="${U.esc(brand.id)}" style="--brand:${brand.accent};--brand-soft:${brand.accentSoft};--brand-deep:${brand.accentDeep}">
        <span class="sr-only">Pilih brand: </span>
        <span class="brand-card-glow" aria-hidden="true"></span>
        <span class="brand-card-top">
          ${brandMark(brand, "brand-monogram")}
          <span class="brand-rating">${ICON.icon("star", "w-3 h-3", 2.4)} ${U.esc(brand.rating)}</span>
        </span>
        <span class="brand-card-body">
          <span class="brand-promo">${U.esc(brand.promoBadge)}</span>
          <span class="brand-name">${U.esc(brand.name)}</span>
          <span class="brand-tagline">${U.esc(brand.tagline)}</span>
        </span>
        <span class="brand-card-foot">
          <span class="brand-menu-count">${brand.items.length} menu</span>
          <span class="brand-cta">Pilih ${ICON.icon("arrow-right", "w-3.5 h-3.5", 2.4)}</span>
        </span>
      </button>
    `;
  }

  function promoCard(brand, item, compact) {
    const discount = Math.round(((item.priceOriginal - item.priceDiscount) / item.priceOriginal) * 100);
    return `
      <button type="button" class="promo-card ${compact ? "is-compact" : ""}" data-brand-id="${U.esc(brand.id)}" data-item-id="${U.esc(item.id)}">
        <span class="sr-only">Lihat menu: </span>
        <span class="promo-media">
          <span class="media-fallback">${ICON.icon("coffee", "w-7 h-7", 1.6)}</span>
          ${U.imageTag(item.image, item.name, "promo-img")}
          <span class="badge badge-save">-${discount}%</span>
        </span>
        <span class="promo-body">
          <span class="promo-brand">${U.esc(brand.shortName)}</span>
          <span class="promo-name">${U.esc(item.name)}</span>
          <span class="promo-price"><strong>${U.rp(item.priceDiscount)}</strong><s>${U.rp(item.priceOriginal)}</s></span>
        </span>
      </button>
    `;
  }

  function lastOrderSection(order) {
    return `
      <section class="section reveal">
        <div class="section-head">
          <div>
            <p class="eyebrow">Riwayat</p>
            <h2 class="section-title">Pesanan terakhir</h2>
          </div>
          <span class="section-count">#${U.esc(order.orderId)}</span>
        </div>
        <div class="last-order-card">
          <div class="last-order-icon">${ICON.icon("receipt", "w-5 h-5", 2)}</div>
          <div class="last-order-copy">
            <strong>${U.esc(order.brandName)} • ${U.esc(order.outletName)}</strong>
            <span>${order.itemsCount} item • ${U.rp(order.total)}</span>
          </div>
          <button type="button" class="btn-soft btn-sm" data-action="order-again">Pesan lagi</button>
        </div>
      </section>
    `;
  }

  /* ============================================================
     STEP 2 — OUTLET
     ============================================================ */

  function renderOutletStep() {
    const main = $("#app-main");
    const brand = STORE.getBrand();
    if (!main || !brand) return;

    const areas = STORE.getBrandAreas(brand.id);

    main.innerHTML = `
      <section class="brand-strip reveal" style="--brand:${brand.accent};--brand-soft:${brand.accentSoft};--brand-deep:${brand.accentDeep}">
        ${brandMark(brand, "brand-strip-logo")}
        <div class="brand-strip-copy">
          <p class="eyebrow">Brand terpilih</p>
          <h2>${U.esc(brand.name)}</h2>
          <span>${U.esc(brand.tagline)}</span>
        </div>
        <button type="button" class="btn-soft btn-sm" data-action="change-brand">Ganti</button>
      </section>

      <section class="section reveal">
        <div class="section-head">
          <div>
            <p class="eyebrow">Lokasi</p>
            <h2 class="section-title">Pilih outlet terdekat</h2>
          </div>
          <span class="section-count" id="outlet-count">${STORE.getBrandOutlets(brand.id).length} outlet</span>
        </div>

        <div class="search-field">
          ${ICON.icon("search", "w-4 h-4", 2.2)}
          <input type="search" id="outlet-search" class="search-input" placeholder="Cari mall, jalan, atau area..." value="${U.esc(STORE.state.outletQuery)}" autocomplete="off">
        </div>

        <div class="chip-row no-scrollbar" id="outlet-areas">
          ${areas.map(area => `<button type="button" class="chip ${STORE.state.outletArea === area ? "is-active" : ""}" data-area="${U.esc(area)}">${U.esc(area)}</button>`).join("")}
        </div>

        <div class="outlet-list" id="outlet-list"></div>

        <div class="note-card">
          ${ICON.icon("info", "w-4 h-4", 2)}
          <p>${U.esc(CFG.operationalNote)}</p>
        </div>
      </section>
    `;

    renderOutletList();
  }

  function renderOutletList() {
    const listEl = $("#outlet-list");
    const brand = STORE.getBrand();
    if (!listEl || !brand) return;

    const query = (STORE.state.outletQuery || "").trim().toLowerCase();
    let outlets = STORE.getBrandOutlets(brand.id);

    if (STORE.state.outletArea && STORE.state.outletArea !== "Semua Area") {
      outlets = outlets.filter(outlet => outlet.area === STORE.state.outletArea);
    }

    if (query) {
      outlets = outlets.filter(outlet =>
        outlet.name.toLowerCase().includes(query) ||
        outlet.address.toLowerCase().includes(query) ||
        outlet.area.toLowerCase().includes(query)
      );
    }

    const countEl = $("#outlet-count");
    if (countEl) countEl.textContent = `${outlets.length} outlet`;

    if (!outlets.length) {
      listEl.innerHTML = `
        <div class="empty-state compact">
          <div class="empty-icon">${ICON.icon("map-pin", "w-7 h-7", 1.8)}</div>
          <h3>Outlet tidak ditemukan</h3>
          <p>Coba kata kunci lain atau pilih area lain.</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = outlets.map(outlet => `
      <button type="button" class="outlet-card" data-outlet-id="${U.esc(outlet.id)}">
        <span class="sr-only">Pilih outlet: </span>
        <span class="outlet-icon">${ICON.icon("store", "w-5 h-5", 2)}</span>
        <span class="outlet-copy">
          <span class="outlet-title-row">
            <span class="outlet-name">${U.esc(outlet.name)}</span>
            <span class="open-badge">${ICON.icon("circle-check", "w-3 h-3", 2.4)} Buka</span>
          </span>
          <span class="outlet-address">${U.esc(outlet.address)}</span>
          <span class="outlet-meta">
            <span>${ICON.icon("map-pin", "w-3.5 h-3.5", 2)} ${U.esc(outlet.area)}</span>
            <span>${ICON.icon("clock", "w-3.5 h-3.5", 2)} ${U.esc(outlet.hours)}</span>
            <span>${ICON.icon("navigation", "w-3.5 h-3.5", 2)} ${U.esc(outlet.distance)}</span>
          </span>
        </span>
        <span class="outlet-arrow">${ICON.icon("chevron-right", "w-4 h-4", 2.4)}</span>
      </button>
    `).join("");
  }

  /* ============================================================
     STEP 3 — MENU
     ============================================================ */

  function renderMenuStep() {
    const main = $("#app-main");
    const brand = STORE.getBrand();
    const outlet = STORE.getOutlet();
    if (!main || !brand || !outlet) return;

    main.innerHTML = `
      <section class="outlet-strip reveal" style="--brand:${brand.accent};--brand-soft:${brand.accentSoft};--brand-deep:${brand.accentDeep}">
        ${brandMark(brand, "outlet-strip-logo")}
        <div class="outlet-strip-copy">
          <p class="eyebrow">${U.esc(brand.shortName)}</p>
          <h2>${U.esc(outlet.name)}</h2>
          <span>${ICON.icon("clock", "w-3.5 h-3.5", 2)} ${U.esc(outlet.hours)} • ${U.esc(outlet.area)}</span>
        </div>
        <button type="button" class="btn-soft btn-sm" data-action="change-outlet">Ubah</button>
      </section>

      <section class="menu-section reveal">
        <div class="search-field">
          ${ICON.icon("search", "w-4 h-4", 2.2)}
          <input type="search" id="menu-search" class="search-input" placeholder="Cari kopi, milk tea, toast..." value="${U.esc(STORE.state.searchQuery)}" autocomplete="off">
        </div>

        <div class="chip-row no-scrollbar" id="menu-categories">
          ${brand.categories.map(category => `<button type="button" class="chip ${STORE.state.activeCategory === category ? "is-active" : ""}" data-category="${U.esc(category)}">${U.esc(category)}</button>`).join("")}
        </div>

        <div class="menu-toolbar">
          <div>
            <p class="eyebrow">Menu ${U.esc(brand.shortName)}</p>
            <h2 class="section-title" id="menu-heading">${U.esc(STORE.state.activeCategory === "Semua" ? "Semua Menu" : STORE.state.activeCategory)}</h2>
            <span class="menu-count" id="menu-count"></span>
          </div>
          <label class="sort-field">
            <span class="sr-only">Urutkan menu</span>
            <select id="menu-sort" class="sort-select">
              <option value="popular" ${STORE.state.sort === "popular" ? "selected" : ""}>Terlaris</option>
              <option value="cheapest" ${STORE.state.sort === "cheapest" ? "selected" : ""}>Termurah</option>
              <option value="discount" ${STORE.state.sort === "discount" ? "selected" : ""}>Diskon</option>
            </select>
            ${ICON.icon("chevron-down", "w-3.5 h-3.5", 2.4)}
          </label>
        </div>

        <div id="menu-results"></div>

        <div class="note-card">
          ${ICON.icon("info", "w-4 h-4", 2)}
          <p>Harga sudah termasuk biaya jasa. Ketersediaan menu mengikuti outlet yang dipilih.</p>
        </div>
      </section>
    `;

    renderMenuGrid();
  }

  function sortItems(items, sort) {
    const list = items.slice();
    const soldValue = (item) => {
      const raw = String(item.sold || "").toLowerCase();
      const number = parseFloat(raw.replace(/[^\d.]/g, "")) || 0;
      return raw.includes("k") ? number * 1000 : number;
    };

    if (sort === "cheapest") {
      list.sort((a, b) => a.priceDiscount - b.priceDiscount);
    } else if (sort === "discount") {
      list.sort((a, b) => {
        const da = (a.priceOriginal - a.priceDiscount) / a.priceOriginal;
        const db = (b.priceOriginal - b.priceDiscount) / b.priceOriginal;
        return db - da;
      });
    } else {
      list.sort((a, b) => {
        if (a.isBestSeller !== b.isBestSeller) return a.isBestSeller ? -1 : 1;
        return soldValue(b) - soldValue(a);
      });
    }
    return list;
  }

  function renderMenuGrid() {
    const results = $("#menu-results");
    const brand = STORE.getBrand();
    if (!results || !brand) return;

    const query = (STORE.state.searchQuery || "").trim().toLowerCase();
    let items = brand.items.slice();

    if (STORE.state.activeCategory && STORE.state.activeCategory !== "Semua") {
      items = items.filter(item => item.category === STORE.state.activeCategory);
    }

    if (query) {
      items = items.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );
    }

    items = sortItems(items, STORE.state.sort);

    const countEl = $("#menu-count");
    if (countEl) countEl.textContent = `${items.length} menu tersedia`;

    const headingEl = $("#menu-heading");
    if (headingEl) headingEl.textContent = STORE.state.activeCategory === "Semua" ? "Semua Menu" : STORE.state.activeCategory;

    const showBest = STORE.state.activeCategory === "Semua" && !query;
    const best = brand.items.filter(item => item.isBestSeller).slice(0, 4);

    results.innerHTML = `
      ${showBest && best.length ? `
        <section class="best-section">
          <div class="section-head compact">
            <div>
              <p class="eyebrow">Best seller</p>
              <h3 class="section-title small">Paling dicari</h3>
            </div>
            <span class="section-count">${best.length} menu</span>
          </div>
          <div class="h-scroll promo-rail">
            ${best.map(item => promoCard(brand, item, true)).join("")}
          </div>
        </section>
      ` : ""}

      ${items.length ? `
        <div class="product-grid">
          ${items.map(item => productCard(brand, item)).join("")}
        </div>
      ` : `
        <div class="empty-state">
          <div class="empty-icon">${ICON.icon("coffee", "w-8 h-8", 1.8)}</div>
          <h3>Menu tidak ditemukan</h3>
          <p>Coba kata kunci lain atau pilih kategori Semua.</p>
          <button type="button" class="btn-soft" data-category="Semua">Lihat semua menu</button>
        </div>
      `}
    `;

    setupReveal();
  }

  function productCard(brand, item) {
    const discount = Math.round(((item.priceOriginal - item.priceDiscount) / item.priceOriginal) * 100);
    return `
      <button type="button" class="product-card reveal" data-item-id="${U.esc(item.id)}">
        <span class="sr-only">Tambah ke keranjang: </span>
        <span class="product-media">
          <span class="media-fallback">${ICON.icon("coffee", "w-8 h-8", 1.6)}</span>
          ${U.imageTag(item.image, item.name, "product-img")}
          <span class="product-badges">
            <span class="badge badge-save">-${discount}%</span>
            ${item.isBestSeller ? `<span class="badge badge-best">${ICON.icon("star", "w-2.5 h-2.5", 2.4)} Best</span>` : ""}
          </span>
          <span class="product-add" aria-hidden="true">${ICON.icon("plus", "w-4 h-4", 2.6)}</span>
        </span>
        <span class="product-body">
          <span class="product-category">${U.esc(item.category)}</span>
          <span class="product-name">${U.esc(item.name)}</span>
          <span class="product-desc">${U.esc(item.description)}</span>
          <span class="product-price-row">
            <span class="product-price"><strong>${U.rp(item.priceDiscount)}</strong><s>${U.rp(item.priceOriginal)}</s></span>
            <span class="product-rating">${ICON.icon("star", "w-3 h-3", 2.4)} ${U.esc(item.rating)}</span>
          </span>
        </span>
      </button>
    `;
  }

  /* ============================================================
     STEP 4 — CART
     ============================================================ */

  function formatCartOptions(item) {
    const groups = {};
    (item.selections || []).forEach(selection => {
      if (!groups[selection.groupLabel]) groups[selection.groupLabel] = [];
      let value = selection.label;
      if (selection.groupId === "size" && selection.note) value += ` (${selection.note})`;
      groups[selection.groupLabel].push(value);
    });
    return Object.keys(groups).map(label => `${label}: ${groups[label].join(", ")}`).join(" • ");
  }

  function renderCartStep() {
    const main = $("#app-main");
    if (!main) return;
    const summary = CART.getSummary();
    const brand = STORE.getBrand();
    const outlet = STORE.getOutlet();

    if (!summary.totalItems) {
      main.innerHTML = `
        <section class="empty-state cart-empty reveal">
          <div class="empty-icon">${ICON.icon("shopping-bag", "w-8 h-8", 1.8)}</div>
          <h2>Keranjang masih kosong</h2>
          <p>Yuk pilih menu favoritmu dulu. Setelah itu kamu bisa atur varian dan topping.</p>
          <button type="button" class="btn-primary" data-action="go-menu">Pilih Menu ${ICON.icon("arrow-right", "w-4 h-4", 2.4)}</button>
        </section>
      `;
      return;
    }

    main.innerHTML = `
      ${brand && outlet ? `
        <section class="outlet-strip reveal" style="--brand:${brand.accent};--brand-soft:${brand.accentSoft};--brand-deep:${brand.accentDeep}">
          ${brandMark(brand, "outlet-strip-logo")}
          <div class="outlet-strip-copy">
            <p class="eyebrow">Pesanan untuk</p>
            <h2>${U.esc(outlet.name)}</h2>
            <span>${U.esc(brand.name)} • ${U.esc(outlet.area)}</span>
          </div>
          <button type="button" class="btn-soft btn-sm" data-action="change-outlet">Ubah</button>
        </section>
      ` : ""}

      <section class="section reveal">
        <div class="section-head">
          <div>
            <p class="eyebrow">Pesananmu</p>
            <h2 class="section-title">Rincian menu</h2>
          </div>
          <span class="section-count">${summary.totalItems} item</span>
        </div>
        <div class="cart-list">
          ${summary.items.map(item => cartItemMarkup(item)).join("")}
        </div>
        <button type="button" class="btn-soft btn-full" data-action="go-menu">
          ${ICON.icon("plus", "w-4 h-4", 2.4)} Tambah menu lain
        </button>
      </section>

      <section class="summary-card reveal">
        <div class="summary-row"><span>Subtotal</span><strong>${U.rp(summary.subtotal)}</strong></div>
        ${summary.totalSavings > 0 ? `<div class="summary-row is-success"><span>Hemat promo</span><strong>-${U.rp(summary.totalSavings)}</strong></div>` : ""}
        <div class="summary-note">${ICON.icon("info", "w-3.5 h-3.5", 2)} Harga sudah termasuk biaya jasa admin.</div>
        <div class="summary-total"><span>Total</span><strong>${U.rp(summary.grandTotal)}</strong></div>
      </section>

      <div class="note-card">
        ${ICON.icon("shield-check", "w-4 h-4", 2)}
        <p>Pesanan akan dikirim ke WhatsApp admin untuk konfirmasi ketersediaan dan pembayaran.</p>
      </div>
    `;
  }

  function cartItemMarkup(item) {
    return `
      <article class="cart-item" data-signature="${U.esc(item.signature)}">
        <div class="cart-media">
          <div class="media-fallback">${ICON.icon("coffee", "w-6 h-6", 1.6)}</div>
          ${U.imageTag(item.image, item.name, "cart-img")}
        </div>
        <div class="cart-copy">
          <div class="cart-title-row">
            <h3>${U.esc(item.name)}</h3>
            <button type="button" class="icon-btn danger" data-action="remove-item" data-signature="${U.esc(item.signature)}" aria-label="Hapus ${U.esc(item.name)}">${ICON.icon("trash-2", "w-4 h-4", 2)}</button>
          </div>
          <p class="cart-options">${U.esc(formatCartOptions(item))}</p>
          ${item.notes ? `<p class="cart-notes">"${U.esc(item.notes)}"</p>` : ""}
          <div class="cart-bottom">
            <strong>${U.rp(item.unitPrice * item.quantity)}</strong>
            <div class="qty-stepper small" role="group" aria-label="Jumlah ${U.esc(item.name)}">
              <button type="button" class="qty-btn" data-action="qty" data-signature="${U.esc(item.signature)}" data-delta="-1" aria-label="Kurangi">${ICON.icon("minus", "w-3.5 h-3.5", 2.4)}</button>
              <span class="qty-value">${item.quantity}</span>
              <button type="button" class="qty-btn" data-action="qty" data-signature="${U.esc(item.signature)}" data-delta="1" aria-label="Tambah">${ICON.icon("plus", "w-3.5 h-3.5", 2.4)}</button>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  /* ============================================================
     STEP 5 — CHECKOUT
     ============================================================ */

  function renderCheckoutStep() {
    const main = $("#app-main");
    if (!main) return;
    const summary = CART.getSummary();
    const brand = STORE.getBrand();
    const outlet = STORE.getOutlet();
    if (!brand || !outlet) {
      STORE.navigate("brand", true);
      return;
    }
    const customer = STORE.state.customer;
    const delivery = STORE.state.orderMode === "delivery";

    main.innerHTML = `
      <section class="outlet-strip reveal" style="--brand:${brand.accent};--brand-soft:${brand.accentSoft};--brand-deep:${brand.accentDeep}">
        ${brandMark(brand, "outlet-strip-logo")}
        <div class="outlet-strip-copy">
          <p class="eyebrow">Pesanan untuk</p>
          <h2>${U.esc(outlet.name)}</h2>
          <span>${U.esc(brand.name)} • ${U.esc(outlet.area)}</span>
        </div>
        <button type="button" class="btn-soft btn-sm" data-action="change-outlet">Ubah</button>
      </section>

      <section class="form-card reveal">
        <div class="section-head">
          <div>
            <p class="eyebrow">Langkah terakhir</p>
            <h2 class="section-title">Data pemesan</h2>
          </div>
          <span class="req-badge">Wajib</span>
        </div>

        <div class="form-group">
          <label class="form-label" for="customer-name">Nama lengkap <span>*</span></label>
          <input type="text" id="customer-name" class="form-input" value="${U.esc(customer.name)}" placeholder="Contoh: Budi Santoso" autocomplete="name" required>
          <p class="form-error" id="error-name" role="alert"></p>
        </div>

        <div class="form-group">
          <label class="form-label" for="customer-phone">Nomor WhatsApp <span>*</span></label>
          <input type="tel" id="customer-phone" class="form-input" value="${U.esc(customer.phone)}" placeholder="081234567890" inputmode="numeric" autocomplete="tel" required>
          <p class="form-error" id="error-phone" role="alert"></p>
        </div>

        <div class="form-group">
          <span class="form-label">Metode pengambilan</span>
          <div class="mode-grid">
            <button type="button" class="mode-card ${delivery ? "" : "is-active"}" data-action="order-mode" data-mode="pickup" aria-pressed="${delivery ? "false" : "true"}">
              <span class="mode-icon">${ICON.icon("footprints", "w-5 h-5", 2)}</span>
              <span class="mode-title">Ambil sendiri</span>
              <span class="mode-sub">Pickup di outlet</span>
            </button>
            <button type="button" class="mode-card ${delivery ? "is-active" : ""}" data-action="order-mode" data-mode="delivery" aria-pressed="${delivery ? "true" : "false"}">
              <span class="mode-icon">${ICON.icon("truck", "w-5 h-5", 2)}</span>
              <span class="mode-title">Kirim driver</span>
              <span class="mode-sub">GoSend / Grab</span>
            </button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="pickup-time">Estimasi waktu</label>
          <input type="text" id="pickup-time" class="form-input" value="${U.esc(customer.pickupTime)}" placeholder="Contoh: Secepatnya (15–20 menit)">
        </div>

        <div class="form-group ${delivery ? "" : "is-hidden"}" id="address-wrap">
          <label class="form-label" for="delivery-address">Alamat pengantaran <span>*</span></label>
          <textarea id="delivery-address" class="form-input form-textarea" rows="3" placeholder="Nama jalan, nomor rumah, patokan, dan nama penerima">${U.esc(customer.address)}</textarea>
          <p class="form-error" id="error-address" role="alert"></p>
        </div>

        <div class="form-group">
          <label class="form-label" for="order-notes">Catatan untuk admin <span class="optional">(opsional)</span></label>
          <textarea id="order-notes" class="form-input form-textarea" rows="2" maxlength="200" placeholder="Contoh: mohon sedotan 2 pcs, es dipisah">${U.esc(customer.notes)}</textarea>
        </div>
      </section>

      <section class="summary-card reveal">
        <div class="section-head compact">
          <div>
            <p class="eyebrow">Ringkasan</p>
            <h2 class="section-title small">Pesananmu</h2>
          </div>
          <span class="section-count">${summary.totalItems} item</span>
        </div>
        <div class="checkout-lines">
          ${summary.items.map(item => `<div class="checkout-line"><span>${item.quantity}x ${U.esc(item.name)}</span><strong>${U.rp(item.unitPrice * item.quantity)}</strong></div>`).join("")}
        </div>
        <div class="summary-row"><span>Subtotal</span><strong>${U.rp(summary.subtotal)}</strong></div>
        ${summary.totalSavings > 0 ? `<div class="summary-row is-success"><span>Hemat promo</span><strong>-${U.rp(summary.totalSavings)}</strong></div>` : ""}
        <div class="summary-note">${ICON.icon("info", "w-3.5 h-3.5", 2)} Harga sudah termasuk biaya jasa admin.</div>
        <div class="summary-total"><span>Total</span><strong>${U.rp(summary.grandTotal)}</strong></div>
      </section>

      <section class="payment-card reveal">
        <div class="section-head compact">
          <div>
            <p class="eyebrow">Pembayaran</p>
            <h2 class="section-title small">Konfirmasi via WhatsApp</h2>
          </div>
          ${ICON.icon("wallet", "w-5 h-5", 2)}
        </div>
        <p class="payment-note">${U.esc(CFG.paymentNote)}</p>
        <div class="payment-logos">
          ${paymentLogo("qris.svg", "QRIS")}
          ${paymentLogo("gopay.svg", "GoPay")}
          ${paymentLogo("ovo.svg", "OVO")}
          ${paymentLogo("dana.svg", "DANA")}
          ${paymentLogo("shopeepay.svg", "ShopeePay")}
          ${paymentLogo("bca.svg", "BCA")}
          ${paymentLogo("mandiri.svg", "Mandiri")}
        </div>
        <p class="payment-small">Detail metode dan nomor tujuan pembayaran dikirim admin melalui WhatsApp setelah pesanan dicek.</p>
      </section>

      <div class="note-card">
        ${ICON.icon("message-circle", "w-4 h-4", 2)}
        <p>Dengan menekan tombol kirim, pesanan akan diteruskan ke WhatsApp admin. Pastikan data sudah benar.</p>
      </div>
    `;
  }

  function paymentLogo(file, label) {
    return `<span class="payment-badge" title="${U.esc(label)}"><img src="src/assets/payments/${file}" alt="${U.esc(label)}" loading="lazy" decoding="async" onerror="this.classList.add('is-hidden')"><span>${U.esc(label)}</span></span>`;
  }

  /* ============================================================
     EVENTS
     ============================================================ */

  function handleClick(event) {
    const actionEl = event.target.closest("[data-action]");
    if (actionEl) {
      event.preventDefault();
      handleAction(actionEl);
      return;
    }

    const itemEl = event.target.closest("[data-item-id]");
    if (itemEl) {
      event.preventDefault();
      handleItemClick(itemEl);
      return;
    }

    const brandEl = event.target.closest("[data-brand-id]");
    if (brandEl) {
      event.preventDefault();
      handleBrandClick(brandEl.dataset.brandId);
      return;
    }

    const outletEl = event.target.closest("[data-outlet-id]");
    if (outletEl) {
      event.preventDefault();
      STORE.setOutlet(outletEl.dataset.outletId);
      STORE.navigate("menu");
      return;
    }

    const categoryEl = event.target.closest("[data-category]");
    if (categoryEl) {
      event.preventDefault();
      STORE.state.activeCategory = categoryEl.dataset.category;
      $$("[data-category]").forEach(btn => btn.classList.toggle("is-active", btn.dataset.category === STORE.state.activeCategory));
      renderMenuGrid();
      return;
    }

    const areaEl = event.target.closest("[data-area]");
    if (areaEl) {
      event.preventDefault();
      STORE.state.outletArea = areaEl.dataset.area;
      $$("[data-area]").forEach(btn => btn.classList.toggle("is-active", btn.dataset.area === STORE.state.outletArea));
      renderOutletList();
    }
  }

  function handleAction(el) {
    const action = el.dataset.action;
    if (!action) return;

    if (action === "back") {
      STORE.navigate(STORE.prevRoute(STORE.getRoute()));
    } else if (action === "go-cart") {
      STORE.navigate("cart");
    } else if (action === "go-menu") {
      STORE.navigate("menu");
    } else if (action === "go-checkout") {
      STORE.navigate("checkout");
    } else if (action === "change-brand") {
      STORE.navigate("brand");
    } else if (action === "change-outlet") {
      STORE.navigate("outlet");
    } else if (action === "order-mode") {
      const mode = el.dataset.mode === "delivery" ? "delivery" : "pickup";
      STORE.state.orderMode = mode;
      $$(".mode-card").forEach(card => {
        const active = card.dataset.mode === mode;
        card.classList.toggle("is-active", active);
        card.setAttribute("aria-pressed", active ? "true" : "false");
      });
      const addressWrap = $("#address-wrap");
      if (addressWrap) addressWrap.classList.toggle("is-hidden", mode !== "delivery");
    } else if (action === "qty") {
      CART.updateQuantity(el.dataset.signature, parseInt(el.dataset.delta, 10) || 0);
      if (STORE.getRoute() === "cart") renderCartStep();
      renderBottomBar(STORE.getRoute());
    } else if (action === "remove-item") {
      CART.removeItem(el.dataset.signature);
      if (STORE.getRoute() === "cart") renderCartStep();
      renderBottomBar(STORE.getRoute());
    } else if (action === "submit-order") {
      submitOrder();
    } else if (action === "close-modal") {
      closeModal();
    } else if (action === "confirm-yes") {
      const callback = confirmCallback;
      closeModal();
      if (typeof callback === "function") callback();
    } else if (action === "confirm-no") {
      closeModal();
    } else if (action === "open-wa") {
      if (lastSuccess && lastSuccess.url) window.open(lastSuccess.url, "_blank", "noopener,noreferrer");
    } else if (action === "copy-message") {
      if (lastSuccess && lastSuccess.message) {
        WA.copyMessage(lastSuccess.message).then(ok => {
          toast(ok ? "Pesan pesanan disalin." : "Gagal menyalin. Coba lagi.");
        });
      }
    } else if (action === "order-again") {
      orderAgain();
    }
  }

  function handleBrandClick(brandId) {
    if (!brandId) return;
    const proceed = () => {
      STORE.setBrand(brandId);
      STORE.navigate("outlet");
    };
    if (CART.hasItemsFromOtherBrand(brandId)) {
      showConfirm({
        title: "Mulai pesanan baru?",
        message: "Keranjangmu berisi menu dari brand lain. Jika lanjut, keranjang akan dikosongkan.",
        confirmLabel: "Ya, mulai baru",
        cancelLabel: "Batal",
        onConfirm: () => {
          CART.clear();
          proceed();
        }
      });
    } else {
      proceed();
    }
  }

  function handleItemClick(el) {
    const itemId = el.dataset.itemId;
    const brandId = el.dataset.brandId || STORE.state.selectedBrandId;
    if (!itemId || !brandId) return;

    if (brandId !== STORE.state.selectedBrandId) {
      if (CART.hasItemsFromOtherBrand(brandId)) {
        showConfirm({
          title: "Ganti brand?",
          message: "Keranjangmu berisi menu dari brand lain. Jika lanjut, keranjang akan dikosongkan.",
          confirmLabel: "Ya, ganti brand",
          cancelLabel: "Batal",
          onConfirm: () => {
            CART.clear();
            STORE.setBrand(brandId);
            STORE.navigate("outlet");
          }
        });
      } else {
        STORE.setBrand(brandId);
        STORE.navigate("outlet");
        toast("Pilih outlet dulu, lalu buka menu.");
      }
      return;
    }

    if (!STORE.state.selectedOutletId) {
      STORE.navigate("outlet");
      toast("Pilih outlet dulu untuk mulai pesan.");
      return;
    }

    const brand = STORE.getBrand(brandId);
    const item = STORE.getItem(brandId, itemId);
    if (!brand || !item) return;

    CUSTOMIZER.open(item, brand, () => {
      if (STORE.getRoute() === "menu") renderBottomBar("menu");
      const cartBtn = $(".cart-btn");
      if (cartBtn) {
        cartBtn.classList.remove("is-bump");
        void cartBtn.offsetWidth;
        cartBtn.classList.add("is-bump");
      }
      if (navigator.vibrate) {
        try { navigator.vibrate(12); } catch (e) { /* ignore */ }
      }
    });
  }

  function handleInput(event) {
    const target = event.target;
    const id = target.id;

    if (id === "outlet-search") {
      STORE.state.outletQuery = target.value;
      debouncedOutletList();
      return;
    }

    if (id === "menu-search") {
      STORE.state.searchQuery = target.value;
      debouncedMenuGrid();
      return;
    }

    if (id === "customer-name") {
      STORE.updateCustomer({ name: target.value });
      clearFieldError(target, "error-name");
      return;
    }

    if (id === "customer-phone") {
      STORE.updateCustomer({ phone: target.value });
      clearFieldError(target, "error-phone");
      return;
    }

    if (id === "pickup-time") {
      STORE.updateCustomer({ pickupTime: target.value });
      return;
    }

    if (id === "delivery-address") {
      STORE.updateCustomer({ address: target.value });
      clearFieldError(target, "error-address");
      return;
    }

    if (id === "order-notes") {
      STORE.updateCustomer({ notes: target.value });
    }
  }

  function handleChange(event) {
    if (event.target.id === "menu-sort") {
      STORE.state.sort = event.target.value;
      renderMenuGrid();
    }
  }

  function handleKeydown(event) {
    const modalRoot = $("#modal-root");
    const modalOpen = modalRoot && modalRoot.children.length > 0;
    if (!modalOpen) return;

    if (event.key === "Escape") {
      closeModal();
      return;
    }

    if (event.key !== "Tab") return;

    const focusables = Array.from(
      modalRoot.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])")
    ).filter(el => !el.disabled && el.offsetParent !== null);
    if (!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (!modalRoot.contains(document.activeElement)) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  /* ============================================================
     CHECKOUT & VALIDATION
     ============================================================ */

  function clearFieldError(input, errorId) {
    if (!input) return;
    input.classList.remove("has-error");
    input.removeAttribute("aria-invalid");
    const error = document.getElementById(errorId);
    if (error) error.textContent = "";
  }

  function validateCheckout() {
    const customer = STORE.state.customer;
    const errors = {};

    if (!customer.name || customer.name.trim().length < 2) {
      errors.name = "Nama minimal 2 karakter.";
    }
    if (!U.isValidPhone(customer.phone)) {
      errors.phone = "Masukkan nomor WhatsApp yang valid (10–15 digit).";
    }
    if (STORE.state.orderMode === "delivery" && (!customer.address || customer.address.trim().length < 8)) {
      errors.address = "Alamat pengantaran wajib diisi minimal 8 karakter.";
    }

    return errors;
  }

  function showFormErrors(errors) {
    const map = {
      name: { input: $("#customer-name"), error: $("#error-name") },
      phone: { input: $("#customer-phone"), error: $("#error-phone") },
      address: { input: $("#delivery-address"), error: $("#error-address") }
    };

    Object.keys(map).forEach(key => {
      const entry = map[key];
      if (!entry.input) return;
      const message = errors[key] || "";
      entry.input.classList.toggle("has-error", !!message);
      if (message) entry.input.setAttribute("aria-invalid", "true");
      else entry.input.removeAttribute("aria-invalid");
      if (entry.error) entry.error.textContent = message;
    });

    const firstKey = Object.keys(errors)[0];
    if (firstKey && map[firstKey] && map[firstKey].input) {
      map[firstKey].input.focus({ preventScroll: true });
      map[firstKey].input.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function submitOrder() {
    const summary = CART.getSummary();
    const brand = STORE.getBrand();
    const outlet = STORE.getOutlet();

    if (!summary.totalItems) {
      toast("Keranjang masih kosong.");
      STORE.navigate("cart");
      return;
    }

    if (!brand || !outlet) {
      toast("Lengkapi pilihan brand dan outlet dulu.");
      STORE.navigate("brand");
      return;
    }

    const errors = validateCheckout();
    if (Object.keys(errors).length) {
      showFormErrors(errors);
      toast("Lengkapi data pemesan terlebih dahulu.", "error");
      return;
    }

    const customer = {
      name: STORE.state.customer.name.trim(),
      phone: STORE.state.customer.phone.trim(),
      pickupTime: STORE.state.customer.pickupTime.trim() || "Secepatnya",
      address: STORE.state.customer.address.trim(),
      notes: STORE.state.customer.notes.trim()
    };

    const orderId = WA.createOrderId();
    const message = WA.buildMessage({
      orderId,
      customer,
      brand,
      outlet,
      orderMode: STORE.state.orderMode,
      cartSummary: summary,
      notes: customer.notes
    });

    const result = WA.openWhatsApp(message);
    const order = {
      orderId,
      date: new Date().toISOString(),
      brandId: brand.id,
      brandName: brand.name,
      outletId: outlet.id,
      outletName: outlet.name,
      outletAddress: outlet.address,
      total: summary.grandTotal,
      itemsCount: summary.totalItems,
      items: summary.items.map(item => ({
        id: item.id,
        brandId: item.brandId,
        brandName: item.brandName,
        name: item.name,
        image: item.image,
        type: item.type,
        selections: item.selections,
        notes: item.notes,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unitOriginalPrice: item.unitOriginalPrice
      })),
      mode: STORE.state.orderMode,
      message,
      url: result.url,
      blocked: result.blocked
    };

    WA.saveOrder(order);
    lastSuccess = order;
    CART.clear();
    showSuccessModal(order);
    STORE.navigate("brand", true);
    renderRoute();
  }

  function orderAgain() {
    const order = lastSuccess || WA.getLastOrder();
    if (!order) {
      closeModal();
      STORE.navigate("brand");
      return;
    }
    const brand = STORE.getBrand(order.brandId);
    const outlet = STORE.getOutlet(order.outletId);
    closeModal();
    if (brand) {
      STORE.setBrand(brand.id);
      if (outlet) STORE.setOutlet(outlet.id);
      if (Array.isArray(order.items) && order.items.length) {
        CART.clear();
        order.items.forEach(item => CART.addItem(Object.assign({}, item)));
        toast(`${order.itemsCount || order.items.length} item dari pesanan terakhir dimasukkan lagi.`);
      }
      if (outlet) {
        STORE.navigate("menu");
      } else {
        STORE.navigate("outlet");
      }
    } else {
      STORE.navigate("brand");
    }
  }

  /* ============================================================
     MODALS & TOAST
     ============================================================ */

  function showSuccessModal(order) {
    const modalRoot = $("#modal-root");
    if (!modalRoot) return;
    modalLastFocus = document.activeElement;
    modalRoot.innerHTML = `
      <div class="modal-overlay" data-modal-overlay>
        <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="success-title">
          <button type="button" class="modal-close" data-action="close-modal" aria-label="Tutup">${ICON.icon("x", "w-4 h-4", 2.4)}</button>
          <div class="success-icon">${ICON.icon("circle-check", "w-7 h-7", 2.2)}</div>
          <h2 id="success-title" class="modal-title">Pesanan siap dikirim</h2>
          <p class="modal-text">Pesananmu sudah disusun rapi. Jika WhatsApp belum terbuka otomatis, gunakan tombol di bawah.</p>

          <div class="success-summary">
            <div class="success-row"><span>Kode pesanan</span><strong>#${U.esc(order.orderId)}</strong></div>
            <div class="success-row"><span>Outlet</span><strong>${U.esc(order.outletName)}</strong></div>
            <div class="success-row"><span>Total</span><strong>${U.rp(order.total)}</strong></div>
          </div>

          <button type="button" class="btn-wa btn-full" data-action="open-wa">
            ${ICON.brand("whatsapp", "w-4 h-4")} Buka WhatsApp
          </button>
          <button type="button" class="btn-soft btn-full" data-action="copy-message">
            ${ICON.icon("copy", "w-4 h-4", 2)} Salin Pesan
          </button>
          <button type="button" class="btn-ghost btn-full" data-action="order-again">Pesan lagi</button>
        </div>
      </div>
    `;
    document.body.classList.add("modal-open");
    setTimeout(() => {
      const btn = modalRoot.querySelector("[data-action='open-wa']");
      if (btn) btn.focus({ preventScroll: true });
    }, 80);
  }

  function showConfirm({ title, message, confirmLabel, cancelLabel, onConfirm }) {
    const modalRoot = $("#modal-root");
    if (!modalRoot) return;
    modalLastFocus = document.activeElement;
    confirmCallback = onConfirm;
    modalRoot.innerHTML = `
      <div class="modal-overlay" data-modal-overlay>
        <div class="modal-card modal-card-sm" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <div class="confirm-icon">${ICON.icon("circle-alert", "w-6 h-6", 2.2)}</div>
          <h2 id="confirm-title" class="modal-title">${U.esc(title)}</h2>
          <p class="modal-text">${U.esc(message)}</p>
          <div class="modal-actions">
            <button type="button" class="btn-soft" data-action="confirm-no">${U.esc(cancelLabel || "Batal")}</button>
            <button type="button" class="btn-primary" data-action="confirm-yes">${U.esc(confirmLabel || "Lanjut")}</button>
          </div>
        </div>
      </div>
    `;
    document.body.classList.add("modal-open");
    setTimeout(() => {
      const btn = modalRoot.querySelector("[data-action='confirm-no']");
      if (btn) btn.focus({ preventScroll: true });
    }, 80);
  }

  function closeModal() {
    const modalRoot = $("#modal-root");
    if (modalRoot) modalRoot.innerHTML = "";
    document.body.classList.remove("modal-open");
    confirmCallback = null;

    const target = modalLastFocus;
    modalLastFocus = null;
    if (target && typeof target.focus === "function" && document.contains(target)) {
      target.focus({ preventScroll: true });
    } else {
      const mainEl = $("#app-main");
      if (mainEl) mainEl.focus({ preventScroll: true });
    }
  }

  function toast(message, type) {
    const root = $("#toast-root");
    if (!root) return;
    const isError = type === "error";
    root.innerHTML = `
      <div class="toast ${isError ? "is-error" : ""}" role="${isError ? "alert" : "status"}">
        ${ICON.icon(isError ? "circle-alert" : "circle-check", "w-4 h-4", 2.4)}
        <span>${U.esc(message)}</span>
      </div>
    `;
    const toastEl = root.querySelector(".toast");
    requestAnimationFrame(() => {
      if (toastEl) toastEl.classList.add("is-visible");
    });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      if (toastEl) toastEl.classList.remove("is-visible");
    }, 2800);
  }

  /* ============================================================
     PUBLIC API & BOOT
     ============================================================ */

  window.DLM_APP = {
    toast,
    renderRoute,
    renderMenuGrid,
    renderOutletList
  };

  document.addEventListener("DOMContentLoaded", init);
})();
