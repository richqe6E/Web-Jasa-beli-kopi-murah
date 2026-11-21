/* ============================================================
   CLIENT-SIDE SMART IMAGE COMPRESSOR (WebP / Canvas)
   Mengompres foto produk & logo sebelum upload ke Supabase Storage
   ============================================================ */
(function () {
  "use strict";

  const PRESETS = {
    product: { maxWidth: 800, maxHeight: 800, quality: 0.8, mimeType: "image/webp" },
    logo: { maxWidth: 512, maxHeight: 512, quality: 0.9, mimeType: "image/webp" }
  };

  function formatBytes(bytes) {
    const b = Number(bytes || 0);
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(2)} MB`;
  }

  function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("File gambar tidak valid atau rusak."));
      };
      img.src = url;
    });
  }

  function canvasToBlob(canvas, mimeType, quality) {
    return new Promise((resolve) => {
      canvas.toBlob(blob => {
        if (blob) {
          resolve(blob);
        } else {
          canvas.toBlob(fallback => resolve(fallback), "image/jpeg", quality);
        }
      }, mimeType, quality);
    });
  }

  async function compress(file, presetName) {
    if (!file) throw new Error("Tidak ada file yang dipilih.");

    const originalSize = file.size || 0;
    const isSvg = file.type === "image/svg+xml" || /\.svg$/i.test(file.name || "");
    const isGif = file.type === "image/gif" || /\.gif$/i.test(file.name || "");

    // Pertahankan vektor SVG dan GIF animasi agar tidak kehilangan kualitas/animasi
    if (isSvg || isGif) {
      return {
        file,
        originalSize,
        compressedSize: originalSize,
        savedPercent: 0,
        width: 0,
        height: 0,
        skipped: true,
        reason: isSvg ? "SVG vektor dipertahankan utuh" : "GIF animasi dipertahankan utuh"
      };
    }

    const preset = PRESETS[presetName] || PRESETS.product;
    const img = await loadImageFromFile(file);

    const srcW = img.naturalWidth || img.width || 800;
    const srcH = img.naturalHeight || img.height || 800;
    const ratio = Math.min(1, preset.maxWidth / srcW, preset.maxHeight / srcH);
    const dstW = Math.max(1, Math.round(srcW * ratio));
    const dstH = Math.max(1, Math.round(srcH * ratio));

    const canvas = document.createElement("canvas");
    canvas.width = dstW;
    canvas.height = dstH;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return {
        file,
        originalSize,
        compressedSize: originalSize,
        savedPercent: 0,
        width: srcW,
        height: srcH,
        skipped: true
      };
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.clearRect(0, 0, dstW, dstH);
    ctx.drawImage(img, 0, 0, dstW, dstH);

    let blob = await canvasToBlob(canvas, preset.mimeType, preset.quality);
    if (!blob) {
      return {
        file,
        originalSize,
        compressedSize: originalSize,
        savedPercent: 0,
        width: srcW,
        height: srcH,
        skipped: true
      };
    }

    // Jika hasil kompresi ternyata lebih besar dari file asli (misal file sudah WebP sangat kecil)
    if (blob.size >= originalSize && ratio === 1) {
      return {
        file,
        originalSize,
        compressedSize: originalSize,
        savedPercent: 0,
        width: dstW,
        height: dstH,
        skipped: true,
        reason: "File sudah optimal"
      };
    }

    const ext = blob.type === "image/webp" ? ".webp" : ".jpg";
    const baseName = String(file.name || "image").replace(/\.[^.]+$/, "");
    const compressedFile = new File([blob], `${baseName}${ext}`, {
      type: blob.type || "image/webp",
      lastModified: Date.now()
    });

    const savedPercent = originalSize > 0
      ? Math.max(0, Math.round(((originalSize - compressedFile.size) / originalSize) * 100))
      : 0;

    return {
      file: compressedFile,
      originalSize,
      compressedSize: compressedFile.size,
      savedPercent,
      width: dstW,
      height: dstH,
      skipped: false
    };
  }

  window.DLM_COMPRESSOR = {
    compress,
    formatBytes,
    PRESETS
  };
})();
