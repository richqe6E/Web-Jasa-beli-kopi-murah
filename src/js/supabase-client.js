/* ============================================================
   SUPABASE CLOUD CLIENT (REST + RPC + AUTH + STORAGE)
   Zero-dependency integration with automatic local fallback
   ============================================================ */
(function () {
  "use strict";

  const CFG = window.DLM_CONFIG;
  const AUTH_STORAGE_KEY = "dlm_supabase_auth_v1";

  function baseUrl() {
    return (CFG && CFG.supabaseUrl ? CFG.supabaseUrl : "").replace(/\/+$/, "");
  }

  function anonKey() {
    return (CFG && CFG.supabaseAnonKey) || "";
  }

  function getSession() {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.access_token) return null;
      return parsed;
    } catch (e) {
      return null;
    }
  }

  function setSession(session) {
    try {
      if (!session) localStorage.removeItem(AUTH_STORAGE_KEY);
      else localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    } catch (e) {
      /* ignore */
    }
  }

  async function request(endpoint, options) {
    const url = baseUrl();
    const key = anonKey();
    if (!url || !key) throw new Error("Konfigurasi Supabase belum tersedia.");

    const opts = options || {};
    const session = getSession();
    const token = opts.useAuth && session && session.access_token ? session.access_token : key;

    const headers = Object.assign({
      apikey: key,
      Authorization: `Bearer ${token}`
    }, opts.headers || {});

    if (opts.body && !(opts.body instanceof FormData) && !(opts.body instanceof Blob) && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(`${url}${endpoint}`, {
      method: opts.method || "GET",
      headers,
      body: opts.body && typeof opts.body === "object" && !(opts.body instanceof FormData) && !(opts.body instanceof Blob)
        ? JSON.stringify(opts.body)
        : opts.body
    });

    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (e) {
      data = text;
    }

    if (!res.ok) {
      const msg = (data && (data.message || data.error_description || data.error || data.hint)) || `HTTP ${res.status}`;
      throw new Error(msg);
    }
    return data;
  }

  /* ------------------------------------------------------------
     CATALOG SYNC (Customer App & Admin)
     ------------------------------------------------------------ */

  function applyCatalogToWindow(payload) {
    if (!payload) return false;

    if (payload.settings) {
      const s = payload.settings;
      if (s.app_name) CFG.appName = s.app_name;
      if (s.short_name) CFG.shortName = s.short_name;
      if (s.tagline) CFG.tagline = s.tagline;
      if (s.city) CFG.city = s.city;
      if (s.region) CFG.region = s.region;
      if (s.admin_whatsapp) CFG.adminWhatsApp = s.admin_whatsapp;
      if (s.admin_whatsapp_display) CFG.adminWhatsAppDisplay = s.admin_whatsapp_display;
      if (s.service_fee_mode) CFG.serviceFeeMode = s.service_fee_mode;
      if (s.default_service_fee_per_item != null) CFG.defaultServiceFeePerItem = Number(s.default_service_fee_per_item);
      if (s.default_service_fee_per_order != null) CFG.defaultServiceFeePerOrder = Number(s.default_service_fee_per_order);
      if (s.default_cost_ratio_percent != null) CFG.defaultCostRatioPercent = Number(s.default_cost_ratio_percent);
      if (s.payment_note) CFG.paymentNote = s.payment_note;
      if (s.operational_note) CFG.operationalNote = s.operational_note;
      CFG.serviceFeeIncluded = CFG.serviceFeeMode === "included_per_item";
    }

    if (Array.isArray(payload.brands) && payload.brands.length && Array.isArray(payload.menuItems)) {
      const activeBrands = payload.brands
        .filter(b => b.is_active !== false)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

      const initialBrandsMap = {};
      (window.DLM_BRANDS || []).forEach(ib => {
        initialBrandsMap[ib.id] = ib;
      });

      const mappedBrands = activeBrands.map(b => {
        const localBrand = initialBrandsMap[b.id] || {};
        const items = payload.menuItems
          .filter(it => it.brand_id === b.id && it.is_available !== false)
          .sort((a, c) => (a.sort_order || 0) - (c.sort_order || 0))
          .map(it => {
            const rawItem = {
              id: it.id,
              brandId: it.brand_id,
              name: it.name,
              category: it.category,
              type: it.type || "drink",
              description: it.description || "",
              info: it.info || "",
              image: it.image_url || "src/assets/products/iced-coffee.webp",
              priceOriginal: Number(it.price_original || 0),
              priceDiscount: Number(it.price_discount || 0),
              priceCost: Number(it.price_cost || 0),
              serviceFeeUnit: Number(it.service_fee_unit || 0),
              isBestSeller: !!it.is_best_seller,
              isAvailable: it.is_available !== false,
              rating: it.rating || "4.8",
              sold: it.sold_label || "1k+",
              soldCount: Number(it.sold_count || 0),
              optionGroups: Array.isArray(it.option_groups) && it.option_groups.length ? it.option_groups : []
            };
            return typeof window.DLM_HYDRATE_ITEM === "function"
              ? window.DLM_HYDRATE_ITEM(rawItem)
              : rawItem;
          });

        const allBrandRows = payload.menuItems.filter(it => it.brand_id === b.id);
        const finalItems = allBrandRows.length > 0
          ? items
          : (localBrand.items || items);

        const baseCats = Array.isArray(localBrand.categories) && localBrand.categories.length
          ? localBrand.categories
          : (Array.isArray(b.categories) && b.categories.length ? b.categories : ["Semua"]);
        const itemCats = finalItems.map(it => it.category).filter(Boolean);
        const mergedCats = ["Semua"].concat(Array.from(new Set(baseCats.concat(itemCats).filter(c => c !== "Semua"))));

        const lockedLogo = (CFG.lockedBrandLogos && CFG.lockedBrandLogos[b.id]) || localBrand.logo || b.logo_url || "";
        return {
          id: b.id,
          name: b.name,
          shortName: b.short_name || localBrand.shortName || b.name,
          monogram: b.monogram || localBrand.monogram || b.name.charAt(0),
          logo: lockedLogo,
          wordmark: localBrand.wordmark || lockedLogo,
          themeStyle: localBrand.themeStyle || b.id,
          ads: Array.isArray(localBrand.ads) ? localBrand.ads : [],
          tagline: b.tagline || localBrand.tagline || "",
          description: b.description || localBrand.description || "",
          promoBadge: b.promo_badge || localBrand.promoBadge || "Promo Spesial",
          accent: localBrand.accent || b.accent || "#0B6BCB",
          accentSoft: localBrand.accentSoft || b.accent_soft || "#E3F0FF",
          accentDeep: localBrand.accentDeep || b.accent_deep || "#084F99",
          rating: b.rating || localBrand.rating || "4.9",
          totalSold: b.total_sold || localBrand.totalSold || "10k+",
          categories: mergedCats,
          items: finalItems
        };
      });

      if (mappedBrands.length) {
        window.DLM_BRANDS = mappedBrands;
      }
    }

    if (Array.isArray(payload.outlets) && payload.outlets.length) {
      const mappedOutlets = payload.outlets
        .filter(o => o.is_active !== false)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
        .map(o => ({
          id: o.id,
          brandId: o.brand_id,
          name: o.name,
          area: o.area,
          address: o.address,
          hours: o.hours || "08:00 - 22:00",
          distance: o.distance || "1.0 km",
          isOpen: o.is_open !== false,
          mapsQuery: o.maps_query || `${o.name}, ${o.address}, Samarinda`
        }));

      if (mappedOutlets.length) {
        window.DLM_OUTLETS = mappedOutlets;
      }
    }

    return true;
  }

  async function syncCatalog() {
    try {
      const [settingsRows, brands, outlets, menuItems] = await Promise.all([
        request("/rest/v1/app_settings?select=*&id=eq.1"),
        request("/rest/v1/brands?select=*&order=sort_order.asc&limit=50"),
        request("/rest/v1/outlets?select=*&order=sort_order.asc&limit=200"),
        request("/rest/v1/menu_items?select=*&order=sort_order.asc&limit=1000")
      ]);

      const payload = {
        settings: Array.isArray(settingsRows) && settingsRows[0] ? settingsRows[0] : null,
        brands: brands || [],
        outlets: outlets || [],
        menuItems: menuItems || [],
        syncedAt: new Date().toISOString()
      };

      applyCatalogToWindow(payload);
      try {
        localStorage.setItem(CFG.storageKeys.catalogCache, JSON.stringify(payload));
      } catch (e) {
        /* ignore */
      }
      return { ok: true, payload };
    } catch (err) {
      try {
        const cached = localStorage.getItem(CFG.storageKeys.catalogCache);
        if (cached) applyCatalogToWindow(JSON.parse(cached));
      } catch (e) {
        /* ignore */
      }
      return { ok: false, error: err.message };
    }
  }

  /* ------------------------------------------------------------
     CUSTOMER ORDER & TRACKING RPC
     ------------------------------------------------------------ */

  async function submitCustomerOrder(orderData) {
    return request("/rest/v1/rpc/create_customer_order", {
      method: "POST",
      body: { p_payload: orderData }
    });
  }

  async function trackOrder(orderCode) {
    return request("/rest/v1/rpc/get_order_status", {
      method: "POST",
      body: { p_order_code: orderCode }
    });
  }

  async function fetchCustomerOrders(deviceId) {
    return request("/rest/v1/rpc/get_customer_orders", {
      method: "POST",
      body: { p_device_id: deviceId }
    });
  }

  /* ------------------------------------------------------------
     ADMIN AUTHENTICATION
     ------------------------------------------------------------ */

  async function signIn(email, password) {
    const data = await request("/auth/v1/token?grant_type=password", {
      method: "POST",
      body: { email, password }
    });
    setSession(data);
    return data;
  }

  async function signOut() {
    try {
      await request("/auth/v1/logout", { method: "POST", useAuth: true });
    } catch (e) {
      /* ignore */
    }
    setSession(null);
  }

  async function verifyAdminSession() {
    const session = getSession();
    if (!session || !session.access_token) return null;
    try {
      const user = await request("/auth/v1/user", { method: "GET", useAuth: true });
      return user;
    } catch (e) {
      setSession(null);
      return null;
    }
  }

  /* ------------------------------------------------------------
     ADMIN DATA & FINANCIAL OPERATIONS
     ------------------------------------------------------------ */

  async function fetchAdminDataset() {
    const [settingsRows, brands, outlets, menuItems, orders] = await Promise.all([
      request("/rest/v1/app_settings?select=*&id=eq.1", { useAuth: true }),
      request("/rest/v1/brands?select=*&order=sort_order.asc&limit=50", { useAuth: true }),
      request("/rest/v1/outlets?select=*&order=sort_order.asc&limit=200", { useAuth: true }),
      request("/rest/v1/menu_items?select=*&order=brand_id.asc,sort_order.asc&limit=1000", { useAuth: true }),
      request("/rest/v1/orders?select=*,order_items(*)&order=created_at.desc&limit=500", { useAuth: true })
    ]);

    return {
      settings: Array.isArray(settingsRows) && settingsRows[0] ? settingsRows[0] : null,
      brands: brands || [],
      outlets: outlets || [],
      menuItems: menuItems || [],
      orders: orders || []
    };
  }

  async function reconcileOrder(params) {
    return request("/rest/v1/rpc/reconcile_order", {
      method: "POST",
      useAuth: true,
      body: {
        p_order_id: Number(params.orderId),
        p_status: params.status,
        p_final_paid_total: Number(params.finalPaidTotal),
        p_total_cost_amount: Number(params.totalCostAmount),
        p_service_fee_profit: Number(params.serviceFeeProfit),
        p_admin_notes: params.adminNotes || ""
      }
    });
  }

  async function deleteOrder(orderId) {
    return request(`/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}`, {
      method: "DELETE",
      useAuth: true
    });
  }

  async function applyBulkProfitRules(params) {
    return request("/rest/v1/rpc/apply_bulk_profit_rules", {
      method: "POST",
      useAuth: true,
      body: {
        p_brand_id: params.brandId || "all",
        p_cost_ratio_percent: Number(params.costRatioPercent),
        p_service_fee_unit: Number(params.serviceFeeUnit),
        p_target_spread_margin: Number(params.targetSpreadMargin),
        p_recalculate_selling_price: !!params.recalculateSellingPrice
      }
    });
  }

  async function upsertMenuItem(row) {
    return request("/rest/v1/menu_items", {
      method: "POST",
      useAuth: true,
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: [row]
    });
  }

  async function deleteMenuItem(id) {
    return request(`/rest/v1/menu_items?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
      useAuth: true
    });
  }

  async function upsertOutlet(row) {
    return request("/rest/v1/outlets", {
      method: "POST",
      useAuth: true,
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: [row]
    });
  }

  async function deleteOutlet(id) {
    return request(`/rest/v1/outlets?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
      useAuth: true
    });
  }

  async function upsertBrand(row) {
    return request("/rest/v1/brands", {
      method: "POST",
      useAuth: true,
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: [row]
    });
  }

  async function saveSettings(row) {
    const payload = Object.assign({ id: 1, updated_at: new Date().toISOString() }, row);
    return request("/rest/v1/app_settings", {
      method: "POST",
      useAuth: true,
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: [payload]
    });
  }

  async function uploadPublicAsset(folder, file) {
    const cleanName = String(file.name || "asset")
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, "-");
    const objectPath = `${folder}/${Date.now()}-${cleanName}`;
    await request(`/storage/v1/object/public-assets/${objectPath}`, {
      method: "POST",
      useAuth: true,
      headers: {
        "Content-Type": file.type || "application/octet-stream",
        "x-upsert": "true"
      },
      body: file
    });
    return `${baseUrl()}/storage/v1/object/public/public-assets/${objectPath}`;
  }

  window.DLM_SUPABASE = {
    getSession,
    signIn,
    signOut,
    verifyAdminSession,
    syncCatalog,
    submitCustomerOrder,
    trackOrder,
    fetchCustomerOrders,
    fetchAdminDataset,
    reconcileOrder,
    deleteOrder,
    applyBulkProfitRules,
    upsertMenuItem,
    deleteMenuItem,
    upsertOutlet,
    deleteOutlet,
    upsertBrand,
    saveSettings,
    uploadPublicAsset
  };
})();
