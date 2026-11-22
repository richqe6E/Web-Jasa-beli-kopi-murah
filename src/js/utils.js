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

  /* Smart multi-token + typo-tolerant outlet matcher (substring, middle/end words, aliases, Damerau-Levenshtein) */
  const OUTLET_ALIASES = {
    smd: "samarinda",
    smr: "samarinda",
    bpn: "balikpapan",
    tgr: "tenggarong",
    teng: "tenggarong",
    jl: "jalan",
    jln: "jalan",
    rs: "rumah sakit",
    rsud: "rumah sakit",
    dt: "drive thru",
    spbu: "pertamina",
    scp: "samarinda central plaza",
    bsb: "balikpapan superblock",
    smc: "samarinda medika citra",
    aws: "abdul wahab sjahranie"
  };

  const normalizeSearchText = (str) => String(str || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  const editDistance = (a, b) => {
    const la = a.length;
    const lb = b.length;
    if (la === 0) return lb;
    if (lb === 0) return la;
    const dp = Array.from({ length: la + 1 }, () => new Array(lb + 1).fill(0));
    for (let i = 0; i <= la; i++) dp[i][0] = i;
    for (let j = 0; j <= lb; j++) dp[0][j] = j;
    for (let i = 1; i <= la; i++) {
      for (let j = 1; j <= lb; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        let val = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
          val = Math.min(val, dp[i - 2][j - 2] + cost);
        }
        dp[i][j] = val;
      }
    }
    return dp[la][lb];
  };

  const scoreOutletSearch = (outlet, rawQuery) => {
    const qNorm = normalizeSearchText(rawQuery);
    if (!qNorm) return 1;
    const nameNorm = normalizeSearchText(outlet.name);
    const addrNorm = normalizeSearchText(outlet.address);
    const areaNorm = normalizeSearchText(outlet.area);
    const haystack = `${nameNorm} ${areaNorm} ${addrNorm}`;
    const words = haystack.split(/\s+/).filter(Boolean);

    // Direct full-phrase substring match gets highest score
    if (nameNorm.includes(qNorm)) return 100;
    if (haystack.includes(qNorm)) return 85;

    const rawTokens = qNorm.split(/\s+/).filter(Boolean);
    let totalScore = 0;

    for (const rawTok of rawTokens) {
      const tok = OUTLET_ALIASES[rawTok] || rawTok;
      const subTokens = tok.split(/\s+/).filter(Boolean);
      for (const st of subTokens) {
        if (nameNorm.includes(st)) {
          totalScore += 30;
          continue;
        }
        if (areaNorm.includes(st) || addrNorm.includes(st)) {
          totalScore += 20;
          continue;
        }
        // Fuzzy match against individual words (handles typos in middle/end of words)
        if (st.length >= 3) {
          const maxDist = st.length <= 4 ? 1 : (st.length <= 7 ? 1 : 2);
          let bestDist = Infinity;
          for (const w of words) {
            if (Math.abs(w.length - st.length) > maxDist) continue;
            const d = editDistance(st, w);
            if (d < bestDist) bestDist = d;
            if (d === 1) break;
          }
          if (bestDist <= maxDist) {
            totalScore += bestDist === 1 ? 14 : 9;
            continue;
          }
        }
        return 0; // Token did not match even fuzzily
      }
    }
    return totalScore;
  };

  const getWitaMinutes = (nowDate) => {
    const d = nowDate || new Date();
    try {
      const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Makassar",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).formatToParts(d);
      const hh = parseInt((parts.find(p => p.type === "hour") || {}).value || "0", 10) % 24;
      const mm = parseInt((parts.find(p => p.type === "minute") || {}).value || "0", 10);
      return hh * 60 + mm;
    } catch (e) {
      const utcMin = d.getUTCHours() * 60 + d.getUTCMinutes();
      return (utcMin + 8 * 60) % 1440;
    }
  };

  const getOutletOpenStatus = (outlet, nowDate) => {
    if (!outlet || outlet.isOpen === false) {
      return { isOpen: false, is24h: false, reason: "manual" };
    }
    const hoursStr = String(outlet.hours || "").trim();
    if (/24\s*jam|24h|24\s*hours/i.test(hoursStr)) {
      return { isOpen: true, is24h: true, reason: "24h" };
    }
    const match = hoursStr.match(/(\d{1,2})[:.](\d{2})\s*(?:-|–|—|s\/d)\s*(\d{1,2})[:.](\d{2})/i);
    if (!match) {
      return { isOpen: true, is24h: false, reason: "default" };
    }
    const openMin = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
    const closeMin = parseInt(match[3], 10) * 60 + parseInt(match[4], 10);
    const nowMin = getWitaMinutes(nowDate);
    let isOpen = true;
    if (closeMin === openMin) {
      isOpen = true;
    } else if (closeMin > openMin) {
      isOpen = nowMin >= openMin && nowMin < closeMin;
    } else {
      isOpen = nowMin >= openMin || nowMin < closeMin;
    }
    return { isOpen, is24h: false, reason: isOpen ? "schedule" : "closed_hours" };
  };

  window.DLM_UTIL = {
    esc, rp, num, clamp, debounce, uid, formatDateID, formatTimeID,
    storage, normalizePhone, isValidPhone, initials, scrollTop, imageTag, getDeviceId,
    haversineKm, formatDistanceKm, scoreOutletSearch, getWitaMinutes, getOutletOpenStatus
  };
})();
