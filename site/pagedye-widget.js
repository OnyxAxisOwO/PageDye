/*
 * PageDye — 官网内置版。
 *
 * 不依赖任何浏览器扩展 API 或用户脚本管理器,直接以普通 <script> 标签跑在
 * 页面里,访客免安装即可体验完整的背景编辑与实时预览。
 *
 * 渲染核心(渐变计算 / 动效动画 / 磨砂玻璃 / 滤镜拼接 / 目标元素选择器)与
 * scripts/content.js、scripts/gradient.js 共享同一套算法,直接从
 * userscript/pagedye.user.js 移植——那份文件已经证明这套引擎可以在没有
 * chrome.* API 的环境下独立运行。相对 Lite 版本改动了两处:
 *   - 存储层从 GM.* / GM_* 换成 localStorage(本来就跑在普通网页里,不需要
 *     再探测脚本管理器)。
 *   - 设置面板的界面重做,视觉上对齐 popup/popup.css 里完整扩展版的折叠区块
 *     + 分段控件 + 线性图标设计语言,而不是 Lite 那套纯功能性的平铺面板。
 * 设置 JSON 结构与 Lite、扩展版保持一致,三者的备份文件可以互相导入导出。
 */
(function () {
  'use strict';

  const VERSION = '0.6.3';
  const domain = window.location.hostname;
  const STORAGE_KEY = 'pagedye-embed:' + domain;
  const GLOBAL_KEY = 'pagedye-embed:global-ui';

  function defaultGlobalConfig() {
    return { buttonColor: '#000000', buttonSize: 50, buttonImage: '', draggable: false, edgeSnap: false, side: 'right', topPercent: 88 };
  }
  let globalConfig = null;
  let globalSaveTimer = null;
  function scheduleSaveGlobal() {
    clearTimeout(globalSaveTimer);
    globalSaveTimer = setTimeout(() => Store.set(GLOBAL_KEY, globalConfig), 400);
  }

  // --------------------------------------------------------------------
  // Storage: plain localStorage, JSON-encoded. No extension/userscript
  // manager to bridge to — this runs as a normal page script.
  // --------------------------------------------------------------------
  const Store = {
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (err) {}
    },
    get(key) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      } catch (err) { return null; }
    },
    remove(key) {
      try { localStorage.removeItem(key); } catch (err) {}
    }
  };

  // --------------------------------------------------------------------
  // Gradient utilities — ported unchanged from scripts/gradient.js.
  // --------------------------------------------------------------------
  const Gradient = (() => {
    const MIN_STOPS = 2;
    const MAX_STOPS = 6;

    const GRADIENT_PRESETS = [
      { id: 'sunset', name: '日落', kind: 'linear', angle: 135,
        stops: [{ color: '#ff5f6d', position: 0 }, { color: '#ffc371', position: 100 }] },
      { id: 'ocean', name: '海洋', kind: 'linear', angle: 120,
        stops: [{ color: '#2193b0', position: 0 }, { color: '#6dd5ed', position: 100 }] },
      { id: 'aurora', name: '极光', kind: 'linear', angle: 160,
        stops: [{ color: '#00c9a7', position: 0 }, { color: '#4d7cfe', position: 50 }, { color: '#a06cf9', position: 100 }] },
      { id: 'candy', name: '糖果马卡龙', kind: 'linear', angle: 100,
        stops: [{ color: '#ffafbd', position: 0 }, { color: '#ffc3a0', position: 100 }] },
      { id: 'fire', name: '烈焰', kind: 'radial', shape: 'circle',
        stops: [{ color: '#ff0000', position: 0 }, { color: '#f9d423', position: 100 }] },
      { id: 'mint', name: '薄荷微风', kind: 'linear', angle: 135,
        stops: [{ color: '#d4fc79', position: 0 }, { color: '#96e6a1', position: 100 }] },
      { id: 'synthwave', name: '紫雾电幻', kind: 'linear', angle: 145,
        stops: [{ color: '#120136', position: 0 }, { color: '#7b2ff7', position: 55 }, { color: '#f107a3', position: 100 }] },
      { id: 'monochrome', name: '黑白优雅', kind: 'linear', angle: 145,
        stops: [{ color: '#232526', position: 0 }, { color: '#414345', position: 100 }] },
      { id: 'forest', name: '森林', kind: 'linear', angle: 135,
        stops: [{ color: '#134e13', position: 0 }, { color: '#4b9b5f', position: 100 }] },
      { id: 'cosmic', name: '宇宙星河', kind: 'radial', shape: 'ellipse',
        stops: [{ color: '#0f0c29', position: 0 }, { color: '#302b63', position: 50 }, { color: '#24243e', position: 100 }] },
      { id: 'peach', name: '蜜桃绒雾', kind: 'linear', angle: 110,
        stops: [{ color: '#ffecd2', position: 0 }, { color: '#fcb69f', position: 100 }] },
      { id: 'deep-sea', name: '深海', kind: 'radial', shape: 'circle',
        stops: [{ color: '#000428', position: 0 }, { color: '#004e92', position: 100 }] }
    ];

    const GRADIENT_KEYFRAMES_CSS =
      '@keyframes pagedye-embed-gradient-flow {' +
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

    function buildGradientCss(gradient) {
      if (!gradient || !Array.isArray(gradient.stops) || gradient.stops.length < 2) return 'none';
      const stops = gradient.stops
        .slice()
        .sort((a, b) => a.position - b.position)
        .map((s) => `${isValidCssHexColor(s.color) ? s.color : '#ffffff'} ${clampPos(s.position)}%`)
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
      return stops.length > MAX_STOPS ? stops.slice(0, MAX_STOPS) : stops;
    }

    function defaultGradient(seedColor) {
      return {
        kind: 'linear', angle: 90, shape: 'circle',
        stops: [
          { color: seedColor || '#6366f1', position: 0 },
          { color: '#ec4899', position: 100 }
        ],
        animated: false, speed: 10
      };
    }

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
      if (max === min) { h = s = 0; }
      else {
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
      if (s === 0) { r = g = b = l; }
      else {
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

    function normalizeToStopObjects(hexColors) {
      const n = hexColors.length;
      return hexColors.map((color, i) => ({ color, position: n === 1 ? 0 : Math.round((i * 100) / (n - 1)) }));
    }

    return {
      MIN_STOPS, MAX_STOPS, GRADIENT_PRESETS, GRADIENT_KEYFRAMES_CSS,
      buildGradientCss, clampStops, defaultGradient, generateTonalPalette, normalizeToStopObjects
    };
  })();

  // --------------------------------------------------------------------
  // Settings schema (identical shape to the extension / Lite, so backup
  // JSON files are interchangeable between all three).
  // --------------------------------------------------------------------
  function emptyEditable() {
    return {
      type: 'none', colorMode: 'solid', value: '',
      opacity: 100, blur: 0,
      style: { fixed: true, size: 'cover', repeat: false },
      filters: { brightness: 100, contrast: 100, grayscale: 0, hue: 0, invert: 0 },
      gradient: Gradient.defaultGradient('#6366f1'),
      effect: 'waves', effectText: 'PageDye', effectColorScheme: 'auto', effectColor: '#ffffff', effectBgColor: '#000000', effectDensity: 50, effectSpeed: 50
    };
  }

  function defaultSettings() {
    return Object.assign(emptyEditable(), {
      mode: 'single',
      light: emptyEditable(),
      dark: emptyEditable(),
      slideshow: { interval: 'open', order: 'sequential', currentIndex: 0, lastRotationTime: 0, items: [emptyEditable()] },
      targetSelector: '',
      customCss: '',
      frostedGlass: { selector: '', blur: 12, opacity: 55 }
    });
  }

  let settings = null;

  // --------------------------------------------------------------------
  // Render engine — ported unchanged from scripts/content.js / Lite.
  // --------------------------------------------------------------------
  const ROOT_ID = 'pagedye-embed-root';
  const STYLE_ID = 'pagedye-embed-style-override';
  const TARGET_STYLE_ID = 'pagedye-embed-target-style';
  const CUSTOM_STYLE_ID = 'pagedye-embed-custom-css';
  const FROSTED_STYLE_ID = 'pagedye-embed-frosted-glass';
  let slideshowTimer = null;
  let effectCleanup = null;

  function hexToRgba(hex, alpha) {
    hex = String(hex || '#ffffff').replace('#', '');
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
    const r = parseInt(hex.slice(0, 2), 16) || 0;
    const g = parseInt(hex.slice(2, 4), 16) || 0;
    const b = parseInt(hex.slice(4, 6), 16) || 0;
    const a = (typeof alpha === 'number' && !isNaN(alpha)) ? alpha : 1;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  function buildFilterString(s) {
    const blur = s.blur || 0;
    const f = s.filters || {};
    const brightness = f.brightness !== undefined ? f.brightness : 100;
    const contrast = f.contrast !== undefined ? f.contrast : 100;
    const grayscale = f.grayscale !== undefined ? f.grayscale : 0;
    const hue = f.hue !== undefined ? f.hue : 0;
    const invert = f.invert !== undefined ? f.invert : 0;
    const parts = [];
    if (blur > 0) parts.push(`blur(${blur}px)`);
    if (brightness !== 100) parts.push(`brightness(${brightness}%)`);
    if (contrast !== 100) parts.push(`contrast(${contrast}%)`);
    if (grayscale > 0) parts.push(`grayscale(${grayscale}%)`);
    if (hue > 0) parts.push(`hue-rotate(${hue}deg)`);
    if (invert > 0) parts.push(`invert(${invert}%)`);
    return parts.length ? parts.join(' ') : 'none';
  }

  function scopeSelector(selector) {
    return selector.split(',').map((s) => s.trim()).filter(Boolean).map((s) => `:root ${s}`).join(', ');
  }

  function enforceTransparency() {
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = 'html, body { background: none !important; background-color: transparent !important; }';
      (document.head || document.documentElement).appendChild(style);
    }
  }

  function removeTargetStyle() {
    const style = document.getElementById(TARGET_STYLE_ID);
    if (style) style.remove();
  }

  function removeBackdrop() {
    stopEffect();
    const root = document.getElementById(ROOT_ID);
    if (root) root.remove();
    const style = document.getElementById(STYLE_ID);
    if (style) style.remove();
  }

  function applyCustomCss(css) {
    let style = document.getElementById(CUSTOM_STYLE_ID);
    if (!css || !css.trim()) {
      if (style) style.remove();
      return;
    }
    if (!style) {
      style = document.createElement('style');
      style.id = CUSTOM_STYLE_ID;
      (document.head || document.documentElement).appendChild(style);
    }
    style.textContent = css;
  }

  function applyFrostedGlass(cfg) {
    removeFrostedGlass();
    if (!cfg || !cfg.selector || !cfg.selector.trim()) return;
    const sel = scopeSelector(cfg.selector);
    const blur = typeof cfg.blur === 'number' ? cfg.blur : 12;
    const alpha = (typeof cfg.opacity === 'number' ? cfg.opacity : 55) / 100;
    const css =
      `${sel} {` +
        'background-image: none !important;' +
        `backdrop-filter: blur(${blur}px) !important;` +
        `-webkit-backdrop-filter: blur(${blur}px) !important;` +
      '}' +
      '@media (prefers-color-scheme: dark) {' +
        `${sel} { background-color: rgba(20, 20, 20, ${alpha}) !important; }` +
      '}' +
      '@media (prefers-color-scheme: light) {' +
        `${sel} { background-color: rgba(255, 255, 255, ${alpha}) !important; }` +
      '}';
    const style = document.createElement('style');
    style.id = FROSTED_STYLE_ID;
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  }

  function removeFrostedGlass() {
    const style = document.getElementById(FROSTED_STYLE_ID);
    if (style) style.remove();
  }

  function applyTargetBackground(selector, s) {
    removeTargetStyle();
    const sel = scopeSelector(selector);
    const isGradient = s.type === 'color' && s.colorMode === 'gradient' && s.gradient;
    let css = '';
    if (s.type === 'color' && !isGradient) {
      const alpha = (typeof s.opacity === 'number' ? s.opacity : 100) / 100;
      css = `${sel} { background-image: none !important; background-color: ${hexToRgba(s.value, alpha)} !important; }`;
    } else if (s.type === 'image' || isGradient) {
      const st = s.style || {};
      const opacity = (typeof s.opacity === 'number' ? s.opacity : 100) / 100;
      const layerPos = st.fixed
        ? 'position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important;'
        : 'position: absolute !important; inset: 0 !important;';
      let bgImageCss, filterStr, sizeCss, repeatCss, animationCss, positionCss;
      if (isGradient) {
        const gradient = s.gradient;
        bgImageCss = Gradient.buildGradientCss(gradient);
        filterStr = 'none';
        repeatCss = 'no-repeat';
        if (gradient.animated) {
          sizeCss = gradient.kind === 'radial' ? '200% 200%' : '300% 300%';
          animationCss = `pagedye-embed-gradient-flow ${gradient.speed || 10}s ease infinite`;
          positionCss = '';
        } else {
          sizeCss = 'auto';
          animationCss = 'none';
          positionCss = 'background-position: center center !important;';
        }
      } else {
        bgImageCss = `url("${s.value}")`;
        filterStr = buildFilterString(s);
        sizeCss = st.size || 'cover';
        repeatCss = st.repeat ? 'repeat' : 'no-repeat';
        animationCss = 'none';
        positionCss = 'background-position: center center !important;';
      }
      css =
        `${sel} { position: relative !important; isolation: isolate !important; background-image: none !important; background-color: transparent !important; }` +
        `${sel}::before {` +
          'content: "" !important;' + layerPos +
          'z-index: -1 !important; pointer-events: none !important;' +
          `background-image: ${bgImageCss} !important;` + positionCss +
          `background-size: ${sizeCss} !important;` +
          `background-repeat: ${repeatCss} !important;` +
          `filter: ${filterStr} !important;` +
          `opacity: ${opacity} !important;` +
          `animation: ${animationCss} !important;` +
        '}';
    }
    const style = document.createElement('style');
    style.id = TARGET_STYLE_ID;
    style.textContent = Gradient.GRADIENT_KEYFRAMES_CSS + css;
    (document.head || document.documentElement).appendChild(style);
  }

  function applyOverlay(s) {
    enforceTransparency();
    let root = document.getElementById(ROOT_ID);
    let layer, canvas;
    if (!root) {
      root = document.createElement('div');
      root.id = ROOT_ID;
      Object.assign(root.style, {
        position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
        zIndex: '-2147483648', pointerEvents: 'none', overflow: 'hidden', display: 'block'
      });
      document.documentElement.appendChild(root);
      const shadow = root.attachShadow({ mode: 'open' });
      const keyframesStyle = document.createElement('style');
      keyframesStyle.textContent = Gradient.GRADIENT_KEYFRAMES_CSS;
      shadow.appendChild(keyframesStyle);
      layer = document.createElement('div');
      layer.id = 'pagedye-embed-layer';
      shadow.appendChild(layer);
      canvas = document.createElement('canvas');
      canvas.id = 'pagedye-embed-effect-canvas';
      Object.assign(canvas.style, {
        position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
        display: 'none', transition: 'opacity 0.3s ease'
      });
      shadow.appendChild(canvas);
    } else {
      layer = root.shadowRoot.getElementById('pagedye-embed-layer');
      canvas = root.shadowRoot.getElementById('pagedye-embed-effect-canvas');
    }

    if (s.type === 'effect') {
      root.style.position = 'fixed';
      root.style.height = '100vh';
      layer.style.backgroundImage = 'none';
      layer.style.backgroundColor = 'transparent';
      const resolvedColors = resolveEffectColors(s);
      startEffect(canvas, s.effect || 'waves', s.opacity, { color: resolvedColors.color, bgColor: resolvedColors.bgColor, density: s.effectDensity, speed: s.effectSpeed, text: s.effectText });
      return;
    }

    stopEffect();
    canvas.style.display = 'none';

    const style = {
      width: '100%', height: '100%',
      transition: 'background 0.3s ease, opacity 0.3s ease',
      opacity: (s.opacity / 100).toString(), position: 'relative'
    };

    if (s.type === 'color') {
      if (s.colorMode === 'gradient' && s.gradient) {
        const gradient = s.gradient;
        style.backgroundColor = 'transparent';
        style.backgroundImage = Gradient.buildGradientCss(gradient);
        style.filter = 'none'; style.transform = 'none';
        if (gradient.animated) {
          style.backgroundSize = gradient.kind === 'radial' ? '200% 200%' : '300% 300%';
          style.animation = `pagedye-embed-gradient-flow ${gradient.speed || 10}s ease infinite`;
        } else {
          style.backgroundSize = 'auto'; style.animation = 'none';
        }
      } else {
        style.backgroundColor = s.value; style.backgroundImage = 'none';
        style.filter = 'none'; style.transform = 'none';
        style.backgroundSize = 'auto'; style.animation = 'none';
      }
    } else if (s.type === 'image') {
      style.backgroundColor = 'transparent';
      style.backgroundImage = `url("${s.value}")`;
      style.filter = buildFilterString(s);
      style.transform = (s.blur || 0) > 0 ? 'scale(1.05)' : 'none';
      style.animation = 'none';
      if (s.style) {
        style.backgroundPosition = 'center center';
        style.backgroundSize = s.style.size || 'cover';
        style.backgroundRepeat = s.style.repeat ? 'repeat' : 'no-repeat';
        if (s.style.fixed) { root.style.position = 'fixed'; root.style.height = '100vh'; }
        else { root.style.position = 'absolute'; root.style.height = '100%'; }
      }
    }
    Object.assign(layer.style, style);
  }

  const EFFECT_LIGHT_PRESET = { color: '#18181b', bgColor: '#f5f5f5' };
  const EFFECT_DARK_PRESET = { color: '#f5f5f5', bgColor: '#0a0a0a' };

  function resolveEffectColors(s) {
    const scheme = s.effectColorScheme || 'auto';
    if (scheme === 'light') return EFFECT_LIGHT_PRESET;
    if (scheme === 'dark') return EFFECT_DARK_PRESET;
    if (scheme === 'custom') return { color: s.effectColor, bgColor: s.effectBgColor };
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return isDark ? EFFECT_DARK_PRESET : EFFECT_LIGHT_PRESET;
  }

  function applyBackground(s) {
    s = s || { type: 'none' };
    if (slideshowTimer) { clearTimeout(slideshowTimer); slideshowTimer = null; }

    let active = s;
    if (s.mode === 'auto') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const sub = isDark ? s.dark : s.light;
      active = Object.assign({}, sub || { type: 'none' }, { targetSelector: s.targetSelector, customCss: s.customCss });
    } else if (s.mode === 'slideshow' && s.slideshow && s.slideshow.items && s.slideshow.items.length > 0) {
      const sh = s.slideshow;
      let index = sh.currentIndex || 0;
      if (index >= sh.items.length) index = 0;
      active = Object.assign({}, sh.items[index] || { type: 'none' }, { targetSelector: s.targetSelector, customCss: s.customCss });
      setupSlideshowTimer(s);
    }

    applyCustomCss(active.customCss);
    applyFrostedGlass(s.frostedGlass);

    const hasBackground = active.type === 'color' || active.type === 'image' || active.type === 'effect';
    const selector = active.type !== 'effect' && active.targetSelector && active.targetSelector.trim();

    if (!hasBackground) { removeBackdrop(); removeTargetStyle(); return; }

    if (selector) { removeBackdrop(); applyTargetBackground(selector, active); }
    else { removeTargetStyle(); applyOverlay(active); }
  }

  function setupSlideshowTimer(s) {
    const sh = s.slideshow;
    if (sh.interval === 'open') return;
    let intervalMs = 15 * 60 * 1000;
    if (sh.interval === '30m') intervalMs = 30 * 60 * 1000;
    if (sh.interval === '1h') intervalMs = 60 * 60 * 1000;
    if (sh.interval === '24h') intervalMs = 24 * 60 * 60 * 1000;
    const timeRemaining = Math.max(0, intervalMs - (Date.now() - (sh.lastRotationTime || 0)));
    if (timeRemaining === 0) rotateSlideshow(s);
    else slideshowTimer = setTimeout(() => rotateSlideshow(s), timeRemaining);
  }

  function rotateSlideshow(s) {
    const sh = s.slideshow;
    if (!sh || !sh.items || sh.items.length <= 1) return;
    let nextIndex = sh.currentIndex || 0;
    if (sh.order === 'random') {
      let rand = nextIndex;
      while (rand === nextIndex) rand = Math.floor(Math.random() * sh.items.length);
      nextIndex = rand;
    } else {
      nextIndex = (nextIndex + 1) % sh.items.length;
    }
    sh.currentIndex = nextIndex;
    sh.lastRotationTime = Date.now();
    Store.set(STORAGE_KEY, s);
    applyBackground(s);
  }

  function maybeCatchUpSlideshow(s) {
    if (s.mode !== 'slideshow' || !s.slideshow || !s.slideshow.items || s.slideshow.items.length <= 1) return;
    const sh = s.slideshow;
    let needRotate = false;
    if (sh.interval === 'open') needRotate = true;
    else {
      let intervalMs = 15 * 60 * 1000;
      if (sh.interval === '30m') intervalMs = 30 * 60 * 1000;
      if (sh.interval === '1h') intervalMs = 60 * 60 * 1000;
      if (sh.interval === '24h') intervalMs = 24 * 60 * 60 * 1000;
      if (Date.now() - (sh.lastRotationTime || 0) >= intervalMs) needRotate = true;
    }
    if (!needRotate) return;
    let nextIndex = sh.currentIndex || 0;
    if (sh.order === 'random') {
      let rand = nextIndex;
      while (rand === nextIndex) rand = Math.floor(Math.random() * sh.items.length);
      nextIndex = rand;
    } else {
      nextIndex = (nextIndex + 1) % sh.items.length;
    }
    sh.currentIndex = nextIndex;
    sh.lastRotationTime = Date.now();
    Store.set(STORAGE_KEY, s);
  }

  // --- Effects (animated Canvas 2D wallpapers) — ported unchanged --------
  const MATRIX_CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789';

  function normalizeEffectConfig(cfg) {
    return {
      color: (cfg && cfg.color) || '#ffffff',
      bgColor: (cfg && cfg.bgColor) || '#000000',
      density: clampPercent(cfg && cfg.density, 50),
      speed: clampPercent(cfg && cfg.speed, 50),
      text: (cfg && typeof cfg.text === 'string' && cfg.text.trim()) ? cfg.text : 'PageDye'
    };
  }
  function clampPercent(n, fallback) {
    return typeof n === 'number' && !isNaN(n) ? Math.max(0, Math.min(100, n)) : fallback;
  }
  function effectSpeedMultiplier(speed) { return 0.4 + (speed / 100) * 1.6; }
  function spawnBubble(width, height, initial) {
    return {
      x: Math.random() * width,
      y: initial ? Math.random() * height : height + Math.random() * 40,
      r: 4 + Math.random() * 14,
      rise: 15 + Math.random() * 35,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.5 + Math.random() * 1.2,
      wobbleAmp: 8 + Math.random() * 16
    };
  }
  function spawnConfetti(width, height, initial, speedMul) {
    return {
      x: Math.random() * width,
      y: initial ? Math.random() * height : -20,
      size: 6 + Math.random() * 8,
      fall: (40 + Math.random() * 60) * speedMul,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 4,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.8 + Math.random() * 1.5
    };
  }

  const EFFECT_ENGINES = {
    matrix: {
      init(cfg) { return { width: 0, height: 0, fontSize: 16, columns: [], cfg }; },
      resize(state, width, height) {
        state.width = width; state.height = height;
        state.fontSize = 26 - (state.cfg.density / 100) * 16;
        const speedMul = effectSpeedMultiplier(state.cfg.speed);
        const cols = Math.max(1, Math.floor(width / state.fontSize));
        state.columns = new Array(cols).fill(0).map(() => ({ y: Math.random() * height, speed: (60 + Math.random() * 90) * speedMul }));
      },
      draw(ctx, canvas, state, dt) {
        const { width, height, fontSize, columns, cfg } = state;
        if (!width || !height) return;
        const speedMul = effectSpeedMultiplier(cfg.speed);
        ctx.fillStyle = hexToRgba(cfg.bgColor, 0.12);
        ctx.fillRect(0, 0, width, height);
        ctx.font = `${fontSize}px monospace`;
        ctx.textBaseline = 'top';
        ctx.fillStyle = hexToRgba(cfg.color, 0.85);
        columns.forEach((col, i) => {
          const ch = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
          ctx.fillText(ch, i * fontSize, col.y);
          col.y += col.speed * (dt / 1000);
          if (col.y > height + fontSize) { col.y = -fontSize * (1 + Math.random() * 10); col.speed = (60 + Math.random() * 90) * speedMul; }
        });
      }
    },
    particles: {
      init(cfg) { return { width: 0, height: 0, particles: [], mouse: { x: -9999, y: -9999 }, cfg }; },
      resize(state, width, height) {
        state.width = width; state.height = height;
        const target = Math.round(20 + (state.cfg.density / 100) * 200);
        const count = Math.min(240, Math.max(10, target));
        const speedMul = effectSpeedMultiplier(state.cfg.speed);
        state.particles = new Array(count).fill(0).map(() => ({
          x: Math.random() * width, y: Math.random() * height,
          vx: (Math.random() - 0.5) * 24 * speedMul, vy: (Math.random() - 0.5) * 24 * speedMul
        }));
      },
      onMouseMove(state, e, canvas) {
        const rect = canvas.getBoundingClientRect();
        state.mouse.x = e.clientX - rect.left; state.mouse.y = e.clientY - rect.top;
      },
      draw(ctx, canvas, state, dt) {
        const { width, height, particles, mouse, cfg } = state;
        if (!width || !height) return;
        ctx.fillStyle = cfg.bgColor; ctx.fillRect(0, 0, width, height);
        const dtSec = dt / 1000, repelRadius = 90, speedMul = effectSpeedMultiplier(cfg.speed);
        particles.forEach((p) => {
          const dx = p.x - mouse.x, dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < repelRadius) {
            const force = (1 - dist / repelRadius) * 260 * speedMul;
            p.vx += (dx / dist) * force * dtSec; p.vy += (dy / dist) * force * dtSec;
          }
          p.x += p.vx * dtSec; p.y += p.vy * dtSec;
          p.vx *= 0.98; p.vy *= 0.98;
          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;
          p.x = Math.max(0, Math.min(width, p.x)); p.y = Math.max(0, Math.min(height, p.y));
        });
        ctx.strokeStyle = hexToRgba(cfg.color, 0.15); ctx.lineWidth = 1;
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const a = particles[i], b = particles[j];
            const dx = a.x - b.x, dy = a.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 120) {
              ctx.globalAlpha = 1 - dist / 120;
              ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            }
          }
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = cfg.color;
        particles.forEach((p) => { ctx.beginPath(); ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2); ctx.fill(); });
      }
    },
    waves: {
      init(cfg) { return { width: 0, height: 0, phase: 0, lineCount: 6, cfg }; },
      resize(state, width, height) {
        state.width = width; state.height = height;
        state.lineCount = Math.max(2, Math.round(3 + (state.cfg.density / 100) * 11));
      },
      draw(ctx, canvas, state, dt) {
        const { width, height, lineCount, cfg } = state;
        if (!width || !height) return;
        state.phase += dt * 0.0006 * effectSpeedMultiplier(cfg.speed);
        ctx.fillStyle = cfg.bgColor; ctx.fillRect(0, 0, width, height);
        for (let i = 0; i < lineCount; i++) {
          const t = i / (lineCount - 1 || 1);
          const baseY = height * (0.3 + t * 0.5);
          const amplitude = 24 + t * 40, freq = 0.006 + t * 0.002, speed = 1 + t * 0.6;
          const opacity = 0.12 + (1 - t) * 0.25;
          ctx.beginPath();
          ctx.strokeStyle = hexToRgba(cfg.color, opacity); ctx.lineWidth = 1.5;
          for (let x = 0; x <= width; x += 4) {
            const y = baseY + Math.sin(x * freq + state.phase * speed) * amplitude;
            if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }
    },
    starfield: {
      init(cfg) { return { width: 0, height: 0, stars: [], maxR: 0, cfg }; },
      resize(state, width, height) {
        state.width = width; state.height = height;
        state.maxR = Math.sqrt(width * width + height * height) / 2;
        const count = Math.min(400, Math.max(40, Math.round(40 + (state.cfg.density / 100) * 360)));
        state.stars = new Array(count).fill(0).map(() => ({ angle: Math.random() * Math.PI * 2, r: Math.random() * state.maxR }));
      },
      draw(ctx, canvas, state, dt) {
        const { width, height, stars, cfg, maxR } = state;
        if (!width || !height || !maxR) return;
        const speedMul = effectSpeedMultiplier(cfg.speed);
        const cx = width / 2, cy = height / 2, dtSec = dt / 1000;
        ctx.fillStyle = cfg.bgColor; ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = cfg.color;
        stars.forEach((s) => {
          s.r += (40 + s.r * 0.6) * speedMul * dtSec;
          if (s.r > maxR) { s.r = 0; s.angle = Math.random() * Math.PI * 2; }
          const x = cx + Math.cos(s.angle) * s.r, y = cy + Math.sin(s.angle) * s.r;
          const size = Math.max(0.6, (s.r / maxR) * 2.6);
          ctx.globalAlpha = Math.min(1, 0.3 + (s.r / maxR) * 0.9);
          ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
        });
        ctx.globalAlpha = 1;
      }
    },
    ripple: {
      init(cfg) { return { width: 0, height: 0, ripples: [], spawnTimer: 0, cfg }; },
      resize(state, width, height) { state.width = width; state.height = height; state.ripples = []; state.spawnTimer = 0; },
      draw(ctx, canvas, state, dt) {
        const { width, height, cfg } = state;
        if (!width || !height) return;
        const speedMul = effectSpeedMultiplier(cfg.speed);
        const spawnInterval = 1400 - (cfg.density / 100) * 1150;
        const maxRadius = Math.max(width, height) * 0.5;
        ctx.fillStyle = cfg.bgColor; ctx.fillRect(0, 0, width, height);
        state.spawnTimer -= dt;
        if (state.spawnTimer <= 0) {
          state.spawnTimer = spawnInterval;
          state.ripples.push({ x: Math.random() * width, y: Math.random() * height, r: 0 });
        }
        ctx.lineWidth = 1.5;
        state.ripples = state.ripples.filter((rp) => rp.r < maxRadius);
        state.ripples.forEach((rp) => {
          rp.r += 60 * speedMul * (dt / 1000);
          const alpha = Math.max(0, 1 - rp.r / maxRadius);
          ctx.strokeStyle = hexToRgba(cfg.color, alpha * 0.6);
          ctx.beginPath(); ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2); ctx.stroke();
        });
      }
    },
    aurora: {
      init(cfg) { return { width: 0, height: 0, phase: 0, bandCount: 3, cfg }; },
      resize(state, width, height) {
        state.width = width; state.height = height;
        state.bandCount = Math.max(2, Math.round(2 + (state.cfg.density / 100) * 4));
      },
      draw(ctx, canvas, state, dt) {
        const { width, height, bandCount, cfg } = state;
        if (!width || !height) return;
        state.phase += dt * 0.00035 * effectSpeedMultiplier(cfg.speed);
        ctx.fillStyle = cfg.bgColor; ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < bandCount; i++) {
          const t = i / (bandCount - 1 || 1);
          const baseY = height * (0.15 + t * 0.55), amplitude = height * (0.08 + t * 0.06);
          const freq = 0.002 + t * 0.0015, speed = 0.6 + t * 0.5, thickness = height * (0.1 + (1 - t) * 0.12);
          ctx.beginPath();
          ctx.moveTo(0, baseY);
          for (let x = 0; x <= width; x += 8) {
            const y = baseY + Math.sin(x * freq + state.phase * speed + i * 1.7) * amplitude;
            ctx.lineTo(x, y);
          }
          for (let x = width; x >= 0; x -= 8) {
            const y = baseY + thickness + Math.sin(x * freq + state.phase * speed + i * 1.7) * amplitude;
            ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fillStyle = hexToRgba(cfg.color, 0.08 + (1 - t) * 0.05);
          ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
      }
    },
    snow: {
      init(cfg) { return { width: 0, height: 0, flakes: [], cfg }; },
      resize(state, width, height) {
        state.width = width; state.height = height;
        const count = Math.min(260, Math.max(30, Math.round(30 + (state.cfg.density / 100) * 230)));
        state.flakes = new Array(count).fill(0).map(() => ({
          x: Math.random() * width, y: Math.random() * height,
          r: 1 + Math.random() * 2.5, drift: Math.random() * Math.PI * 2, fall: 20 + Math.random() * 40
        }));
      },
      draw(ctx, canvas, state, dt) {
        const { width, height, flakes, cfg } = state;
        if (!width || !height) return;
        const speedMul = effectSpeedMultiplier(cfg.speed), dtSec = dt / 1000;
        ctx.fillStyle = cfg.bgColor; ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = cfg.color;
        flakes.forEach((f) => {
          f.drift += dtSec * 1.2;
          f.y += f.fall * speedMul * dtSec;
          f.x += Math.sin(f.drift) * 12 * dtSec;
          if (f.y > height + 4) { f.y = -4; f.x = Math.random() * width; }
          if (f.x < -4) f.x = width + 4;
          if (f.x > width + 4) f.x = -4;
          ctx.globalAlpha = 0.5 + (f.r / 3.5) * 0.5;
          ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill();
        });
        ctx.globalAlpha = 1;
      }
    },
    bubbles: {
      init(cfg) { return { width: 0, height: 0, bubbles: [], cfg }; },
      resize(state, width, height) {
        state.width = width; state.height = height;
        const count = Math.min(120, Math.max(12, Math.round(12 + (state.cfg.density / 100) * 108)));
        state.bubbles = new Array(count).fill(0).map(() => spawnBubble(width, height, true));
      },
      draw(ctx, canvas, state, dt) {
        const { width, height, bubbles, cfg } = state;
        if (!width || !height) return;
        const speedMul = effectSpeedMultiplier(cfg.speed), dtSec = dt / 1000;
        ctx.fillStyle = cfg.bgColor; ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = cfg.color; ctx.lineWidth = 1.2;
        bubbles.forEach((b) => {
          b.wobble += dtSec * b.wobbleSpeed;
          b.y -= b.rise * speedMul * dtSec;
          b.x += Math.sin(b.wobble) * b.wobbleAmp * dtSec;
          if (b.y < -b.r * 2) Object.assign(b, spawnBubble(width, height, false));
          const fade = Math.min(1, (height - b.y) / height);
          ctx.globalAlpha = 0.15 + fade * 0.35;
          ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.stroke();
        });
        ctx.globalAlpha = 1;
      }
    },
    constellation: {
      init(cfg) { return { width: 0, height: 0, nodes: [], cfg }; },
      resize(state, width, height) {
        state.width = width; state.height = height;
        const count = Math.min(90, Math.max(15, Math.round(15 + (state.cfg.density / 100) * 75)));
        const speedMul = effectSpeedMultiplier(state.cfg.speed);
        state.nodes = new Array(count).fill(0).map(() => ({
          x: Math.random() * width, y: Math.random() * height,
          vx: (Math.random() - 0.5) * 8 * speedMul, vy: (Math.random() - 0.5) * 8 * speedMul,
          twinkle: Math.random() * Math.PI * 2
        }));
      },
      draw(ctx, canvas, state, dt) {
        const { width, height, nodes, cfg } = state;
        if (!width || !height) return;
        const dtSec = dt / 1000;
        ctx.fillStyle = cfg.bgColor; ctx.fillRect(0, 0, width, height);
        nodes.forEach((n) => {
          n.x += n.vx * dtSec; n.y += n.vy * dtSec; n.twinkle += dtSec * 1.5;
          if (n.x < 0 || n.x > width) n.vx *= -1;
          if (n.y < 0 || n.y > height) n.vy *= -1;
          n.x = Math.max(0, Math.min(width, n.x)); n.y = Math.max(0, Math.min(height, n.y));
        });
        const linkDist = 180;
        ctx.strokeStyle = hexToRgba(cfg.color, 0.12); ctx.lineWidth = 1;
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const a = nodes[i], b = nodes[j];
            const dx = a.x - b.x, dy = a.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < linkDist) {
              ctx.globalAlpha = 1 - dist / linkDist;
              ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            }
          }
        }
        ctx.globalAlpha = 1;
        nodes.forEach((n) => {
          const glow = 0.5 + Math.sin(n.twinkle) * 0.5;
          ctx.fillStyle = hexToRgba(cfg.color, 0.5 + glow * 0.5);
          ctx.beginPath(); ctx.arc(n.x, n.y, 1.2 + glow * 1.4, 0, Math.PI * 2); ctx.fill();
        });
      }
    },
    fireflies: {
      init(cfg) { return { width: 0, height: 0, flies: [], cfg }; },
      resize(state, width, height) {
        state.width = width; state.height = height;
        const count = Math.min(40, Math.max(6, Math.round(6 + (state.cfg.density / 100) * 34)));
        const speedMul = effectSpeedMultiplier(state.cfg.speed);
        state.flies = new Array(count).fill(0).map(() => ({
          x: Math.random() * width, y: Math.random() * height,
          angle: Math.random() * Math.PI * 2, turnSpeed: (Math.random() - 0.5) * 2,
          speed: (10 + Math.random() * 20) * speedMul, pulse: Math.random() * Math.PI * 2
        }));
      },
      draw(ctx, canvas, state, dt) {
        const { width, height, flies, cfg } = state;
        if (!width || !height) return;
        const dtSec = dt / 1000;
        ctx.fillStyle = cfg.bgColor; ctx.fillRect(0, 0, width, height);
        flies.forEach((f) => {
          f.angle += f.turnSpeed * dtSec; f.pulse += dtSec * 2;
          f.x += Math.cos(f.angle) * f.speed * dtSec;
          f.y += Math.sin(f.angle) * f.speed * dtSec;
          if (f.x < 0 || f.x > width) { f.angle = Math.PI - f.angle; f.x = Math.max(0, Math.min(width, f.x)); }
          if (f.y < 0 || f.y > height) { f.angle = -f.angle; f.y = Math.max(0, Math.min(height, f.y)); }
          const glow = 0.4 + Math.sin(f.pulse) * 0.4 + 0.2;
          ctx.save();
          ctx.shadowColor = cfg.color; ctx.shadowBlur = 12 * glow;
          ctx.fillStyle = hexToRgba(cfg.color, Math.max(0.15, glow));
          ctx.beginPath(); ctx.arc(f.x, f.y, 1.8, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        });
      }
    },
    gridpulse: {
      init(cfg) { return { width: 0, height: 0, cell: 40, phase: 0, cfg }; },
      resize(state, width, height) {
        state.width = width; state.height = height;
        state.cell = Math.max(16, 70 - (state.cfg.density / 100) * 50);
      },
      draw(ctx, canvas, state, dt) {
        const { width, height, cell, cfg } = state;
        if (!width || !height) return;
        state.phase += dt * 0.0004 * effectSpeedMultiplier(cfg.speed);
        ctx.fillStyle = cfg.bgColor; ctx.fillRect(0, 0, width, height);
        const cycle = state.phase % 1;
        const waveX = cycle * (width + cell * 6) - cell * 3;
        const waveY = cycle * (height + cell * 6) - cell * 3;
        const waveWidth = cell * 3;
        ctx.lineWidth = 1;
        for (let x = 0; x <= width; x += cell) {
          const d = Math.abs(x - waveX);
          const alpha = 0.06 + Math.max(0, 1 - d / waveWidth) * 0.55;
          ctx.strokeStyle = hexToRgba(cfg.color, alpha);
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
        }
        for (let y = 0; y <= height; y += cell) {
          const d = Math.abs(y - waveY);
          const alpha = 0.06 + Math.max(0, 1 - d / waveWidth) * 0.55;
          ctx.strokeStyle = hexToRgba(cfg.color, alpha);
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
        }
      }
    },
    rain: {
      init(cfg) { return { width: 0, height: 0, drops: [], cfg }; },
      resize(state, width, height) {
        state.width = width; state.height = height;
        const count = Math.min(300, Math.max(40, Math.round(40 + (state.cfg.density / 100) * 260)));
        const speedMul = effectSpeedMultiplier(state.cfg.speed);
        state.drops = new Array(count).fill(0).map(() => ({
          x: Math.random() * width, y: Math.random() * height,
          len: 10 + Math.random() * 20, speed: (300 + Math.random() * 300) * speedMul
        }));
      },
      draw(ctx, canvas, state, dt) {
        const { width, height, drops, cfg } = state;
        if (!width || !height) return;
        const dtSec = dt / 1000;
        ctx.fillStyle = hexToRgba(cfg.bgColor, 0.25); ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = hexToRgba(cfg.color, 0.5); ctx.lineWidth = 1;
        drops.forEach((d) => {
          d.y += d.speed * dtSec;
          ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x, d.y + d.len); ctx.stroke();
          if (d.y > height) { d.y = -d.len - Math.random() * 100; d.x = Math.random() * width; }
        });
      }
    },
    confetti: {
      init(cfg) { return { width: 0, height: 0, pieces: [], cfg }; },
      resize(state, width, height) {
        state.width = width; state.height = height;
        const count = Math.min(200, Math.max(20, Math.round(20 + (state.cfg.density / 100) * 180)));
        const speedMul = effectSpeedMultiplier(state.cfg.speed);
        state.pieces = new Array(count).fill(0).map(() => spawnConfetti(width, height, true, speedMul));
      },
      draw(ctx, canvas, state, dt) {
        const { width, height, pieces, cfg } = state;
        if (!width || !height) return;
        const speedMul = effectSpeedMultiplier(cfg.speed), dtSec = dt / 1000;
        ctx.fillStyle = cfg.bgColor; ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = cfg.color;
        pieces.forEach((p) => {
          p.y += p.fall * dtSec;
          p.wobble += dtSec * p.wobbleSpeed;
          p.x += Math.sin(p.wobble) * 40 * dtSec;
          p.rot += p.rotSpeed * dtSec;
          if (p.y > height + 20) Object.assign(p, spawnConfetti(width, height, false, speedMul));
          ctx.save();
          ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.globalAlpha = 0.85;
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          ctx.restore();
        });
        ctx.globalAlpha = 1;
      }
    },
    plasma: {
      init(cfg) { return { width: 0, height: 0, blobs: [], phase: 0, cfg }; },
      resize(state, width, height) {
        state.width = width; state.height = height;
        const count = Math.max(2, Math.round(2 + (state.cfg.density / 100) * 5));
        state.blobs = new Array(count).fill(0).map(() => ({
          freqX: 0.15 + Math.random() * 0.25, freqY: 0.15 + Math.random() * 0.25,
          phaseX: Math.random() * Math.PI * 2, phaseY: Math.random() * Math.PI * 2,
          radius: Math.min(width, height) * (0.18 + Math.random() * 0.12)
        }));
      },
      draw(ctx, canvas, state, dt) {
        const { width, height, blobs, cfg } = state;
        if (!width || !height) return;
        state.phase += dt * 0.0005 * effectSpeedMultiplier(cfg.speed);
        ctx.fillStyle = cfg.bgColor; ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = 'lighter';
        blobs.forEach((b) => {
          const cx = width / 2 + Math.sin(state.phase * b.freqX + b.phaseX) * width * 0.32;
          const cy = height / 2 + Math.cos(state.phase * b.freqY + b.phaseY) * height * 0.32;
          const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, b.radius);
          grad.addColorStop(0, hexToRgba(cfg.color, 0.35));
          grad.addColorStop(1, hexToRgba(cfg.color, 0));
          ctx.fillStyle = grad;
          ctx.beginPath(); ctx.arc(cx, cy, b.radius, 0, Math.PI * 2); ctx.fill();
        });
        ctx.globalCompositeOperation = 'source-over';
      }
    },
    vortex: {
      init(cfg) { return { width: 0, height: 0, particles: [], cfg }; },
      resize(state, width, height) {
        state.width = width; state.height = height;
        const count = Math.min(260, Math.max(30, Math.round(30 + (state.cfg.density / 100) * 230)));
        state.particles = new Array(count).fill(0).map(() => ({
          angle: Math.random() * Math.PI * 2,
          r: Math.random() * Math.max(width, height) * 0.5,
          spin: (0.4 + Math.random() * 0.8) * (Math.random() < 0.5 ? -1 : 1)
        }));
      },
      draw(ctx, canvas, state, dt) {
        const { width, height, particles, cfg } = state;
        if (!width || !height) return;
        const speedMul = effectSpeedMultiplier(cfg.speed), dtSec = dt / 1000;
        const cx = width / 2, cy = height / 2;
        const maxR = Math.max(width, height) * 0.55;
        ctx.fillStyle = cfg.bgColor; ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = cfg.color;
        particles.forEach((p) => {
          p.angle += p.spin * speedMul * dtSec;
          p.r -= (20 + p.r * 0.15) * speedMul * dtSec;
          if (p.r < 4) { p.r = maxR; p.angle = Math.random() * Math.PI * 2; }
          const x = cx + Math.cos(p.angle) * p.r, y = cy + Math.sin(p.angle) * p.r;
          const size = Math.max(0.6, (1 - p.r / maxR) * 2.6 + 0.5);
          ctx.globalAlpha = Math.min(1, 0.25 + (1 - p.r / maxR) * 0.8);
          ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
        });
        ctx.globalAlpha = 1;
      }
    },
    typewriter: {
      init(cfg) {
        return { width: 0, height: 0, fontSize: 32, charIndex: 0, phase: 'typing', timer: 0, cursorOn: true, cursorTimer: 0, cfg };
      },
      resize(state, width, height) {
        state.width = width; state.height = height;
        state.fontSize = 20 + (state.cfg.density / 100) * 52;
      },
      draw(ctx, canvas, state, dt) {
        const { width, height, cfg } = state;
        if (!width || !height) return;
        const text = cfg.text;
        const speedMul = effectSpeedMultiplier(cfg.speed);
        const charInterval = 160 / speedMul;
        const holdDuration = 1400;
        ctx.fillStyle = cfg.bgColor; ctx.fillRect(0, 0, width, height);
        state.timer += dt;
        if (state.phase === 'typing') {
          if (state.timer >= charInterval) {
            state.timer = 0;
            state.charIndex = Math.min(text.length, state.charIndex + 1);
            if (state.charIndex >= text.length) { state.phase = 'hold'; state.timer = 0; }
          }
        } else if (state.phase === 'hold') {
          if (state.timer >= holdDuration) { state.phase = 'erasing'; state.timer = 0; }
        } else if (state.phase === 'erasing') {
          if (state.timer >= charInterval / 1.6) {
            state.timer = 0;
            state.charIndex = Math.max(0, state.charIndex - 1);
            if (state.charIndex <= 0) { state.phase = 'pauseEmpty'; state.timer = 0; }
          }
        } else if (state.phase === 'pauseEmpty') {
          if (state.timer >= 500) { state.phase = 'typing'; state.timer = 0; }
        }
        state.cursorTimer += dt;
        if (state.cursorTimer >= 500) { state.cursorTimer = 0; state.cursorOn = !state.cursorOn; }
        ctx.font = `${state.fontSize}px monospace`;
        ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
        ctx.fillStyle = cfg.color;
        const shown = text.slice(0, state.charIndex);
        ctx.fillText(shown + (state.cursorOn ? '|' : ''), width / 2, height / 2);
      }
    }
  };

  function startEffect(canvas, kind, opacityPct, effectConfig) {
    stopEffect();
    canvas.style.display = 'block';
    canvas.style.opacity = ((typeof opacityPct === 'number' ? opacityPct : 100) / 100).toString();
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const engine = EFFECT_ENGINES[kind] || EFFECT_ENGINES.waves;
    const state = engine.init(normalizeEffectConfig(effectConfig));

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      canvas.width = width * dpr; canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      engine.resize(state, width, height);
      engine.draw(ctx, canvas, state, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    let mouseHandler = null;
    if (engine.onMouseMove) {
      mouseHandler = (e) => engine.onMouseMove(state, e, canvas);
      window.addEventListener('mousemove', mouseHandler);
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frameId = null;
    if (!reduceMotion) {
      let last = null;
      const loop = (t) => {
        frameId = requestAnimationFrame(loop);
        if (document.hidden) return;
        const dt = last === null ? 16 : Math.min(t - last, 100);
        last = t;
        engine.draw(ctx, canvas, state, dt);
      };
      frameId = requestAnimationFrame(loop);
    }

    effectCleanup = () => {
      if (frameId) cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
      if (mouseHandler) window.removeEventListener('mousemove', mouseHandler);
    };
  }

  function stopEffect() {
    if (effectCleanup) { effectCleanup(); effectCleanup = null; }
  }

  // --------------------------------------------------------------------
  // Element picker — ported unchanged.
  // --------------------------------------------------------------------
  function cssEscape(s) {
    if (window.CSS && CSS.escape) return CSS.escape(s);
    return String(s).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
  }

  function getSelectorFor(el) {
    if (!el || el.nodeType !== 1) return '';
    if (el.id) return '#' + cssEscape(el.id);
    const parts = [];
    let node = el;
    while (node && node.nodeType === 1 && node.tagName.toLowerCase() !== 'html') {
      if (node.id) { parts.unshift('#' + cssEscape(node.id)); break; }
      let part = node.tagName.toLowerCase();
      const classes = Array.from(node.classList).filter((c) => c && !c.startsWith('pagedye'));
      if (classes.length) part += '.' + classes.slice(0, 3).map(cssEscape).join('.');
      else if (node.parentElement) {
        const sameTag = Array.from(node.parentElement.children).filter((c) => c.tagName === node.tagName);
        if (sameTag.length > 1) part += ':nth-of-type(' + (sameTag.indexOf(node) + 1) + ')';
      }
      parts.unshift(part);
      if (node.tagName.toLowerCase() === 'body') break;
      node = node.parentElement;
      if (parts.length >= 6) break;
    }
    return parts.join(' > ');
  }

  function startPicker(onPicked) {
    if (window.__pagedyeEmbedPicking) return;
    window.__pagedyeEmbedPicking = true;
    setPanelVisible(false);

    const box = document.createElement('div');
    Object.assign(box.style, {
      position: 'fixed', zIndex: '2147483647', pointerEvents: 'none',
      border: '2px solid #fff', background: 'rgba(255,255,255,0.25)',
      boxSizing: 'border-box', borderRadius: '2px', display: 'none', top: '0', left: '0'
    });
    const label = document.createElement('div');
    Object.assign(label.style, {
      position: 'fixed', zIndex: '2147483647', pointerEvents: 'none',
      background: '#111827', color: '#fff',
      font: '12px/1.4 ui-monospace, Menlo, Consolas, monospace',
      padding: '4px 8px', borderRadius: '4px', maxWidth: '60vw',
      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)', display: 'none'
    });
    const tip = document.createElement('div');
    tip.textContent = 'PageDye:点击一个元素应用背景 · Esc 取消';
    Object.assign(tip.style, {
      position: 'fixed', zIndex: '2147483647', pointerEvents: 'none',
      top: '12px', left: '50%', transform: 'translateX(-50%)',
      background: '#000', color: '#fff',
      font: '13px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      padding: '6px 14px', borderRadius: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
    });
    document.documentElement.appendChild(box);
    document.documentElement.appendChild(label);
    document.documentElement.appendChild(tip);

    let current = null;

    function onMove(e) {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el || el === box || el === label || el === tip) return;
      current = el;
      const r = el.getBoundingClientRect();
      Object.assign(box.style, { display: 'block', left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
      label.textContent = getSelectorFor(el);
      label.style.display = 'block';
      label.style.left = Math.min(e.clientX + 14, window.innerWidth - 220) + 'px';
      label.style.top = (e.clientY + 18) + 'px';
    }
    function cleanup() {
      document.removeEventListener('mousemove', onMove, true);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onKey, true);
      box.remove(); label.remove(); tip.remove();
      window.__pagedyeEmbedPicking = false;
      setPanelVisible(true);
    }
    function onClick(e) {
      e.preventDefault(); e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      const el = current || document.elementFromPoint(e.clientX, e.clientY);
      const selector = getSelectorFor(el);
      cleanup();
      onPicked(selector);
    }
    function onKey(e) { if (e.key === 'Escape') { e.preventDefault(); cleanup(); } }

    document.addEventListener('mousemove', onMove, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKey, true);
  }

  // --------------------------------------------------------------------
  // Icons — inline Feather-style SVGs, matching the outline icon set
  // used by popup/popup.html (stroke=currentColor, round joins).
  // --------------------------------------------------------------------
  function svgIcon(paths, size) {
    size = size || 14;
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
  }
  const ICON = {
    gear: '<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>',
    close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    chevron: '<polyline points="6 9 12 15 18 9"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
    target: '<circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/>',
    trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    droplet: '<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    refresh: '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
    xCircle: '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
    layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>'
  };

  // --------------------------------------------------------------------
  // Settings panel UI — floating button + slide-up panel, built once
  // inside its own shadow root (isolated from the host page's CSS).
  // Visually rebuilt to match popup/popup.css's design language:
  // accordion sections with rotating chevrons, pill segmented controls
  // and outline icons instead of Lite's flat tabs / emoji.
  // --------------------------------------------------------------------
  let saveTimer = null;
  let panelHost = null, shadow = null, panelEl = null, gearEl = null;
  const ui = {
    open: false, tab: 'wallpaper', scheme: 'light', slideIndex: 0,
    accordions: { mode: true, bg: true, target: false, frosted: true, buttonAppearance: true, movement: false, backup: false }
  };

  function getEditable() {
    if (settings.mode === 'auto') return settings[ui.scheme];
    if (settings.mode === 'slideshow') {
      if (!settings.slideshow.items[ui.slideIndex]) ui.slideIndex = 0;
      return settings.slideshow.items[ui.slideIndex] || (settings.slideshow.items[0] = emptyEditable());
    }
    return settings;
  }

  function setPath(obj, path, value) {
    const parts = path.split('.');
    let o = obj;
    for (let i = 0; i < parts.length - 1; i++) o = o[parts[i]];
    o[parts[parts.length - 1]] = value;
  }

  function setPanelVisible(visible) {
    if (panelHost) panelHost.style.display = visible ? 'block' : 'none';
  }

  function scheduleSave() {
    setStatus('保存中…');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(persist, 400);
  }
  function persist() {
    settings.timestamp = Date.now();
    Store.set(STORAGE_KEY, settings);
    setStatus('已同步');
  }
  function setStatus(text) {
    const el = shadow && shadow.getElementById('pd-status');
    if (el) el.textContent = text;
  }
  function liveApply() { applyBackground(settings); }

  function resetCurrentSite() {
    clearTimeout(saveTimer);
    Store.remove(STORAGE_KEY);
    settings = defaultSettings();
    ui.tab = 'wallpaper'; ui.scheme = 'light'; ui.slideIndex = 0;
    liveApply();
    renderPanel();
    setStatus('已重置');
  }

  function exportSettings() {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pagedye-${domain}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function importSettings() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          if (parsed && typeof parsed === 'object') {
            settings = Object.assign(defaultSettings(), parsed);
            liveApply();
            scheduleSave();
            renderPanel();
            setStatus('已导入');
          }
        } catch (err) {
          setStatus('导入失败:JSON 格式错误');
        }
      };
      reader.readAsText(file);
    });
    input.click();
  }

  function rangeRow(label, path, min, max, value, suffix, opts) {
    opts = opts || {};
    return `<div class="pd-row">
      <div class="pd-row-head"><span>${label}</span><span class="pd-val-badge" data-echo="${path}">${value}${suffix || ''}</span></div>
      <input type="range" min="${min}" max="${max}" value="${value}" data-path="${path}" data-scope="${opts.scope || 'edit'}"
        data-numeric="1" data-suffix="${suffix || ''}" />
    </div>`;
  }
  function textRow(label, path, value, placeholder, opts) {
    opts = opts || {};
    return `<div class="pd-row">
      <div class="pd-row-head"><span>${label}</span></div>
      <input type="text" value="${escapeAttr(value || '')}" placeholder="${placeholder || ''}" data-path="${path}" data-scope="${opts.scope || 'edit'}" />
    </div>`;
  }
  function colorRow(label, path, value, opts) {
    opts = opts || {};
    return `<div class="pd-row pd-row-inline">
      <span>${label}</span>
      <input type="color" value="${value || '#ffffff'}" data-path="${path}" data-scope="${opts.scope || 'edit'}" />
    </div>`;
  }
  function checkboxRow(label, path, checked, opts) {
    opts = opts || {};
    return `<label class="pd-row pd-row-inline">
      <span>${label}</span>
      <input type="checkbox" ${checked ? 'checked' : ''} data-path="${path}" data-scope="${opts.scope || 'edit'}" ${opts.structural ? 'data-structural="1"' : ''} />
    </label>`;
  }
  function selectRow(label, path, options, value, opts) {
    opts = opts || {};
    const optionsHtml = options.map(([v, l]) => `<option value="${v}" ${v === value ? 'selected' : ''}>${l}</option>`).join('');
    return `<div class="pd-row">
      <div class="pd-row-head"><span>${label}</span></div>
      <select data-path="${path}" data-scope="${opts.scope || 'edit'}" data-structural="${opts.structural === false ? '' : '1'}">${optionsHtml}</select>
    </div>`;
  }
  function escapeAttr(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

  function accordion(id, title, bodyHtml, opts) {
    opts = opts || {};
    const open = ui.accordions[id] !== false;
    const badge = opts.badge ? `<span class="pd-acc-badge">${opts.badge}</span>` : '';
    return `<details class="pd-accordion" data-acc-id="${id}" ${open ? 'open' : ''}>
      <summary class="pd-accordion-summary">
        <span class="pd-acc-title">${title}</span>
        ${badge}
        <span class="pd-chevron">${svgIcon(ICON.chevron)}</span>
      </summary>
      <div class="pd-accordion-content">${bodyHtml}</div>
    </details>`;
  }

  function renderGradientEditor(e) {
    const g = e.gradient;
    const presetsHtml = Gradient.GRADIENT_PRESETS.map((p, i) =>
      `<div class="pd-swatch" data-action="gradient-preset" data-index="${i}" title="${p.name}" style="background:${Gradient.buildGradientCss(p)}"></div>`
    ).join('');
    const stopsHtml = g.stops.map((s, i) => `
      <div class="pd-stop-row">
        <input type="color" value="${s.color}" data-path="gradient.stops.${i}.color" data-scope="edit" />
        <input type="number" min="0" max="100" value="${s.position}" data-path="gradient.stops.${i}.position" data-scope="edit" data-numeric="1" style="width:52px" />
        ${g.stops.length > 2 ? `<button data-action="remove-stop" data-index="${i}" title="删除色标">${svgIcon(ICON.trash, 13)}</button>` : ''}
      </div>`).join('');

    return `
      <div class="pd-subhead">渐变预设</div>
      <div class="pd-swatch-grid">${presetsHtml}</div>
      <button class="pd-btn-secondary" data-action="gradient-generate">${svgIcon(ICON.droplet, 14)}<span>从主色生成色阶</span></button>
      ${selectRow('类型', 'gradient.kind', [['linear', '线性'], ['radial', '放射']], g.kind, { structural: true })}
      ${g.kind === 'radial'
        ? selectRow('形状', 'gradient.shape', [['circle', '圆形'], ['ellipse', '椭圆']], g.shape || 'circle', { structural: true })
        : rangeRow('角度', 'gradient.angle', 0, 360, g.angle || 90, '°')}
      <div class="pd-subhead">色标(${g.stops.length}/${Gradient.MAX_STOPS})</div>
      <div class="pd-stops">${stopsHtml}</div>
      ${g.stops.length < Gradient.MAX_STOPS ? `<button class="pd-btn-secondary" data-action="add-stop">${svgIcon(ICON.plus, 14)}<span>添加色标</span></button>` : ''}
      ${checkboxRow('动态流动', 'gradient.animated', !!g.animated, { structural: true })}
      ${g.animated ? rangeRow('流动速度', 'gradient.speed', 2, 30, g.speed || 10, 's') : ''}
    `;
  }

  function renderEditableSection(e) {
    let body = '';
    body += selectRow('类型', 'type', [['none', '无'], ['color', '纯色/渐变'], ['image', '图片'], ['effect', '动效']], e.type, { structural: true });

    if (e.type === 'color') {
      body += checkboxRow('使用渐变', 'colorMode', e.colorMode === 'gradient', { structural: true })
        .replace('data-path="colorMode"', `data-path="colorMode" data-truthy="gradient" data-falsy="solid"`);
      if (e.colorMode === 'gradient') body += renderGradientEditor(e);
      else body += colorRow('颜色', 'value', e.value || '#ffffff');
      body += rangeRow('不透明度', 'opacity', 0, 100, e.opacity, '%');
    } else if (e.type === 'image') {
      body += textRow('图片 URL', 'value', e.value && e.value.startsWith('http') ? e.value : '', 'https://...');
      body += `<div class="pd-file-drop">
        <input type="file" accept="image/*" data-file="1" />
        ${svgIcon(ICON.upload, 22)}
        <p>拖拽图片到此处,或点击选择文件</p>
      </div>`;
      if (e.value) body += `<button class="pd-btn-secondary" data-action="clear-image">${svgIcon(ICON.xCircle, 14)}<span>删除当前图片</span></button>`;
      body += selectRow('尺寸', 'style.size', [['cover', '铺满(cover)'], ['contain', '完整显示(contain)'], ['auto', '原始大小']], (e.style && e.style.size) || 'cover');
      body += checkboxRow('平铺重复', 'style.repeat', !!(e.style && e.style.repeat));
      body += checkboxRow('固定不随页面滚动', 'style.fixed', !!(e.style && e.style.fixed));
      body += rangeRow('不透明度', 'opacity', 0, 100, e.opacity, '%');
      body += rangeRow('模糊', 'blur', 0, 30, e.blur || 0, 'px');
      body += `<div class="pd-subhead">滤镜</div>`;
      const f = e.filters || {};
      body += rangeRow('亮度', 'filters.brightness', 0, 200, f.brightness !== undefined ? f.brightness : 100, '%');
      body += rangeRow('对比度', 'filters.contrast', 0, 200, f.contrast !== undefined ? f.contrast : 100, '%');
      body += rangeRow('灰度', 'filters.grayscale', 0, 100, f.grayscale || 0, '%');
      body += rangeRow('色相旋转', 'filters.hue', 0, 360, f.hue || 0, '°');
      body += rangeRow('反色', 'filters.invert', 0, 100, f.invert || 0, '%');
    } else if (e.type === 'effect') {
      body += selectRow('效果', 'effect', [
        ['matrix', '数字雨 Matrix'], ['particles', '粒子 Particles'], ['waves', '波浪 Waves'],
        ['starfield', '星空 Starfield'], ['ripple', '涟漪 Ripple'], ['aurora', '极光 Aurora'],
        ['snow', '雪花 Snow'], ['bubbles', '气泡 Bubbles'], ['constellation', '星座 Constellation'],
        ['fireflies', '萤火虫 Fireflies'], ['gridpulse', '网格脉冲 Grid Pulse'], ['rain', '雨丝 Rain'],
        ['confetti', '彩纸 Confetti'], ['plasma', '流光 Plasma'], ['vortex', '漩涡 Vortex'],
        ['typewriter', '打字机 Typewriter']
      ], e.effect || 'waves');
      if (e.effect === 'typewriter') {
        body += textRow('文字内容', 'effectText', e.effectText || 'PageDye', 'PageDye');
      }
      body += selectRow('颜色预置', 'effectColorScheme', [
        ['auto', '自动'], ['light', '浅色'], ['dark', '深色'], ['custom', '自定义']
      ], e.effectColorScheme || 'auto');
      if ((e.effectColorScheme || 'auto') === 'custom') {
        body += colorRow('颜色', 'effectColor', e.effectColor || '#ffffff');
        body += colorRow('背景颜色', 'effectBgColor', e.effectBgColor || '#000000');
      }
      body += rangeRow('密度', 'effectDensity', 0, 100, e.effectDensity != null ? e.effectDensity : 50, '%');
      body += rangeRow('速度', 'effectSpeed', 0, 100, e.effectSpeed != null ? e.effectSpeed : 50, '%');
      body += rangeRow('不透明度', 'opacity', 0, 100, e.opacity, '%');
    }
    return body;
  }

  const MODE_LABEL = { single: '单一', auto: '昼夜自动', slideshow: '幻灯轮播' };

  function renderModeControls() {
    let html = `<div class="pd-seg">
      <button class="${settings.mode === 'single' ? 'active' : ''}" data-action="set-mode" data-value="single">单一</button>
      <button class="${settings.mode === 'auto' ? 'active' : ''}" data-action="set-mode" data-value="auto">昼夜自动</button>
      <button class="${settings.mode === 'slideshow' ? 'active' : ''}" data-action="set-mode" data-value="slideshow">幻灯轮播</button>
    </div>`;

    if (settings.mode === 'auto') {
      html += `<div class="pd-scheme-switch">
        <button class="${ui.scheme === 'light' ? 'active' : ''}" data-action="set-scheme" data-value="light">${svgIcon(ICON.sun, 14)}<span>浅色</span></button>
        <button class="${ui.scheme === 'dark' ? 'active' : ''}" data-action="set-scheme" data-value="dark">${svgIcon(ICON.moon, 14)}<span>深色</span></button>
      </div>`;
    }

    if (settings.mode === 'slideshow') {
      const sh = settings.slideshow;
      const itemsHtml = sh.items.map((item, i) => `
        <button class="pd-slide-item ${i === ui.slideIndex ? 'active' : ''}" data-action="select-slide" data-index="${i}">
          #${i + 1} ${item.type === 'none' ? '空' : item.type}
        </button>`).join('');
      html += `<div class="pd-slides">${itemsHtml}
        <button class="pd-slide-item" data-action="add-slide">${svgIcon(ICON.plus, 12)} 新增</button>
      </div>`;
      if (sh.items.length > 1) {
        html += `<button class="pd-btn-secondary" data-action="remove-slide" data-index="${ui.slideIndex}">${svgIcon(ICON.trash, 14)}<span>删除当前这一帧</span></button>`;
      }
      html += selectRow('轮播间隔', 'interval', [
        ['open', '每次打开页面'], ['15m', '每 15 分钟'], ['30m', '每 30 分钟'], ['1h', '每 1 小时'], ['24h', '每 24 小时']
      ], sh.interval, { scope: 'slideshow', structural: false });
      html += checkboxRow('随机顺序', 'order', sh.order === 'random', { scope: 'slideshow' })
        .replace('data-path="order"', 'data-path="order" data-truthy="random" data-falsy="sequential"');
    }

    return html;
  }

  function renderAdvancedSection() {
    const g = globalConfig;
    let appearance = '';
    appearance += colorRow('按钮颜色', 'buttonColor', g.buttonColor, { scope: 'global' });
    appearance += rangeRow('按钮大小', 'buttonSize', 36, 72, g.buttonSize, 'px', { scope: 'global' });
    appearance += `<div class="pd-file-drop pd-file-drop-compact">
      <input type="file" accept="image/*" data-file="button-image" />
      ${svgIcon(ICON.image, 18)}
      <p>自定义图标图片</p>
    </div>`;
    if (g.buttonImage) appearance += `<button class="pd-btn-secondary" data-action="clear-button-image">${svgIcon(ICON.xCircle, 14)}<span>清除自定义图标</span></button>`;

    let movement = '';
    movement += checkboxRow('允许拖动移动按钮位置', 'draggable', !!g.draggable, { scope: 'global' });
    movement += `<div class="pd-hint">开启后可以直接拖动悬浮按钮,松手会自动吸附到屏幕左侧或右侧最近的边。</div>`;
    movement += checkboxRow('贴边隐藏(像悬浮球一样)', 'edgeSnap', !!g.edgeSnap, { scope: 'global', structural: true });
    movement += `<div class="pd-hint">开启后,面板关闭且按钮静止 ${Math.round(HIDE_DELAY_MS / 1000)} 秒会自动滑出屏幕边缘只留一条边,轻触即可弹回并展开面板。和"允许拖动"是两个独立开关。</div>`;

    let backup = '';
    backup += `<div class="pd-footer-btns">
      <button data-action="export">${svgIcon(ICON.download, 14)}<span>导出</span></button>
      <button data-action="import">${svgIcon(ICON.upload, 14)}<span>导入</span></button>
      <button data-action="reset" class="pd-danger">${svgIcon(ICON.refresh, 14)}<span>重置</span></button>
    </div>`;

    let html = '';
    html += accordion('buttonAppearance', '悬浮按钮外观', appearance);
    html += accordion('movement', '移动与贴边隐藏', movement);
    html += accordion('backup', '备份(当前网站)', backup);
    html += `<div class="pd-hint pd-version">PageDye 体验版 v${VERSION} · ${domain}</div>`;
    return html;
  }

  function renderPanel() {
    if (!shadow) return;
    const body = shadow.getElementById('pd-body');
    if (!body) return;

    let html = `<div class="pd-seg pd-seg-main">
      <button class="${ui.tab === 'wallpaper' ? 'active' : ''}" data-action="set-tab" data-value="wallpaper">${svgIcon(ICON.layers, 13)}<span>壁纸</span></button>
      <button class="${ui.tab === 'frosted' ? 'active' : ''}" data-action="set-tab" data-value="frosted">磨砂玻璃</button>
      <button class="${ui.tab === 'advanced' ? 'active' : ''}" data-action="set-tab" data-value="advanced">高级设置</button>
    </div>`;

    if (ui.tab === 'wallpaper') {
      html += accordion('mode', '模式与轮播', renderModeControls(), { badge: MODE_LABEL[settings.mode] });
      html += accordion('bg', '背景设置', renderEditableSection(getEditable()));
      const targetBody =
        textRow('CSS 选择器', 'targetSelector', settings.targetSelector, '留空 = 整页背景', { scope: 'root' }) +
        `<button class="pd-btn-secondary" data-action="pick-target">${svgIcon(ICON.target, 14)}<span>拾取页面元素</span></button>` +
        `<div class="pd-subhead">自定义 CSS</div>` +
        `<textarea data-path="customCss" data-scope="root" placeholder="/* 任意 CSS,注入到当前网站 */">${escapeAttr(settings.customCss || '')}</textarea>`;
      html += accordion('target', '目标元素与自定义 CSS(可选)', targetBody);
    } else if (ui.tab === 'frosted') {
      const frostedBody =
        textRow('CSS 选择器', 'frostedGlass.selector', settings.frostedGlass.selector, '例如 .card, main', { scope: 'root' }) +
        `<button class="pd-btn-secondary" data-action="pick-frosted">${svgIcon(ICON.target, 14)}<span>拾取页面元素</span></button>` +
        rangeRow('模糊强度', 'frostedGlass.blur', 0, 30, settings.frostedGlass.blur, 'px', { scope: 'root' }) +
        rangeRow('底色不透明度', 'frostedGlass.opacity', 0, 100, settings.frostedGlass.opacity, '%', { scope: 'root' });
      html += accordion('frosted', '磨砂玻璃容器', frostedBody);
    } else {
      html += renderAdvancedSection();
    }

    html += `
      <div class="pd-footer">
        <div id="pd-status">已同步</div>
      </div>
    `;

    body.innerHTML = html;
    if (body.animate) {
      body.animate(
        [{ opacity: 0, transform: 'translateY(3px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 140, easing: 'ease-out' }
      );
    }
  }

  function handleFieldEvent(e) {
    const el = e.target;
    if (el.dataset && el.dataset.file) {
      if (e.type !== 'change') return;
      const file = el.files && el.files[0];
      if (!file || !file.type.startsWith('image/')) return;
      const reader = new FileReader();
      if (el.dataset.file === 'button-image') {
        reader.onload = (ev) => {
          globalConfig.buttonImage = ev.target.result;
          applyGearStyle();
          scheduleSaveGlobal();
          renderPanel();
        };
      } else {
        reader.onload = (ev) => {
          const editable = getEditable();
          editable.value = ev.target.result;
          liveApply(); scheduleSave(); renderPanel();
        };
      }
      reader.readAsDataURL(file);
      return;
    }
    if (!el.dataset || !el.dataset.path) return;

    const scope = el.dataset.scope || 'edit';
    const target = scope === 'root' ? settings
      : scope === 'slideshow' ? settings.slideshow
      : scope === 'global' ? globalConfig
      : getEditable();

    let value;
    if (el.type === 'checkbox') {
      if (el.dataset.truthy) value = el.checked ? el.dataset.truthy : el.dataset.falsy;
      else value = el.checked;
    } else if (el.dataset.numeric) {
      value = Number(el.value);
    } else {
      value = el.value;
    }
    setPath(target, el.dataset.path, value);

    // Full opacity makes an effect's flat bgColor look harsh; nudge a
    // still-untouched (100%) value down when switching into this type.
    if (el.dataset.path === 'type' && value === 'effect' && target.opacity === 100) {
      target.opacity = 85;
    }

    if (scope === 'global') {
      applyGearStyle();
      scheduleSaveGlobal();
    } else {
      liveApply();
      scheduleSave();
    }

    if (el.dataset.structural) {
      renderPanel();
    } else {
      const echo = shadow.querySelector(`[data-echo="${el.dataset.path}"]`);
      if (echo) echo.textContent = `${value}${el.dataset.suffix || ''}`;
    }
  }

  function handleToggle(e) {
    const details = e.target;
    if (!details || !details.dataset || !details.dataset.accId) return;
    ui.accordions[details.dataset.accId] = details.open;
  }

  // Animated accordion expand/collapse. Native <details> toggling is
  // instant (display block/none), so the click is intercepted and the
  // open/close is driven manually via WAAPI height keyframes, with the
  // `open` attribute flipped at the point that keeps native semantics
  // (keyboard, find-in-page auto-expand) intact: immediately when
  // opening, only once the collapse animation finishes when closing.
  function toggleAccordion(details) {
    const content = details.querySelector(':scope > .pd-accordion-content');
    const chevron = details.querySelector('.pd-chevron');
    if (!content) return;
    const opening = !details.open;
    if (chevron) chevron.style.transform = opening ? 'rotate(180deg)' : 'rotate(0deg)';
    ui.accordions[details.dataset.accId] = opening;
    if (!content.animate) { details.open = opening; return; }
    if (opening) {
      content.style.height = '0px';
      content.style.overflow = 'hidden';
      details.open = true;
      const target = content.scrollHeight;
      content.animate(
        [{ height: '0px', opacity: 0.4 }, { height: target + 'px', opacity: 1 }],
        { duration: 200, easing: 'cubic-bezier(.22,1,.36,1)' }
      ).onfinish = () => { content.style.height = ''; content.style.overflow = ''; };
    } else {
      const start = content.scrollHeight;
      content.style.height = start + 'px';
      content.style.overflow = 'hidden';
      content.animate(
        [{ height: start + 'px', opacity: 1 }, { height: '0px', opacity: 0.4 }],
        { duration: 160, easing: 'ease' }
      ).onfinish = () => { details.open = false; content.style.height = ''; content.style.overflow = ''; };
    }
  }

  function handleClick(e) {
    const summary = e.target.closest('.pd-accordion-summary');
    if (summary) { e.preventDefault(); toggleAccordion(summary.parentElement); return; }

    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;

    if (action === 'toggle-panel') {
      if (suppressNextGearClick) { suppressNextGearClick = false; return; }
      ui.open = !ui.open; applyOpenState(); return;
    }
    if (action === 'close-panel') { ui.open = false; applyOpenState(); return; }
    if (action === 'clear-button-image') {
      globalConfig.buttonImage = '';
      applyGearStyle();
      scheduleSaveGlobal();
      renderPanel();
      return;
    }
    if (action === 'clear-image') {
      const editable = getEditable();
      editable.value = '';
      liveApply(); scheduleSave(); renderPanel();
      return;
    }
    if (action === 'set-tab') { ui.tab = btn.dataset.value; renderPanel(); return; }
    if (action === 'set-scheme') { ui.scheme = btn.dataset.value; renderPanel(); return; }
    if (action === 'set-mode') {
      settings.mode = btn.dataset.value;
      liveApply(); scheduleSave(); renderPanel();
      return;
    }
    if (action === 'select-slide') { ui.slideIndex = Number(btn.dataset.index); renderPanel(); return; }
    if (action === 'add-slide') {
      settings.slideshow.items.push(emptyEditable());
      ui.slideIndex = settings.slideshow.items.length - 1;
      scheduleSave(); renderPanel();
      return;
    }
    if (action === 'remove-slide') {
      const idx = Number(btn.dataset.index);
      const sh = settings.slideshow;
      sh.items.splice(idx, 1);
      if (idx < sh.currentIndex) {
        sh.currentIndex -= 1;
      } else if (sh.currentIndex >= sh.items.length) {
        sh.currentIndex = sh.items.length - 1;
      }
      if (ui.slideIndex >= sh.items.length) ui.slideIndex = sh.items.length - 1;
      liveApply(); scheduleSave(); renderPanel();
      return;
    }
    if (action === 'pick-target') {
      startPicker((selector) => {
        settings.targetSelector = selector;
        liveApply(); scheduleSave(); renderPanel();
      });
      return;
    }
    if (action === 'pick-frosted') {
      startPicker((selector) => {
        settings.frostedGlass.selector = selector;
        liveApply(); scheduleSave(); renderPanel();
      });
      return;
    }
    if (action === 'gradient-preset') {
      const preset = Gradient.GRADIENT_PRESETS[Number(btn.dataset.index)];
      const e2 = getEditable();
      e2.gradient = Object.assign({ animated: false, speed: 10 }, JSON.parse(JSON.stringify(preset)));
      liveApply(); scheduleSave(); renderPanel();
      return;
    }
    if (action === 'gradient-generate') {
      const e2 = getEditable();
      const seed = e2.value && /^#/.test(e2.value) ? e2.value : '#6366f1';
      const hexColors = Gradient.generateTonalPalette(seed, 5);
      e2.gradient.stops = Gradient.clampStops(Gradient.normalizeToStopObjects(hexColors));
      liveApply(); scheduleSave(); renderPanel();
      return;
    }
    if (action === 'add-stop') {
      const e2 = getEditable();
      e2.gradient.stops.push({ color: '#ffffff', position: 100 });
      liveApply(); scheduleSave(); renderPanel();
      return;
    }
    if (action === 'remove-stop') {
      const e2 = getEditable();
      e2.gradient.stops.splice(Number(btn.dataset.index), 1);
      liveApply(); scheduleSave(); renderPanel();
      return;
    }
    if (action === 'export') { exportSettings(); return; }
    if (action === 'import') { importSettings(); return; }
    if (action === 'reset') { resetCurrentSite(); return; }
  }

  function applyOpenState() {
    if (ui.open) { clearHideTimer(); unhide(); positionPanel(); }
    panelEl.classList.toggle('pd-panel-open', ui.open);
    gearEl.classList.toggle('pd-open', ui.open);
    swapGearIcon();
    if (!ui.open) scheduleHide();
  }

  function swapGearIcon() {
    if (!gearEl || globalConfig.buttonImage) return;
    gearEl.innerHTML = svgIcon(ui.open ? ICON.close : ICON.gear, Math.round((globalConfig.buttonSize || 50) * 0.42));
    if (gearEl.animate) {
      gearEl.animate(
        [{ transform: 'scale(0.6) rotate(-40deg)', opacity: 0.3 }, { transform: 'scale(1) rotate(0)', opacity: 1 }],
        { duration: 220, easing: 'cubic-bezier(.34,1.56,.64,1)' }
      );
    }
  }

  // --------------------------------------------------------------------
  // Floating button appearance, position and edge-snap / auto-hide
  // behaviour — all global (cross-site) preferences.
  // --------------------------------------------------------------------
  const HIDE_DELAY_MS = 4000;
  const PEEK_VISIBLE_PX = 14;
  const EDGE_MARGIN_PX = 14;
  let hideTimer = null;
  let dragState = null;
  let suppressNextGearClick = false;

  function clearHideTimer() {
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
  }
  function scheduleHide() {
    clearHideTimer();
    if (!globalConfig.edgeSnap || ui.open) return;
    hideTimer = setTimeout(() => { gearEl.classList.add('pd-peek'); applyEdgeOffset(); }, HIDE_DELAY_MS);
  }
  function unhide() {
    clearHideTimer();
    if (gearEl.classList.contains('pd-peek')) {
      gearEl.classList.remove('pd-peek');
      applyEdgeOffset();
    }
  }

  function applyEdgeOffset() {
    if (!gearEl) return;
    const size = globalConfig.buttonSize || 50;
    const peeking = gearEl.classList.contains('pd-peek');
    const offset = peeking ? -(size - PEEK_VISIBLE_PX) : EDGE_MARGIN_PX;
    if (globalConfig.side === 'left') { gearEl.style.left = offset + 'px'; gearEl.style.right = 'auto'; }
    else { gearEl.style.right = offset + 'px'; gearEl.style.left = 'auto'; }
  }

  // Picks black or white for the gear icon based on the chosen button
  // color's luminance, so a custom (or the default black) buttonColor
  // never ends up icon-on-background-same-color invisible — the icon
  // can't just follow the light/dark theme's --pd-gear-text, since the
  // background here is the user's own color choice, not the theme's.
  function contrastColor(hex) {
    hex = String(hex || '#000000').replace('#', '');
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
    const r = parseInt(hex.slice(0, 2), 16) || 0;
    const g = parseInt(hex.slice(2, 4), 16) || 0;
    const b = parseInt(hex.slice(4, 6), 16) || 0;
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.55 ? '#000000' : '#ffffff';
  }

  function applyGearStyle() {
    if (!gearEl) return;
    const g = globalConfig;
    const size = g.buttonSize || 50;
    gearEl.style.width = size + 'px';
    gearEl.style.height = size + 'px';
    gearEl.style.background = g.buttonImage ? 'transparent' : (g.buttonColor || '#000000');
    gearEl.style.color = g.buttonImage ? '' : contrastColor(g.buttonColor);
    gearEl.innerHTML = '';
    if (g.buttonImage) {
      const img = document.createElement('img');
      img.src = g.buttonImage;
      Object.assign(img.style, { width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' });
      gearEl.appendChild(img);
    } else {
      gearEl.innerHTML = svgIcon(ui.open ? ICON.close : ICON.gear, Math.round(size * 0.42));
    }
    applyGearPosition();
  }

  function applyGearPosition() {
    if (!gearEl) return;
    const size = globalConfig.buttonSize || 50;
    const rawTop = (globalConfig.topPercent / 100) * window.innerHeight - size / 2;
    const top = Math.max(6, Math.min(window.innerHeight - size - 6, rawTop));
    gearEl.style.top = top + 'px';
    gearEl.style.bottom = 'auto';
    applyEdgeOffset();
    if (ui.open) positionPanel();
  }

  const PANEL_MAX_HEIGHT_PX = 480;

  function positionPanel() {
    if (!gearEl || !panelEl) return;
    const rect = gearEl.getBoundingClientRect();
    const margin = 10;
    if (globalConfig.side === 'left') {
      panelEl.style.left = rect.left + 'px'; panelEl.style.right = 'auto';
    } else {
      panelEl.style.right = (window.innerWidth - rect.right) + 'px'; panelEl.style.left = 'auto';
    }
    const cap = Math.min(PANEL_MAX_HEIGHT_PX, window.innerHeight * 0.66);
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    if (spaceAbove >= spaceBelow) {
      panelEl.style.bottom = (window.innerHeight - rect.top + 8) + 'px';
      panelEl.style.top = 'auto';
      panelEl.style.maxHeight = Math.max(200, Math.min(spaceAbove - margin * 2, cap)) + 'px';
    } else {
      panelEl.style.top = (rect.bottom + 8) + 'px';
      panelEl.style.bottom = 'auto';
      panelEl.style.maxHeight = Math.max(200, Math.min(spaceBelow - margin * 2, cap)) + 'px';
    }
  }

  function onGearPointerDown(e) {
    if (!globalConfig.draggable) return;
    unhide();
    const rect = gearEl.getBoundingClientRect();
    dragState = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, originLeft: rect.left, originTop: rect.top, moved: false };
    if (gearEl.setPointerCapture) { try { gearEl.setPointerCapture(e.pointerId); } catch (err) {} }
  }
  function onGearPointerMove(e) {
    if (!dragState || dragState.pointerId !== e.pointerId) return;
    const dx = e.clientX - dragState.startX, dy = e.clientY - dragState.startY;
    if (!dragState.moved && Math.hypot(dx, dy) < 6) return;
    dragState.moved = true;
    gearEl.classList.add('pd-dragging');
    const size = globalConfig.buttonSize || 50;
    const left = Math.max(4, Math.min(window.innerWidth - size - 4, dragState.originLeft + dx));
    const top = Math.max(4, Math.min(window.innerHeight - size - 4, dragState.originTop + dy));
    gearEl.style.left = left + 'px'; gearEl.style.right = 'auto';
    gearEl.style.top = top + 'px'; gearEl.style.bottom = 'auto';
  }
  function onGearPointerUp(e) {
    if (!dragState || dragState.pointerId !== e.pointerId) return;
    const wasDrag = dragState.moved;
    gearEl.classList.remove('pd-dragging');
    if (wasDrag) {
      suppressNextGearClick = true;
      const rect = gearEl.getBoundingClientRect();
      const size = globalConfig.buttonSize || 50;
      globalConfig.side = (rect.left + size / 2) < window.innerWidth / 2 ? 'left' : 'right';
      globalConfig.topPercent = Math.max(0, Math.min(100, ((rect.top + size / 2) / window.innerHeight) * 100));
      scheduleSaveGlobal();
      applyGearPosition();
    }
    dragState = null;
    scheduleHide();
  }

  function bumpToTop() {
    if (!panelHost) return;
    const fsEl = document.fullscreenElement || document.webkitFullscreenElement || null;
    const target = fsEl || document.documentElement;
    if (panelHost.parentNode !== target || target.lastElementChild !== panelHost) {
      target.appendChild(panelHost);
    }
  }

  function buildUI() {
    panelHost = document.createElement('div');
    panelHost.id = 'pagedye-embed-panel-host';
    Object.assign(panelHost.style, { position: 'fixed', zIndex: '2147483647', bottom: '0', right: '0', all: 'initial' });
    document.documentElement.appendChild(panelHost);
    shadow = panelHost.attachShadow({ mode: 'open' });

    const bumpObserver = new MutationObserver(bumpToTop);
    bumpObserver.observe(document.documentElement, { childList: true });
    if (document.body) bumpObserver.observe(document.body, { childList: true });
    document.addEventListener('fullscreenchange', bumpToTop);
    document.addEventListener('webkitfullscreenchange', bumpToTop);

    const style = document.createElement('style');
    style.textContent = `
      :host {
        color-scheme: light dark;
        --pd-radius-lg: 18px; --pd-radius-md: 10px; --pd-radius-sm: 7px;
        --pd-text: #18181b; --pd-text-secondary: #71717a; --pd-border: rgba(0,0,0,0.12);
        --pd-panel-bg: rgba(255,255,255,0.97); --pd-gear-bg: #18181b; --pd-gear-text: #fff;
        --pd-surface: rgba(0,0,0,0.035); --pd-card: #ffffff;
        --pd-input-bg: rgba(0,0,0,0.045); --pd-btn-bg: rgba(0,0,0,0.05);
        --pd-accent-bg: #18181b; --pd-accent-text: #fff;
        --pd-shadow: rgba(0,0,0,0.16); --pd-focus: rgba(24,24,27,0.14); --pd-option-bg: #fff;
        --pd-danger: #dc2626;
      }
      @media (prefers-color-scheme: dark) {
        :host {
          --pd-text: #f4f4f5; --pd-text-secondary: #a1a1aa; --pd-border: rgba(255,255,255,0.14);
          --pd-panel-bg: rgba(20,20,22,0.97); --pd-gear-bg: #fff; --pd-gear-text: #000;
          --pd-surface: rgba(255,255,255,0.045); --pd-card: #1c1c1e;
          --pd-input-bg: rgba(255,255,255,0.06); --pd-btn-bg: rgba(255,255,255,0.07);
          --pd-accent-bg: #fff; --pd-accent-text: #000;
          --pd-shadow: rgba(0,0,0,0.4); --pd-focus: rgba(255,255,255,0.16); --pd-option-bg: #1c1c1e;
          --pd-danger: #f87171;
        }
      }
      * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }

      @keyframes pd-pop-in { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }

      .pd-gear {
        position: fixed; bottom: 18px; right: 18px; width: 50px; height: 50px; border-radius: 50%;
        background: var(--pd-gear-bg); color: var(--pd-gear-text); border: 1px solid var(--pd-border);
        display: flex; align-items: center; justify-content: center; cursor: pointer;
        box-shadow: 0 4px 16px var(--pd-shadow);
        overflow: hidden; touch-action: none; user-select: none;
        animation: pd-pop-in 0.35s cubic-bezier(.34,1.56,.64,1);
        transition: left 0.25s ease, right 0.25s ease, top 0.25s ease, opacity 0.25s ease, transform 0.15s ease, box-shadow 0.15s ease;
      }
      .pd-gear:hover { transform: scale(1.06); }
      .pd-gear:active { transform: scale(0.92); }
      .pd-gear.pd-dragging { transition: none; transform: scale(1.04); }
      .pd-gear.pd-open { box-shadow: 0 0 0 3px var(--pd-focus), 0 4px 16px var(--pd-shadow); }
      .pd-gear.pd-peek { opacity: 0.5; }

      .pd-panel {
        display: flex; flex-direction: column; position: fixed; bottom: 74px; right: 18px;
        width: 384px; max-width: calc(100vw - 24px); max-height: 66vh; border-radius: var(--pd-radius-lg);
        background: var(--pd-panel-bg); color: var(--pd-text); border: 1px solid var(--pd-border);
        box-shadow: 0 20px 60px var(--pd-shadow); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
        overflow: hidden;
        opacity: 0; visibility: hidden; pointer-events: none; transform: translateY(8px) scale(0.97);
        transform-origin: bottom right;
        transition: opacity 0.18s ease, transform 0.18s cubic-bezier(.22,1,.36,1), visibility 0s linear 0.18s;
      }
      .pd-panel.pd-panel-open {
        opacity: 1; visibility: visible; pointer-events: auto; transform: translateY(0) scale(1);
        transition: opacity 0.18s ease, transform 0.18s cubic-bezier(.22,1,.36,1), visibility 0s linear 0s;
      }
      .pd-panel-header {
        display: flex; align-items: center; justify-content: space-between; gap: 10px;
        padding: 14px 16px; border-bottom: 1px solid var(--pd-border); flex: none;
      }
      .pd-brand { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; }
      .pd-domain-badge {
        font-size: 11.5px; color: var(--pd-text-secondary); background: var(--pd-surface);
        padding: 3px 9px; border-radius: 999px; max-width: 150px; overflow: hidden;
        white-space: nowrap; text-overflow: ellipsis;
      }
      .pd-header-actions { display: flex; align-items: center; gap: 4px; }
      .pd-icon-btn {
        display: flex; align-items: center; justify-content: center; width: 26px; height: 26px;
        border: none; background: transparent; color: var(--pd-text-secondary); border-radius: 7px;
        cursor: pointer; transition: background 0.15s ease, color 0.15s ease;
      }
      .pd-icon-btn:hover { background: var(--pd-surface); color: var(--pd-text); }

      .pd-panel-body { padding: 14px; overflow-y: auto; }
      .pd-panel-body::-webkit-scrollbar { width: 6px; }
      .pd-panel-body::-webkit-scrollbar-track { background: transparent; }
      .pd-panel-body::-webkit-scrollbar-thumb { background: var(--pd-border); border-radius: 3px; }

      .pd-seg {
        display: flex; gap: 2px; background: var(--pd-surface); padding: 3px;
        border-radius: var(--pd-radius-md); margin-bottom: 12px;
      }
      .pd-seg button {
        flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px;
        min-height: 32px; padding: 6px 8px; border-radius: calc(var(--pd-radius-md) - 3px); border: none;
        background: transparent; color: var(--pd-text-secondary); font-size: 12.5px; cursor: pointer;
        transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
      }
      .pd-seg button.active { background: var(--pd-card); color: var(--pd-text); box-shadow: 0 1px 3px var(--pd-shadow); font-weight: 600; }
      .pd-seg-main { margin-bottom: 14px; }

      .pd-scheme-switch { display: flex; gap: 8px; margin-bottom: 10px; }
      .pd-scheme-switch button {
        flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
        min-height: 36px; padding: 8px; border-radius: var(--pd-radius-md); border: 1px solid var(--pd-border);
        background: var(--pd-card); color: var(--pd-text-secondary); font-size: 12.5px; cursor: pointer;
        transition: all 0.15s ease;
      }
      .pd-scheme-switch button.active { background: var(--pd-accent-bg); color: var(--pd-accent-text); border-color: var(--pd-accent-bg); }

      .pd-accordion {
        border: 1px solid var(--pd-border); border-radius: var(--pd-radius-md); margin-bottom: 10px;
        background: var(--pd-card); overflow: hidden;
      }
      .pd-accordion-summary {
        display: flex; align-items: center; gap: 8px; padding: 10px 12px; font-size: 13px; font-weight: 600;
        cursor: pointer; list-style: none; user-select: none;
      }
      .pd-accordion-summary::-webkit-details-marker { display: none; }
      .pd-acc-title { flex: 1; }
      .pd-acc-badge {
        font-size: 10.5px; font-weight: 500; color: var(--pd-text-secondary); background: var(--pd-btn-bg);
        padding: 2px 8px; border-radius: 999px;
      }
      .pd-chevron { display: flex; color: var(--pd-text-secondary); transition: transform 0.2s ease; }
      .pd-accordion[open] > .pd-accordion-summary .pd-chevron { transform: rotate(180deg); }
      .pd-accordion-content { padding: 12px; border-top: 1px solid var(--pd-border); background: var(--pd-surface); }
      .pd-accordion-content > *:last-child { margin-bottom: 0 !important; }

      .pd-subhead { font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--pd-text-secondary); margin: 12px 0 6px; }
      .pd-hint { font-size: 11px; line-height: 1.5; color: var(--pd-text-secondary); margin: 4px 0 8px; }
      .pd-row { margin-bottom: 10px; }
      .pd-row-head { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: var(--pd-text); margin-bottom: 5px; }
      .pd-row-inline { display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: var(--pd-text); margin-bottom: 8px; cursor: pointer; min-height: 34px; }
      .pd-val-badge { font-size: 11px; background: var(--pd-btn-bg); padding: 2px 7px; border-radius: 999px; color: var(--pd-text-secondary); }

      .pd-row input[type="text"], .pd-row select, textarea {
        width: 100%; padding: 9px 10px; border-radius: var(--pd-radius-sm); border: 1px solid var(--pd-border);
        background: var(--pd-input-bg); color: var(--pd-text); font-size: 13px; transition: border-color 0.15s ease, box-shadow 0.15s ease;
      }
      .pd-row input[type="text"]:focus, .pd-row select:focus, textarea:focus {
        outline: none; border-color: var(--pd-accent-bg); box-shadow: 0 0 0 2px var(--pd-focus);
      }
      select option { background-color: var(--pd-option-bg); color: var(--pd-text); }
      textarea { min-height: 70px; resize: vertical; font-family: ui-monospace, Menlo, Consolas, monospace; }

      input[type="range"] {
        width: 100%; height: 5px; border-radius: 3px; background: var(--pd-border);
        -webkit-appearance: none; appearance: none; margin: 8px 0;
      }
      input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none; width: 15px; height: 15px; border-radius: 50%;
        background: var(--pd-accent-bg); cursor: pointer; box-shadow: 0 1px 4px var(--pd-shadow); margin-top: -5px;
      }
      input[type="range"]::-moz-range-thumb {
        width: 15px; height: 15px; border-radius: 50%; border: none;
        background: var(--pd-accent-bg); cursor: pointer; box-shadow: 0 1px 4px var(--pd-shadow);
      }
      input[type="range"]::-moz-range-track { height: 5px; border-radius: 3px; background: var(--pd-border); }

      input[type="color"] {
        -webkit-appearance: none; appearance: none; border: none; width: 30px; height: 30px; padding: 0;
        background: none; cursor: pointer; border-radius: var(--pd-radius-sm); overflow: hidden;
      }
      input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
      input[type="color"]::-webkit-color-swatch { border: 1px solid var(--pd-border); border-radius: var(--pd-radius-sm); }

      input[type="file"] { display: none; }
      .pd-file-drop {
        position: relative; border: 1.5px dashed var(--pd-border); border-radius: var(--pd-radius-md);
        padding: 18px 12px; text-align: center; color: var(--pd-text-secondary); margin-bottom: 10px;
        display: flex; flex-direction: column; align-items: center; gap: 6px; transition: all 0.15s ease;
      }
      .pd-file-drop:hover { border-color: var(--pd-accent-bg); color: var(--pd-text); background: var(--pd-surface); }
      .pd-file-drop p { margin: 0; font-size: 12px; }
      .pd-file-drop-compact { padding: 12px; }
      .pd-file-drop input[type="file"] { position: absolute; inset: 0; opacity: 0; cursor: pointer; display: block; }

      .pd-swatch-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; margin-bottom: 10px; }
      .pd-swatch { height: 28px; border-radius: var(--pd-radius-sm); cursor: pointer; border: 1px solid var(--pd-border); transition: transform 0.12s ease; }
      .pd-swatch:hover { transform: scale(1.08); }

      .pd-stop-row { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
      .pd-stop-row button {
        border: none; background: var(--pd-btn-bg); color: var(--pd-text-secondary); border-radius: var(--pd-radius-sm);
        cursor: pointer; padding: 6px 8px; display: flex; align-items: center; transition: all 0.15s ease;
      }
      .pd-stop-row button:hover { background: var(--pd-focus); color: var(--pd-danger); }

      .pd-slides { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
      .pd-slide-item {
        display: flex; align-items: center; gap: 4px; padding: 8px 10px; border-radius: var(--pd-radius-sm);
        border: 1px solid var(--pd-border); background: var(--pd-card); color: var(--pd-text-secondary);
        font-size: 12px; cursor: pointer; transition: all 0.15s ease;
      }
      .pd-slide-item.active { background: var(--pd-accent-bg); color: var(--pd-accent-text); border-color: var(--pd-accent-bg); }

      .pd-btn-secondary {
        width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px;
        min-height: 38px; padding: 8px; margin: 4px 0 10px; border-radius: var(--pd-radius-md); border: 1px solid var(--pd-border);
        background: var(--pd-btn-bg); color: var(--pd-text); font-size: 12.5px; cursor: pointer; transition: all 0.15s ease;
      }
      .pd-btn-secondary:hover { background: var(--pd-focus); }

      .pd-footer-btns { display: flex; gap: 6px; }
      .pd-footer-btns button {
        flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px;
        min-height: 36px; padding: 6px; border-radius: var(--pd-radius-sm); border: 1px solid var(--pd-border);
        background: transparent; color: var(--pd-text-secondary); font-size: 12px; cursor: pointer; transition: all 0.15s ease;
      }
      .pd-footer-btns button:hover { background: var(--pd-surface); color: var(--pd-text); }
      .pd-footer-btns button.pd-danger:hover { color: var(--pd-danger); border-color: var(--pd-danger); }

      .pd-footer { margin-top: 4px; padding-top: 10px; border-top: 1px solid var(--pd-border); font-size: 11px; color: var(--pd-text-secondary); }
      .pd-version { opacity: 0.65; margin: 8px 0 0; }

      button:focus-visible, input:focus-visible, select:focus-visible, [tabindex]:focus-visible {
        outline: 2px solid var(--pd-accent-bg); outline-offset: 1px;
      }
    `;
    shadow.appendChild(style);

    gearEl = document.createElement('div');
    gearEl.className = 'pd-gear';
    gearEl.innerHTML = svgIcon(ICON.gear, 21);
    gearEl.setAttribute('data-action', 'toggle-panel');
    gearEl.addEventListener('pointerdown', onGearPointerDown);
    gearEl.addEventListener('pointermove', onGearPointerMove);
    gearEl.addEventListener('pointerup', onGearPointerUp);
    gearEl.addEventListener('pointercancel', onGearPointerUp);
    shadow.appendChild(gearEl);

    panelEl = document.createElement('div');
    panelEl.className = 'pd-panel';
    panelEl.innerHTML = `
      <div class="pd-panel-header">
        <div class="pd-brand">
          <span>PageDye 体验版</span>
          <span class="pd-domain-badge" title="${domain}">${domain}</span>
        </div>
        <div class="pd-header-actions">
          <button type="button" class="pd-icon-btn" data-action="close-panel" title="关闭">${svgIcon(ICON.close, 15)}</button>
        </div>
      </div>
      <div class="pd-panel-body"><div id="pd-body"></div></div>
    `;
    shadow.appendChild(panelEl);

    shadow.addEventListener('input', handleFieldEvent);
    shadow.addEventListener('change', handleFieldEvent);
    shadow.addEventListener('click', handleClick);
    shadow.addEventListener('toggle', handleToggle, true);
    window.addEventListener('resize', () => applyGearPosition());

    applyGearStyle();
    renderPanel();
    scheduleHide();
  }

  // --------------------------------------------------------------------
  // Boot
  // --------------------------------------------------------------------
  function boot() {
    const stored = Store.get(STORAGE_KEY);
    const storedGlobal = Store.get(GLOBAL_KEY);
    settings = stored ? Object.assign(defaultSettings(), stored) : defaultSettings();
    globalConfig = Object.assign(defaultGlobalConfig(), storedGlobal || {});
    maybeCatchUpSlideshow(settings);
    applyBackground(settings);

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      // Also lets an "auto" effect color preset track the OS scheme live,
      // independent of the wallpaper light/dark MODE.
      if (settings) applyBackground(settings);
    });

    const start = () => buildUI();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
      start();
    }
  }

  boot();
})();
