/* ============================================================
   WHATSAPP ORDER ENGINE (CUSTOMER INVOICE + PARTNER FORWARDER)
   ============================================================ */
(function () {
  "use strict";

  const CFG = window.DLM_CONFIG || {};
  const U = window.DLM_UTIL;

  function parseSelections(rawSelections) {
    const list = Array.isArray(rawSelections) ? rawSelections : [];
    const bundleDrinks = [];
    const bundleFoods = [];
    const regularParts = [];

    list.forEach(sel => {
      if (!sel) return;
      const gid = String(sel.groupId || "").toLowerCase();
      const label = String(sel.label || "").trim();
      if (!label) return;
      if (gid.startsWith("bundle-drink")) {
        bundleDrinks.push(label);
      } else if (gid.startsWith("bundle-food")) {
        bundleFoods.push(label);
      } else {
        if (gid === "temp") {
          regularParts.push(label.toUpperCase());
        } else {
          regularParts.push(label);
        }
      }
    });

    const isBundle = bundleDrinks.length > 0 || bundleFoods.length > 0;
    return {
      isBundle,
      bundleDrinks,
      bundleFoods,
      inlineSummary: regularParts.join(" • ")
    };
  }

  function normalizePickupLabel(pickupTime) {
    const raw = String(pickupTime || "").trim();
    if (!raw || /secepatnya|sekarang/i.test(raw)) return "Sekarang";
    return raw;
  }

  function buildReviewUrl(orderId) {
    const base = String(CFG.siteBaseUrl || "https://jasdor.web.id").replace(/\/+$/, "");
    const cleanCode = String(orderId || "").replace(/^#+/, "").trim();
    if (!cleanCode) return `${base}/review`;
    return `${base}/review?order=${encodeURIComponent(cleanCode)}`;
  }

  function formatItemLines(items, opts) {
    const lines = [];
    const isPartner = !!(opts && opts.isPartner);
    (items || []).forEach((item, index) => {
      const qty = Number(item.quantity || 1);
      const name = item.name || item.item_name || "Menu";
      const category = String(item.category || "");
      const brandId = String(item.brandId || item.brand_id || (opts && opts.brandId) || "");
      const unitSelling = Number(item.unitPrice != null ? item.unitPrice : (item.unit_selling_price || 0));

      // For Kopi Kenangan Bundling, our catalog adds +Rp 1.000 over partner price.
      // When forwarding to partner, adjust unit price to match partner catalog price.
      let effectiveUnit = unitSelling;
      if (isPartner && brandId === "kenangan" && /bundling/i.test(category) && effectiveUnit > 1000) {
        effectiveUnit = unitSelling - 1000;
      }
      const lineTotal = effectiveUnit * qty;

      lines.push(`${index + 1}. ${name} x${qty} - ${U.rp(lineTotal)}`);

      const parsed = parseSelections(item.selections);
      if (parsed.isBundle) {
        if (parsed.bundleDrinks.length) {
          lines.push("   *Minuman:*");
          parsed.bundleDrinks.forEach(d => lines.push(`   - ${d}`));
        }
        if (parsed.bundleFoods.length) {
          lines.push("   *Makanan:*");
          parsed.bundleFoods.forEach(f => lines.push(`   - ${f}`));
        }
      } else if (parsed.inlineSummary) {
        lines.push(`   ${parsed.inlineSummary}`);
      }

      const itemNote = String(item.notes != null ? item.notes : (item.item_notes || "")).trim();
      if (itemNote) {
        const indented = itemNote.split(/\r?\n/).map((l, i) => (i === 0 ? l : `   ${l}`)).join("\n");
        lines.push(`   *Catatan:* ${indented}`);
      }
    });
    return lines;
  }

  /* ------------------------------------------------------------
     1. CUSTOMER WHATSAPP INVOICE (BRAND: JASDOR RISGOLD)
     ------------------------------------------------------------ */
  function buildMessage({ orderId, customer, brand, outlet, orderMode, cartSummary, notes }) {
    const brandTitle = CFG.appName || "JasDor RisGold";
    const isDelivery = orderMode === "delivery";
    const cleanPhone = U.normalizePhone(customer.phone) || customer.phone;
    const pickupDisplay = isDelivery
      ? `Delivery (${normalizePickupLabel(customer.pickupTime)})`
      : normalizePickupLabel(customer.pickupTime);
    const payMethods = CFG.customerPaymentMethods || "QRIS / Transfer Bank / E-Wallet (konfirmasi via Admin)";
    const reviewUrl = buildReviewUrl(orderId);

    const lines = [];
    lines.push(`Halo Admin ${brandTitle} 👋`);
    lines.push("Saya ingin melakukan pemesanan.");
    lines.push("");
    lines.push("======================");
    lines.push("INVOICE PEMESANAN");
    lines.push("======================");
    lines.push(`No. Order: #${orderId}`);
    lines.push("");
    lines.push("DATA PEMBELI:");
    lines.push(`- Nama: ${customer.name}`);
    lines.push(`- No. WhatsApp: ${cleanPhone}`);
    lines.push(`- Brand: ${brand ? brand.name : "-"}`);
    lines.push(`- Nama Outlet: ${outlet ? outlet.name : "-"}`);
    lines.push(`- ${isDelivery ? "Pengantaran" : "Pickup"}: ${pickupDisplay}`);
    if (isDelivery && customer.address) {
      lines.push(`- Alamat: ${customer.address}`);
    }
    if (notes) {
      lines.push(`- Catatan: ${notes}`);
    }
    lines.push("");
    lines.push("DETAIL PESANAN:");
    lines.push(...formatItemLines(cartSummary.items, { isPartner: false, brandId: brand && brand.id }));
    lines.push("");
    lines.push("----------------------");
    if (Number(cartSummary.orderServiceFee || 0) > 0) {
      lines.push(`BIAYA LAYANAN: ${U.rp(cartSummary.orderServiceFee)}`);
    }
    lines.push(`TOTAL: ${U.rp(cartSummary.grandTotal)}`);
    lines.push("----------------------");
    lines.push("");
    lines.push("METODE PEMBAYARAN:");
    lines.push(payMethods);
    lines.push("");
    lines.push(`Bagikan testimoni & foto minumanmu untuk ${brandTitle} setelah pesanan diterima, ya!`);
    lines.push(`Link Testimoni: ${reviewUrl}`);
    lines.push("");
    lines.push(`Terima kasih sudah memesan lewat ${brandTitle}!`);

    return lines.join("\n");
  }

  /* ------------------------------------------------------------
     2. PARTNER FORWARDING FORMAT (ADMIN -> PARTNER 1-TAP SHARE)
     ------------------------------------------------------------ */
  function buildPartnerMessage(order, settingsOverride) {
    const s = settingsOverride || {};
    const partnerName = s.partner_name || CFG.partnerName || "Jasdor Moulii";
    const useAdminPhone = s.partner_use_admin_phone != null ? !!s.partner_use_admin_phone : !!CFG.partnerUseAdminPhone;
    const adminPhone = U.normalizePhone(s.admin_whatsapp || CFG.adminWhatsApp || "");
    const custPhone = U.normalizePhone(order.customer_phone || (order.customer && order.customer.phone) || "");
    const finalPhone = (useAdminPhone && adminPhone) ? adminPhone : (custPhone || adminPhone || "-");
    const payMethods = s.partner_payment_methods || CFG.partnerPaymentMethods || "BCA / GoPay / Dana / QRIS";

    const brandId = String(order.brand_id || order.brandId || "");
    const outletName = order.outlet_name || order.outletName || "-";
    const outletArea = order.outlet_area || "";
    const outletDisplay = outletArea && !outletName.toLowerCase().includes(outletArea.toLowerCase())
      ? `${outletName} - ${outletArea}`
      : outletName;
    const pickupDisplay = normalizePickupLabel(order.pickup_time || order.pickupTime);
    const customerName = order.customer_name || (order.customer && order.customer.name) || "Pelanggan";
    const customerNotes = String(order.customer_notes || order.notes || "").trim();
    const rawItems = order.order_items || order.items || [];

    // Recompute partner subtotal (subtracting +Rp 1.000 KopKen Bundling markup)
    let partnerSubtotal = 0;
    rawItems.forEach(item => {
      const qty = Number(item.quantity || 1);
      const unitSelling = Number(item.unitPrice != null ? item.unitPrice : (item.unit_selling_price || 0));
      const category = String(item.category || "");
      let effectiveUnit = unitSelling;
      if (brandId === "kenangan" && /bundling/i.test(category) && effectiveUnit > 1000) {
        effectiveUnit = unitSelling - 1000;
      }
      partnerSubtotal += effectiveUnit * qty;
    });

    const adminFee = Number(order.order_service_fee != null ? order.order_service_fee : (order.orderServiceFee || 0));
    const partnerTotal = rawItems.length
      ? partnerSubtotal + adminFee
      : Number(order.final_paid_total || order.checkout_total || order.total || 0);

    const lines = [];
    lines.push(`Halo Admin ${partnerName}.`);
    lines.push("Saya ingin melakukan pemesanan.");
    lines.push("");
    lines.push("======================");
    lines.push("INVOICE PEMESANAN");
    lines.push("======================");
    lines.push("");
    lines.push("DATA PEMBELI:");
    lines.push(`- Nama: ${customerName}`);
    lines.push(`- No. WhatsApp: ${finalPhone}`);
    lines.push(`- Nama Outlet: ${outletDisplay}`);
    lines.push(`- Pickup: ${pickupDisplay}`);
    if (order.order_mode === "delivery" && order.delivery_address) {
      lines.push(`- Alamat Delivery: ${order.delivery_address}`);
    }
    if (customerNotes) {
      lines.push(`- Catatan: ${customerNotes}`);
    }
    lines.push("");
    lines.push("DETAIL PESANAN:");
    if (rawItems.length) {
      lines.push(...formatItemLines(rawItems, { isPartner: true, brandId }));
    } else {
      lines.push(`1. Pesanan #${order.order_code || "-"} (${order.items_count || 1} item) - ${U.rp(partnerTotal)}`);
    }
    lines.push("");
    lines.push("----------------------");
    if (adminFee > 0) {
      lines.push(`ADMIN FEE: ${U.rp(adminFee)}`);
    }
    lines.push(`TOTAL: ${U.rp(partnerTotal)}`);
    lines.push("----------------------");
    lines.push("");
    lines.push("METODE PEMBAYARAN:");
    lines.push(payMethods);

    return lines.join("\n");
  }

  function buildUrl(message, customPhone) {
    const phone = U.normalizePhone(customPhone || CFG.adminWhatsApp || "").replace(/\D/g, "");
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }

  function buildPartnerUrl(order, settingsOverride, customMessage) {
    const s = settingsOverride || {};
    const partnerPhone = U.normalizePhone(s.partner_whatsapp || CFG.partnerWhatsApp || "").replace(/\D/g, "");
    const msg = customMessage != null ? customMessage : buildPartnerMessage(order, s);
    return `https://wa.me/${partnerPhone}?text=${encodeURIComponent(msg)}`;
  }

  function openWhatsApp(message, customPhone) {
    const url = buildUrl(message, customPhone);
    const win = window.open(url, "_blank", "noopener,noreferrer");
    return { url, blocked: !win };
  }

  function openPartnerWhatsApp(order, settingsOverride, customMessage) {
    const url = buildPartnerUrl(order, settingsOverride, customMessage);
    const win = window.open(url, "_blank", "noopener,noreferrer");
    return { url, blocked: !win };
  }

  function fallbackCopy(message) {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = message;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      return ok;
    } catch (e) {
      return false;
    }
  }

  function copyMessage(message) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(message).then(() => true).catch(() => fallbackCopy(message));
    }
    return Promise.resolve(fallbackCopy(message));
  }

  function saveOrder(order) {
    const history = U.storage.get(CFG.storageKeys.orders, []);
    const filtered = (Array.isArray(history) ? history : []).filter(o => o && o.orderId !== order.orderId);
    filtered.unshift(order);
    U.storage.set(CFG.storageKeys.orders, filtered.slice(0, 15));
  }

  function getOrders() {
    const history = U.storage.get(CFG.storageKeys.orders, []);
    return Array.isArray(history) ? history : [];
  }

  function getLastOrder() {
    return getOrders()[0] || null;
  }

  function createOrderId() {
    return U.uid(CFG.orderPrefix);
  }

  window.DLM_WA = {
    parseSelections,
    normalizePickupLabel,
    buildReviewUrl,
    buildMessage,
    buildPartnerMessage,
    buildUrl,
    buildPartnerUrl,
    openWhatsApp,
    openPartnerWhatsApp,
    copyMessage,
    saveOrder,
    getOrders,
    getLastOrder,
    createOrderId
  };
})();
