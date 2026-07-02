// ==UserScript==
// @name         PageDye Lite
// @namespace    https://github.com/onyxaxisowo/pagedye
// @version      0.5.2
// @description  轻量版 PageDye —— 无浏览器扩展权限依赖,在 Tampermonkey / Violentmonkey / iOS "Userscripts" 等用户脚本管理器里自定义网页背景、渐变、动效壁纸与磨砂玻璃效果。
// @author       PageDye
// @match        *://*/*
// @run-at       document-start
// @noframes
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM.deleteValue
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// ==/UserScript==

/*
 * PageDye Lite —— PageDye 浏览器扩展的精简 UserScript 版本。
 *
 * 安装:
 *   - 桌面 Chrome/Firefox/Edge: 装 Tampermonkey 或 Violentmonkey,新建脚本粘贴本文件全部内容。
 *   - iPad / iPhone: App Store 搜索并安装 "Userscripts"(作者 Quoid,免费开源),
 *     在 Safari 扩展设置里启用它并允许在所有网站上运行,然后把本文件导入进去。
 *
 * 使用: 打开任意网页后,页面右下角会出现一个悬浮的齿轮按钮,点击它展开设置面板。
 * 设置只针对"当前这个网站"(按域名区分),改动会实时预览并在 400ms 后自动保存。
 *
 * 相比完整 Chrome 扩展版,这个精简版有意砍掉了以下内容(详见项目内讨论):
 *   - 多站点管理仪表盘 —— 这里只管理当前网站一个站点,没有"查看/编辑其它已配置网站"的列表。
 *   - 已打开的其它标签页设置实时联动 —— 因为 iOS 的 Userscripts 引擎不支持
 *     GM_addValueChangeListener,所以在别的标签页改了设置后,这个标签页要刷新才能看到变化。
 *   - 浏览器右键菜单快捷入口 —— 因为 iOS 的 Userscripts 引擎不支持
 *     GM_registerMenuCommand,唯一入口就是页面上的悬浮齿轮按钮。
 *   - 从图片提取主题色生成渐变(Monet 取色)—— 保留了"从纯色生成渐变"的简化版。
 *
 * 渲染核心(渐变计算 / 动效动画 / 磨砂玻璃 / 滤镜拼接)与扩展版共享同一套算法,
 * 每个网站的配置 JSON 结构也和扩展版的单站点备份文件保持兼容,可以互相导入导出。
 */
(function () {
  'use strict';

  const VERSION = '0.5.2';
  const domain = window.location.hostname;
  const STORAGE_KEY = domain;
  const GLOBAL_KEY = 'pagedye-lite:global-ui';

  function defaultGlobalConfig() {
    return { buttonColor: '#000000', buttonSize: 50, buttonImage: '', draggable: false, edgeSnap: false, side: 'right', topPercent: 88 };
  }
  let globalConfig = null;
  let globalSaveTimer = null;
  function scheduleSaveGlobal() {
    clearTimeout(globalSaveTimer);
    globalSaveTimer = setTimeout(() => GMBridge.set(GLOBAL_KEY, globalConfig), 400);
  }

  // --------------------------------------------------------------------
  // Storage bridge: prefers the promise-based GM.* API (Safari/iOS
  // Userscripts, modern Tampermonkey/Violentmonkey), falls back to the
  // legacy synchronous GM_* API (older Greasemonkey-style managers).
  // Values are JSON-stringified manually so this works even on managers
  // that only reliably persist strings.
  // --------------------------------------------------------------------
  const GMBridge = (() => {
    const hasPromiseApi = typeof GM !== 'undefined' && GM.setValue && GM.getValue;
    return {
      async set(key, value) {
        const json = JSON.stringify(value);
        if (hasPromiseApi) return GM.setValue(key, json);
        return GM_setValue(key, json);
      },
      async get(key) {
        let raw;
        if (hasPromiseApi) raw = await GM.getValue(key, null);
        else raw = typeof GM_getValue === 'function' ? GM_getValue(key, null) : null;
        if (!raw) return null;
        try { return JSON.parse(raw); } catch (err) { return null; }
      },
      async remove(key) {
        if (hasPromiseApi && GM.deleteValue) return GM.deleteValue(key);
        if (typeof GM_deleteValue === 'function') return GM_deleteValue(key);
      }
    };
  })();

  // --------------------------------------------------------------------
  // Gradient utilities — ported unchanged from scripts/gradient.js (it was
  // already framework-agnostic, no chrome.* dependency).
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
      '@keyframes pagedye-lite-gradient-flow {' +
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

    // Given ONE seed color, derives a harmonious multi-stop tonal palette.
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
  // Settings schema (kept identical to the Chrome extension's per-site
  // shape, so backup JSON files are interchangeable between the two).
  // --------------------------------------------------------------------
  function emptyEditable() {
    return {
      type: 'none', colorMode: 'solid', value: '',
      opacity: 100, blur: 0,
      style: { fixed: true, size: 'cover', repeat: false },
      filters: { brightness: 100, contrast: 100, grayscale: 0, hue: 0, invert: 0 },
      gradient: Gradient.defaultGradient('#6366f1'),
      effect: 'waves', effectColor: '#ffffff', effectDensity: 50, effectSpeed: 50
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
  // Render engine — ported from scripts/content.js. Same DOM strategy
  // (fixed shadow-DOM layer painted behind the page, or a scoped
  // per-element ::before layer in "selector mode"), same effect canvases,
  // same frosted-glass / custom-CSS injection. Only the storage/messaging
  // plumbing changed: no chrome.runtime/chrome.storage, just direct calls
  // since the settings panel lives in the same page context.
  // --------------------------------------------------------------------
  const ROOT_ID = 'pagedye-lite-root';
  const STYLE_ID = 'pagedye-lite-style-override';
  const TARGET_STYLE_ID = 'pagedye-lite-target-style';
  const CUSTOM_STYLE_ID = 'pagedye-lite-custom-css';
  const FROSTED_STYLE_ID = 'pagedye-lite-frosted-glass';
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
          animationCss = `pagedye-lite-gradient-flow ${gradient.speed || 10}s ease infinite`;
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
      layer.id = 'pagedye-lite-layer';
      shadow.appendChild(layer);
      canvas = document.createElement('canvas');
      canvas.id = 'pagedye-lite-effect-canvas';
      Object.assign(canvas.style, {
        position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
        display: 'none', transition: 'opacity 0.3s ease'
      });
      shadow.appendChild(canvas);
    } else {
      layer = root.shadowRoot.getElementById('pagedye-lite-layer');
      canvas = root.shadowRoot.getElementById('pagedye-lite-effect-canvas');
    }

    if (s.type === 'effect') {
      root.style.position = 'fixed';
      root.style.height = '100vh';
      layer.style.backgroundImage = 'none';
      layer.style.backgroundColor = 'transparent';
      startEffect(canvas, s.effect || 'waves', s.opacity, { color: s.effectColor, density: s.effectDensity, speed: s.effectSpeed });
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
          style.animation = `pagedye-lite-gradient-flow ${gradient.speed || 10}s ease infinite`;
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

  async function rotateSlideshow(s) {
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
    await GMBridge.set(STORAGE_KEY, s);
    applyBackground(s);
  }

  async function maybeCatchUpSlideshow(s) {
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
    await GMBridge.set(STORAGE_KEY, s);
  }

  // --- Effects (animated Canvas 2D wallpapers) — ported unchanged --------
  const MATRIX_CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789';

  function normalizeEffectConfig(cfg) {
    return {
      color: (cfg && cfg.color) || '#ffffff',
      density: clampPercent(cfg && cfg.density, 50),
      speed: clampPercent(cfg && cfg.speed, 50)
    };
  }
  function clampPercent(n, fallback) {
    return typeof n === 'number' && !isNaN(n) ? Math.max(0, Math.min(100, n)) : fallback;
  }
  function effectSpeedMultiplier(speed) { return 0.4 + (speed / 100) * 1.6; }

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
        ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
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
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, width, height);
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
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, width, height);
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
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, width, height);
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
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, width, height);
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
  // Element picker — same AdGuard-style highlight-and-click UX as the
  // extension's popup.js, but simplified: no cross-context injection is
  // needed since the picker runs in the very same script instance that
  // owns `settings`, so it can write the result directly and re-render.
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
    if (window.__pagedyeLitePicking) return;
    window.__pagedyeLitePicking = true;
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
    tip.textContent = 'PageDye Lite:点击一个元素应用背景 · Esc 取消';
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
      window.__pagedyeLitePicking = false;
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
  // Settings panel UI — floating gear button + slide-up panel, built once
  // inside its own shadow root (isolated from the host page's CSS).
  // --------------------------------------------------------------------
  let saveTimer = null;
  let panelHost = null, shadow = null, panelEl = null, gearEl = null;
  const ui = { open: false, tab: 'wallpaper', scheme: 'light', slideIndex: 0 };

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
  async function persist() {
    settings.timestamp = Date.now();
    await GMBridge.set(STORAGE_KEY, settings);
    setStatus('已同步');
  }
  function setStatus(text) {
    const el = shadow && shadow.getElementById('pd-status');
    if (el) el.textContent = text;
  }
  function liveApply() { applyBackground(settings); }

  function resetCurrentSite() {
    clearTimeout(saveTimer);
    GMBridge.remove(STORAGE_KEY);
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
      <div class="pd-row-head"><span>${label}</span><span data-echo="${path}">${value}${suffix || ''}</span></div>
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

  function renderGradientEditor(e) {
    const g = e.gradient;
    const presetsHtml = Gradient.GRADIENT_PRESETS.map((p, i) =>
      `<div class="pd-swatch" data-action="gradient-preset" data-index="${i}" title="${p.name}" style="background:${Gradient.buildGradientCss(p)}"></div>`
    ).join('');
    const stopsHtml = g.stops.map((s, i) => `
      <div class="pd-stop-row">
        <input type="color" value="${s.color}" data-path="gradient.stops.${i}.color" data-scope="edit" />
        <input type="number" min="0" max="100" value="${s.position}" data-path="gradient.stops.${i}.position" data-scope="edit" data-numeric="1" style="width:52px" />
        ${g.stops.length > 2 ? `<button data-action="remove-stop" data-index="${i}">✕</button>` : ''}
      </div>`).join('');

    return `
      <div class="pd-subhead">渐变预设</div>
      <div class="pd-swatch-grid">${presetsHtml}</div>
      <button class="pd-btn-secondary" data-action="gradient-generate">🎨 从主色生成色阶</button>
      ${selectRow('类型', 'gradient.kind', [['linear', '线性'], ['radial', '放射']], g.kind, { structural: true })}
      ${g.kind === 'radial'
        ? selectRow('形状', 'gradient.shape', [['circle', '圆形'], ['ellipse', '椭圆']], g.shape || 'circle', { structural: true })
        : rangeRow('角度', 'gradient.angle', 0, 360, g.angle || 90, '°')}
      <div class="pd-subhead">色标(${g.stops.length}/${Gradient.MAX_STOPS})</div>
      <div class="pd-stops">${stopsHtml}</div>
      ${g.stops.length < Gradient.MAX_STOPS ? `<button class="pd-btn-secondary" data-action="add-stop">+ 添加色标</button>` : ''}
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
      body += `<div class="pd-row"><div class="pd-row-head"><span>或上传本地图片</span></div><input type="file" accept="image/*" data-file="1" /></div>`;
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
        ['starfield', '星空 Starfield'], ['ripple', '涟漪 Ripple']
      ], e.effect || 'waves');
      body += colorRow('颜色', 'effectColor', e.effectColor || '#ffffff');
      body += rangeRow('密度', 'effectDensity', 0, 100, e.effectDensity != null ? e.effectDensity : 50, '%');
      body += rangeRow('速度', 'effectSpeed', 0, 100, e.effectSpeed != null ? e.effectSpeed : 50, '%');
      body += rangeRow('不透明度', 'opacity', 0, 100, e.opacity, '%');
    }
    return body;
  }

  function renderModeControls() {
    let html = `<div class="pd-mode-switch">
      <button class="${settings.mode === 'single' ? 'active' : ''}" data-action="set-mode" data-value="single">单一</button>
      <button class="${settings.mode === 'auto' ? 'active' : ''}" data-action="set-mode" data-value="auto">昼夜自动</button>
      <button class="${settings.mode === 'slideshow' ? 'active' : ''}" data-action="set-mode" data-value="slideshow">幻灯轮播</button>
    </div>`;

    if (settings.mode === 'auto') {
      html += `<div class="pd-mode-switch">
        <button class="${ui.scheme === 'light' ? 'active' : ''}" data-action="set-scheme" data-value="light">☀️ 浅色</button>
        <button class="${ui.scheme === 'dark' ? 'active' : ''}" data-action="set-scheme" data-value="dark">🌙 深色</button>
      </div>`;
    }

    if (settings.mode === 'slideshow') {
      const sh = settings.slideshow;
      const itemsHtml = sh.items.map((item, i) => `
        <button class="pd-slide-item ${i === ui.slideIndex ? 'active' : ''}" data-action="select-slide" data-index="${i}">
          #${i + 1} ${item.type === 'none' ? '空' : item.type}
        </button>`).join('');
      html += `<div class="pd-slides">${itemsHtml}
        <button class="pd-slide-item" data-action="add-slide">+ 新增</button>
      </div>`;
      if (sh.items.length > 1) {
        html += `<button class="pd-btn-secondary" data-action="remove-slide" data-index="${ui.slideIndex}">删除当前这一帧</button>`;
      }
      html += selectRow('轮播间隔', 'interval', [
        ['open', '每次打开页面'], ['15m', '每 15 分钟'], ['30m', '每 30 分钟'], ['1h', '每 1 小时'], ['24h', '每 24 小时']
      ], sh.interval, { scope: 'slideshow', structural: false });
      html += checkboxRow('随机顺序', 'order', sh.order === 'random', { scope: 'slideshow' })
        .replace('data-path="order"', 'data-path="order" data-truthy="random" data-falsy="sequential"');
    }

    return html;
  }

  function renderButtonSection() {
    const g = globalConfig;
    let html = `<div class="pd-subhead">悬浮按钮外观</div>`;
    html += colorRow('按钮颜色', 'buttonColor', g.buttonColor, { scope: 'global' });
    html += rangeRow('按钮大小', 'buttonSize', 36, 72, g.buttonSize, 'px', { scope: 'global' });
    html += `<div class="pd-row"><div class="pd-row-head"><span>自定义图标图片</span></div><input type="file" accept="image/*" data-file="button-image" /></div>`;
    if (g.buttonImage) html += `<button class="pd-btn-secondary" data-action="clear-button-image">清除自定义图标,恢复默认齿轮</button>`;
    html += `<div class="pd-subhead">移动与贴边隐藏</div>`;
    html += checkboxRow('允许拖动移动按钮位置', 'draggable', !!g.draggable, { scope: 'global' });
    html += `<div class="pd-hint">开启后可以直接拖动悬浮按钮,松手会自动吸附到屏幕左侧或右侧最近的边。</div>`;
    html += checkboxRow('贴边隐藏(像悬浮球一样)', 'edgeSnap', !!g.edgeSnap, { scope: 'global', structural: true });
    html += `<div class="pd-hint">开启后,面板关闭且按钮静止 ${Math.round(HIDE_DELAY_MS / 1000)} 秒会自动滑出屏幕边缘只留一条边,轻触即可弹回并展开面板。和"允许拖动"是两个独立开关——不开拖动也能用默认位置贴边隐藏。</div>`;
    return html;
  }

  function renderPanel() {
    if (!shadow) return;
    const body = shadow.getElementById('pd-body');
    if (!body) return;

    let html = `
      <div class="pd-tabs">
        <button class="${ui.tab === 'wallpaper' ? 'active' : ''}" data-action="set-tab" data-value="wallpaper">壁纸</button>
        <button class="${ui.tab === 'frosted' ? 'active' : ''}" data-action="set-tab" data-value="frosted">磨砂玻璃</button>
        <button class="${ui.tab === 'button' ? 'active' : ''}" data-action="set-tab" data-value="button">按钮</button>
      </div>
    `;

    if (ui.tab === 'wallpaper') {
      html += renderModeControls();
      html += `<div class="pd-subhead">编辑内容</div>`;
      html += renderEditableSection(getEditable());
      html += `<div class="pd-subhead">目标元素(可选)</div>`;
      html += textRow('CSS 选择器', 'targetSelector', settings.targetSelector, '留空 = 整页背景', { scope: 'root' });
      html += `<button class="pd-btn-secondary" data-action="pick-target">🎯 拾取页面元素</button>`;
      html += `<div class="pd-subhead">自定义 CSS</div>`;
      html += `<textarea data-path="customCss" data-scope="root" placeholder="/* 任意 CSS,注入到当前网站 */">${escapeAttr(settings.customCss || '')}</textarea>`;
    } else if (ui.tab === 'frosted') {
      html += `<div class="pd-subhead">磨砂玻璃容器</div>`;
      html += textRow('CSS 选择器', 'frostedGlass.selector', settings.frostedGlass.selector, '例如 .card, main', { scope: 'root' });
      html += `<button class="pd-btn-secondary" data-action="pick-frosted">🎯 拾取页面元素</button>`;
      html += rangeRow('模糊强度', 'frostedGlass.blur', 0, 30, settings.frostedGlass.blur, 'px', { scope: 'root' });
      html += rangeRow('底色不透明度', 'frostedGlass.opacity', 0, 100, settings.frostedGlass.opacity, '%', { scope: 'root' });
    } else {
      html += renderButtonSection();
    }

    html += `
      <div class="pd-footer">
        <div id="pd-status">已同步</div>
        <div class="pd-footer-btns">
          <button data-action="export">导出</button>
          <button data-action="import">导入</button>
          <button data-action="reset">重置</button>
        </div>
        <div class="pd-version">PageDye Lite v${VERSION} · ${domain}</div>
      </div>
    `;

    body.innerHTML = html;
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

  function handleClick(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;

    if (action === 'toggle-panel') {
      if (suppressNextGearClick) { suppressNextGearClick = false; return; }
      ui.open = !ui.open; applyOpenState(); return;
    }
    if (action === 'clear-button-image') {
      globalConfig.buttonImage = '';
      applyGearStyle();
      scheduleSaveGlobal();
      renderPanel();
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
      settings.slideshow.items.splice(idx, 1);
      if (ui.slideIndex >= settings.slideshow.items.length) ui.slideIndex = settings.slideshow.items.length - 1;
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
      scheduleSave(); renderPanel();
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
    panelEl.style.display = ui.open ? 'flex' : 'none';
    gearEl.classList.toggle('pd-open', ui.open);
    if (!globalConfig.buttonImage) gearEl.textContent = ui.open ? '✕' : '⚙️';
    if (ui.open) { clearHideTimer(); unhide(); positionPanel(); }
    else { scheduleHide(); }
  }

  // --------------------------------------------------------------------
  // Floating button appearance, position and "assistive-touch"-style
  // edge-snap + auto-hide behaviour — all global (cross-site) preferences,
  // since the button is chrome for the tool itself, not per-site content.
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

  // Docks the button flush against the real screen edge, leaving only a
  // small sliver on-screen, instead of a percentage transform — a fixed
  // sliver width reads as unmistakably "hidden" no matter the button size.
  function applyEdgeOffset() {
    if (!gearEl) return;
    const size = globalConfig.buttonSize || 50;
    const peeking = gearEl.classList.contains('pd-peek');
    const offset = peeking ? -(size - PEEK_VISIBLE_PX) : EDGE_MARGIN_PX;
    if (globalConfig.side === 'left') { gearEl.style.left = offset + 'px'; gearEl.style.right = 'auto'; }
    else { gearEl.style.right = offset + 'px'; gearEl.style.left = 'auto'; }
  }

  function applyGearStyle() {
    if (!gearEl) return;
    const g = globalConfig;
    const size = g.buttonSize || 50;
    gearEl.style.width = size + 'px';
    gearEl.style.height = size + 'px';
    gearEl.style.fontSize = Math.round(size * 0.42) + 'px';
    gearEl.style.background = g.buttonImage ? 'transparent' : (g.buttonColor || '#000000');
    gearEl.innerHTML = '';
    if (g.buttonImage) {
      const img = document.createElement('img');
      img.src = g.buttonImage;
      Object.assign(img.style, { width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' });
      gearEl.appendChild(img);
    } else {
      gearEl.textContent = ui.open ? '✕' : '⚙️';
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

  const PANEL_MAX_HEIGHT_PX = 440;

  function positionPanel() {
    if (!gearEl || !panelEl) return;
    const rect = gearEl.getBoundingClientRect();
    const margin = 10;
    if (globalConfig.side === 'left') {
      panelEl.style.left = rect.left + 'px'; panelEl.style.right = 'auto';
    } else {
      panelEl.style.right = (window.innerWidth - rect.right) + 'px'; panelEl.style.left = 'auto';
    }
    const cap = Math.min(PANEL_MAX_HEIGHT_PX, window.innerHeight * 0.62);
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

  function buildUI() {
    panelHost = document.createElement('div');
    panelHost.id = 'pagedye-lite-panel-host';
    Object.assign(panelHost.style, { position: 'fixed', zIndex: '2147483647', bottom: '0', right: '0', all: 'initial' });
    document.documentElement.appendChild(panelHost);
    shadow = panelHost.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
      * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color-scheme: dark; }
      .pd-gear {
        position: fixed; bottom: 18px; right: 18px; width: 50px; height: 50px; border-radius: 50%;
        background: rgba(20,20,20,0.85); color: #fff; border: 1px solid rgba(255,255,255,0.15);
        font-size: 21px; display: flex; align-items: center; justify-content: center; cursor: pointer;
        box-shadow: 0 4px 16px rgba(0,0,0,0.35); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
        overflow: hidden; touch-action: none; user-select: none;
        transition: left 0.25s ease, right 0.25s ease, top 0.25s ease, opacity 0.25s ease, transform 0.25s ease;
      }
      .pd-gear.pd-dragging { transition: none; }
      .pd-gear.pd-open { box-shadow: 0 0 0 3px rgba(255,255,255,0.55), 0 4px 16px rgba(0,0,0,0.35); }
      .pd-gear.pd-peek { opacity: 0.5; }
      .pd-panel {
        display: none; flex-direction: column; position: fixed; bottom: 74px; right: 18px;
        width: 340px; max-width: calc(100vw - 24px); max-height: 58vh; overflow-y: auto; border-radius: 14px;
        background: rgba(24,24,27,0.92); color: #f4f4f5; border: 1px solid rgba(255,255,255,0.1);
        box-shadow: 0 12px 40px rgba(0,0,0,0.45); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
        padding: 14px;
      }
      .pd-tabs {
        display: flex; gap: 6px; margin: -14px -14px 10px; padding: 12px 14px 8px;
        position: sticky; top: -14px; z-index: 2;
        background: rgba(24,24,27,0.97); border-bottom: 1px solid rgba(255,255,255,0.08);
      }
      .pd-tabs button, .pd-mode-switch button {
        flex: 1; min-height: 38px; padding: 8px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15);
        background: transparent; color: #d4d4d8; font-size: 13px; cursor: pointer;
      }
      .pd-tabs button.active, .pd-mode-switch button.active { background: #fff; color: #000; border-color: #fff; }
      .pd-mode-switch { display: flex; gap: 6px; margin-bottom: 10px; }
      .pd-subhead { font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #a1a1aa; margin: 12px 0 6px; }
      .pd-hint { font-size: 11px; line-height: 1.5; color: #a1a1aa; margin: 4px 0 8px; }
      .pd-row { margin-bottom: 10px; }
      .pd-row-head { display: flex; justify-content: space-between; font-size: 12px; color: #d4d4d8; margin-bottom: 4px; }
      .pd-row-inline { display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: #d4d4d8; margin-bottom: 8px; cursor: pointer; min-height: 36px; }
      .pd-row input[type="text"], .pd-row select, textarea {
        width: 100%; padding: 9px 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.15);
        background: rgba(255,255,255,0.05); color: #fff; font-size: 13px;
      }
      select option { background-color: #1c1c1e; color: #f4f4f5; }
      textarea { min-height: 70px; resize: vertical; font-family: ui-monospace, Menlo, Consolas, monospace; }
      input[type="range"] { width: 100%; height: 32px; }
      input[type="file"] { font-size: 12px; color: #d4d4d8; width: 100%; }
      .pd-swatch-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; margin-bottom: 8px; }
      .pd-swatch { height: 28px; border-radius: 6px; cursor: pointer; border: 1px solid rgba(255,255,255,0.15); }
      .pd-stop-row { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
      .pd-stop-row button { border: none; background: rgba(255,255,255,0.1); color: #fff; border-radius: 4px; cursor: pointer; padding: 6px 10px; }
      .pd-slides { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
      .pd-slide-item {
        padding: 8px 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.15);
        background: transparent; color: #d4d4d8; font-size: 12px; cursor: pointer;
      }
      .pd-slide-item.active { background: #fff; color: #000; border-color: #fff; }
      .pd-btn-secondary {
        width: 100%; min-height: 38px; padding: 8px; margin: 4px 0 8px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15);
        background: rgba(255,255,255,0.06); color: #fff; font-size: 13px; cursor: pointer;
      }
      .pd-footer { margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 11px; color: #a1a1aa; }
      .pd-footer-btns { display: flex; gap: 6px; margin: 6px 0; }
      .pd-footer-btns button {
        flex: 1; min-height: 34px; padding: 6px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.15);
        background: transparent; color: #d4d4d8; font-size: 12px; cursor: pointer;
      }
      .pd-version { opacity: 0.6; }
    `;
    shadow.appendChild(style);

    gearEl = document.createElement('div');
    gearEl.className = 'pd-gear';
    gearEl.textContent = '⚙️';
    gearEl.setAttribute('data-action', 'toggle-panel');
    gearEl.addEventListener('pointerdown', onGearPointerDown);
    gearEl.addEventListener('pointermove', onGearPointerMove);
    gearEl.addEventListener('pointerup', onGearPointerUp);
    gearEl.addEventListener('pointercancel', onGearPointerUp);
    shadow.appendChild(gearEl);

    panelEl = document.createElement('div');
    panelEl.className = 'pd-panel';
    panelEl.innerHTML = '<div id="pd-body"></div>';
    shadow.appendChild(panelEl);

    shadow.addEventListener('input', handleFieldEvent);
    shadow.addEventListener('change', handleFieldEvent);
    shadow.addEventListener('click', handleClick);
    window.addEventListener('resize', () => applyGearPosition());

    applyGearStyle();
    renderPanel();
    scheduleHide();
  }

  // --------------------------------------------------------------------
  // Boot
  // --------------------------------------------------------------------
  async function boot() {
    const [stored, storedGlobal] = await Promise.all([GMBridge.get(STORAGE_KEY), GMBridge.get(GLOBAL_KEY)]);
    settings = stored ? Object.assign(defaultSettings(), stored) : defaultSettings();
    globalConfig = Object.assign(defaultGlobalConfig(), storedGlobal || {});
    await maybeCatchUpSlideshow(settings);
    applyBackground(settings);

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (settings && settings.mode === 'auto') applyBackground(settings);
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
