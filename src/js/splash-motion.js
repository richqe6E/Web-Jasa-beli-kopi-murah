/* ============================================================
   JASDOR RISGOLD — FULLSCREEN 3D RIBBON SPLASH ENGINE (60 FPS)
   Deterministik F0..F180 (3.00s) | Gaya Render 3D Pita (-15° -> 0°)
   Responsif Fullscreen 9:16 (Mobile) & 16:9 (Desktop)
   ============================================================ */
(function () {
  "use strict";

  const TOTAL_FRAMES = 180;
  const FPS = 60;
  const MONOGRAM_CENTER_X = 960;
  const MONOGRAM_LEFT_FINAL_X = 655;
  const MONOGRAM_BASE_Y = 540;
  const MONOGRAM_FINAL_SCALE = 1.26;
  const JASDOR_FINAL_X = [854, 942, 1037, 1113, 1234, 1332];
  const RISGOLD_BASE_TRACKING = 28;
  const RISGOLD_EXTRA_TRACKING = 18;

  const MONOGRAM_PATHS = {
    curveS: "M 101 236 C 127 206, 129 168, 111 130 C 93 92, 95 54, 119 24",
    rOuter: "M 96 24 C 46 38, 22 82, 22 132 C 22 184, 52 228, 94 238 C 115 212, 117 170, 100 130",
    rBowl:  "M 96 24 C 75 50, 72 80, 66 102 C 61 120, 46 128, 24 128",
    rLeg:   "M 42 128 C 60 136, 68 176, 94 202",
    nOuter: "M 107 84 C 105 52, 114 28, 126 24 C 174 38, 198 82, 198 130 C 198 182, 172 224, 126 238",
    nInner: "M 126 238 C 148 202, 154 146, 132 66 C 130 60, 135 58, 139 64 C 160 92, 178 128, 191 170"
  };

  function createCubicBezier(x1, y1, x2, y2) {
    const sampleX = (t) => ((1 - 3 * x2 + 3 * x1) * t + (3 * x2 - 6 * x1)) * t * t + 3 * x1 * t;
    const sampleY = (t) => ((1 - 3 * y2 + 3 * y1) * t + (3 * y2 - 6 * y1)) * t * t + 3 * y1 * t;
    const sampleDX = (t) => (3 * (1 - 3 * x2 + 3 * x1) * t + 2 * (3 * x2 - 6 * x1)) * t + 3 * x1;

    function solveX(x) {
      let t = x;
      for (let i = 0; i < 8; i++) {
        const err = sampleX(t) - x;
        if (Math.abs(err) < 1e-6) return t;
        const d = sampleDX(t);
        if (Math.abs(d) < 1e-6) break;
        t -= err / d;
      }
      let lo = 0, hi = 1;
      t = x;
      for (let i = 0; i < 14; i++) {
        const xEst = sampleX(t);
        if (Math.abs(xEst - x) < 1e-6) return t;
        if (x > xEst) lo = t;
        else hi = t;
        t = (lo + hi) * 0.5;
      }
      return t;
    }

    return (x) => {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      return sampleY(solveX(x));
    };
  }

  const easeCurveS = createCubicBezier(0.30, 0.00, 0.25, 1.00);
  const easeQuintOut = createCubicBezier(0.22, 1.00, 0.36, 1.00);
  const easeMonogramShift = createCubicBezier(0.70, 0.00, 0.15, 1.00);
  const easeFlatten3D = createCubicBezier(0.24, 0.90, 0.30, 1.00);
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  let rafId = null;
  let holdTimer = null;
  let closeTimer = null;
  let resizeHandler = null;
  let isClosing = false;
  let pathLengths = {};

  function getResponsiveViewBox() {
    const w = window.innerWidth || 390;
    const h = window.innerHeight || 844;
    return (h >= w || w < 768) ? "390 -473 1140 2026" : "0 0 1920 1080";
  }

  function evaluateFrameState(f) {
    const frame = clamp(f, 0, TOTAL_FRAMES);

    const tS = clamp(frame / 27, 0, 1);
    const trimS = easeCurveS(tS);
    const opacityS = clamp(frame / 2.5, 0, 1);

    const tR = clamp((frame - 21) / 50, 0, 1);
    const pR = easeQuintOut(tR);
    const opacityR = frame <= 21 ? 0 : clamp((frame - 21) / 3, 0, 1);
    const trimROuter = pR;
    const trimRBowl = easeQuintOut(clamp((frame - 24) / 45, 0, 1));
    const trimRLeg = easeQuintOut(clamp((frame - 34) / 37, 0, 1));

    const tN = clamp((frame - 25) / 50, 0, 1);
    const pN = easeQuintOut(tN);
    const opacityN = frame <= 25 ? 0 : clamp((frame - 25) / 3, 0, 1);
    const trimNOuter = pN;
    const trimNInner = easeQuintOut(clamp((frame - 31) / 44, 0, 1));

    const tScale = clamp((frame - 21) / 54, 0, 1);
    const breathScale = 0.94 + 0.06 * easeQuintOut(tScale);

    const tShift = clamp((frame - 66) / 33, 0, 1);
    const pShift = easeMonogramShift(tShift);
    const monogramX = MONOGRAM_CENTER_X + (MONOGRAM_LEFT_FINAL_X - MONOGRAM_CENTER_X) * pShift;

    const letters = JASDOR_FINAL_X.map((baseX, idx) => {
      const startF = 75 + idx * 3;
      const tL = clamp((frame - startF) / 39, 0, 1);
      const pL = easeQuintOut(tL);
      return {
        x: baseX - 15 * (1 - pL),
        opacity: clamp(tL * 2.2, 0, 1) * (0.25 + 0.75 * pL)
      };
    });

    const monogramRightEdge = monogramX + 114 * MONOGRAM_FINAL_SCALE * breathScale;
    const maskLeftX = Math.max(796, monogramRightEdge + 6);

    const tSub = clamp((frame - 93) / 48, 0, 1);
    const pSub = easeQuintOut(tSub);
    const risgoldOpacity = pSub;
    const risgoldTracking = RISGOLD_BASE_TRACKING + RISGOLD_EXTRA_TRACKING * (1 - pSub);
    const risgoldOffsetY = 6 * (1 - pSub);

    const tFlat = clamp(frame / 155, 0, 1);
    const pFlat = easeFlatten3D(tFlat);
    const rotY = -15 * (1 - pFlat);
    const depthFactor = 1 - pFlat;

    return {
      frame,
      trimS, opacityS,
      trimROuter, trimRBowl, trimRLeg, opacityR,
      trimNOuter, trimNInner, opacityN,
      breathScale, monogramX, maskLeftX,
      letters,
      risgoldOpacity, risgoldTracking, risgoldOffsetY,
      rotY, depthFactor
    };
  }

  function clearAll() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    if (holdTimer !== null) {
      clearTimeout(holdTimer);
      holdTimer = null;
    }
    if (closeTimer !== null) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
    if (resizeHandler) {
      window.removeEventListener("resize", resizeHandler);
      resizeHandler = null;
    }
  }

  function buildSplashMarkup(iconSkipHtml, brandName) {
    return `
      <div class="splash-fullscreen" id="splash-overlay" role="dialog" aria-modal="true" aria-label="Animasi Pembuka ${brandName}">
        <button type="button" class="splash-skip-floating" data-action="close-splash" aria-label="Lewati animasi pembuka">
          Lewati ${iconSkipHtml}
        </button>

        <div class="splash-fullscreen-stage">
          <div id="dlm-splash-3d-rig" class="splash-3d-rig">
            <svg id="dlm-splash-svg" class="splash-svg-canvas" viewBox="${getResponsiveViewBox()}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="JasDor RISGOLD">
              <defs>
                <filter id="dlm-matte-ink-texture" x="-5%" y="-5%" width="110%" height="110%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="noise" />
                  <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.035 0" in="noise" result="softNoise" />
                  <feComposite in="softNoise" in2="SourceAlpha" operator="in" result="clippedNoise" />
                  <feBlend in="SourceGraphic" in2="clippedNoise" mode="screen" />
                </filter>

                <clipPath id="dlm-jasdor-reveal-clip">
                  <rect id="dlm-jasdor-clip-rect" x="802" y="340" width="760" height="340" />
                </clipPath>

                <linearGradient id="dlm-ribbon-bevel-light" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.55" />
                  <stop offset="45%" stop-color="#FFFFFF" stop-opacity="0.12" />
                  <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0" />
                </linearGradient>
              </defs>

              <rect x="-3000" y="-3000" width="8000" height="8000" fill="#FFFFFF" />

              <g id="dlm-monogram-mover" transform="translate(960, 540)">
                <g id="dlm-monogram-scaler" transform="scale(1.26)">
                  <g id="dlm-monogram-centered" transform="translate(-110, -130)">

                    <g id="dlm-ribbon-3d-extrude" opacity="0">
                      <path id="dlm-ext-curveS" d="${MONOGRAM_PATHS.curveS}" fill="none" stroke="#316196" stroke-width="12.5" stroke-linecap="round" stroke-linejoin="round" />
                      <path id="dlm-ext-rOuter" d="${MONOGRAM_PATHS.rOuter}" fill="none" stroke="#0B2340" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" />
                      <path id="dlm-ext-rBowl" d="${MONOGRAM_PATHS.rBowl}" fill="none" stroke="#0B2340" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" />
                      <path id="dlm-ext-rLeg" d="${MONOGRAM_PATHS.rLeg}" fill="none" stroke="#0B2340" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" />
                      <path id="dlm-ext-nOuter" d="${MONOGRAM_PATHS.nOuter}" fill="none" stroke="#0B2340" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" />
                      <path id="dlm-ext-nInner" d="${MONOGRAM_PATHS.nInner}" fill="none" stroke="#0B2340" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" />
                    </g>

                    <g id="dlm-01-curve-s">
                      <path id="dlm-path-curveS" d="${MONOGRAM_PATHS.curveS}" fill="none" stroke="#4C86C6" stroke-width="11.5" stroke-linecap="round" stroke-linejoin="round" />
                    </g>

                    <g id="dlm-02-stroke-r">
                      <path id="dlm-path-rOuter" d="${MONOGRAM_PATHS.rOuter}" fill="none" stroke="#153B66" stroke-width="12.2" stroke-linecap="round" stroke-linejoin="round" />
                      <path id="dlm-path-rBowl" d="${MONOGRAM_PATHS.rBowl}" fill="none" stroke="#153B66" stroke-width="12.2" stroke-linecap="round" stroke-linejoin="round" />
                      <path id="dlm-path-rLeg" d="${MONOGRAM_PATHS.rLeg}" fill="none" stroke="#153B66" stroke-width="11.6" stroke-linecap="round" stroke-linejoin="round" />
                    </g>

                    <g id="dlm-03-stroke-n">
                      <path id="dlm-path-nOuter" d="${MONOGRAM_PATHS.nOuter}" fill="none" stroke="#153B66" stroke-width="12.2" stroke-linecap="round" stroke-linejoin="round" />
                      <path id="dlm-path-nInner" d="${MONOGRAM_PATHS.nInner}" fill="none" stroke="#153B66" stroke-width="12.2" stroke-linecap="round" stroke-linejoin="round" />
                    </g>

                    <g id="dlm-ribbon-3d-highlight" opacity="0" style="pointer-events:none;">
                      <path id="dlm-hi-curveS" d="${MONOGRAM_PATHS.curveS}" fill="none" stroke="url(#dlm-ribbon-bevel-light)" stroke-width="3.2" stroke-linecap="round" transform="translate(1.5, -1.5)" />
                      <path id="dlm-hi-rOuter" d="${MONOGRAM_PATHS.rOuter}" fill="none" stroke="url(#dlm-ribbon-bevel-light)" stroke-width="2.8" stroke-linecap="round" transform="translate(1.5, -1.5)" />
                      <path id="dlm-hi-nOuter" d="${MONOGRAM_PATHS.nOuter}" fill="none" stroke="url(#dlm-ribbon-bevel-light)" stroke-width="2.8" stroke-linecap="round" transform="translate(1.5, -1.5)" />
                    </g>
                  </g>
                </g>
              </g>

              <g id="dlm-04-text-jasdor" clip-path="url(#dlm-jasdor-reveal-clip)">
                <g fill="#153B66" font-family="'Outfit', 'Plus Jakarta Sans', sans-serif" font-weight="600" font-size="168">
                  <text id="dlm-letter-0" x="854" y="556" opacity="0">J</text>
                  <text id="dlm-letter-1" x="942" y="556" opacity="0">a</text>
                  <text id="dlm-letter-2" x="1037" y="556" opacity="0">s</text>
                  <text id="dlm-letter-3" x="1113" y="556" opacity="0">D</text>
                  <text id="dlm-letter-4" x="1234" y="556" opacity="0">o</text>
                  <text id="dlm-letter-5" x="1332" y="556" opacity="0">r</text>
                </g>
              </g>

              <g id="dlm-05-text-risgold" opacity="0">
                <text id="dlm-risgold-text"
                  x="862" y="644"
                  fill="#4C86C6"
                  font-family="'Outfit', 'Plus Jakarta Sans', sans-serif"
                  font-weight="400"
                  font-size="56"
                  letter-spacing="28">RISGOLD</text>
              </g>
            </svg>
          </div>
        </div>
      </div>
    `;
  }

  function open() {
    const root = document.getElementById("splash-root");
    if (!root) return;

    clearAll();
    isClosing = false;
    pathLengths = {};

    const U = window.DLM_UTIL;
    const CFG = window.DLM_CONFIG || {};
    const ICON = window.DLM_ICONS;
    const brandName = U ? U.esc(CFG.appName || "JasDor RisGold") : "JasDor RisGold";
    const skipIcon = ICON ? ICON.icon("x", "w-3.5 h-3.5", 2.4) : "✕";

    document.body.classList.add("splash-open");
    root.innerHTML = buildSplashMarkup(skipIcon, brandName);

    const svg = document.getElementById("dlm-splash-svg");
    const stageRig = document.getElementById("dlm-splash-3d-rig");
    const monogramMover = document.getElementById("dlm-monogram-mover");
    const monogramScaler = document.getElementById("dlm-monogram-scaler");
    const monogramCentered = document.getElementById("dlm-monogram-centered");
    const ribbonExtrude = document.getElementById("dlm-ribbon-3d-extrude");
    const ribbonHighlight = document.getElementById("dlm-ribbon-3d-highlight");
    const jasdorClipRect = document.getElementById("dlm-jasdor-clip-rect");
    const risgoldGroup = document.getElementById("dlm-05-text-risgold");
    const risgoldText = document.getElementById("dlm-risgold-text");
    const letters = [0, 1, 2, 3, 4, 5].map(i => document.getElementById(`dlm-letter-${i}`));

    const pathKeys = ["curveS", "rOuter", "rBowl", "rLeg", "nOuter", "nInner"];
    const paths = {};
    const extPaths = {};
    const hiPaths = {};

    pathKeys.forEach(key => {
      paths[key] = document.getElementById(`dlm-path-${key}`);
      extPaths[key] = document.getElementById(`dlm-ext-${key}`);
      hiPaths[key] = document.getElementById(`dlm-hi-${key}`);
      if (paths[key]) {
        const len = paths[key].getTotalLength();
        pathLengths[key] = len;
        [paths[key], extPaths[key], hiPaths[key]].forEach(node => {
          if (!node) return;
          node.style.strokeDasharray = `${len + 2} ${len + 2}`;
          node.style.strokeDashoffset = `${len + 2}`;
        });
      }
    });

    function applyTrim(key, progress, opacity) {
      const len = pathLengths[key] || 1;
      const offset = (len + 2) * (1 - clamp(progress, 0, 1));
      [paths[key], extPaths[key], hiPaths[key]].forEach(node => {
        if (!node) return;
        node.style.strokeDashoffset = `${offset}`;
        node.style.opacity = opacity;
      });
    }

    function renderFrame(f) {
      const s = evaluateFrameState(f);

      applyTrim("curveS", s.trimS, s.opacityS);
      applyTrim("rOuter", s.trimROuter, s.opacityR);
      applyTrim("rBowl", s.trimRBowl, s.opacityR);
      applyTrim("rLeg", s.trimRLeg, s.opacityR);
      applyTrim("nOuter", s.trimNOuter, s.opacityN);
      applyTrim("nInner", s.trimNInner, s.opacityN);

      if (monogramMover) {
        monogramMover.setAttribute("transform", `translate(${s.monogramX.toFixed(2)}, ${MONOGRAM_BASE_Y})`);
      }
      if (monogramScaler) {
        const sc = MONOGRAM_FINAL_SCALE * s.breathScale;
        monogramScaler.setAttribute("transform", `scale(${sc.toFixed(4)})`);
      }

      if (stageRig && ribbonExtrude && ribbonHighlight && monogramCentered) {
        stageRig.style.transform = Math.abs(s.rotY) > 0.01 ? `rotateY(${s.rotY.toFixed(2)}deg)` : "none";
        const exX = (-7.5 * s.depthFactor).toFixed(2);
        const exY = (3.2 * s.depthFactor).toFixed(2);
        ribbonExtrude.setAttribute("transform", `translate(${exX}, ${exY})`);
        ribbonExtrude.setAttribute("opacity", (s.depthFactor * 0.92).toFixed(3));
        ribbonHighlight.setAttribute("opacity", (s.depthFactor * 0.85).toFixed(3));
        monogramCentered.setAttribute("filter", s.depthFactor > 0.02 ? "url(#dlm-matte-ink-texture)" : "none");
      }

      if (jasdorClipRect) {
        jasdorClipRect.setAttribute("x", s.maskLeftX.toFixed(2));
      }
      s.letters.forEach((lt, idx) => {
        const node = letters[idx];
        if (!node) return;
        node.setAttribute("x", lt.x.toFixed(2));
        node.setAttribute("opacity", lt.opacity.toFixed(3));
      });

      if (risgoldGroup && risgoldText) {
        risgoldGroup.setAttribute("opacity", s.risgoldOpacity.toFixed(3));
        risgoldGroup.setAttribute("transform", `translate(0, ${s.risgoldOffsetY.toFixed(2)})`);
        risgoldText.setAttribute("letter-spacing", s.risgoldTracking.toFixed(2));
      }
    }

    resizeHandler = () => {
      if (svg) svg.setAttribute("viewBox", getResponsiveViewBox());
    };
    window.addEventListener("resize", resizeHandler, { passive: true });

    const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      renderFrame(TOTAL_FRAMES);
      holdTimer = setTimeout(close, 1200);
      return;
    }

    renderFrame(0);

    const fontWait = (document.fonts && document.fonts.ready)
      ? Promise.race([document.fonts.ready, new Promise(res => setTimeout(res, 220))])
      : Promise.resolve();

    fontWait.then(() => {
      if (isClosing || !document.getElementById("splash-overlay")) return;
      let startTs = null;

      function tick(ts) {
        if (isClosing) return;
        if (startTs === null) startTs = ts;
        const elapsedSec = (ts - startTs) / 1000;
        const currentFrame = clamp(elapsedSec * FPS, 0, TOTAL_FRAMES);
        renderFrame(currentFrame);

        if (currentFrame < TOTAL_FRAMES) {
          rafId = requestAnimationFrame(tick);
        } else {
          rafId = null;
          holdTimer = setTimeout(close, 180);
        }
      }

      rafId = requestAnimationFrame(tick);
    });
  }

  function close() {
    if (isClosing) return;
    isClosing = true;
    clearAll();

    const overlay = document.getElementById("splash-overlay");
    if (!overlay) {
      document.body.classList.remove("splash-open");
      const rootEl = document.getElementById("splash-root");
      if (rootEl) rootEl.innerHTML = "";
      return;
    }

    overlay.classList.add("is-closing");
    closeTimer = setTimeout(() => {
      const rootEl = document.getElementById("splash-root");
      if (rootEl) rootEl.innerHTML = "";
      document.body.classList.remove("splash-open");
      isClosing = false;
    }, 420);
  }

  window.DLM_SPLASH = { open, close };
})();
