/* ============================================================
   CART STORE
   ============================================================ */
(function () {
  "use strict";

  const CFG = window.DLM_CONFIG;
  const U = window.DLM_UTIL;

  class CartStore {
    constructor() {
      this.key = CFG.storageKeys.cart;
      this.listeners = [];
      this.items = this.load();
    }

    load() {
      const data = U.storage.get(this.key, []);
      return Array.isArray(data) ? data.filter(item => item && item.id && item.quantity > 0) : [];
    }

    save() {
      U.storage.set(this.key, this.items);
      this.notify();
    }

    subscribe(listener) {
      this.listeners.push(listener);
      listener(this.getSummary());
      return () => {
        this.listeners = this.listeners.filter(fn => fn !== listener);
      };
    }

    notify() {
      const summary = this.getSummary();
      this.listeners.forEach(fn => fn(summary));
    }

    generateSignature(item) {
      const selectionKey = (item.selections || [])
        .map(s => `${s.groupId}:${s.optionId}`)
        .sort()
        .join("|");
      return `${item.id}__${selectionKey}__notes:${(item.notes || "").trim().toLowerCase()}`;
    }

    addItem(item) {
      const signature = this.generateSignature(item);
      const index = this.items.findIndex(i => i.signature === signature);
      if (index > -1) {
        this.items[index].quantity += item.quantity || 1;
      } else {
        this.items.push(Object.assign({}, item, {
          signature,
          quantity: item.quantity || 1
        }));
      }
      this.save();
    }

    updateQuantity(signature, delta) {
      const index = this.items.findIndex(i => i.signature === signature);
      if (index === -1) return;
      this.items[index].quantity += delta;
      if (this.items[index].quantity <= 0) {
        this.items.splice(index, 1);
      }
      this.save();
    }

    removeItem(signature) {
      this.items = this.items.filter(i => i.signature !== signature);
      this.save();
    }

    clear() {
      this.items = [];
      this.save();
    }

    getSummary() {
      const items = this.items.map(item => Object.assign({}, item, {
        lineTotal: item.unitPrice * item.quantity,
        lineOriginal: item.unitOriginalPrice * item.quantity
      }));
      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
      const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
      const originalTotal = items.reduce((sum, item) => sum + item.lineOriginal, 0);
      const totalSavings = Math.max(0, originalTotal - subtotal);
      const feeMode = CFG.serviceFeeMode || "tiered_per_order";
      let orderServiceFee = 0;
      if (totalItems > 0) {
        if (feeMode === "tiered_per_order") {
          orderServiceFee = totalItems === 1 ? Number(CFG.defaultServiceFeePerOrder || 1000) : 0;
        } else if (feeMode === "flat_per_order" || feeMode === "both") {
          orderServiceFee = Number(CFG.defaultServiceFeePerOrder || 0);
        }
      }
      const grandTotal = subtotal + orderServiceFee;

      return {
        items,
        totalItems,
        subtotal,
        originalTotal,
        totalSavings,
        serviceFeeMode: feeMode,
        serviceFeeIncluded: orderServiceFee === 0,
        orderServiceFee,
        grandTotal
      };
    }

    hasItemsFromOtherBrand(brandId) {
      return this.items.some(item => item.brandId !== brandId);
    }

    getBrandIds() {
      return Array.from(new Set(this.items.map(item => item.brandId)));
    }
  }

  window.DLM_CART = new CartStore();
})();
