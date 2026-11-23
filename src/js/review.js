/* ============================================================
   JASDOR RISGOLD — VERIFIED REVIEW FORM & WEBP WATERMARK ENGINE
   ============================================================ */
(function () {
  "use strict";

  const CFG = window.DLM_CONFIG || {};
  const U = window.DLM_UTIL;
  const SB = window.DLM_SUPABASE;

  const state = {
    orderCode: "",
    orderInfo: null,
    rating: 5,
    compressedBlob: null,
    previewUrl: "",
    submitting: false
  };

  const STAR_LABELS = {
    1: "Kurang puas",
    2: "Cukup",
    3: "Lumayan",
    4: "Puas",
    5: "Sangat puas!"
  };

  const $ = (sel) => document.querySelector(sel);

  function toast(msg, isError) {
    const root = $("#review-toast");
    if (!root) return;
    root.innerHTML = `<div class="review-toast ${isError ? "is-error" : ""}">${U.esc(msg)}</div>`;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { root.innerHTML = ""; }, 3400);
  }

  function getOrderParam() {
    const params = new URLSearchParams(window.location.search);
    return String(params.get("order") || "").replace(/^#+/, "").trim().toUpperCase();
  }

  /* ------------------------------------------------------------
     CLIENT-SIDE CANVAS 2D COMPRESSION (WEBP <= 900PX) + WATERMARK
     Keeps uploaded review photos ultra-light (~35-65 KB each!)
     ------------------------------------------------------------ */
  function compressAndWatermarkPhoto(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Gagal membaca file foto."));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error("Format gambar tidak didukung."));
        img.onload = () => {
          try {
            const MAX_DIM = 900;
            let w = img.naturalWidth || img.width;
            let h = img.naturalHeight || img.height;
            if (w > MAX_DIM || h > MAX_DIM) {
              const scale = MAX_DIM / Math.max(w, h);
              w = Math.round(w * scale);
              h = Math.round(h * scale);
            }

            const canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, w, h);

            // Subtle corner/bottom-center brand pill watermark ("JasDor RisGold • jasdor.web.id")
            const wmText = `${CFG.appName || "JasDor RisGold"} • Verified Order`;
            const fontSize = Math.max(13, Math.round(w * 0.026));
            ctx.font = `700 ${fontSize}px 'Plus Jakarta Sans', Inter, sans-serif`;
            const tw = ctx.measureText(wmText).width;
            const padX = Math.round(fontSize * 0.85);
            const padY = Math.round(fontSize * 0.45);
            const pillW = tw + padX * 2;
            const pillH = fontSize + padY * 2;
            const px = Math.round((w - pillW) / 2);
            const py = h - pillH - Math.max(14, Math.round(h * 0.03));
            const rad = pillH / 2;

            ctx.save();
            ctx.fillStyle = "rgba(11, 46, 82, 0.56)";
            ctx.beginPath();
            ctx.moveTo(px + rad, py);
            ctx.arcTo(px + pillW, py, px + pillW, py + pillH, rad);
            ctx.arcTo(px + pillW, py + pillH, px, py + pillH, rad);
            ctx.arcTo(px, py + pillH, px, py, rad);
            ctx.arcTo(px, py, px + pillW, py, rad);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillStyle = "rgba(255, 255, 255, 0.94)";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(wmText, px + pillW / 2, py + pillH / 2 + 1);
            ctx.restore();

            const finish = (blob) => {
              if (!blob) return reject(new Error("Gagal mengompres foto."));
              const previewUrl = URL.createObjectURL(blob);
              resolve({ blob, previewUrl, sizeKb: Math.max(1, Math.round(blob.size / 1024)) });
            };

            canvas.toBlob(blob => {
              if (blob && blob.type === "image/webp" && blob.size <= 580000) {
                finish(blob);
              } else {
                canvas.toBlob(jpgBlob => finish(jpgBlob), "image/jpeg", 0.80);
              }
            }, "image/webp", 0.78);
          } catch (err) {
            reject(err);
          }
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function renderLookupGate(errorMsg) {
    const root = $("#review-root");
    const appTitle = CFG.appName || "JasDor RisGold";
    root.innerHTML = `
      <section class="review-card">
        <div class="review-head">
          <span class="review-eyebrow-pill">Testimoni Pelanggan</span>
          <h1>Beri Ulasan Pesananmu</h1>
          <p>Masukkan kode pesanan kamu dari struk atau chat WhatsApp untuk menulis ulasan terverifikasi di ${U.esc(appTitle)}.</p>
        </div>

        ${errorMsg ? `
          <div style="padding:12px 14px;border-radius:14px;background:var(--danger-soft);color:var(--danger);font-size:12.5px;font-weight:700;margin-bottom:16px">
            ${U.esc(errorMsg)}
          </div>
        ` : ""}

        <form id="lookup-order-form">
          <div class="rev-field">
            <label class="rev-label" for="lookup-code-input">Kode Pesanan <span class="req">*</span></label>
            <input type="text" id="lookup-code-input" class="rev-input" placeholder="Contoh: DLM-261123-4821" value="${U.esc(state.orderCode)}" autocomplete="off" required />
          </div>
          <button type="submit" class="rev-btn">Buka Formulir Testimoni</button>
        </form>
      </section>
    `;

    const form = $("#lookup-order-form");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const val = ($("#lookup-code-input").value || "").replace(/^#+/, "").trim().toUpperCase();
        if (!val) {
          toast("Masukkan kode pesanan terlebih dahulu.", true);
          return;
        }
        const nextUrl = `${window.location.pathname}?order=${encodeURIComponent(val)}`;
        window.history.replaceState(null, "", nextUrl);
        loadOrder(val);
      });
    }
  }

  function renderAlreadyReviewed(info) {
    const root = $("#review-root");
    root.innerHTML = `
      <section class="review-card">
        <div class="state-card">
          <div class="state-icon is-success">
            <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m16 9-5.5 5.5L8 12"/></svg>
          </div>
          <h2>Ulasan Sudah Tercatat!</h2>
          <p>Terima kasih Kak <strong>${U.esc(info.customer_first_name || "")}</strong>! Pesanan <strong>#${U.esc(info.order_code)}</strong> sudah pernah memberikan testimoni dan sudah tampil di obrolan testimoni kami.</p>
          <div class="state-actions">
            <a href="/?open=testimonials" class="rev-btn">Lihat Kolom Chat Testimoni</a>
            <a href="/" class="rev-btn rev-btn-soft">Pesan Lagi di Beranda</a>
          </div>
        </div>
      </section>
    `;
  }

  function renderSubmitSuccess(saved) {
    const root = $("#review-root");
    root.innerHTML = `
      <section class="review-card">
        <div class="state-card">
          <div class="state-icon is-success">
            <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          </div>
          <h2>Terima Kasih atas Testimoninya!</h2>
          <p>Ulasan kamu untuk <strong>#${U.esc(saved.order_code || state.orderCode)}</strong> sudah terbit sebagai <strong>${U.esc(saved.customer_name_masked || "Pelanggan")}</strong> di kolom chat testimoni ${U.esc(CFG.appName || "JasDor RisGold")}.</p>
          <div class="state-actions">
            <a href="/?open=testimonials" class="rev-btn">Lihat Testimonimu Sekarang</a>
            <a href="/" class="rev-btn rev-btn-soft">Kembali ke Beranda</a>
          </div>
        </div>
      </section>
    `;
  }

  function renderReviewForm(info) {
    const root = $("#review-root");
    const appTitle = CFG.appName || "JasDor RisGold";
    const defaultCity = info.outlet_area || info.outlet_name || "";

    root.innerHTML = `
      <section class="review-card">
        <div class="review-head">
          <span class="review-eyebrow-pill">Testimoni Terverifikasi</span>
          <h1>Beri Ulasan Pesananmu</h1>
          <p>Halo <strong>Kak ${U.esc(info.customer_first_name || "Pelanggan")}</strong>, ceritakan pengalaman order kamu di ${U.esc(appTitle)} ya!</p>
        </div>

        <div class="order-summary-box">
          <div class="order-summary-label">No. Order Terverifikasi</div>
          <div class="order-summary-code">#${U.esc(info.order_code)}</div>
          <div class="order-summary-meta">${U.esc(info.brand_name)} &bull; ${U.esc(info.outlet_name)}</div>
        </div>

        <form id="review-submit-form" novalidate>
          <div class="rev-field">
            <label class="rev-label">Rating Pengalaman Kamu <span class="req">*</span></label>
            <div class="star-picker" id="star-picker" role="radiogroup" aria-label="Rating bintang">
              ${[1, 2, 3, 4, 5].map(n => `
                <button type="button" class="star-btn ${n <= state.rating ? "is-active" : ""}" data-star="${n}" aria-label="${n} bintang" aria-pressed="${n <= state.rating ? "true" : "false"}">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" stroke="currentColor" stroke-width="1.6"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/></svg>
                </button>
              `).join("")}
              <span class="star-caption" id="star-caption">${U.esc(STAR_LABELS[state.rating])}</span>
            </div>
          </div>

          <div class="rev-field">
            <label class="rev-label" for="rev-message">Pesan Ulasan / Review <span class="req">*</span></label>
            <textarea id="rev-message" class="rev-textarea" rows="3" maxlength="500" placeholder="Contoh: Admin fast respon, kopinya sesuai pesanan dan lebih hemat!" required></textarea>
          </div>

          <div class="rev-field">
            <label class="rev-label" for="rev-city">Kota / Outlet Kamu <span class="opt">(Opsional)</span></label>
            <input type="text" id="rev-city" class="rev-input" maxlength="60" value="${U.esc(defaultCity)}" placeholder="Contoh: Samarinda / Central Plaza" />
          </div>

          <div class="rev-field">
            <label class="rev-label">Foto Pesanan / Minuman <span class="opt">(Opsional, otomatis dikompres WebP)</span></label>
            <label class="photo-dropzone" id="photo-dropzone">
              <input type="file" id="rev-photo-input" accept="image/*" />
              <div id="photo-drop-content" style="display:flex;flex-direction:column;align-items:center;gap:6px">
                <div class="photo-icon-circle">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                </div>
                <strong>Ambil Foto Kamera / Pilih Galeri</strong>
                <span>Otomatis dioptimalkan agar ringan (~50 KB)</span>
              </div>
            </label>
            <div id="photo-remove-wrap" style="text-align:center;display:none">
              <button type="button" class="photo-remove-btn" id="btn-remove-photo">Hapus foto</button>
            </div>
          </div>

          <div class="privacy-box">
            <strong>Privasi Terjaga:</strong> Nama kamu otomatis disensor menjadi <strong>${U.esc(info.customer_name_masked || "Pe***")}</strong> saat ditampilkan di obrolan testimoni website. Nomor WhatsApp tidak pernah ditampilkan.
          </div>

          <button type="submit" class="rev-btn" id="rev-submit-btn">Kirim Testimoni</button>
        </form>
      </section>
    `;

    // Star rating events
    $("#star-picker").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-star]");
      if (!btn) return;
      state.rating = Number(btn.dataset.star) || 5;
      document.querySelectorAll("#star-picker .star-btn").forEach(b => {
        const active = Number(b.dataset.star) <= state.rating;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", active ? "true" : "false");
      });
      $("#star-caption").textContent = STAR_LABELS[state.rating] || "";
    });

    // Photo compression handler
    const photoInput = $("#rev-photo-input");
    const dropzone = $("#photo-dropzone");
    const dropContent = $("#photo-drop-content");
    const removeWrap = $("#photo-remove-wrap");

    photoInput.addEventListener("change", async () => {
      const file = photoInput.files && photoInput.files[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        toast("Mohon pilih file gambar (JPG/PNG/WebP).", true);
        return;
      }
      dropContent.innerHTML = `<div class="review-spinner" style="margin:6px auto"></div><strong>Mengompres foto...</strong>`;
      try {
        const res = await compressAndWatermarkPhoto(file);
        if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
        state.compressedBlob = res.blob;
        state.previewUrl = res.previewUrl;
        dropzone.classList.add("has-photo");
        dropContent.innerHTML = `
          <img src="${res.previewUrl}" alt="Preview foto pesanan" class="photo-preview-img" />
          <strong style="color:var(--success)">Foto siap dikirim (${res.sizeKb} KB)</strong>
          <span>Ketuk untuk ganti foto</span>
        `;
        removeWrap.style.display = "block";
      } catch (err) {
        state.compressedBlob = null;
        toast(err.message || "Gagal memproses foto.", true);
        resetPhotoDropzone();
      }
    });

    function resetPhotoDropzone() {
      if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
      state.compressedBlob = null;
      state.previewUrl = "";
      photoInput.value = "";
      dropzone.classList.remove("has-photo");
      dropContent.innerHTML = `
        <div class="photo-icon-circle">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
        </div>
        <strong>Ambil Foto Kamera / Pilih Galeri</strong>
        <span>Otomatis dioptimalkan agar ringan (~50 KB)</span>
      `;
      removeWrap.style.display = "none";
    }

    $("#btn-remove-photo").addEventListener("click", resetPhotoDropzone);

    // Form submit
    $("#review-submit-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      if (state.submitting) return;
      const msg = ($("#rev-message").value || "").trim();
      const city = ($("#rev-city").value || "").trim();
      if (msg.length < 3) {
        toast("Tulis pesan ulasan minimal 3 karakter ya.", true);
        $("#rev-message").focus();
        return;
      }

      const submitBtn = $("#rev-submit-btn");
      state.submitting = true;
      submitBtn.disabled = true;
      submitBtn.textContent = state.compressedBlob ? "Mengunggah foto & mengirim..." : "Mengirim testimoni...";

      try {
        let photoUrl = null;
        if (state.compressedBlob) {
          photoUrl = await SB.uploadTestimonialPhoto(state.compressedBlob, info.order_code);
        }
        const saved = await SB.submitTestimonial({
          orderCode: info.order_code,
          message: msg,
          cityLabel: city,
          rating: state.rating,
          photoUrl
        });
        renderSubmitSuccess(saved || { order_code: info.order_code, customer_name_masked: info.customer_name_masked });
      } catch (err) {
        toast(err.message || "Gagal mengirim testimoni. Coba lagi sebentar.", true);
        submitBtn.disabled = false;
        submitBtn.textContent = "Kirim Testimoni";
      } finally {
        state.submitting = false;
      }
    });
  }

  async function loadOrder(code) {
    state.orderCode = code;
    if (!code) {
      renderLookupGate("");
      return;
    }

    const root = $("#review-root");
    root.innerHTML = `
      <div class="review-card review-loading">
        <div class="review-spinner" aria-hidden="true"></div>
        <p>Memverifikasi pesanan <strong>#${U.esc(code)}</strong>...</p>
      </div>
    `;

    try {
      const info = await SB.lookupOrderForReview(code);
      if (!info || !info.found) {
        renderLookupGate(`Kode pesanan "#${code}" tidak ditemukan. Pastikan kode dari struk atau chat WhatsApp sudah benar.`);
        return;
      }
      state.orderInfo = info;
      if (info.already_reviewed) {
        renderAlreadyReviewed(info);
      } else {
        renderReviewForm(info);
      }
    } catch (err) {
      renderLookupGate("Sistem testimoni sedang disiapkan atau koneksi bermasalah. Coba beberapa saat lagi.");
    }
  }

  async function init() {
    if (SB && typeof SB.syncCatalog === "function") {
      SB.syncCatalog().then(() => {
        const title = CFG.appName || "JasDor RisGold";
        const brandEl = $("#review-brand-title");
        const footEl = $("#review-footer-brand");
        if (brandEl) brandEl.textContent = title;
        if (footEl) footEl.textContent = title;
      }).catch(() => { /* ignore */ });
    }
    const code = getOrderParam();
    loadOrder(code);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
