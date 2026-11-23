/* ============================================================
   JASDOR RISGOLD - 3D BLENDER-STYLE MOTION ENGINE & EXPORTER
   60 FPS Canvas 3D-Projected Smartphone + Floating Glass Cards
   + Procedural Web Audio Synth & SFX + WebM/MP4 Video Recorder
   ============================================================ */
(function () {
  "use strict";

  const TOTAL_DURATION = 30.0; // seconds
  const FPS = 60;

  const SCENES = [
    { index: 0, id: "hook", start: 0.0, end: 4.5, title: "SCENE 1 / 6 • HOOK HARGA RESMI" },
    { index: 1, id: "outlet", start: 4.5, end: 10.0, title: "SCENE 2 / 6 • PILIH BRAND & OUTLET GPS" },
    { index: 2, id: "menu", start: 10.0, end: 17.0, title: "SCENE 3 / 6 • MENU, VARIAN & BUNDLING" },
    { index: 3, id: "savings", start: 17.0, end: 22.0, title: "SCENE 4 / 6 • BUKTI PERBANDINGAN HEMAT" },
    { index: 4, id: "receipt", start: 22.0, end: 26.0, title: "SCENE 5 / 6 • STRUK DIGITAL JPG & WA" },
    { index: 5, id: "cta", start: 26.0, end: 30.0, title: "SCENE 6 / 6 • TESTIMONI & CALL TO ACTION" }
  ];

  const ASSET_PATHS = {
    kenanganLogo: "src/assets/brands/kenangan-official.webp",
    foreLogo: "src/assets/brands/fore-emblem.webp",
    janjiLogo: "src/assets/brands/janji-jiwa-official.webp",
    tomoroLogo: "src/assets/brands/tomoro-official.webp",
    kkmDrink: "src/assets/menus/kenangan/kenangan-kopi-kenangan-mantan.webp",
    paketBerdua: "src/assets/bundles/paket-berdua.webp",
    tripleCup: "src/assets/bundles/triple-cup-reg.webp",
    foreDrink: "src/assets/menus/fore/fore-salted-spanish-latte.webp",
    janjiDrink: "src/assets/menus/janji-jiwa/janji-jiwa-signature-kopi-susu.webp"
  };

  const images = {};
  const state = {
    aspect: "9:16",
    width: 1080,
    height: 1920,
    playing: true,
    time: 0,
    lastFrameTs: 0,
    camIntensity: 1.0,
    hookText: "Ngopi Resmi di Outlet Terdekat, Kok Bisa Semurah Ini?",
    ctaUrl: "jasdor.web.id",
    ctaSub: "Ambil Langsung di Kasir Outlet Resmi • Bayar QRIS / E-Wallet",
    muted: false,
    recording: false,
    lastSceneIdx: -1,
    lastBeatIdx: -1
  };

  const canvas = document.getElementById("promo-canvas");
  const ctx = canvas.getContext("2d");

  /* ------------------------------------------------------------
     MATH & EASE HELPERS
     ------------------------------------------------------------ */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOutCubic = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const easeInOutCubic = (t) => {
    const x = clamp(t, 0, 1);
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  };
  const easeOutBack = (t) => {
    const x = clamp(t, 0, 1);
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  };

  /* ------------------------------------------------------------
     WEB AUDIO SYNTHESIZER (UPBEAT MOTION SOUNDTRACK + UI SFX)
     ------------------------------------------------------------ */
  let audioCtx = null;
  let audioDest = null;
  let masterGain = null;

  function ensureAudio() {
    if (audioCtx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audioCtx = new AC();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = state.muted ? 0 : 0.26;
    masterGain.connect(audioCtx.destination);
    if (audioCtx.createMediaStreamDestination) {
      audioDest = audioCtx.createMediaStreamDestination();
      masterGain.connect(audioDest);
    }
  }

  function playWhooshSfx() {
    if (state.muted && !state.recording) return;
    ensureAudio();
    if (!audioCtx) return;
    if (audioCtx.state === "suspended") audioCtx.resume();

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.14);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.32);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  function playPopSfx(freq) {
    if (state.muted && !state.recording) return;
    ensureAudio();
    if (!audioCtx) return;
    if (audioCtx.state === "suspended") audioCtx.resume();

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq || 587.33, now);
    osc.frequency.exponentialRampToValueAtTime((freq || 587.33) * 1.45, now + 0.09);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  function playChordBeat(beatIndex) {
    if (state.muted && !state.recording) return;
    ensureAudio();
    if (!audioCtx) return;
    if (audioCtx.state === "suspended") audioCtx.resume();

    // Progression: Fmaj7 -> G6 -> Em7 -> Am7
    const chords = [
      [349.23, 440.0, 523.25, 659.25],
      [392.0, 493.88, 587.33, 659.25],
      [329.63, 392.0, 493.88, 587.33],
      [440.0, 523.25, 659.25, 783.99]
    ];
    const chord = chords[Math.floor(beatIndex / 2) % chords.length];
    const now = audioCtx.currentTime;

    // Soft pluck arpeggio note
    const noteFreq = chord[beatIndex % chord.length];
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(noteFreq, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.09, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  /* ------------------------------------------------------------
     PRELOAD REAL BRAND & MENU IMAGES
     ------------------------------------------------------------ */
  function preloadAssets() {
    Object.keys(ASSET_PATHS).forEach(key => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = ASSET_PATHS[key];
      images[key] = img;
    });
  }

  /* ------------------------------------------------------------
     CANVAS 2D / 3D-PROJECTED DRAWING PRIMITIVES
     ------------------------------------------------------------ */
  function roundRectPath(c, x, y, w, h, r) {
    const rad = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + rad, y);
    c.arcTo(x + w, y, x + w, y + h, rad);
    c.arcTo(x + w, y + h, x, y + h, rad);
    c.arcTo(x, y + h, x, y, rad);
    c.arcTo(x, y, x + w, y, rad);
    c.closePath();
  }

  function fillRoundRect(c, x, y, w, h, r, fillStyle, strokeStyle, lineWidth) {
    roundRectPath(c, x, y, w, h, r);
    if (fillStyle) {
      c.fillStyle = fillStyle;
      c.fill();
    }
    if (strokeStyle) {
      c.strokeStyle = strokeStyle;
      c.lineWidth = lineWidth || 1.5;
      c.stroke();
    }
  }

  function drawCoverImage(c, img, x, y, w, h, r) {
    c.save();
    roundRectPath(c, x, y, w, h, r || 12);
    c.clip();
    if (img && img.complete && img.naturalWidth > 0) {
      const ir = img.naturalWidth / img.naturalHeight;
      const br = w / h;
      let dw = w, dh = h, dx = x, dy = y;
      if (ir > br) {
        dw = h * ir;
        dx = x - (dw - w) / 2;
      } else {
        dh = w / ir;
        dy = y - (dh - h) / 2;
      }
      c.drawImage(img, dx, dy, dw, dh);
    } else {
      const g = c.createLinearGradient(x, y, x + w, y + h);
      g.addColorStop(0, "#0B6BCB");
      g.addColorStop(1, "#1E293B");
      c.fillStyle = g;
      c.fillRect(x, y, w, h);
    }
    c.restore();
  }

  function wrapText(c, text, x, y, maxWidth, lineHeight, align) {
    c.textAlign = align || "center";
    const words = String(text || "").split(/\s+/);
    let line = "";
    const lines = [];
    for (let i = 0; i < words.length; i++) {
      const test = line ? line + " " + words[i] : words[i];
      if (c.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = words[i];
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    lines.forEach((l, idx) => {
      c.fillText(l, x, y + idx * lineHeight);
    });
    return lines.length;
  }

  /**
   * Applies a Blender-like 3D Plane Transform on Canvas 2D using matrix skew/scale
   * and z-depth parallax offset, plus extruded 3D side rim & drop shadow.
   */
  function with3DPlane(c, cx, cy, yawDeg, pitchDeg, rollDeg, scale, zHeight, drawFn) {
    const k = state.camIntensity;
    const yaw = (yawDeg * k * Math.PI) / 180;
    const pitch = (pitchDeg * k * Math.PI) / 180;
    const roll = (rollDeg * k * Math.PI) / 180;

    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);
    const cosP = Math.cos(pitch);
    const sinP = Math.sin(pitch);

    // Z-depth parallax shift along camera angle
    const px = cx - sinY * zHeight * 1.15;
    const py = cy + sinP * zHeight * 1.05 - zHeight * 0.28;
    const depthScale = scale * (1 + zHeight / 950);

    c.save();
    c.translate(px, py);
    c.rotate(roll);
    // Perspective foreshortening + isometric skew approximation
    c.transform(
      cosY * depthScale,
      sinP * 0.24 * depthScale,
      -sinY * 0.26 * depthScale,
      cosP * depthScale,
      0,
      0
    );
    drawFn({ yaw, pitch, sinY, sinP, zHeight });
    c.restore();
  }

  function drawTouchRipple(c, x, y, progress) {
    if (progress <= 0 || progress >= 1) return;
    const p = clamp(progress, 0, 1);
    c.save();
    const r1 = lerp(12, 68, easeOutCubic(p));
    c.beginPath();
    c.arc(x, y, r1, 0, Math.PI * 2);
    c.strokeStyle = `rgba(56, 189, 248, ${(1 - p) * 0.9})`;
    c.lineWidth = 4;
    c.stroke();

    c.beginPath();
    c.arc(x, y, lerp(18, 28, Math.sin(p * Math.PI)), 0, Math.PI * 2);
    c.fillStyle = `rgba(11, 107, 203, ${(1 - p * 0.6) * 0.75})`;
    c.fill();
    c.strokeStyle = "#ffffff";
    c.lineWidth = 3;
    c.stroke();
    c.restore();
  }

  /* ------------------------------------------------------------
     3D SMARTPHONE BODY + SCREEN CONTENT RENDERER
     ------------------------------------------------------------ */
  function draw3DSmartphone(c, cx, cy, cam, screenDrawFn) {
    const pw = 450;
    const ph = 910;
    const pr = 56;

    with3DPlane(c, cx, cy, cam.yaw, cam.pitch, cam.roll, cam.scale, 0, (info) => {
      // 1. Deep Studio Floor Shadow
      c.save();
      c.shadowColor = "rgba(2, 8, 23, 0.85)";
      c.shadowBlur = 75;
      c.shadowOffsetX = info.sinY * 55;
      c.shadowOffsetY = 42 + info.sinP * 35;
      fillRoundRect(c, -pw / 2, -ph / 2, pw, ph, pr, "#050B16");
      c.restore();

      // 2. 3D Extruded Titanium Chassis Thickness (Blender Bevel Rim)
      const extrudeX = info.sinY * 26;
      const extrudeY = -info.sinP * 18 + 8;
      for (let step = 6; step >= 1; step--) {
        const t = step / 6;
        const metalGrad = c.createLinearGradient(-pw / 2, -ph / 2, pw / 2, ph / 2);
        metalGrad.addColorStop(0, "#1E3A5F");
        metalGrad.addColorStop(0.5, "#0F1E36");
        metalGrad.addColorStop(1, "#1D4ED8");
        fillRoundRect(
          c,
          -pw / 2 + extrudeX * t,
          -ph / 2 + extrudeY * t,
          pw,
          ph,
          pr,
          metalGrad,
          step === 6 ? "rgba(56, 189, 248, 0.45)" : null,
          2
        );
      }

      // 3. Outer Bezel & Specular Rim
      const bezelGrad = c.createLinearGradient(-pw / 2, -ph / 2, pw / 2, ph / 2);
      bezelGrad.addColorStop(0, "#1E293B");
      bezelGrad.addColorStop(0.5, "#0B1324");
      bezelGrad.addColorStop(1, "#1E3A8A");
      fillRoundRect(c, -pw / 2, -ph / 2, pw, ph, pr, bezelGrad, "rgba(148, 163, 184, 0.55)", 3);

      // 4. Inner Screen Viewport
      const sx = -pw / 2 + 16;
      const sy = -ph / 2 + 16;
      const sw = pw - 32;
      const sh = ph - 32;
      const sr = 44;

      c.save();
      roundRectPath(c, sx, sy, sw, sh, sr);
      c.clip();

      // App Background (#F4F8FF)
      c.fillStyle = "#F4F8FF";
      c.fillRect(sx, sy, sw, sh);

      // Top Royal Blue App Header inside phone
      const headGrad = c.createLinearGradient(sx, sy, sx + sw, sy + 115);
      headGrad.addColorStop(0, "#084F99");
      headGrad.addColorStop(1, "#0B6BCB");
      c.fillStyle = headGrad;
      c.fillRect(sx, sy, sw, 118);

      // Header Brand & Location Pill
      c.fillStyle = "rgba(255,255,255,0.18)";
      fillRoundRect(c, sx + 18, sy + 48, 128, 26, 999, "rgba(255,255,255,0.18)");
      c.fillStyle = "#FEF08A";
      c.font = "800 12px 'Outfit', sans-serif";
      c.textAlign = "left";
      c.fillText("JasDor RisGold", sx + 30, sy + 65);

      fillRoundRect(c, sx + 18, sy + 80, sw - 36, 26, 999, "rgba(255,255,255,0.14)");
      c.fillStyle = "#FFFFFF";
      c.font = "600 11px 'DM Sans', sans-serif";
      c.fillText("Samarinda • Balikpapan • Tenggarong", sx + 30, sy + 97);

      // Screen Custom Scene Content
      screenDrawFn(sx, sy + 124, sw, sh - 190);

      // 5-Tab Liquid Glass Bottom Navigation inside phone
      const navY = sy + sh - 64;
      fillRoundRect(
        c,
        sx + 14,
        navY,
        sw - 28,
        52,
        26,
        "rgba(255, 255, 255, 0.94)",
        "rgba(11, 107, 203, 0.18)",
        1.5
      );
      const tabs = ["Outlet", "Menu", "Keranjang", "Testimoni", "Riwayat"];
      const activeTabIdx = cam.activeTabIdx != null ? cam.activeTabIdx : 1;
      const tabW = (sw - 40) / 5;
      tabs.forEach((tName, idx) => {
        const tx = sx + 20 + idx * tabW;
        if (idx === activeTabIdx) {
          fillRoundRect(c, tx + 3, navY + 7, tabW - 6, 38, 18, "#E3F0FF");
        }
        c.fillStyle = idx === activeTabIdx ? "#0B6BCB" : "#64748B";
        c.font = (idx === activeTabIdx ? "800" : "600") + " 10.5px 'DM Sans', sans-serif";
        c.textAlign = "center";
        c.fillText(tName, tx + tabW / 2, navY + 31);
      });

      // Dynamic Island Notch
      fillRoundRect(c, -62, sy + 10, 124, 24, 999, "#050912");

      // Subtle Glass Screen Glare Reflection
      const glare = c.createLinearGradient(sx - 60, sy, sx + sw * 0.65, sy + sh * 0.55);
      glare.addColorStop(0, "rgba(255, 255, 255, 0.16)");
      glare.addColorStop(0.45, "rgba(255, 255, 255, 0.03)");
      glare.addColorStop(1, "rgba(255, 255, 255, 0)");
      c.fillStyle = glare;
      c.fillRect(sx, sy, sw, sh);

      c.restore();
    });
  }

  function drawFloatingGlassCard(c, cx, cy, w, h, cam, zHeight, opts, contentFn) {
    with3DPlane(c, cx, cy, cam.yaw, cam.pitch, cam.roll || 0, cam.scale, zHeight, (info) => {
      const x = -w / 2;
      const y = -h / 2;
      const r = (opts && opts.radius) || 22;

      // 3D Elevation Drop Shadow
      c.save();
      c.shadowColor = (opts && opts.shadowColor) || "rgba(3, 10, 28, 0.55)";
      c.shadowBlur = 28 + zHeight * 0.25;
      c.shadowOffsetX = info.sinY * (14 + zHeight * 0.22);
      c.shadowOffsetY = 16 + zHeight * 0.18;
      fillRoundRect(
        c,
        x,
        y,
        w,
        h,
        r,
        (opts && opts.bg) || "rgba(255, 255, 255, 0.96)",
        (opts && opts.border) || "rgba(56, 189, 248, 0.45)",
        (opts && opts.borderWidth) || 2
      );
      c.restore();

      contentFn(x, y, w, h);
    });
  }

  /* ------------------------------------------------------------
     BACKGROUND & HEADER CALLOUT RENDERER
     ------------------------------------------------------------ */
  function drawStudioBackground(c, W, H, t, sceneIdx) {
    const bgGrad = c.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, "#061229");
    bgGrad.addColorStop(0.5, "#091D42");
    bgGrad.addColorStop(1, "#050B17");
    c.fillStyle = bgGrad;
    c.fillRect(0, 0, W, H);

    // Animated Blender 3D Studio Grid Floor
    c.save();
    c.strokeStyle = "rgba(56, 189, 248, 0.08)";
    c.lineWidth = 1.5;
    const gridSpacing = 90;
    const offset = (t * 28) % gridSpacing;
    for (let x = -W * 0.2; x <= W * 1.2; x += gridSpacing) {
      c.beginPath();
      c.moveTo(x, 0);
      c.lineTo(x, H);
      c.stroke();
    }
    for (let y = offset; y <= H; y += gridSpacing) {
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(W, y);
      c.stroke();
    }
    c.restore();

    // Glowing Spotlight Orbs
    const orb1 = c.createRadialGradient(
      W * (0.25 + Math.sin(t * 0.5) * 0.08),
      H * 0.25,
      20,
      W * 0.3,
      H * 0.25,
      W * 0.65
    );
    orb1.addColorStop(0, "rgba(11, 107, 203, 0.36)");
    orb1.addColorStop(1, "rgba(11, 107, 203, 0)");
    c.fillStyle = orb1;
    c.fillRect(0, 0, W, H);

    const orb2 = c.createRadialGradient(
      W * (0.75 + Math.cos(t * 0.4) * 0.08),
      H * 0.72,
      20,
      W * 0.75,
      H * 0.72,
      W * 0.6
    );
    orb2.addColorStop(0, sceneIdx === 3 || sceneIdx === 4 ? "rgba(22, 163, 74, 0.28)" : "rgba(56, 189, 248, 0.22)");
    orb2.addColorStop(1, "rgba(11, 107, 203, 0)");
    c.fillStyle = orb2;
    c.fillRect(0, 0, W, H);
  }

  function drawSceneHeaderCaption(c, W, H, stepPill, headline, subline, animIn) {
    const isPortrait = H > W;
    const enter = easeOutCubic(clamp(0.35 + animIn * 1.6, 0, 1));
    const topY = isPortrait ? lerp(64, 88, enter) : lerp(34, 52, enter);
    const centerX = isPortrait ? W / 2 : W * 0.30;
    const maxW = isPortrait ? W - 120 : W * 0.48;

    c.save();
    c.globalAlpha = clamp(0.85 + animIn * 0.8, 0, 1);

    // Glass Backing Card behind Top Headline for high contrast
    const cardW = isPortrait ? W - 84 : W * 0.52;
    const cardH = isPortrait ? 315 : 275;
    fillRoundRect(
      c,
      centerX - cardW / 2,
      topY - 18,
      cardW,
      cardH,
      28,
      "rgba(8, 23, 52, 0.78)",
      "rgba(56, 189, 248, 0.38)",
      2
    );

    // Step Pill
    c.font = "800 22px 'Outfit', sans-serif";
    const pillW = Math.max(290, c.measureText(stepPill).width + 56);
    fillRoundRect(
      c,
      centerX - pillW / 2,
      topY + 4,
      pillW,
      48,
      999,
      "rgba(11, 107, 203, 0.45)",
      "#38BDF8",
      2
    );
    c.fillStyle = "#7DD3FC";
    c.textAlign = "center";
    c.fillText(stepPill, centerX, topY + 35);

    // Main Headline
    c.fillStyle = "#FFFFFF";
    c.font = isPortrait ? "800 48px 'Outfit', sans-serif" : "800 42px 'Outfit', sans-serif";
    const lineCount = wrapText(c, headline, centerX, topY + 108, maxW, isPortrait ? 56 : 50, "center");

    // Subline
    if (subline) {
      c.fillStyle = "#BAE6FD";
      c.font = isPortrait ? "600 24px 'DM Sans', sans-serif" : "600 21px 'DM Sans', sans-serif";
      wrapText(c, subline, centerX, topY + 112 + lineCount * (isPortrait ? 56 : 50) + 8, maxW, 33, "center");
    }
    c.restore();
  }

  /* ------------------------------------------------------------
     6 SCENE CHOREOGRAPHIES (0s - 30s)
     ------------------------------------------------------------ */
  function renderFrame(t) {
    const W = state.width;
    const H = state.height;
    const isPortrait = H > W;

    const scene = SCENES.find(s => t >= s.start && t < s.end) || SCENES[SCENES.length - 1];
    const st = clamp((t - scene.start) / (scene.end - scene.start), 0, 1);

    drawStudioBackground(ctx, W, H, t, scene.index);

    const phoneCX = isPortrait ? W * 0.5 : W * 0.72;
    const phoneCY = isPortrait ? H * 0.61 : H * 0.54;
    const baseScale = isPortrait ? 1.24 : 0.92;

    /* ==========================================================
       SCENE 1 (0.0s - 4.5s): HOOK - NGOPI RESMI LEBIH HEMAT
       ========================================================== */
    if (scene.index === 0) {
      drawSceneHeaderCaption(
        ctx,
        W,
        H,
        "JASDOR RISGOLD • JASA ORDER RESMI",
        state.hookText,
        "Kopi Kenangan • Fore Coffee • Janji Jiwa (Hemat s/d 44%)",
        st * 2.2
      );

      const cam = {
        yaw: lerp(-26, -8, easeOutCubic(st)),
        pitch: lerp(18, 7, easeOutCubic(st)),
        roll: lerp(-3, -0.5, easeOutCubic(st)),
        scale: baseScale * lerp(0.86, 1.02, easeOutBack(Math.min(1, st * 1.4))),
        activeTabIdx: 0
      };

      draw3DSmartphone(ctx, phoneCX, phoneCY, cam, (sx, sy, sw, sh) => {
        // Inside phone: Brand Promo Showcase
        drawCoverImage(ctx, images.paketBerdua, sx + 16, sy + 12, sw - 32, 210, 20);
        fillRoundRect(ctx, sx + 16, sy + 234, sw - 32, 95, 18, "#FFFFFF", "#DBEAFE", 1.5);
        ctx.fillStyle = "#0F172A";
        ctx.font = "800 16px 'Outfit', sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("Pilih Brand Favoritmu", sx + 30, sy + 262);
        ctx.fillStyle = "#475569";
        ctx.font = "500 12px 'DM Sans', sans-serif";
        ctx.fillText("Ambil langsung di kasir outlet resmi terdekat", sx + 30, sy + 284);
      });

      // 3 Orbiting Brand Cards in 3D space
      const brands = [
        { name: "Kopi Kenangan", badge: "Diskon s/d 44%", img: images.kenanganLogo, dx: -260, dy: -220, z: 75 },
        { name: "Fore Coffee", badge: "Diskon Resmi 21%", img: images.foreLogo, dx: 265, dy: -165, z: 90 },
        { name: "Janji Jiwa", badge: "Diskon s/d 40%", img: images.janjiLogo, dx: -250, dy: 115, z: 85 }
      ];
      brands.forEach((b, idx) => {
        const pop = easeOutBack(clamp((st - idx * 0.1) * 2.2, 0, 1));
        if (pop <= 0) return;
        const floatY = Math.sin(t * 2.4 + idx) * 10;
        drawFloatingGlassCard(
          ctx,
          phoneCX + b.dx * pop,
          phoneCY + b.dy + floatY,
          305,
          104,
          cam,
          b.z * pop,
          { radius: 22 },
          (x, y) => {
            drawCoverImage(ctx, b.img, x + 14, y + 14, 76, 76, 16);
            ctx.fillStyle = "#0F172A";
            ctx.font = "800 20px 'Outfit', sans-serif";
            ctx.textAlign = "left";
            ctx.fillText(b.name, x + 104, y + 46);
            fillRoundRect(ctx, x + 104, y + 56, 162, 28, 999, "#DCFCE7");
            ctx.fillStyle = "#15803D";
            ctx.font = "800 13px 'DM Sans', sans-serif";
            ctx.fillText(b.badge, x + 118, y + 75);
          }
        );
      });

      // Floating 3D Price Comparison Flip Card
      const pricePop = easeOutBack(clamp((st - 0.25) * 2.0, 0, 1));
      drawFloatingGlassCard(
        ctx,
        phoneCX + 95,
        phoneCY + 255,
        430,
        142,
        cam,
        118 * pricePop,
        { bg: "linear-gradient(135deg, #084F99, #0B6BCB)", border: "#7DD3FC", borderWidth: 2.5, radius: 24 },
        (x, y, w, h) => {
          fillRoundRect(ctx, x, y, w, h, 24, "#0B6BCB", "#7DD3FC", 2.5);
          ctx.fillStyle = "#BAE6FD";
          ctx.font = "700 14px 'DM Sans', sans-serif";
          ctx.textAlign = "left";
          ctx.fillText("CONTOH HARGA CARAMEL LATTE:", x + 22, y + 34);

          // Strikethrough normal price
          ctx.fillStyle = "#FCA5A5";
          ctx.font = "700 22px 'JetBrains Mono', monospace";
          ctx.fillText("Toko: Rp 28.000", x + 22, y + 72);
          ctx.strokeStyle = "#EF4444";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x + 22, y + 64);
          ctx.lineTo(x + 215, y + 64);
          ctx.stroke();

          // JasDor Price
          ctx.fillStyle = "#4ADE80";
          ctx.font = "800 32px 'JetBrains Mono', monospace";
          ctx.fillText("JasDor: Rp 18.000", x + 22, y + 116);

          fillRoundRect(ctx, x + w - 135, y + 22, 115, 36, 999, "#16A34A");
          ctx.fillStyle = "#FFFFFF";
          ctx.font = "800 14px 'Outfit', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("HEMAT 36%", x + w - 77, y + 45);
        }
      );
    }

    /* ==========================================================
       SCENE 2 (4.5s - 10.0s): PILIH BRAND & OUTLET GPS
       ========================================================== */
    else if (scene.index === 1) {
      drawSceneHeaderCaption(
        ctx,
        W,
        H,
        "LANGKAH 1 • PILIH BRAND & CABANG",
        "1. Pilih Brand & Outlet Terdekat via GPS",
        "Tersedia 51 Cabang Resmi di Samarinda, Balikpapan & Tenggarong",
        st * 2.5
      );

      const cam = {
        yaw: lerp(-8, 17, easeInOutCubic(st)),
        pitch: lerp(7, 13, easeInOutCubic(st)),
        roll: lerp(-0.5, 1.8, easeInOutCubic(st)),
        scale: baseScale * lerp(1.02, 1.07, easeOutCubic(st)),
        activeTabIdx: 0
      };

      draw3DSmartphone(ctx, phoneCX, phoneCY, cam, (sx, sy, sw) => {
        const outlets = [
          { name: "Samarinda Central Plaza", area: "Samarinda • 0.8 km", hours: "10:00 - 22:00 WITA", active: true },
          { name: "Big Mall Samarinda", area: "Samarinda • 2.4 km", hours: "10:00 - 22:00 WITA", active: false },
          { name: "E-Walk Balikpapan", area: "Balikpapan • Mall GF", hours: "10:00 - 22:00 WITA", active: false },
          { name: "Danau Semayang Tenggarong", area: "Tenggarong • Pusat Kota", hours: "08:00 - 22:00 WITA", active: false }
        ];
        outlets.forEach((o, i) => {
          const oy = sy + 16 + i * 114;
          fillRoundRect(
            ctx,
            sx + 16,
            oy,
            sw - 32,
            100,
            18,
            o.active ? "#E3F0FF" : "#FFFFFF",
            o.active ? "#0B6BCB" : "#E2E8F0",
            o.active ? 2.5 : 1.5
          );
          ctx.fillStyle = "#0F172A";
          ctx.font = "800 15px 'Outfit', sans-serif";
          ctx.textAlign = "left";
          ctx.fillText(o.name, sx + 32, oy + 34);
          ctx.fillStyle = "#475569";
          ctx.font = "600 12px 'DM Sans', sans-serif";
          ctx.fillText(o.area + " • " + o.hours, sx + 32, oy + 58);

          fillRoundRect(ctx, sx + 32, oy + 68, 108, 22, 999, "#DCFCE7");
          ctx.fillStyle = "#15803D";
          ctx.font = "800 11px 'DM Sans', sans-serif";
          ctx.fillText("WITA: Sedang Buka", sx + 42, oy + 83);
        });
      });

      // Pop-out Multi-City GPS Bar
      const pop1 = easeOutBack(clamp(st * 2.2, 0, 1));
      drawFloatingGlassCard(
        ctx,
        phoneCX - 110,
        phoneCY - 235,
        460,
        88,
        cam,
        75 * pop1,
        { radius: 999 },
        (x, y) => {
          const cities = ["Samarinda", "Balikpapan", "Tenggarong"];
          cities.forEach((city, idx) => {
            const cxPill = x + 16 + idx * 144;
            fillRoundRect(ctx, cxPill, y + 16, 136, 56, 999, idx === 0 ? "#0B6BCB" : "#F1F5F9");
            ctx.fillStyle = idx === 0 ? "#FFFFFF" : "#334155";
            ctx.font = "800 16px 'Outfit', sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(city, cxPill + 68, y + 50);
          });
        }
      );

      // Pop-out Selected Outlet Card with Touch Ripple
      const pop2 = easeOutBack(clamp((st - 0.2) * 2.2, 0, 1));
      drawFloatingGlassCard(
        ctx,
        phoneCX + 70,
        phoneCY + 45,
        490,
        152,
        cam,
        112 * pop2,
        { border: "#0B6BCB", borderWidth: 3 },
        (x, y, w) => {
          drawCoverImage(ctx, images.kenanganLogo, x + 20, y + 26, 86, 86, 20);
          ctx.fillStyle = "#0B6BCB";
          ctx.font = "800 13px 'Outfit', sans-serif";
          ctx.textAlign = "left";
          ctx.fillText("CABANG TERDEKAT TERPILIH (GPS)", x + 122, y + 40);

          ctx.fillStyle = "#0F172A";
          ctx.font = "800 24px 'Outfit', sans-serif";
          ctx.fillText("Samarinda Central Plaza", x + 122, y + 72);

          ctx.fillStyle = "#475569";
          ctx.font = "600 14px 'DM Sans', sans-serif";
          ctx.fillText("0.8 km • Lantai GF • Buka s/d 22:00 WITA", x + 122, y + 98);

          fillRoundRect(ctx, x + 122, y + 108, 175, 30, 999, "#16A34A");
          ctx.fillStyle = "#FFFFFF";
          ctx.font = "800 13px 'DM Sans', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("Lanjut Pilih Menu ->", x + 209, y + 128);

          const tapProgress = clamp((st - 0.52) * 2.6, 0, 1);
          drawTouchRipple(ctx, x + w - 95, y + 120, tapProgress);
        }
      );
    }

    /* ==========================================================
       SCENE 3 (10.0s - 17.0s): PILIH MENU, VARIAN & BUNDLING
       ========================================================== */
    else if (scene.index === 2) {
      drawSceneHeaderCaption(
        ctx,
        W,
        H,
        "LANGKAH 2 • MENU, VARIAN & BUNDLING",
        "2. Bebas Pilih Menu, Varian Es/Gula & Paket Bundling",
        "Harga sama persis mulai Rp 13.500 - Paket Berdua hanya Rp 35.000",
        st * 2.5
      );

      const cam = {
        yaw: lerp(17, -15, easeInOutCubic(st)),
        pitch: lerp(13, 8, easeInOutCubic(st)),
        roll: lerp(1.8, -1.2, easeInOutCubic(st)),
        scale: baseScale * lerp(1.07, 1.1, easeOutCubic(st)),
        activeTabIdx: 1
      };

      draw3DSmartphone(ctx, phoneCX, phoneCY, cam, (sx, sy, sw) => {
        // Category chips inside phone
        const cats = ["Semua", "Satuan", "Bundling", "Coffee"];
        cats.forEach((cat, i) => {
          fillRoundRect(ctx, sx + 16 + i * 96, sy + 12, 88, 32, 999, i === 2 ? "#991B1B" : "#E2E8F0");
          ctx.fillStyle = i === 2 ? "#FFFFFF" : "#334155";
          ctx.font = "700 12px 'DM Sans', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(cat, sx + 60 + i * 96, sy + 32);
        });

        drawCoverImage(ctx, images.kkmDrink, sx + 16, sy + 58, 185, 185, 18);
        drawCoverImage(ctx, images.paketBerdua, sx + 215, sy + 58, 185, 185, 18);
      });

      // Layer 1 Pop-out: Kopi Kenangan Mantan Card
      const popA = easeOutBack(clamp(st * 2.4, 0, 1));
      drawFloatingGlassCard(
        ctx,
        phoneCX - 140,
        phoneCY - 165,
        435,
        134,
        cam,
        65 * popA,
        {},
        (x, y) => {
          drawCoverImage(ctx, images.kkmDrink, x + 16, y + 16, 102, 102, 18);
          ctx.fillStyle = "#991B1B";
          ctx.font = "800 12px 'Outfit', sans-serif";
          ctx.textAlign = "left";
          ctx.fillText("BEST SELLER • MENU SATUAN", x + 132, y + 36);
          ctx.fillStyle = "#0F172A";
          ctx.font = "800 22px 'Outfit', sans-serif";
          ctx.fillText("Kopi Kenangan Mantan", x + 132, y + 64);
          ctx.fillStyle = "#16A34A";
          ctx.font = "800 24px 'JetBrains Mono', monospace";
          ctx.fillText("Rp 15.000", x + 132, y + 98);
          ctx.fillStyle = "#94A3B8";
          ctx.font = "600 15px 'JetBrains Mono', monospace";
          ctx.fillText("Rp 22.000 (-32%)", x + 265, y + 98);
        }
      );

      // Layer 2 Pop-out: Paket Berdua Bundling Card
      const popB = easeOutBack(clamp((st - 0.16) * 2.4, 0, 1));
      drawFloatingGlassCard(
        ctx,
        phoneCX + 100,
        phoneCY + 20,
        465,
        148,
        cam,
        98 * popB,
        { border: "#991B1B", borderWidth: 2.5 },
        (x, y) => {
          drawCoverImage(ctx, images.paketBerdua, x + 16, y + 16, 116, 116, 18);
          fillRoundRect(ctx, x + 146, y + 18, 142, 24, 999, "#FEE2E2");
          ctx.fillStyle = "#991B1B";
          ctx.font = "800 11.5px 'Outfit', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("PAKET BUNDLING", x + 217, y + 34);

          ctx.fillStyle = "#0F172A";
          ctx.font = "800 22px 'Outfit', sans-serif";
          ctx.textAlign = "left";
          ctx.fillText("PAKET BERDUA (4 Menu)", x + 146, y + 66);

          ctx.fillStyle = "#475569";
          ctx.font = "600 13px 'DM Sans', sans-serif";
          ctx.fillText("Bebas Pilih 2 Minuman + 2 Roti/Donut", x + 146, y + 89);

          ctx.fillStyle = "#0B6BCB";
          ctx.font = "800 26px 'JetBrains Mono', monospace";
          ctx.fillText("Rp 35.000", x + 146, y + 124);
        }
      );

      // Layer 3 Pop-out: Customizer Pills + Add to Cart CTA
      const popC = easeOutBack(clamp((st - 0.34) * 2.4, 0, 1));
      drawFloatingGlassCard(
        ctx,
        phoneCX - 20,
        phoneCY + 230,
        490,
        132,
        cam,
        130 * popC,
        { border: "#0B6BCB", borderWidth: 3 },
        (x, y, w) => {
          const pills = ["Ice", "Regular", "Normal Sugar", "Normal Ice"];
          pills.forEach((p, idx) => {
            const px = x + 18 + idx * 116;
            fillRoundRect(ctx, px, y + 16, 108, 34, 999, "#E3F0FF", "#0B6BCB", 1.5);
            ctx.fillStyle = "#0B6BCB";
            ctx.font = "800 13px 'DM Sans', sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(p, px + 54, y + 38);
          });

          fillRoundRect(ctx, x + 18, y + 64, w - 36, 52, 16, "#0B6BCB");
          ctx.fillStyle = "#FFFFFF";
          ctx.font = "800 18px 'Outfit', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("+ Masukkan ke Keranjang • Rp 35.000", x + w / 2, y + 96);

          const tap = clamp((st - 0.65) * 3.0, 0, 1);
          drawTouchRipple(ctx, x + w * 0.72, y + 90, tap);
        }
      );
    }

    /* ==========================================================
       SCENE 4 (17.0s - 22.0s): BUKTI PERBANDINGAN HEMAT
       ========================================================== */
    else if (scene.index === 3) {
      drawSceneHeaderCaption(
        ctx,
        W,
        H,
        "LANGKAH 3 • TRANSPARAN & BEBAS BIAYA ADMIN",
        "3. Langsung Kelihatan Perbandingan Hematnya!",
        "Gratis Biaya Admin (Rp 0) untuk Fore, Janji Jiwa, Bundling, Satuan & Kopken >= 2 Cup",
        st * 2.5
      );

      const cam = {
        yaw: lerp(-15, 19, easeInOutCubic(st)),
        pitch: lerp(8, -5, easeInOutCubic(st)),
        roll: lerp(-1.2, 1.4, easeInOutCubic(st)),
        scale: baseScale * 1.06,
        activeTabIdx: 2
      };

      draw3DSmartphone(ctx, phoneCX, phoneCY, cam, (sx, sy, sw) => {
        fillRoundRect(ctx, sx + 16, sy + 16, sw - 32, 160, 20, "#0B6BCB");
        fillRoundRect(ctx, sx + 16, sy + 190, sw - 32, 220, 20, "#FFFFFF", "#E2E8F0", 1.5);
      });

      // Pop-out Royal Blue Savings Comparison Card
      const popHero = easeOutBack(clamp(st * 2.2, 0, 1));
      drawFloatingGlassCard(
        ctx,
        phoneCX - 15,
        phoneCY - 85,
        525,
        245,
        cam,
        118 * popHero,
        { bg: "#084F99", border: "#38BDF8", borderWidth: 3, radius: 28 },
        (x, y, w, h) => {
          const g = ctx.createLinearGradient(x, y, x + w, y + h);
          g.addColorStop(0, "#084F99");
          g.addColorStop(1, "#0B6BCB");
          fillRoundRect(ctx, x, y, w, h, 28, g, "#7DD3FC", 3);

          ctx.fillStyle = "#BAE6FD";
          ctx.font = "800 14px 'Outfit', sans-serif";
          ctx.textAlign = "left";
          ctx.fillText("PERBANDINGAN PENGELUARAN PESANANMU", x + 26, y + 38);

          // Box 1: Toko Resmi
          fillRoundRect(ctx, x + 24, y + 54, 226, 110, 18, "rgba(255,255,255,0.12)");
          ctx.fillStyle = "#E2E8F0";
          ctx.font = "600 13px 'DM Sans', sans-serif";
          ctx.fillText("Total Beli di Toko Resmi", x + 40, y + 84);
          ctx.fillStyle = "#FCA5A5";
          ctx.font = "800 28px 'JetBrains Mono', monospace";
          ctx.fillText("Rp 57.000", x + 40, y + 128);
          ctx.strokeStyle = "#EF4444";
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(x + 38, y + 118);
          ctx.lineTo(x + 205, y + 118);
          ctx.stroke();

          // Box 2: JasDor RisGold
          fillRoundRect(ctx, x + 272, y + 54, 228, 110, 18, "rgba(22, 163, 74, 0.28)", "#4ADE80", 2);
          ctx.fillStyle = "#DCFCE7";
          ctx.font = "700 13px 'DM Sans', sans-serif";
          ctx.fillText("Total di JasDor RisGold", x + 288, y + 84);
          ctx.fillStyle = "#4ADE80";
          ctx.font = "800 30px 'JetBrains Mono', monospace";
          ctx.fillText("Rp 35.000", x + 288, y + 128);

          // Savings Footer Pill
          fillRoundRect(ctx, x + 24, y + 180, w - 48, 44, 14, "#16A34A");
          ctx.fillStyle = "#FFFFFF";
          ctx.font = "800 16px 'Outfit', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("HEMAT Rp 22.000 (39%) • BIAYA ADMIN Rp 0!", x + w / 2, y + 208);
        }
      );
    }

    /* ==========================================================
       SCENE 5 (22.0s - 26.0s): STRUK DIGITAL JPG & KIRIM WA
       ========================================================== */
    else if (scene.index === 4) {
      drawSceneHeaderCaption(
        ctx,
        W,
        H,
        "LANGKAH 4 • STRUK DIGITAL & WHATSAPP",
        "4. Unduh Struk Digital (JPG) & Kirim 1-Klik ke WA",
        "Otomatis terformat rapi ke WhatsApp Admin - siap diproses ke outlet!",
        st * 2.5
      );

      const cam = {
        yaw: lerp(19, -7, easeInOutCubic(st)),
        pitch: lerp(-5, 11, easeInOutCubic(st)),
        roll: 0,
        scale: baseScale * 1.04,
        activeTabIdx: 2
      };

      draw3DSmartphone(ctx, phoneCX, phoneCY, cam, (sx, sy, sw) => {
        fillRoundRect(ctx, sx + 22, sy + 24, sw - 44, 420, 22, "#FFFFFF", "#CBD5E1", 1.5);
      });

      // Pop-out 3D Digital Receipt Card sliding out of the phone
      const slidePop = easeOutBack(clamp(st * 2.0, 0, 1));
      drawFloatingGlassCard(
        ctx,
        phoneCX,
        phoneCY - 20 * slidePop,
        475,
        420,
        cam,
        125 * slidePop,
        { radius: 26, border: "#0B6BCB", borderWidth: 3 },
        (x, y, w) => {
          // Receipt Blue Header
          fillRoundRect(ctx, x + 16, y + 16, w - 32, 82, 18, "#0B6BCB");
          ctx.fillStyle = "#FFFFFF";
          ctx.font = "800 20px 'Outfit', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("STRUK PEMESANAN RESMI", x + w / 2, y + 48);
          ctx.fillStyle = "#BAE6FD";
          ctx.font = "700 14px 'JetBrains Mono', monospace";
          ctx.fillText("#DLM-261123-8949 • LUNAS / PROSES", x + w / 2, y + 76);

          // Receipt Details
          ctx.textAlign = "left";
          ctx.fillStyle = "#64748B";
          ctx.font = "600 14px 'DM Sans', sans-serif";
          ctx.fillText("Outlet:", x + 28, y + 130);
          ctx.fillStyle = "#0F172A";
          ctx.font = "800 15px 'DM Sans', sans-serif";
          ctx.fillText("Kopi Kenangan - Samarinda Central Plaza", x + 110, y + 130);

          ctx.fillStyle = "#64748B";
          ctx.font = "600 14px 'DM Sans', sans-serif";
          ctx.fillText("Pesanan:", x + 28, y + 160);
          ctx.fillStyle = "#0F172A";
          ctx.font = "800 15px 'DM Sans', sans-serif";
          ctx.fillText("1x Triple Cup Reguler (3 Cup) - Rp 35.000", x + 110, y + 160);

          fillRoundRect(ctx, x + 24, y + 184, w - 48, 52, 14, "#F0FDF4", "#BBF7D0", 1.5);
          ctx.fillStyle = "#15803D";
          ctx.font = "800 18px 'JetBrains Mono', monospace";
          ctx.textAlign = "center";
          ctx.fillText("TOTAL BAYAR: Rp 35.000 (Hemat Rp 22.000)", x + w / 2, y + 216);

          // 2 Buttons: Unduh Struk JPG + Lanjut Kirim ke WA
          fillRoundRect(ctx, x + 24, y + 256, w - 48, 58, 16, "#E3F0FF", "#0B6BCB", 2);
          ctx.fillStyle = "#0B6BCB";
          ctx.font = "800 17px 'Outfit', sans-serif";
          ctx.fillText("Unduh Struk Digital (JPG)", x + w / 2, y + 291);

          fillRoundRect(ctx, x + 24, y + 328, w - 48, 66, 18, "#16A34A");
          ctx.fillStyle = "#FFFFFF";
          ctx.font = "800 19px 'Outfit', sans-serif";
          ctx.fillText("Lanjut Kirim Pesanan ke WhatsApp ->", x + w / 2, y + 368);

          const tapWA = clamp((st - 0.5) * 2.5, 0, 1);
          drawTouchRipple(ctx, x + w * 0.75, y + 360, tapWA);
        }
      );
    }

    /* ==========================================================
       SCENE 6 (26.0s - 30.0s): TESTIMONI & CALL TO ACTION
       ========================================================== */
    else {
      drawSceneHeaderCaption(
        ctx,
        W,
        H,
        "TERBUKTI AMAN • RATUSAN TESTIMONI ASLI",
        "Yuk Ngopi Lebih Hemat Sekarang di " + state.ctaUrl,
        state.ctaSub,
        st * 2.6
      );

      const cam = {
        yaw: lerp(-7, 0, easeOutCubic(st)),
        pitch: lerp(11, 4, easeOutCubic(st)),
        roll: 0,
        scale: baseScale * lerp(1.04, 0.98, easeOutCubic(st)),
        activeTabIdx: 3
      };

      draw3DSmartphone(ctx, phoneCX, phoneCY, cam, (sx, sy, sw) => {
        // WA Chat Testimonials inside phone
        fillRoundRect(ctx, sx + 16, sy + 14, sw - 32, 92, 16, "#DCF8C6");
        fillRoundRect(ctx, sx + 16, sy + 118, sw - 32, 92, 16, "#FFFFFF");
      });

      // Left & Right Floating WA Testimonial Bubbles
      const testimonials = [
        {
          user: "D***n • Samarinda Central Plaza",
          stars: "★★★★★ 5.0",
          msg: "\"Cepet banget diprosesnya, tinggal sebut nama di kasir langsung ambil kopi!\"",
          dx: -195,
          dy: -165,
          z: 88
        },
        {
          user: "R***y • Big Mall Samarinda",
          stars: "★★★★★ 5.0",
          msg: "\"Paket Berdua 35rb dapet 2 kopi + 2 roti, hemat parah dibanding beli langsung!\"",
          dx: 185,
          dy: -5,
          z: 102
        }
      ];

      testimonials.forEach((item, idx) => {
        const pop = easeOutBack(clamp((st - idx * 0.12) * 2.5, 0, 1));
        drawFloatingGlassCard(
          ctx,
          phoneCX + item.dx * pop,
          phoneCY + item.dy,
          445,
          126,
          cam,
          item.z * pop,
          { bg: "#FFFFFF", border: "#22C55E", borderWidth: 2.5 },
          (x, y, w) => {
            ctx.fillStyle = "#15803D";
            ctx.font = "800 14px 'Outfit', sans-serif";
            ctx.textAlign = "left";
            ctx.fillText(item.user, x + 20, y + 32);

            ctx.fillStyle = "#F59E0B";
            ctx.font = "800 15px 'Outfit', sans-serif";
            ctx.textAlign = "right";
            ctx.fillText(item.stars, x + w - 20, y + 32);

            ctx.fillStyle = "#0F172A";
            ctx.font = "600 15px 'DM Sans', sans-serif";
            wrapText(ctx, item.msg, x + 20, y + 64, w - 40, 23, "left");
          }
        );
      });

      // Final Glowing URL CTA Pill
      const ctaPop = easeOutBack(clamp((st - 0.18) * 2.4, 0, 1));
      drawFloatingGlassCard(
        ctx,
        phoneCX,
        phoneCY + 245,
        550,
        155,
        cam,
        138 * ctaPop,
        { border: "#4ADE80", borderWidth: 3.5, radius: 30 },
        (x, y, w, h) => {
          const g = ctx.createLinearGradient(x, y, x + w, y + h);
          g.addColorStop(0, "#084F99");
          g.addColorStop(1, "#0B6BCB");
          fillRoundRect(ctx, x, y, w, h, 30, g, "#4ADE80", 3.5);

          ctx.fillStyle = "#BAE6FD";
          ctx.font = "800 15px 'Outfit', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("BUKA WEBSITE SEKARANG (TANPA INSTALL):", x + w / 2, y + 40);

          fillRoundRect(ctx, x + 36, y + 54, w - 72, 62, 999, "#FFFFFF");
          ctx.fillStyle = "#0B6BCB";
          ctx.font = "800 34px 'JetBrains Mono', monospace";
          ctx.fillText("https://" + state.ctaUrl, x + w / 2, y + 97);

          ctx.fillStyle = "#86EFAC";
          ctx.font = "700 14px 'DM Sans', sans-serif";
          ctx.fillText("Samarinda • Balikpapan • Tenggarong", x + w / 2, y + 138);
        }
      );
    }

    // Bottom Progress Strip on Video Frame
    ctx.fillStyle = "rgba(255, 255, 255, 0.14)";
    ctx.fillRect(0, H - 10, W, 10);
    const progGrad = ctx.createLinearGradient(0, 0, W, 0);
    progGrad.addColorStop(0, "#0B6BCB");
    progGrad.addColorStop(0.5, "#38BDF8");
    progGrad.addColorStop(1, "#4ADE80");
    ctx.fillStyle = progGrad;
    ctx.fillRect(0, H - 10, W * (t / TOTAL_DURATION), 10);
  }

  /* ------------------------------------------------------------
     ANIMATION LOOP & UI SYNCHRONIZATION
     ------------------------------------------------------------ */
  const hudSceneBadge = document.getElementById("hud-scene-badge");
  const hudTimeBadge = document.getElementById("hud-time-badge");
  const scrubber = document.getElementById("timeline-scrubber");
  const sceneChips = Array.from(document.querySelectorAll(".scene-chip"));
  const storyItems = Array.from(document.querySelectorAll("#storyboard-list li"));

  function syncHud(t) {
    const scene = SCENES.find(s => t >= s.start && t < s.end) || SCENES[SCENES.length - 1];
    if (hudSceneBadge) hudSceneBadge.textContent = scene.title;
    if (hudTimeBadge) hudTimeBadge.textContent = `${t.toFixed(1).padStart(4, "0")}s / 30.0s • 60 FPS`;
    if (scrubber && document.activeElement !== scrubber) {
      scrubber.value = t.toFixed(2);
    }

    if (scene.index !== state.lastSceneIdx) {
      state.lastSceneIdx = scene.index;
      playWhooshSfx();
      sceneChips.forEach((chip, idx) => chip.classList.toggle("is-active", idx === scene.index));
      storyItems.forEach((li, idx) => li.classList.toggle("is-current", idx === scene.index));
    }

    const beatIdx = Math.floor(t * 2); // 120 BPM eighth-pulse
    if (beatIdx !== state.lastBeatIdx && state.playing) {
      state.lastBeatIdx = beatIdx;
      playChordBeat(beatIdx);
      if (
        Math.abs(t - 7.3) < 0.25 ||
        Math.abs(t - 14.6) < 0.25 ||
        Math.abs(t - 24.0) < 0.25
      ) {
        playPopSfx(784);
      }
    }
  }

  function tick(ts) {
    if (!state.lastFrameTs) state.lastFrameTs = ts;
    const dt = Math.min(0.1, (ts - state.lastFrameTs) / 1000);
    state.lastFrameTs = ts;

    if (state.playing) {
      state.time += dt;
      if (state.time >= TOTAL_DURATION) {
        if (state.recording) {
          state.time = TOTAL_DURATION;
        } else {
          state.time = 0;
          state.lastSceneIdx = -1;
        }
      }
    }

    renderFrame(state.time);
    syncHud(state.time);
    requestAnimationFrame(tick);
  }

  /* ------------------------------------------------------------
     VIDEO RECORDING & 6-FRAME PNG EXPORTER
     ------------------------------------------------------------ */
  let activeRecorder = null;
  let recordTimer = null;

  function pickSupportedMime() {
    const candidates = [
      "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
      "video/mp4",
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm"
    ];
    if (typeof MediaRecorder === "undefined") return "";
    for (const m of candidates) {
      if (MediaRecorder.isTypeSupported(m)) return m;
    }
    return "";
  }

  function startVideoExport() {
    if (state.recording) return;
    const mime = pickSupportedMime();
    if (!mime || !canvas.captureStream) {
      alert("Browser ini tidak mendukung MediaRecorder Canvas. Gunakan Google Chrome atau Microsoft Edge.");
      return;
    }

    ensureAudio();
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();

    const modal = document.getElementById("render-modal");
    const barFill = document.getElementById("render-bar-fill");
    const pctEl = document.getElementById("render-pct");
    if (modal) modal.classList.remove("is-hidden");

    state.recording = true;
    state.playing = true;
    state.time = 0;
    state.lastSceneIdx = -1;

    const videoStream = canvas.captureStream(FPS);
    if (audioDest && audioDest.stream) {
      audioDest.stream.getAudioTracks().forEach(track => videoStream.addTrack(track));
    }

    const chunks = [];
    const recorder = new MediaRecorder(videoStream, {
      mimeType: mime,
      videoBitsPerSecond: 12000000 // 12 Mbps crisp HD
    });
    activeRecorder = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      clearInterval(recordTimer);
      state.recording = false;
      if (modal) modal.classList.add("is-hidden");
      if (!chunks.length) return;

      const ext = mime.includes("mp4") ? "mp4" : "webm";
      const blob = new Blob(chunks, { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `jasdor-risgold-promo-3d-${state.aspect.replace(":", "x")}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    };

    recorder.start(200);

    recordTimer = setInterval(() => {
      const pct = Math.min(100, Math.round((state.time / TOTAL_DURATION) * 100));
      if (barFill) barFill.style.width = pct + "%";
      if (pctEl) pctEl.textContent = pct + "%";
      if (state.time >= TOTAL_DURATION && recorder.state === "recording") {
        recorder.stop();
      }
    }, 120);
  }

  function cancelVideoExport() {
    clearInterval(recordTimer);
    state.recording = false;
    const modal = document.getElementById("render-modal");
    if (modal) modal.classList.add("is-hidden");
    if (activeRecorder && activeRecorder.state === "recording") {
      activeRecorder.ondataavailable = null;
      activeRecorder.onstop = null;
      activeRecorder.stop();
    }
  }

  async function exportSixFramesPng() {
    const wasPlaying = state.playing;
    const prevTime = state.time;
    state.playing = false;

    const sampleTimes = [2.6, 7.2, 13.8, 19.5, 24.2, 28.5];
    for (let i = 0; i < sampleTimes.length; i++) {
      state.time = sampleTimes[i];
      renderFrame(state.time);
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `jasdor-3d-scene-${i + 1}-${state.aspect.replace(":", "x")}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      await new Promise(r => setTimeout(r, 220));
    }

    state.time = prevTime;
    state.playing = wasPlaying;
  }

  /* ------------------------------------------------------------
     EVENT BINDINGS
     ------------------------------------------------------------ */
  function bindEvents() {
    const playBtn = document.getElementById("btn-play-toggle");
    const playLabel = document.getElementById("play-icon-label");
    if (playBtn) {
      playBtn.addEventListener("click", () => {
        ensureAudio();
        state.playing = !state.playing;
        if (playLabel) playLabel.textContent = state.playing ? "Jeda" : "Putar";
      });
    }

    const restartBtn = document.getElementById("btn-restart");
    if (restartBtn) {
      restartBtn.addEventListener("click", () => {
        ensureAudio();
        state.time = 0;
        state.lastSceneIdx = -1;
        state.playing = true;
        if (playLabel) playLabel.textContent = "Jeda";
      });
    }

    const audioBtn = document.getElementById("btn-audio-toggle");
    if (audioBtn) {
      audioBtn.addEventListener("click", () => {
        ensureAudio();
        state.muted = !state.muted;
        if (masterGain && audioCtx) {
          masterGain.gain.setValueAtTime(state.muted ? 0 : 0.26, audioCtx.currentTime);
        }
        audioBtn.textContent = state.muted ? "Suara & Musik: OFF" : "Suara & Musik: ON";
      });
    }

    if (scrubber) {
      scrubber.addEventListener("input", () => {
        state.time = parseFloat(scrubber.value) || 0;
        renderFrame(state.time);
        syncHud(state.time);
      });
    }

    sceneChips.forEach(chip => {
      chip.addEventListener("click", () => {
        ensureAudio();
        state.time = (parseFloat(chip.dataset.jump) || 0) + 0.35;
        renderFrame(state.time);
        syncHud(state.time);
      });
    });

    storyItems.forEach(li => {
      li.addEventListener("click", () => {
        ensureAudio();
        const idx = parseInt(li.dataset.sceneIdx, 10) || 0;
        if (SCENES[idx]) {
          state.time = SCENES[idx].start + 0.35;
          renderFrame(state.time);
          syncHud(state.time);
        }
      });
    });

    document.querySelectorAll("[data-aspect-btn]").forEach(btn => {
      btn.addEventListener("click", () => {
        const aspect = btn.dataset.aspectBtn;
        state.aspect = aspect;
        if (aspect === "16:9") {
          state.width = 1920;
          state.height = 1080;
        } else {
          state.width = 1080;
          state.height = 1920;
        }
        canvas.width = state.width;
        canvas.height = state.height;
        document.querySelectorAll("[data-aspect-btn]").forEach(b => b.classList.toggle("is-active", b === btn));
        renderFrame(state.time);
      });
    });

    const camSel = document.getElementById("ctrl-cam-intensity");
    if (camSel) {
      camSel.addEventListener("change", () => {
        state.camIntensity = parseFloat(camSel.value) || 1.0;
      });
    }

    const hookInp = document.getElementById("ctrl-hook-text");
    if (hookInp) {
      hookInp.addEventListener("input", () => {
        state.hookText = hookInp.value.trim() || "Ngopi Resmi di Outlet Terdekat, Kok Bisa Semurah Ini?";
      });
    }

    const ctaUrlInp = document.getElementById("ctrl-cta-url");
    if (ctaUrlInp) {
      ctaUrlInp.addEventListener("input", () => {
        state.ctaUrl = ctaUrlInp.value.trim().replace(/^https?:\/\//, "") || "jasdor.web.id";
      });
    }

    const ctaSubInp = document.getElementById("ctrl-cta-sub");
    if (ctaSubInp) {
      ctaSubInp.addEventListener("input", () => {
        state.ctaSub = ctaSubInp.value.trim();
      });
    }

    const recBtn = document.getElementById("btn-record-video");
    if (recBtn) recBtn.addEventListener("click", startVideoExport);

    const cancelRecBtn = document.getElementById("btn-cancel-record");
    if (cancelRecBtn) cancelRecBtn.addEventListener("click", cancelVideoExport);

    const framesBtn = document.getElementById("btn-export-frames");
    if (framesBtn) framesBtn.addEventListener("click", exportSixFramesPng);

    window.addEventListener("keydown", (e) => {
      if (e.code === "Space" && document.activeElement.tagName !== "INPUT") {
        e.preventDefault();
        if (playBtn) playBtn.click();
      }
    });
  }

  preloadAssets();
  bindEvents();
  requestAnimationFrame(tick);
})();
