// Shared gradient utilities: CSS generation, curated presets, the flowing-
// animation keyframes text, and the two Monet-style color helpers (extract
// from an image, generate from a single seed color). Loaded as a plain
// global-scope script (no bundler/module system in this codebase) by
// popup.html, options.html, and content.js (via manifest.json content_scripts
// and every dynamic re-injection call site) — must load before any of them.
window.PageDyeGradient = (function () {
  const MIN_STOPS = 2;
  const MAX_STOPS = 6;

  const GRADIENT_PRESETS = [
    { id: 'sunset', name_en: 'Sunset', name_zh: '日落', kind: 'linear', angle: 135,
      stops: [{ color: '#ff5f6d', position: 0 }, { color: '#ffc371', position: 100 }] },
    { id: 'ocean', name_en: 'Ocean', name_zh: '海洋', kind: 'linear', angle: 120,
      stops: [{ color: '#2193b0', position: 0 }, { color: '#6dd5ed', position: 100 }] },
    { id: 'aurora', name_en: 'Aurora', name_zh: '极光', kind: 'linear', angle: 160,
      stops: [{ color: '#00c9a7', position: 0 }, { color: '#4d7cfe', position: 50 }, { color: '#a06cf9', position: 100 }] },
    { id: 'candy', name_en: 'Candy Pastel', name_zh: '糖果马卡龙', kind: 'linear', angle: 100,
      stops: [{ color: '#ffafbd', position: 0 }, { color: '#ffc3a0', position: 100 }] },
    { id: 'fire', name_en: 'Fire', name_zh: '烈焰', kind: 'radial', shape: 'circle',
      stops: [{ color: '#ff0000', position: 0 }, { color: '#f9d423', position: 100 }] },
    { id: 'mint', name_en: 'Mint Cool', name_zh: '薄荷微风', kind: 'linear', angle: 135,
      stops: [{ color: '#d4fc79', position: 0 }, { color: '#96e6a1', position: 100 }] },
    { id: 'synthwave', name_en: 'Purple Haze', name_zh: '紫雾电幻', kind: 'linear', angle: 145,
      stops: [{ color: '#120136', position: 0 }, { color: '#7b2ff7', position: 55 }, { color: '#f107a3', position: 100 }] },
    { id: 'monochrome', name_en: 'Monochrome Elegance', name_zh: '黑白优雅', kind: 'linear', angle: 145,
      stops: [{ color: '#232526', position: 0 }, { color: '#414345', position: 100 }] },
    { id: 'forest', name_en: 'Forest', name_zh: '森林', kind: 'linear', angle: 135,
      stops: [{ color: '#134e13', position: 0 }, { color: '#4b9b5f', position: 100 }] },
    { id: 'cosmic', name_en: 'Cosmic Galaxy', name_zh: '宇宙星河', kind: 'radial', shape: 'ellipse',
      stops: [{ color: '#0f0c29', position: 0 }, { color: '#302b63', position: 50 }, { color: '#24243e', position: 100 }] },
    { id: 'peach', name_en: 'Peach Fuzz', name_zh: '蜜桃绒雾', kind: 'linear', angle: 110,
      stops: [{ color: '#ffecd2', position: 0 }, { color: '#fcb69f', position: 100 }] },
    { id: 'deep-sea', name_en: 'Deep Sea', name_zh: '深海', kind: 'radial', shape: 'circle',
      stops: [{ color: '#000428', position: 0 }, { color: '#004e92', position: 100 }] }
  ];

  const GRADIENT_KEYFRAMES_CSS =
    '@keyframes pagedye-gradient-flow {' +
      '0% { background-position: 0% 50%; }' +
      '50% { background-position: 100% 50%; }' +
      '100% { background-position: 0% 50%; }' +
    '}';

  function isValidCssHexColor(color) {
    return typeof color === 'string' && /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3}([0-9a-fA-F]{2})?)?$/.test(color);
  }

  function clampPos(pos) {
    const n = Number(pos);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(100, n));
  }

  // Pure, synchronous, cheap — safe to call on every keystroke/drag tick for
  // a live preview. Never throws; degenerate input resolves to 'none'.
  function buildGradientCss(gradient) {
    if (!gradient || !Array.isArray(gradient.stops) || gradient.stops.length < 2) {
      return 'none';
    }

    const stops = gradient.stops
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((s) => {
        const color = isValidCssHexColor(s.color) ? s.color : '#ffffff';
        return `${color} ${clampPos(s.position)}%`;
      })
      .join(', ');

    if (gradient.kind === 'radial') {
      const shape = gradient.shape === 'circle' ? 'circle' : 'ellipse';
      return `radial-gradient(${shape} at center, ${stops})`;
    }

    const angle = Number.isFinite(gradient.angle) ? gradient.angle : 90;
    return `linear-gradient(${angle}deg, ${stops})`;
  }

  function clampStops(stops) {
    if (!Array.isArray(stops)) return [];
    if (stops.length > MAX_STOPS) return stops.slice(0, MAX_STOPS);
    return stops;
  }

  function defaultGradient(seedColor) {
    return {
      kind: 'linear',
      angle: 90,
      shape: 'circle',
      stops: [
        { color: seedColor || '#6366f1', position: 0 },
        { color: '#ec4899', position: 100 }
      ],
      animated: false,
      speed: 10
    };
  }

  // ---- Shared color-space helpers (used by both Monet functions) ----

  function hexToRgb(hex) {
    hex = String(hex || '#ffffff').replace('#', '');
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
    const num = parseInt(hex, 16) || 0;
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s;
    const l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        default: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return [h * 360, s * 100, l * 100];
  }

  function hslToRgb(h, s, l) {
    h = ((h % 360) + 360) % 360;
    h /= 360; s = Math.max(0, Math.min(100, s)) / 100; l = Math.max(0, Math.min(100, l)) / 100;
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  function colorDistance(a, b) {
    const dr = a.r - b.r, dg = a.g - b.g, db = a.b - b.b;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }

  // Given ONE seed color, derives a harmonious multi-stop tonal palette:
  // saturation peaks near the ramp's center and eases down toward both
  // extremes (keeps darks rich instead of muddy-grey and lights vivid
  // instead of washed-out), plus a small controlled hue drift across the
  // ramp so it reads as a tonal family rather than one hue with a dimmer
  // switch. Pure, synchronous. Returns hex[] dark -> light.
  function generateTonalPalette(seedHex, count = 5) {
    const n = Math.max(3, Math.min(6, count | 0 || 5));
    const { r, g, b } = hexToRgb(seedHex);
    const [h0, s0] = rgbToHsl(r, g, b);
    const baseSaturation = Math.max(s0, 35);

    const stops = [];
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1);
      const lightness = 12 + t * 80;
      const hueShift = (t - 0.5) * 2 * 18;
      const hue = h0 + hueShift;
      const distanceFromCenter = Math.abs(t - 0.5) * 2;
      const saturationEase = 1 - Math.pow(distanceFromCenter, 2) * 0.35;
      const saturation = Math.min(96, baseSaturation * saturationEase + 10);
      const [rr, gg, bb] = hslToRgb(hue, saturation, lightness);
      stops.push(rgbToHex(rr, gg, bb));
    }
    return stops;
  }

  // Resolves the input to a loaded <img>. Accepts an already-loaded <img>
  // element or a URL/data-URL string.
  function resolveImageElement(imgElOrDataUrl) {
    if (typeof HTMLImageElement !== 'undefined' && imgElOrDataUrl instanceof HTMLImageElement) {
      if (imgElOrDataUrl.complete && imgElOrDataUrl.naturalWidth > 0) {
        return Promise.resolve(imgElOrDataUrl);
      }
      return new Promise((resolve, reject) => {
        imgElOrDataUrl.addEventListener('load', () => resolve(imgElOrDataUrl), { once: true });
        imgElOrDataUrl.addEventListener('error', () => reject(new Error('image failed to load')), { once: true });
      });
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      // Best-effort: lets extraction succeed if the remote host sends
      // permissive CORS headers. Irrelevant/inert for data: URLs. If the
      // host sends no CORS headers, the outer try/catch in
      // extractPaletteFromImage still safely resolves to ok:false either way.
      if (typeof imgElOrDataUrl === 'string' && /^https?:\/\//i.test(imgElOrDataUrl)) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('image failed to load'));
      img.src = imgElOrDataUrl;
    });
  }

  // Monet-style dominant-color extraction: downsamples onto a small
  // offscreen canvas, then a fixed-grid RGB histogram (8x8x8 buckets)
  // rather than median-cut/k-means — simpler, deterministic, single linear
  // pass, and frequency-ordering falls out for free. Never throws; resolves
  // {ok:false, reason} for a tainted (cross-origin) canvas or a failed load.
  async function extractPaletteFromImage(imgElOrDataUrl, count = 5) {
    const n = Math.max(3, Math.min(6, count | 0 || 5));

    try {
      const img = await resolveImageElement(imgElOrDataUrl);

      const SAMPLE_SIZE = 100;
      const canvas = document.createElement('canvas');
      canvas.width = SAMPLE_SIZE;
      canvas.height = SAMPLE_SIZE;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);

      // Throws SecurityError for a tainted (cross-origin, no-CORS) canvas.
      const { data } = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);

      const BUCKET_BITS = 3; // 2^3 = 8 buckets per channel
      const SHIFT = 8 - BUCKET_BITS;
      const bins = new Map();

      for (let i = 0; i < data.length; i += 4) {
        const a = data[i + 3];
        if (a < 16) continue; // skip near-fully-transparent pixels

        const r = data[i], g = data[i + 1], b = data[i + 2];
        const br = r >> SHIFT, bg = g >> SHIFT, bb = b >> SHIFT;
        const key = (br << 6) | (bg << 3) | bb;

        let bin = bins.get(key);
        if (!bin) {
          bin = { count: 0, rSum: 0, gSum: 0, bSum: 0 };
          bins.set(key, bin);
        }
        bin.count++;
        bin.rSum += r;
        bin.gSum += g;
        bin.bSum += b;
      }

      if (bins.size === 0) {
        return { ok: false, reason: 'empty-image' };
      }

      const sorted = Array.from(bins.values()).sort((a, b) => b.count - a.count);

      const picked = [];
      for (const bin of sorted) {
        if (picked.length >= n) break;
        const r = Math.round(bin.rSum / bin.count);
        const g = Math.round(bin.gSum / bin.count);
        const b = Math.round(bin.bSum / bin.count);
        const isDuplicate = picked.some((p) => colorDistance(p, { r, g, b }) < 28);
        if (!isDuplicate) picked.push({ r, g, b });
      }

      if (picked.length < n) {
        for (const bin of sorted) {
          if (picked.length >= n) break;
          const r = Math.round(bin.rSum / bin.count);
          const g = Math.round(bin.gSum / bin.count);
          const b = Math.round(bin.bSum / bin.count);
          if (!picked.some((p) => p.r === r && p.g === g && p.b === b)) {
            picked.push({ r, g, b });
          }
        }
      }

      return { ok: true, colors: picked.map((c) => rgbToHex(c.r, c.g, c.b)) };
    } catch (err) {
      const isSecurityError = err && (err.name === 'SecurityError' ||
        /tainted|cross-origin|insecure/i.test(String(err.message || '')));
      return {
        ok: false,
        reason: isSecurityError ? 'cross-origin-canvas-blocked' : 'load-failed'
      };
    }
  }

  return {
    MIN_STOPS,
    MAX_STOPS,
    GRADIENT_PRESETS,
    GRADIENT_KEYFRAMES_CSS,
    buildGradientCss,
    clampStops,
    defaultGradient,
    extractPaletteFromImage,
    generateTonalPalette
  };
})();
