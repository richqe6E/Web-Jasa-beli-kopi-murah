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

  function isGroupVisible(group) {
    if (!group.dependsOn) return true;
    const parentGroup = currentItem.optionGroups.find(g => g.id === group.dependsOn.groupId);
    if (!parentGroup) return true;
    return selections[parentGroup.id] === group.dependsOn.optionId;
  }

  function initSelections(item) {
    selections = {};
    item.optionGroups.forEach(group => {
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
    currentItem.optionGroups.forEach(group => {
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

    currentItem.optionGroups.forEach(group => {
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
    currentItem.optionGroups.forEach(group => {
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

  function render() {
    const item = currentItem;
    const pricing = getPricing();
    const discount = Math.round(((item.priceOriginal - item.priceDiscount) / item.priceOriginal) * 100);
    const visibleGroups = item.optionGroups;

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
                <span class="badge badge-save">-${discount}%</span>
                ${item.isBestSeller ? `<span class="badge badge-best">${ICON.icon("star", "w-3 h-3", 2.2)} Best Seller</span>` : ""}
              </div>
            </div>

            <div class="sheet-body">
              <div class="sheet-title-row">
                <div class="min-w-0">
                  <p class="eyebrow">${U.esc(currentBrand.shortName)}</p>
                  <h2 id="sheet-title" class="sheet-title">${U.esc(item.name)}</h2>
                  <p class="sheet-desc">${U.esc(item.description)}</p>
                </div>
              </div>

              <div class="sheet-price-row">
                <div>
                  <span class="price-now">${U.rp(item.priceDiscount)}</span>
                  <span class="price-old">${U.rp(item.priceOriginal)}</span>
                </div>
                <span class="save-pill">Hemat ${U.rp(item.priceOriginal - item.priceDiscount)}</span>
              </div>

              <div class="info-chips">
                <span class="info-chip">${ICON.icon("info", "w-3.5 h-3.5", 2)} ${U.esc(item.info)}</span>
                <span class="info-chip">${ICON.icon("star", "w-3.5 h-3.5", 2)} ${U.esc(item.rating)} • ${U.esc(item.sold)} terjual</span>
              </div>

              <div class="sheet-divider"></div>

              ${visibleGroups.map(groupMarkup).join("")}

              <section class="option-group">
                <div class="option-head">
                  <div>
                    <h3 class="option-title">Catatan Tambahan</h3>
                    <p class="option-helper">Opsional, tulis permintaan khususmu.</p>
                  </div>
                </div>
                <textarea id="customizer-notes" class="form-input form-textarea" rows="2" maxlength="160" placeholder="Contoh: es dipisah, sedotan 2 pcs, manis dikurangi">${U.esc(notes)}</textarea>
                <div class="char-count"><span id="notes-count">${notes.length}</span>/160</div>
              </section>
            </div>
          </div>

          <div class="sheet-footer">
            <div class="qty-stepper" role="group" aria-label="Jumlah pesanan">
              <button type="button" class="qty-btn" data-qty="-1" aria-label="Kurangi jumlah">${ICON.icon("minus", "w-4 h-4", 2.4)}</button>
              <span id="customizer-qty" class="qty-value" aria-live="polite">${quantity}</span>
              <button type="button" class="qty-btn" data-qty="1" aria-label="Tambah jumlah">${ICON.icon("plus", "w-4 h-4", 2.4)}</button>
            </div>
            <button type="button" class="btn-primary btn-add-cart" id="customizer-add">
              <span>Tambah ke Keranjang</span>
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
    currentItem.optionGroups.forEach(group => {
      const wrap = root.querySelector(`[data-group-wrap="${group.id}"]`);
      if (wrap) wrap.classList.toggle("is-hidden", !isGroupVisible(group));
    });
  }

  function refreshGroup(groupId) {
    const group = currentItem.optionGroups.find(g => g.id === groupId);
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
        const group = currentItem.optionGroups.find(g => g.id === groupId);
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
          currentItem.optionGroups.forEach(g => {
            if (g.type === "single") refreshGroup(g.id);
          });
        }
        refreshGroup(groupId);
        updatePrice();
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
        const pricing = getPricing();
        const cartItem = {
          id: currentItem.id,
          brandId: currentItem.brandId,
          brandName: currentBrand.name,
          name: currentItem.name,
          image: currentItem.image,
          type: currentItem.type,
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

  function open(item, brand, callback) {
    currentItem = item;
    currentBrand = brand;
    onAdded = callback;
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
