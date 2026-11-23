/* ============================================================
   STATE STORE (ISOLATED PER CUSTOMER DEVICE CACHE)
   Routes: outlet (Pilih Brand & Lokasi Outlet) | menu | cart | checkout | history
   ============================================================ */
(function () {
  "use strict";

  const CFG = window.DLM_CONFIG;
  const U = window.DLM_UTIL;
  const ROUTES = ["outlet", "menu", "cart", "checkout", "history"];

  const state = {
    deviceId: U.getDeviceId(),
    selectedBrandId: "kenangan",
    selectedOutletId: null,
    activeCategory: "Semua",
    priceFilter: "all", // "all" | "under15k" | "disc40" | "bestseller"
    searchQuery: "",
    outletQuery: "",
    outletArea: "Semua Area",
    sort: "popular",
    orderMode: "pickup",
    termsAccepted: false,
    userLocation: {
      lat: null,
      lng: null,
      accuracy: null,
      status: "idle" // "idle" | "loading" | "granted" | "denied" | "unsupported"
    },
    customer: {
      name: "",
      phone: "",
      notes: "",
      pickupTime: "Secepatnya (15-20 menit)",
      address: ""
    }
  };

  function load() {
    const brandId = U.storage.get(CFG.storageKeys.brand, "kenangan");
    const outletId = U.storage.get(CFG.storageKeys.outlet, null);
    const customer = U.storage.get(CFG.storageKeys.customer, null);

    if (brandId && window.DLM_BRANDS.some(b => b.id === brandId) && getBrandOutlets(brandId).length > 0) {
      state.selectedBrandId = brandId;
    } else {
      const firstActive = window.DLM_BRANDS.find(b => getBrandOutlets(b.id).length > 0) || window.DLM_BRANDS[0];
      if (firstActive) state.selectedBrandId = firstActive.id;
    }

    if (outletId) {
      const outlet = window.DLM_OUTLETS.find(o => o.id === outletId);
      if (outlet) {
        state.selectedOutletId = outlet.id;
        state.selectedBrandId = outlet.brandId;
      }
    }

    if (customer && typeof customer === "object") {
      state.customer = Object.assign({}, state.customer, customer);
    }
  }

  function saveBrand() {
    U.storage.set(CFG.storageKeys.brand, state.selectedBrandId);
  }

  function saveOutlet() {
    U.storage.set(CFG.storageKeys.outlet, state.selectedOutletId);
  }

  function saveCustomer() {
    U.storage.set(CFG.storageKeys.customer, state.customer);
  }

  function getBrand(id) {
    return window.DLM_BRANDS.find(b => b.id === (id || state.selectedBrandId)) || window.DLM_BRANDS[0] || null;
  }

  function getOutlet(id) {
    return window.DLM_OUTLETS.find(o => o.id === (id || state.selectedOutletId)) || null;
  }

  function getBrandOutlets(brandId) {
    return window.DLM_OUTLETS.filter(o => o.brandId === (brandId || state.selectedBrandId));
  }

  function getBrandAreas(brandId) {
    const outlets = getBrandOutlets(brandId);
    return ["Semua Area"].concat(Array.from(new Set(outlets.map(o => o.area))));
  }

  function getItem(brandId, itemId) {
    const brand = getBrand(brandId);
    if (!brand) return null;
    return brand.items.find(item => item.id === itemId) || null;
  }

  function setBrand(brandId) {
    if (!window.DLM_BRANDS.some(b => b.id === brandId)) return;
    state.selectedBrandId = brandId;
    if (state.selectedOutletId) {
      const outlet = getOutlet(state.selectedOutletId);
      if (!outlet || outlet.brandId !== brandId) state.selectedOutletId = null;
    }
    state.activeCategory = "Semua";
    state.priceFilter = "all";
    state.searchQuery = "";
    state.outletQuery = "";
    state.outletArea = "Semua Area";
    saveBrand();
    saveOutlet();
  }

  function setOutlet(outletId) {
    const outlet = getOutlet(outletId);
    if (!outlet) return;
    state.selectedOutletId = outlet.id;
    if (state.selectedBrandId !== outlet.brandId) {
      state.selectedBrandId = outlet.brandId;
      saveBrand();
    }
    state.activeCategory = "Semua";
    state.priceFilter = "all";
    state.searchQuery = "";
    saveOutlet();
  }

  function setUserLocation(patch) {
    state.userLocation = Object.assign({}, state.userLocation, patch || {});
  }

  function getOutletDistanceKm(outlet) {
    if (!outlet) return null;
    const loc = state.userLocation;
    if (!loc || loc.status !== "granted" || typeof loc.lat !== "number" || typeof loc.lng !== "number") {
      return null;
    }
    if (typeof outlet.lat !== "number" || typeof outlet.lng !== "number") return null;
    return U.haversineKm(loc.lat, loc.lng, outlet.lat, outlet.lng);
  }

  function updateCustomer(patch) {
    state.customer = Object.assign({}, state.customer, patch || {});
    saveCustomer();
  }

  function getRoute() {
    const raw = (location.hash || "").replace(/^#\/?/, "").split("?")[0];
    if (raw === "brand" || raw === "") return "outlet";
    return ROUTES.includes(raw) ? raw : "outlet";
  }

  function navigate(route, replace) {
    const normalized = route === "brand" ? "outlet" : route;
    const target = ROUTES.includes(normalized) ? normalized : "outlet";
    const hash = "#/" + target;
    if (replace) {
      history.replaceState(null, "", hash);
    } else if (location.hash !== hash) {
      location.hash = hash;
    }
  }

  function stepIndex(route) {
    const r = route || getRoute();
    if (r === "outlet") return 0;
    if (r === "menu") return 1;
    if (r === "cart") return 2;
    if (r === "checkout") return 3;
    if (r === "history") return 4;
    return 0;
  }

  function prevRoute(route) {
    const r = route || getRoute();
    if (r === "checkout") return "cart";
    if (r === "cart") return state.selectedOutletId ? "menu" : "outlet";
    if (r === "menu") return "outlet";
    return "outlet";
  }

  function canEnter(route) {
    if (route === "checkout" && (!state.selectedOutletId || !state.selectedBrandId)) return false;
    return true;
  }

  function resetFlow() {
    state.selectedOutletId = null;
    state.activeCategory = "Semua";
    state.priceFilter = "all";
    state.searchQuery = "";
    state.outletQuery = "";
    state.outletArea = "Semua Area";
    state.sort = "popular";
    saveOutlet();
  }

  load();

  window.DLM_STORE = {
    state, ROUTES, load, getBrand, getOutlet, getBrandOutlets, getBrandAreas,
    getItem, setBrand, setOutlet, setUserLocation, getOutletDistanceKm,
    updateCustomer, getRoute, navigate,
    stepIndex, prevRoute, canEnter, resetFlow, saveCustomer
  };
})();
