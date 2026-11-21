/* ============================================================
   STATE STORE
   ============================================================ */
(function () {
  "use strict";

  const CFG = window.DLM_CONFIG;
  const U = window.DLM_UTIL;
  const ROUTES = ["brand", "outlet", "menu", "cart", "checkout"];

  const state = {
    selectedBrandId: null,
    selectedOutletId: null,
    activeCategory: "Semua",
    searchQuery: "",
    outletQuery: "",
    outletArea: "Semua Area",
    sort: "popular",
    orderMode: "pickup",
    customer: {
      name: "",
      phone: "",
      notes: "",
      pickupTime: "Secepatnya (15–20 menit)",
      address: ""
    }
  };

  function load() {
    const brandId = U.storage.get(CFG.storageKeys.brand, null);
    const outletId = U.storage.get(CFG.storageKeys.outlet, null);
    const customer = U.storage.get(CFG.storageKeys.customer, null);

    if (brandId && window.DLM_BRANDS.some(b => b.id === brandId)) {
      state.selectedBrandId = brandId;
    }
    if (outletId) {
      const outlet = window.DLM_OUTLETS.find(o => o.id === outletId);
      if (outlet && (!state.selectedBrandId || outlet.brandId === state.selectedBrandId)) {
        state.selectedOutletId = outlet.id;
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
    return window.DLM_BRANDS.find(b => b.id === (id || state.selectedBrandId)) || null;
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
    saveOutlet();
  }

  function updateCustomer(patch) {
    state.customer = Object.assign({}, state.customer, patch || {});
    saveCustomer();
  }

  function getRoute() {
    const raw = (location.hash || "").replace(/^#\/?/, "").split("?")[0];
    return ROUTES.includes(raw) ? raw : "brand";
  }

  function navigate(route, replace) {
    const target = ROUTES.includes(route) ? route : "brand";
    const hash = "#/" + target;
    if (replace) {
      history.replaceState(null, "", hash);
    } else if (location.hash !== hash) {
      location.hash = hash;
    }
  }

  function stepIndex(route) {
    return Math.max(0, ROUTES.indexOf(route || getRoute()));
  }

  function prevRoute(route) {
    const index = stepIndex(route);
    return index > 0 ? ROUTES[index - 1] : "brand";
  }

  function canEnter(route) {
    if (route === "brand") return true;
    if (!state.selectedBrandId) return false;
    if (route === "outlet") return true;
    if (!state.selectedOutletId) return false;
    return true;
  }

  function resetFlow() {
    state.selectedBrandId = null;
    state.selectedOutletId = null;
    state.activeCategory = "Semua";
    state.searchQuery = "";
    state.outletQuery = "";
    state.outletArea = "Semua Area";
    state.sort = "popular";
    saveBrand();
    saveOutlet();
  }

  load();

  window.DLM_STORE = {
    state, ROUTES, load, getBrand, getOutlet, getBrandOutlets, getBrandAreas,
    getItem, setBrand, setOutlet, updateCustomer, getRoute, navigate,
    stepIndex, prevRoute, canEnter, resetFlow, saveCustomer
  };
})();
