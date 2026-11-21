/* ============================================================
   DIBELIIN LEBIH MURAH — APP CONTROLLER (V4 OFFICIAL SUPER-UX)
   1. Intro Promo Story Splash Showcase (#splash-root)
   2. Smart Auto-Hide Header on Scroll Down / Reveal on Scroll Up
   3. Organic Curved Wave Hero & Physics-Spring Ad Carousel (#/outlet)
   4. Modern Pickup vs Delivery Dual-Method Selector Card
   5. 4 Distinct Brand Menu UI Personalities (Fore, Tomoro, Kenangan, Janji Jiwa)
   6. Balanced Floating Dock Bottom Action Bar (Cart & Checkout)
   7. Per-Customer Isolated Transaction History (#/history) + Modern Order Tracker
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

  // Smart scroll direction state
  let lastScrollY = 0;

  // Physics-spring promo carousel state (#/outlet)
  let promoSlideIndex = 0;
  let promoInterval = null;
  let touchStartX = 0;

  // Intro promo story splash state (#splash-root)
  let splashIndex = 0;
  let splashInterval = null;

  // Brand menu ad banner state (#/menu)
  let brandAdIndex = 0;
  let brandAdInterval = null;

  // Live merged history cache for current customer device
  let customerHistoryCache = null;

  const debouncedOutletList = U.debounce(() => {
    if (STORE.getRoute() === "outlet") renderOutletList();
  }, 140);

  const debouncedMenuGrid = U.debounce(() => {
    if (STORE.getRoute() === "menu") renderMenuGrid();
  }, 140);

  /* ============================================================
     ROUTER, SMART SCROLL HEADER & SHELL
     ============================================================ */

  function init() {
    renderRoute();
    maybeShowIntroSplash();

    window.addEventListener("hashchange", renderRoute);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    CART.subscribe(summary => {
      updateCartBadge(summary);
      renderBottomBar(STORE.getRoute());
      renderBottomNav(STORE.getRoute());
    });

    document.addEventListener("click", handleClick);
    document.addEventListener("input", handleInput);
    document.addEventListener("change", handleChange);
    document.addEventListener("keydown", handleKeydown);

    if (window.DLM_SUPABASE && typeof window.DLM_SUPABASE.syncCatalog === "function") {
      window.DLM_SUPABASE.syncCatalog().then(res => {
        if (res && res.ok) {
          const r = STORE.getRoute();
          if (r === "outlet" || r === "menu") {
            renderRoute();
          }
        }
      });
    }
  }

  function handleScroll() {
    const topBar = $(".app-top");
    if (!topBar) return;

    const currentY = Math.max(0, window.scrollY || window.pageYOffset || 0);
    const delta = currentY - lastScrollY;

    topBar.classList.toggle("is-scrolled", currentY > 8);

    if (currentY < 32) {
      topBar.classList.remove("is-hidden-up");
    } else if (delta > 9 && currentY > 72) {
      // Scrolling down -> hide header smoothly
      topBar.classList.add("is-hidden-up");
    } else if (delta < -7) {
      // Scrolling up -> reveal header immediately
      topBar.classList.remove("is-hidden-up");
    }

    lastScrollY = currentY;
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
      }, { threshold: 0.05, rootMargin: "0px 0px -3% 0px" });
    }
    elements.forEach((el, index) => {
      if (el.classList.contains("is-in")) return;
      if (!el.style.getPropertyValue("--reveal-delay")) {
        el.style.setProperty("--reveal-delay", `${Math.min(index, 8) * 30}ms`);
      }
      revealObserver.observe(el);
    });
  }

  function renderRoute() {
    const route = STORE.getRoute();

    if (!STORE.canEnter(route)) {
      STORE.navigate("outlet", true);
      return renderRoute();
    }

    if (route === "checkout" && CART.getSummary().totalItems === 0) {
      STORE.navigate("cart", true);
      return renderRoute();
    }

    stopPromoCarousel();
    stopBrandAdCarousel();

    const topBar = $(".app-top");
    if (topBar) topBar.classList.remove("is-hidden-up");

    renderHeader(route);
    renderProgress(route);

    if (route === "outlet") {
      renderOutletStep();
      startPromoCarousel();
    } else if (route === "menu") {
      renderMenuStep();
      startBrandAdCarousel();
    } else if (route === "cart") {
      renderCartStep();
    } else if (route === "checkout") {
      renderCheckoutStep();
    } else if (route === "history") {
      renderHistoryStep();
    }

    renderBottomBar(route);
    renderBottomNav(route);
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
    const brand = STORE.getBrand();
    const outlet = STORE.getOutlet();

    let eyebrow = `${CFG.city} • Jasa Order Kopi Resmi`;
    let title = "Dibeliin Lebih Murah";
    let showBack = false;

    if (route === "menu") {
      eyebrow = brand ? `${brand.name} • ${brand.promoBadge}` : "Katalog Menu";
      title = outlet ? outlet.name : "Pilih Menu";
    } else if (route === "cart") {
      eyebrow = "Ringkasan Pesanan";
      title = "Keranjang Saya";
    } else if (route === "checkout") {
      eyebrow = "Langkah Terakhir";
      title = "Data Pemesan";
      showBack = true;
    } else if (route === "history") {
      eyebrow = "Cache Pelanggan Tersinkron";
      title = "Riwayat Transaksi";
    }

    const left = showBack
      ? `<button type="button" class="icon-btn header-back" data-action="back" aria-label="Kembali">${ICON.icon("chevron-left", "w-5 h-5", 2.4)}</button>`
      : `<div class="logo-mark" aria-hidden="true">${ICON.icon("coffee", "w-5 h-5", 2)}</div>`;

    header.innerHTML = `
      <div class="header-left">
        ${left}
        <div class="header-copy">
          <span class="header-eyebrow">${U.esc(eyebrow)}</span>
          <h1 class="header-title">${U.esc(title)}</h1>
        </div>
      </div>
      <div class="header-actions">
        <button type="button" class="track-btn" data-action="open-tracker" aria-label="Lacak status pesanan">
          ${ICON.icon("package", "w-4 h-4", 2)}
          <span>Lacak</span>
        </button>
        <button type="button" class="cart-btn" data-action="go-cart" aria-label="Buka keranjang">
          ${ICON.icon("shopping-bag", "w-5 h-5", 2)}
          <span class="cart-badge is-hidden" id="cart-badge">0</span>
        </button>
      </div>
    `;
  }

  function renderProgress() {
    const progress = $("#step-progress");
    if (!progress) return;
    progress.innerHTML = "";
    progress.classList.add("is-hidden");
  }

  function renderBottomNav(route) {
    const nav = $("#bottom-nav");
    if (!nav) return;
    const summary = CART.getSummary();
    const activeTab = route === "checkout" ? "cart" : route;
    const tabs = CFG.navTabs || [
      { key: "outlet", label: "Outlet", icon: "store" },
      { key: "menu", label: "Menu", icon: "cup-soda" },
      { key: "cart", label: "Keranjang", icon: "shopping-bag" },
      { key: "history", label: "Riwayat", icon: "receipt" }
    ];

    nav.innerHTML = tabs.map(tab => {
      const isActive = activeTab === tab.key;
      const badge = tab.key === "cart" && summary.totalItems > 0
        ? `<span class="bottom-nav-badge">${summary.totalItems}</span>`
        : "";
      return `
        <button type="button" class="bottom-nav-item ${isActive ? "is-active" : ""}" data-action="nav-tab" data-tab="${U.esc(tab.key)}" aria-current="${isActive ? "page" : "false"}">
          <span class="bottom-nav-icon">
            ${ICON.icon(tab.icon, "w-5 h-5", isActive ? 2.3 : 1.9)}
            ${badge}
          </span>
          <span>${U.esc(tab.label)}</span>
        </button>
      `;
    }).join("");
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
            <span class="bottom-cart-copy">
              <small>${summary.totalSavings > 0 ? `Hemat ${U.rp(summary.totalSavings)}` : "Total pesanan"}</small>
              <strong>${U.rp(summary.subtotal)}</strong>
            </span>
          </button>
          <button type="button" class="btn-primary btn-bottom" data-action="go-cart">
            Lihat Keranjang ${ICON.icon("arrow-right", "w-4 h-4", 2.4)}
          </button>
        </div>
      `;
    } else if (route === "cart" && summary.totalItems > 0) {
      html = `
        <div class="bottom-bar-inner">
          <div class="bottom-total">
            <small>Total Pembayaran ${summary.totalSavings > 0 ? `<span class="bottom-total-save">Hemat ${U.rp(summary.totalSavings)}</span>` : ""}</small>
            <strong>${U.rp(summary.grandTotal)}</strong>
          </div>
          <button type="button" class="btn-primary btn-bottom" data-action="go-checkout">
            Lanjut Isi Data ${ICON.icon("arrow-right", "w-4 h-4", 2.4)}
          </button>
        </div>
      `;
    } else if (route === "checkout" && summary.totalItems > 0) {
      html = `
        <div class="bottom-bar-inner">
          <div class="bottom-total">
            <small>Total Akhir (${summary.totalItems} Cup)</small>
            <strong>${U.rp(summary.grandTotal)}</strong>
          </div>
          <button type="button" class="btn-wa btn-bottom" data-action="submit-order">
            ${ICON.brand("whatsapp", "w-4 h-4")} Kirim Pesanan WA
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

  function getLockedBrandLogo(brand) {
    if (!brand) return "src/assets/brands/tomoro-official.webp";
    return (CFG.lockedBrandLogos && CFG.lockedBrandLogos[brand.id]) || brand.logo || `src/assets/brands/${brand.id}.svg`;
  }

  /* ============================================================
     1. INTRO PROMO STORY SPLASH SHOWCASE (#splash-root)
     ============================================================ */

  function getSplashPromos() {
    return Array.isArray(CFG.splashPromos) && CFG.splashPromos.length ? CFG.splashPromos : [];
  }

  function maybeShowIntroSplash() {
    try {
      const seen = sessionStorage.getItem(CFG.storageKeys.splashSeen);
      if (seen === "1") return;
      sessionStorage.setItem(CFG.storageKeys.splashSeen, "1");
    } catch (e) {
      /* ignore */
    }
    openIntroSplash(0);
  }

  function openIntroSplash(startIndex) {
    const root = $("#splash-root");
    const promos = getSplashPromos();
    if (!root || !promos.length) return;

    stopIntroSplashTimer();
    splashIndex = startIndex || 0;

    root.innerHTML = `
      <div class="splash-overlay" id="splash-overlay" role="dialog" aria-modal="true" aria-label="Highlight Promo Hari Ini">
        <div class="splash-card">
          <div class="splash-progress-row">
            ${promos.map((p, idx) => `
              <span class="splash-prog-seg ${idx < splashIndex ? "is-done" : ""} ${idx === splashIndex ? "is-active" : ""}" data-splash-seg="${idx}">
                <span class="splash-prog-fill"></span>
              </span>
            `).join("")}
          </div>

          <div class="splash-top-bar">
            <div class="splash-brand-pill" id="splash-brand-pill">
              <img src="${U.esc(promos[splashIndex].logo)}" alt="" id="splash-brand-logo" />
              <span id="splash-brand-name">${U.esc(promos[splashIndex].brandName)}</span>
            </div>
            <button type="button" class="splash-skip-btn" data-action="close-splash">
              Lewati ${ICON.icon("x", "w-3.5 h-3.5", 2.4)}
            </button>
          </div>

          <div class="splash-stage">
            ${promos.map((p, idx) => `
              <article class="splash-slide ${idx === splashIndex ? "is-active" : ""}" data-splash-slide="${idx}" style="--splash-accent:${U.esc(p.accent || "#0B6BCB")}">
                <img src="${U.esc(p.image)}" alt="${U.esc(p.title)}" class="splash-slide-bg" loading="${idx === 0 ? "eager" : "lazy"}" />
                <div class="splash-slide-shade"></div>
                <div class="splash-slide-content">
                  ${p.secondaryImage ? `
                    <div class="splash-secondary-banner">
                      <img src="${U.esc(p.secondaryImage)}" alt="${U.esc(p.brandName)}" loading="lazy" />
                    </div>
                  ` : ""}
                  <span class="splash-badge">${ICON.icon("sparkles", "w-3 h-3", 2.2)} ${U.esc(p.badge)}</span>
                  <h2 class="splash-title">${U.esc(p.title)}</h2>
                  <p class="splash-sub">${U.esc(p.subtitle)}</p>
                </div>
              </article>
            `).join("")}
          </div>

          <div class="splash-footer">
            <div class="splash-nav-dots">
              ${promos.map((p, idx) => `
                <button type="button" class="splash-dot ${idx === splashIndex ? "is-active" : ""}" data-action="splash-goto" data-index="${idx}" aria-label="Promo ${idx + 1}"></button>
              `).join("")}
            </div>
            <button type="button" class="btn-primary btn-sm" id="splash-cta-btn" data-action="splash-pick-brand" data-brand-id="${U.esc(promos[splashIndex].brandId)}" style="min-height:40px;padding:0 14px;border-radius:999px">
              Pilih Outlet ${U.esc(promos[splashIndex].brandName)} ${ICON.icon("arrow-right", "w-3.5 h-3.5", 2.4)}
            </button>
          </div>
        </div>
      </div>
    `;

    startIntroSplashTimer();
  }

  function setIntroSplashSlide(nextIndex) {
    const promos = getSplashPromos();
    const overlay = $("#splash-overlay");
    if (!overlay || !promos.length) return;

    if (nextIndex >= promos.length) {
      closeIntroSplash();
      return;
    }

    splashIndex = ((nextIndex % promos.length) + promos.length) % promos.length;
    const current = promos[splashIndex];

    $$("[data-splash-slide]", overlay).forEach((el, idx) => {
      el.classList.toggle("is-active", idx === splashIndex);
    });
    $$("[data-splash-seg]", overlay).forEach((seg, idx) => {
      seg.classList.remove("is-active", "is-done");
      void seg.offsetWidth;
      if (idx < splashIndex) seg.classList.add("is-done");
      else if (idx === splashIndex) seg.classList.add("is-active");
    });
    $$(".splash-dot", overlay).forEach((dot, idx) => {
      dot.classList.toggle("is-active", idx === splashIndex);
    });

    const bLogo = $("#splash-brand-logo");
    const bName = $("#splash-brand-name");
    const ctaBtn = $("#splash-cta-btn");
    if (bLogo) bLogo.src = current.logo;
    if (bName) bName.textContent = current.brandName;
    if (ctaBtn) {
      ctaBtn.dataset.brandId = current.brandId;
      ctaBtn.innerHTML = `Pilih Outlet ${U.esc(current.brandName)} ${ICON.icon("arrow-right", "w-3.5 h-3.5", 2.4)}`;
    }
  }

  function startIntroSplashTimer() {
    stopIntroSplashTimer();
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    splashInterval = setInterval(() => {
      setIntroSplashSlide(splashIndex + 1);
    }, 3400);
  }

  function stopIntroSplashTimer() {
    if (splashInterval) {
      clearInterval(splashInterval);
      splashInterval = null;
    }
  }

  function closeIntroSplash() {
    stopIntroSplashTimer();
    const overlay = $("#splash-overlay");
    if (!overlay) return;
    overlay.classList.add("is-closing");
    setTimeout(() => {
      const root = $("#splash-root");
      if (root) root.innerHTML = "";
    }, 400);
  }

  /* ============================================================
     2. PHYSICS-SPRING PROMO CAROUSEL (#/outlet & #/menu)
     ============================================================ */

  function getPromoSlides() {
    return Array.isArray(CFG.promoSlides) && CFG.promoSlides.length ? CFG.promoSlides : [];
  }

  function startPromoCarousel() {
    stopPromoCarousel();
    const slides = getPromoSlides();
    if (slides.length <= 1) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    promoInterval = setInterval(() => {
      if (STORE.getRoute() !== "outlet") {
        stopPromoCarousel();
        return;
      }
      setPromoSlide((promoSlideIndex + 1) % slides.length);
    }, 4000);
  }

  function stopPromoCarousel() {
    if (promoInterval) {
      clearInterval(promoInterval);
      promoInterval = null;
    }
  }

  function setPromoSlide(index) {
    const slides = getPromoSlides();
    if (!slides.length) return;
    promoSlideIndex = ((index % slides.length) + slides.length) % slides.length;

    const track = $("#ad-showcase-track");
    if (track) {
      track.style.transform = `translate3d(-${promoSlideIndex * 100}%, 0, 0)`;
    }
    $$(".ad-showcase-slide").forEach((el, idx) => {
      el.classList.toggle("is-active", idx === promoSlideIndex);
    });
    $$(".promo-dot").forEach((dot, idx) => {
      dot.classList.toggle("is-active", idx === promoSlideIndex);
    });
  }

  function startBrandAdCarousel() {
    stopBrandAdCarousel();
    const brand = STORE.getBrand();
    if (!brand || !Array.isArray(brand.ads) || brand.ads.length <= 1) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    brandAdInterval = setInterval(() => {
      if (STORE.getRoute() !== "menu") {
        stopBrandAdCarousel();
        return;
      }
      const ads = (STORE.getBrand() && STORE.getBrand().ads) || [];
      const landscapeAds = ads.filter(a => !a.isPortrait);
      const list = landscapeAds.length ? landscapeAds : ads;
      if (list.length <= 1) return;
      brandAdIndex = (brandAdIndex + 1) % list.length;
      const imgEl = $("#brand-menu-ad-img");
      if (imgEl && list[brandAdIndex]) {
        imgEl.src = list[brandAdIndex].image;
      }
    }, 4200);
  }

  function stopBrandAdCarousel() {
    if (brandAdInterval) {
      clearInterval(brandAdInterval);
      brandAdInterval = null;
    }
  }

  /* ============================================================
     TAB 1 — PILIH BRAND & LOKASI OUTLET (#/outlet)
     ============================================================ */

  function renderOutletStep() {
    const main = $("#app-main");
    if (!main) return;

    const selectedBrand = STORE.getBrand();
    const slides = getPromoSlides();
    if (promoSlideIndex >= slides.length) promoSlideIndex = 0;

    const areas = STORE.getBrandAreas(selectedBrand.id);
    const delivery = STORE.state.orderMode === "delivery";

    main.innerHTML = `
      <!-- Organic Curved Wave Hero Stage + Physics-Spring Official Ad Carousel -->
      <section class="outlet-hero-stage reveal" aria-label="Promo & Iklan Kopi Samarinda">
        <span class="outlet-hero-orb orb-1" aria-hidden="true"></span>
        <span class="outlet-hero-orb orb-2" aria-hidden="true"></span>

        <div class="outlet-hero-top">
          <span class="outlet-loc-pill">
            ${ICON.icon("map-pin", "w-3.5 h-3.5", 2.3)} ${U.esc(CFG.city)}, ${U.esc(CFG.region)}
          </span>
          <button type="button" class="outlet-story-btn" data-action="open-splash-stories">
            ${ICON.icon("sparkles", "w-3.5 h-3.5", 2.2)} Lihat Semua Iklan
          </button>
        </div>

        <div class="ad-showcase-carousel" id="ad-showcase-carousel">
          <div class="ad-showcase-viewport">
            <div class="ad-showcase-track" id="ad-showcase-track" style="transform:translate3d(-${promoSlideIndex * 100}%,0,0)">
              ${slides.map((slide, idx) => `
                <article class="ad-showcase-slide ${idx === promoSlideIndex ? "is-active" : ""}" data-action="promo-select-brand" data-brand-id="${U.esc(slide.brandId)}" style="cursor:pointer">
                  <img src="${U.esc(slide.image)}" alt="${U.esc(slide.title)}" class="ad-showcase-img" loading="${idx === 0 ? "eager" : "lazy"}" decoding="async" />
                  <div class="ad-showcase-overlay">
                    <span class="ad-showcase-tag">${U.esc(slide.badge)}</span>
                    <h2 class="ad-showcase-title">${U.esc(slide.title)}</h2>
                    <p class="ad-showcase-sub">${U.esc(slide.subtitle)}</p>
                  </div>
                </article>
              `).join("")}
            </div>
          </div>

          <div class="ad-showcase-bar">
            <div class="promo-dots" role="tablist" aria-label="Slide iklan resmi">
              ${slides.map((slide, idx) => `
                <button type="button" class="promo-dot ${idx === promoSlideIndex ? "is-active" : ""}" data-action="promo-dot" data-index="${idx}" aria-label="Iklan ${idx + 1}: ${U.esc(slide.title)}"></button>
              `).join("")}
            </div>
            <div class="promo-nav-btns">
              <button type="button" class="promo-nav-btn" data-action="promo-prev" aria-label="Iklan sebelumnya">${ICON.icon("chevron-left", "w-3.5 h-3.5", 2.4)}</button>
              <button type="button" class="promo-nav-btn" data-action="promo-next" aria-label="Iklan selanjutnya">${ICON.icon("chevron-right", "w-3.5 h-3.5", 2.4)}</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Modern Pickup vs Delivery Dual-Method Selector Card -->
      <section class="method-hub-card reveal" aria-label="Metode Pesanan">
        <div class="method-hub-switch" role="group" aria-label="Pilih metode pengambilan">
          <button type="button" class="method-option-btn ${delivery ? "" : "is-active"}" data-action="quick-mode" data-mode="pickup" aria-pressed="${delivery ? "false" : "true"}">
            <span class="method-option-icon">${ICON.icon("store", "w-4 h-4", 2.2)}</span>
            <span class="method-option-copy">
              <strong>Pickup Outlet</strong>
              <small>Ambil tanpa antre</small>
            </span>
          </button>
          <button type="button" class="method-option-btn ${delivery ? "is-active" : ""}" data-action="quick-mode" data-mode="delivery" aria-pressed="${delivery ? "true" : "false"}">
            <span class="method-option-icon">${ICON.icon("truck", "w-4 h-4", 2.2)}</span>
            <span class="method-option-copy">
              <strong>Delivery Kurir</strong>
              <small>Kirim ke alamatmu</small>
            </span>
          </button>
        </div>

        <div class="method-info-strip" id="method-info-strip">
          <span class="method-info-left">
            ${ICON.icon(delivery ? "truck" : "clock", "w-4 h-4", 2.2)}
            <span id="service-mode-label">${delivery ? "Dikirim via GoSend / Grab Instant ke titik lokasimu" : "Pesanan disiapkan barista, langsung ambil di kasir outlet"}</span>
          </span>
          <span class="method-info-badge" id="service-mode-badge">${delivery ? "Kurir Instant" : "10–15 Menit"}</span>
        </div>
      </section>

      <!-- Step 1: Pilih Brand Kopi Resmi -->
      <section class="section reveal" id="brand-section" style="margin-top:18px">
        <div class="section-head compact">
          <div>
            <p class="eyebrow">Langkah 1 • Katalog Resmi</p>
            <h2 class="section-title">Pilih Brand Favoritmu</h2>
          </div>
          <span class="section-count">4 Brand • 327 Menu</span>
        </div>
        <div class="brand-selector-grid">
          ${window.DLM_BRANDS.map(brand => brandSelectorCard(brand, brand.id === selectedBrand.id)).join("")}
        </div>
      </section>

      <!-- Step 2: Pilih Lokasi & Nama Outlet Samarinda -->
      <section class="section reveal" id="outlet-section" style="margin-top:18px">
        <div class="section-head compact">
          <div>
            <p class="eyebrow">Langkah 2 • ${U.esc(selectedBrand.name)}</p>
            <h2 class="section-title" id="outlet-section-title">Pilih Lokasi & Nama Outlet</h2>
          </div>
          <span class="section-count" id="outlet-count">${STORE.getBrandOutlets(selectedBrand.id).length} cabang</span>
        </div>

        <div class="search-field">
          ${ICON.icon("search", "w-4 h-4", 2.2)}
          <input type="search" id="outlet-search" class="search-input" placeholder="Cari Big Mall, SCP, Gajah Mada, Juanda..." value="${U.esc(STORE.state.outletQuery)}" autocomplete="off">
        </div>

        <div class="chip-row no-scrollbar" id="outlet-areas">
          ${areas.map(area => `<button type="button" class="chip ${STORE.state.outletArea === area ? "is-active" : ""}" data-area="${U.esc(area)}">${U.esc(area)}</button>`).join("")}
        </div>

        <div class="outlet-list" id="outlet-list"></div>
      </section>

      <footer class="app-footer reveal">
        <div class="footer-brand">${ICON.icon("coffee", "w-4 h-4", 2)} ${CFG.appName}</div>
        <p>Jasa order minuman &amp; makanan resmi • ${CFG.city}, ${CFG.region}</p>
        <div class="footer-links" style="flex-wrap:wrap">
          <button type="button" class="footer-link" data-action="open-splash-stories">
            ${ICON.icon("sparkles", "w-3.5 h-3.5", 2)} Poster Promo
          </button>
          <button type="button" class="footer-link" data-action="nav-tab" data-tab="history">
            ${ICON.icon("receipt", "w-3.5 h-3.5", 2)} Riwayat Saya
          </button>
          <a href="lisensi.html" class="footer-link">
            ${ICON.icon("shield-check", "w-3.5 h-3.5", 2)} Lisensi Aset
          </a>
          <a href="admin.html" class="footer-link">
            ${ICON.icon("layout-dashboard", "w-3.5 h-3.5", 2)} Panel Admin
          </a>
        </div>
      </footer>
    `;

    bindCarouselTouch();
    renderOutletList();
  }

  function bindCarouselTouch() {
    const carousel = $("#ad-showcase-carousel");
    if (!carousel) return;
    carousel.addEventListener("touchstart", (e) => {
      if (e.touches && e.touches[0]) touchStartX = e.touches[0].clientX;
    }, { passive: true });
    carousel.addEventListener("touchend", (e) => {
      if (!e.changedTouches || !e.changedTouches[0]) return;
      const diff = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(diff) > 36) {
        setPromoSlide(diff < 0 ? promoSlideIndex + 1 : promoSlideIndex - 1);
        startPromoCarousel();
      }
    }, { passive: true });
  }

  function brandSelectorCard(brand, isSelected) {
    const outletCount = STORE.getBrandOutlets(brand.id).length;
    const menuCount = (brand.items || []).length;
    const logoUrl = getLockedBrandLogo(brand);
    return `
      <button type="button" class="brand-select-card ${isSelected ? "is-selected" : ""}" data-brand-id="${U.esc(brand.id)}" aria-pressed="${isSelected ? "true" : "false"}" style="--brand-tint:${U.esc(brand.accentSoft || "#eaf3ff")}">
        <span class="brand-select-logo">
          <img src="${U.esc(logoUrl)}" alt="Logo ${U.esc(brand.name)}" loading="lazy" decoding="async" />
        </span>
        <span class="brand-select-info">
          <span class="brand-select-promo" style="background:${U.esc(brand.accentSoft)};color:${U.esc(brand.accent)}">${U.esc(brand.promoBadge)}</span>
          <span class="brand-select-name">${U.esc(brand.name)}</span>
          <span class="brand-select-meta">${outletCount} cabang • ${menuCount} menu</span>
        </span>
        <span class="brand-select-check" aria-hidden="true">${ICON.icon("check", "w-3 h-3", 2.8)}</span>
      </button>
    `;
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
    if (countEl) countEl.textContent = `${outlets.length} cabang`;

    if (!outlets.length) {
      listEl.innerHTML = `
        <div class="empty-state compact">
          <div class="empty-icon">${ICON.icon("map-pin", "w-7 h-7", 1.8)}</div>
          <h3>Outlet tidak ditemukan</h3>
          <p>Coba kata kunci lain atau pilih area Semua Area.</p>
        </div>
      `;
      return;
    }

    const logoUrl = getLockedBrandLogo(brand);

    listEl.innerHTML = outlets.map((outlet, idx) => {
      const isOpen = outlet.isOpen !== false;
      const isSelected = STORE.state.selectedOutletId === outlet.id;
      const isNearest = idx === 0 && !query && STORE.state.outletArea === "Semua Area";
      return `
        <button type="button" class="outlet-card-v2 ${isSelected ? "is-selected" : ""} ${isOpen ? "" : "is-closed"}" data-outlet-id="${U.esc(outlet.id)}" data-outlet-open="${isOpen ? "true" : "false"}" aria-disabled="${isOpen ? "false" : "true"}">
          <div class="outlet-v2-top">
            <span class="distance-pill ${isNearest ? "is-nearest" : ""}">
              ${ICON.icon("map-pin", "w-3 h-3", 2.3)}
              ${U.esc(outlet.distance)}${isNearest ? " • Terdekat" : ""} • ${U.esc(outlet.area)}
            </span>
            ${isOpen
              ? `<span class="open-badge"><span class="open-pulse-dot"></span> Buka</span>`
              : `<span class="closed-badge">${ICON.icon("circle-alert", "w-3 h-3", 2.4)} Tutup</span>`}
          </div>
          <div class="outlet-v2-main">
            <span class="outlet-v2-logo">
              <img src="${U.esc(logoUrl)}" alt="${U.esc(brand.name)}" loading="lazy" decoding="async" />
            </span>
            <div class="outlet-v2-copy">
              <span class="outlet-v2-name">${U.esc(outlet.name)}</span>
              <span class="outlet-v2-address">${U.esc(outlet.address)}</span>
            </div>
            <span class="outlet-arrow">${ICON.icon("chevron-right", "w-4 h-4", 2.4)}</span>
          </div>
          <div class="outlet-v2-foot">
            <span>${ICON.icon("clock", "w-3.5 h-3.5", 2)} ${U.esc(outlet.hours)} • ${(brand.items || []).length} Menu Resmi</span>
            <span class="service-dots">
              <span class="service-dot">Pickup</span>
              <span class="service-dot">Delivery</span>
            </span>
          </div>
        </button>
      `;
    }).join("");
  }

  /* ============================================================
     TAB 2 — MENU PESANAN UNIK SESUAI KARAKTER BRAND (#/menu)
     ============================================================ */

  function renderMenuStep() {
    const main = $("#app-main");
    if (!main) return;

    const brand = STORE.getBrand();
    const outlet = STORE.getOutlet();

    // GUARD: If user hasn't picked an outlet yet, show clear guidance card
    if (!outlet || !brand) {
      main.innerHTML = `
        <section class="outlet-guard-card reveal">
          <div class="outlet-guard-logos">
            ${window.DLM_BRANDS.map(b => `<img src="${U.esc(getLockedBrandLogo(b))}" alt="${U.esc(b.name)}" />`).join("")}
          </div>
          <div>
            <p class="eyebrow">Belum Ada Outlet Terpilih</p>
            <h2 class="section-title" style="margin-top:4px">Pilih Lokasi Outlet Terlebih Dahulu</h2>
            <p style="font-size:12.5px;color:var(--body);margin-top:6px;max-width:34ch">
              Ketersediaan menu dan harga promo mengikuti cabang outlet ${U.esc(CFG.city)} yang kamu pilih.
            </p>
          </div>
          <button type="button" class="btn-primary" data-action="change-outlet">
            ${ICON.icon("store", "w-4 h-4", 2.2)} Pilih Brand &amp; Lokasi Outlet
          </button>
        </section>
      `;
      return;
    }

    const logoUrl = getLockedBrandLogo(brand);
    const priceFilters = [
      { id: "all", label: `Semua (${brand.items.length})` },
      { id: "bestseller", label: "★ Paling Laris" },
      { id: "under15k", label: "≤ Rp 15.000" },
      { id: "disc40", label: "Diskon ≥ 38%" }
    ];

    const brandAds = Array.isArray(brand.ads) ? brand.ads : [];
    const landscapeAds = brandAds.filter(a => !a.isPortrait);
    const activeAds = landscapeAds.length ? landscapeAds : brandAds;
    brandAdIndex = 0;

    main.innerHTML = `
      <div data-brand-theme="${U.esc(brand.id)}">
        <!-- Floating Top Outlet Bar -->
        <section class="top-outlet-pill reveal" style="border-color:${U.esc(brand.accentSoft)}">
          <div class="top-outlet-left">
            <span class="top-outlet-logo">
              <img src="${U.esc(logoUrl)}" alt="${U.esc(brand.name)}" />
            </span>
            <div class="top-outlet-copy">
              <span class="top-outlet-eyebrow" style="color:${U.esc(brand.accent)}">
                ${ICON.icon("map-pin", "w-3 h-3", 2.4)} ${U.esc(brand.name)} • ${STORE.state.orderMode === "delivery" ? "Delivery" : "Pickup"}
              </span>
              <h2 class="top-outlet-name">${U.esc(outlet.name)}</h2>
              <span class="top-outlet-sub">${U.esc(outlet.address)} • ${U.esc(outlet.hours)}</span>
            </div>
          </div>
          <button type="button" class="btn-soft btn-sm" data-action="change-outlet">
            Ganti ${ICON.icon("chevron-down", "w-3.5 h-3.5", 2.4)}
          </button>
        </section>

        <!-- Brand-Specific Official Promo Banner -->
        ${activeAds.length ? `
          <section class="brand-menu-banner reveal" aria-label="Promo ${U.esc(brand.name)}">
            <img src="${U.esc(activeAds[0].image)}" alt="Promo ${U.esc(brand.name)}" id="brand-menu-ad-img" loading="eager" decoding="async" />
          </section>
        ` : ""}

        <section class="menu-section reveal" style="margin-top:12px">
          <div class="search-field">
            ${ICON.icon("search", "w-4 h-4", 2.2)}
            <input type="search" id="menu-search" class="search-input" placeholder="Cari di ${U.esc(brand.name)} (${brand.items.length} menu resmi)..." value="${U.esc(STORE.state.searchQuery)}" autocomplete="off">
          </div>

          <!-- Category Tabs -->
          <div class="chip-row no-scrollbar" id="menu-categories">
            ${brand.categories.map(category => `<button type="button" class="chip ${STORE.state.activeCategory === category ? "is-active" : ""}" data-category="${U.esc(category)}">${U.esc(category)}</button>`).join("")}
          </div>

          <!-- Quick Price / Discount Filter Pills -->
          <div class="price-filter-row no-scrollbar" id="menu-price-filters">
            ${priceFilters.map(pf => `
              <button type="button" class="filter-pill ${STORE.state.priceFilter === pf.id ? "is-active" : ""}" data-price-filter="${U.esc(pf.id)}">
                ${U.esc(pf.label)}
              </button>
            `).join("")}
          </div>

          <div id="menu-results"></div>

          <div class="note-card" style="margin-top:16px">
            ${ICON.icon("info", "w-4 h-4", 2)}
            <p>Harga promo ${U.esc(brand.name)} sudah bersih termasuk biaya jasa. Ketuk menu untuk memilih suhu, ukuran cup, gula, es, dan topping.</p>
          </div>
        </section>
      </div>
    `;

    renderMenuGrid();
  }

  function sortItems(items, sort) {
    const list = items.slice();
    if (sort === "cheapest") {
      list.sort((a, b) => a.priceDiscount - b.priceDiscount);
    } else if (sort === "discount") {
      list.sort((a, b) => {
        const da = (a.priceOriginal - a.priceDiscount) / a.priceOriginal;
        const db = (b.priceOriginal - b.priceDiscount) / b.priceOriginal;
        return db - da;
      });
    }
    return list;
  }

  function renderMenuGrid() {
    const results = $("#menu-results");
    const brand = STORE.getBrand();
    if (!results || !brand) return;

    const query = (STORE.state.searchQuery || "").trim().toLowerCase();
    const pFilter = STORE.state.priceFilter || "all";
    let items = brand.items.slice();

    if (STORE.state.activeCategory && STORE.state.activeCategory !== "Semua") {
      items = items.filter(item => item.category === STORE.state.activeCategory);
    }

    if (pFilter === "bestseller") {
      items = items.filter(item => item.isBestSeller);
    } else if (pFilter === "under15k") {
      items = items.filter(item => item.priceDiscount <= 15000);
    } else if (pFilter === "disc40") {
      items = items.filter(item => {
        const disc = Math.round(((item.priceOriginal - item.priceDiscount) / item.priceOriginal) * 100);
        return disc >= 38;
      });
    }

    if (query) {
      items = items.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );
    }

    items = sortItems(items, STORE.state.sort);

    if (!items.length) {
      results.innerHTML = `
        <div class="empty-state" style="margin-top:14px">
          <div class="empty-icon">${ICON.icon("coffee", "w-8 h-8", 1.8)}</div>
          <h3>Menu tidak ditemukan</h3>
          <p>Coba reset filter harga atau pilih kategori Semua.</p>
          <button type="button" class="btn-soft" data-action="reset-menu-filter">Tampilkan Semua Menu</button>
        </div>
      `;
      return;
    }

    const showMustTry = STORE.state.activeCategory === "Semua" && pFilter === "all" && !query;
    const mustTryItems = brand.items.filter(item => item.isBestSeller).slice(0, 6);

    const groups = [];
    const groupMap = {};
    items.forEach(item => {
      const cat = item.category || "Signature";
      if (!groupMap[cat]) {
        groupMap[cat] = [];
        groups.push({ category: cat, list: groupMap[cat] });
      }
      groupMap[cat].push(item);
    });

    const showcaseLabel = brand.id === "fore"
      ? "Must Try! • Fore Favorites"
      : (brand.id === "tomoro"
        ? "Tomoro Highlights • Mont Blanc & S.O.E."
        : (brand.id === "kenangan"
          ? "Baru & Favorit • Purple Cloud & Mantan"
          : "Janji Jiwa Specials • Borneo & Toast"));

    results.innerHTML = `
      ${showMustTry && mustTryItems.length ? `
        <section class="menu-category-group">
          <div class="menu-category-header">
            <h3>${U.esc(showcaseLabel)}</h3>
            <span>${mustTryItems.length} menu unggulan</span>
          </div>
          <div class="must-try-grid">
            ${mustTryItems.map(item => mustTryCard(brand, item)).join("")}
          </div>
        </section>
      ` : ""}

      ${groups.map(group => `
        <section class="menu-category-group">
          <div class="menu-category-header">
            <h3>${U.esc(group.category)}</h3>
            <span>${group.list.length} menu</span>
          </div>
          <div class="menu-rows-list">
            ${group.list.map(item => menuRowCard(brand, item)).join("")}
          </div>
        </section>
      `).join("")}
    `;

    setupReveal();
  }

  function brandMediaDecoration() {
    return "";
  }

  function mustTryCard(brand, item) {
    const discount = Math.round(((item.priceOriginal - item.priceDiscount) / item.priceOriginal) * 100);
    return `
      <button type="button" class="must-try-card reveal" data-item-id="${U.esc(item.id)}">
        <span class="must-try-media">
          ${U.imageTag(item.image, item.name, "product-img")}
          <span class="menu-row-badge">-${discount}%</span>
          ${brandMediaDecoration(brand, item)}
        </span>
        <span class="must-try-title">${U.esc(item.name)}</span>
        <span class="must-try-foot">
          <span class="must-try-price">
            <strong>${U.rp(item.priceDiscount)}</strong>
            <s>${U.rp(item.priceOriginal)}</s>
          </span>
          <span class="circle-add-btn" aria-hidden="true">${ICON.icon("plus", "w-4 h-4", 2.6)}</span>
        </span>
      </button>
    `;
  }

  function menuRowCard(brand, item) {
    const discount = Math.round(((item.priceOriginal - item.priceDiscount) / item.priceOriginal) * 100);
    const savingAmount = Math.max(0, item.priceOriginal - item.priceDiscount);
    const watermark = brand.id === "tomoro"
      ? `<span class="tomoro-watermark" aria-hidden="true">${U.esc(item.category.split(" ")[0])}</span>`
      : "";

    return `
      <button type="button" class="menu-row-card reveal" data-item-id="${U.esc(item.id)}">
        ${watermark}
        <span class="menu-row-media">
          ${U.imageTag(item.image, item.name, "product-img")}
          <span class="menu-row-badge">-${discount}%</span>
          ${brandMediaDecoration(brand, item)}
        </span>
        <span class="menu-row-body">
          <span class="menu-row-top">
            ${item.isBestSeller ? `<span class="menu-row-best">★ Best Seller</span>` : ""}
            ${savingAmount > 0 ? `<span class="menu-row-save">Hemat ${U.rp(savingAmount)}</span>` : ""}
          </span>
          <span class="menu-row-name">${U.esc(item.name)}</span>
          <span class="menu-row-desc">${U.esc(item.description)}</span>
          <span class="menu-row-foot">
            <span class="menu-row-price">
              <strong>${U.rp(item.priceDiscount)}</strong>
              <s>${U.rp(item.priceOriginal)}</s>
            </span>
            <span class="circle-add-btn" aria-hidden="true">${ICON.icon("plus", "w-4 h-4", 2.6)}</span>
          </span>
        </span>
      </button>
    `;
  }

  /* ============================================================
     TAB 3 — KERANJANG (#/cart)
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
          <p>Pilih lokasi outlet dan menu kopi favoritmu dulu, lalu atur varian sesukamu.</p>
          <button type="button" class="btn-primary" data-action="go-menu">
            ${ICON.icon("cup-soda", "w-4 h-4", 2.2)} Lihat Menu Sekarang
          </button>
        </section>
      `;
      return;
    }

    main.innerHTML = `
      ${brand && outlet ? `
        <section class="top-outlet-pill reveal">
          <div class="top-outlet-left">
            <span class="top-outlet-logo">
              <img src="${U.esc(getLockedBrandLogo(brand))}" alt="${U.esc(brand.name)}" />
            </span>
            <div class="top-outlet-copy">
              <span class="top-outlet-eyebrow">Pesanan Untuk</span>
              <h2 class="top-outlet-name">${U.esc(outlet.name)}</h2>
              <span class="top-outlet-sub">${U.esc(brand.name)} • ${U.esc(outlet.area)}</span>
            </div>
          </div>
          <button type="button" class="btn-soft btn-sm" data-action="change-outlet">Ubah</button>
        </section>
      ` : ""}

      <section class="section reveal" style="margin-top:14px">
        <div class="section-head compact">
          <div>
            <p class="eyebrow">Daftar Cup</p>
            <h2 class="section-title">Rincian Pesananmu</h2>
          </div>
          <span class="section-count">${summary.totalItems} item</span>
        </div>
        <div class="cart-list">
          ${summary.items.map(item => cartItemMarkup(item)).join("")}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">
          <button type="button" class="btn-soft" data-action="go-menu">
            ${ICON.icon("plus", "w-4 h-4", 2.4)} Tambah Menu
          </button>
          <button type="button" class="btn-soft" data-action="copy-patungan">
            ${ICON.icon("copy", "w-4 h-4", 2.2)} Salin Patungan
          </button>
        </div>
      </section>

      ${summary.totalSavings > 0 ? `
        <div class="savings-delight-banner reveal">
          <img src="src/assets/icons/lineal-color/discount-tag.svg" alt="" loading="lazy" decoding="async" />
          <div>
            <strong>Hore! Kamu hemat ${U.rp(summary.totalSavings)}</strong>
            <span>Jauh lebih hemat dibanding harga normal langsung di aplikasi/outlet.</span>
          </div>
        </div>
      ` : ""}

      <section class="summary-card reveal">
        <div class="summary-row"><span>Subtotal Menu Promo</span><strong>${U.rp(summary.subtotal)}</strong></div>
        ${summary.orderServiceFee > 0 ? `<div class="summary-row"><span>Biaya jasa order</span><strong>${U.rp(summary.orderServiceFee)}</strong></div>` : ""}
        ${summary.totalSavings > 0 ? `<div class="summary-row is-success"><span>Total Hemat Promo</span><strong>-${U.rp(summary.totalSavings)}</strong></div>` : ""}
        <div class="summary-note">${ICON.icon("info", "w-3.5 h-3.5", 2)} ${summary.orderServiceFee > 0 ? "Biaya jasa order sudah termasuk di total akhir." : "Harga sudah bersih termasuk biaya jasa admin."}</div>
        <div class="summary-total"><span>Total Bayar</span><strong>${U.rp(summary.grandTotal)}</strong></div>
      </section>
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
     STEP CHECKOUT (#/checkout)
     ============================================================ */

  function renderCheckoutStep() {
    const main = $("#app-main");
    if (!main) return;
    const summary = CART.getSummary();
    const brand = STORE.getBrand();
    const outlet = STORE.getOutlet();
    if (!brand || !outlet) {
      STORE.navigate("outlet", true);
      return;
    }
    const customer = STORE.state.customer;
    const delivery = STORE.state.orderMode === "delivery";

    main.innerHTML = `
      <section class="top-outlet-pill reveal">
        <div class="top-outlet-left">
          <span class="top-outlet-logo">
            <img src="${U.esc(getLockedBrandLogo(brand))}" alt="${U.esc(brand.name)}" />
          </span>
          <div class="top-outlet-copy">
            <span class="top-outlet-eyebrow">Pesanan Untuk</span>
            <h2 class="top-outlet-name">${U.esc(outlet.name)}</h2>
            <span class="top-outlet-sub">${U.esc(brand.name)} • ${U.esc(outlet.area)}</span>
          </div>
        </div>
        <button type="button" class="btn-soft btn-sm" data-action="change-outlet">Ubah</button>
      </section>

      <section class="form-card reveal" style="margin-top:12px">
        <div class="section-head">
          <div>
            <p class="eyebrow">Konfirmasi</p>
            <h2 class="section-title">Data Pemesan</h2>
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
              <span class="mode-icon">${ICON.icon("store", "w-5 h-5", 2)}</span>
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
          <label class="form-label" for="order-notes">Catatan tambahan <span class="optional">(opsional)</span></label>
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
        ${summary.orderServiceFee > 0 ? `<div class="summary-row"><span>Biaya jasa order</span><strong>${U.rp(summary.orderServiceFee)}</strong></div>` : ""}
        ${summary.totalSavings > 0 ? `<div class="summary-row is-success"><span>Hemat promo</span><strong>-${U.rp(summary.totalSavings)}</strong></div>` : ""}
        <div class="summary-total"><span>Total Bayar</span><strong>${U.rp(summary.grandTotal)}</strong></div>
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
      </section>
    `;
  }

  function paymentLogo(file, label) {
    return `<span class="payment-badge" title="${U.esc(label)}"><img src="src/assets/payments/${file}" alt="${U.esc(label)}" loading="lazy" decoding="async" onerror="this.classList.add('is-hidden')"><span>${U.esc(label)}</span></span>`;
  }

  /* ============================================================
     TAB 4 — RIWAYAT TRANSAKSI PELANGGAN (#/history)
     Isolated per customer browser cache (device_id) + Live Supabase
     ============================================================ */

  function renderHistoryStep() {
    const main = $("#app-main");
    if (!main) return;

    const localOrders = WA.getOrders() || [];
    const deviceShort = String(STORE.state.deviceId || "").slice(-8).toUpperCase();

    main.innerHTML = `
      <section class="history-device-banner reveal">
        <span class="history-device-icon">${ICON.icon("shield-check", "w-5 h-5", 2.2)}</span>
        <div class="history-device-copy">
          <strong>Riwayat Khusus Perangkatmu (ID: #${U.esc(deviceShort)})</strong>
          <span>Riwayat transaksi disimpan pada cache browser perangkat ini &amp; disinkronkan real-time dengan server, sehingga tidak bercampur dengan pelanggan lain.</span>
        </div>
      </section>

      <section class="section reveal" style="margin-top:8px">
        <div class="tracker-search-row" style="margin-bottom:14px">
          <input type="text" id="history-code-input" class="form-input" placeholder="Punya kode pesanan #DLM-...? Cek di sini" aria-label="Cari kode pesanan">
          <button type="button" class="btn-primary btn-sm" data-action="history-track-code">Lacak</button>
        </div>

        <div class="section-head compact">
          <div>
            <p class="eyebrow">Daftar Transaksi</p>
            <h2 class="section-title">Riwayat Pesanan Saya</h2>
          </div>
          <button type="button" class="btn-soft btn-sm" data-action="refresh-history">
            ${ICON.icon("refresh-cw", "w-3.5 h-3.5", 2.2)} Segarkan
          </button>
        </div>

        <div id="history-list-root" class="history-list"></div>
      </section>
    `;

    renderHistoryCards(mergeHistoryOrders(localOrders, customerHistoryCache || []));

    if (window.DLM_SUPABASE && typeof window.DLM_SUPABASE.fetchCustomerOrders === "function") {
      window.DLM_SUPABASE.fetchCustomerOrders(STORE.state.deviceId).then(remoteOrders => {
        if (Array.isArray(remoteOrders)) {
          customerHistoryCache = remoteOrders;
          if (STORE.getRoute() === "history") {
            renderHistoryCards(mergeHistoryOrders(WA.getOrders() || [], remoteOrders));
          }
        }
      });
    }
  }

  function mergeHistoryOrders(localList, remoteList) {
    const map = {};
    const orderCodes = [];

    (remoteList || []).forEach(r => {
      const code = String(r.order_code || "").toUpperCase();
      if (!code) return;
      map[code] = {
        orderId: r.order_code,
        date: r.created_at,
        status: r.status || "pending_wa",
        brandId: r.brand_id,
        brandName: r.brand_name,
        outletId: r.outlet_id,
        outletName: r.outlet_name,
        mode: r.order_mode || "pickup",
        total: Number(r.final_paid_total || r.checkout_total || 0),
        savings: Number(r.customer_savings || 0),
        itemsCount: Number(r.items_count || 0),
        adminNotes: r.admin_notes || "",
        items: (r.items || []).map(it => {
          const catalogItem = STORE.getItem(r.brand_id, it.id || it.menu_item_id);
          const resolvedName = it.name || it.item_name || (catalogItem && catalogItem.name) || "Menu Pesanan";
          const resolvedQty = Math.max(1, Number(it.quantity || 1));
          const resolvedUnit = Number(it.unitPrice || it.unit_selling_price || (catalogItem && catalogItem.priceDiscount) || 0);
          const resolvedOrig = Number(it.unitOriginalPrice || it.unit_original_price || (catalogItem && catalogItem.priceOriginal) || resolvedUnit);
          return {
            id: it.id || it.menu_item_id || "",
            name: resolvedName,
            item_name: resolvedName,
            quantity: resolvedQty,
            unitPrice: resolvedUnit,
            unitOriginalPrice: resolvedOrig,
            lineTotal: Number(it.lineTotalSelling || it.line_total_selling || (resolvedUnit * resolvedQty)),
            selections: Array.isArray(it.selections) ? it.selections : [],
            notes: it.notes || it.item_notes || ""
          };
        })
      };
      orderCodes.push(code);
    });

    (localList || []).forEach(loc => {
      const code = String(loc.orderId || "").toUpperCase();
      if (!code) return;
      if (map[code]) {
        if ((!map[code].items || !map[code].items.length) && Array.isArray(loc.items)) {
          map[code].items = loc.items;
        } else if (Array.isArray(loc.items) && loc.items.length) {
          map[code].localItems = loc.items;
        }
        map[code].url = loc.url;
        map[code].message = loc.message;
      } else {
        map[code] = {
          orderId: loc.orderId,
          date: loc.date,
          status: "pending_wa",
          brandId: loc.brandId,
          brandName: loc.brandName,
          outletId: loc.outletId,
          outletName: loc.outletName,
          mode: loc.mode || "pickup",
          total: Number(loc.total || 0),
          savings: 0,
          itemsCount: Number(loc.itemsCount || (loc.items ? loc.items.length : 0)),
          adminNotes: "",
          items: loc.items || [],
          localItems: loc.items || [],
          url: loc.url,
          message: loc.message
        };
        orderCodes.push(code);
      }
    });

    return orderCodes.map(c => map[c]);
  }

  function renderHistoryCards(orders) {
    const root = $("#history-list-root");
    if (!root) return;

    if (!orders || !orders.length) {
      root.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${ICON.icon("receipt", "w-8 h-8", 1.8)}</div>
          <h3>Belum ada riwayat pesanan</h3>
          <p>Setiap pesanan yang kamu buat dari perangkat ini akan otomatis tercatat di sini lengkap dengan status terbarunya.</p>
          <button type="button" class="btn-primary" data-action="change-outlet">
            ${ICON.icon("store", "w-4 h-4", 2.2)} Mulai Pesan Sekarang
          </button>
        </div>
      `;
      return;
    }

    root.innerHTML = orders.map(ord => {
      const brand = STORE.getBrand(ord.brandId);
      const logoUrl = getLockedBrandLogo(brand);
      const meta = statusMeta(ord.status);
      const dateStr = ord.date
        ? new Date(ord.date).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
        : "Baru saja";

      const itemsPreview = (ord.items || []).slice(0, 4).map(it => {
        const iName = it.name || it.item_name || "Menu Pesanan";
        const iQty = Math.max(1, Number(it.quantity || 1));
        const iUnit = Number(it.unitPrice || it.unit_selling_price || 0);
        const iLine = Number(it.lineTotal || it.line_total_selling || (iUnit * iQty));
        const optSummary = Array.isArray(it.selections) && it.selections.length
          ? formatCartOptions({ selections: it.selections })
          : "";
        return `
          <div class="history-item-card">
            <div class="history-item-line">
              <span class="history-item-title"><span class="history-qty-pill">${iQty}x</span> ${U.esc(iName)}</span>
              <strong class="history-item-price">${iLine > 0 ? U.rp(iLine) : ""}</strong>
            </div>
            ${optSummary ? `<div class="history-item-opts">${U.esc(optSummary)}</div>` : ""}
            ${it.notes ? `<div class="history-item-note">"${U.esc(it.notes)}"</div>` : ""}
          </div>
        `;
      }).join("");

      const extraCount = Math.max(0, (ord.items || []).length - 4);

      return `
        <article class="history-card">
          <div class="history-head">
            <div class="history-outlet">
              <span class="history-outlet-logo">
                <img src="${U.esc(logoUrl)}" alt="${U.esc(ord.brandName)}" />
              </span>
              <div class="history-outlet-copy">
                <strong>${U.esc(ord.outletName || ord.brandName)}</strong>
                <span>#${U.esc(ord.orderId)} • ${U.esc(dateStr)}</span>
              </div>
            </div>
            <span class="status-pill ${meta.cls}">${U.esc(meta.label)}</span>
          </div>

          <div class="history-items">
            ${itemsPreview || `<div>${ord.itemsCount} item pesanan (${ord.mode === "delivery" ? "Delivery" : "Pickup"})</div>`}
            ${extraCount > 0 ? `<div style="font-size:11px;color:var(--muted)">+${extraCount} menu lainnya</div>` : ""}
          </div>

          ${ord.adminNotes ? `
            <div style="padding:8px 10px;border-radius:10px;background:var(--surface-soft);font-size:11.5px;color:var(--body)">
              <strong>Info Admin:</strong> ${U.esc(ord.adminNotes)}
            </div>
          ` : ""}

          <div class="history-foot">
            <div class="history-total">
              <small>${ord.itemsCount} item • ${ord.mode === "delivery" ? "Delivery" : "Pickup"}</small>
              <strong>${U.rp(ord.total)}</strong>
            </div>
            <div class="history-actions">
              <button type="button" class="btn-soft btn-sm" data-action="open-tracker" data-code="${U.esc(ord.orderId)}">
                ${ICON.icon("package", "w-3.5 h-3.5", 2)} Detail Status
              </button>
              <button type="button" class="btn-primary btn-sm" data-action="reorder-code" data-code="${U.esc(ord.orderId)}">
                Beli Lagi
              </button>
            </div>
          </div>
        </article>
      `;
    }).join("");
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
      if (outletEl.dataset.outletOpen === "false") {
        toast("Outlet ini sedang tutup. Silakan pilih cabang lain yang buka.", "error");
        return;
      }
      STORE.setOutlet(outletEl.dataset.outletId);
      toast(`Outlet ${STORE.getOutlet().name} dipilih.`);
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

    const priceFilterEl = event.target.closest("[data-price-filter]");
    if (priceFilterEl) {
      event.preventDefault();
      STORE.state.priceFilter = priceFilterEl.dataset.priceFilter;
      $$("[data-price-filter]").forEach(btn => btn.classList.toggle("is-active", btn.dataset.priceFilter === STORE.state.priceFilter));
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

    if (action === "nav-tab") {
      const tab = el.dataset.tab || "outlet";
      STORE.navigate(tab);
    } else if (action === "open-splash-stories") {
      openIntroSplash(0);
    } else if (action === "close-splash") {
      closeIntroSplash();
    } else if (action === "splash-goto") {
      setIntroSplashSlide(parseInt(el.dataset.index, 10) || 0);
      startIntroSplashTimer();
    } else if (action === "splash-pick-brand") {
      const bId = el.dataset.brandId;
      closeIntroSplash();
      if (bId) handleBrandClick(bId, true);
    } else if (action === "back") {
      STORE.navigate(STORE.prevRoute(STORE.getRoute()));
    } else if (action === "go-cart") {
      STORE.navigate("cart");
    } else if (action === "go-menu") {
      STORE.navigate(STORE.state.selectedOutletId ? "menu" : "outlet");
    } else if (action === "go-checkout") {
      if (!STORE.state.selectedOutletId) {
        toast("Pilih lokasi outlet terlebih dahulu.", "error");
        STORE.navigate("outlet");
        return;
      }
      STORE.navigate("checkout");
    } else if (action === "change-brand" || action === "change-outlet") {
      STORE.navigate("outlet");
    } else if (action === "promo-dot") {
      setPromoSlide(parseInt(el.dataset.index, 10) || 0);
      startPromoCarousel();
    } else if (action === "promo-prev") {
      setPromoSlide(promoSlideIndex - 1);
      startPromoCarousel();
    } else if (action === "promo-next") {
      setPromoSlide(promoSlideIndex + 1);
      startPromoCarousel();
    } else if (action === "promo-select-brand") {
      const bId = el.dataset.brandId;
      if (bId) handleBrandClick(bId, true);
    } else if (action === "quick-mode") {
      const mode = el.dataset.mode === "delivery" ? "delivery" : "pickup";
      STORE.state.orderMode = mode;
      $$(".method-option-btn").forEach(btn => {
        const active = btn.dataset.mode === mode;
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-pressed", active ? "true" : "false");
      });
      const lbl = $("#service-mode-label");
      const bdg = $("#service-mode-badge");
      if (lbl) {
        lbl.textContent = mode === "delivery"
          ? "Dikirim via GoSend / Grab Instant ke titik lokasimu"
          : "Pesanan disiapkan barista, langsung ambil di kasir outlet";
      }
      if (bdg) {
        bdg.textContent = mode === "delivery" ? "Kurir Instant" : "10–15 Menit";
      }
    } else if (action === "reset-menu-filter") {
      STORE.state.activeCategory = "Semua";
      STORE.state.priceFilter = "all";
      STORE.state.searchQuery = "";
      renderMenuStep();
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
    } else if (action === "copy-patungan") {
      copyPatunganSummary();
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
    } else if (action === "reorder-code") {
      reorderByCode(el.dataset.code);
    } else if (action === "refresh-history") {
      renderHistoryStep();
      toast("Riwayat transaksi diperbarui.");
    } else if (action === "history-track-code") {
      const inp = $("#history-code-input");
      if (inp && inp.value.trim()) {
        showTrackerModal(inp.value.trim());
      } else {
        toast("Masukkan kode pesanan #DLM terlebih dahulu.", "error");
      }
    } else if (action === "open-tracker") {
      const code = el.dataset.code || (lastSuccess && lastSuccess.orderId) || (WA.getLastOrder() && WA.getLastOrder().orderId) || "";
      showTrackerModal(code);
    } else if (action === "track-submit") {
      const input = $("#tracker-code-input");
      if (input) runOrderTrack(input.value);
    } else if (action === "tracker-quick-code") {
      const code = el.dataset.code || "";
      const input = $("#tracker-code-input");
      if (input) input.value = code;
      runOrderTrack(code);
    }
  }

  function handleBrandClick(brandId, scrollToOutlets) {
    if (!brandId) return;
    const applyBrand = () => {
      STORE.setBrand(brandId);
      if (STORE.getRoute() !== "outlet") {
        STORE.navigate("outlet");
      } else {
        $$(".brand-select-card").forEach(card => {
          const selected = card.dataset.brandId === brandId;
          card.classList.toggle("is-selected", selected);
          card.setAttribute("aria-pressed", selected ? "true" : "false");
        });
        const brand = STORE.getBrand(brandId);
        const areas = STORE.getBrandAreas(brandId);
        const areasEl = $("#outlet-areas");
        if (areasEl) {
          areasEl.innerHTML = areas.map(area => `<button type="button" class="chip ${STORE.state.outletArea === area ? "is-active" : ""}" data-area="${U.esc(area)}">${U.esc(area)}</button>`).join("");
        }
        const eyebrowEl = $("#outlet-section .eyebrow");
        if (eyebrowEl && brand) eyebrowEl.textContent = `Langkah 2 • ${brand.name}`;
        renderOutletList();
        if (scrollToOutlets) {
          const outSec = $("#outlet-section");
          if (outSec) outSec.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    };

    if (CART.hasItemsFromOtherBrand(brandId)) {
      showConfirm({
        title: "Ganti brand kopi?",
        message: "Keranjangmu berisi menu dari brand lain. Jika ganti brand, isi keranjang saat ini akan dikosongkan.",
        confirmLabel: "Ya, ganti brand",
        cancelLabel: "Batal",
        onConfirm: () => {
          CART.clear();
          applyBrand();
        }
      });
    } else {
      applyBrand();
    }
  }

  function handleItemClick(el) {
    const itemId = el.dataset.itemId;
    const brandId = el.dataset.brandId || STORE.state.selectedBrandId;
    if (!itemId || !brandId) return;

    if (!STORE.state.selectedOutletId) {
      STORE.navigate("outlet");
      toast("Pilih lokasi outlet terlebih dahulu.");
      return;
    }

    const brand = STORE.getBrand(brandId);
    const item = STORE.getItem(brandId, itemId);
    if (!brand || !item) return;

    CUSTOMIZER.open(item, brand, () => {
      if (STORE.getRoute() === "menu") renderBottomBar("menu");
      renderBottomNav(STORE.getRoute());
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

  function copyPatunganSummary() {
    const summary = CART.getSummary();
    const brand = STORE.getBrand();
    const outlet = STORE.getOutlet();
    if (!summary.totalItems) return;

    const lines = [
      `*RINGKASAN PATUNGAN KOPI — ${CFG.appName.toUpperCase()}*`,
      brand && outlet ? `Outlet: ${brand.name} (${outlet.name})` : "",
      ""
    ].filter(Boolean);

    summary.items.forEach((it, idx) => {
      const opt = formatCartOptions(it);
      lines.push(`${idx + 1}. ${it.quantity}x ${it.name} — ${U.rp(it.unitPrice * it.quantity)}${opt ? `\n   (${opt})` : ""}`);
    });

    lines.push("");
    if (summary.totalSavings > 0) lines.push(`Hemat Promo: -${U.rp(summary.totalSavings)}`);
    lines.push(`*Total Bayar: ${U.rp(summary.grandTotal)}*`);

    WA.copyMessage(lines.join("\n")).then(ok => {
      toast(ok ? "Rincian patungan disalin ke clipboard!" : "Gagal menyalin ringkasan.");
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
    const splashOverlay = $("#splash-overlay");
    if (splashOverlay && event.key === "Escape") {
      closeIntroSplash();
      return;
    }

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
      toast("Pilih brand dan lokasi outlet terlebih dahulu.");
      STORE.navigate("outlet");
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
      deviceId: STORE.state.deviceId,
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

    if (window.DLM_SUPABASE && typeof window.DLM_SUPABASE.submitCustomerOrder === "function") {
      window.DLM_SUPABASE.submitCustomerOrder({
        order_code: orderId,
        customer_device_id: STORE.state.deviceId,
        status: "pending_wa",
        brand_id: brand.id,
        brand_name: brand.name,
        outlet_id: outlet.id,
        outlet_name: outlet.name,
        outlet_area: outlet.area,
        customer_name: customer.name,
        customer_phone: customer.phone,
        order_mode: STORE.state.orderMode,
        pickup_time: customer.pickupTime,
        delivery_address: customer.address,
        customer_notes: customer.notes,
        wa_message: message,
        items: summary.items.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category || "",
          quantity: item.quantity,
          unit_price: item.unitPrice,
          unit_original_price: item.unitOriginalPrice,
          selections: item.selections || [],
          notes: item.notes || ""
        }))
      }).catch(() => {
        /* fallback tersimpan di localStorage perangkat */
      });
    }

    showSuccessModal(order);
    STORE.navigate("history", true);
    renderRoute();
  }

  function reorderByCode(code) {
    const clean = String(code || "").toUpperCase();
    const localOrders = WA.getOrders() || [];
    const merged = mergeHistoryOrders(localOrders, customerHistoryCache || []);
    const target = merged.find(o => String(o.orderId || "").toUpperCase() === clean);
    if (!target) {
      orderAgain();
      return;
    }
    const brand = STORE.getBrand(target.brandId);
    const outlet = STORE.getOutlet(target.outletId);
    if (brand) {
      STORE.setBrand(brand.id);
      if (outlet) STORE.setOutlet(outlet.id);
      const sourceItems = (target.localItems && target.localItems.length) ? target.localItems : (target.items || []);
      if (sourceItems.length) {
        CART.clear();
        sourceItems.forEach(raw => {
          const catalogItem = STORE.getItem(brand.id, raw.id);
          CART.addItem({
            id: raw.id || (catalogItem ? catalogItem.id : U.uid("item")),
            brandId: brand.id,
            brandName: brand.name,
            name: raw.name || (catalogItem ? catalogItem.name : "Menu Kopi"),
            image: raw.image || (catalogItem ? catalogItem.image : "src/assets/products/iced-coffee.webp"),
            type: raw.type || (catalogItem ? catalogItem.type : "drink"),
            selections: raw.selections || [],
            notes: raw.notes || "",
            quantity: raw.quantity || 1,
            unitPrice: raw.unitPrice || (catalogItem ? catalogItem.priceDiscount : 14000),
            unitOriginalPrice: raw.unitOriginalPrice || (catalogItem ? catalogItem.priceOriginal : 22000)
          });
        });
        toast(`Menu dari pesanan #${target.orderId} dimasukkan ke keranjang.`);
        STORE.navigate("cart");
        return;
      }
      STORE.navigate(outlet ? "menu" : "outlet");
    }
  }

  function orderAgain() {
    const order = lastSuccess || WA.getLastOrder();
    if (!order) {
      closeModal();
      STORE.navigate("outlet");
      return;
    }
    closeModal();
    reorderByCode(order.orderId);
  }

  /* ============================================================
     MODALS, MODERN ORDER TRACKER & TOAST
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
          <h2 id="success-title" class="modal-title">Pesanan Siap Dikirim</h2>
          <p class="modal-text">Pesananmu sudah tercatat di tab <strong>Riwayat</strong>. Jika WhatsApp belum terbuka otomatis, ketuk tombol di bawah.</p>

          <div class="success-summary">
            <div class="success-row"><span>Kode pesanan</span><strong>#${U.esc(order.orderId)}</strong></div>
            <div class="success-row"><span>Outlet</span><strong>${U.esc(order.outletName)}</strong></div>
            <div class="success-row"><span>Total</span><strong>${U.rp(order.total)}</strong></div>
          </div>

          <button type="button" class="btn-wa btn-full" data-action="open-wa">
            ${ICON.brand("whatsapp", "w-4 h-4")} Buka WhatsApp Resmi
          </button>
          <button type="button" class="btn-soft btn-full" data-action="open-tracker" data-code="${U.esc(order.orderId)}">
            ${ICON.icon("package", "w-4 h-4", 2)} Lacak Status Pesanan
          </button>
          <button type="button" class="btn-soft btn-full" data-action="copy-message">
            ${ICON.icon("copy", "w-4 h-4", 2)} Salin Teks Pesanan
          </button>
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

  function statusMeta(status) {
    if (status === "completed") return { label: "Selesai", cls: "is-completed", step: 3 };
    if (status === "processing") return { label: "Diproses Outlet", cls: "is-processing", step: 2 };
    if (status === "cancelled") return { label: "Dibatalkan", cls: "is-cancelled", step: 0 };
    return { label: "Menunggu WA", cls: "is-pending_wa", step: 1 };
  }

  function showTrackerModal(initialCode) {
    const modalRoot = $("#modal-root");
    if (!modalRoot) return;
    modalLastFocus = document.activeElement;
    const cleanCode = String(initialCode || "").replace(/^#/, "").trim();
    const recentOrders = (WA.getOrders() || []).slice(0, 4);

    modalRoot.innerHTML = `
      <div class="modal-overlay" data-modal-overlay>
        <div class="modal-card tracker-modal-card" role="dialog" aria-modal="true" aria-labelledby="tracker-title">
          <div class="tracker-hero-banner">
            <button type="button" class="modal-close" data-action="close-modal" aria-label="Tutup">${ICON.icon("x", "w-4 h-4", 2.4)}</button>
            <span class="tracker-hero-badge">${ICON.icon("package", "w-3.5 h-3.5", 2.2)} Live Order Radar</span>
            <h2 id="tracker-title" class="modal-title" style="color:#fff;margin-top:2px">Lacak Status Pesanan</h2>
            <p style="font-size:12px;color:rgba(255,255,255,0.86);margin-top:4px">Pantau progres racikan pesananmu dari konfirmasi WhatsApp hingga siap diambil di outlet.</p>
          </div>

          <div class="tracker-modal-body">
            <div class="tracker-search-row" style="margin-bottom:10px">
              <input type="text" id="tracker-code-input" class="form-input" placeholder="DLM-XXXXXX-XXXX" value="${U.esc(cleanCode)}" aria-label="Kode pesanan">
              <button type="button" class="btn-primary btn-sm" data-action="track-submit" style="min-height:46px;padding:0 16px">Lacak</button>
            </div>

            ${recentOrders.length ? `
              <div class="tracker-quick-chips no-scrollbar" aria-label="Pesanan terakhir di perangkat ini">
                ${recentOrders.map(ro => `
                  <button type="button" class="tracker-code-chip" data-action="tracker-quick-code" data-code="${U.esc(ro.orderId)}">
                    ${ICON.icon("receipt", "w-3 h-3", 2.2)} #${U.esc(ro.orderId)}
                  </button>
                `).join("")}
              </div>
            ` : ""}

            <div id="tracker-body"></div>
          </div>
        </div>
      </div>
    `;
    document.body.classList.add("modal-open");
    const input = $("#tracker-code-input");
    if (input) {
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          runOrderTrack(input.value);
        }
      });
      setTimeout(() => input.focus({ preventScroll: true }), 80);
    }
    if (cleanCode) {
      runOrderTrack(cleanCode);
    } else if (recentOrders[0]) {
      if (input) input.value = recentOrders[0].orderId;
      runOrderTrack(recentOrders[0].orderId);
    }
  }

  function runOrderTrack(rawCode) {
    const body = $("#tracker-body");
    if (!body) return;
    const code = String(rawCode || "").replace(/^#/, "").trim().toUpperCase();
    if (!code) {
      body.innerHTML = `<p class="form-error" style="display:block">Masukkan kode pesanan terlebih dahulu.</p>`;
      return;
    }

    body.innerHTML = `<div class="tracker-result"><p style="text-align:center;color:var(--muted)">Mengecek status pesanan <strong>#${U.esc(code)}</strong>...</p></div>`;

    if (!window.DLM_SUPABASE || typeof window.DLM_SUPABASE.trackOrder !== "function") {
      body.innerHTML = `<div class="tracker-result"><p>Koneksi pelacakan belum tersedia.</p></div>`;
      return;
    }

    window.DLM_SUPABASE.trackOrder(code).then(data => {
      if (!data || !data.order_code) {
        const localMatch = WA.getOrders().find(o => String(o.orderId || "").toUpperCase() === code);
        if (localMatch) {
          renderTrackerResult(body, {
            order_code: localMatch.orderId,
            status: "pending_wa",
            brand_name: localMatch.brandName,
            outlet_name: localMatch.outletName,
            customer_name: STORE.state.customer.name || "Pelanggan",
            order_mode: localMatch.mode || "pickup",
            items_count: localMatch.itemsCount,
            final_paid_total: localMatch.total,
            customer_savings: 0,
            items: (localMatch.items || []).map(it => ({
              item_name: it.name,
              quantity: it.quantity,
              line_total_selling: it.unitPrice * it.quantity
            }))
          });
          return;
        }
        body.innerHTML = `<div class="tracker-result"><p style="color:var(--danger);font-weight:700">Pesanan #${U.esc(code)} tidak ditemukan.</p><p style="font-size:12px;color:var(--muted);margin-top:4px">Pastikan kode sesuai dengan yang tertera di pesan WhatsApp Anda.</p></div>`;
        return;
      }
      renderTrackerResult(body, data);
    }).catch(() => {
      body.innerHTML = `<div class="tracker-result"><p style="color:var(--danger)">Gagal memuat status pesanan. Periksa koneksi internet Anda.</p></div>`;
    });
  }

  function renderTrackerResult(container, data) {
    const meta = statusMeta(data.status);
    const itemsList = Array.isArray(data.items) ? data.items : [];
    const itemsHtml = itemsList.map(it => {
      const catalogItem = STORE.getItem(data.brand_id, it.id || it.menu_item_id);
      const itemName = it.item_name || it.name || (catalogItem && catalogItem.name) || "Menu Pesanan";
      const qty = Math.max(1, Number(it.quantity || 1));
      const unitPrice = Number(it.unit_selling_price || it.unitPrice || (catalogItem && catalogItem.priceDiscount) || 0);
      const lineTotal = Number(it.line_total_selling || it.lineTotalSelling || (unitPrice * qty));
      const optSummary = Array.isArray(it.selections) && it.selections.length
        ? formatCartOptions({ selections: it.selections })
        : "";
      const itemNotes = it.item_notes || it.notes || "";

      return `
        <div class="tracker-item-card">
          <div class="tracker-item-main">
            <span class="tracker-item-qty">${qty}x</span>
            <div class="tracker-item-info">
              <strong class="tracker-item-name">${U.esc(itemName)}</strong>
              ${unitPrice > 0 ? `<span class="tracker-item-unit">@ ${U.rp(unitPrice)} / item</span>` : ""}
              ${optSummary ? `<span class="tracker-item-opts">${U.esc(optSummary)}</span>` : ""}
              ${itemNotes ? `<span class="tracker-item-note">Catatan: "${U.esc(itemNotes)}"</span>` : ""}
            </div>
            <strong class="tracker-item-subtotal">${lineTotal > 0 ? U.rp(lineTotal) : "-"}</strong>
          </div>
        </div>
      `;
    }).join("");

    const waAdminLink = `https://wa.me/${U.normalizePhone(CFG.adminWhatsApp)}?text=${encodeURIComponent(`Halo Admin Dibeliin, saya ingin menanyakan status pesanan #${data.order_code} (${data.brand_name} - ${data.outlet_name}).`)}`;
    const savingsVal = Number(data.customer_savings || 0);
    const serviceFeeVal = Number(data.order_service_fee || 0);

    container.innerHTML = `
      <div class="tracker-result">
        <div class="tracker-head">
          <div>
            <span class="tracker-code">#${U.esc(data.order_code)}</span>
            ${data.created_at ? `<div style="font-size:10.5px;color:var(--muted);margin-top:2px">${new Date(data.created_at).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>` : ""}
          </div>
          <span class="status-pill ${meta.cls}">${U.esc(meta.label)}</span>
        </div>

        ${data.status !== "cancelled" ? `
          <div class="tracker-timeline" aria-label="Tahap pesanan">
            <div class="tracker-tl-item ${meta.step >= 1 ? (meta.step > 1 ? "is-done" : "is-active") : ""}">
              <span class="tracker-tl-dot">${meta.step > 1 ? "✓" : "1"}</span>
              <div><strong>Konfirmasi &amp; Pembayaran WA</strong><div style="font-size:11px;opacity:0.85">Pesanan diterima admin via WhatsApp</div></div>
            </div>
            <div class="tracker-tl-item ${meta.step >= 2 ? (meta.step > 2 ? "is-done" : "is-active") : ""}">
              <span class="tracker-tl-dot">${meta.step > 2 ? "✓" : "2"}</span>
              <div><strong>Diracik Barista di Outlet</strong><div style="font-size:11px;opacity:0.85">${U.esc(data.outlet_name)}</div></div>
            </div>
            <div class="tracker-tl-item ${meta.step >= 3 ? "is-done" : ""}">
              <span class="tracker-tl-dot">${meta.step >= 3 ? "✓" : "3"}</span>
              <div><strong>Pesanan Siap / Selesai</strong><div style="font-size:11px;opacity:0.85">${data.order_mode === "delivery" ? "Dikirim kurir ke alamatmu" : "Siap diambil di pickup counter"}</div></div>
            </div>
          </div>
        ` : ""}

        <div class="tracker-meta-box">
          <div class="success-row"><span>Pemesan</span><strong>${U.esc(data.customer_name || "-")}</strong></div>
          <div class="success-row"><span>Brand &amp; Outlet</span><strong>${U.esc(data.brand_name)} • ${U.esc(data.outlet_name)}</strong></div>
          <div class="success-row"><span>Metode Pesanan</span><strong>${data.order_mode === "delivery" ? "Kirim Driver (Delivery)" : "Ambil Sendiri (Pickup)"}</strong></div>
          ${data.pickup_time ? `<div class="success-row"><span>Estimasi Waktu</span><strong>${U.esc(data.pickup_time)}</strong></div>` : ""}
          ${data.order_mode === "delivery" && data.delivery_address ? `<div class="success-row"><span>Alamat Kirim</span><strong>${U.esc(data.delivery_address)}</strong></div>` : ""}
        </div>

        <div class="tracker-items-section">
          <div class="tracker-items-header">
            <span>Rincian Produk Dipesan</span>
            <span>${data.items_count || itemsList.length} Item</span>
          </div>
          ${itemsHtml || `<div style="font-size:12px;color:var(--body);padding:6px 0">${data.items_count || 1} item pesanan</div>`}
        </div>

        <div class="tracker-total-box">
          ${serviceFeeVal > 0 ? `<div class="success-row"><span>Biaya Jasa Order</span><strong>${U.rp(serviceFeeVal)}</strong></div>` : ""}
          ${savingsVal > 0 ? `<div class="success-row" style="color:var(--success)"><span>Total Hemat Promo</span><strong style="color:var(--success)">-${U.rp(savingsVal)}</strong></div>` : ""}
          <div class="success-row is-grand"><span>Total Pembayaran</span><strong>${U.rp(data.final_paid_total)}</strong></div>
        </div>

        ${data.admin_notes ? `<div class="tracker-admin-note"><strong>Catatan Admin:</strong> ${U.esc(data.admin_notes)}</div>` : ""}

        <div class="tracker-wa-footer">
          <a href="${U.esc(waAdminLink)}" target="_blank" rel="noopener" class="btn-wa tracker-wa-btn">
            ${ICON.brand("whatsapp", "w-4 h-4")}
            <span>Tanya Admin via WhatsApp</span>
          </a>
        </div>
      </div>
    `;
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
    renderOutletList,
    openIntroSplash
  };

  document.addEventListener("DOMContentLoaded", init);
})();
