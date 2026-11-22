/* ============================================================
   WHATSAPP ORDER ENGINE
   ============================================================ */
(function () {
  "use strict";

  const CFG = window.DLM_CONFIG;
  const U = window.DLM_UTIL;

  function groupSelections(selections) {
    const map = {};
    (selections || []).forEach(selection => {
      if (!map[selection.groupLabel]) map[selection.groupLabel] = [];
      map[selection.groupLabel].push(selection);
    });
    return map;
  }

  function optionLine(label, selections) {
    if (!selections || !selections.length) return "";
    const values = selections.map(selection => {
      if (selection.note && selection.groupId === "size") {
        return `${selection.label} (${selection.note})`;
      }
      return selection.label;
    });
    return `${label}: ${values.join(", ")}`;
  }

  function buildMessage({ orderId, customer, brand, outlet, orderMode, cartSummary, notes }) {
    const now = new Date();
    const modeLabel = orderMode === "delivery" ? "Dikirim driver" : "Ambil sendiri di outlet";
    const lines = [];

    lines.push(`*${(CFG.appName || "Dibeliin Lebih Murah").toUpperCase()}*`);
    lines.push(`Pesanan baru • #${orderId}`);
    lines.push(`${U.formatDateID(now)} • ${U.formatTimeID(now)}`);
    lines.push("");

    lines.push("*PELANGGAN*");
    lines.push(`Nama: ${customer.name}`);
    lines.push(`WhatsApp: ${customer.phone}`);
    lines.push(`Metode: ${modeLabel}`);
    lines.push(`Waktu: ${customer.pickupTime || "Secepatnya"}`);
    if (orderMode === "delivery" && customer.address) {
      lines.push(`Alamat: ${customer.address}`);
    }
    lines.push("");

    lines.push("*OUTLET*");
    lines.push(`${brand.name} — ${outlet.name}`);
    lines.push(`${outlet.address}`);
    lines.push(`${outlet.area}, ${CFG.city}`);
    lines.push("");

    lines.push("*RINCIAN PESANAN*");
    cartSummary.items.forEach((item, index) => {
      lines.push(`${index + 1}. ${item.name}`);
      const grouped = groupSelections(item.selections);
      Object.keys(grouped).forEach(label => {
        const line = optionLine(label, grouped[label]);
        if (line) lines.push(`   ${line}`);
      });
      if (item.notes) lines.push(`   Catatan: "${item.notes}"`);
      lines.push(`   ${item.quantity} x ${U.rp(item.unitPrice)} = ${U.rp(item.unitPrice * item.quantity)}`);
      lines.push("");
    });

    lines.push("*RINGKASAN*");
    lines.push(`Subtotal: ${U.rp(cartSummary.subtotal)}`);
    if (cartSummary.orderServiceFee > 0) {
      lines.push(`Biaya jasa order: ${U.rp(cartSummary.orderServiceFee)}`);
    } else {
      lines.push("Harga sudah termasuk biaya jasa.");
    }
    if (cartSummary.totalSavings > 0) {
      lines.push(`Hemat promo: -${U.rp(cartSummary.totalSavings)}`);
    }
    lines.push(`*Total: ${U.rp(cartSummary.grandTotal)}*`);
    lines.push("");

    if (notes) {
      lines.push("*CATATAN*");
      lines.push(notes);
      lines.push("");
    }

    lines.push("*PEMBAYARAN*");
    lines.push(CFG.paymentNote);
    lines.push("");
    lines.push("Mohon konfirmasi ketersediaan menu dan total akhir sebelum diproses. Terima kasih!");

    return lines.join("\n");
  }

  function buildUrl(message) {
    const phone = String(CFG.adminWhatsApp || "").replace(/\D/g, "");
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }

  function openWhatsApp(message) {
    const url = buildUrl(message);
    const win = window.open(url, "_blank", "noopener,noreferrer");
    return { url, blocked: !win };
  }

  function copyMessage(message) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(message).then(() => true).catch(() => false);
    }
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
      return Promise.resolve(ok);
    } catch (e) {
      return Promise.resolve(false);
    }
  }

  function saveOrder(order) {
    const history = U.storage.get(CFG.storageKeys.orders, []);
    history.unshift(order);
    U.storage.set(CFG.storageKeys.orders, history.slice(0, 12));
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
    buildMessage,
    buildUrl,
    openWhatsApp,
    copyMessage,
    saveOrder,
    getOrders,
    getLastOrder,
    createOrderId
  };
})();
