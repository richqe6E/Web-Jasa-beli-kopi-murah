/* ============================================================
   PRODUCT CUSTOMIZER — BOTTOM SHEET
   ============================================================ */
(function () {
  "use strict";

  const U = window.DLM_UTIL;
  const CFG = window.DLM_CONFIG;
  const ICON = window.DLM_ICONS;
  const CART = window.DLM_CART;

  let currentItem = null;
  let currentBrand = null;
  let selections = {};
  let notes = "";
  let quantity = 1;
  let onAdded = null;
  let lastFocus = null;
  let root = null;
  let isSatuanMode = false;
  let bundleDrinks = [];
  let bundleFoods = [];
  let editingDrinkIdx = -1;

  function getEffectiveGroups(item) {
    const groups = (item && Array.isArray(item.optionGroups)) ? item.optionGroups : [];
    if (!isSatuanMode) return groups;
    return groups.map(g => {
      if (g.id !== "size") return g;
      const regOnly = (g.options || []).filter(o => o.id === "regular");
      if (!regOnly.length) return g;
      return Object.assign({}, g, {
        helper: "Mode Satuan • Khusus Regular",
        defaultOptionId: "regular",
        options: regOnly
      });
    });
  }

  function isBundleItemAvailable(entry) {
    if (!entry || entry.partnerAvailable === false) return false;
    const unavail = (currentBrand && Array.isArray(currentBrand.unavailableNames))
      ? currentBrand.unavailableNames
      : [];
    return !unavail.includes(String(entry.name || "").trim().toLowerCase());
  }

  function isBundleComplete() {
    if (!currentItem || !currentItem.bundleSpec) return true;
    const spec = currentItem.bundleSpec;
    return bundleDrinks.length === Number(spec.drinkSlots || 0) &&
      bundleFoods.length === Number(spec.foodSlots || 0);
  }

  function getBundleRemainingCount() {
    if (!currentItem || !currentItem.bundleSpec) return 0;
    const spec = currentItem.bundleSpec;
    const dRem = Math.max(0, Number(spec.drinkSlots || 0) - bundleDrinks.length);
    const fRem = Math.max(0, Number(spec.foodSlots || 0) - bundleFoods.length);
    return dRem + fRem;
  }

  function isGroupVisible(group) {
    if (!group.dependsOn) return true;
    const parentGroup = getEffectiveGroups(currentItem).find(g => g.id === group.dependsOn.groupId);
    if (!parentGroup) return true;
    return selections[parentGroup.id] === group.dependsOn.optionId;
  }

  function initSelections(item) {
    selections = {};
    bundleDrinks = [];
    bundleFoods = [];
    editingDrinkIdx = -1;
    getEffectiveGroups(item).forEach(group => {
      if (group.type === "multiple") {
        selections[group.id] = [];
      } else {
        selections[group.id] = group.defaultOptionId || (group.options[0] && group.options[0].id) || null;
      }
    });
    syncDependencies();
  }

  function syncDependencies() {
    if (!currentItem) return;
    getEffectiveGroups(currentItem).forEach(group => {
      if (!isGroupVisible(group)) {
        if (group.type === "multiple") selections[group.id] = [];
        else delete selections[group.id];
      } else if (group.type === "single" && !selections[group.id]) {
        selections[group.id] = group.defaultOptionId || (group.options[0] && group.options[0].id) || null;
      }
    });
  }

  function getPricing() {
    if (!currentItem) return { unitPrice: 0, unitOriginal: 0, totalPrice: 0, totalOriginal: 0, savings: 0 };
    let unitPrice = currentItem.priceDiscount;
    let unitOriginal = currentItem.priceOriginal;

    if (currentItem.type === "bundle" && currentItem.bundleSpec) {
      bundleDrinks.forEach(d => {
        const extra = Number(d.extraPrice || 0);
        unitPrice += extra;
        unitOriginal += extra;
      });
      bundleFoods.forEach(f => {
        const extra = Number(f.extraPrice || 0);
        unitPrice += extra;
        unitOriginal += extra;
      });
    } else {
      getEffectiveGroups(currentItem).forEach(group => {
        if (!isGroupVisible(group)) return;
        if (group.type === "single") {
          const selected = group.options.find(o => o.id === selections[group.id]);
          if (selected) {
            unitPrice += selected.price || 0;
            unitOriginal += selected.price || 0;
          }
        } else {
          (selections[group.id] || []).forEach(id => {
            const selected = group.options.find(o => o.id === id);
            if (selected) {
              unitPrice += selected.price || 0;
              unitOriginal += selected.price || 0;
            }
          });
        }
      });
    }

    const totalPrice = unitPrice * quantity;
    const totalOriginal = unitOriginal * quantity;
    return {
      unitPrice,
      unitOriginal,
      totalPrice,
      totalOriginal,
      savings: Math.max(0, totalOriginal - totalPrice)
    };
  }

  function getSelectedOptions() {
    const result = [];
    if (!currentItem) return result;
    if (currentItem.type === "bundle" && currentItem.bundleSpec) {
      bundleDrinks.forEach((d, idx) => {
        const detail = d.temp === "Ice" ? `${d.temp}, ${d.sugar}, ${d.ice}` : `${d.temp}, ${d.sugar}`;
        result.push({
          groupId: `bundle-drink-${idx + 1}`,
          groupLabel: `Minuman ${idx + 1}`,
          optionId: `${d.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${idx}`,
          label: `${d.name} (${detail})`,
          note: "",
          price: Number(d.extraPrice || 0)
        });
      });
      bundleFoods.forEach((f, idx) => {
        result.push({
          groupId: `bundle-food-${idx + 1}`,
          groupLabel: `Makanan ${idx + 1}`,
          optionId: `${f.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${idx}`,
          label: f.name,
          note: "",
          price: Number(f.extraPrice || 0)
        });
      });
      return result;
    }

    getEffectiveGroups(currentItem).forEach(group => {
      if (!isGroupVisible(group)) return;
      if (group.type === "single") {
        const selected = group.options.find(o => o.id === selections[group.id]);
        if (selected) {
          result.push({
            groupId: group.id,
            groupLabel: group.label,
            optionId: selected.id,
            label: selected.label,
            note: selected.note || "",
            price: selected.price || 0
          });
        }
      } else {
        (selections[group.id] || []).forEach(id => {
          const selected = group.options.find(o => o.id === id);
          if (selected) {
            result.push({
              groupId: group.id,
              groupLabel: group.label,
              optionId: selected.id,
              label: selected.label,
              note: selected.note || "",
              price: selected.price || 0
            });
          }
        });
      }
    });
    return result;
  }

  function optionButton(group, option, isActive) {
    const price = option.price > 0
      ? `<span class="option-price">+${U.rp(option.price)}</span>`
      : (option.note ? `<span class="option-note">${U.esc(option.note)}</span>` : "");
    return `
      <button type="button" class="option-card ${isActive ? "is-active" : ""}" data-group="${U.esc(group.id)}" data-option="${U.esc(option.id)}" aria-pressed="${isActive ? "true" : "false"}">
        <span class="option-label">${U.esc(option.label)}</span>
        ${price}
      </button>
    `;
  }

  function toppingRow(group, option, isActive) {
    return `
      <button type="button" class="topping-row ${isActive ? "is-active" : ""}" data-group="${U.esc(group.id)}" data-option="${U.esc(option.id)}" aria-pressed="${isActive ? "true" : "false"}">
        <span class="topping-check">${isActive ? ICON.icon("check", "w-3.5 h-3.5", 2.6) : ""}</span>
        <span class="topping-name">${U.esc(option.label)}</span>
        <span class="topping-price">+${U.rp(option.price)}</span>
      </button>
    `;
  }

  function groupMarkup(group) {
    const visible = isGroupVisible(group);
    const required = group.required ? `<span class="req-badge">Wajib</span>` : "";
    let content = "";

    if (group.type === "multiple") {
      content = `<div class="topping-list">${group.options.map(option => {
        const active = (selections[group.id] || []).includes(option.id);
        return toppingRow(group, option, active);
      }).join("")}</div>`;
    } else {
      content = `<div class="option-grid">${group.options.map(option => {
        return optionButton(group, option, selections[group.id] === option.id);
      }).join("")}</div>`;
    }

    return `
      <section class="option-group ${visible ? "" : "is-hidden"}" data-group-wrap="${U.esc(group.id)}">
        <div class="option-head">
          <div>
            <h3 class="option-title">${U.esc(group.label)} ${required}</h3>
            <p class="option-helper">${U.esc(group.helper || "")}</p>
          </div>
          ${group.type === "multiple" ? `<span class="option-max">Maks ${group.max || CFG.maxToppings}</span>` : ""}
        </div>
        ${content}
      </section>
    `;
  }

  function bundleBuilderMarkup(item) {
    const spec = item.bundleSpec;
    if (!spec) return "";
    const drinkSlots = Number(spec.drinkSlots || 0);
    const foodSlots = Number(spec.foodSlots || 0);
    const drinksFull = bundleDrinks.length >= drinkSlots;
    const foodsFull = bundleFoods.length >= foodSlots;

    return `
      ${drinkSlots > 0 ? `
        <section class="option-group" id="bundle-drinks-section">
          <div class="option-head">
            <div>
              <h3 class="option-title">Opsi 1: Pilihan Minuman <span class="req-badge">Pilih ${drinkSlots} (${bundleDrinks.length}/${drinkSlots})</span></h3>
              <p class="option-helper">Ketuk menu di bawah untuk mengisi slot minuman. Kamu bisa ubah suhu, gula &amp; es tiap cup.</p>
            </div>
          </div>

          ${bundleDrinks.length ? `
            <div class="bundle-chosen-list">
              ${bundleDrinks.map((d, idx) => {
                const detail = d.temp === "Ice" ? `${d.temp} • ${d.sugar} • ${d.ice}` : `${d.temp} • ${d.sugar}`;
                const isEditing = editingDrinkIdx === idx;
                return `
                  <div class="bundle-chosen-chip ${isEditing ? "is-editing" : ""}">
                    <div class="bundle-chosen-top">
                      <div>
                        <strong>Slot ${idx + 1}: ${U.esc(d.name)} ${d.extraPrice > 0 ? `<span class="bundle-extra-tag">+${U.rp(d.extraPrice)}</span>` : ""}</strong>
                        <span>${U.esc(detail)}</span>
                      </div>
                      <div class="bundle-chosen-actions">
                        <button type="button" class="btn-soft btn-xs" data-bundle-edit-drink="${idx}">${isEditing ? "Selesai" : "✎ Ubah"}</button>
                        <button type="button" class="icon-btn danger" data-bundle-remove-drink="${idx}" aria-label="Hapus slot ${idx + 1}">${ICON.icon("x", "w-3.5 h-3.5", 2.4)}</button>
                      </div>
                    </div>
                    ${isEditing ? `
                      <div class="bundle-subdrawer">
                        <div class="bundle-sub-row">
                          <span class="bundle-sub-label">Suhu:</span>
                          <div class="bundle-sub-pills">
                            ${["Ice", "Hot"].map(t => `<button type="button" class="bundle-pill ${d.temp === t ? "is-active" : ""}" data-bundle-opt="temp" data-val="${t}" data-idx="${idx}">${t}</button>`).join("")}
                          </div>
                        </div>
                        <div class="bundle-sub-row">
                          <span class="bundle-sub-label">Kemanisan:</span>
                          <div class="bundle-sub-pills">
                            ${["Normal Sugar", "Less Sugar", "No Sugar"].map(s => `<button type="button" class="bundle-pill ${d.sugar === s ? "is-active" : ""}" data-bundle-opt="sugar" data-val="${s}" data-idx="${idx}">${s}</button>`).join("")}
                          </div>
                        </div>
                        ${d.temp === "Ice" ? `
                          <div class="bundle-sub-row">
                            <span class="bundle-sub-label">Jumlah Es:</span>
                            <div class="bundle-sub-pills">
                              ${["Normal Ice", "Less Ice", "No Ice"].map(i => `<button type="button" class="bundle-pill ${d.ice === i ? "is-active" : ""}" data-bundle-opt="ice" data-val="${i}" data-idx="${idx}">${i}</button>`).join("")}
                            </div>
                          </div>
                        ` : ""}
                      </div>
                    ` : ""}
                  </div>
                `;
              }).join("")}
            </div>
          ` : ""}

          <div class="bundle-slot-grid">
            ${(spec.allowedDrinks || []).map((d, dIdx) => {
              const avail = isBundleItemAvailable(d);
              const countChosen = bundleDrinks.filter(x => x.name === d.name).length;
              return `
                <button type="button" class="bundle-slot-card ${avail ? "" : "is-disabled"} ${countChosen > 0 ? "has-picked" : ""}" data-bundle-add-drink="${dIdx}" ${!avail || drinksFull ? "disabled" : ""}>
                  <span class="bundle-slot-name">${U.esc(d.name)}</span>
                  <span class="bundle-slot-meta">
                    ${!avail ? `<span class="bundle-habis-pill">Habis</span>` : (d.extraPrice > 0 ? `+${U.rp(d.extraPrice)}` : "Termasuk Paket")}
                    ${countChosen > 0 ? ` • <strong>${countChosen}x</strong>` : ""}
                  </span>
                </button>
              `;
            }).join("")}
          </div>
        </section>
      ` : ""}

      ${foodSlots > 0 ? `
        <section class="option-group" id="bundle-foods-section">
          <div class="option-head">
            <div>
              <h3 class="option-title">Opsi 2: Pilihan Makanan <span class="req-badge">Pilih ${foodSlots} (${bundleFoods.length}/${foodSlots})</span></h3>
              <p class="option-helper">Pilih roti / toast / pastry untuk melengkapi paket.</p>
            </div>
          </div>

          ${bundleFoods.length ? `
            <div class="bundle-chosen-list">
              ${bundleFoods.map((f, idx) => `
                <div class="bundle-chosen-chip">
                  <div class="bundle-chosen-top">
                    <div>
                      <strong>Makanan ${idx + 1}: ${U.esc(f.name)} ${f.extraPrice > 0 ? `<span class="bundle-extra-tag">+${U.rp(f.extraPrice)}</span>` : ""}</strong>
                      <span>Standar Outlet Resmi</span>
                    </div>
                    <button type="button" class="icon-btn danger" data-bundle-remove-food="${idx}" aria-label="Hapus makanan ${idx + 1}">${ICON.icon("x", "w-3.5 h-3.5", 2.4)}</button>
                  </div>
                </div>
              `).join("")}
            </div>
          ` : ""}

          <div class="bundle-slot-grid">
            ${(spec.allowedFoods || []).map((f, fIdx) => {
              const avail = isBundleItemAvailable(f);
              const countChosen = bundleFoods.filter(x => x.name === f.name).length;
              return `
                <button type="button" class="bundle-slot-card ${avail ? "" : "is-disabled"} ${countChosen > 0 ? "has-picked" : ""}" data-bundle-add-food="${fIdx}" ${!avail || foodsFull ? "disabled" : ""}>
                  <span class="bundle-slot-name">${U.esc(f.name)}</span>
                  <span class="bundle-slot-meta">
                    ${!avail ? `<span class="bundle-habis-pill">Habis</span>` : (f.extraPrice > 0 ? `+${U.rp(f.extraPrice)}` : "Termasuk Paket")}
                    ${countChosen > 0 ? ` • <strong>${countChosen}x</strong>` : ""}
                  </span>
                </button>
              `;
            }).join("")}
          </div>
        </section>
      ` : ""}
    `;
  }

  function render() {
    const item = currentItem;
    const pricing = getPricing();
    const hasOriginalDiff = item.priceOriginal > item.priceDiscount;
    const discount = hasOriginalDiff ? Math.round(((item.priceOriginal - item.priceDiscount) / item.priceOriginal) * 100) : 0;
    const visibleGroups = getEffectiveGroups(item);
    const isBundle = item.type === "bundle" && !!item.bundleSpec;
    const remainingSlots = getBundleRemainingCount();
    const ctaText = isBundle && remainingSlots > 0
      ? `Pilih ${remainingSlots} menu lagi`
      : (isBundle ? "Masukkan ke Keranjang" : "Tambah ke Keranjang");

    root.innerHTML = `
      <div class="sheet-overlay" data-sheet-overlay>
        <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
          <div class="sheet-handle" aria-hidden="true"></div>
          <button type="button" class="sheet-close" data-sheet-close aria-label="Tutup detail produk">
            ${ICON.icon("x", "w-4 h-4", 2.4)}
          </button>

          <div class="sheet-scroll">
            <div class="sheet-hero">
              <div class="media-fallback">${ICON.icon("coffee", "w-12 h-12", 1.5)}</div>
              ${U.imageTag(item.image, item.name, "sheet-hero-img")}
              <div class="sheet-hero-shade"></div>
              <div class="sheet-hero-badges">
                ${discount > 0 ? `<span class="badge badge-save">-${discount}%</span>` : ""}
                ${isSatuanMode ? `<span class="badge badge-best">Satuan • Bebas Fee</span>` : (item.badge ? `<span class="badge badge-best">${U.esc(item.badge)}</span>` : (item.isBestSeller ? `<span class="badge badge-best">${ICON.icon("star", "w-3 h-3", 2.2)} Best Seller</span>` : ""))}
              </div>
            </div>

            <div class="sheet-body">
              <div class="sheet-title-row">
                <div class="min-w-0">
                  <p class="eyebrow">${U.esc(currentBrand.shortName)}${isSatuanMode ? " • Mode Satuan" : (isBundle ? " • Paket Bundling" : "")}</p>
                  <h2 id="sheet-title" class="sheet-title">${U.esc(item.name)}</h2>
                  <p class="sheet-desc">${U.esc(item.description)}</p>
                </div>
              </div>

              <div class="sheet-price-row">
                <div>
                  <span class="price-now">${U.rp(item.priceDiscount)}</span>
                  ${hasOriginalDiff ? `<span class="price-old">${U.rp(item.priceOriginal)}</span>` : ""}
                </div>
                ${hasOriginalDiff ? `<span class="save-pill">Hemat ${U.rp(item.priceOriginal - item.priceDiscount)}</span>` : ""}
              </div>

              <div class="info-chips">
                <span class="info-chip">${ICON.icon("info", "w-3.5 h-3.5", 2)} ${U.esc(item.info)}</span>
                <span class="info-chip">${ICON.icon("star", "w-3.5 h-3.5", 2)} ${U.esc(item.rating)} • ${U.esc(item.sold)} terjual</span>
              </div>

              <div class="sheet-divider"></div>

              ${isBundle ? bundleBuilderMarkup(item) : visibleGroups.map(groupMarkup).join("")}

              ${item.showNotes !== false ? `
                <section class="option-group">
                  <div class="option-head">
                    <div>
                      <h3 class="option-title">${isBundle ? "Catatan Paket" : "Catatan Tambahan"}</h3>
                      <p class="option-helper">Opsional, tulis permintaan khususmu.</p>
                    </div>
                  </div>
                  <textarea id="customizer-notes" class="form-input form-textarea" rows="2" maxlength="250" placeholder="Contoh: es dipisah, sedotan 2 pcs, manis dikurangi">${U.esc(notes)}</textarea>
                  <div class="char-count"><span id="notes-count">${notes.length}</span>/250</div>
                </section>
              ` : (!visibleGroups.length && !isBundle ? `
                <p style="font-size:12.5px;color:var(--muted);margin:6px 0 4px">
                  Produk siap dipesan sesuai standar outlet resmi. Atur jumlah pesanan di bawah ini.
                </p>
              ` : "")}
            </div>
          </div>

          <div class="sheet-footer">
            <div class="qty-stepper" role="group" aria-label="Jumlah pesanan">
              <button type="button" class="qty-btn" data-qty="-1" aria-label="Kurangi jumlah">${ICON.icon("minus", "w-4 h-4", 2.4)}</button>
              <span id="customizer-qty" class="qty-value" aria-live="polite">${quantity}</span>
              <button type="button" class="qty-btn" data-qty="1" aria-label="Tambah jumlah">${ICON.icon("plus", "w-4 h-4", 2.4)}</button>
            </div>
            <button type="button" class="btn-primary btn-add-cart" id="customizer-add" ${isBundle && remainingSlots > 0 ? "disabled" : ""}>
              <span id="customizer-cta-label">${ctaText}</span>
              <span class="btn-price" id="customizer-total">${U.rp(pricing.totalPrice)}</span>
            </button>
          </div>
        </div>
      </div>
    `;

    bind();
    updatePrice();
    requestAnimationFrame(() => {
      const overlay = root.querySelector("[data-sheet-overlay]");
      if (overlay) overlay.classList.add("is-open");
    });
  }

  function updatePrice() {
    const pricing = getPricing();
    const totalEl = document.getElementById("customizer-total");
    const qtyEl = document.getElementById("customizer-qty");
    if (totalEl) totalEl.textContent = U.rp(pricing.totalPrice);
    if (qtyEl) qtyEl.textContent = quantity;
  }

  function refreshVisibility() {
    if (!currentItem) return;
    getEffectiveGroups(currentItem).forEach(group => {
      const wrap = root.querySelector(`[data-group-wrap="${group.id}"]`);
      if (wrap) wrap.classList.toggle("is-hidden", !isGroupVisible(group));
    });
  }

  function refreshGroup(groupId) {
    const group = getEffectiveGroups(currentItem).find(g => g.id === groupId);
    if (!group) return;
    const wrap = root.querySelector(`[data-group-wrap="${groupId}"]`);
    if (!wrap) return;
    wrap.querySelectorAll("[data-option]").forEach(btn => {
      const optionId = btn.dataset.option;
      let active = false;
      if (group.type === "multiple") {
        active = (selections[groupId] || []).includes(optionId);
      } else {
        active = selections[groupId] === optionId;
      }
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
      if (group.type === "multiple") {
        const check = btn.querySelector(".topping-check");
        if (check) check.innerHTML = active ? ICON.icon("check", "w-3.5 h-3.5", 2.6) : "";
      }
    });
  }

  function bind() {
    const overlay = root.querySelector("[data-sheet-overlay]");
    const closeBtn = root.querySelector("[data-sheet-close]");
    const notesInput = document.getElementById("customizer-notes");
    const notesCount = document.getElementById("notes-count");

    if (overlay) {
      overlay.addEventListener("click", (event) => {
        if (event.target === overlay) close();
      });
    }
    if (closeBtn) closeBtn.addEventListener("click", close);

    root.querySelectorAll("[data-option]").forEach(btn => {
      btn.addEventListener("click", () => {
        const groupId = btn.dataset.group;
        const optionId = btn.dataset.option;
        const group = getEffectiveGroups(currentItem).find(g => g.id === groupId);
        if (!group) return;

        if (group.type === "multiple") {
          const list = selections[groupId] || [];
          const index = list.indexOf(optionId);
          if (index > -1) {
            list.splice(index, 1);
          } else {
            const max = group.max || CFG.maxToppings;
            if (list.length >= max) {
              if (window.DLM_APP && window.DLM_APP.toast) {
                window.DLM_APP.toast(`Maksimal ${max} pilihan untuk ${group.label}.`, "error");
              }
              return;
            }
            list.push(optionId);
          }
          selections[groupId] = list;
        } else {
          selections[groupId] = optionId;
          syncDependencies();
          refreshVisibility();
          getEffectiveGroups(currentItem).forEach(g => {
            if (g.type === "single") refreshGroup(g.id);
          });
        }
        refreshGroup(groupId);
        updatePrice();
      });
    });

    // Bundle event handlers
    const rerenderBundlePreservingScroll = () => {
      const scrollEl = root.querySelector(".sheet-scroll");
      const scrollTop = scrollEl ? scrollEl.scrollTop : 0;
      render();
      const newScrollEl = root.querySelector(".sheet-scroll");
      if (newScrollEl) newScrollEl.scrollTop = scrollTop;
    };

    root.querySelectorAll("[data-bundle-add-drink]").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.bundleAddDrink, 10);
        const spec = currentItem && currentItem.bundleSpec;
        if (!spec || !spec.allowedDrinks || !spec.allowedDrinks[idx]) return;
        if (bundleDrinks.length >= Number(spec.drinkSlots || 0)) return;
        const d = spec.allowedDrinks[idx];
        bundleDrinks.push({
          name: d.name,
          extraPrice: Number(d.extraPrice || 0),
          temp: "Ice",
          sugar: "Normal Sugar",
          ice: "Normal Ice"
        });
        rerenderBundlePreservingScroll();
      });
    });

    root.querySelectorAll("[data-bundle-remove-drink]").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.bundleRemoveDrink, 10);
        bundleDrinks.splice(idx, 1);
        editingDrinkIdx = -1;
        rerenderBundlePreservingScroll();
      });
    });

    root.querySelectorAll("[data-bundle-edit-drink]").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.bundleEditDrink, 10);
        editingDrinkIdx = editingDrinkIdx === idx ? -1 : idx;
        rerenderBundlePreservingScroll();
      });
    });

    root.querySelectorAll("[data-bundle-opt]").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.idx, 10);
        const key = btn.dataset.bundleOpt;
        const val = btn.dataset.val;
        if (!bundleDrinks[idx]) return;
        bundleDrinks[idx][key] = val;
        rerenderBundlePreservingScroll();
      });
    });

    root.querySelectorAll("[data-bundle-add-food]").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.bundleAddFood, 10);
        const spec = currentItem && currentItem.bundleSpec;
        if (!spec || !spec.allowedFoods || !spec.allowedFoods[idx]) return;
        if (bundleFoods.length >= Number(spec.foodSlots || 0)) return;
        const f = spec.allowedFoods[idx];
        bundleFoods.push({ name: f.name, extraPrice: Number(f.extraPrice || 0) });
        rerenderBundlePreservingScroll();
      });
    });

    root.querySelectorAll("[data-bundle-remove-food]").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.bundleRemoveFood, 10);
        bundleFoods.splice(idx, 1);
        rerenderBundlePreservingScroll();
      });
    });

    root.querySelectorAll("[data-qty]").forEach(btn => {
      btn.addEventListener("click", () => {
        const delta = parseInt(btn.dataset.qty, 10);
        quantity = U.clamp(quantity + delta, 1, 20);
        updatePrice();
      });
    });

    if (notesInput) {
      notesInput.addEventListener("input", () => {
        notes = notesInput.value;
        if (notesCount) notesCount.textContent = String(notes.length);
      });
    }

    const addBtn = document.getElementById("customizer-add");
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        if (!isBundleComplete()) {
          if (window.DLM_APP && window.DLM_APP.toast) {
            window.DLM_APP.toast(`Pilih ${getBundleRemainingCount()} menu lagi untuk melengkapi paket.`, "error");
          }
          return;
        }
        const pricing = getPricing();
        const cartItem = {
          id: currentItem.id,
          brandId: currentItem.brandId,
          brandName: currentBrand.name,
          category: currentItem.category || "",
          name: isSatuanMode ? `${currentItem.name} (Satuan)` : currentItem.name,
          image: currentItem.image,
          type: currentItem.type,
          isSatuan: isSatuanMode,
          isBundle: currentItem.type === "bundle",
          selections: getSelectedOptions(),
          notes: notes.trim(),
          quantity,
          unitPrice: pricing.unitPrice,
          unitOriginalPrice: pricing.unitOriginal
        };
        CART.addItem(cartItem);
        close();
        if (window.DLM_APP && window.DLM_APP.toast) {
          window.DLM_APP.toast(`${currentItem.name} ditambahkan ke keranjang.`);
        }
        if (typeof onAdded === "function") onAdded(cartItem);
      });
    }

    document.addEventListener("keydown", trapFocus);
  }

  function trapFocus(event) {
    if (!root || !root.querySelector(".sheet")) return;
    if (event.key === "Escape") {
      close();
      return;
    }
    if (event.key !== "Tab") return;
    const focusables = root.querySelectorAll("button, textarea, input, [href], [tabindex]:not([tabindex='-1'])");
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function open(item, brand, callback, opts) {
    currentItem = item;
    currentBrand = brand;
    onAdded = callback;
    isSatuanMode = !!(opts && opts.mode === "satuan");
    notes = "";
    quantity = 1;
    lastFocus = document.activeElement;
    initSelections(item);
    root = document.getElementById("sheet-root");
    if (!root) return;
    document.body.classList.add("sheet-open");
    render();
    setTimeout(() => {
      const firstFocusable = root.querySelector("button, textarea, input");
      if (firstFocusable) firstFocusable.focus({ preventScroll: true });
    }, 80);
  }

  function close() {
    if (!root) return;
    const overlay = root.querySelector("[data-sheet-overlay]");
    if (overlay) overlay.classList.remove("is-open");
    document.removeEventListener("keydown", trapFocus);
    setTimeout(() => {
      root.innerHTML = "";
      document.body.classList.remove("sheet-open");
      currentItem = null;
      currentBrand = null;
      if (lastFocus && typeof lastFocus.focus === "function") {
        lastFocus.focus({ preventScroll: true });
      }
    }, 380);
  }

  window.DLM_CUSTOMIZER = { open, close };
})();
