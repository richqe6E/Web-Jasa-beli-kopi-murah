/* ============================================================
   JASDOR RISGOLD - DIGITAL RECEIPT PREVIEW & JPG EXPORTER
   Zero-dependency pure Canvas 2D high-DPI (2x) JPG generator
   ============================================================ */
(function () {
  "use strict";

  const CFG = window.DLM_CONFIG || {};
  const U = window.DLM_UTIL;
  const WA = window.DLM_WA;

  function formatReceiptDate(isoOrDate) {
    const d = isoOrDate ? new Date(isoOrDate) : new Date();
    try {
      const datePart = d.toLocaleDateString("id-ID", {
        timeZone: "Asia/Makassar",
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
      const timePart = d.toLocaleTimeString("id-ID", {
        timeZone: "Asia/Makassar",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).replace(".", ":");
      return `${datePart}, ${timePart} WITA`;
    } catch (e) {
      return `${U.formatDateID(d)}, ${U.formatTimeID(d)}`;
    }
  }

  function normalizeReceiptOrder(order) {
    const o = order || {};
    const cust = o.customer || {};
    const items = (o.items || o.localItems || o.order_items || []).map(item => {
      const qty = Number(item.quantity || 1);
      const unitPrice = Number(item.unitPrice != null ? item.unitPrice : (item.unit_selling_price || 0));
      const parsed = WA && typeof WA.parseSelections === "function"
        ? WA.parseSelections(item.selections)
        : { isBundle: false, bundleDrinks: [], bundleFoods: [], inlineSummary: "" };
      return {
        name: item.name || item.item_name || "Menu",
        quantity: qty,
        unitPrice,
        lineTotal: unitPrice * qty,
        parsed,
        notes: String(item.notes != null ? item.notes : (item.item_notes || "")).trim()
      };
    });

    const isDelivery = (o.mode || o.order_mode) === "delivery";
    const pickupRaw = cust.pickupTime || o.pickupTime || o.pickup_time || "Sekarang";
    const pickupLabel = WA && typeof WA.normalizePickupLabel === "function"
      ? WA.normalizePickupLabel(pickupRaw)
      : pickupRaw;

    return {
      orderId: o.orderId || o.order_code || "DLM-ORDER",
      dateStr: formatReceiptDate(o.date || o.created_at),
      brandName: o.brandName || o.brand_name || "JasDor RisGold",
      outletName: o.outletName || o.outlet_name || "-",
      customerName: cust.name || o.customerName || o.customer_name || "Pelanggan",
      customerPhone: U.normalizePhone(cust.phone || o.customerPhone || o.customer_phone || "") || "-",
      modeLabel: isDelivery ? `Delivery (${pickupLabel})` : `Pickup (${pickupLabel})`,
      deliveryAddress: isDelivery ? (cust.address || o.deliveryAddress || o.delivery_address || "") : "",
      customerNotes: cust.notes || o.customerNotes || o.customer_notes || "",
      serviceFee: Number(o.orderServiceFee != null ? o.orderServiceFee : (o.order_service_fee || 0)),
      savings: Number(o.totalSavings != null ? o.totalSavings : (o.customer_savings || 0)),
      total: Number(o.total != null ? o.total : (o.final_paid_total || o.checkout_total || 0)),
      items
    };
  }

  function renderReceiptHtml(order) {
    const r = normalizeReceiptOrder(order);
    const appTitle = CFG.appName || "JasDor RisGold";

    const itemsHtml = r.items.map(item => {
      let detailHtml = "";
      if (item.parsed.isBundle) {
        const dLine = item.parsed.bundleDrinks.length
          ? `<div><strong>Minuman:</strong> ${U.esc(item.parsed.bundleDrinks.join(", "))}</div>`
          : "";
        const fLine = item.parsed.bundleFoods.length
          ? `<div><strong>Makanan:</strong> ${U.esc(item.parsed.bundleFoods.join(", "))}</div>`
          : "";
        detailHtml = `<div class="receipt-item-opts">${dLine}${fLine}</div>`;
      } else if (item.parsed.inlineSummary) {
        detailHtml = `<div class="receipt-item-opts">${U.esc(item.parsed.inlineSummary)}</div>`;
      }
      const noteHtml = item.notes
        ? `<div class="receipt-item-note">Catatan: ${U.esc(item.notes)}</div>`
        : "";

      return `
        <div class="receipt-item-row">
          <div class="receipt-item-main">
            <strong>${item.quantity}x ${U.esc(item.name)}</strong>
            ${detailHtml}
            ${noteHtml}
          </div>
          <div class="receipt-item-price">${U.rp(item.lineTotal)}</div>
        </div>
      `;
    }).join("");

    return `
      <div class="receipt-paper" id="jasdor-receipt-paper">
        <div class="receipt-paper-head">
          <div class="receipt-brand-row">
            <img src="src/assets/app-icon-64.png" alt="${U.esc(appTitle)}" class="receipt-brand-icon" width="32" height="32" />
            <div class="receipt-brand-title">${U.esc(appTitle)}</div>
          </div>
          <div class="receipt-subtitle">INVOICE PEMESANAN</div>
          <div class="receipt-code-pill">#${U.esc(r.orderId)}</div>
          <div class="receipt-date">${U.esc(r.dateStr)}</div>
        </div>

        <div class="receipt-meta">
          <div class="receipt-meta-line"><strong>Nama:</strong> <span>${U.esc(r.customerName)}</span></div>
          <div class="receipt-meta-line"><strong>WhatsApp:</strong> <span>${U.esc(r.customerPhone)}</span></div>
          <div class="receipt-meta-line"><strong>Brand:</strong> <span>${U.esc(r.brandName)}</span></div>
          <div class="receipt-meta-line"><strong>Outlet:</strong> <span>${U.esc(r.outletName)}</span></div>
          <div class="receipt-meta-line"><strong>Metode:</strong> <span>${U.esc(r.modeLabel)}</span></div>
          ${r.deliveryAddress ? `<div class="receipt-meta-line"><strong>Alamat:</strong> <span>${U.esc(r.deliveryAddress)}</span></div>` : ""}
          ${r.customerNotes ? `<div class="receipt-meta-line"><strong>Catatan:</strong> <span>${U.esc(r.customerNotes)}</span></div>` : ""}
        </div>

        <div class="receipt-items">
          ${itemsHtml || `<div class="receipt-item-row"><span>Pesanan #${U.esc(r.orderId)}</span><strong>${U.rp(r.total)}</strong></div>`}
        </div>

        <div class="receipt-totals">
          ${r.serviceFee > 0 ? `
            <div class="receipt-sub-row">
              <span>Biaya Layanan</span>
              <span>${U.rp(r.serviceFee)}</span>
            </div>
          ` : `
            <div class="receipt-sub-row">
              <span>Biaya Admin</span>
              <span class="is-free">GRATIS (Rp 0)</span>
            </div>
          `}
          ${r.savings > 0 ? `
            <div class="receipt-sub-row">
              <span>Hemat Promo</span>
              <span class="is-free">-${U.rp(r.savings)}</span>
            </div>
          ` : ""}
          <div class="receipt-grand-row">
            <span>TOTAL</span>
            <span>${U.rp(r.total)}</span>
          </div>
        </div>

        <div class="receipt-paper-foot">
          <div>Terima kasih telah memesan di ${U.esc(appTitle)}</div>
          <small>jasdor.web.id • Simpan struk ini sebagai bukti pesanan</small>
        </div>
      </div>
    `;
  }

  /* ------------------------------------------------------------
     CANVAS 2D HELPERS FOR CRISP 2X RETINA JPG EXPORT
     ------------------------------------------------------------ */

  function loadImageSafe(src) {
    return new Promise(resolve => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  function wrapText(ctx, text, maxWidth) {
    const raw = String(text || "").trim();
    if (!raw) return [];
    const words = raw.split(/\s+/);
    const lines = [];
    let current = "";
    for (let i = 0; i < words.length; i++) {
      const test = current ? `${current} ${words[i]}` : words[i];
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = words[i];
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  function drawRoundedRect(ctx, x, y, w, h, r) {
    const rad = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  }

  function drawDashedLine(ctx, x1, y, x2, color) {
    ctx.save();
    ctx.strokeStyle = color || "#CBD5E1";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();
    ctx.restore();
  }

  async function renderReceiptToJpgDataUrl(order) {
    const r = normalizeReceiptOrder(order);
    const appTitle = CFG.appName || "JasDor RisGold";
    const W = 760; // logical px -> crisp HD JPG
    const PAD_OUTER = 36;
    const CARD_X = PAD_OUTER;
    const CARD_W = W - PAD_OUTER * 2;
    const INNER_PAD = 40;
    const CONTENT_X = CARD_X + INNER_PAD;
    const CONTENT_W = CARD_W - INNER_PAD * 2;
    const PRICE_COL_W = 155;
    const ITEM_TEXT_W = CONTENT_W - PRICE_COL_W - 16;

    const fontSans = "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

    // Measure pass using offscreen canvas
    const measureCanvas = document.createElement("canvas");
    const mctx = measureCanvas.getContext("2d");

    const metaRows = [
      { label: "Nama:", value: r.customerName },
      { label: "WhatsApp:", value: r.customerPhone },
      { label: "Brand:", value: r.brandName },
      { label: "Outlet:", value: r.outletName },
      { label: "Metode:", value: r.modeLabel }
    ];
    if (r.deliveryAddress) metaRows.push({ label: "Alamat:", value: r.deliveryAddress });
    if (r.customerNotes) metaRows.push({ label: "Catatan:", value: r.customerNotes });

    mctx.font = `500 22px ${fontSans}`;
    const measuredMeta = metaRows.map(row => {
      const wrapped = wrapText(mctx, row.value, CONTENT_W - 140);
      return { label: row.label, lines: wrapped.length ? wrapped : ["-"] };
    });

    const measuredItems = r.items.map(item => {
      mctx.font = `700 23px ${fontSans}`;
      const titleLines = wrapText(mctx, `${item.quantity}x ${item.name}`, ITEM_TEXT_W);

      mctx.font = `500 18px ${fontSans}`;
      const subLines = [];
      if (item.parsed.isBundle) {
        if (item.parsed.bundleDrinks.length) {
          subLines.push(...wrapText(mctx, `Minuman: ${item.parsed.bundleDrinks.join(", ")}`, ITEM_TEXT_W));
        }
        if (item.parsed.bundleFoods.length) {
          subLines.push(...wrapText(mctx, `Makanan: ${item.parsed.bundleFoods.join(", ")}`, ITEM_TEXT_W));
        }
      } else if (item.parsed.inlineSummary) {
        subLines.push(...wrapText(mctx, item.parsed.inlineSummary, ITEM_TEXT_W));
      }
      if (item.notes) {
        subLines.push(...wrapText(mctx, `Catatan: ${item.notes}`, ITEM_TEXT_W));
      }
      return {
        titleLines,
        subLines,
        priceText: U.rp(item.lineTotal)
      };
    });

    // Compute exact dynamic height
    let cardH = 0;
    cardH += 44; // top padding
    cardH += 178; // header (logo + title + subtitle + order pill + date + divider)
    cardH += 22; // meta top gap
    measuredMeta.forEach(m => {
      cardH += m.lines.length * 30 + 6;
    });
    cardH += 26; // meta bottom + divider
    cardH += 24; // items top gap
    measuredItems.forEach(it => {
      cardH += it.titleLines.length * 30;
      if (it.subLines.length) cardH += it.subLines.length * 24 + 4;
      cardH += 20;
    });
    cardH += 22; // divider before totals
    cardH += 36; // admin/service fee line
    if (r.savings > 0) cardH += 34; // savings line
    cardH += 62; // grand total
    cardH += 92; // footer + bottom padding

    const H = cardH + PAD_OUTER * 2;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    // Soft Royal Blue-tinted background frame
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, "#EBF4FF");
    bgGrad.addColorStop(1, "#F4F8FC");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Subtle card shadow + white receipt paper
    ctx.save();
    ctx.shadowColor = "rgba(15, 23, 42, 0.10)";
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 10;
    drawRoundedRect(ctx, CARD_X, PAD_OUTER, CARD_W, cardH, 28);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.restore();

    // Subtle top accent bar (Royal Blue -> Gold)
    ctx.save();
    drawRoundedRect(ctx, CARD_X, PAD_OUTER, CARD_W, cardH, 28);
    ctx.clip();
    const accentGrad = ctx.createLinearGradient(CARD_X, 0, CARD_X + CARD_W, 0);
    accentGrad.addColorStop(0, "#0B6BCB");
    accentGrad.addColorStop(0.7, "#1D8CF8");
    accentGrad.addColorStop(1, "#D97706");
    ctx.fillStyle = accentGrad;
    ctx.fillRect(CARD_X, PAD_OUTER, CARD_W, 10);
    ctx.restore();

    let y = PAD_OUTER + 48;

    // Logo + App Name centered
    const logoImg = await loadImageSafe("src/assets/app-icon-192.png");
    ctx.font = `800 32px ${fontSans}`;
    const titleW = ctx.measureText(appTitle).width;
    const iconSize = logoImg ? 42 : 0;
    const gap = logoImg ? 12 : 0;
    const totalBrandW = iconSize + gap + titleW;
    const startBrandX = (W - totalBrandW) / 2;

    if (logoImg) {
      ctx.save();
      drawRoundedRect(ctx, startBrandX, y - 32, iconSize, iconSize, 10);
      ctx.clip();
      ctx.drawImage(logoImg, startBrandX, y - 32, iconSize, iconSize);
      ctx.restore();
    }
    ctx.fillStyle = "#0B6BCB";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(appTitle, startBrandX + iconSize + gap, y);

    y += 34;
    ctx.font = `700 18px ${fontSans}`;
    ctx.fillStyle = "#64748B";
    ctx.textAlign = "center";
    ctx.fillText("INVOICE PEMESANAN", W / 2, y);

    // Order Code Pill
    y += 18;
    const codeText = `#${r.orderId}`;
    ctx.font = `800 20px 'JetBrains Mono', monospace, ${fontSans}`;
    const pillW = Math.max(180, ctx.measureText(codeText).width + 38);
    const pillH = 38;
    drawRoundedRect(ctx, (W - pillW) / 2, y, pillW, pillH, 19);
    ctx.fillStyle = "#EFF6FF";
    ctx.fill();
    ctx.strokeStyle = "#BFDBFE";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = "#0B6BCB";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(codeText, W / 2, y + pillH / 2 + 1);

    y += pillH + 24;
    ctx.font = `500 17px ${fontSans}`;
    ctx.fillStyle = "#94A3B8";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(r.dateStr, W / 2, y);

    y += 24;
    drawDashedLine(ctx, CONTENT_X, y, CONTENT_X + CONTENT_W, "#CBD5E1");
    y += 32;

    // Customer & Outlet Meta
    ctx.textAlign = "left";
    measuredMeta.forEach(row => {
      ctx.font = `700 21px ${fontSans}`;
      ctx.fillStyle = "#334155";
      ctx.fillText(row.label, CONTENT_X, y);

      ctx.font = `500 21px ${fontSans}`;
      ctx.fillStyle = "#0F172A";
      row.lines.forEach((line, idx) => {
        ctx.fillText(line, CONTENT_X + 132, y + idx * 30);
      });
      y += row.lines.length * 30 + 6;
    });

    y += 14;
    drawDashedLine(ctx, CONTENT_X, y, CONTENT_X + CONTENT_W, "#CBD5E1");
    y += 34;

    // Items list
    measuredItems.forEach(item => {
      const startY = y;
      ctx.font = `700 23px ${fontSans}`;
      ctx.fillStyle = "#0F172A";
      ctx.textAlign = "left";
      item.titleLines.forEach((line, idx) => {
        ctx.fillText(line, CONTENT_X, startY + idx * 30);
      });

      ctx.textAlign = "right";
      ctx.fillText(item.priceText, CONTENT_X + CONTENT_W, startY);

      y = startY + item.titleLines.length * 30;
      if (item.subLines.length) {
        ctx.font = `500 18px ${fontSans}`;
        ctx.fillStyle = "#64748B";
        ctx.textAlign = "left";
        y += 2;
        item.subLines.forEach(line => {
          ctx.fillText(line, CONTENT_X, y);
          y += 24;
        });
      }
      y += 16;
    });

    drawDashedLine(ctx, CONTENT_X, y, CONTENT_X + CONTENT_W, "#CBD5E1");
    y += 34;

    // Fees & Savings
    ctx.font = `600 20px ${fontSans}`;
    ctx.fillStyle = "#64748B";
    ctx.textAlign = "left";
    ctx.fillText(r.serviceFee > 0 ? "Biaya Layanan" : "Biaya Admin", CONTENT_X, y);
    ctx.textAlign = "right";
    ctx.fillStyle = r.serviceFee > 0 ? "#0F172A" : "#059669";
    ctx.fillText(r.serviceFee > 0 ? U.rp(r.serviceFee) : "GRATIS (Rp 0)", CONTENT_X + CONTENT_W, y);
    y += 34;

    if (r.savings > 0) {
      ctx.fillStyle = "#64748B";
      ctx.textAlign = "left";
      ctx.fillText("Hemat Promo", CONTENT_X, y);
      ctx.textAlign = "right";
      ctx.fillStyle = "#059669";
      ctx.fillText(`-${U.rp(r.savings)}`, CONTENT_X + CONTENT_W, y);
      y += 34;
    }

    // Grand Total
    y += 12;
    ctx.font = `800 30px ${fontSans}`;
    ctx.fillStyle = "#0B6BCB";
    ctx.textAlign = "left";
    ctx.fillText("TOTAL", CONTENT_X, y);
    ctx.textAlign = "right";
    ctx.fillText(U.rp(r.total), CONTENT_X + CONTENT_W, y);

    // Footer
    y += 34;
    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(CONTENT_X, y);
    ctx.lineTo(CONTENT_X + CONTENT_W, y);
    ctx.stroke();

    y += 32;
    ctx.textAlign = "center";
    ctx.font = `700 18px ${fontSans}`;
    ctx.fillStyle = "#334155";
    ctx.fillText(`Terima kasih telah memesan di ${appTitle}`, W / 2, y);

    y += 24;
    ctx.font = `500 15px ${fontSans}`;
    ctx.fillStyle = "#94A3B8";
    ctx.fillText("jasdor.web.id • Simpan struk ini sebagai bukti pemesanan", W / 2, y);

    return canvas.toDataURL("image/jpeg", 0.92);
  }

  async function downloadReceiptJpg(order) {
    const r = normalizeReceiptOrder(order);
    const dataUrl = await renderReceiptToJpgDataUrl(order);
    const safeName = String(r.customerName || "order")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 24) || "order";
    const now = new Date();
    const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const filename = `struk-jasdor-risgold-${ymd}-${safeName}.jpg`;

    const link = document.createElement("a");
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return { filename, dataUrl };
  }

  window.DLM_RECEIPT = {
    normalizeReceiptOrder,
    renderReceiptHtml,
    renderReceiptToJpgDataUrl,
    downloadReceiptJpg
  };
})();
