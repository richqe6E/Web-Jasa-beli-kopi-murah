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
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(".", ":") + " WIB";
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

  const imageTag = (src, alt, className, eager) => {
    const cls = className || "";
    return `<img src="${esc(src)}" alt="${esc(alt)}" class="${cls}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" onerror="this.classList.add('is-hidden')">`;
  };

  window.DLM_UTIL = {
    esc, rp, num, clamp, debounce, uid, formatDateID, formatTimeID,
    storage, normalizePhone, isValidPhone, initials, scrollTop, imageTag
  };
})();
