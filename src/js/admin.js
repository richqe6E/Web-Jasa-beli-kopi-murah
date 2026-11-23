/* ============================================================
   DIBELIIN LEBIH MURAH — ADMIN & FINANCIAL SUITE CONTROLLER
   ============================================================ */
(function () {
  "use strict";

  const CFG = window.DLM_CONFIG || {};
  const U = window.DLM_UTIL;
  const ICON = window.DLM_ICONS;
  const SB = window.DLM_SUPABASE;
  const WA = window.DLM_WA;
  const PARTNER_LOCAL_KEY = "dlm_partner_settings_fallback_v1";

  function getEffectiveSettings() {
    const db = state.dataset.settings || {};
    const local = U.storage.get(PARTNER_LOCAL_KEY, {}) || {};
    return Object.assign({
      partner_name: CFG.partnerName || "Jasdor Moulii",
      partner_whatsapp: CFG.partnerWhatsApp || "6281521692248",
      partner_payment_methods: CFG.partnerPaymentMethods || "BCA / GoPay / Dana / QRIS",
      partner_use_admin_phone: !!CFG.partnerUseAdminPhone,
      customer_payment_methods: CFG.customerPaymentMethods || "QRIS / Transfer Bank / E-Wallet (konfirmasi via Admin)"
    }, local, db);
  }

  const state = {
    user: null,
    loading: true,
    activeTab: "finance",
    periodFilter: "all",
    scopeFilter: "valid", // "valid" (all non-cancelled) | "completed" | "all"
    orderStatusFilter: "all",
    orderQuery: "",
    menuBrandFilter: "all",
    menuQuery: "",
    outletBrandFilter: "all",
    dataset: {
      settings: null,
      brands: [],
      outlets: [],
      menuItems: [],
      orders: [],
      testimonials: []
    }
  };

  const $ = (sel, root) => (root || document).querySelector(sel);

  function toast(msg, type) {
    const root = $("#admin-toast-root");
    if (!root) return;
    root.innerHTML = `
      <div class="admin-toast ${type === "error" ? "is-error" : ""}">
        ${ICON.icon(type === "error" ? "circle-alert" : "circle-check", "w-4 h-4", 2.3)}
        <span>${U.esc(msg)}</span>
      </div>
    `;
    setTimeout(() => {
      if (root) root.innerHTML = "";
    }, 3200);
  }

  function statusLabel(st) {
    if (st === "completed") return "Selesai";
    if (st === "processing") return "Diproses";
    if (st === "cancelled") return "Dibatalkan";
    return "Menunggu WA";
  }

  async function init() {
    document.addEventListener("click", handleClick);
    document.addEventListener("input", handleInput);
    document.addEventListener("change", handleChange);
    document.addEventListener("submit", handleSubmit);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeAdminModal();
    });

    const user = await SB.verifyAdminSession();
    state.user = user;
    state.loading = false;

    if (user) {
      await reloadData();
    } else {
      render();
    }
  }

  async function reloadData() {
    try {
      const data = await SB.fetchAdminDataset();
      state.dataset = data;
      render();
    } catch (err) {
      toast("Gagal memuat data dari Supabase: " + err.message, "error");
      render();
    }
  }

  /* ------------------------------------------------------------
     FILTERING & FINANCIAL AGGREGATION
     ------------------------------------------------------------ */

  function getFilteredOrdersForFinance() {
    const now = new Date();
    return (state.dataset.orders || []).filter(o => {
      if (state.scopeFilter === "completed" && o.status !== "completed") return false;
      if (state.scopeFilter === "valid" && o.status === "cancelled") return false;

      if (state.periodFilter !== "all" && o.created_at) {
        const created = new Date(o.created_at);
        const diffMs = now - created;
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        if (state.periodFilter === "today") {
          if (created.toDateString() !== now.toDateString()) return false;
        } else if (state.periodFilter === "7d" && diffDays > 7) {
          return false;
        } else if (state.periodFilter === "30d" && diffDays > 30) {
          return false;
        }
      }
      return true;
    });
  }

  function computeFinancialMetrics() {
    const orders = getFilteredOrdersForFinance();
    let totalRevenue = 0;
    let totalCost = 0;
    let totalSpreadProfit = 0;
    let totalServiceFeeProfit = 0;
    let totalNetProfit = 0;
    let totalCustomerSavings = 0;
    let totalCups = 0;

    const menuMap = {};
    const outletMap = {};
    const brandMap = {};

    orders.forEach(o => {
      const rev = Number(o.final_paid_total || o.checkout_total || 0);
      const cost = Number(o.total_cost_amount || 0);
      const spread = Number(o.price_spread_profit || 0);
      const fee = Number(o.service_fee_profit || 0);
      const net = Number(o.net_profit || (rev - cost));
      const sav = Number(o.customer_savings || 0);
      const qty = Number(o.items_count || 0);

      totalRevenue += rev;
      totalCost += cost;
      totalSpreadProfit += spread;
      totalServiceFeeProfit += fee;
      totalNetProfit += net;
      totalCustomerSavings += sav;
      totalCups += qty;

      const outKey = o.outlet_id || o.outlet_name || "unknown";
      if (!outletMap[outKey]) {
        outletMap[outKey] = {
          id: outKey,
          name: o.outlet_name || "Outlet",
          brandName: o.brand_name || "-",
          area: o.outlet_area || "Samarinda",
          ordersCount: 0,
          cupsCount: 0,
          revenue: 0,
          cost: 0,
          netProfit: 0
        };
      }
      outletMap[outKey].ordersCount += 1;
      outletMap[outKey].cupsCount += qty;
      outletMap[outKey].revenue += rev;
      outletMap[outKey].cost += cost;
      outletMap[outKey].netProfit += net;

      const bKey = o.brand_id || o.brand_name || "other";
      if (!brandMap[bKey]) {
        brandMap[bKey] = {
          id: bKey,
          name: o.brand_name || "Brand",
          ordersCount: 0,
          cupsCount: 0,
          revenue: 0,
          cost: 0,
          spreadProfit: 0,
          feeProfit: 0,
          netProfit: 0
        };
      }
      brandMap[bKey].ordersCount += 1;
      brandMap[bKey].cupsCount += qty;
      brandMap[bKey].revenue += rev;
      brandMap[bKey].cost += cost;
      brandMap[bKey].spreadProfit += spread;
      brandMap[bKey].feeProfit += fee;
      brandMap[bKey].netProfit += net;

      (o.order_items || []).forEach(it => {
        const mKey = it.menu_item_id || it.item_name;
        if (!menuMap[mKey]) {
          menuMap[mKey] = {
            id: mKey,
            name: it.item_name,
            brandName: o.brand_name || "-",
            category: it.category || "-",
            qtySold: 0,
            revenue: 0,
            cost: 0,
            spreadProfit: 0,
            feeProfit: 0,
            netProfit: 0
          };
        }
        const iQty = Number(it.quantity || 1);
        const iSell = Number(it.line_total_selling || 0);
        const iCost = Number(it.line_total_cost || 0);
        const iSpread = Number(it.line_spread_profit || 0);
        const iFee = Number(it.line_service_fee_profit || 0);
        const iNet = Number(it.line_net_profit || (iSell - iCost));

        menuMap[mKey].qtySold += iQty;
        menuMap[mKey].revenue += iSell;
        menuMap[mKey].cost += iCost;
        menuMap[mKey].spreadProfit += iSpread;
        menuMap[mKey].feeProfit += iFee;
        menuMap[mKey].netProfit += iNet;
      });
    });

    const topMenus = Object.values(menuMap).sort((a, b) => b.qtySold - a.qtySold || b.revenue - a.revenue);
    const topOutlets = Object.values(outletMap).sort((a, b) => b.ordersCount - a.ordersCount || b.revenue - a.revenue);
    const topBrands = Object.values(brandMap).sort((a, b) => b.revenue - a.revenue);

    const marginPercent = totalRevenue > 0 ? ((totalNetProfit / totalRevenue) * 100).toFixed(1) : "0.0";
    const costRatioPercent = totalRevenue > 0 ? ((totalCost / totalRevenue) * 100).toFixed(1) : "0.0";

    return {
      ordersCount: orders.length,
      totalCups,
      totalRevenue,
      totalCost,
      totalSpreadProfit,
      totalServiceFeeProfit,
      totalNetProfit,
      totalCustomerSavings,
      marginPercent,
      costRatioPercent,
      topMenus,
      topOutlets,
      topBrands,
      orders
    };
  }

  /* ------------------------------------------------------------
     RENDER ROOT
     ------------------------------------------------------------ */

  function render() {
    const root = $("#admin-root");
    if (!root) return;

    if (!state.user) {
      root.innerHTML = renderLoginScreen();
      return;
    }

    const appName = (state.dataset.settings && state.dataset.settings.app_name) || CFG.appName || "Dibeliin Lebih Murah";
    document.title = `Admin & Laporan Keuangan — ${appName}`;

    root.innerHTML = `
      <div class="admin-shell">
        <header class="admin-header">
          <div class="admin-header-left">
            <div class="auth-logo">${ICON.icon("layout-dashboard", "w-5 h-5", 2.2)}</div>
            <div>
              <div class="auth-eyebrow">Admin & Financial Console</div>
              <h1 class="auth-title">${U.esc(appName)}</h1>
            </div>
          </div>
          <div class="admin-header-right">
            <a href="index.html" class="btn btn-outline btn-xs">
              ${ICON.icon("external-link", "w-3.5 h-3.5", 2)} Web Pelanggan
            </a>
            <a href="lisensi.html" class="btn btn-outline btn-xs">
              ${ICON.icon("shield-check", "w-3.5 h-3.5", 2)} Lisensi
            </a>
            <button type="button" class="btn btn-soft btn-xs" data-action="refresh-data">
              ${ICON.icon("refresh-cw", "w-3.5 h-3.5", 2)} Sinkronisasi
            </button>
            <button type="button" class="btn btn-danger btn-xs" data-action="logout">
              ${ICON.icon("log-out", "w-3.5 h-3.5", 2)} Keluar
            </button>
          </div>
        </header>

        <nav class="admin-tabs" aria-label="Menu Navigasi Admin">
          <button type="button" class="admin-tab ${state.activeTab === "finance" ? "is-active" : ""}" data-tab="finance">
            ${ICON.icon("bar-chart-3", "w-4 h-4", 2.2)} Laporan Keuangan & Analitik
          </button>
          <button type="button" class="admin-tab ${state.activeTab === "orders" ? "is-active" : ""}" data-tab="orders">
            ${ICON.icon("receipt", "w-4 h-4", 2.2)} Pesanan WA (${(state.dataset.orders || []).length})
          </button>
          <button type="button" class="admin-tab ${state.activeTab === "menus" ? "is-active" : ""}" data-tab="menus">
            ${ICON.icon("calculator", "w-4 h-4", 2.2)} Menu & Aturan Keuntungan (${(state.dataset.menuItems || []).length})
          </button>
          <button type="button" class="admin-tab ${state.activeTab === "outlets" ? "is-active" : ""}" data-tab="outlets">
            ${ICON.icon("store", "w-4 h-4", 2.2)} Outlet (${(state.dataset.outlets || []).length})
          </button>
          <button type="button" class="admin-tab ${state.activeTab === "testimonials" ? "is-active" : ""}" data-tab="testimonials">
            ${ICON.icon("message-circle", "w-4 h-4", 2.2)} Testimoni (${(state.dataset.testimonials || []).length})
          </button>
          <button type="button" class="admin-tab ${state.activeTab === "settings" ? "is-active" : ""}" data-tab="settings">
            ${ICON.icon("settings", "w-4 h-4", 2.2)} Pengaturan & Brand
          </button>
        </nav>

        <main id="admin-main">
          ${renderActiveTab()}
        </main>
      </div>
    `;
  }

  function renderLoginScreen() {
    return `
      <div class="auth-wrap">
        <form id="login-form" class="auth-card">
          <div class="auth-brand">
            <div class="auth-logo">${ICON.icon("lock", "w-5 h-5", 2.2)}</div>
            <div>
              <div class="auth-eyebrow">${U.esc(CFG.appName || "Dibeliin Lebih Murah")}</div>
              <h1 class="auth-title">Login Admin</h1>
            </div>
          </div>
          <p class="auth-sub">Masuk untuk mengelola katalog menu, aturan selisih harga & biaya jasa, rekonsiliasi pesanan WhatsApp, serta laporan keuangan.</p>

          <div class="field" style="margin-bottom:12px">
            <label class="field-label" for="login-email">Email Admin</label>
            <input type="email" id="login-email" class="input" placeholder="admin@dibeliin.id" required autocomplete="username">
          </div>

          <div class="field" style="margin-bottom:16px">
            <label class="field-label" for="login-password">Password</label>
            <input type="password" id="login-password" class="input" placeholder="••••••••••••" required autocomplete="current-password">
          </div>

          <button type="submit" class="btn btn-primary" style="width:100%;min-height:46px">
            ${ICON.icon("shield-check", "w-4 h-4", 2.2)} Masuk ke Dashboard
          </button>

          <div style="margin-top:14px;display:flex;justify-content:center;align-items:center">
            <a href="index.html" style="font-size:12.5px;font-weight:700">← Kembali ke Halaman Pelanggan</a>
          </div>
        </form>
      </div>
    `;
  }

  function renderActiveTab() {
    if (state.activeTab === "finance") return renderFinanceTab();
    if (state.activeTab === "orders") return renderOrdersTab();
    if (state.activeTab === "menus") return renderMenusTab();
    if (state.activeTab === "outlets") return renderOutletsTab();
    if (state.activeTab === "testimonials") return renderTestimonialsTab();
    if (state.activeTab === "settings") return renderSettingsTab();
    return "";
  }

  /* ------------------------------------------------------------
     TAB 1 — FINANCIAL REPORT, PROFIT ENGINE & ANALYTICS
     ------------------------------------------------------------ */

  function renderFinanceTab() {
    const m = computeFinancialMetrics();
    const maxMenuQty = m.topMenus.length ? Math.max(...m.topMenus.map(x => x.qtySold), 1) : 1;
    const maxOutletOrders = m.topOutlets.length ? Math.max(...m.topOutlets.map(x => x.ordersCount), 1) : 1;

    return `
      <section class="panel-card">
        <div class="panel-head">
          <div>
            <p class="panel-eyebrow">Laporan Keuangan & Pembelian</p>
            <h2 class="panel-title">Ringkasan Penjualan, Modal HPP & Keuntungan Bersih</h2>
            <p class="panel-sub">Dihitung otomatis dari transaksi checkout WhatsApp berdasarkan selisih harga jual dengan modal pembelian serta biaya jasa.</p>
          </div>
          <div class="toolbar-row">
            <select id="finance-period" class="select" style="width:auto;min-height:38px" aria-label="Filter periode laporan">
              <option value="all" ${state.periodFilter === "all" ? "selected" : ""}>Semua Waktu</option>
              <option value="today" ${state.periodFilter === "today" ? "selected" : ""}>Hari Ini</option>
              <option value="7d" ${state.periodFilter === "7d" ? "selected" : ""}>7 Hari Terakhir</option>
              <option value="30d" ${state.periodFilter === "30d" ? "selected" : ""}>30 Hari Terakhir</option>
            </select>
            <select id="finance-scope" class="select" style="width:auto;min-height:38px" aria-label="Filter cakupan status">
              <option value="valid" ${state.scopeFilter === "valid" ? "selected" : ""}>Semua Checkout Aktif (Tanpa Batal)</option>
              <option value="completed" ${state.scopeFilter === "completed" ? "selected" : ""}>Hanya Pesanan Selesai</option>
            </select>
            <button type="button" class="btn btn-primary btn-xs" data-action="export-csv">
              ${ICON.icon("download", "w-3.5 h-3.5", 2.2)} Export CSV Keuangan
            </button>
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card is-primary">
            <div class="kpi-top">
              <span class="kpi-label">Total Penjualan (Checkout WA)</span>
              <span class="kpi-icon">${ICON.icon("wallet", "w-4 h-4", 2.2)}</span>
            </div>
            <div class="kpi-value">${U.rp(m.totalRevenue)}</div>
            <div class="kpi-sub">${m.ordersCount} transaksi • ${m.totalCups} item/cup terjual</div>
          </div>

          <div class="kpi-card">
            <div class="kpi-top">
              <span class="kpi-label">Total Modal Pembelian (HPP)</span>
              <span class="kpi-icon">${ICON.icon("shopping-bag", "w-4 h-4", 2.2)}</span>
            </div>
            <div class="kpi-value">${U.rp(m.totalCost)}</div>
            <div class="kpi-sub">Rasio modal ${m.costRatioPercent}% dari omzet penjualan</div>
          </div>

          <div class="kpi-card">
            <div class="kpi-top">
              <span class="kpi-label">Untung Selisih Harga</span>
              <span class="kpi-icon">${ICON.icon("trending-up", "w-4 h-4", 2.2)}</span>
            </div>
            <div class="kpi-value">${U.rp(m.totalSpreadProfit)}</div>
            <div class="kpi-sub">Margin bersih harga menu di luar biaya jasa</div>
          </div>

          <div class="kpi-card">
            <div class="kpi-top">
              <span class="kpi-label">Untung Biaya Jasa</span>
              <span class="kpi-icon">${ICON.icon("hand-coins", "w-4 h-4", 2.2)}</span>
            </div>
            <div class="kpi-value">${U.rp(m.totalServiceFeeProfit)}</div>
            <div class="kpi-sub">Akumulasi biaya jasa order admin</div>
          </div>

          <div class="kpi-card is-highlight">
            <div class="kpi-top">
              <span class="kpi-label">Total Keuntungan Bersih</span>
              <span class="kpi-icon">${ICON.icon("badge-check", "w-4 h-4", 2.2)}</span>
            </div>
            <div class="kpi-value">${U.rp(m.totalNetProfit)}</div>
            <div class="kpi-sub">Selisih Harga + Biaya Jasa (Margin ${m.marginPercent}%)</div>
          </div>

          <div class="kpi-card">
            <div class="kpi-top">
              <span class="kpi-label">Total Penghematan Pelanggan</span>
              <span class="kpi-icon">${ICON.icon("badge-percent", "w-4 h-4", 2.2)}</span>
            </div>
            <div class="kpi-value">${U.rp(m.totalCustomerSavings)}</div>
            <div class="kpi-sub">Selisih dari harga normal resmi di outlet</div>
          </div>
        </div>
      </section>

      <div class="analytics-grid">
        <section class="panel-card" style="margin-bottom:0">
          <div class="panel-head">
            <div>
              <p class="panel-eyebrow">Analitik Produk</p>
              <h3 class="panel-title">Menu Paling Laris (Best Seller Checkout)</h3>
              <p class="panel-sub">Urutan menu dengan jumlah pembelian terbanyak beserta kontribusi keuntungannya.</p>
            </div>
          </div>
          ${m.topMenus.length ? `
            <div class="bar-list">
              ${m.topMenus.slice(0, 6).map((item, idx) => {
                const pct = Math.max(8, Math.round((item.qtySold / maxMenuQty) * 100));
                return `
                  <div class="bar-item">
                    <div class="bar-item-head">
                      <div>
                        <span class="bar-rank">${idx + 1}</span>
                        <span class="bar-title">${U.esc(item.name)}</span>
                        <span class="bar-sub">• ${U.esc(item.brandName)}</span>
                      </div>
                      <span class="bar-metric">${item.qtySold} item</span>
                    </div>
                    <div class="bar-track" aria-hidden="true">
                      <div class="bar-fill" style="width:${pct}%"></div>
                    </div>
                    <div class="bar-foot">
                      <span>Omzet: <strong class="mono">${U.rp(item.revenue)}</strong> (Modal: <span class="mono">${U.rp(item.cost)}</span>)</span>
                      <span style="color:var(--success);font-weight:800">Laba: <span class="mono">+${U.rp(item.netProfit)}</span></span>
                    </div>
                  </div>
                `;
              }).join("")}
            </div>
          ` : `<p style="color:var(--muted)">Belum ada data menu pada periode ini.</p>`}
        </section>

        <section class="panel-card" style="margin-bottom:0">
          <div class="panel-head">
            <div>
              <p class="panel-eyebrow">Analitik Lokasi</p>
              <h3 class="panel-title">Outlet Terbaik &amp; Teramai</h3>
              <p class="panel-sub">Cabang outlet di Samarinda, Balikpapan &amp; Tenggarong yang paling sering dipilih pelanggan.</p>
            </div>
          </div>
          ${m.topOutlets.length ? `
            <div class="bar-list">
              ${m.topOutlets.slice(0, 6).map((out, idx) => {
                const pct = Math.max(10, Math.round((out.ordersCount / maxOutletOrders) * 100));
                return `
                  <div class="bar-item">
                    <div class="bar-item-head">
                      <div>
                        <span class="bar-rank">${idx + 1}</span>
                        <span class="bar-title">${U.esc(out.name)}</span>
                        <span class="bar-sub">• ${U.esc(out.brandName)} (${U.esc(out.area)})</span>
                      </div>
                      <span class="bar-metric">${out.ordersCount} order (${out.cupsCount} item)</span>
                    </div>
                    <div class="bar-track" aria-hidden="true">
                      <div class="bar-fill is-emerald" style="width:${pct}%"></div>
                    </div>
                    <div class="bar-foot">
                      <span>Omzet Checkout: <strong class="mono">${U.rp(out.revenue)}</strong></span>
                      <span style="color:var(--success);font-weight:800">Laba Bersih: <span class="mono">+${U.rp(out.netProfit)}</span></span>
                    </div>
                  </div>
                `;
              }).join("")}
            </div>
          ` : `<p style="color:var(--muted)">Belum ada data outlet pada periode ini.</p>`}
        </section>
      </div>

      <section class="panel-card">
        <div class="panel-head">
          <div>
            <p class="panel-eyebrow">Rincian Per Brand</p>
            <h3 class="panel-title">Laporan Pembelian & Laba per Brand</h3>
          </div>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Brand</th>
                <th>Jumlah Order</th>
                <th>Item Terjual</th>
                <th>Total Penjualan (Checkout)</th>
                <th>Modal Pembelian (HPP)</th>
                <th>Untung Selisih Harga</th>
                <th>Untung Biaya Jasa</th>
                <th>Total Laba Bersih</th>
              </tr>
            </thead>
            <tbody>
              ${m.topBrands.length ? m.topBrands.map(b => `
                <tr>
                  <td><strong>${U.esc(b.name)}</strong></td>
                  <td class="mono">${b.ordersCount} transaksi</td>
                  <td class="mono">${b.cupsCount} item</td>
                  <td class="mono"><strong>${U.rp(b.revenue)}</strong></td>
                  <td class="mono">${U.rp(b.cost)}</td>
                  <td class="mono">${U.rp(b.spreadProfit)}</td>
                  <td class="mono">${U.rp(b.feeProfit)}</td>
                  <td class="mono" style="color:var(--success);font-weight:800">+${U.rp(b.netProfit)}</td>
                </tr>
              `).join("") : `<tr><td colspan="8" style="text-align:center;color:var(--muted)">Belum ada transaksi.</td></tr>`}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  /* ------------------------------------------------------------
     TAB 2 — WHATSAPP ORDERS & CHECKOUT RECONCILIATION
     ------------------------------------------------------------ */

  function renderOrdersTab() {
    const query = (state.orderQuery || "").trim().toLowerCase();
    const list = (state.dataset.orders || []).filter(o => {
      if (state.orderStatusFilter !== "all" && o.status !== state.orderStatusFilter) return false;
      if (query) {
        const hay = `${o.order_code} ${o.customer_name} ${o.customer_phone} ${o.brand_name} ${o.outlet_name}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });

    return `
      <section class="panel-card">
        <div class="panel-head">
          <div>
            <p class="panel-eyebrow">Manajemen Transaksi WhatsApp</p>
            <h2 class="panel-title">Daftar Pesanan Masuk & Rekonsiliasi Nominal Checkout</h2>
            <p class="panel-sub">Karena transaksi akhir diselesaikan di WhatsApp, Anda dapat menyesuaikan status, nominal deal akhir, dan modal aktual di sini.</p>
          </div>
          <div class="toolbar-row">
            <button type="button" class="btn btn-primary btn-xs" data-action="open-manual-order">
              ${ICON.icon("plus", "w-3.5 h-3.5", 2.4)} Input Pesanan WA Manual
            </button>
          </div>
        </div>

        <div class="toolbar-row" style="margin-bottom:14px">
          <input type="search" id="order-search" class="input" style="max-width:300px;min-height:38px" placeholder="Cari kode #DLM, nama, atau nomor WA..." value="${U.esc(state.orderQuery)}">
          <select id="order-status-filter" class="select" style="width:auto;min-height:38px" aria-label="Filter status pesanan">
            <option value="all" ${state.orderStatusFilter === "all" ? "selected" : ""}>Semua Status</option>
            <option value="pending_wa" ${state.orderStatusFilter === "pending_wa" ? "selected" : ""}>Menunggu Konfirmasi WA</option>
            <option value="processing" ${state.orderStatusFilter === "processing" ? "selected" : ""}>Sedang Diproses</option>
            <option value="completed" ${state.orderStatusFilter === "completed" ? "selected" : ""}>Selesai</option>
            <option value="cancelled" ${state.orderStatusFilter === "cancelled" ? "selected" : ""}>Dibatalkan</option>
          </select>
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Kode & Waktu</th>
                <th>Pelanggan</th>
                <th>Brand & Outlet</th>
                <th>Rincian Menu</th>
                <th>Nominal Checkout</th>
                <th>Modal HPP</th>
                <th>Selisih + Jasa = Laba</th>
                <th>Status</th>
                <th>Share ke Partner</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${list.length ? list.map(o => {
                const itemsText = (o.order_items || []).map(i => `${i.quantity}x ${U.esc(i.item_name)}`).join("<br>");
                const waPhone = U.normalizePhone(o.customer_phone);
                return `
                  <tr>
                    <td>
                      <strong class="mono">#${U.esc(o.order_code)}</strong>
                      <div style="font-size:11.5px;color:var(--muted)">${new Date(o.created_at).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
                    </td>
                    <td>
                      <strong>${U.esc(o.customer_name)}</strong>
                      <div style="font-size:11.5px;color:var(--muted)">${U.esc(o.customer_phone)} • ${o.order_mode === "delivery" ? "Delivery" : "Pickup"}</div>
                      ${waPhone ? `<a href="https://wa.me/${U.esc(waPhone)}" target="_blank" rel="noopener" style="font-size:11.5px;font-weight:700;color:var(--wa)">Chat WA →</a>` : ""}
                    </td>
                    <td>
                      <strong>${U.esc(o.brand_name)}</strong>
                      <div style="font-size:11.5px;color:var(--muted)">${U.esc(o.outlet_name)}</div>
                    </td>
                    <td style="font-size:12px;line-height:1.45">${itemsText || `${o.items_count} item`}</td>
                    <td class="mono">
                      <strong>${U.rp(o.final_paid_total)}</strong>
                      ${Number(o.admin_adjustment) !== 0 ? `<div style="font-size:11px;color:var(--muted)">Awal: ${U.rp(o.checkout_total)}</div>` : ""}
                    </td>
                    <td class="mono">${U.rp(o.total_cost_amount)}</td>
                    <td class="mono">
                      <div style="font-size:11px;color:var(--body)">Selisih: ${U.rp(o.price_spread_profit)} | Jasa: ${U.rp(o.service_fee_profit)}</div>
                      <strong style="color:var(--success)">Laba: +${U.rp(o.net_profit)}</strong>
                    </td>
                    <td><span class="status-badge ${U.esc(o.status)}">${statusLabel(o.status)}</span></td>
                    <td>
                      <div style="display:flex;flex-direction:column;gap:5px;min-width:136px">
                        <button type="button" class="btn btn-xs" style="background:#16a34a;color:#fff;border:0;justify-content:center" data-action="share-partner-wa" data-id="${o.id}" title="Kirim langsung pesanan ini ke WhatsApp Partner dengan format partner">
                          ${ICON.brand("whatsapp", "w-3.5 h-3.5")} Kirim ke Partner
                        </button>
                        <div style="display:flex;gap:5px">
                          <button type="button" class="btn btn-soft btn-xs" style="flex:1;justify-content:center" data-action="preview-partner-share" data-id="${o.id}">Preview</button>
                          <button type="button" class="btn btn-outline btn-xs" style="flex:1;justify-content:center" data-action="copy-partner-text" data-id="${o.id}">Salin</button>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style="display:flex;gap:6px;flex-wrap:wrap">
                        ${o.status !== "completed" ? `<button type="button" class="btn btn-success btn-xs" data-action="quick-complete-order" data-id="${o.id}">Selesai</button>` : ""}
                        <button type="button" class="btn btn-soft btn-xs" data-action="edit-order" data-id="${o.id}">Rekonsiliasi</button>
                        <button type="button" class="btn btn-danger btn-xs" data-action="delete-order" data-id="${o.id}" aria-label="Hapus pesanan #${U.esc(o.order_code)}">Hapus</button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join("") : `<tr><td colspan="10" style="text-align:center;color:var(--muted)">Tidak ada pesanan yang cocok.</td></tr>`}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  /* ------------------------------------------------------------
     TAB 3 — MENU CATALOG & PROFIT RULES ENGINE
     ------------------------------------------------------------ */

  function renderMenusTab() {
    const query = (state.menuQuery || "").trim().toLowerCase();
    const items = (state.dataset.menuItems || []).filter(it => {
      if (state.menuBrandFilter !== "all" && it.brand_id !== state.menuBrandFilter) return false;
      if (query) {
        const hay = `${it.name} ${it.category} ${it.description}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });

    const settings = state.dataset.settings || {};

    return `
      <section class="panel-card" style="background:linear-gradient(145deg,#ffffff 35%,#eef6ff 100%);border-color:var(--primary-line)">
        <div class="panel-head">
          <div>
            <p class="panel-eyebrow">Skema Aktif Partner (Sinkron Reseller + Bundling +Rp 1.000)</p>
            <h2 class="panel-title">Aturan Laba Reseller &amp; Biaya Transaksi Partner</h2>
            <p class="panel-sub">
              <strong>Kopi Kenangan:</strong> harga katalog persis partner, paket <strong>Bundling +Rp 1.000</strong> (biaya transaksi Rp 2.000 khusus 1 item reguler) •
              <strong>Janji Jiwa:</strong> fee Rp 1.000/item, biaya admin checkout Rp 0 •
              <strong>Fore Coffee:</strong> harga persis partner, fee dasar Rp 500 (Reguler/Deli) / Rp 1.000 (1L &amp; Large), biaya admin checkout Rp 0.
            </p>
          </div>
          <button type="button" class="btn btn-primary btn-xs" data-action="sync-reseller-hpp">
            ${ICON.icon("refresh-cw", "w-3.5 h-3.5", 2.2)} Terapkan HPP Reseller Opsi 3
          </button>
        </div>

        <details style="margin-top:4px">
          <summary style="font-size:12px;font-weight:700;color:var(--primary-strong);cursor:pointer;user-select:none">
            Buka Kalkulator Masal Persentase (Mode Lanjutan / Override)
          </summary>
          <form id="bulk-profit-form" class="form-grid" style="align-items:end;margin-top:12px">
            <div class="field">
              <label class="field-label" for="rule-brand">Target Brand</label>
              <select id="rule-brand" class="select">
                <option value="all">Semua Brand (${(state.dataset.menuItems || []).length} Menu)</option>
                ${(state.dataset.brands || []).map(b => `<option value="${U.esc(b.id)}">${U.esc(b.name)}</option>`).join("")}
              </select>
            </div>

            <div class="field">
              <label class="field-label" for="rule-cost-ratio">Modal Pembelian / HPP (% Harga Normal)</label>
              <input type="number" id="rule-cost-ratio" class="input mono" value="${Number(settings.default_cost_ratio_percent || 70)}" min="10" max="95" step="1" required>
              <span class="field-hint">Hati-hati: menimpa HPP reseller dengan persentase tetap</span>
            </div>

            <div class="field">
              <label class="field-label" for="rule-service-fee">Biaya Jasa per Item (Rp)</label>
              <input type="number" id="rule-service-fee" class="input mono" value="${Number(settings.default_service_fee_per_item || 0)}" min="0" step="1" required>
              <span class="field-hint">Default 0 karena memakai biaya jasa checkout bertingkat</span>
            </div>

            <div class="field">
              <label class="field-label" for="rule-spread-margin">Target Untung Selisih Harga (Rp)</label>
              <input type="number" id="rule-spread-margin" class="input mono" value="500" min="0" step="1" required>
              <span class="field-hint">Digunakan bila hitung ulang harga jual dicentang</span>
            </div>

            <div class="field">
              <label style="display:flex;align-items:center;gap:8px;font-size:12.5px;font-weight:700;cursor:pointer;margin-bottom:8px">
                <input type="checkbox" id="rule-recalc-selling">
                <span>Hitung ulang Harga Jual Promo otomatis</span>
              </label>
              <button type="submit" class="btn btn-soft" style="width:100%">
                ${ICON.icon("calculator", "w-4 h-4", 2.2)} Terapkan Persentase Manual
              </button>
            </div>
          </form>
        </details>
      </section>

      <section class="panel-card">
        <div class="panel-head">
          <div>
            <p class="panel-eyebrow">Katalog Produk & Rincian Margin per Cup</p>
            <h2 class="panel-title">Daftar Menu, Modal HPP, Selisih Harga & Biaya Jasa</h2>
          </div>
          <div class="toolbar-row">
            <button type="button" class="btn btn-primary btn-xs" data-action="open-menu-modal">
              ${ICON.icon("plus", "w-3.5 h-3.5", 2.4)} Tambah Menu Baru
            </button>
          </div>
        </div>

        <div class="toolbar-row" style="margin-bottom:14px">
          <input type="search" id="admin-menu-search" class="input" style="max-width:280px;min-height:38px" placeholder="Cari nama menu atau kategori..." value="${U.esc(state.menuQuery)}">
          <select id="admin-menu-brand" class="select" style="width:auto;min-height:38px" aria-label="Filter brand menu">
            <option value="all" ${state.menuBrandFilter === "all" ? "selected" : ""}>Semua Brand</option>
            ${(state.dataset.brands || []).map(b => `<option value="${U.esc(b.id)}" ${state.menuBrandFilter === b.id ? "selected" : ""}>${U.esc(b.name)}</option>`).join("")}
          </select>
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Menu</th>
                <th>Brand & Kategori</th>
                <th>Harga Normal</th>
                <th>Modal Beli (HPP)</th>
                <th>Harga Jual Promo</th>
                <th>Untung Selisih Harga</th>
                <th>Untung Biaya Jasa</th>
                <th>Total Laba / Cup</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(it => {
                const orig = Number(it.price_original || 0);
                const cost = Number(it.price_cost || 0);
                const sell = Number(it.price_discount || 0);
                const fee = Number(it.service_fee_unit || 0);
                const netProfit = sell - cost;
                const spreadProfit = netProfit - fee;
                return `
                  <tr>
                    <td>
                      <div style="display:flex;align-items:center;gap:10px">
                        <img src="${U.esc(it.image_url || "src/assets/products/iced-coffee.webp")}" alt="" style="width:40px;height:40px;border-radius:10px;object-fit:cover;background:var(--surface-soft)">
                        <div>
                          <strong>${U.esc(it.name)}</strong>
                          <div style="font-size:11px;color:var(--muted)">Terjual: ${it.sold_count || 0} • ${it.is_best_seller ? "★ Best Seller" : "Reguler"}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong>${U.esc(it.brand_id.toUpperCase())}</strong>
                      <div style="font-size:11.5px;color:var(--muted)">${U.esc(it.category)}</div>
                    </td>
                    <td class="mono">${U.rp(orig)}</td>
                    <td class="mono">${U.rp(cost)}</td>
                    <td class="mono"><strong>${U.rp(sell)}</strong></td>
                    <td class="mono" style="color:${spreadProfit >= 0 ? "var(--ink)" : "var(--danger)"}">${U.rp(spreadProfit)}</td>
                    <td class="mono">${U.rp(fee)}</td>
                    <td class="mono" style="color:var(--success);font-weight:800">+${U.rp(netProfit)}</td>
                    <td>
                      <button type="button" class="status-badge ${it.is_available !== false ? "completed" : "cancelled"}" data-action="toggle-menu-avail" data-id="${U.esc(it.id)}" style="border:0">
                        ${it.is_available !== false ? "Tersedia" : "Habis"}
                      </button>
                    </td>
                    <td>
                      <div style="display:flex;gap:6px">
                        <button type="button" class="btn btn-soft btn-xs" data-action="edit-menu" data-id="${U.esc(it.id)}">Edit</button>
                        <button type="button" class="btn btn-danger btn-xs" data-action="delete-menu" data-id="${U.esc(it.id)}">Hapus</button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  /* ------------------------------------------------------------
     TAB 4 — MULTI-CITY OUTLETS MANAGEMENT
     ------------------------------------------------------------ */

  function renderOutletsTab() {
    const outlets = (state.dataset.outlets || []).filter(o =>
      state.outletBrandFilter === "all" || o.brand_id === state.outletBrandFilter
    );

    return `
      <section class="panel-card">
        <div class="panel-head">
          <div>
            <p class="panel-eyebrow">Lokasi Cabang Multi-Kota</p>
            <h2 class="panel-title">Manajemen Outlet (Samarinda, Balikpapan &amp; Tenggarong)</h2>
            <p class="panel-sub">Kelola cabang resmi, koordinat GPS, dan jam operasional WITA. Catatan: Tomoro Coffee berstatus Coming Soon (0 cabang aktif).</p>
          </div>
          <div class="toolbar-row">
            <select id="admin-outlet-brand" class="select" style="width:auto;min-height:38px" aria-label="Filter brand outlet">
              <option value="all" ${state.outletBrandFilter === "all" ? "selected" : ""}>Semua Brand (${(state.dataset.outlets || []).length})</option>
              ${(state.dataset.brands || []).map(b => {
                const cnt = (state.dataset.outlets || []).filter(o => o.brand_id === b.id).length;
                return `<option value="${U.esc(b.id)}" ${state.outletBrandFilter === b.id ? "selected" : ""}>${U.esc(b.name)}${cnt === 0 ? " (Coming Soon)" : ` (${cnt})`}</option>`;
              }).join("")}
            </select>
            <button type="button" class="btn btn-primary btn-xs" data-action="open-outlet-modal">
              ${ICON.icon("plus", "w-3.5 h-3.5", 2.4)} Tambah Outlet
            </button>
          </div>
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Nama Outlet</th>
                <th>Brand</th>
                <th>Kota / Area</th>
                <th>Alamat &amp; GPS</th>
                <th>Jam Operasional</th>
                <th>Status (Manual &amp; WITA)</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${outlets.length ? outlets.map(o => {
                const wita = U.getOutletOpenStatus({ hours: o.hours, isOpen: o.is_open !== false });
                const hasGps = o.latitude != null && o.longitude != null;
                return `
                <tr>
                  <td><strong>${U.esc(o.name)}</strong></td>
                  <td><strong>${U.esc(o.brand_id.toUpperCase())}</strong></td>
                  <td>${U.esc(o.area)}</td>
                  <td style="font-size:12px;color:var(--body)">
                    <div>${U.esc(o.address)}</div>
                    <small class="mono" style="color:${hasGps ? "var(--success)" : "var(--muted)"}">
                      ${hasGps ? `GPS: ${Number(o.latitude).toFixed(4)}, ${Number(o.longitude).toFixed(4)}` : "GPS belum diisi"}
                    </small>
                  </td>
                  <td class="mono" style="font-size:12px">${U.esc(o.hours)}</td>
                  <td>
                    <div style="display:flex;flex-direction:column;align-items:flex-start;gap:4px">
                      <button type="button" class="status-badge ${o.is_open !== false ? "completed" : "cancelled"}" data-action="toggle-outlet-open" data-id="${U.esc(o.id)}" style="border:0">
                        ${o.is_open !== false ? "Aktif (Buka)" : "Nonaktif (Tutup)"}
                      </button>
                      <small style="font-size:10.5px;font-weight:700;color:${wita.isOpen ? "var(--success)" : "var(--danger)"}">
                        ${wita.reason === "manual" ? "Ditutup manual admin" : (wita.is24h ? "WITA: Buka 24 Jam" : (wita.isOpen ? "WITA: Sedang Buka" : "WITA: Tutup (Jam Toko)"))}
                      </small>
                    </div>
                  </td>
                  <td>
                    <div style="display:flex;gap:6px">
                      <button type="button" class="btn btn-soft btn-xs" data-action="edit-outlet" data-id="${U.esc(o.id)}">Edit</button>
                      <button type="button" class="btn btn-danger btn-xs" data-action="delete-outlet" data-id="${U.esc(o.id)}">Hapus</button>
                    </div>
                  </td>
                </tr>
              `;
              }).join("") : `<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:20px">Belum ada outlet aktif untuk brand ini (Coming Soon).</td></tr>`}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  /* ------------------------------------------------------------
     TAB 4B — TESTIMONIALS MODERATION
     ------------------------------------------------------------ */

  function renderTestimonialsTab() {
    const list = state.dataset.testimonials || [];
    const publishedCount = list.filter(t => t.is_published !== false).length;

    return `
      <section class="panel-card">
        <div class="panel-head">
          <div>
            <p class="panel-eyebrow">Moderasi Ulasan Terverifikasi</p>
            <h2 class="panel-title">Daftar Testimoni Pelanggan (${list.length})</h2>
            <p class="panel-sub">${publishedCount} ulasan tayang di obrolan testimoni publik. Foto otomatis dikompres WebP ringan oleh sistem.</p>
          </div>
          <div class="toolbar-row">
            <a href="review.html" target="_blank" rel="noopener" class="btn btn-outline btn-xs">
              ${ICON.icon("external-link", "w-3.5 h-3.5", 2)} Buka Form /review
            </a>
          </div>
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Foto</th>
                <th>Pelanggan & Order</th>
                <th>Brand & Outlet</th>
                <th>Rating & Ulasan</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${list.length ? list.map(t => {
                const stars = "★".repeat(Math.max(1, Math.min(5, Number(t.rating || 5))));
                const isPub = t.is_published !== false;
                return `
                  <tr>
                    <td>
                      ${t.photo_url
                        ? `<a href="${U.esc(t.photo_url)}" target="_blank" rel="noopener"><img src="${U.esc(t.photo_url)}" alt="Foto ulasan" style="width:52px;height:52px;border-radius:10px;object-fit:cover;border:1px solid var(--border)" loading="lazy"></a>`
                        : `<span style="font-size:11px;color:var(--muted)">Tanpa foto</span>`}
                    </td>
                    <td>
                      <strong>${U.esc(t.customer_name_masked)}</strong>
                      <div class="mono" style="font-size:11px;color:var(--primary)">#${U.esc(t.order_code)}</div>
                      <div style="font-size:11px;color:var(--muted)">${new Date(t.created_at).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
                    </td>
                    <td>
                      <strong>${U.esc(t.brand_name || "-")}</strong>
                      <div style="font-size:11.5px;color:var(--muted)">${U.esc(t.city_label || t.outlet_name || "-")}</div>
                    </td>
                    <td style="max-width:300px;font-size:12.5px;line-height:1.45">
                      <div style="color:#f59e0b;font-weight:800;letter-spacing:1px">${stars}</div>
                      <div>${U.esc(t.message)}</div>
                    </td>
                    <td>
                      <span class="status-badge ${isPub ? "completed" : "cancelled"}">${isPub ? "Tayang" : "Disembunyikan"}</span>
                    </td>
                    <td>
                      <div style="display:flex;gap:6px;flex-wrap:wrap">
                        <button type="button" class="btn btn-soft btn-xs" data-action="toggle-testimonial-publish" data-id="${t.id}" data-next="${isPub ? "false" : "true"}">
                          ${isPub ? "Sembunyikan" : "Tampilkan"}
                        </button>
                        <button type="button" class="btn btn-danger btn-xs" data-action="delete-testimonial" data-id="${t.id}">Hapus</button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join("") : `<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:24px">Belum ada testimoni masuk (atau jalankan migrasi SQL tabel testimonials terlebih dahulu).</td></tr>`}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  /* ------------------------------------------------------------
     TAB 5 — GLOBAL SETTINGS & BRAND LOGOS
     ------------------------------------------------------------ */

  function renderSettingsTab() {
    const s = getEffectiveSettings();
    return `
      <section class="panel-card">
        <div class="panel-head">
          <div>
            <p class="panel-eyebrow">Konfigurasi Layanan</p>
            <h2 class="panel-title">Nomor WhatsApp Admin & Aturan Biaya Jasa Default</h2>
          </div>
        </div>

        <form id="settings-form" class="form-grid">
          <div class="field">
            <label class="field-label" for="set-app-name">Nama Layanan</label>
            <input type="text" id="set-app-name" class="input" value="${U.esc(s.app_name || "Dibeliin Lebih Murah")}" required>
          </div>

          <div class="field">
            <label class="field-label" for="set-wa-number">Nomor WhatsApp Admin (Format 628...)</label>
            <input type="text" id="set-wa-number" class="input mono" value="${U.esc(s.admin_whatsapp || "6281234567890")}" required>
          </div>

          <div class="field">
            <label class="field-label" for="set-wa-display">Tampilan Nomor WhatsApp</label>
            <input type="text" id="set-wa-display" class="input mono" value="${U.esc(s.admin_whatsapp_display || "0812-3456-7890")}" required>
          </div>

          <div class="field">
            <label class="field-label" for="set-city">Kota Operasional</label>
            <input type="text" id="set-city" class="input" value="${U.esc(s.city || "Samarinda, Balikpapan & Tenggarong")}" required>
          </div>

          <div class="field">
            <label class="field-label" for="set-fee-mode">Mode Perhitungan Biaya Jasa</label>
            <select id="set-fee-mode" class="select">
              <option value="flat_per_order" ${s.service_fee_mode === "flat_per_order" || !s.service_fee_mode ? "selected" : ""}>Sesuai Partner (Kopken 1 Produk Reguler Rp 2.000 • Lainnya Rp 0)</option>
              <option value="included_per_item" ${s.service_fee_mode === "included_per_item" ? "selected" : ""}>Termasuk di Harga Jual per Item</option>
              <option value="both" ${s.service_fee_mode === "both" ? "selected" : ""}>Gabungan (Per Item + Transaksi Partner)</option>
            </select>
          </div>

          <div class="field">
            <label class="field-label" for="set-fee-item">Biaya Jasa Default per Item (Rp)</label>
            <input type="number" id="set-fee-item" class="input mono" value="${Number(s.default_service_fee_per_item || 0)}" min="0" step="1">
          </div>

          <div class="field">
            <label class="field-label" for="set-fee-order">Biaya Transaksi 1 Produk Kopken (Rp)</label>
            <input type="number" id="set-fee-order" class="input mono" value="${Number(s.default_service_fee_per_order != null ? s.default_service_fee_per_order : 2000)}" min="0" step="1">
          </div>

          <div class="field">
            <label class="field-label" for="set-cost-ratio">Patokan Rasio Modal HPP Default (%)</label>
            <input type="number" id="set-cost-ratio" class="input mono" value="${Number(s.default_cost_ratio_percent || 55)}" min="10" max="95">
          </div>

          <div class="field" style="grid-column:1 / -1">
            <label class="field-label" for="set-payment-note">Catatan Pembayaran di Checkout</label>
            <textarea id="set-payment-note" class="textarea" rows="2">${U.esc(s.payment_note || "")}</textarea>
          </div>

          <div class="field" style="grid-column:1 / -1">
            <label class="field-label" for="set-customer-pay">Label Metode Pembayaran di Invoice WA Pelanggan</label>
            <input type="text" id="set-customer-pay" class="input" value="${U.esc(s.customer_payment_methods || "QRIS / Transfer Bank / E-Wallet (konfirmasi via Admin)")}">
          </div>

          <div style="grid-column:1 / -1;border-top:1px dashed var(--border);padding-top:14px;margin-top:4px">
            <p class="panel-eyebrow">Share Pesanan 1-Klik ke Partner</p>
            <p style="font-size:12px;color:var(--muted);margin-top:2px">Atur nama &amp; nomor WA partner agar tombol <strong>Kirim ke Partner</strong> di tab Pesanan langsung membuka chat WhatsApp dengan format partner.</p>
          </div>

          <div class="field">
            <label class="field-label" for="set-partner-name">Nama Partner (Header Pesan WA Partner)</label>
            <input type="text" id="set-partner-name" class="input" value="${U.esc(s.partner_name || "Jasdor Moulii")}" placeholder="Contoh: Jasdor Moulii">
          </div>

          <div class="field">
            <label class="field-label" for="set-partner-wa">Nomor WhatsApp Partner (Format 628...)</label>
            <input type="text" id="set-partner-wa" class="input mono" value="${U.esc(s.partner_whatsapp || "6281521692248")}" placeholder="6281521692248">
          </div>

          <div class="field">
            <label class="field-label" for="set-partner-pay">Metode Pembayaran di Teks Partner</label>
            <input type="text" id="set-partner-pay" class="input" value="${U.esc(s.partner_payment_methods || "BCA / GoPay / Dana / QRIS")}">
          </div>

          <div class="field" style="display:flex;align-items:center;padding-top:18px">
            <label style="display:flex;align-items:center;gap:8px;font-size:12.5px;font-weight:700;cursor:pointer">
              <input type="checkbox" id="set-partner-use-admin-phone" ${s.partner_use_admin_phone ? "checked" : ""}>
              <span>Ganti No. WA pembeli jadi No. WA Admin saat kirim ke partner</span>
            </label>
          </div>

          <div style="grid-column:1 / -1;display:flex;justify-content:flex-end">
            <button type="submit" class="btn btn-primary">
              ${ICON.icon("save", "w-4 h-4", 2.2)} Simpan Pengaturan Layanan
            </button>
          </div>
        </form>
      </section>

      <section class="panel-card">
        <div class="panel-head">
          <div>
            <p class="panel-eyebrow">Identitas Brand (Logo Resmi Terkunci)</p>
            <h2 class="panel-title">Daftar Brand & Logo Emblem Resmi</h2>
            <p class="panel-sub">Logo resmi Tomoro, Fore, Kopi Kenangan, dan Janji Jiwa dikunci secara permanen agar tetap rapi dan tidak tertimpa foto lain. Anda tetap dapat mengubah badge promo & tagline.</p>
          </div>
        </div>

        <div class="kpi-grid">
          ${(state.dataset.brands || []).map(b => {
            const lockedLogo = (CFG.lockedBrandLogos && CFG.lockedBrandLogos[b.id]) || b.logo_url || `src/assets/brands/${b.id}.svg`;
            return `
            <div class="kpi-card">
              <div style="display:flex;align-items:center;gap:12px">
                <img src="${U.esc(lockedLogo)}" alt="${U.esc(b.name)}" style="width:48px;height:48px;border-radius:12px;object-fit:contain;background:#fff;padding:3px;border:1px solid var(--border)">
                <div>
                  <div style="display:flex;align-items:center;gap:6px">
                    <strong>${U.esc(b.name)}</strong>
                    <span class="compress-badge" style="font-size:10px;padding:2px 6px">${ICON.icon("lock", "w-3 h-3", 2.2)} Resmi</span>
                  </div>
                  <div style="font-size:11.5px;color:var(--primary);font-weight:700">${U.esc(b.promo_badge)}</div>
                </div>
              </div>
              <p style="font-size:12px;color:var(--body)">${U.esc(b.tagline)}</p>
              <div style="margin-top:auto;padding-top:8px;display:flex;gap:8px">
                <button type="button" class="btn btn-soft btn-xs" data-action="edit-brand" data-id="${U.esc(b.id)}">Ubah Promo & Tagline</button>
              </div>
            </div>
          `;
          }).join("")}
        </div>
      </section>
    `;
  }

  /* ------------------------------------------------------------
     MODALS (ORDER RECONCILIATION, MANUAL ORDER, MENU, OUTLET, BRAND)
     ------------------------------------------------------------ */

  function closeAdminModal() {
    const root = $("#admin-modal-root");
    if (root) root.innerHTML = "";
  }

  function openReconcileModal(orderId) {
    const order = (state.dataset.orders || []).find(o => String(o.id) === String(orderId));
    if (!order) return;
    const root = $("#admin-modal-root");

    root.innerHTML = `
      <div class="admin-modal-overlay" data-modal-backdrop>
        <form id="reconcile-form" class="admin-modal" role="dialog" aria-modal="true" data-order-id="${order.id}">
          <div class="admin-modal-head">
            <div>
              <div class="panel-eyebrow">Rekonsiliasi Checkout WhatsApp</div>
              <h3 class="panel-title">#${U.esc(order.order_code)} — ${U.esc(order.customer_name)}</h3>
            </div>
            <button type="button" class="btn btn-outline btn-xs" data-action="close-admin-modal">Tutup</button>
          </div>

          <div class="form-grid">
            <div class="field">
              <label class="field-label" for="rec-status">Status Pesanan</label>
              <select id="rec-status" class="select">
                <option value="pending_wa" ${order.status === "pending_wa" ? "selected" : ""}>Menunggu Konfirmasi WA</option>
                <option value="processing" ${order.status === "processing" ? "selected" : ""}>Sedang Diproses di Outlet</option>
                <option value="completed" ${order.status === "completed" ? "selected" : ""}>Selesai / Sudah Diterima</option>
                <option value="cancelled" ${order.status === "cancelled" ? "selected" : ""}>Dibatalkan</option>
              </select>
            </div>

            <div class="field">
              <label class="field-label" for="rec-final-paid">Nominal Akhir Deal WA (Rp)</label>
              <input type="number" id="rec-final-paid" class="input mono" value="${Number(order.final_paid_total || order.checkout_total || 0)}" min="0" step="1" required>
              <span class="field-hint">Tagihan awal checkout: ${U.rp(order.checkout_total)}</span>
            </div>

            <div class="field">
              <label class="field-label" for="rec-cost">Total Modal Pembelian / HPP Aktual (Rp)</label>
              <input type="number" id="rec-cost" class="input mono" value="${Number(order.total_cost_amount || 0)}" min="0" step="1" required>
              <span class="field-hint">Modal yang Anda bayarkan ke outlet/aplikasi</span>
            </div>

            <div class="field">
              <label class="field-label" for="rec-fee">Porsi Keuntungan Biaya Jasa (Rp)</label>
              <input type="number" id="rec-fee" class="input mono" value="${Number(order.service_fee_profit || 0)}" min="0" step="1" required>
              <span class="field-hint">Sisanya dicatat sebagai Untung Selisih Harga</span>
            </div>

            <div class="field" style="grid-column:1 / -1">
              <label class="field-label" for="rec-notes">Catatan Admin (Terlihat juga di Lacak Pesanan pelanggan)</label>
              <textarea id="rec-notes" class="textarea" rows="2" placeholder="Contoh: Pesanan sedang dibuat barista Big Mall, estimasi siap 10 menit lagi.">${U.esc(order.admin_notes || "")}</textarea>
            </div>
          </div>

          <div class="admin-modal-foot">
            <button type="button" class="btn btn-outline" data-action="close-admin-modal">Batal</button>
            <button type="submit" class="btn btn-primary">${ICON.icon("save", "w-4 h-4", 2.2)} Simpan Rekonsiliasi</button>
          </div>
        </form>
      </div>
    `;
  }

  function openPartnerShareModal(orderId) {
    const order = (state.dataset.orders || []).find(o => String(o.id) === String(orderId));
    if (!order || !WA) return;
    const settings = getEffectiveSettings();
    const partnerText = WA.buildPartnerMessage(order, settings);
    const root = $("#admin-modal-root");

    root.innerHTML = `
      <div class="admin-modal-overlay" data-modal-backdrop>
        <div class="admin-modal" role="dialog" aria-modal="true" data-partner-order-id="${order.id}">
          <div class="admin-modal-head">
            <div>
              <div class="panel-eyebrow">Share Pesanan ke Partner (${U.esc(settings.partner_name)})</div>
              <h3 class="panel-title">#${U.esc(order.order_code)} — ${U.esc(order.customer_name)}</h3>
            </div>
            <button type="button" class="btn btn-outline btn-xs" data-action="close-admin-modal">Tutup</button>
          </div>

          <div style="font-size:12px;color:var(--body);margin-bottom:10px;padding:10px 12px;border-radius:10px;background:#f0fdf4;border:1px solid #bbf7d0">
            <strong>Tujuan WA Partner:</strong> <span class="mono">${U.esc(settings.partner_whatsapp)}</span> •
            Teks otomatis diformat sesuai template partner (paket Bundling Kopken otomatis menyesuaikan ke harga dasar partner). Anda juga dapat mengedit cepat sebelum mengirim.
          </div>

          <div class="field">
            <label class="field-label" for="partner-share-textarea">Preview Teks Pesanan untuk Partner</label>
            <textarea id="partner-share-textarea" class="textarea mono" rows="14" style="font-size:12px;line-height:1.45">${U.esc(partnerText)}</textarea>
          </div>

          <div class="admin-modal-foot">
            <button type="button" class="btn btn-soft" data-action="copy-partner-modal-text">
              ${ICON.icon("copy", "w-4 h-4", 2)} Salin Teks Partner
            </button>
            <button type="button" class="btn" style="background:#16a34a;color:#fff;border:0" data-action="send-partner-modal-wa" data-id="${order.id}">
              ${ICON.brand("whatsapp", "w-4 h-4")} Kirim ke WA Partner Sekarang
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function openManualOrderModal() {
    const brands = state.dataset.brands || [];
    const firstBrand = brands[0] || { id: "tomoro", name: "Tomoro Coffee" };
    const outlets = (state.dataset.outlets || []).filter(o => o.brand_id === firstBrand.id);
    const menus = (state.dataset.menuItems || []).filter(m => m.brand_id === firstBrand.id);
    const root = $("#admin-modal-root");

    root.innerHTML = `
      <div class="admin-modal-overlay" data-modal-backdrop>
        <form id="manual-order-form" class="admin-modal" role="dialog" aria-modal="true">
          <div class="admin-modal-head">
            <div>
              <div class="panel-eyebrow">Catat Transaksi</div>
              <h3 class="panel-title">Input Pesanan WhatsApp Manual</h3>
            </div>
            <button type="button" class="btn btn-outline btn-xs" data-action="close-admin-modal">Tutup</button>
          </div>

          <div class="form-grid">
            <div class="field">
              <label class="field-label" for="man-name">Nama Pelanggan</label>
              <input type="text" id="man-name" class="input" placeholder="Contoh: Andi Wijaya" required>
            </div>
            <div class="field">
              <label class="field-label" for="man-phone">Nomor WhatsApp</label>
              <input type="text" id="man-phone" class="input mono" placeholder="081234567890" required>
            </div>
            <div class="field">
              <label class="field-label" for="man-brand">Brand</label>
              <select id="man-brand" class="select">
                ${brands.map(b => `<option value="${U.esc(b.id)}">${U.esc(b.name)}</option>`).join("")}
              </select>
            </div>
            <div class="field">
              <label class="field-label" for="man-outlet">Outlet Resmi</label>
              <select id="man-outlet" class="select">
                ${outlets.map(o => `<option value="${U.esc(o.id)}">${U.esc(o.name)} (${U.esc(o.area)})</option>`).join("")}
              </select>
            </div>
            <div class="field">
              <label class="field-label" for="man-menu">Menu Utama</label>
              <select id="man-menu" class="select">
                ${menus.map(m => `<option value="${U.esc(m.id)}">${U.esc(m.name)} — ${U.rp(m.price_discount)}</option>`).join("")}
              </select>
            </div>
            <div class="field">
              <label class="field-label" for="man-qty">Jumlah (Cup/Porsi)</label>
              <input type="number" id="man-qty" class="input mono" value="2" min="1" max="50" required>
            </div>
            <div class="field">
              <label class="field-label" for="man-status">Status Transaksi</label>
              <select id="man-status" class="select">
                <option value="completed" selected>Selesai (Sudah Dibayar)</option>
                <option value="processing">Sedang Diproses</option>
                <option value="pending_wa">Menunggu Konfirmasi WA</option>
              </select>
            </div>
            <div class="field">
              <label class="field-label" for="man-mode">Metode</label>
              <select id="man-mode" class="select">
                <option value="pickup">Ambil Sendiri di Outlet</option>
                <option value="delivery">Kirim Driver</option>
              </select>
            </div>
          </div>

          <div class="admin-modal-foot">
            <button type="button" class="btn btn-outline" data-action="close-admin-modal">Batal</button>
            <button type="submit" class="btn btn-primary">${ICON.icon("plus", "w-4 h-4", 2.2)} Simpan Transaksi</button>
          </div>
        </form>
      </div>
    `;
  }

  function openMenuModal(itemId) {
    const existing = itemId ? (state.dataset.menuItems || []).find(x => x.id === itemId) : null;
    const brands = state.dataset.brands || [];
    const it = existing || {
      id: "",
      brand_id: brands.some(b => b.id === "kenangan") ? "kenangan" : (brands[0] ? brands[0].id : "kenangan"),
      name: "",
      category: "Coffee",
      type: "drink",
      description: "",
      info: "Disajikan segar sesuai standar outlet resmi",
      image_url: "src/assets/menus/kenangan/kenangan-kopi-kenangan-mantan.webp",
      price_original: 22000,
      price_cost: 14500,
      price_discount: 15000,
      service_fee_unit: 0,
      is_best_seller: false,
      is_available: true
    };

    const root = $("#admin-modal-root");
    root.innerHTML = `
      <div class="admin-modal-overlay" data-modal-backdrop>
        <form id="menu-form" class="admin-modal" role="dialog" aria-modal="true" data-existing-id="${U.esc(existing ? existing.id : "")}">
          <div class="admin-modal-head">
            <div>
              <div class="panel-eyebrow">Katalog & Harga Menu</div>
              <h3 class="panel-title">${existing ? "Edit Menu & Komponen Laba" : "Tambah Menu Baru"}</h3>
            </div>
            <button type="button" class="btn btn-outline btn-xs" data-action="close-admin-modal">Tutup</button>
          </div>

          <div class="form-grid">
            <div class="field">
              <label class="field-label" for="mf-brand">Brand</label>
              <select id="mf-brand" class="select">
                ${brands.map(b => `<option value="${U.esc(b.id)}" ${it.brand_id === b.id ? "selected" : ""}>${U.esc(b.name)}</option>`).join("")}
              </select>
            </div>
            <div class="field">
              <label class="field-label" for="mf-name">Nama Menu</label>
              <input type="text" id="mf-name" class="input" value="${U.esc(it.name)}" required>
            </div>
            <div class="field">
              <label class="field-label" for="mf-category">Kategori</label>
              <input type="text" id="mf-category" class="input" value="${U.esc(it.category)}" required>
            </div>
            <div class="field">
              <label class="field-label" for="mf-type">Jenis</label>
              <select id="mf-type" class="select">
                <option value="drink" ${it.type === "drink" ? "selected" : ""}>Minuman (Dengan Opsi Es/Gula/Ukuran)</option>
                <option value="food" ${it.type === "food" ? "selected" : ""}>Makanan / Pastry</option>
              </select>
            </div>
            <div class="field">
              <label class="field-label" for="mf-orig">Harga Normal Outlet (Rp)</label>
              <input type="number" id="mf-orig" class="input mono" value="${Number(it.price_original)}" min="0" step="1" required>
            </div>
            <div class="field">
              <label class="field-label" for="mf-cost">Modal Beli / HPP Admin (Rp)</label>
              <input type="number" id="mf-cost" class="input mono" value="${Number(it.price_cost)}" min="0" step="1" required>
            </div>
            <div class="field">
              <label class="field-label" for="mf-sell">Harga Jual Pelanggan (Rp)</label>
              <input type="number" id="mf-sell" class="input mono" value="${Number(it.price_discount)}" min="0" step="1" required>
            </div>
            <div class="field">
              <label class="field-label" for="mf-fee">Porsi Biaya Jasa / Cup (Rp)</label>
              <input type="number" id="mf-fee" class="input mono" value="${Number(it.service_fee_unit)}" min="0" step="1" required>
            </div>
            <div class="profit-preview-box" id="mf-profit-preview">
              <div class="profit-preview-item"><small>Diskon Pelanggan</small><strong id="pv-disc">0%</strong></div>
              <div class="profit-preview-item"><small>Untung Selisih Harga</small><strong id="pv-spread">Rp 0</strong></div>
              <div class="profit-preview-item"><small>Untung Biaya Jasa</small><strong id="pv-fee">Rp 0</strong></div>
              <div class="profit-preview-item"><small>Total Laba / Cup</small><strong id="pv-net" style="color:var(--success)">+Rp 0</strong></div>
            </div>
            <div class="field" style="grid-column:1 / -1">
              <label class="field-label" for="mf-image">Path / URL Foto Produk (Otomatis Kompres WebP max 800px)</label>
              <div style="display:flex;gap:8px">
                <input type="text" id="mf-image" class="input" value="${U.esc(it.image_url)}" required>
                <label class="btn btn-soft btn-xs" style="cursor:pointer">
                  ${ICON.icon("upload", "w-3.5 h-3.5", 2)} Upload &amp; Kompres
                  <input type="file" id="mf-image-file" accept="image/*" style="display:none">
                </label>
              </div>
              <div class="upload-preview-row" id="mf-upload-preview">
                <img src="${U.esc(it.image_url)}" alt="Preview produk" class="upload-preview-thumb" id="mf-thumb">
                <div style="font-size:12px;color:var(--body)">
                  <strong style="display:block">Kompresi Otomatis Aktif</strong>
                  <span id="mf-compress-status" style="color:var(--muted)">Foto yang diunggah dari HP/PC akan otomatis dikonversi ke WebP ringan sebelum disimpan ke Supabase.</span>
                </div>
              </div>
            </div>
            <div class="field" style="grid-column:1 / -1">
              <label class="field-label" for="mf-desc">Deskripsi Menu</label>
              <textarea id="mf-desc" class="textarea" rows="2">${U.esc(it.description)}</textarea>
            </div>
            <div class="field">
              <label style="display:flex;align-items:center;gap:8px;font-weight:700;cursor:pointer">
                <input type="checkbox" id="mf-best" ${it.is_best_seller ? "checked" : ""}>
                <span>Tandai Best Seller</span>
              </label>
            </div>
            <div class="field">
              <label style="display:flex;align-items:center;gap:8px;font-weight:700;cursor:pointer">
                <input type="checkbox" id="mf-avail" ${it.is_available !== false ? "checked" : ""}>
                <span>Menu Tersedia (Stok Ada)</span>
              </label>
            </div>
          </div>

          <div class="admin-modal-foot">
            <button type="button" class="btn btn-outline" data-action="close-admin-modal">Batal</button>
            <button type="submit" class="btn btn-primary">${ICON.icon("save", "w-4 h-4", 2.2)} Simpan Menu</button>
          </div>
        </form>
      </div>
    `;
    updateMenuProfitPreview();
  }

  function updateMenuProfitPreview() {
    const origEl = $("#mf-orig");
    const costEl = $("#mf-cost");
    const sellEl = $("#mf-sell");
    const feeEl = $("#mf-fee");
    if (!origEl || !costEl || !sellEl || !feeEl) return;

    const orig = Number(origEl.value || 0);
    const cost = Number(costEl.value || 0);
    const sell = Number(sellEl.value || 0);
    const fee = Number(feeEl.value || 0);
    const net = sell - cost;
    const spread = net - fee;
    const disc = orig > 0 ? Math.max(0, Math.round(((orig - sell) / orig) * 100)) : 0;

    const pvDisc = $("#pv-disc");
    const pvSpread = $("#pv-spread");
    const pvFee = $("#pv-fee");
    const pvNet = $("#pv-net");
    if (pvDisc) pvDisc.textContent = `-${disc}% (${U.rp(Math.max(0, orig - sell))})`;
    if (pvSpread) pvSpread.textContent = U.rp(spread);
    if (pvFee) pvFee.textContent = U.rp(fee);
    if (pvNet) {
      pvNet.textContent = `${net >= 0 ? "+" : ""}${U.rp(net)}`;
      pvNet.style.color = net >= 0 ? "var(--success)" : "var(--danger)";
    }
  }

  function buildDefaultOptionGroups(brandId, type, name, category) {
    if (typeof window.DLM_HYDRATE_ITEM === "function") {
      const hydrated = window.DLM_HYDRATE_ITEM({
        brandId: brandId || "kenangan",
        type: type || "drink",
        name: name || "",
        category: category || ""
      });
      if (hydrated && Array.isArray(hydrated.optionGroups)) {
        return hydrated.optionGroups;
      }
    }
    return [];
  }

  function computeResellerCostUnit(item) {
    const sell = Number(item.price_discount || 0);
    const cat = String(item.category || "").toLowerCase();
    const name = String(item.name || "").toLowerCase();
    if (item.brand_id === "kenangan") {
      if (cat === "bundling" || item.type === "bundle") return Math.max(0, sell - 1000);
      return Math.max(0, sell - 500);
    }
    if (item.brand_id === "janji-jiwa") {
      return Math.max(0, sell - 1000);
    }
    if (item.brand_id === "fore") {
      const is1L = name.includes("1l") || cat.includes("1l") || cat.includes("1 liter");
      return Math.max(0, sell - (is1L ? 1000 : 500));
    }
    return Number(item.price_cost || sell);
  }

  function openOutletModal(outletId) {
    const existing = outletId ? (state.dataset.outlets || []).find(x => x.id === outletId) : null;
    const brands = state.dataset.brands || [];
    const o = existing || {
      id: "",
      brand_id: brands.some(b => b.id === "kenangan") ? "kenangan" : (brands[0] ? brands[0].id : "kenangan"),
      name: "",
      area: "Samarinda",
      address: "",
      hours: "08:00 - 22:00",
      distance: "GPS",
      latitude: "",
      longitude: "",
      is_open: true
    };

    const root = $("#admin-modal-root");
    root.innerHTML = `
      <div class="admin-modal-overlay" data-modal-backdrop>
        <form id="outlet-form" class="admin-modal" role="dialog" aria-modal="true" data-existing-id="${U.esc(existing ? existing.id : "")}">
          <div class="admin-modal-head">
            <div>
              <div class="panel-eyebrow">Lokasi Cabang Multi-Kota</div>
              <h3 class="panel-title">${existing ? "Edit Outlet" : "Tambah Outlet Baru"}</h3>
            </div>
            <button type="button" class="btn btn-outline btn-xs" data-action="close-admin-modal">Tutup</button>
          </div>

          <div class="form-grid">
            <div class="field">
              <label class="field-label" for="of-brand">Brand</label>
              <select id="of-brand" class="select">
                ${brands.map(b => `<option value="${U.esc(b.id)}" ${o.brand_id === b.id ? "selected" : ""}>${U.esc(b.name)}</option>`).join("")}
              </select>
            </div>
            <div class="field">
              <label class="field-label" for="of-name">Nama Outlet</label>
              <input type="text" id="of-name" class="input" value="${U.esc(o.name)}" placeholder="Contoh: Big Mall Samarinda / E-Walk Balikpapan" required>
            </div>
            <div class="field">
              <label class="field-label" for="of-area">Kota / Area</label>
              <input type="text" id="of-area" class="input" value="${U.esc(o.area)}" placeholder="Samarinda / Balikpapan / Tenggarong" required>
            </div>
            <div class="field">
              <label class="field-label" for="of-hours">Jam Operasional</label>
              <input type="text" id="of-hours" class="input mono" value="${U.esc(o.hours)}" required>
            </div>
            <div class="field" style="grid-column:1 / -1">
              <label class="field-label" for="of-address">Alamat Lengkap</label>
              <input type="text" id="of-address" class="input" value="${U.esc(o.address)}" required>
            </div>
            <div class="field">
              <label class="field-label" for="of-lat">Latitude GPS (Opsional)</label>
              <input type="number" id="of-lat" class="input mono" step="any" placeholder="-0.50353" value="${o.latitude != null ? U.esc(o.latitude) : ""}">
            </div>
            <div class="field">
              <label class="field-label" for="of-lng">Longitude GPS (Opsional)</label>
              <input type="number" id="of-lng" class="input mono" step="any" placeholder="117.15492" value="${o.longitude != null ? U.esc(o.longitude) : ""}">
            </div>
            <div class="field">
              <label style="display:flex;align-items:center;gap:8px;font-weight:700;cursor:pointer">
                <input type="checkbox" id="of-open" ${o.is_open !== false ? "checked" : ""}>
                <span>Status Outlet Buka</span>
              </label>
            </div>
          </div>

          <div class="admin-modal-foot">
            <button type="button" class="btn btn-outline" data-action="close-admin-modal">Batal</button>
            <button type="submit" class="btn btn-primary">${ICON.icon("save", "w-4 h-4", 2.2)} Simpan Outlet</button>
          </div>
        </form>
      </div>
    `;
  }

  function openBrandModal(brandId) {
    const b = (state.dataset.brands || []).find(x => x.id === brandId);
    if (!b) return;
    const lockedLogo = (CFG.lockedBrandLogos && CFG.lockedBrandLogos[b.id]) || b.logo_url || `src/assets/brands/${b.id}.svg`;
    const root = $("#admin-modal-root");
    root.innerHTML = `
      <div class="admin-modal-overlay" data-modal-backdrop>
        <form id="brand-form" class="admin-modal" role="dialog" aria-modal="true" data-brand-id="${U.esc(b.id)}">
          <div class="admin-modal-head">
            <div>
              <div class="panel-eyebrow">Pengaturan Brand</div>
              <h3 class="panel-title">${U.esc(b.name)}</h3>
            </div>
            <button type="button" class="btn btn-outline btn-xs" data-action="close-admin-modal">Tutup</button>
          </div>

          <div class="form-grid">
            <div class="field">
              <label class="field-label" for="bf-name">Nama Brand</label>
              <input type="text" id="bf-name" class="input" value="${U.esc(b.name)}" required>
            </div>
            <div class="field">
              <label class="field-label" for="bf-promo">Badge Promo</label>
              <input type="text" id="bf-promo" class="input" value="${U.esc(b.promo_badge)}" required>
            </div>
            <div class="field" style="grid-column:1 / -1">
              <label class="field-label" for="bf-tagline">Tagline</label>
              <input type="text" id="bf-tagline" class="input" value="${U.esc(b.tagline)}" required>
            </div>
            <div class="field" style="grid-column:1 / -1">
              <label class="field-label">Logo Resmi Brand (Terkunci Permanen)</label>
              <input type="hidden" id="bf-logo" value="${U.esc(lockedLogo)}">
              <div class="upload-preview-row">
                <img src="${U.esc(lockedLogo)}" alt="Logo resmi ${U.esc(b.name)}" class="upload-preview-thumb" style="object-fit:contain;background:#fff;padding:4px">
                <span style="font-size:12px;color:var(--body)">
                  <strong style="display:block;color:var(--primary)">${ICON.icon("lock", "w-3.5 h-3.5", 2.2)} Logo Resmi Permanen Aktif</strong>
                  Logo brand ini dikunci ke aset resmi aplikasi agar tetap konsisten dan tidak berubah.
                </span>
              </div>
            </div>
          </div>

          <div class="admin-modal-foot">
            <button type="button" class="btn btn-outline" data-action="close-admin-modal">Batal</button>
            <button type="submit" class="btn btn-primary">${ICON.icon("save", "w-4 h-4", 2.2)} Simpan Brand</button>
          </div>
        </form>
      </div>
    `;
  }

  /* ------------------------------------------------------------
     CSV EXPORT
     ------------------------------------------------------------ */

  function exportFinancialCsv() {
    const m = computeFinancialMetrics();
    const headers = [
      "Kode Pesanan",
      "Tanggal",
      "Status",
      "Pelanggan",
      "WhatsApp",
      "Brand",
      "Outlet",
      "Area",
      "Jumlah Cup",
      "Total Harga Normal",
      "Tagihan Checkout",
      "Nominal Akhir Dibayar",
      "Modal Pembelian HPP",
      "Untung Selisih Harga",
      "Untung Biaya Jasa",
      "Total Laba Bersih",
      "Hemat Pelanggan"
    ];

    const escCsv = (val) => `"${String(val == null ? "" : val).replace(/"/g, '""')}"`;
    const rows = m.orders.map(o => [
      o.order_code,
      o.created_at,
      statusLabel(o.status),
      o.customer_name,
      o.customer_phone,
      o.brand_name,
      o.outlet_name,
      o.outlet_area,
      o.items_count,
      o.original_total,
      o.checkout_total,
      o.final_paid_total,
      o.total_cost_amount,
      o.price_spread_profit,
      o.service_fee_profit,
      o.net_profit,
      o.customer_savings
    ].map(escCsv).join(","));

    const csvContent = "\uFEFF" + [headers.map(escCsv).join(",")].concat(rows).join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dlm-laporan-keuangan-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast("Laporan CSV berhasil diunduh.");
  }

  /* ------------------------------------------------------------
     EVENT HANDLERS
     ------------------------------------------------------------ */

  async function handleClick(e) {
    const tabBtn = e.target.closest("[data-tab]");
    if (tabBtn) {
      state.activeTab = tabBtn.dataset.tab;
      render();
      return;
    }

    if (e.target.matches("[data-modal-backdrop]")) {
      closeAdminModal();
      return;
    }

    const actEl = e.target.closest("[data-action]");
    if (!actEl) return;
    const action = actEl.dataset.action;

    if (action === "logout") {
      await SB.signOut();
      state.user = null;
      render();
    } else if (action === "refresh-data") {
      await reloadData();
      toast("Data berhasil disinkronkan dari Supabase.");
    } else if (action === "export-csv") {
      exportFinancialCsv();
    } else if (action === "close-admin-modal") {
      closeAdminModal();
    } else if (action === "edit-order") {
      openReconcileModal(actEl.dataset.id);
    } else if (action === "share-partner-wa") {
      const ord = (state.dataset.orders || []).find(o => String(o.id) === String(actEl.dataset.id));
      if (!ord || !WA) return;
      const settings = getEffectiveSettings();
      if (!settings.partner_whatsapp) {
        toast("Atur Nomor WhatsApp Partner terlebih dahulu di tab Pengaturan.", "error");
        return;
      }
      WA.openPartnerWhatsApp(ord, settings);
      toast(`Membuka WhatsApp Partner (${settings.partner_name}) untuk #${ord.order_code}...`);
    } else if (action === "preview-partner-share") {
      openPartnerShareModal(actEl.dataset.id);
    } else if (action === "copy-partner-text") {
      const ord = (state.dataset.orders || []).find(o => String(o.id) === String(actEl.dataset.id));
      if (!ord || !WA) return;
      const txt = WA.buildPartnerMessage(ord, getEffectiveSettings());
      WA.copyMessage(txt).then(ok => {
        toast(ok ? `Format teks partner #${ord.order_code} disalin!` : "Gagal menyalin teks.", ok ? "" : "error");
      });
    } else if (action === "copy-partner-modal-text") {
      const ta = $("#partner-share-textarea");
      if (!ta || !WA) return;
      WA.copyMessage(ta.value).then(ok => {
        toast(ok ? "Teks format partner berhasil disalin!" : "Gagal menyalin teks.", ok ? "" : "error");
      });
    } else if (action === "send-partner-modal-wa") {
      const ord = (state.dataset.orders || []).find(o => String(o.id) === String(actEl.dataset.id));
      const ta = $("#partner-share-textarea");
      if (!ord || !WA) return;
      const settings = getEffectiveSettings();
      WA.openPartnerWhatsApp(ord, settings, ta ? ta.value : undefined);
      toast(`Mengirim pesanan #${ord.order_code} ke WhatsApp ${settings.partner_name}...`);
    } else if (action === "toggle-testimonial-publish") {
      const id = actEl.dataset.id;
      const nextVal = actEl.dataset.next === "true";
      try {
        await SB.toggleTestimonialPublish(id, nextVal);
        toast(nextVal ? "Testimoni ditampilkan kembali ke publik." : "Testimoni disembunyikan dari publik.");
        await reloadData();
      } catch (err) {
        toast("Gagal memperbarui testimoni: " + err.message, "error");
      }
    } else if (action === "delete-testimonial") {
      const t = (state.dataset.testimonials || []).find(x => String(x.id) === String(actEl.dataset.id));
      if (!confirm("Hapus testimoni ini secara permanen?")) return;
      try {
        await SB.deleteTestimonial(actEl.dataset.id, t ? t.photo_url : null);
        toast("Testimoni dihapus.");
        await reloadData();
      } catch (err) {
        toast("Gagal menghapus testimoni: " + err.message, "error");
      }
    } else if (action === "delete-order") {
      if (!confirm("Hapus pesanan ini dari riwayat & laporan keuangan secara permanen?")) return;
      try {
        await SB.deleteOrder(actEl.dataset.id);
        toast("Pesanan dihapus.");
        await reloadData();
      } catch (err) {
        toast("Gagal menghapus pesanan: " + err.message, "error");
      }
    } else if (action === "quick-complete-order") {
      const ord = (state.dataset.orders || []).find(o => String(o.id) === String(actEl.dataset.id));
      if (!ord) return;
      try {
        await SB.reconcileOrder({
          orderId: ord.id,
          status: "completed",
          finalPaidTotal: ord.final_paid_total,
          totalCostAmount: ord.total_cost_amount,
          serviceFeeProfit: ord.service_fee_profit,
          adminNotes: ord.admin_notes
        });
        toast(`Pesanan #${ord.order_code} ditandai Selesai.`);
        await reloadData();
      } catch (err) {
        toast(err.message, "error");
      }
    } else if (action === "open-manual-order") {
      openManualOrderModal();
    } else if (action === "open-menu-modal") {
      openMenuModal(null);
    } else if (action === "edit-menu") {
      openMenuModal(actEl.dataset.id);
    } else if (action === "delete-menu") {
      if (!confirm("Hapus menu ini dari katalog?")) return;
      try {
        await SB.deleteMenuItem(actEl.dataset.id);
        toast("Menu dihapus.");
        await reloadData();
      } catch (err) {
        toast(err.message, "error");
      }
    } else if (action === "toggle-menu-avail") {
      const it = (state.dataset.menuItems || []).find(x => x.id === actEl.dataset.id);
      if (!it) return;
      try {
        await SB.upsertMenuItem(Object.assign({}, it, { is_available: it.is_available === false, updated_at: new Date().toISOString() }));
        toast(`Status stok ${it.name} diperbarui.`);
        await reloadData();
      } catch (err) {
        toast(err.message, "error");
      }
    } else if (action === "open-outlet-modal") {
      openOutletModal(null);
    } else if (action === "edit-outlet") {
      openOutletModal(actEl.dataset.id);
    } else if (action === "delete-outlet") {
      if (!confirm("Hapus outlet ini?")) return;
      try {
        await SB.deleteOutlet(actEl.dataset.id);
        toast("Outlet dihapus.");
        await reloadData();
      } catch (err) {
        toast(err.message, "error");
      }
    } else if (action === "toggle-outlet-open") {
      const o = (state.dataset.outlets || []).find(x => x.id === actEl.dataset.id);
      if (!o) return;
      try {
        await SB.upsertOutlet(Object.assign({}, o, { is_open: o.is_open === false, updated_at: new Date().toISOString() }));
        toast(`Status outlet ${o.name} diperbarui.`);
        await reloadData();
      } catch (err) {
        toast(err.message, "error");
      }
    } else if (action === "sync-reseller-hpp") {
      const targetItems = (state.dataset.menuItems || []).filter(m =>
        ["kenangan", "fore", "janji-jiwa"].includes(m.brand_id)
      );
      if (!targetItems.length) return;
      if (!confirm(`Terapkan HPP Modal Reseller Opsi 3 & Biaya Jasa Rp 0/item pada ${targetItems.length} menu aktif (Kenangan, Fore, Janji Jiwa)?`)) return;
      try {
        const nowIso = new Date().toISOString();
        const updates = targetItems.map(m => Object.assign({}, m, {
          price_cost: computeResellerCostUnit(m),
          service_fee_unit: 0,
          updated_at: nowIso
        }));
        for (let i = 0; i < updates.length; i += 100) {
          await SB.upsertMenuItem(updates.slice(i, i + 100));
        }
        toast(`HPP Reseller Opsi 3 berhasil diterapkan ke ${updates.length} menu!`);
        await reloadData();
      } catch (err) {
        toast("Gagal menerapkan HPP Reseller: " + err.message, "error");
      }
    } else if (action === "edit-brand") {
      openBrandModal(actEl.dataset.id);
    }
  }

  const debouncedRenderOrders = U.debounce(() => {
    render();
    const input = $("#order-search");
    if (input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  }, 260);

  const debouncedRenderMenus = U.debounce(() => {
    render();
    const input = $("#admin-menu-search");
    if (input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  }, 260);

  function handleInput(e) {
    const id = e.target.id;
    if (id === "order-search") {
      state.orderQuery = e.target.value;
      debouncedRenderOrders();
    } else if (id === "admin-menu-search") {
      state.menuQuery = e.target.value;
      debouncedRenderMenus();
    } else if (id === "mf-orig" || id === "mf-cost" || id === "mf-sell" || id === "mf-fee") {
      updateMenuProfitPreview();
    } else if (id === "mf-image") {
      const thumb = $("#mf-thumb");
      if (thumb && e.target.value.trim()) thumb.src = e.target.value.trim();
    } else if (id === "bf-logo") {
      const thumb = $("#bf-thumb");
      if (thumb && e.target.value.trim()) thumb.src = e.target.value.trim();
    }
  }

  async function handleChange(e) {
    const id = e.target.id;
    if (id === "finance-period") {
      state.periodFilter = e.target.value;
      render();
    } else if (id === "finance-scope") {
      state.scopeFilter = e.target.value;
      render();
    } else if (id === "order-status-filter") {
      state.orderStatusFilter = e.target.value;
      render();
    } else if (id === "admin-menu-brand") {
      state.menuBrandFilter = e.target.value;
      render();
    } else if (id === "admin-outlet-brand") {
      state.outletBrandFilter = e.target.value;
      render();
    } else if (id === "man-brand") {
      const brandId = e.target.value;
      const outlets = (state.dataset.outlets || []).filter(o => o.brand_id === brandId);
      const menus = (state.dataset.menuItems || []).filter(m => m.brand_id === brandId);
      const outSel = $("#man-outlet");
      const menSel = $("#man-menu");
      if (outSel) outSel.innerHTML = outlets.map(o => `<option value="${U.esc(o.id)}">${U.esc(o.name)} (${U.esc(o.area)})</option>`).join("");
      if (menSel) menSel.innerHTML = menus.map(m => `<option value="${U.esc(m.id)}">${U.esc(m.name)} — ${U.rp(m.price_discount)}</option>`).join("");
    } else if (id === "mf-image-file" && e.target.files && e.target.files[0]) {
      try {
        const rawFile = e.target.files[0];
        const statusEl = $("#mf-compress-status");
        if (statusEl) statusEl.textContent = "Mengompres gambar ke WebP & mengunggah ke Supabase...";
        toast("Mengompres & mengunggah foto produk...");

        const comp = window.DLM_COMPRESSOR
          ? await window.DLM_COMPRESSOR.compress(rawFile, "product")
          : { file: rawFile, originalSize: rawFile.size, compressedSize: rawFile.size, savedPercent: 0, skipped: true };

        const url = await SB.uploadPublicAsset("products", comp.file);
        const inp = $("#mf-image");
        const thumb = $("#mf-thumb");
        if (inp) inp.value = url;
        if (thumb) thumb.src = url;

        if (statusEl) {
          if (comp.skipped) {
            statusEl.innerHTML = `<span class="compress-badge">${U.esc(comp.reason || "Siap pakai")} • ${window.DLM_COMPRESSOR.formatBytes(comp.compressedSize)}</span>`;
          } else {
            statusEl.innerHTML = `<span class="compress-badge">Dikompres WebP: ${window.DLM_COMPRESSOR.formatBytes(comp.originalSize)} → ${window.DLM_COMPRESSOR.formatBytes(comp.compressedSize)} (Hemat ${comp.savedPercent}%)</span>`;
          }
        }
        toast(comp.skipped ? "Foto berhasil diunggah." : `Foto dikompres (hemat ${comp.savedPercent}%) & berhasil diunggah!`);
      } catch (err) {
        toast("Gagal upload: " + err.message, "error");
      }
    } else if (id === "bf-logo-file" && e.target.files && e.target.files[0]) {
      try {
        const rawFile = e.target.files[0];
        const statusEl = $("#bf-compress-status");
        if (statusEl) statusEl.textContent = "Memproses & mengunggah logo...";
        toast("Memproses & mengunggah logo brand...");

        const comp = window.DLM_COMPRESSOR
          ? await window.DLM_COMPRESSOR.compress(rawFile, "logo")
          : { file: rawFile, originalSize: rawFile.size, compressedSize: rawFile.size, savedPercent: 0, skipped: true };

        const url = await SB.uploadPublicAsset("brands", comp.file);
        const inp = $("#bf-logo");
        const thumb = $("#bf-thumb");
        if (inp) inp.value = url;
        if (thumb) thumb.src = url;

        if (statusEl) {
          statusEl.innerHTML = comp.skipped
            ? `<span class="compress-badge">${U.esc(comp.reason || "Dipertahankan utuh")} • ${window.DLM_COMPRESSOR.formatBytes(comp.compressedSize)}</span>`
            : `<span class="compress-badge">WebP: ${window.DLM_COMPRESSOR.formatBytes(comp.originalSize)} → ${window.DLM_COMPRESSOR.formatBytes(comp.compressedSize)} (Hemat ${comp.savedPercent}%)</span>`;
        }
        toast("Logo brand berhasil diunggah.");
      } catch (err) {
        toast("Gagal upload: " + err.message, "error");
      }
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;

    if (form.id === "login-form") {
      const email = $("#login-email").value.trim();
      const password = $("#login-password").value;
      try {
        const res = await SB.signIn(email, password);
        state.user = res.user;
        toast("Selamat datang di Panel Admin!");
        await reloadData();
      } catch (err) {
        toast("Login gagal: " + err.message, "error");
      }
      return;
    }

    if (form.id === "reconcile-form") {
      try {
        await SB.reconcileOrder({
          orderId: form.dataset.orderId,
          status: $("#rec-status").value,
          finalPaidTotal: $("#rec-final-paid").value,
          totalCostAmount: $("#rec-cost").value,
          serviceFeeProfit: $("#rec-fee").value,
          adminNotes: $("#rec-notes").value
        });
        closeAdminModal();
        toast("Rekonsiliasi pesanan & perhitungan laba disimpan.");
        await reloadData();
      } catch (err) {
        toast("Gagal menyimpan: " + err.message, "error");
      }
      return;
    }

    if (form.id === "manual-order-form") {
      const brandId = $("#man-brand").value;
      const outletId = $("#man-outlet").value;
      const menuId = $("#man-menu").value;
      const qty = Math.max(1, parseInt($("#man-qty").value, 10) || 1);
      const brand = (state.dataset.brands || []).find(b => b.id === brandId);
      const outlet = (state.dataset.outlets || []).find(o => o.id === outletId);
      const menu = (state.dataset.menuItems || []).find(m => m.id === menuId);
      if (!brand || !outlet || !menu) return;

      try {
        await SB.submitCustomerOrder({
          order_code: U.uid("DLM"),
          status: $("#man-status").value,
          brand_id: brand.id,
          brand_name: brand.name,
          outlet_id: outlet.id,
          outlet_name: outlet.name,
          outlet_area: outlet.area,
          customer_name: $("#man-name").value.trim(),
          customer_phone: $("#man-phone").value.trim(),
          order_mode: $("#man-mode").value,
          pickup_time: "Via WhatsApp",
          items: [{
            id: menu.id,
            name: menu.name,
            category: menu.category,
            quantity: qty,
            unit_price: Number(menu.price_discount),
            unit_original_price: Number(menu.price_original),
            selections: []
          }]
        });
        closeAdminModal();
        toast("Transaksi WA manual berhasil ditambahkan.");
        await reloadData();
      } catch (err) {
        toast("Gagal menambah transaksi: " + err.message, "error");
      }
      return;
    }

    if (form.id === "bulk-profit-form") {
      try {
        const count = await SB.applyBulkProfitRules({
          brandId: $("#rule-brand").value,
          costRatioPercent: $("#rule-cost-ratio").value,
          serviceFeeUnit: $("#rule-service-fee").value,
          targetSpreadMargin: $("#rule-spread-margin").value,
          recalculateSellingPrice: $("#rule-recalc-selling").checked
        });
        toast(`Aturan keuntungan berhasil diterapkan ke ${count} menu.`);
        await reloadData();
      } catch (err) {
        toast("Gagal menerapkan aturan: " + err.message, "error");
      }
      return;
    }

    if (form.id === "menu-form") {
      const existingId = form.dataset.existingId;
      const brandId = $("#mf-brand").value;
      const name = $("#mf-name").value.trim();
      const slug = existingId || `${brandId}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      const existingObj = existingId ? (state.dataset.menuItems || []).find(x => x.id === existingId) : null;

      try {
        await SB.upsertMenuItem({
          id: slug,
          brand_id: brandId,
          name,
          category: $("#mf-category").value.trim(),
          type: $("#mf-type").value,
          description: $("#mf-desc").value.trim(),
          info: existingObj ? existingObj.info : "Disajikan segar • 16 oz",
          image_url: $("#mf-image").value.trim(),
          price_original: Number($("#mf-orig").value),
          price_cost: Number($("#mf-cost").value),
          price_discount: Number($("#mf-sell").value),
          service_fee_unit: Number($("#mf-fee").value),
          is_best_seller: $("#mf-best").checked,
          is_available: $("#mf-avail").checked,
          option_groups: (existingObj && Array.isArray(existingObj.option_groups) && existingObj.option_groups.length)
            ? existingObj.option_groups
            : buildDefaultOptionGroups(brandId, $("#mf-type").value, name, $("#mf-category").value.trim()),
          sort_order: existingObj ? existingObj.sort_order : 10,
          updated_at: new Date().toISOString()
        });
        closeAdminModal();
        toast("Data menu disimpan.");
        await reloadData();
      } catch (err) {
        toast("Gagal menyimpan menu: " + err.message, "error");
      }
      return;
    }

    if (form.id === "outlet-form") {
      const existingId = form.dataset.existingId;
      const brandId = $("#of-brand").value;
      const name = $("#of-name").value.trim();
      const slug = existingId || `${brandId}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

      const existingObj = existingId ? (state.dataset.outlets || []).find(x => x.id === existingId) : null;
      const latRaw = $("#of-lat") ? $("#of-lat").value.trim() : "";
      const lngRaw = $("#of-lng") ? $("#of-lng").value.trim() : "";
      const latitude = latRaw !== "" && !Number.isNaN(Number(latRaw)) ? Number(latRaw) : null;
      const longitude = lngRaw !== "" && !Number.isNaN(Number(lngRaw)) ? Number(lngRaw) : null;
      const addrVal = $("#of-address").value.trim();

      try {
        await SB.upsertOutlet({
          id: slug,
          brand_id: brandId,
          name,
          area: $("#of-area").value.trim(),
          address: addrVal,
          hours: $("#of-hours").value.trim(),
          distance: "GPS",
          latitude,
          longitude,
          maps_query: `${name}, ${addrVal}`,
          is_open: $("#of-open").checked,
          is_active: true,
          sort_order: existingObj && existingObj.sort_order != null ? existingObj.sort_order : 10,
          updated_at: new Date().toISOString()
        });
        closeAdminModal();
        toast("Data outlet disimpan.");
        await reloadData();
      } catch (err) {
        toast("Gagal menyimpan outlet: " + err.message, "error");
      }
      return;
    }

    if (form.id === "brand-form") {
      const brandId = form.dataset.brandId;
      const existing = (state.dataset.brands || []).find(x => x.id === brandId);
      if (!existing) return;
      try {
        await SB.upsertBrand(Object.assign({}, existing, {
          name: $("#bf-name").value.trim(),
          promo_badge: $("#bf-promo").value.trim(),
          tagline: $("#bf-tagline").value.trim(),
          logo_url: $("#bf-logo").value.trim(),
          updated_at: new Date().toISOString()
        }));
        closeAdminModal();
        toast("Data brand diperbarui.");
        await reloadData();
      } catch (err) {
        toast("Gagal menyimpan brand: " + err.message, "error");
      }
      return;
    }

    if (form.id === "settings-form") {
      try {
        const newAppName = $("#set-app-name").value.trim();
        const partnerPatch = {
          partner_name: ($("#set-partner-name") && $("#set-partner-name").value.trim()) || "Jasdor Moulii",
          partner_whatsapp: ($("#set-partner-wa") && U.normalizePhone($("#set-partner-wa").value.trim())) || "6281521692248",
          partner_payment_methods: ($("#set-partner-pay") && $("#set-partner-pay").value.trim()) || "BCA / GoPay / Dana / QRIS",
          partner_use_admin_phone: !!($("#set-partner-use-admin-phone") && $("#set-partner-use-admin-phone").checked),
          customer_payment_methods: ($("#set-customer-pay") && $("#set-customer-pay").value.trim()) || "QRIS / Transfer Bank / E-Wallet (konfirmasi via Admin)"
        };
        U.storage.set(PARTNER_LOCAL_KEY, partnerPatch);

        const basePayload = {
          app_name: newAppName,
          admin_whatsapp: $("#set-wa-number").value.trim(),
          admin_whatsapp_display: $("#set-wa-display").value.trim(),
          city: $("#set-city").value.trim(),
          service_fee_mode: $("#set-fee-mode").value,
          default_service_fee_per_item: Number($("#set-fee-item").value),
          default_service_fee_per_order: Number($("#set-fee-order").value),
          default_cost_ratio_percent: Number($("#set-cost-ratio").value),
          payment_note: $("#set-payment-note").value.trim()
        };

        try {
          await SB.saveSettings(Object.assign({}, basePayload, partnerPatch));
        } catch (colErr) {
          // Graceful fallback if new partner columns haven't been migrated in DB yet
          await SB.saveSettings(basePayload);
        }

        if (newAppName) CFG.appName = newAppName;
        CFG.partnerName = partnerPatch.partner_name;
        CFG.partnerWhatsApp = partnerPatch.partner_whatsapp;
        CFG.partnerPaymentMethods = partnerPatch.partner_payment_methods;
        CFG.partnerUseAdminPhone = partnerPatch.partner_use_admin_phone;
        CFG.customerPaymentMethods = partnerPatch.customer_payment_methods;
        try {
          if (CFG.storageKeys && CFG.storageKeys.catalogCache) {
            localStorage.removeItem(CFG.storageKeys.catalogCache);
          }
        } catch (err2) { /* ignore */ }
        toast("Pengaturan layanan & partner berhasil disimpan!");
        await reloadData();
      } catch (err) {
        toast("Gagal menyimpan pengaturan: " + err.message, "error");
      }
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
