/* ============================================================
   UTILITAS UMUM
   ============================================================ */
(function () {
  "use strict";

  const esc = (value) => String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  const rp = (value) => "Rp " + Number(value || 0).toLocaleString("id-ID");

  const num = (value) => Number(value || 0).toLocaleString("id-ID");

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const debounce = (fn, wait) => {
    let timer = null;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), wait || 150);
    };
  };

  const uid = (prefix) => {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `${prefix || "DLM"}-${yy}${mm}${dd}-${rand}`;
  };

  const formatDateID = (date) => {
    const d = date || new Date();
    return d.toLocaleDateString("id-ID", {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    });
  };

  const formatTimeID = (date) => {
    const d = date || new Date();
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(".", ":") + " WITA";
  };

  const storage = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (e) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        /* storage penuh / private mode */
      }
    },
    remove(key) {
      try { localStorage.removeItem(key); } catch (e) {}
    }
  };

  const normalizePhone = (phone) => String(phone || "").replace(/[^\d+]/g, "").replace(/^\+62/, "62").replace(/^0/, "62");

  const isValidPhone = (phone) => {
    const digits = String(phone || "").replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 15;
  };

  const initials = (name) => String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join("");

  const scrollTop = (smooth) => {
    window.scrollTo({ top: 0, behavior: smooth === false ? "auto" : "smooth" });
  };

  const retryImage = (img) => {
    if (!img || !img.src) return;
    const count = parseInt(img.dataset.retry || "0", 10);
    if (count >= 2) {
      img.classList.add("is-img-failed");
      return;
    }
    const next = count + 1;
    img.dataset.retry = String(next);
    const base = img.dataset.origSrc || img.getAttribute("src") || "";
    if (!base) return;
    img.dataset.origSrc = base;
    const sep = base.includes("?") ? "&" : "?";
    setTimeout(() => {
      if (img && img.isConnected) {
        img.src = `${base}${sep}_r=${next}`;
      }
    }, next === 1 ? 550 : 1400);
  };

  window.DLM_IMG_RETRY = retryImage;

  const imageTag = (src, alt, className, eager) => {
    const cls = className || "";
    const loadingAttr = eager ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"';
    return `<img src="${esc(src)}" alt="${esc(alt)}" class="${cls}" width="400" height="400" ${loadingAttr} decoding="async" onerror="window.DLM_IMG_RETRY&&window.DLM_IMG_RETRY(this)">`;
  };

  const getDeviceId = () => {
    const key = (window.DLM_CONFIG && window.DLM_CONFIG.storageKeys && window.DLM_CONFIG.storageKeys.deviceId) || "dlm_device_id_v1";
    let id = storage.get(key, null);
    if (!id || typeof id !== "string" || id.length < 8) {
      const rand = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
      id = `cust_${Date.now().toString(36)}_${rand}`;
      storage.set(key, id);
    }
    return id;
  };

  const haversineKm = (lat1, lng1, lat2, lng2) => {
    if (
      typeof lat1 !== "number" || typeof lng1 !== "number" ||
      typeof lat2 !== "number" || typeof lng2 !== "number" ||
      Number.isNaN(lat1) || Number.isNaN(lng1) || Number.isNaN(lat2) || Number.isNaN(lng2)
    ) {
      return null;
    }
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const formatDistanceKm = (km) => {
    if (km == null || Number.isNaN(km)) return "";
    if (km < 1) {
      const meters = Math.max(50, Math.round((km * 1000) / 10) * 10);
      return `${meters} m`;
    }
    return `${km.toFixed(1).replace(".", ",")} km`;
  };

  window.DLM_UTIL = {
    esc, rp, num, clamp, debounce, uid, formatDateID, formatTimeID,
    storage, normalizePhone, isValidPhone, initials, scrollTop, imageTag, getDeviceId,
    haversineKm, formatDistanceKm
  };
})();
