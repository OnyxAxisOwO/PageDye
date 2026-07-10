// Self-contained element picker. This function is serialized and injected
// into the page via chrome.scripting.executeScript, so it must NOT reference
// anything from the popup's scope (everything it needs comes via arguments).
// It highlights the hovered element, and on click writes the final settings
// (current form state + the picked selector) straight to storage for this
// domain. The content script's storage listener then paints that element
// immediately — no popup reopen required.
function pagedyeElementPicker(settings, domain, fieldPath, tipTextMultiple, tipTextSingle) {
  if (window.__pagedyePicking) return;
  window.__pagedyePicking = true;

  const box = document.createElement('div');
  Object.assign(box.style, {
    position: 'fixed', zIndex: '2147483647', pointerEvents: 'none',
    border: '2px solid #2563eb', background: 'rgba(37,99,235,0.2)',
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
  tip.textContent = (fieldPath && fieldPath[0] === 'deepCompatExclude')
    ? (tipTextMultiple || 'PageDye: click elements to exclude them · Esc to finish')
    : (tipTextSingle || 'PageDye: click an element to apply your background to it · Esc to cancel');
  Object.assign(tip.style, {
    position: 'fixed', zIndex: '2147483647', pointerEvents: 'none',
    top: '12px', left: '50%', transform: 'translateX(-50%)',
    background: '#2563eb', color: '#fff',
    font: '13px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    padding: '6px 14px', borderRadius: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
  });

  document.documentElement.appendChild(box);
  document.documentElement.appendChild(label);
  document.documentElement.appendChild(tip);

  let current = null;

  function cssEscape(s) {
    if (window.CSS && CSS.escape) return CSS.escape(s);
    return String(s).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
  }

  function getSelector(el) {
    if (!el || el.nodeType !== 1) return '';
    if (el.id) return '#' + cssEscape(el.id);

    const parts = [];
    let node = el;
    while (node && node.nodeType === 1 && node.tagName.toLowerCase() !== 'html') {
      if (node.id) { parts.unshift('#' + cssEscape(node.id)); break; }

      let part = node.tagName.toLowerCase();
      const classes = Array.from(node.classList).filter((c) => c && !c.startsWith('pagedye'));
      if (classes.length) {
        part += '.' + classes.slice(0, 3).map(cssEscape).join('.');
      } else if (node.parentElement) {
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

  function onMove(e) {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || el === box || el === label || el === tip) return;
    current = el;
    const r = el.getBoundingClientRect();
    Object.assign(box.style, {
      display: 'block', left: r.left + 'px', top: r.top + 'px',
      width: r.width + 'px', height: r.height + 'px'
    });
    label.textContent = getSelector(el);
    label.style.display = 'block';
    label.style.left = Math.min(e.clientX + 14, window.innerWidth - 220) + 'px';
    label.style.top = (e.clientY + 18) + 'px';
  }

  function cleanup() {
    document.removeEventListener('mousemove', onMove, true);
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('keydown', onKey, true);
    box.remove();
    label.remove();
    tip.remove();
    window.__pagedyePicking = false;
  }

  function onClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    const el = current || document.elementFromPoint(e.clientX, e.clientY);
    const selector = getSelector(el);
    try {
      const path = fieldPath && fieldPath.length ? fieldPath : ['targetSelector'];
      const next = JSON.parse(JSON.stringify(settings));
      let obj = next;
      for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        const nextKey = path[i + 1];
        if (obj[key] === undefined || obj[key] === null) {
          obj[key] = (typeof nextKey === 'number') ? [] : {};
        }
        obj = obj[key];
      }
      if (path[0] === 'deepCompatExclude') {
        const oldVal = obj[path[path.length - 1]];
        if (oldVal && oldVal.trim()) {
          const list = oldVal.split(',').map(s => s.trim()).filter(Boolean);
          if (!list.includes(selector)) {
            list.push(selector);
          }
          obj[path[path.length - 1]] = list.join(', ');
        } else {
          obj[path[path.length - 1]] = selector;
        }
      } else {
        obj[path[path.length - 1]] = selector;
      }
      // frostedGlass entries need blur/opacity alongside the selector — back
      // them in with defaults if this picker call just created the entry.
      if (path[0] === 'frostedGlass' && path.length > 1) {
        if (typeof obj.blur !== 'number') obj.blur = 12;
        if (typeof obj.opacity !== 'number') obj.opacity = 55;
      }
      chrome.storage.local.set({ [domain]: next });
    } catch (err) { /* storage unavailable */ }
    
    if (fieldPath && fieldPath[0] === 'deepCompatExclude') {
      box.style.borderColor = '#10b981';
      box.style.background = 'rgba(16,185,129,0.2)';
      setTimeout(() => {
        box.style.borderColor = '#2563eb';
        box.style.background = 'rgba(37,99,235,0.2)';
      }, 400);
      return;
    }
    cleanup();
  }

  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); cleanup(); }
  }

  document.addEventListener('mousemove', onMove, true);
  document.addEventListener('click', onClick, true);
  document.addEventListener('keydown', onKey, true);
}

// Shared across both DOMContentLoaded listeners below (they're independent,
// sibling closures — not nested — so this can't live inside either one).
const CUSTOM_PRESET_COLORS_KEY = '__pagedye_custom_preset_colors__';
const EXTENSION_ENABLED_KEY = '__pagedye_extension_enabled__';
const UI_THEME_KEY = '__pagedye_ui_theme__';
const UI_THEME_DEFAULTS = { accent: 'neutral', customAccent: '#18181b', disableAnimation: false };
const UI_THEME_ACCENTS = {
  neutral: '#18181b',
  red: '#BA1A1A',
  pink: '#B3266E',
  purple: '#6750A4',
  indigo: '#445E91',
  blue: '#0061A4',
  cyan: '#006874',
  teal: '#006A6A',
  green: '#386A20',
  orange: '#8B5000'
};

function normalizeHexColor(color, fallback) {
  const value = (color || '').trim();
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value.toUpperCase() : fallback;
}

function colorIsLight(color) {
  const hex = normalizeHexColor(color, '#18181B').replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) >= 140;
}

function hexToRgba(color, alpha) {
  const hex = normalizeHexColor(color, '#18181B').replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function shiftHexColor(color, amount) {
  const hex = normalizeHexColor(color, '#18181B').replace('#', '');
  const next = [0, 2, 4].map((idx) => {
    const value = Math.max(0, Math.min(255, parseInt(hex.slice(idx, idx + 2), 16) + amount));
    return value.toString(16).padStart(2, '0');
  });
  return '#' + next.join('').toUpperCase();
}

function hexToHsl(color) {
  const hex = normalizeHexColor(color, '#18181B').replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r: h = 60 * (((g - b) / d) % 6); break;
      case g: h = 60 * ((b - r) / d + 2); break;
      default: h = 60 * ((r - g) / d + 4); break;
    }
    if (h < 0) h += 360;
  }
  return { h, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
  const sat = s / 100;
  const light = l / 100;
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = light - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  const toHex = (v) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return ('#' + toHex(r) + toHex(g) + toHex(b)).toUpperCase();
}

// Real Material You dynamic color doesn't just tint buttons — the surfaces
// (backgrounds, cards, containers, borders) are their own tonal palette
// derived from the same seed color's hue, at low chroma. Scaling the tint's
// saturation by the accent's own saturation (rather than a flat constant)
// keeps a near-gray accent (the default "neutral" preset) rendering as true
// neutral gray, while a vivid accent (purple, teal, etc.) visibly tints the
// whole interface — not just the accent color itself.
function getNeutralSurfaceTones(accentHex, isDark) {
  const { h, s: accentSat } = hexToHsl(accentHex);
  const surfaceSat = Math.min(45, accentSat * 1.0);
  const outlineSat = Math.min(30, accentSat * 0.8);
  const textSat = Math.min(12, accentSat * 0.3);
  if (isDark) {
    return {
      '--bg-color': hslToHex(h, surfaceSat, 6),
      '--surface-bg': hslToHex(h, surfaceSat, 11),
      '--surface-card': hslToHex(h, surfaceSat, 13),
      '--surface-container-low': hslToHex(h, surfaceSat, 10),
      '--surface-container': hslToHex(h, surfaceSat, 13),
      '--surface-container-high': hslToHex(h, surfaceSat, 17),
      '--surface-container-highest': hslToHex(h, surfaceSat, 22),
      '--outline-variant': hslToHex(h, outlineSat, 28),
      '--border-color': hslToHex(h, outlineSat, 28),
      '--text-color': hslToHex(h, textSat, 88),
      '--text-secondary': hslToHex(h, textSat, 76)
    };
  }
  return {
    '--bg-color': hslToHex(h, surfaceSat, 99),
    '--surface-bg': hslToHex(h, surfaceSat, 93),
    '--surface-card': hslToHex(h, surfaceSat, 97),
    '--surface-container-low': hslToHex(h, surfaceSat, 97),
    '--surface-container': hslToHex(h, surfaceSat, 95),
    '--surface-container-high': hslToHex(h, surfaceSat, 93),
    '--surface-container-highest': hslToHex(h, surfaceSat, 91),
    '--outline-variant': hslToHex(h, outlineSat, 76),
    '--border-color': hslToHex(h, outlineSat, 86),
    '--text-color': hslToHex(h, textSat, 10),
    '--text-secondary': hslToHex(h, textSat, 28)
  };
}

function getUiAccentColor(theme) {
  if (theme.accent === 'custom') {
    return normalizeHexColor(theme.customAccent, UI_THEME_ACCENTS.neutral);
  }
  return UI_THEME_ACCENTS[theme.accent] || UI_THEME_ACCENTS.neutral;
}

function applyUiTheme(theme) {
  const root = document.documentElement.style;
  const accent = getUiAccentColor(theme);
  const onAccent = colorIsLight(accent) ? '#000000' : '#ffffff';
  const hover = shiftHexColor(accent, colorIsLight(accent) ? -32 : 24);
  root.setProperty('--primary-color', accent);
  root.setProperty('--primary-color-text', onAccent);
  root.setProperty('--primary-hover', hover);
  root.setProperty('--input-focus-shadow', hexToRgba(accent, 0.16));
  root.setProperty('--primary-gradient', `linear-gradient(135deg, ${accent} 0%, ${hover} 100%)`);
  root.setProperty('--accent-glow', `0 0 12px ${hexToRgba(accent, 0.22)}`);
  root.setProperty('--table-hover-bg', hexToRgba(accent, 0.05));
  root.setProperty('--badge-color-bg', hexToRgba(accent, 0.12));
  root.setProperty('--badge-color-text', accent);
  root.setProperty('--badge-image-bg', hexToRgba(accent, 0.14));
  root.setProperty('--badge-image-text', accent);
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const surfaces = getNeutralSurfaceTones(accent, isDark);
  Object.keys(surfaces).forEach((name) => root.setProperty(name, surfaces[name]));
  if (theme.disableAnimation) {
    document.documentElement.classList.add('pagedye-no-animation');
  } else {
    document.documentElement.classList.remove('pagedye-no-animation');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // Translations
  const i18n = {
    en: {
      title: "PageDye Settings",
      appName: "PageDye",
      bgType: "Background Type",
      typeNone: "None",
      typeColor: "Color",
      typeImage: "Image",
      typeEffect: "Effects",
      effectKind: "Effect",
      effectKindHint: "A minimalist black & white animated wallpaper, rendered locally with Canvas — no external assets.",
      customEffectsOptgroup: "Custom",
      untitledEffect: "Untitled Effect",
      manageCustomEffects: "Manage custom effects…",
      effectMatrix: "Matrix",
      effectParticles: "Particles",
      effectWaves: "Waves",
      effectStarfield: "Starfield",
      effectRipple: "Ripple",
      effectAurora: "Aurora",
      effectSnow: "Snow",
      effectBubbles: "Bubbles",
      effectConstellation: "Constellation",
      effectFireflies: "Fireflies",
      effectGridPulse: "Grid Pulse",
      effectRain: "Rain",
      effectConfetti: "Confetti",
      effectPlasma: "Plasma",
      effectVortex: "Vortex",
      effectTypewriter: "Typewriter",
      effectText: "Text",
      effectColorScheme: "Color Preset",
      effectColorSchemeHint: "Auto follows your system's light/dark setting live.",
      effectSchemeAuto: "Auto",
      effectSchemeLight: "Light",
      effectSchemeDark: "Dark",
      effectSchemeCustom: "Custom",
      effectColor: "Color",
      effectBgColor: "Background Color",
      effectDensity: "Density",
      effectSpeed: "Speed",
      effectOverlayEnable: "Layer an animated effect",
      effectOverlayHint: "Adds an animated Canvas wallpaper on top — combine with Solid, Gradient or Image, or use alone.",
      color: "Color",
      selectColor: "Select Color",
      opacity: "Opacity",
      blur: "Blur",
      fixed: "Fixed Position",
      sizeCover: "Cover",
      sizeContain: "Contain",
      sizeAuto: "Auto",
      sizeStretch: "Stretch",
      repeat: "Repeat",
      reset: "Reset",
      save: "Save",
      saved: "Saved!",
      resetMsg: "Reset!",
      error: "Error saving!",
      noTab: "No Active Tab",
      invalidUrl: "Invalid URL",
      restrictedTitle: "PageDye can't run here",
      restrictedMessage: "This page is blocked by browser security restrictions. PageDye has been disabled for this tab.",
      disabledTitle: "PageDye is turned off",
      disabledMessage: "Turn PageDye back on to use wallpapers, frosted glass, custom cursor, Deep Compatibility Mode, and debug tools.",
      disabledEnableButton: "Turn PageDye back on",
      extensionPowerKicker: "Extension power",
      extensionPowerTitle: "PageDye is on",
      extensionPowerHint: "Turn it off to stop all PageDye features on every page.",
      targetSite: "This Site",
      targetDefault: "Default (All Sites)",
      targetHintInherited: "This site has no settings of its own — showing the global default. Editing will save a config just for this site.",
      targetHintDefault: "Applies to every site that doesn't have its own settings.",
      tabWallpaper: "Wallpaper",
      tabFrostedGlass: "Frosted Glass",
      advanced: "Advanced",
      uiThemeColor: "Interface Theme Color",
      uiThemeColorHint: "Changes PageDye popup and settings colors only. Websites stay unchanged.",
      targetSelector: "Background Selector",
      targetSelectorHint: "Pick an element (or type a CSS selector) and PageDye applies your color/image directly to that element instead of the whole page. Leave empty for a full-page background.",
      performanceMode: "Performance",
      performanceModeHint: "Auto reduces animation work on low-power devices. Low caps effects at 30 FPS.",
      performanceAuto: "Auto",
      performanceLow: "Low power (30 FPS)",
      performanceHigh: "Full frame rate",
      temporaryPauseHint: "Tip: Use your configured shortcut to temporarily pause PageDye in this tab. It resets when the page reloads.",
      pickElement: "Pick",
      deepCompat: "Deep Compatibility Mode",
      runMode: "Run Mode",
      runModeNormal: "Normal",
      runModeEnhanced: "Enhanced",
      runModeStrong: "Strong",
      pickerTipMultiple: "PageDye: click elements to exclude them · Esc to finish",
      pickerTipSingle: "PageDye: click an element to apply your background to it · Esc to cancel",
      deepCompatBadge: "For stubborn sites",
      deepCompatEnable: "Enable for this site",
      deepCompatHint: "Force display on stubborn sites with opaque layers (e.g. Google Search).",
      deepCompatAggressiveEnable: "Forceful compatibility mode",
      deepCompatAggressiveHint: "More aggressive: checks DOM/style changes very frequently and restores PageDye overrides. Use only on hostile sites; it may use more CPU.",
      excludeControls: "Exclude elements:",
      addExclude: "+ Add Manual",
      pickExclude: "Pick Elements",
      deepCompatExcludePlaceholder: ".modal, [role=dialog]",
      frostedGlass: "Frosted Glass",
      frostedGlassHint: "Pick a card/container element and PageDye makes its background semi-transparent and blurred, so your wallpaper shows through underneath it.",
      frostedBlur: "Blur",
      frostedOpacity: "Tint",
      frostedCustomColor: "Custom Color",
      frostedAddBtn: "+ Add element",
      customCursor: "Custom Cursor",
      cursorEnable: "Enable for this site",
      cursorHint: "Replace the page pointer with a custom shape. Desktop with a mouse only.",
      cursorPreset: "Shape",
      cursorPresetBall: "Ball",
      cursorPresetRing: "Ring",
      cursorPresetGlow: "Glow Orb",
      cursorPresetDotRing: "Dot & Ring",
      cursorColor: "Color",
      cursorSize: "Size",
      cursorHoverScale: "Hover Enlarge",
      cursorSmoothing: "Smooth Movement",
      cursorSmoothingHint: "Cursor eases toward the pointer instead of tracking it exactly. Off by default for precise clicking.",
      cursorTrailEnable: "Mouse Trail",
      cursorTrailStyle: "Trail Style",
      cursorTrailFade: "Fade",
      cursorTrailComet: "Comet",
      cursorTrailSparkle: "Sparkle",
      cursorTrailLength: "Length",
      cursorTrailSpeed: "Speed",
      customCss: "Custom CSS",
      customCssHint: "Injected into this site. Use !important to override stubborn styles.",
      pickerFailed: "Can't pick on this page",
      wallpaperMode: "Wallpaper Mode",
      modeSingle: "Single",
      modeAuto: "Auto",
      modeTimeRange: "Time",
      modeSlideshow: "Slide",
      rotationInterval: "Interval",
      intervalOpen: "Each Open",
      interval15m: "15 Mins",
      interval30m: "30 Mins",
      interval1h: "1 Hour",
      interval24h: "1 Day",
      randomOrder: "Random Order",
      wallpapersList: "Wallpapers",
      selectSchemeToEdit: "Select background to edit",
      selectTimeToEdit: "Select background to edit",
      schemeMorning: "Morning",
      schemeNoon: "Noon",
      schemeDusk: "Dusk",
      schemeNight: "Night",
      timeRangeSettingsTitle: "Custom Time Ranges",
      labelPeriodName: "Period Name:",
      labelPeriodRange: "Time Range:",
      statusSynced: "Synced",
      statusSaving: "Saving...",
      dragOrClick: "Drag image here, or",
      chooseFile: "choose file",
      orPasteUrl: "Or paste image URL",
      adjustStyles: "Adjust Styles",
      activeImage: "Wallpaper Image",
      savedImage: "Saved Image",
      advancedFilters: "Advanced Filters",
      filtersReset: "Reset",
      filterBrightness: "Brightness",
      filterContrast: "Contrast",
      filterGrayscale: "Grayscale",
      filterHue: "Hue Rotate",
      filterInvert: "Invert",
      colorModeSolid: "Solid",
      colorModeGradient: "Gradient",
      presetSchemeLight: "Light",
      presetSchemeDark: "Dark",
      gradientLinear: "Linear",
      gradientRadial: "Radial",
      gradientAngle: "Angle",
      gradientShape: "Shape",
      gradientShapeCircle: "Circle",
      gradientShapeEllipse: "Ellipse",
      gradientStops: "Color Stops",
      gradientAddStop: "+ Add Stop",
      gradientRemoveStop: "Remove stop",
      gradientPresets: "Style Palette",
      gradientExtractFromImage: "Extract from wallpaper",
      gradientExtractDisabledHint: "Set an image first to extract colors from it",
      gradientExtractFailed: "Couldn't read colors from this image",
      gradientGenerateFromColor: "Generate from color",
      gradientAnimated: "Animated",
      gradientSpeed: "Speed"
    },
    zh: {
      title: "PageDye 设置",
      appName: "PageDye",
      bgType: "背景类型",
      typeNone: "无",
      typeColor: "颜色",
      typeImage: "图片",
      typeEffect: "动效",
      effectKind: "特效",
      effectKindHint: "极简黑白动态壁纸，完全通过 Canvas 本地渲染，不依赖任何外部资源。",
      customEffectsOptgroup: "自定义",
      untitledEffect: "未命名动效",
      manageCustomEffects: "管理自定义动效…",
      effectMatrix: "代码雨",
      effectParticles: "粒子",
      effectWaves: "波浪",
      effectStarfield: "星空穿梭",
      effectRipple: "水波纹",
      effectAurora: "极光",
      effectSnow: "雪花",
      effectBubbles: "气泡",
      effectConstellation: "星座",
      effectFireflies: "萤火虫",
      effectGridPulse: "网格脉冲",
      effectRain: "雨丝",
      effectConfetti: "彩纸",
      effectPlasma: "流光",
      effectVortex: "漩涡",
      effectTypewriter: "打字机",
      effectText: "文字内容",
      effectColorScheme: "颜色预置",
      effectColorSchemeHint: "自动会实时跟随系统的浅色/深色设置。",
      effectSchemeAuto: "自动",
      effectSchemeLight: "浅色",
      effectSchemeDark: "深色",
      effectSchemeCustom: "自定义",
      effectColor: "颜色",
      effectBgColor: "背景颜色",
      effectDensity: "密度",
      effectSpeed: "速度",
      effectOverlayEnable: "叠加动效",
      effectOverlayHint: "在背景上叠加一层动画 Canvas 壁纸——可以和纯色、渐变、图片任意组合，也可以单独使用。",
      color: "颜色",
      selectColor: "选择颜色",
      opacity: "不透明度",
      blur: "模糊度",
      fixed: "固定背景",
      sizeCover: "覆盖 (Cover)",
      sizeContain: "包含 (Contain)",
      sizeAuto: "自动 (Auto)",
      sizeStretch: "拉伸 (Stretch)",
      repeat: "平铺",
      reset: "重置",
      save: "保存",
      saved: "已保存!",
      resetMsg: "已重置!",
      error: "保存失败!",
      noTab: "无活动标签页",
      invalidUrl: "无效的链接",
      restrictedTitle: "PageDye 无法在此页面运行",
      restrictedMessage: "由于浏览器安全限制，PageDye 无法作用于当前标签页，已自动禁用。",
      targetSite: "此网站",
      targetDefault: "全站默认",
      targetHintInherited: "当前网站没有单独设置，正在使用全局默认背景。修改后将为此网站单独保存。",
      targetHintDefault: "应用于所有没有单独设置背景的网站。",
      tabWallpaper: "壁纸",
      tabFrostedGlass: "磨砂玻璃",
      advanced: "高级设置",
      targetSelector: "背景选择器",
      targetSelectorHint: "拾取一个元素（或手动输入 CSS 选择器），PageDye 会把颜色/图片直接应用到该元素，而不是整页。留空则为整页背景。",
      performanceMode: "性能",
      performanceModeHint: "自动模式会在低性能设备上降低动画开销；低功耗模式会把动效限制为 30 FPS。",
      performanceAuto: "自动",
      performanceLow: "低功耗（30 FPS）",
      performanceHigh: "完整帧率",
      temporaryPauseHint: "提示：使用你设置的快捷键可在当前标签页临时暂停 PageDye；刷新页面后会自动恢复。",
      pickElement: "拾取",
      deepCompat: "深度兼容模式",
      runMode: "运行模式",
      runModeNormal: "普通",
      runModeEnhanced: "增强",
      runModeStrong: "强兼",
      pickerTipMultiple: "PageDye: 点击多个元素以排除它们 · 按 Esc 完成",
      pickerTipSingle: "PageDye: 点击一个元素以应用背景 · 按 Esc 取消",
      deepCompatBadge: "顽固网站专用",
      deepCompatEnable: "为此网站启用",
      deepCompatHint: "强制在存在不透明遮挡的顽固网页上显示壁纸（如 Google 搜索页）。",
      excludeControls: "排除以下元素：",
      addExclude: "+ 手动添加",
      pickExclude: "拾取元素",
      deepCompatExcludePlaceholder: ".modal, [role=dialog]",
      frostedGlass: "磨砂玻璃",
      frostedGlassHint: "拾取一个卡片/容器元素，PageDye 会让它的背景变为半透明并加上模糊效果，让底层的壁纸若隐若现地透上来。",
      frostedBlur: "模糊度",
      frostedOpacity: "透明度",
      frostedCustomColor: "自定义颜色",
      frostedAddBtn: "+ 添加元素",
      customCursor: "自定义光标",
      cursorEnable: "为此网站启用",
      cursorHint: "用自定义形状替换页面指针。仅在使用鼠标的桌面设备上生效。",
      cursorPreset: "形状",
      cursorPresetBall: "实心球",
      cursorPresetRing: "空心环",
      cursorPresetGlow: "发光球",
      cursorPresetDotRing: "点环组合",
      cursorColor: "颜色",
      cursorSize: "大小",
      cursorHoverScale: "悬停放大",
      cursorSmoothing: "平滑跟随",
      cursorSmoothingHint: "光标会缓动跟随指针，而非精确对齐。默认关闭以保证点击精准。",
      cursorTrailEnable: "鼠标拖尾",
      cursorTrailStyle: "拖尾样式",
      cursorTrailFade: "渐隐",
      cursorTrailComet: "彗星",
      cursorTrailSparkle: "闪烁",
      cursorTrailLength: "长度",
      cursorTrailSpeed: "速度",
      customCss: "自定义 CSS",
      customCssHint: "将注入到本网站。可用 !important 覆盖顽固样式。",
      pickerFailed: "此页面无法拾取",
      wallpaperMode: "壁纸模式",
      modeSingle: "单一",
      modeAuto: "昼夜",
      modeTimeRange: "时段",
      modeSlideshow: "幻灯",
      rotationInterval: "轮换间隔",
      intervalOpen: "每次打开",
      interval15m: "15分钟",
      interval30m: "30分钟",
      interval1h: "1小时",
      interval24h: "1天",
      randomOrder: "随机顺序",
      wallpapersList: "壁纸列表",
      selectSchemeToEdit: "选择要编辑的背景",
      selectTimeToEdit: "选择要编辑的背景",
      schemeMorning: "清晨",
      schemeNoon: "正午",
      schemeDusk: "黄昏",
      schemeNight: "深夜",
      timeRangeSettingsTitle: "自定义时段范围",
      labelPeriodName: "时段名称:",
      labelPeriodRange: "时间范围:",
      statusSynced: "配置已同步",
      statusSaving: "正在保存...",
      dragOrClick: "拖拽图片至此，或",
      chooseFile: "选择文件",
      orPasteUrl: "或输入图片链接",
      adjustStyles: "调整壁纸样式",
      activeImage: "当前图片",
      savedImage: "已保存的壁纸",
      advancedFilters: "高级滤镜",
      filtersReset: "重置",
      filterBrightness: "亮度",
      filterContrast: "对比度",
      filterGrayscale: "灰度",
      filterHue: "色相旋转",
      filterInvert: "反色",
      colorModeSolid: "纯色",
      colorModeGradient: "渐变",
      presetSchemeLight: "浅色",
      presetSchemeDark: "深色",
      gradientLinear: "线性",
      gradientRadial: "径向",
      gradientAngle: "角度",
      gradientShape: "形状",
      gradientShapeCircle: "圆形",
      gradientShapeEllipse: "椭圆形",
      gradientStops: "颜色节点",
      gradientAddStop: "+ 添加节点",
      gradientRemoveStop: "删除此节点",
      gradientPresets: "风格调色板",
      gradientExtractFromImage: "从壁纸提取",
      gradientExtractDisabledHint: "请先设置图片才能提取颜色",
      gradientExtractFailed: "无法从该图片提取颜色",
      gradientGenerateFromColor: "从颜色生成",
      gradientAnimated: "流动动画",
      gradientSpeed: "速度"
    }
  };

  // Elements
  const els = {
    domainBadge: document.getElementById('current-domain'),
    targetTabs: document.getElementsByName('targetTab'),
    targetHint: document.getElementById('target-hint'),
    bgTypes: document.getElementsByName('bgType'),
    sectionColor: document.getElementById('section-color'),
    sectionImage: document.getElementById('section-image'),
    sectionEffects: document.getElementById('section-effects'),
    effectOverlayToggle: document.getElementById('effect-overlay-toggle'),
    effectKind: document.getElementById('effect-kind'),
    manageCustomEffectsLink: document.getElementById('manage-custom-effects-link'),
    effectTextControl: document.getElementById('effect-text-control'),
    effectText: document.getElementById('effect-text'),
    effectColorScheme: document.getElementById('effect-color-scheme'),
    effectColorCustomControl: document.getElementById('effect-color-custom-control'),
    effectColor: document.getElementById('effect-color'),
    effectColorText: document.getElementById('effect-color-text'),
    effectBgColor: document.getElementById('effect-bg-color'),
    effectBgColorText: document.getElementById('effect-bg-color-text'),
    effectBgColorGroup: document.getElementById('effect-bg-color-group'),
    effectDensity: document.getElementById('effect-density'),
    effectDensityVal: document.getElementById('effect-density-val'),
    effectSpeed: document.getElementById('effect-speed'),
    effectSpeedVal: document.getElementById('effect-speed-val'),
    sectionStyles: document.getElementById('section-styles'),
    colorPicker: document.getElementById('color-picker'),
    colorText: document.getElementById('color-text'),
    imageUrl: document.getElementById('image-url'),
    dropArea: document.getElementById('drop-area'),
    fileInput: document.getElementById('image-file'),
    fileInfo: document.getElementById('file-info'),
    fileName: document.querySelector('.filename'),
    removeFileBtn: document.getElementById('remove-file'),
    
    // Preview
    imagePreview: document.getElementById('image-preview'),
    imagePreviewBg: document.getElementById('image-preview-bg'),
    
    opacity: document.getElementById('opacity'),
    opacityVal: document.getElementById('opacity-val'),
    blur: document.getElementById('blur'),
    blurVal: document.getElementById('blur-val'),
    blurControl: document.getElementById('blur-control'),
    bgFixed: document.getElementById('bg-fixed'),
    bgSize: document.getElementById('bg-size'),
    bgRepeat: document.getElementById('bg-repeat'),
    imageOptions: document.getElementById('image-options'),

    // Gradient
    colorModes: document.getElementsByName('colorMode'),
    solidColorPanel: document.getElementById('solid-color-panel'),
    gradientPanel: document.getElementById('gradient-panel'),
    gradientPreviewBg: document.getElementById('gradient-preview-bg'),
    gradientKinds: document.getElementsByName('gradientKind'),
    gradientAngleControl: document.getElementById('gradient-angle-control'),
    gradientAngle: document.getElementById('gradient-angle'),
    gradientAngleVal: document.getElementById('gradient-angle-val'),
    gradientShapeControl: document.getElementById('gradient-shape-control'),
    gradientShape: document.getElementById('gradient-shape'),
    gradientStopsList: document.getElementById('gradient-stops-list'),
    gradientAddStop: document.getElementById('gradient-add-stop'),
    gradientPresetsGrid: document.getElementById('gradient-presets-grid'),
    gradientExtractBtn: document.getElementById('gradient-extract-btn'),
    gradientGenerateBtn: document.getElementById('gradient-generate-btn'),
    gradientAnimated: document.getElementById('gradient-animated'),
    gradientSpeedControl: document.getElementById('gradient-speed-control'),
    gradientSpeed: document.getElementById('gradient-speed'),
    gradientSpeedVal: document.getElementById('gradient-speed-val'),

    // Advanced
    targetSelector: document.getElementById('target-selector'),
    performanceMode: document.getElementById('performance-mode'),
    pickBtn: document.getElementById('pick-btn'),
    deepCompatModes: document.getElementsByName('deepCompatMode'),
    runModeBadge: document.getElementById('run-mode-badge'),
    deepCompatExcludeList: document.getElementById('deep-compat-exclude-list'),
    deepCompatAddBtn: document.getElementById('deep-compat-add-btn'),
    deepCompatPickBtn: document.getElementById('deep-compat-pick-btn'),
    uiThemeColorGrid: document.getElementById('ui-theme-color-grid'),
    uiThemeCustomColor: document.getElementById('ui-theme-custom-color'),
    uiThemeCustomColorText: document.getElementById('ui-theme-custom-color-text'),
    frostedList: document.getElementById('frosted-list'),
    frostedAddBtn: document.getElementById('frosted-add-btn'),
    cursorToggle: document.getElementById('cursor-toggle'),
    cursorPresetsGrid: document.getElementById('cursor-presets-grid'),
    cursorColor: document.getElementById('cursor-color'),
    cursorColorText: document.getElementById('cursor-color-text'),
    cursorSize: document.getElementById('cursor-size'),
    cursorSizeVal: document.getElementById('cursor-size-val'),
    cursorHoverScale: document.getElementById('cursor-hover-scale'),
    cursorHoverScaleVal: document.getElementById('cursor-hover-scale-val'),
    cursorSmoothingToggle: document.getElementById('cursor-smoothing-toggle'),
    cursorTrailToggle: document.getElementById('cursor-trail-toggle'),
    cursorTrailOptions: document.getElementById('cursor-trail-options'),
    cursorTrailStyle: document.getElementById('cursor-trail-style'),
    cursorTrailLength: document.getElementById('cursor-trail-length'),
    cursorTrailLengthVal: document.getElementById('cursor-trail-length-val'),
    cursorTrailSpeed: document.getElementById('cursor-trail-speed'),
    cursorTrailSpeedVal: document.getElementById('cursor-trail-speed-val'),
    customCss: document.getElementById('custom-css'),
    settingsBtn: document.getElementById('settings-btn'),

    resetBtn: document.getElementById('reset-btn'),

    // Modes & Schemes
    wpModes: document.getElementsByName('wpMode'),
    schemeCardsContainer: document.getElementById('scheme-cards-container'),
    cardSchemeLight: document.getElementById('card-scheme-light'),
    cardSchemeDark: document.getElementById('card-scheme-dark'),
    previewCardLight: document.getElementById('preview-card-light'),
    previewCardDark: document.getElementById('preview-card-dark'),

    timeCardsContainer: document.getElementById('time-cards-container'),
    timePeriodsList: document.getElementById('time-periods-list'),
    timePeriodName: document.getElementById('time-period-name'),
    timePeriodStart: document.getElementById('time-period-start'),
    timePeriodEnd: document.getElementById('time-period-end'),
    timeRangePeriodEditFields: document.getElementById('time-range-period-edit-fields'),
    
    slideshowConfigPanel: document.getElementById('slideshow-config-panel'),
    slideshowInterval: document.getElementById('slideshow-interval'),
    slideshowRandom: document.getElementById('slideshow-random'),
    wallpapersGrid: document.getElementById('wallpapers-grid'),
    statusDot: document.getElementById('status-dot'),
    statusText: document.getElementById('status-text'),
    restrictedOverlay: document.getElementById('restricted-page-overlay'),
    restrictedEnableBtn: document.getElementById('restricted-enable-btn'),
    extensionEnabledToggle: document.getElementById('extension-enabled-toggle')
  };

  function setAccordionOpen(details, open, animate = true) {
    const content = details && details.querySelector(':scope > .accordion-content');
    if (!details || !content) return;

    if (details.open === open && !details.classList.contains('accordion-animating')) return;
    details._pagedyeAccordionOpenTarget = open;

    if (details._pagedyeAccordionAnimation) {
      details._pagedyeAccordionAnimation.cancel();
      details._pagedyeAccordionAnimation = null;
    }

    const shouldAnimate = animate && !document.documentElement.classList.contains('pagedye-no-animation') && content.animate;
    if (!shouldAnimate) {
      details.open = open;
      content.style.height = '';
      content.style.overflow = '';
      content.style.opacity = '';
      details.classList.remove('accordion-animating');
      return;
    }

    details.classList.add('accordion-animating');

    if (open) {
      content.style.height = '0px';
      content.style.overflow = 'hidden';
      details.open = true;
      const targetHeight = content.scrollHeight;
      details._pagedyeAccordionAnimation = content.animate(
        [{ height: '0px', opacity: 0.35 }, { height: targetHeight + 'px', opacity: 1 }],
        { duration: 220, easing: 'cubic-bezier(.22,1,.36,1)' }
      );
    } else {
      const startHeight = content.scrollHeight;
      content.style.height = startHeight + 'px';
      content.style.overflow = 'hidden';
      details._pagedyeAccordionAnimation = content.animate(
        [{ height: startHeight + 'px', opacity: 1 }, { height: '0px', opacity: 0.35 }],
        { duration: 170, easing: 'ease' }
      );
    }

    details._pagedyeAccordionAnimation.onfinish = () => {
      details.open = open;
      content.style.height = '';
      content.style.overflow = '';
      content.style.opacity = '';
      details.classList.remove('accordion-animating');
      details._pagedyeAccordionAnimation = null;
      details._pagedyeAccordionOpenTarget = open;
    };
  }

  function handleAccordionSummaryClick(e) {
    const summary = e.target.closest('.accordion-summary');
    if (!summary) return;
    const details = summary.closest('.accordion');
    if (!details || !details.contains(summary)) return;
    e.preventDefault();
    const currentTarget = typeof details._pagedyeAccordionOpenTarget === 'boolean'
      ? details._pagedyeAccordionOpenTarget
      : details.open;
    setAccordionOpen(details, !currentTarget);
  }

  document.addEventListener('click', handleAccordionSummaryClick);

  function syncUiThemeControls() {
    if (els.uiThemeCustomColor) {
      els.uiThemeCustomColor.value = normalizeHexColor(currentUiTheme.customAccent, UI_THEME_ACCENTS.neutral);
    }
    if (els.uiThemeCustomColorText) {
      els.uiThemeCustomColorText.value = normalizeHexColor(currentUiTheme.customAccent, UI_THEME_ACCENTS.neutral);
    }
    if (els.uiThemeColorGrid) {
      els.uiThemeColorGrid.querySelectorAll('.theme-color-dot').forEach((dot) => {
        dot.classList.toggle('active', (currentUiTheme.accent || 'neutral') === dot.dataset.themeAccent);
      });
    }
  }

  async function saveUiTheme(partial) {
    currentUiTheme = Object.assign({}, currentUiTheme, partial);
    applyUiTheme(currentUiTheme);
    syncUiThemeControls();
    const existing = await chrome.storage.local.get(UI_THEME_KEY);
    const next = Object.assign({}, existing[UI_THEME_KEY] || {}, currentUiTheme);
    await chrome.storage.local.set({ [UI_THEME_KEY]: next });
  }

  function initUiThemeControls() {
    syncUiThemeControls();
    if (els.uiThemeColorGrid) {
      els.uiThemeColorGrid.addEventListener('click', (e) => {
        const dot = e.target.closest('.theme-color-dot');
        if (!dot) return;
        saveUiTheme({ accent: dot.dataset.themeAccent || 'neutral' });
      });
    }

    const onCustomAccentChange = (value) => {
      const color = normalizeHexColor(value, currentUiTheme.customAccent || UI_THEME_ACCENTS.neutral);
      saveUiTheme({ accent: 'custom', customAccent: color });
    };
    if (els.uiThemeCustomColor) {
      els.uiThemeCustomColor.addEventListener('input', (e) => onCustomAccentChange(e.target.value));
    }
    if (els.uiThemeCustomColorText) {
      els.uiThemeCustomColorText.addEventListener('change', (e) => {
        if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) onCustomAccentChange(e.target.value);
      });
    }
  }

  function deepCompatModeFromSettings(settings) {
    if (settings && settings.deepCompatAggressive) return 'strong';
    if (settings && settings.deepCompat) return 'enhanced';
    return 'normal';
  }

  function syncDeepCompatRunMode(mode) {
    const nextMode = mode || 'normal';
    const radio = document.querySelector(`input[name="deepCompatMode"][value="${nextMode}"]`);
    if (radio) radio.checked = true;
    if (els.runModeBadge) {
      const labelKey = nextMode === 'strong' ? 'runModeStrong' : nextMode === 'enhanced' ? 'runModeEnhanced' : 'runModeNormal';
      els.runModeBadge.textContent = t(labelKey);
    }
  }

  function collectDeepCompatRunMode() {
    const checked = document.querySelector('input[name="deepCompatMode"]:checked');
    const mode = checked ? checked.value : 'normal';
    currentSettings.deepCompat = mode !== 'normal';
    currentSettings.deepCompatAggressive = mode === 'strong';
    syncDeepCompatRunMode(mode);
  }

  // Sends a message to the tab's content script, injecting it first if it is
  // not reachable (page predates the extension, or the extension was reloaded
  // while the tab stayed open). Requires the "scripting" permission.
  async function sendToTab(tabId, message) {
    try {
      await chrome.scripting.executeScript({ target: { tabId }, files: ['scripts/gradient.js', 'scripts/effects.js', 'scripts/cursor.js', 'scripts/content.js'] });
    } catch (e) {
      // Injection can fail on restricted pages (chrome://, Web Store, etc.).
    }
    return await chrome.tabs.sendMessage(tabId, message);
  }

  async function canRunOnTab(tab) {
    if (!tab || !tab.id || !tab.url) return false;
    let url;
    try {
      url = new URL(tab.url);
    } catch (e) {
      return false;
    }
    if (!['http:', 'https:', 'file:'].includes(url.protocol)) return false;
    try {
      await sendToTab(tab.id, { action: 'pagedyePing' });
      return true;
    } catch (e) {
      return false;
    }
  }

  function showRestrictedPageState() {
    setOverlayMessage(t('restrictedTitle'), t('restrictedMessage'), false);
    document.body.classList.add('pagedye-restricted-page');
    if (els.restrictedOverlay) {
      els.restrictedOverlay.classList.remove('hidden');
    }
    if (els.statusDot) {
      els.statusDot.classList.remove('saving');
      els.statusDot.classList.add('blocked');
    }
    if (els.statusText) {
      els.statusText.textContent = t('restrictedTitle');
    }
    disableAll();
  }

  function setOverlayMessage(title, message, canEnable) {
    if (!els.restrictedOverlay) return;
    const titleEl = els.restrictedOverlay.querySelector('strong');
    const messageEl = els.restrictedOverlay.querySelector('p');
    if (titleEl) titleEl.textContent = title;
    if (messageEl) messageEl.textContent = message;
    if (els.restrictedEnableBtn) {
      els.restrictedEnableBtn.classList.toggle('hidden', !canEnable);
      els.restrictedEnableBtn.textContent = t('disabledEnableButton');
    }
  }

  function showExtensionDisabledState() {
    setOverlayMessage(t('disabledTitle'), t('disabledMessage'), true);
    document.body.classList.add('pagedye-restricted-page');
    if (els.restrictedOverlay) {
      els.restrictedOverlay.classList.remove('hidden');
    }
    if (els.extensionEnabledToggle) {
      els.extensionEnabledToggle.checked = false;
    }
    if (els.statusDot) {
      els.statusDot.classList.remove('saving');
      els.statusDot.classList.add('blocked');
    }
    if (els.statusText) {
      els.statusText.textContent = t('disabledTitle');
    }
    disableAll();
  }

  async function setExtensionEnabled(enabled) {
    await chrome.storage.local.set({ [EXTENSION_ENABLED_KEY]: !!enabled });
    if (!enabled) {
      showExtensionDisabledState();
      return;
    }
    window.location.reload();
  }

  const CUSTOM_EFFECTS_KEY = '__pagedye_custom_effects__';
  const DEFAULT_BG_KEY = '__pagedye_default_background__';

  // State
  let currentDomain = ''; // key currently being edited/saved: siteDomain or DEFAULT_BG_KEY
  let siteDomain = ''; // the active tab's real hostname, always
  let siteHasOwnConfig = false; // whether siteDomain has its own saved entry (vs. inheriting the default)
  let currentImageBase64 = null;
  let lang = 'en';
  let activeScheme = 'light';
  let activeTimePeriodIndex = 0;
  let activeSlideshowIndex = 0;
  let currentSettings = null;
  let saveDebounceTimer = null;
  let gradientStopsState = [];
  let frostedGlassState = [];
  let cursorPresetState = 'ball';
  let cssEditorController = null;
  let isInitialLoad = true;
  let currentUiTheme = Object.assign({}, UI_THEME_DEFAULTS);

  // Init
  const themeData = await chrome.storage.local.get(UI_THEME_KEY);
  currentUiTheme = Object.assign({}, UI_THEME_DEFAULTS, themeData[UI_THEME_KEY] || {});
  applyUiTheme(currentUiTheme);
  initI18n();
  initUiThemeControls();
  cssEditorController = initCustomCssEditor('custom-css', 'custom-css-editor');
  const gradientKeyframesStyle = document.createElement('style');
  gradientKeyframesStyle.textContent = window.PageDyeGradient.GRADIENT_KEYFRAMES_CSS;
  document.head.appendChild(gradientKeyframesStyle);
  renderGradientPresetsGrid();
  initTimeRangePeriodSelects();
  const versionEl = document.getElementById('version');
  if (versionEl) versionEl.textContent = 'v' + chrome.runtime.getManifest().version;
  if (els.extensionEnabledToggle) {
    els.extensionEnabledToggle.addEventListener('change', () => {
      setExtensionEnabled(els.extensionEnabledToggle.checked);
    });
  }
  if (els.restrictedEnableBtn) {
    els.restrictedEnableBtn.addEventListener('click', () => {
      setExtensionEnabled(true);
    });
  }
  const extensionState = await chrome.storage.local.get(EXTENSION_ENABLED_KEY);
  const extensionEnabled = extensionState[EXTENSION_ENABLED_KEY] !== false;
  if (els.extensionEnabledToggle) {
    els.extensionEnabledToggle.checked = extensionEnabled;
  }
  if (!extensionEnabled) {
    showExtensionDisabledState();
    return;
  }
  await populateCustomEffectOptions(els.effectKind);
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && Object.prototype.hasOwnProperty.call(changes, CUSTOM_EFFECTS_KEY)) {
      populateCustomEffectOptions(els.effectKind);
    }
  });
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.url) {
    try {
      const url = new URL(tab.url);
      siteDomain = url.hostname;
      currentDomain = siteDomain;
      els.domainBadge.textContent = currentDomain;
      els.domainBadge.title = lang === 'zh' ? '点击复制域名' : 'Click to copy domain';
      if (!(await canRunOnTab(tab))) {
        showRestrictedPageState();
        return;
      }
      await loadSettings(currentDomain);

      // Restore last active tab on popup startup
      const lastSelectedPopupTab = localStorage.getItem('pagedye_last_popup_tab') || 'wallpaper';
      const tabRadio = document.querySelector(`input[name="mainTab"][value="${lastSelectedPopupTab}"]`);
      if (tabRadio) tabRadio.checked = true;
      const panelsSlider = document.getElementById('panels-slider');
      if (panelsSlider) {
        panelsSlider.style.transition = 'none';
        panelsSlider.style.transform = lastSelectedPopupTab === 'frosted' ? 'translateX(-50%)' : 'translateX(0)';
        panelsSlider.offsetHeight; // trigger reflow
        panelsSlider.style.transition = '';
      }
      const panelWallpaper = document.getElementById('panel-wallpaper');
      const panelFrosted = document.getElementById('panel-frosted');
      if (panelWallpaper) {
        panelWallpaper.classList.toggle('inactive', lastSelectedPopupTab === 'frosted');
      }
      if (panelFrosted) {
        panelFrosted.classList.toggle('inactive', lastSelectedPopupTab !== 'frosted');
      }

      els.targetTabs.forEach(radio => {
        radio.addEventListener('change', () => {
          if (radio.checked) switchTarget(radio.value);
        });
      });
    } catch (e) {
      els.domainBadge.textContent = t('invalidUrl');
      disableAll();
    }
  } else {
    els.domainBadge.textContent = t('noTab');
    disableAll();
  }

  // Event Listeners
  
  // Background Type Switch
  els.bgTypes.forEach(radio => {
    radio.addEventListener('change', () => {
      updateUI(radio.value);
      updateInteractivePreviews();
      triggerImmediateSave();
    });
  });

  // Effects Overlay toggle — independent of the Background type above, so an
  // animated effect can be layered on top of None/Solid/Gradient/Image.
  els.effectOverlayToggle.addEventListener('change', () => {
    // Full opacity makes an effect's flat bgColor look harsh; nudge a
    // still-untouched (100%) slider down the moment the overlay is turned on.
    if (els.effectOverlayToggle.checked && els.opacity.value === '100') {
      els.opacity.value = 85;
      els.opacityVal.textContent = '85%';
    }
    els.sectionEffects.classList.toggle('hidden', !els.effectOverlayToggle.checked);
    updateEffectOverlayUI();
    updateInteractivePreviews();
    triggerImmediateSave();
    if (window.syncFacadeUI) window.syncFacadeUI();
  });

  // Effect kind / color / density / speed
  els.effectKind.addEventListener('change', () => {
    els.effectTextControl.classList.toggle('hidden', els.effectKind.value !== 'typewriter');
    triggerImmediateSave();
  });
  if (els.manageCustomEffectsLink) {
    els.manageCustomEffectsLink.addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('options/options.html') + '#section-custom-effects' });
      window.close();
    });
  }
  els.effectText.addEventListener('input', () => queueAutoSave());
  els.effectColorScheme.addEventListener('change', () => {
    els.effectColorCustomControl.classList.toggle('hidden', els.effectColorScheme.value !== 'custom');
    triggerImmediateSave();
  });
  els.effectColor.addEventListener('input', (e) => {
    els.effectColorText.value = e.target.value;
    queueAutoSave();
  });
  els.effectColorText.addEventListener('input', (e) => {
    els.effectColor.value = e.target.value;
    queueAutoSave();
  });
  els.effectBgColor.addEventListener('input', (e) => {
    els.effectBgColorText.value = e.target.value;
    queueAutoSave();
  });
  els.effectBgColorText.addEventListener('input', (e) => {
    els.effectBgColor.value = e.target.value;
    queueAutoSave();
  });
  els.effectDensity.addEventListener('input', (e) => {
    els.effectDensityVal.textContent = `${e.target.value}%`;
    queueAutoSave();
  });
  els.effectSpeed.addEventListener('input', (e) => {
    els.effectSpeedVal.textContent = `${e.target.value}%`;
    queueAutoSave();
  });

  // Color Picker Sync
  els.colorPicker.addEventListener('input', (e) => {
    els.colorText.value = e.target.value;
    updateInteractivePreviews();
    queueAutoSave();
  });
  els.colorText.addEventListener('input', (e) => {
    els.colorPicker.value = e.target.value;
    updateInteractivePreviews();
    queueAutoSave();
  });

  // Gradient: Solid <-> Gradient sub-mode switch.
  // Note the order below (save, then re-derive the preview) for every
  // *discrete* gradient action in this section: triggerImmediateSave()
  // synchronously runs collectFormTo(), which is what writes the form's
  // gradient into currentSettings[activeSlot] — updateGradientPreview()
  // piggybacks a scheme-card/slideshow-thumbnail refresh (see its own
  // definition) that reads exactly that object, so it must run *after* the
  // save or it renders one action behind. Debounced slider edits (angle,
  // speed, per-stop color/position) keep the opposite order, matching the
  // existing solid-color/opacity slider precedent elsewhere in this file.
  els.colorModes.forEach(radio => {
    radio.addEventListener('change', () => {
      updateColorModeUI(radio.value);
      triggerImmediateSave();
      updateGradientPreview();
    });
  });

  // Gradient: Linear <-> Radial
  els.gradientKinds.forEach(radio => {
    radio.addEventListener('change', () => {
      updateGradientKindUI(radio.value);
      triggerImmediateSave();
      updateGradientPreview();
    });
  });

  els.gradientAngle.addEventListener('input', (e) => {
    els.gradientAngleVal.textContent = `${e.target.value}°`;
    updateGradientPreview();
    queueAutoSave();
  });

  els.gradientShape.addEventListener('change', () => {
    triggerImmediateSave();
    updateGradientPreview();
  });

  els.gradientAnimated.addEventListener('change', (e) => {
    els.gradientSpeedControl.classList.toggle('hidden', !e.target.checked);
    triggerImmediateSave();
    updateGradientPreview();
  });

  els.gradientSpeed.addEventListener('input', (e) => {
    els.gradientSpeedVal.textContent = `${e.target.value}s`;
    updateGradientPreview();
    queueAutoSave();
  });

  els.gradientAddStop.addEventListener('click', () => {
    if (gradientStopsState.length >= window.PageDyeGradient.MAX_STOPS) return;
    const lastPos = gradientStopsState.length ? gradientStopsState[gradientStopsState.length - 1].position : 0;
    gradientStopsState.push({ color: '#ffffff', position: Math.min(100, lastPos + 10) });
    renderGradientStops(gradientStopsState);
    triggerImmediateSave();
    updateGradientPreview();
  });

  // Stop rows are rebuilt on every render, so listeners are delegated on the
  // (stable) parent container rather than attached per-row.
  els.gradientStopsList.addEventListener('input', (e) => {
    const row = e.target.closest('.gradient-stop-row');
    if (!row) return;
    const idx = parseInt(row.dataset.index, 10);
    if (e.target.classList.contains('gradient-stop-color')) {
      row.querySelector('.gradient-stop-hex').value = e.target.value;
      gradientStopsState[idx].color = e.target.value;
    } else if (e.target.classList.contains('gradient-stop-hex')) {
      row.querySelector('.gradient-stop-color').value = e.target.value;
      gradientStopsState[idx].color = e.target.value;
    } else if (e.target.classList.contains('gradient-stop-pos')) {
      gradientStopsState[idx].position = Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0));
    }
    updateGradientPreview();
    queueAutoSave();
  });

  els.gradientStopsList.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.gradient-stop-remove');
    if (!removeBtn) return;
    if (gradientStopsState.length <= window.PageDyeGradient.MIN_STOPS) return;
    const idx = parseInt(removeBtn.closest('.gradient-stop-row').dataset.index, 10);
    gradientStopsState.splice(idx, 1);
    renderGradientStops(gradientStopsState);
    triggerImmediateSave();
    updateGradientPreview();
  });

  els.gradientPresetsGrid.addEventListener('click', (e) => {
    const swatch = e.target.closest('.gradient-preset-swatch');
    if (!swatch) return;
    const preset = window.PageDyeGradient.GRADIENT_PRESETS[parseInt(swatch.dataset.index, 10)];
    populateGradientPanel(Object.assign({ animated: false, speed: 10 }, preset));
    triggerImmediateSave();
    updateGradientPreview();
  });

  els.gradientGenerateBtn.addEventListener('click', () => {
    const seed = els.colorPicker.value;
    const stops = window.PageDyeGradient.clampStops(normalizeToStopObjects(window.PageDyeGradient.generateTonalPalette(seed)));
    renderGradientStops(stops);
    triggerImmediateSave();
    updateGradientPreview();
  });

  els.gradientExtractBtn.addEventListener('click', async () => {
    const imgSrc = currentImageBase64 || els.imageUrl.value;
    if (!imgSrc) return;
    els.gradientExtractBtn.disabled = true;
    const result = await window.PageDyeGradient.extractPaletteFromImage(imgSrc, 5);
    updateGradientExtractButtonState();
    if (!result.ok) {
      els.statusText.textContent = t('gradientExtractFailed');
      setTimeout(setSyncedState, 1800);
      return;
    }
    const stops = window.PageDyeGradient.clampStops(normalizeToStopObjects(result.colors));
    renderGradientStops(stops);
    triggerImmediateSave();
    updateGradientPreview();
  });

  // File Upload
  els.dropArea.addEventListener('click', () => els.fileInput.click());
  els.fileInput.addEventListener('change', handleFileSelect);
  els.dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    els.dropArea.classList.add('dragover');
  });
  els.dropArea.addEventListener('dragleave', () => els.dropArea.classList.remove('dragover'));
  els.dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    els.dropArea.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
      handleFile(e.dataTransfer.files[0]);
    }
  });
  els.removeFileBtn.addEventListener('click', clearFile);

  // Sliders
  els.opacity.addEventListener('input', (e) => {
    els.opacityVal.textContent = `${e.target.value}%`;
    updatePreview();
    updateInteractivePreviews();
    queueAutoSave();
  });
  els.blur.addEventListener('input', (e) => {
    els.blurVal.textContent = `${e.target.value}px`;
    updatePreview();
    updateInteractivePreviews();
    queueAutoSave();
  });

  // Advanced filter sliders (popup)
  const popupFilterDefs = [
    { id: 'filter-brightness', valId: 'filter-brightness-val', unit: '%' },
    { id: 'filter-contrast',   valId: 'filter-contrast-val',   unit: '%' },
    { id: 'filter-grayscale',  valId: 'filter-grayscale-val',  unit: '%' },
    { id: 'filter-hue',        valId: 'filter-hue-val',        unit: 'deg' },
    { id: 'filter-invert',     valId: 'filter-invert-val',     unit: '%' }
  ];
  popupFilterDefs.forEach(({ id, valId, unit }) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', (e) => {
        document.getElementById(valId).textContent = `${e.target.value}${unit}`;
        updatePreview();
        queueAutoSave();
      });
    }
  });

  const popupFiltersResetBtn = document.getElementById('filters-reset');
  if (popupFiltersResetBtn) {
    popupFiltersResetBtn.addEventListener('click', () => {
      document.getElementById('filter-brightness').value = 100;
      document.getElementById('filter-brightness-val').textContent = '100%';
      document.getElementById('filter-contrast').value = 100;
      document.getElementById('filter-contrast-val').textContent = '100%';
      document.getElementById('filter-grayscale').value = 0;
      document.getElementById('filter-grayscale-val').textContent = '0%';
      document.getElementById('filter-hue').value = 0;
      document.getElementById('filter-hue-val').textContent = '0deg';
      document.getElementById('filter-invert').value = 0;
      document.getElementById('filter-invert-val').textContent = '0%';
      updatePreview();
      triggerImmediateSave();
    });
  }


  els.imageUrl.addEventListener('input', (e) => {
    // If user enters a URL, clear local file state
    if (e.target.value) {
      currentImageBase64 = null;
      els.fileInput.value = '';
      els.dropArea.classList.remove('hidden');
      els.fileInfo.classList.add('hidden');
    }
    updatePreview();
    updateInteractivePreviews();
    queueAutoSave();
  });

  // Style Toggles
  els.bgFixed.addEventListener('change', () => triggerImmediateSave());
  els.bgSize.addEventListener('change', () => {
    updatePreview();
    triggerImmediateSave();
  });
  els.bgRepeat.addEventListener('change', () => triggerImmediateSave());

  // Advanced inputs
  els.targetSelector.addEventListener('input', () => queueAutoSave());
  els.performanceMode.addEventListener('change', () => triggerImmediateSave());
  Array.from(els.deepCompatModes || []).forEach((radio) => {
    radio.addEventListener('change', () => {
      syncDeepCompatRunMode(radio.value);
      triggerImmediateSave();
    });
  });
  els.deepCompatAddBtn.addEventListener('click', () => {
    const items = (currentSettings.deepCompatExclude || '').split(',').map(s => s.trim()).filter(Boolean);
    items.push('');
    currentSettings.deepCompatExclude = items.join(', ');
    renderDeepCompatExcludes();
    const inputs = els.deepCompatExcludeList.querySelectorAll('input');
    if (inputs.length) inputs[inputs.length - 1].focus();
  });
  els.customCss.addEventListener('input', () => queueAutoSave());

  // Frosted glass entries are rebuilt on every render, so listeners are
  // delegated on the (stable) parent container rather than attached per-row.
  els.frostedList.addEventListener('input', (e) => {
    const row = e.target.closest('.frosted-entry');
    if (!row) return;
    const idx = parseInt(row.dataset.index, 10);
    if (e.target.classList.contains('frosted-entry-selector')) {
      frostedGlassState[idx].selector = e.target.value;
    } else if (e.target.classList.contains('frosted-entry-blur')) {
      frostedGlassState[idx].blur = parseFloat(e.target.value) || 0;
      row.querySelector('.frosted-entry-blur-val').textContent = `${e.target.value}px`;
    } else if (e.target.classList.contains('frosted-entry-opacity')) {
      frostedGlassState[idx].opacity = parseInt(e.target.value, 10);
      row.querySelector('.frosted-entry-opacity-val').textContent = `${e.target.value}%`;
    } else if (e.target.classList.contains('frosted-entry-color-toggle')) {
      const colorInput = row.querySelector('.frosted-entry-color');
      colorInput.disabled = !e.target.checked;
      frostedGlassState[idx].color = e.target.checked ? colorInput.value : null;
    } else if (e.target.classList.contains('frosted-entry-color')) {
      frostedGlassState[idx].color = e.target.value;
    }
    queueAutoSave();
  });

  els.frostedList.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.frosted-entry-remove');
    if (removeBtn) {
      const idx = parseInt(removeBtn.closest('.frosted-entry').dataset.index, 10);
      frostedGlassState.splice(idx, 1);
      renderFrostedList(frostedGlassState);
      triggerImmediateSave();
      return;
    }
    const pickBtn = e.target.closest('.frosted-entry-pick');
    if (pickBtn) {
      const idx = parseInt(pickBtn.closest('.frosted-entry').dataset.index, 10);
      startFrostedPicker(idx);
    }
  });

  els.frostedAddBtn.addEventListener('click', () => {
    frostedGlassState.push({ selector: '', blur: 12, opacity: 55, color: null });
    renderFrostedList(frostedGlassState);
    triggerImmediateSave();
  });

  // Custom cursor
  els.cursorToggle.addEventListener('change', () => triggerImmediateSave());
  els.cursorPresetsGrid.addEventListener('click', (e) => {
    const swatch = e.target.closest('.cursor-preset-swatch');
    if (!swatch) return;
    cursorPresetState = swatch.dataset.preset;
    els.cursorPresetsGrid.querySelectorAll('.cursor-preset-swatch').forEach((el) => {
      el.classList.toggle('active', el.dataset.preset === cursorPresetState);
    });
    triggerImmediateSave();
  });
  els.cursorColor.addEventListener('input', (e) => {
    els.cursorColorText.value = e.target.value;
    queueAutoSave();
  });
  els.cursorColorText.addEventListener('input', (e) => {
    els.cursorColor.value = e.target.value;
    queueAutoSave();
  });
  els.cursorSize.addEventListener('input', (e) => {
    els.cursorSizeVal.textContent = `${e.target.value}px`;
    queueAutoSave();
  });
  els.cursorHoverScale.addEventListener('input', (e) => {
    els.cursorHoverScaleVal.textContent = `${parseFloat(e.target.value).toFixed(1)}x`;
    queueAutoSave();
  });
  els.cursorSmoothingToggle.addEventListener('change', () => triggerImmediateSave());
  els.cursorTrailToggle.addEventListener('change', (e) => {
    els.cursorTrailOptions.classList.toggle('hidden', !e.target.checked);
    triggerImmediateSave();
  });
  els.cursorTrailStyle.addEventListener('change', () => queueAutoSave());
  els.cursorTrailLength.addEventListener('input', (e) => {
    els.cursorTrailLengthVal.textContent = e.target.value;
    queueAutoSave();
  });
  els.cursorTrailSpeed.addEventListener('input', (e) => {
    els.cursorTrailSpeedVal.textContent = `${e.target.value}%`;
    queueAutoSave();
  });

  // Advanced: element picker
  els.pickBtn.addEventListener('click', startPicker);
  els.deepCompatPickBtn.addEventListener('click', startDeepCompatPicker);

  // Top-level tabs: Wallpaper vs Frosted Glass sliding transition
  const panelWallpaper = document.getElementById('panel-wallpaper');
  const panelFrosted = document.getElementById('panel-frosted');
  const panelsSlider = document.getElementById('panels-slider');

  document.getElementsByName('mainTab').forEach((radio) => {
    radio.addEventListener('change', () => {
      const isFrosted = radio.checked && radio.value === 'frosted';
      localStorage.setItem('pagedye_last_popup_tab', radio.value);
      
      if (panelsSlider) {
        panelsSlider.classList.add('transitioning');
      }
      
      if (panelWallpaper) panelWallpaper.classList.toggle('inactive', isFrosted);
      if (panelFrosted) panelFrosted.classList.toggle('inactive', !isFrosted);
      
      requestAnimationFrame(() => {
        if (panelsSlider) {
          panelsSlider.style.transform = isFrosted ? 'translateX(-50%)' : 'translateX(0)';
        }
      });
    });
  });

  if (panelsSlider) {
    panelsSlider.addEventListener('transitionend', (e) => {
      if (e.target !== panelsSlider || e.propertyName !== 'transform') return;
      panelsSlider.classList.remove('transitioning');
    });
  }

  const wpModeSlider = document.getElementById('wp-mode-slider');
  if (wpModeSlider) {
    wpModeSlider.addEventListener('transitionend', (e) => {
      if (e.target !== wpModeSlider || e.propertyName !== 'transform') return;
      wpModeSlider.classList.remove('transitioning');
    });
  }

  const bgTypeSlider = document.getElementById('bg-type-slider');
  if (bgTypeSlider) {
    bgTypeSlider.addEventListener('transitionend', (e) => {
      if (e.target !== bgTypeSlider || e.propertyName !== 'transform') return;
      bgTypeSlider.classList.remove('transitioning');
    });
  }

  const colorModeSlider = document.getElementById('color-mode-slider');
  if (colorModeSlider) {
    colorModeSlider.addEventListener('transitionend', (e) => {
      if (e.target !== colorModeSlider || e.propertyName !== 'transform') return;
      colorModeSlider.classList.remove('transitioning');
    });
  }

  // Wallpaper Mode Switch
  els.wpModes.forEach(radio => {
    radio.addEventListener('change', () => {
      if (!currentSettings) return;
      
      const prevMode = currentSettings.mode || 'single';
      if (prevMode === 'single') {
        collectFormTo(currentSettings);
      } else if (prevMode === 'auto') {
        collectFormTo(currentSettings[activeScheme]);
      } else if (prevMode === 'timeRange') {
        const activeItem = currentSettings.timeRange.items[activeTimePeriodIndex];
        if (activeItem) {
          collectFormTo(activeItem);
          collectTimeRangeConfigPanel(activeItem);
        }
      } else if (prevMode === 'slideshow') {
        collectFormTo(currentSettings.slideshow.items[activeSlideshowIndex]);
        currentSettings.slideshow.interval = els.slideshowInterval.value;
        currentSettings.slideshow.order = els.slideshowRandom.checked ? 'random' : 'sequential';
      }
      
      currentSettings.mode = radio.value;
      updateModeUI(radio.value);
      triggerImmediateSave();
    });
  });

  // Auto Mode side-by-side cards selection listeners
  els.cardSchemeLight.addEventListener('click', () => {
    if (!currentSettings || activeScheme === 'light') return;
    collectFormTo(currentSettings[activeScheme]);
    activeScheme = 'light';
    els.cardSchemeDark.classList.remove('active');
    els.cardSchemeLight.classList.add('active');
    populateForm(currentSettings[activeScheme]);
  });

  els.cardSchemeDark.addEventListener('click', () => {
    if (!currentSettings || activeScheme === 'dark') return;
    collectFormTo(currentSettings[activeScheme]);
    activeScheme = 'dark';
    els.cardSchemeLight.classList.remove('active');
    els.cardSchemeDark.classList.add('active');
    populateForm(currentSettings[activeScheme]);
  });

  // Slideshow Grid interactions using delegation
  els.wallpapersGrid.addEventListener('click', (e) => {
    if (!currentSettings || !currentSettings.slideshow) return;

    // 1. Add Card Click
    const addCard = e.target.closest('.add-grid-card');
    if (addCard) {
      collectFormTo(currentSettings.slideshow.items[activeSlideshowIndex]);
      const newItem = {
        type: 'none',
        value: '',
        opacity: 100,
        blur: 0,
        style: { fixed: true, size: 'cover', repeat: false }
      };
      currentSettings.slideshow.items.push(newItem);
      activeSlideshowIndex = currentSettings.slideshow.items.length - 1;
      renderWallpapersGrid();
      populateForm(currentSettings.slideshow.items[activeSlideshowIndex]);
      triggerImmediateSave();
      return;
    }

    // 2. Delete Card Click
    const deleteBtn = e.target.closest('.delete-grid-btn');
    if (deleteBtn) {
      e.stopPropagation();
      const card = deleteBtn.closest('.wallpaper-grid-card');
      const idx = parseInt(card.dataset.index, 10);
      currentSettings.slideshow.items.splice(idx, 1);
      
      if (activeSlideshowIndex >= currentSettings.slideshow.items.length) {
        activeSlideshowIndex = currentSettings.slideshow.items.length - 1;
      }
      
      renderWallpapersGrid();
      populateForm(currentSettings.slideshow.items[activeSlideshowIndex]);
      triggerImmediateSave();
      return;
    }

    // 3. Select Card Click
    const card = e.target.closest('.wallpaper-grid-card');
    if (card) {
      const idx = parseInt(card.dataset.index, 10);
      if (activeSlideshowIndex === idx) return;
      collectFormTo(currentSettings.slideshow.items[activeSlideshowIndex]);
      activeSlideshowIndex = idx;
      
      // Update selected state border
      els.wallpapersGrid.querySelectorAll('.wallpaper-grid-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      
      populateForm(currentSettings.slideshow.items[activeSlideshowIndex]);
    }
  });

  // Slideshow config inputs save triggers
  els.slideshowInterval.addEventListener('change', () => {
    if (currentSettings && currentSettings.slideshow) {
      currentSettings.slideshow.interval = els.slideshowInterval.value;
      triggerImmediateSave();
    }
  });

  els.slideshowRandom.addEventListener('change', () => {
    if (currentSettings && currentSettings.slideshow) {
      currentSettings.slideshow.order = els.slideshowRandom.checked ? 'random' : 'sequential';
      triggerImmediateSave();
    }
  });

  // Advanced: open settings dashboard with robust fallback
  els.settingsBtn.addEventListener('click', () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage(() => {
        if (chrome.runtime.lastError) {
          chrome.tabs.create({ url: chrome.runtime.getURL('options/options.html') });
        }
      });
    } else {
      chrome.tabs.create({ url: chrome.runtime.getURL('options/options.html') });
    }
  });

  // Actions
  els.resetBtn.addEventListener('click', resetSettings);
  
  // Copy domain hostname
  els.domainBadge.addEventListener('click', async () => {
    const text = els.domainBadge.textContent;
    if (!text || text === '...' || text === t('invalidUrl') || text === t('noTab')) return;
    try {
      await navigator.clipboard.writeText(text);
      setSavingState();
      setTimeout(setSyncedState, 1000);
    } catch (err) {
      console.error('Failed to copy domain name:', err);
    }
  });

  // Functions
  function initI18n() {
    const browserLang = navigator.language || navigator.userLanguage; 
    if (browserLang.toLowerCase().startsWith('zh')) {
      lang = 'zh';
    } else {
      lang = 'en';
    }
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = t(key);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = t(key);
    });

    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
      settingsBtn.title = lang === 'zh' ? '设置' : 'Settings';
    }
  }

  function t(key) {
    const zhFallback = {
      uiThemeColor: "\u754c\u9762\u4e3b\u9898\u8272",
      uiThemeColorHint: "\u53ea\u6539\u53d8 PageDye \u8bbe\u7f6e\u9875\u548c\u5f39\u7a97\u989c\u8272\uff0c\u4e0d\u4f1a\u5f71\u54cd\u7f51\u7ad9\u989c\u8272\u3002",
      deepCompatAggressiveEnable: "\u5f3a\u517c\u6a21\u5f0f",
      deepCompatAggressiveHint: "\u66f4\u6fc0\u8fdb\uff1a\u9ad8\u9891\u68c0\u6d4b DOM/\u6837\u5f0f\u53d8\u5316\u5e76\u53cd\u590d\u6062\u590d PageDye \u8986\u76d6\u3002\u53ea\u5efa\u8bae\u5728\u9632\u5fa1\u5f88\u5f3a\u7684\u7f51\u7ad9\u4f7f\u7528\uff0c\u53ef\u80fd\u660e\u663e\u589e\u52a0\u6027\u80fd\u6d88\u8017\u3002",
      disabledTitle: "PageDye \u5df2\u5173\u95ed",
      disabledMessage: "\u9700\u8981\u6253\u5f00\u63d2\u4ef6\u540e\uff0c\u58c1\u7eb8\u3001\u78e8\u7802\u73bb\u7483\u3001\u81ea\u5b9a\u4e49\u5149\u6807\u3001\u6df1\u5ea6\u517c\u5bb9\u6a21\u5f0f\u548c\u8c03\u8bd5\u5de5\u5177\u624d\u4f1a\u6062\u590d\u3002",
      disabledEnableButton: "\u6253\u5f00 PageDye",
      extensionPowerKicker: "\u63d2\u4ef6\u603b\u5f00\u5173",
      extensionPowerTitle: "PageDye \u5df2\u5f00\u542f",
      extensionPowerHint: "\u5173\u95ed\u540e\u4f1a\u505c\u6b62\u6240\u6709\u9875\u9762\u4e0a\u7684 PageDye \u529f\u80fd\u3002"
    };
    if (lang === 'zh' && zhFallback[key]) return zhFallback[key];
    return i18n[lang][key] || i18n.en[key] || key;
  }

  // Appends the user's custom effects as an <optgroup> after the built-in
  // <option>s — mirrors options.js's copy of the same logic (no shared
  // module between popup/options for this small a helper, consistent with
  // this file already keeping its own copy of initCustomCssEditor).
  async function populateCustomEffectOptions(selectEl) {
    if (!selectEl) return;
    const previousValue = selectEl.value;
    const existingGroup = selectEl.querySelector('optgroup[data-custom-effects]');
    if (existingGroup) existingGroup.remove();

    const data = await chrome.storage.local.get(CUSTOM_EFFECTS_KEY);
    const list = data[CUSTOM_EFFECTS_KEY] || [];
    if (list.length > 0) {
      const group = document.createElement('optgroup');
      group.setAttribute('data-custom-effects', '');
      group.label = t('customEffectsOptgroup');
      list.forEach((entry) => {
        const opt = document.createElement('option');
        opt.value = 'custom:' + entry.id;
        opt.textContent = entry.name || t('untitledEffect');
        group.appendChild(opt);
      });
      selectEl.appendChild(group);
    }

    if (previousValue && Array.from(selectEl.options).some((o) => o.value === previousValue)) {
      selectEl.value = previousValue;
    }
  }

  // Disable UI when no tab found
  function disableAll() {
    document.querySelector('main').style.opacity = '0.5';
    document.querySelector('main').style.pointerEvents = 'none';
    els.resetBtn.disabled = true;
  }

  function updatePreview() {
    let imageUrl = '';
    if (currentImageBase64) {
      imageUrl = `url('${currentImageBase64}')`;
    } else if (els.imageUrl.value) {
      imageUrl = `url('${els.imageUrl.value}')`;
    }
    els.imagePreviewBg.style.backgroundImage = imageUrl;
    els.imagePreviewBg.style.backgroundSize = els.bgSize.value === 'stretch' ? '100% 100%' : els.bgSize.value;

    const blur       = parseInt(els.blur.value, 10) || 0;
    const brightness = parseInt(document.getElementById('filter-brightness').value, 10);
    const contrast   = parseInt(document.getElementById('filter-contrast').value,   10);
    const grayscale  = parseInt(document.getElementById('filter-grayscale').value,  10);
    const hue        = parseInt(document.getElementById('filter-hue').value,         10);
    const invert     = parseInt(document.getElementById('filter-invert').value,      10);

    const filterStr = [
      blur        > 0    ? `blur(${blur}px)`             : '',
      brightness !== 100 ? `brightness(${brightness}%)`  : '',
      contrast   !== 100 ? `contrast(${contrast}%)`      : '',
      grayscale  > 0     ? `grayscale(${grayscale}%)`    : '',
      hue        > 0     ? `hue-rotate(${hue}deg)`       : '',
      invert     > 0     ? `invert(${invert}%)`          : ''
    ].filter(Boolean).join(' ') || 'none';

    els.imagePreviewBg.style.filter = filterStr;
    els.imagePreviewBg.style.transform = blur > 0 ? 'scale(1.08)' : 'none';

    const opacity = els.opacity.value;
    els.imagePreviewBg.style.opacity = opacity / 100;
  }

  function populateForm(subSettings) {
    document.querySelector(`input[name="bgType"][value="${subSettings.type || 'none'}"]`).checked = true;

    // Set before updateUI() runs below: it reads effectOverlayToggle.checked
    // to decide whether the Opacity section should show for a bare "None +
    // effect" background.
    els.effectOverlayToggle.checked = !!subSettings.effectEnabled;
    els.sectionEffects.classList.toggle('hidden', !subSettings.effectEnabled);

    updateUI(subSettings.type || 'none');

    currentImageBase64 = null;
    els.imageUrl.value = '';
    els.fileInput.value = '';
    els.dropArea.classList.remove('hidden');
    els.fileInfo.classList.add('hidden');

    if (subSettings.type === 'color') {
      els.colorPicker.value = subSettings.value || '#ffffff';
      els.colorText.value = subSettings.value || '#ffffff';

      const colorMode = subSettings.colorMode || 'solid';
      populateGradientPanel(subSettings.gradient || window.PageDyeGradient.defaultGradient(subSettings.value));
      updateColorModeUI(colorMode);
    } else if (subSettings.type === 'image') {
      if (subSettings.value && subSettings.value.startsWith('data:')) {
        currentImageBase64 = subSettings.value;
        els.dropArea.classList.add('hidden');
        els.fileInfo.classList.remove('hidden');
        els.fileName.textContent = t('savedImage');
      } else {
        els.imageUrl.value = subSettings.value || '';
      }
    }

    // Remaining effect-overlay fields — also independent of `type`, always
    // populated so switching Background type doesn't lose the configured
    // effect. (effectOverlayToggle/sectionEffects are already set above.)
    els.effectKind.value = subSettings.effect || 'waves';
    els.effectText.value = subSettings.effectText || 'PageDye';
    els.effectTextControl.classList.toggle('hidden', els.effectKind.value !== 'typewriter');
    els.effectColorScheme.value = subSettings.effectColorScheme || 'auto';
    els.effectColorCustomControl.classList.toggle('hidden', els.effectColorScheme.value !== 'custom');
    els.effectColor.value = subSettings.effectColor || '#ffffff';
    els.effectColorText.value = subSettings.effectColor || '#ffffff';
    els.effectBgColor.value = subSettings.effectBgColor || '#000000';
    els.effectBgColorText.value = subSettings.effectBgColor || '#000000';
    els.effectDensity.value = subSettings.effectDensity !== undefined ? subSettings.effectDensity : 50;
    els.effectDensityVal.textContent = `${els.effectDensity.value}%`;
    els.effectSpeed.value = subSettings.effectSpeed !== undefined ? subSettings.effectSpeed : 50;
    els.effectSpeedVal.textContent = `${els.effectSpeed.value}%`;
    updateEffectOverlayUI();

    els.opacity.value = subSettings.opacity !== undefined ? subSettings.opacity : 100;
    els.opacityVal.textContent = `${els.opacity.value}%`;
    els.blur.value = subSettings.blur !== undefined ? subSettings.blur : 0;
    els.blurVal.textContent = `${els.blur.value}px`;

    // Populate advanced filters
    const f = subSettings.filters || {};
    const bri = f.brightness !== undefined ? f.brightness : 100;
    const con = f.contrast   !== undefined ? f.contrast   : 100;
    const gry = f.grayscale  !== undefined ? f.grayscale  : 0;
    const hue = f.hue        !== undefined ? f.hue        : 0;
    const inv = f.invert     !== undefined ? f.invert     : 0;
    document.getElementById('filter-brightness').value = bri;
    document.getElementById('filter-brightness-val').textContent = `${bri}%`;
    document.getElementById('filter-contrast').value = con;
    document.getElementById('filter-contrast-val').textContent = `${con}%`;
    document.getElementById('filter-grayscale').value = gry;
    document.getElementById('filter-grayscale-val').textContent = `${gry}%`;
    document.getElementById('filter-hue').value = hue;
    document.getElementById('filter-hue-val').textContent = `${hue}deg`;
    document.getElementById('filter-invert').value = inv;
    document.getElementById('filter-invert-val').textContent = `${inv}%`;
    
    if (subSettings.style) {
      els.bgFixed.checked = subSettings.style.fixed !== false;
      els.bgSize.value = subSettings.style.size || 'cover';
      els.bgRepeat.checked = !!subSettings.style.repeat;
    }

    updatePreview();
  }

  function collectFormTo(dest) {
    const type = document.querySelector('input[name="bgType"]:checked').value;
    let value = '';

    if (type === 'color') {
      value = els.colorPicker.value;
      dest.colorMode = document.querySelector('input[name="colorMode"]:checked').value;
      dest.gradient = collectGradientFromForm();
    } else if (type === 'image') {
      value = currentImageBase64 || els.imageUrl.value;
    }

    // Effect-overlay fields are independent of `type` — always collected
    // (same tier as opacity/blur/filters/style below) so they persist across
    // Background type switches instead of only while type === 'effect'.
    dest.effectEnabled = els.effectOverlayToggle.checked;
    dest.effect = els.effectKind.value;
    dest.effectText = els.effectText.value || 'PageDye';
    dest.effectColorScheme = els.effectColorScheme.value;
    dest.effectColor = els.effectColor.value;
    dest.effectBgColor = els.effectBgColor.value;
    dest.effectDensity = parseInt(els.effectDensity.value, 10);
    dest.effectSpeed = parseInt(els.effectSpeed.value, 10);

    dest.type = type;
    dest.value = value;
    dest.opacity = parseInt(els.opacity.value, 10);
    dest.blur = parseInt(els.blur.value, 10);
    dest.filters = {
      brightness: parseInt(document.getElementById('filter-brightness').value, 10),
      contrast:   parseInt(document.getElementById('filter-contrast').value,   10),
      grayscale:  parseInt(document.getElementById('filter-grayscale').value,  10),
      hue:        parseInt(document.getElementById('filter-hue').value,         10),
      invert:     parseInt(document.getElementById('filter-invert').value,      10)
    };
    dest.style = {
      fixed: els.bgFixed.checked,
      size: els.bgSize.value,
      repeat: els.bgRepeat.checked
    };
  }

  function updateTargetHint() {
    if (currentDomain === DEFAULT_BG_KEY) {
      els.targetHint.textContent = t('targetHintDefault');
      els.targetHint.style.display = '';
    } else if (!siteHasOwnConfig) {
      els.targetHint.textContent = t('targetHintInherited');
      els.targetHint.style.display = '';
    } else {
      els.targetHint.textContent = '';
      els.targetHint.style.display = 'none';
    }
  }

  async function switchTarget(target) {
    currentDomain = target === 'default' ? DEFAULT_BG_KEY : siteDomain;
    els.domainBadge.textContent = target === 'default' ? t('targetDefault') : siteDomain;
    await loadSettings(currentDomain);
  }

  // Upgrades a legacy sub-settings object (saved before Effects became an
  // independent overlay toggle) in place: the old type:'effect' was a 4th
  // mutually-exclusive background choice; it's now equivalent to type:'none'
  // with the overlay toggled on. All effect* fields already on the object are
  // left untouched. Idempotent — safe to call on already-migrated data.
  function migrateBgType(obj) {
    if (!obj) return;
    if (obj.type === 'effect') {
      obj.type = 'none';
      obj.effectEnabled = true;
    } else {
      obj.effectEnabled = !!obj.effectEnabled;
    }
  }

  async function loadSettings(domain) {
    const data = await chrome.storage.local.get([domain, DEFAULT_BG_KEY]);
    const ownEntry = data[domain];
    const isSiteTarget = domain === siteDomain;
    if (isSiteTarget) siteHasOwnConfig = !!ownEntry;
    // Editing "this site" with no override of its own falls back to the
    // global default — the form should show what the page actually
    // renders right now, not a misleading blank slate.
    const fallbackDefault = isSiteTarget ? data[DEFAULT_BG_KEY] : null;
    currentSettings = ownEntry || fallbackDefault || {
      mode: 'single',
      type: 'none',
      value: '',
      opacity: 100,
      blur: 0,
      style: { fixed: true, size: 'cover', repeat: false }
    };
    updateTargetHint();

    if (!currentSettings.mode) {
      currentSettings.mode = 'single';
    }

    if (!currentSettings.light) {
      currentSettings.light = {
        type: currentSettings.type && currentSettings.type !== 'none' ? currentSettings.type : 'none',
        value: currentSettings.value || '',
        opacity: currentSettings.opacity !== undefined ? currentSettings.opacity : 100,
        blur: currentSettings.blur !== undefined ? currentSettings.blur : 0,
        style: Object.assign({ fixed: true, size: 'cover', repeat: false }, currentSettings.style || {})
      };
    }
    if (!currentSettings.dark) {
      currentSettings.dark = {
        type: currentSettings.type && currentSettings.type !== 'none' ? currentSettings.type : 'none',
        value: currentSettings.value || '',
        opacity: currentSettings.opacity !== undefined ? currentSettings.opacity : 100,
        blur: currentSettings.blur !== undefined ? currentSettings.blur : 0,
        style: Object.assign({ fixed: true, size: 'cover', repeat: false }, currentSettings.style || {})
      };
    }

    if (!currentSettings.timeRange || !Array.isArray(currentSettings.timeRange.items)) {
      if (currentSettings.timeRange && currentSettings.timeRange.morning) {
        const tr = currentSettings.timeRange;
        const config = currentSettings.timeRangeConfig || { morningStart: 5, noonStart: 9, duskStart: 17, nightStart: 21 };
        currentSettings.timeRange = {
          items: [
            Object.assign({ id: 'morning', name: lang === 'zh' ? '清晨' : 'Morning', start: config.morningStart, end: config.noonStart }, tr.morning),
            Object.assign({ id: 'noon', name: lang === 'zh' ? '正午' : 'Noon', start: config.noonStart, end: config.duskStart }, tr.noon),
            Object.assign({ id: 'dusk', name: lang === 'zh' ? '黄昏' : 'Dusk', start: config.duskStart, end: config.nightStart }, tr.dusk),
            Object.assign({ id: 'night', name: lang === 'zh' ? '深夜' : 'Night', start: config.nightStart, end: config.morningStart }, tr.night)
          ]
        };
      } else {
        const template = {
          type: currentSettings.type && currentSettings.type !== 'none' ? currentSettings.type : 'none',
          value: currentSettings.value || '',
          opacity: currentSettings.opacity !== undefined ? currentSettings.opacity : 100,
          blur: currentSettings.blur !== undefined ? currentSettings.blur : 0,
          style: Object.assign({ fixed: true, size: 'cover', repeat: false }, currentSettings.style || {}),
          colorMode: currentSettings.colorMode || 'solid',
          gradient: currentSettings.gradient || null,
          effectEnabled: !!currentSettings.effectEnabled,
          effect: currentSettings.effect || 'waves',
          effectText: currentSettings.effectText || 'PageDye',
          effectColorScheme: currentSettings.effectColorScheme || 'auto',
          effectColor: currentSettings.effectColor || '#ffffff',
          effectBgColor: currentSettings.effectBgColor || '#000000',
          effectDensity: currentSettings.effectDensity !== undefined ? currentSettings.effectDensity : 50,
          effectSpeed: currentSettings.effectSpeed !== undefined ? currentSettings.effectSpeed : 50,
          filters: Object.assign({ brightness: 100, contrast: 100, grayscale: 0, hue: 0, invert: 0 }, currentSettings.filters || {})
        };
        currentSettings.timeRange = {
          items: [
            Object.assign({ id: 'morning', name: lang === 'zh' ? '清晨' : 'Morning', start: 5, end: 9 }, JSON.parse(JSON.stringify(template))),
            Object.assign({ id: 'noon', name: lang === 'zh' ? '正午' : 'Noon', start: 9, end: 17 }, JSON.parse(JSON.stringify(template))),
            Object.assign({ id: 'dusk', name: lang === 'zh' ? '黄昏' : 'Dusk', start: 17, end: 21 }, JSON.parse(JSON.stringify(template))),
            Object.assign({ id: 'night', name: lang === 'zh' ? '深夜' : 'Night', start: 21, end: 5 }, JSON.parse(JSON.stringify(template)))
          ]
        };
      }
    }

    if (!currentSettings.slideshow) {
      currentSettings.slideshow = {
        interval: 'open',
        order: 'sequential',
        currentIndex: 0,
        lastRotationTime: Date.now(),
        items: [
          {
            type: currentSettings.type || 'none',
            value: currentSettings.value || '',
            opacity: currentSettings.opacity !== undefined ? currentSettings.opacity : 100,
            blur: currentSettings.blur !== undefined ? currentSettings.blur : 0,
            style: Object.assign({ fixed: true, size: 'cover', repeat: false }, currentSettings.style || {})
          }
        ]
      };
    }

    // Upgrade any legacy type:'effect' entries (saved before Effects became
    // an independent overlay toggle) across every mode's sub-settings.
    migrateBgType(currentSettings);
    migrateBgType(currentSettings.light);
    migrateBgType(currentSettings.dark);
    (currentSettings.timeRange.items || []).forEach(migrateBgType);
    (currentSettings.slideshow.items || []).forEach(migrateBgType);

    const mode = currentSettings.mode || 'single';
    const radio = document.querySelector(`input[name="wpMode"][value="${mode}"]`);
    if (radio) radio.checked = true;
    updateModeUI(mode);

    els.targetSelector.value = currentSettings.targetSelector || '';
    els.performanceMode.value = currentSettings.performanceMode || 'auto';
    syncDeepCompatRunMode(deepCompatModeFromSettings(currentSettings));
    renderDeepCompatExcludes();
    els.customCss.value = currentSettings.customCss || '';
    if (cssEditorController) cssEditorController.update();

    renderFrostedList(normalizeFrostedGlassList(currentSettings.frostedGlass));

    const cursorCfg = window.PageDyeCursor.normalizeCursorConfig(currentSettings.cursor);
    els.cursorToggle.checked = !!(currentSettings.cursor && currentSettings.cursor.enabled);
    cursorPresetState = cursorCfg.preset;
    renderCursorPresetsGrid();
    els.cursorColor.value = cursorCfg.color;
    els.cursorColorText.value = cursorCfg.color;
    els.cursorSize.value = cursorCfg.size;
    els.cursorSizeVal.textContent = `${cursorCfg.size}px`;
    els.cursorHoverScale.value = cursorCfg.hoverScale;
    els.cursorHoverScaleVal.textContent = `${cursorCfg.hoverScale.toFixed(1)}x`;
    els.cursorSmoothingToggle.checked = cursorCfg.smoothing;
    els.cursorTrailToggle.checked = cursorCfg.trail.enabled;
    els.cursorTrailOptions.classList.toggle('hidden', !cursorCfg.trail.enabled);
    els.cursorTrailStyle.value = cursorCfg.trail.style;
    els.cursorTrailLength.value = cursorCfg.trail.length;
    els.cursorTrailLengthVal.textContent = cursorCfg.trail.length;
    els.cursorTrailSpeed.value = cursorCfg.trail.speed;
    els.cursorTrailSpeedVal.textContent = `${cursorCfg.trail.speed}%`;

    // Auto expand accordion if target selector or custom css has values.
    // Deep Compatibility Mode now has its own always-expanded accordion.
    const accordionAdvanced = document.getElementById('accordion-advanced');
    if (els.targetSelector.value || els.customCss.value) {
      if (accordionAdvanced) setAccordionOpen(accordionAdvanced, true, false);
    } else {
      if (accordionAdvanced) setAccordionOpen(accordionAdvanced, false, false);
    }

    const accordionCursor = document.getElementById('accordion-cursor');
    if (accordionCursor) setAccordionOpen(accordionCursor, els.cursorToggle.checked, false);

    updateInteractivePreviews();
  }

  function updateModeUI(mode) {
    const slider = document.getElementById('wp-mode-slider');
    const singlePanel = document.getElementById('mode-panel-single');
    const autoPanel = document.getElementById('scheme-cards-container');
    const timePanel = document.getElementById('time-cards-container');
    const slideshowPanel = document.getElementById('slideshow-config-panel');

    if (slider && !isInitialLoad) {
      slider.classList.add('transitioning');
    }

    if (singlePanel) singlePanel.classList.toggle('inactive', mode !== 'single');
    if (autoPanel) autoPanel.classList.toggle('inactive', mode !== 'auto');
    if (timePanel) timePanel.classList.toggle('inactive', mode !== 'timeRange');
    if (slideshowPanel) slideshowPanel.classList.toggle('inactive', mode !== 'slideshow');

    if (slider) {
      if (isInitialLoad) {
        slider.style.transition = 'none';
      }
      if (mode === 'single') slider.style.transform = 'translateX(0)';
      else if (mode === 'auto') slider.style.transform = 'translateX(-25%)';
      else if (mode === 'timeRange') slider.style.transform = 'translateX(-50%)';
      else if (mode === 'slideshow') slider.style.transform = 'translateX(-75%)';
      if (isInitialLoad) {
        slider.offsetHeight; // trigger reflow
        slider.style.transition = '';
      }
    }

    const activeModeBadge = document.getElementById('active-mode-badge');
    if (activeModeBadge) {
      if (mode === 'single') {
        activeModeBadge.textContent = t('modeSingle');
      } else if (mode === 'auto') {
        activeModeBadge.textContent = t('modeAuto');
      } else if (mode === 'timeRange') {
        activeModeBadge.textContent = t('modeTimeRange');
      } else if (mode === 'slideshow') {
        activeModeBadge.textContent = t('modeSlideshow');
      }
    }

    if (els.timeRangePeriodEditFields) {
      els.timeRangePeriodEditFields.classList.toggle('hidden', mode !== 'timeRange');
    }

    if (mode === 'single') {
      populateForm(currentSettings);
    } else if (mode === 'auto') {
      els.cardSchemeLight.classList.remove('active');
      els.cardSchemeDark.classList.remove('active');
      if (activeScheme === 'dark') {
        els.cardSchemeDark.classList.add('active');
      } else {
        activeScheme = 'light';
        els.cardSchemeLight.classList.add('active');
      }
      populateForm(currentSettings[activeScheme]);
    } else if (mode === 'timeRange') {
      const items = currentSettings.timeRange.items || [];
      if (activeTimePeriodIndex >= items.length) {
        activeTimePeriodIndex = 0;
      }
      renderTimeCards();
      const activeItem = items[activeTimePeriodIndex];
      if (activeItem) {
        populateForm(activeItem);
        populateTimeRangeConfigPanel(activeItem);
      }
    } else if (mode === 'slideshow') {
      els.slideshowInterval.value = currentSettings.slideshow.interval || 'open';
      els.slideshowRandom.checked = currentSettings.slideshow.order === 'random';
      
      activeSlideshowIndex = currentSettings.slideshow.currentIndex || 0;
      if (activeSlideshowIndex >= currentSettings.slideshow.items.length) {
        activeSlideshowIndex = 0;
      }
      renderWallpapersGrid();
      populateForm(currentSettings.slideshow.items[activeSlideshowIndex]);
    }
    updateInteractivePreviews();
  }

  function renderWallpapersGrid() {
    els.wallpapersGrid.innerHTML = '';
    const items = currentSettings.slideshow.items || [];
    
    items.forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = 'wallpaper-grid-card';
      if (idx === activeSlideshowIndex) card.classList.add('active');
      card.classList.toggle('has-effect-badge', !!item.effectEnabled);

      if (item.type === 'color' && item.colorMode === 'gradient' && item.gradient) {
        card.style.backgroundImage = window.PageDyeGradient.buildGradientCss(item.gradient);
      } else if (item.type === 'color') {
        card.style.backgroundColor = item.value || '#ffffff';
        card.style.backgroundImage = 'none';
      } else if (item.type === 'image' && item.value) {
        card.style.backgroundImage = `url('${item.value}')`;
      } else if (item.effectEnabled) {
        card.classList.add('type-none');
        card.textContent = t('typeEffect');
      } else {
        card.classList.add('type-none');
        card.textContent = 'None';
      }
      card.dataset.index = idx;
      
      if (items.length > 1) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-grid-btn';
        deleteBtn.textContent = '×';
        deleteBtn.type = 'button';
        deleteBtn.title = lang === 'zh' ? '删除此壁纸' : 'Delete wallpaper';
        card.appendChild(deleteBtn);
      }
      els.wallpapersGrid.appendChild(card);
    });

    const addCard = document.createElement('div');
    addCard.className = 'add-grid-card';
    addCard.textContent = '+';
    els.wallpapersGrid.appendChild(addCard);
  }

  function updateCardPreview(element, subSettings) {
    if (!element || !subSettings) return;
    element.classList.toggle('has-effect-badge', !!subSettings.effectEnabled);
    if (subSettings.type === 'color' && subSettings.colorMode === 'gradient' && subSettings.gradient) {
      element.style.backgroundImage = window.PageDyeGradient.buildGradientCss(subSettings.gradient);
      element.style.backgroundColor = '';
    } else if (subSettings.type === 'color') {
      element.style.backgroundColor = subSettings.value || '#ffffff';
      element.style.backgroundImage = 'none';
    } else if (subSettings.type === 'image' && subSettings.value) {
      element.style.backgroundImage = `url('${subSettings.value}')`;
    } else {
      element.style.backgroundColor = 'var(--surface-bg)';
      element.style.backgroundImage = 'none';
    }
    element.style.opacity = (subSettings.opacity !== undefined ? subSettings.opacity : 100) / 100;
  }

  function updateInteractivePreviews() {
    if (!currentSettings) return;
    
    const mode = currentSettings.mode || 'single';
    if (mode === 'auto') {
      updateCardPreview(els.previewCardLight, currentSettings.light);
      updateCardPreview(els.previewCardDark, currentSettings.dark);
    } else if (mode === 'timeRange') {
      const activeCard = els.timePeriodsList ? els.timePeriodsList.querySelector(`.scheme-card.active .scheme-card-preview`) : null;
      if (activeCard) {
        const item = currentSettings.timeRange.items[activeTimePeriodIndex];
        if (item) {
          updateCardPreview(activeCard, item);
        }
      }
    } else if (mode === 'slideshow') {
      const activeCard = els.wallpapersGrid.querySelector(`.wallpaper-grid-card.active`);
      if (activeCard) {
        const item = currentSettings.slideshow.items[activeSlideshowIndex];
        if (item) {
          activeCard.textContent = '';
          activeCard.style.backgroundColor = '';
          activeCard.style.backgroundImage = '';
          const baseClass = 'wallpaper-grid-card active' + (item.effectEnabled ? ' has-effect-badge' : '');
          if (item.type === 'color' && item.colorMode === 'gradient' && item.gradient) {
            activeCard.style.backgroundImage = window.PageDyeGradient.buildGradientCss(item.gradient);
            activeCard.className = baseClass;
          } else if (item.type === 'color') {
            activeCard.style.backgroundColor = item.value || '#ffffff';
            activeCard.className = baseClass;
          } else if (item.type === 'image' && item.value) {
            activeCard.style.backgroundImage = `url('${item.value}')`;
            activeCard.className = baseClass;
          } else if (item.effectEnabled) {
            activeCard.className = baseClass + ' type-none';
            activeCard.textContent = t('typeEffect');
          } else {
            activeCard.className = baseClass + ' type-none';
            activeCard.textContent = 'None';
          }
          
          const count = currentSettings.slideshow.items.length;
          if (count > 1 && !activeCard.querySelector('.delete-grid-btn')) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-grid-btn';
            deleteBtn.textContent = '×';
            deleteBtn.type = 'button';
            deleteBtn.title = lang === 'zh' ? '删除此壁纸' : 'Delete wallpaper';
            activeCard.appendChild(deleteBtn);
          }
        }
      }
    }
  }

  function updateUI(type) {
    if (window.syncFacadeUI) window.syncFacadeUI();
    const bgTypeSlider = document.getElementById('bg-type-slider');
    const sectionNone = document.getElementById('section-none');
    const sectionColor = document.getElementById('section-color');
    const sectionImage = document.getElementById('section-image');

    if (bgTypeSlider && !isInitialLoad) {
      bgTypeSlider.classList.add('transitioning');
    }

    if (sectionNone) sectionNone.classList.toggle('inactive', type !== 'none');
    if (sectionColor) sectionColor.classList.toggle('inactive', type !== 'color');
    if (sectionImage) sectionImage.classList.toggle('inactive', type !== 'image');

    if (bgTypeSlider) {
      if (isInitialLoad) {
        bgTypeSlider.style.transition = 'none';
      }
      if (type === 'none') bgTypeSlider.style.transform = 'translateX(0)';
      else if (type === 'color') bgTypeSlider.style.transform = 'translateX(-33.333%)';
      else if (type === 'image') bgTypeSlider.style.transform = 'translateX(-66.667%)';
      if (isInitialLoad) {
        bgTypeSlider.offsetHeight; // trigger reflow
        bgTypeSlider.style.transition = '';
      }
    }

    // Opacity (and, for image, blur/filters) show whenever there's anything
    // to fade — a base type, or the effect overlay on its own over "None".
    els.sectionStyles.classList.toggle('hidden', type === 'none' && !els.effectOverlayToggle.checked);
    els.blurControl.classList.add('hidden');
    const advFilters = document.getElementById('advanced-filters');
    if (advFilters) advFilters.classList.add('hidden');

    if (type === 'color') {
      const checkedColorMode = document.querySelector('input[name="colorMode"]:checked');
      updateColorModeUI(checkedColorMode ? checkedColorMode.value : 'solid');
    } else if (type === 'image') {
      els.blurControl.classList.remove('hidden');
      if (advFilters) advFilters.classList.remove('hidden');
      updatePreview();
    }

    // Toggle image position options if image is active
    const imgOptions = document.getElementById('image-options');
    if (imgOptions) {
      if (type === 'image') {
        imgOptions.classList.remove('hidden');
      } else {
        imgOptions.classList.add('hidden');
      }
    }

    updateEffectOverlayUI();
  }

  // Hides the effect overlay's own "Background Color" field when a Background
  // type is active underneath — that field only matters in standalone/opaque
  // mode (type none), since layered mode clears the canvas transparently each
  // frame instead of painting it (see clearFrame() in scripts/effects.js).
  function updateEffectOverlayUI() {
    if (!els.effectBgColorGroup) return;
    const checked = document.querySelector('input[name="bgType"]:checked');
    const type = checked ? checked.value : 'none';
    els.effectBgColorGroup.classList.toggle('hidden', type !== 'none');
  }

  function updateColorModeUI(colorMode) {
    if (window.syncFacadeUI) window.syncFacadeUI();
    const isGradient = colorMode === 'gradient';
    const radio = document.querySelector(`input[name="colorMode"][value="${colorMode || 'solid'}"]`);
    if (radio) radio.checked = true;

    const slider = document.getElementById('color-mode-slider');
    const solidPanel = document.getElementById('solid-color-panel');
    const gradPanel = document.getElementById('gradient-panel');

    if (slider && !isInitialLoad) {
      slider.classList.add('transitioning');
    }

    if (solidPanel) solidPanel.classList.toggle('inactive', isGradient);
    if (gradPanel) gradPanel.classList.toggle('inactive', !isGradient);

    if (slider) {
      if (isInitialLoad) {
        slider.style.transition = 'none';
      }
      slider.style.transform = isGradient ? 'translateX(-50%)' : 'translateX(0)';
      if (isInitialLoad) {
        slider.offsetHeight; // trigger reflow
        slider.style.transition = '';
      }
    }

    if (isGradient) {
      // Guards against toggling to Gradient on a slot that has never been
      // through populateGradientPanel (e.g. a fresh domain whose type
      // starts as 'none'/'image') — without this, the stop list and live
      // preview would stay empty until the next full populateForm call.
      if (gradientStopsState.length < window.PageDyeGradient.MIN_STOPS) {
        renderGradientStops(window.PageDyeGradient.defaultGradient(els.colorPicker.value).stops);
      }
      const kindRadio = document.querySelector('input[name="gradientKind"]:checked');
      updateGradientKindUI(kindRadio ? kindRadio.value : 'linear');
      updateGradientPreview();
      updateGradientExtractButtonState();
    }
  }

  function updateGradientKindUI(kind) {
    els.gradientAngleControl.classList.toggle('hidden', kind !== 'linear');
    els.gradientShapeControl.classList.toggle('hidden', kind !== 'radial');
  }

  function populateGradientPanel(gradient) {
    const kindRadio = document.querySelector(`input[name="gradientKind"][value="${gradient.kind || 'linear'}"]`);
    if (kindRadio) kindRadio.checked = true;
    els.gradientAngle.value = gradient.angle !== undefined ? gradient.angle : 90;
    els.gradientAngleVal.textContent = `${els.gradientAngle.value}°`;
    els.gradientShape.value = gradient.shape || 'circle';
    els.gradientAnimated.checked = !!gradient.animated;
    els.gradientSpeed.value = gradient.speed !== undefined ? gradient.speed : 10;
    els.gradientSpeedVal.textContent = `${els.gradientSpeed.value}s`;
    els.gradientSpeedControl.classList.toggle('hidden', !gradient.animated);

    const stops = (gradient.stops && gradient.stops.length >= window.PageDyeGradient.MIN_STOPS)
      ? gradient.stops
      : window.PageDyeGradient.defaultGradient().stops;
    renderGradientStops(stops);

    updateGradientKindUI(gradient.kind || 'linear');
    updateGradientPreview();
  }

  // Rebuilds the stop-row list from scratch. Rows are plain DOM nodes built
  // via createElement (not innerHTML) so user-typed hex text never needs
  // HTML-escaping. Listeners are delegated on the parent (see the
  // gradient-stops-list input/click handlers above), since rows are
  // recreated on every add/remove.
  function renderGradientStops(stops) {
    gradientStopsState = stops.map(s => ({ color: s.color, position: s.position }));
    els.gradientStopsList.innerHTML = '';

    gradientStopsState.forEach((stop, idx) => {
      const row = document.createElement('div');
      row.className = 'gradient-stop-row';
      row.dataset.index = idx;

      const colorInput = document.createElement('input');
      colorInput.type = 'color';
      colorInput.className = 'gradient-stop-color';
      colorInput.value = stop.color;

      const hexInput = document.createElement('input');
      hexInput.type = 'text';
      hexInput.className = 'gradient-stop-hex';
      hexInput.value = stop.color;

      const posInput = document.createElement('input');
      posInput.type = 'number';
      posInput.className = 'gradient-stop-pos';
      posInput.min = '0';
      posInput.max = '100';
      posInput.value = stop.position;

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'gradient-stop-remove';
      removeBtn.textContent = '×';
      removeBtn.title = t('gradientRemoveStop');
      removeBtn.disabled = gradientStopsState.length <= window.PageDyeGradient.MIN_STOPS;

      row.appendChild(colorInput);
      row.appendChild(hexInput);
      row.appendChild(posInput);
      row.appendChild(removeBtn);
      els.gradientStopsList.appendChild(row);
    });

    els.gradientAddStop.disabled = gradientStopsState.length >= window.PageDyeGradient.MAX_STOPS;
  }

  // Older saved settings stored frostedGlass as a single { selector, blur,
  // opacity } object. Upgrade that shape to a one-entry array transparently.
  function normalizeFrostedGlassList(fg) {
    if (Array.isArray(fg)) return fg;
    if (fg && typeof fg === 'object' && fg.selector) return [fg];
    return [];
  }

  // Rebuilds the frosted-entry list from scratch, one card per element, so
  // applying frosted glass to a new element never clobbers the others.
  function renderDeepCompatExcludes() {
    if (!els.deepCompatExcludeList) return;
    els.deepCompatExcludeList.innerHTML = '';
    const str = currentSettings.deepCompatExclude || '';
    const items = str.split(',').map(s => s.trim()).filter(Boolean);
    
    items.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'selector-row';
      row.style.marginBottom = '6px';
      
      const input = document.createElement('input');
      input.type = 'text';
      input.value = item;
      input.placeholder = t('deepCompatExcludePlaceholder') || '.modal, [role=dialog]';
      input.addEventListener('input', () => {
        items[index] = input.value.trim();
        currentSettings.deepCompatExclude = items.filter(Boolean).join(',');
        queueAutoSave();
      });
      
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'pick-btn delete-btn';
      delBtn.style.padding = '8px';
      delBtn.style.display = 'flex';
      delBtn.style.alignItems = 'center';
      delBtn.style.justifyContent = 'center';
      delBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>';
      delBtn.addEventListener('click', () => {
        items.splice(index, 1);
        currentSettings.deepCompatExclude = items.filter(Boolean).join(',');
        queueAutoSave();
        renderDeepCompatExcludes();
      });
      
      row.appendChild(input);
      row.appendChild(delBtn);
      els.deepCompatExcludeList.appendChild(row);
    });
  }

  function renderFrostedList(list) {
    frostedGlassState = list.map(f => ({
      selector: f.selector || '',
      blur: f.blur !== undefined ? f.blur : 12,
      opacity: f.opacity !== undefined ? f.opacity : 55,
      color: f.color || null
    }));
    els.frostedList.innerHTML = '';

    frostedGlassState.forEach((entry, idx) => {
      const row = document.createElement('div');
      row.className = 'frosted-entry';
      row.dataset.index = idx;

      const selectorRow = document.createElement('div');
      selectorRow.className = 'selector-row';

      const selectorInput = document.createElement('input');
      selectorInput.type = 'text';
      selectorInput.className = 'frosted-entry-selector';
      selectorInput.placeholder = '.card, main';
      selectorInput.value = entry.selector;

      const pickBtn = document.createElement('button');
      pickBtn.type = 'button';
      pickBtn.className = 'secondary pick-btn frosted-entry-pick';
      pickBtn.textContent = t('pickElement');

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'frosted-entry-remove';
      removeBtn.textContent = '×';
      removeBtn.title = t('gradientRemoveStop');

      selectorRow.appendChild(selectorInput);
      selectorRow.appendChild(pickBtn);
      selectorRow.appendChild(removeBtn);

      const blurLabelRow = document.createElement('div');
      blurLabelRow.className = 'label-row';
      const blurLabel = document.createElement('label');
      blurLabel.textContent = t('frostedBlur');
      const blurVal = document.createElement('span');
      blurVal.className = 'val-badge frosted-entry-blur-val';
      blurVal.textContent = `${entry.blur}px`;
      blurLabelRow.appendChild(blurLabel);
      blurLabelRow.appendChild(blurVal);

      const blurInput = document.createElement('input');
      blurInput.type = 'range';
      blurInput.className = 'frosted-entry-blur';
      blurInput.min = '0';
      blurInput.max = '30';
      blurInput.step = '0.1';
      blurInput.value = entry.blur;

      const opacityLabelRow = document.createElement('div');
      opacityLabelRow.className = 'label-row';
      const opacityLabel = document.createElement('label');
      opacityLabel.textContent = t('frostedOpacity');
      const opacityVal = document.createElement('span');
      opacityVal.className = 'val-badge frosted-entry-opacity-val';
      opacityVal.textContent = `${entry.opacity}%`;
      opacityLabelRow.appendChild(opacityLabel);
      opacityLabelRow.appendChild(opacityVal);

      const opacityInput = document.createElement('input');
      opacityInput.type = 'range';
      opacityInput.className = 'frosted-entry-opacity';
      opacityInput.min = '0';
      opacityInput.max = '100';
      opacityInput.value = entry.opacity;

      const colorRow = document.createElement('div');
      colorRow.className = 'frosted-entry-color-row';

      const colorToggleLabel = document.createElement('label');
      colorToggleLabel.className = 'checkbox-label';
      const colorToggle = document.createElement('input');
      colorToggle.type = 'checkbox';
      colorToggle.className = 'frosted-entry-color-toggle';
      colorToggle.checked = !!entry.color;
      const colorToggleText = document.createElement('span');
      colorToggleText.textContent = t('frostedCustomColor');
      colorToggleLabel.appendChild(colorToggle);
      colorToggleLabel.appendChild(colorToggleText);

      const colorInput = document.createElement('input');
      colorInput.type = 'color';
      colorInput.className = 'frosted-entry-color';
      colorInput.value = entry.color || '#ffffff';
      colorInput.disabled = !entry.color;

      colorRow.appendChild(colorToggleLabel);
      colorRow.appendChild(colorInput);

      row.appendChild(selectorRow);
      row.appendChild(blurLabelRow);
      row.appendChild(blurInput);
      row.appendChild(opacityLabelRow);
      row.appendChild(opacityInput);
      row.appendChild(colorRow);
      els.frostedList.appendChild(row);
    });
  }

  function collectGradientFromForm() {
    const kindRadio = document.querySelector('input[name="gradientKind"]:checked');
    return {
      kind: kindRadio ? kindRadio.value : 'linear',
      angle: parseInt(els.gradientAngle.value, 10),
      shape: els.gradientShape.value,
      stops: gradientStopsState.map(s => ({ color: s.color, position: s.position })),
      animated: els.gradientAnimated.checked,
      speed: parseInt(els.gradientSpeed.value, 10)
    };
  }

  function updateGradientPreview() {
    const gradient = collectGradientFromForm();
    els.gradientPreviewBg.style.backgroundImage = window.PageDyeGradient.buildGradientCss(gradient);
    els.gradientPreviewBg.style.opacity = (parseInt(els.opacity.value, 10) || 100) / 100;
    if (gradient.animated) {
      els.gradientPreviewBg.style.backgroundSize = gradient.kind === 'radial' ? '200% 200%' : '300% 300%';
      els.gradientPreviewBg.style.animation = `pagedye-gradient-flow ${gradient.speed || 10}s ease infinite`;
    } else {
      els.gradientPreviewBg.style.backgroundSize = 'auto';
      els.gradientPreviewBg.style.animation = 'none';
    }
    // Every gradient control funnels through this function, so this is the
    // one place needed to keep the Auto/Slideshow scheme-card swatches live
    // too (they read currentSettings.light/dark/slideshow directly, same as
    // the solid-color and image controls already keep them in sync).
    updateInteractivePreviews();
  }

  function renderGradientPresetsGrid() {
    els.gradientPresetsGrid.innerHTML = '';
    window.PageDyeGradient.GRADIENT_PRESETS.forEach((preset, idx) => {
      const swatch = document.createElement('div');
      swatch.className = 'gradient-preset-swatch';
      swatch.style.background = window.PageDyeGradient.buildGradientCss(preset);
      swatch.title = lang === 'zh' ? preset.name_zh : preset.name_en;
      swatch.dataset.index = idx;
      els.gradientPresetsGrid.appendChild(swatch);
    });
  }

  function renderCursorPresetsGrid() {
    els.cursorPresetsGrid.innerHTML = '';
    Object.keys(window.PageDyeCursor.PRESETS).forEach((id) => {
      const preset = window.PageDyeCursor.PRESETS[id];
      const swatch = document.createElement('div');
      swatch.className = 'cursor-preset-swatch' + (id === cursorPresetState ? ' active' : '');
      swatch.title = lang === 'zh' ? preset.name_zh : preset.name_en;
      swatch.dataset.preset = id;
      const shape = document.createElement('div');
      shape.className = 'cursor-preset-swatch-shape preset-' + id;
      swatch.appendChild(shape);
      els.cursorPresetsGrid.appendChild(swatch);
    });
  }

  function updateGradientExtractButtonState() {
    const hasImage = !!(currentImageBase64 || els.imageUrl.value);
    els.gradientExtractBtn.disabled = !hasImage;
    els.gradientExtractBtn.title = hasImage ? '' : t('gradientExtractDisabledHint');
  }

  // Maps a flat hex list (from either Monet helper) to evenly-spaced stops.
  function normalizeToStopObjects(hexColors) {
    const n = hexColors.length;
    return hexColors.map((color, i) => ({ color, position: n === 1 ? 0 : Math.round((i * 100) / (n - 1)) }));
  }

  function handleFileSelect(e) {
    if (e.target.files.length) {
      handleFile(e.target.files[0]);
    }
  }

  async function handleFile(file) {
    if (!file.type.startsWith('image/')) return;
    try {
      const image = await window.PageDyeImage.prepareImage(file);
      currentImageBase64 = image.dataUrl;
      els.imageUrl.value = ''; // Clear URL if choosing file
      els.dropArea.classList.add('hidden');
      els.fileInfo.classList.remove('hidden');
      const saved = image.compressed ? ` · ${formatBytes(image.originalBytes)} → ${formatBytes(image.storedBytes)}` : '';
      els.fileName.textContent = image.name + saved;
      updatePreview();
      updateInteractivePreviews();
      triggerImmediateSave();
    } catch (error) {
      console.error('Failed to prepare image:', error);
    }
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes)) return '';
    return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function clearFile() {
    currentImageBase64 = null;
    els.fileInput.value = '';
    els.dropArea.classList.remove('hidden');
    els.fileInfo.classList.add('hidden');
    updatePreview();
    updateInteractivePreviews();
    triggerImmediateSave();
  }

  function collectSettings() {
    const mode = document.querySelector('input[name="wpMode"]:checked').value;
    currentSettings.mode = mode;

    if (mode === 'single') {
      collectFormTo(currentSettings);
    } else if (mode === 'auto') {
      collectFormTo(currentSettings[activeScheme]);
    } else if (mode === 'timeRange') {
      const activeItem = currentSettings.timeRange.items[activeTimePeriodIndex];
      if (activeItem) {
        collectFormTo(activeItem);
        collectTimeRangeConfigPanel(activeItem);
      }
    } else if (mode === 'slideshow') {
      collectFormTo(currentSettings.slideshow.items[activeSlideshowIndex]);
      currentSettings.slideshow.interval = els.slideshowInterval.value;
      currentSettings.slideshow.order = els.slideshowRandom.checked ? 'random' : 'sequential';
    }

    currentSettings.targetSelector = els.targetSelector.value.trim();
    currentSettings.performanceMode = els.performanceMode.value;
    collectDeepCompatRunMode();
    // deepCompatExclude is saved automatically on input change, but we could re-gather here just in case.
    currentSettings.customCss = els.customCss.value;
    currentSettings.frostedGlass = frostedGlassState.map(f => ({
      selector: f.selector.trim(),
      blur: f.blur,
      opacity: f.opacity,
      color: f.color || null
    }));
    currentSettings.cursor = {
      enabled: els.cursorToggle.checked,
      preset: cursorPresetState,
      color: els.cursorColor.value,
      size: parseInt(els.cursorSize.value, 10),
      hoverScale: parseFloat(els.cursorHoverScale.value),
      smoothing: els.cursorSmoothingToggle.checked,
      trail: {
        enabled: els.cursorTrailToggle.checked,
        style: els.cursorTrailStyle.value,
        length: parseInt(els.cursorTrailLength.value, 10),
        speed: parseInt(els.cursorTrailSpeed.value, 10)
      }
    };
    currentSettings.timestamp = Date.now();

    return currentSettings;
  }

  function queueAutoSave() {
    setSavingState();
    if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
    saveDebounceTimer = setTimeout(() => {
      saveSettings(true);
    }, 400);
  }

  function triggerImmediateSave() {
    setSavingState();
    if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
    saveSettings(true);
  }

  function setSavingState() {
    els.statusDot.classList.add('saving');
    els.statusText.textContent = t('statusSaving');
  }

  function setSyncedState() {
    els.statusDot.classList.remove('saving');
    els.statusDot.classList.remove('blocked');
    els.statusText.textContent = t('statusSynced');
  }

  async function saveSettings(silent = true) {
    const settings = collectSettings();

    try {
      await chrome.storage.local.set({ [currentDomain]: settings });
      if (currentDomain === siteDomain) { siteHasOwnConfig = true; updateTargetHint(); }

      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
          await sendToTab(tab.id, { action: 'updateBackground', settings });
        }
      } catch (err) {
        console.log('Content script might not be ready', err);
      }

      setSyncedState();
    } catch (err) {
      els.statusText.textContent = t('error');
      console.error(err);
    }
  }

  async function resetSettings() {
    setSavingState();
    await chrome.storage.local.remove(currentDomain);
    if (currentDomain === siteDomain) { siteHasOwnConfig = false; updateTargetHint(); }

    currentSettings = {
      mode: 'single',
      type: 'none',
      value: '',
      opacity: 100,
      blur: 0,
      style: { fixed: true, size: 'cover', repeat: false },
      timeRange: {
        items: [
          { id: 'morning', name: lang === 'zh' ? '清晨' : 'Morning', start: 5, end: 9, type: 'none', value: '', opacity: 100, blur: 0, style: { fixed: true, size: 'cover', repeat: false } },
          { id: 'noon', name: lang === 'zh' ? '正午' : 'Noon', start: 9, end: 17, type: 'none', value: '', opacity: 100, blur: 0, style: { fixed: true, size: 'cover', repeat: false } },
          { id: 'dusk', name: lang === 'zh' ? '黄昏' : 'Dusk', start: 17, end: 21, type: 'none', value: '', opacity: 100, blur: 0, style: { fixed: true, size: 'cover', repeat: false } },
          { id: 'night', name: lang === 'zh' ? '深夜' : 'Night', start: 21, end: 5, type: 'none', value: '', opacity: 100, blur: 0, style: { fixed: true, size: 'cover', repeat: false } }
        ]
      },
      slideshow: {
        interval: 'open',
        order: 'sequential',
        currentIndex: 0,
        lastRotationTime: Date.now(),
        items: [
          { type: 'none', value: '', opacity: 100, blur: 0, style: { fixed: true, size: 'cover', repeat: false } }
        ]
      },
      targetSelector: '',
      deepCompat: false,
      deepCompatAggressive: false,
      deepCompatExclude: '',
      customCss: '',
      frostedGlass: [],
      cursor: Object.assign({ enabled: false }, window.PageDyeCursor.normalizeCursorConfig())
    };
    activeScheme = 'light';
    activeTimePeriodIndex = 0;
    activeSlideshowIndex = 0;
    
    const radio = document.querySelector('input[name="wpMode"][value="single"]');
    if (radio) radio.checked = true;
    updateModeUI('single');

    // Clear every field collectSettings() reads *before* anything below
    // triggers a save (the "none" click and clearFile() both synchronously
    // save via triggerImmediateSave()). Reading these fields after the save
    // fires would persist their stale pre-reset values — targetSelector,
    // customCss and frostedGlass live outside populateForm()/currentSettings
    // and are otherwise only cleared afterwards, too late to be picked up.
    els.opacity.value = 100;
    els.blur.value = 0;
    els.effectKind.value = 'waves';
    els.effectText.value = 'PageDye';
    els.effectTextControl.classList.add('hidden');
    els.effectColorScheme.value = 'auto';
    els.effectColorCustomControl.classList.add('hidden');
    els.effectColor.value = '#ffffff';
    els.effectColorText.value = '#ffffff';
    els.effectBgColor.value = '#000000';
    els.effectBgColorText.value = '#000000';
    els.effectDensity.value = 50;
    els.effectDensityVal.textContent = '50%';
    els.effectSpeed.value = 50;
    els.effectSpeedVal.textContent = '50%';
    els.imageUrl.value = '';
    els.targetSelector.value = '';
    els.performanceMode.value = 'auto';
    syncDeepCompatRunMode('normal');
    renderDeepCompatExcludes();
    els.customCss.value = '';
    renderFrostedList([]);
    els.cursorToggle.checked = false;
    cursorPresetState = 'ball';
    renderCursorPresetsGrid();
    els.cursorColor.value = '#ff5fa2';
    els.cursorColorText.value = '#ff5fa2';
    els.cursorSize.value = 24;
    els.cursorSizeVal.textContent = '24px';
    els.cursorHoverScale.value = 1.6;
    els.cursorHoverScaleVal.textContent = '1.6x';
    els.cursorSmoothingToggle.checked = false;
    els.cursorTrailToggle.checked = false;
    els.cursorTrailOptions.classList.add('hidden');
    els.cursorTrailStyle.value = 'fade';
    els.cursorTrailLength.value = 12;
    els.cursorTrailLengthVal.textContent = '12';
    els.cursorTrailSpeed.value = 50;
    els.cursorTrailSpeedVal.textContent = '50%';
    if (cssEditorController) cssEditorController.update();

    document.querySelector('input[value="none"]').click();
    clearFile();

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      chrome.tabs.sendMessage(tab.id, { action: 'updateBackground', settings: { type: 'none' } });
    }
    setSyncedState();
  }

  // Inject the element picker directly into the page, passing the current form
  // state so the picker can write the final settings (form + picked selector)
  // itself. We use executeScript (not messaging) so it works even when the
  // content script isn't reachable. The picker applies the result immediately
  // via the content script's storage listener — no popup reopen needed.
  async function startPicker() {
    const settings = collectSettings();
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['scripts/gradient.js', 'scripts/effects.js', 'scripts/cursor.js', 'scripts/content.js']
      });
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: pagedyeElementPicker,
        args: [settings, currentDomain, ['targetSelector'], t('pickerTipMultiple'), t('pickerTipSingle')]
      });
      window.close();
    } catch (err) {
      console.log('Cannot start picker on this page', err);
      setSavingState();
      els.statusText.textContent = t('pickerFailed');
    }
  }

  // Same flow as startPicker(), but writes the picked selector into
  // frostedGlass[index].selector instead of targetSelector — each frosted
  // entry keeps its own selector, so picking a new element never overwrites
  // any other entry's.
  async function startFrostedPicker(index) {
    const settings = collectSettings();
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['scripts/gradient.js', 'scripts/effects.js', 'scripts/cursor.js', 'scripts/content.js']
      });
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: pagedyeElementPicker,
        args: [settings, currentDomain, ['frostedGlass', index, 'selector'], t('pickerTipMultiple'), t('pickerTipSingle')]
      });
      window.close();
    } catch (err) {
      console.log('Cannot start picker on this page', err);
      setSavingState();
      els.statusText.textContent = t('pickerFailed');
    }
  }

  // Same flow as startPicker(), but writes the picked selector into
  // deepCompatExclude selector list.
  async function startDeepCompatPicker() {
    const settings = collectSettings();
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['scripts/gradient.js', 'scripts/effects.js', 'scripts/cursor.js', 'scripts/content.js']
      });
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: pagedyeElementPicker,
        args: [settings, currentDomain, ['deepCompatExclude'], t('pickerTipMultiple'), t('pickerTipSingle')]
      });
      window.close();
    } catch (err) {
      console.log('Cannot start picker on this page', err);
      setSavingState();
      els.statusText.textContent = t('pickerFailed');
    }
  }

  function renderTimeCards() {
    if (!els.timePeriodsList || !currentSettings) return;
    els.timePeriodsList.innerHTML = '';
    const items = currentSettings.timeRange.items || [];
    const formatHour = h => String(h).padStart(2, '0') + ':00';

    items.forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = 'scheme-card';
      if (idx === activeTimePeriodIndex) card.classList.add('active');
      card.dataset.index = idx;

      const preview = document.createElement('div');
      preview.className = 'scheme-card-preview';
      updateCardPreview(preview, item);
      card.appendChild(preview);

      const info = document.createElement('div');
      info.className = 'scheme-card-info';
      
      const icon = document.createElement('span');
      icon.innerHTML = `<svg class="scheme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M5.22 5.22l1.42 1.42M18.78 5.22l-1.42 1.42M2 12h2M20 12h2"/></svg>`;
      info.appendChild(icon);

      const span = document.createElement('span');
      span.textContent = `${item.name || (lang === 'zh' ? '未命名' : 'Unnamed')} (${formatHour(item.start)} - ${formatHour(item.end)})`;
      info.appendChild(span);
      card.appendChild(info);

      if (items.length > 1) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-card-btn';
        deleteBtn.innerHTML = '×';
        deleteBtn.type = 'button';
        deleteBtn.title = lang === 'zh' ? '删除此时段' : 'Delete period';
        deleteBtn.style.cssText = 'position: absolute; top: 4px; right: 4px; border: none; background: rgba(0,0,0,0.4); color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1; z-index: 10;';
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (items.length <= 1) return;
          items.splice(idx, 1);
          if (activeTimePeriodIndex >= items.length) {
            activeTimePeriodIndex = items.length - 1;
          }
          renderTimeCards();
          const activeItem = items[activeTimePeriodIndex];
          if (activeItem) {
            populateForm(activeItem);
            populateTimeRangeConfigPanel(activeItem);
          }
          triggerImmediateSave();
        });
        card.appendChild(deleteBtn);
      }

      card.addEventListener('click', () => {
        if (activeTimePeriodIndex === idx) return;
        const prevItem = items[activeTimePeriodIndex];
        if (prevItem) {
          collectFormTo(prevItem);
          collectTimeRangeConfigPanel(prevItem);
        }
        activeTimePeriodIndex = idx;
        renderTimeCards();
        const activeItem = items[activeTimePeriodIndex];
        if (activeItem) {
          populateForm(activeItem);
          populateTimeRangeConfigPanel(activeItem);
        }
      });

      els.timePeriodsList.appendChild(card);
    });

    const addCard = document.createElement('div');
    addCard.className = 'scheme-card add-time-card';
    addCard.style.cssText = 'border: 2px dashed var(--border-color); background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 24px; color: var(--text-secondary); min-height: 80px; border-radius: var(--radius); position: relative;';
    addCard.textContent = '+';
    addCard.addEventListener('click', () => {
      const template = {
        id: 'period_' + Date.now(),
        name: lang === 'zh' ? '新时段' : 'New Period',
        start: 0,
        end: 23,
        type: 'none',
        value: '',
        opacity: 100,
        blur: 0,
        style: { fixed: true, size: 'cover', repeat: false }
      };
      items.push(template);
      activeTimePeriodIndex = items.length - 1;
      renderTimeCards();
      const activeItem = items[activeTimePeriodIndex];
      if (activeItem) {
        populateForm(activeItem);
        populateTimeRangeConfigPanel(activeItem);
      }
      triggerImmediateSave();
    });
    els.timePeriodsList.appendChild(addCard);
  }

  function initTimeRangePeriodSelects() {
    const selects = [els.timePeriodStart, els.timePeriodEnd];
    selects.forEach(selectEl => {
      if (!selectEl) return;
      selectEl.innerHTML = '';
      for (let h = 0; h < 24; h++) {
        const opt = document.createElement('option');
        opt.value = h;
        opt.textContent = String(h).padStart(2, '0') + ':00';
        selectEl.appendChild(opt);
      }
    });

    if (els.timePeriodName) {
      els.timePeriodName.addEventListener('input', () => {
        if (!currentSettings || !currentSettings.timeRange || !currentSettings.timeRange.items) return;
        const activeItem = currentSettings.timeRange.items[activeTimePeriodIndex];
        if (activeItem) {
          activeItem.name = els.timePeriodName.value.trim();
          renderTimeCards();
          triggerImmediateSave();
        }
      });
    }

    if (els.timePeriodStart) {
      els.timePeriodStart.addEventListener('change', () => {
        if (!currentSettings || !currentSettings.timeRange || !currentSettings.timeRange.items) return;
        const activeItem = currentSettings.timeRange.items[activeTimePeriodIndex];
        if (activeItem) {
          activeItem.start = parseInt(els.timePeriodStart.value, 10);
          renderTimeCards();
          triggerImmediateSave();
        }
      });
    }

    if (els.timePeriodEnd) {
      els.timePeriodEnd.addEventListener('change', () => {
        if (!currentSettings || !currentSettings.timeRange || !currentSettings.timeRange.items) return;
        const activeItem = currentSettings.timeRange.items[activeTimePeriodIndex];
        if (activeItem) {
          activeItem.end = parseInt(els.timePeriodEnd.value, 10);
          renderTimeCards();
          triggerImmediateSave();
        }
      });
    }
  }

  function populateTimeRangeConfigPanel(item) {
    if (!item) return;
    if (els.timePeriodName) els.timePeriodName.value = item.name || '';
    if (els.timePeriodStart) els.timePeriodStart.value = item.start;
    if (els.timePeriodEnd) els.timePeriodEnd.value = item.end;
  }

  function collectTimeRangeConfigPanel(item) {
    if (!item) return;
    if (els.timePeriodName) item.name = els.timePeriodName.value.trim() || (lang === 'zh' ? '未命名' : 'Unnamed');
    if (els.timePeriodStart) item.start = parseInt(els.timePeriodStart.value, 10);
    if (els.timePeriodEnd) item.end = parseInt(els.timePeriodEnd.value, 10);
  }

  isInitialLoad = false;
});

function initCustomCssEditor(textareaId, containerId) {
  const textarea = document.getElementById(textareaId);
  const container = document.getElementById(containerId);
  if (!textarea || !container) return null;

  const gutter = container.querySelector('.editor-gutter');
  const codeBlock = container.querySelector('.editor-highlight code');
  const preBlock = container.querySelector('.editor-highlight');

  function updateEditor() {
    let code = textarea.value;
    const isPlaceholder = !code;
    
    if (isPlaceholder) {
      code = textarea.getAttribute('placeholder') || '';
      container.classList.add('placeholder-active');
    } else {
      container.classList.remove('placeholder-active');
    }

    const highlighted = Prism.highlight(code, Prism.languages.css, 'css');
    codeBlock.innerHTML = code.endsWith('\n') ? highlighted + ' ' : highlighted;

    const lineCount = code.split('\n').length;
    let gutterHTML = '';
    for (let i = 1; i <= lineCount; i++) {
      gutterHTML += `<span class="editor-gutter-num">${i}</span>`;
    }
    gutter.innerHTML = gutterHTML;
    
    syncScrolls();
  }

  function syncScrolls() {
    gutter.scrollTop = textarea.scrollTop;
    preBlock.scrollTop = textarea.scrollTop;
    preBlock.scrollLeft = textarea.scrollLeft;
  }

  textarea.addEventListener('scroll', syncScrolls);
  textarea.addEventListener('input', updateEditor);

  textarea.addEventListener('keydown', (e) => {
    const val = textarea.value;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // 1. Tab Key Support (2 spaces)
    if (e.key === 'Tab') {
      e.preventDefault();
      textarea.value = val.substring(0, start) + '  ' + val.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + 2;
      updateEditor();
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // 2. Overwrite closing character if already typed
    const closers = ['}', ')', ']', '"', "'"];
    if (closers.includes(e.key) && start === end) {
      const nextChar = val.charAt(start);
      if (nextChar === e.key) {
        e.preventDefault();
        textarea.selectionStart = textarea.selectionEnd = start + 1;
        return;
      }
    }

    // 3. Auto-closing brackets
    const pairs = {
      '{': '}',
      '(': ')',
      '[': ']',
      '"': '"',
      "'": "'"
    };

    if (pairs[e.key] !== undefined) {
      e.preventDefault();
      const closing = pairs[e.key];
      if (start !== end) {
        const selected = val.substring(start, end);
        textarea.value = val.substring(0, start) + e.key + selected + closing + val.substring(end);
        textarea.selectionStart = start + 1;
        textarea.selectionEnd = end + 1;
      } else {
        textarea.value = val.substring(0, start) + e.key + closing + val.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + 1;
      }
      updateEditor();
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // 4. Smart Indentation on Enter key
    if (e.key === 'Enter' && start === end) {
      const charBefore = val.charAt(start - 1);
      const charAfter = val.charAt(start);
      if (charBefore === '{' && charAfter === '}') {
        e.preventDefault();
        textarea.value = val.substring(0, start) + '\n  \n' + val.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + 3;
        updateEditor();
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      } else if (charBefore === '{') {
        e.preventDefault();
        textarea.value = val.substring(0, start) + '\n  ' + val.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + 3;
        updateEditor();
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  });

  updateEditor();

  return {
    update: updateEditor
  };
}

document.addEventListener('DOMContentLoaded', () => {
  // --- New UI Enhancements (Facade & Preset Colors) ---
  const facadeRadios = document.querySelectorAll('input[name="bgStyleFacade"]');
  const colorPicker = document.getElementById('color-picker');
  const colorText = document.getElementById('color-text');
  const copyBtn = document.getElementById('copy-color-btn');

  function syncFacadeUI() {
    const activeType = document.querySelector('input[name="bgType"]:checked')?.value || 'none';
    const activeColorMode = document.querySelector('input[name="colorMode"]:checked')?.value || 'solid';
    const effectToggle = document.getElementById('effect-overlay-toggle');
    
    let facadeValue = activeType;
    if (activeType === 'color') {
      facadeValue = activeColorMode; // 'solid' or 'gradient'
    } else if (activeType === 'none' && effectToggle && effectToggle.checked) {
      facadeValue = 'effect';
    }
    
    const facadeInput = document.querySelector(`input[name="bgStyleFacade"][value="${facadeValue}"]`);
    if (facadeInput) {
      facadeInput.checked = true;
    }
    
    const effectContainer = document.getElementById('effect-overlay-container');
    if (effectContainer) {
       effectContainer.style.display = (facadeValue === 'effect') ? 'none' : '';
    }
  }

  window.syncFacadeUI = syncFacadeUI;
  setTimeout(syncFacadeUI, 100);

  facadeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      const val = e.target.value;
      let targetType = val;
      let targetColorMode = null;
      let targetEffect = null;
      
      if (val === 'solid' || val === 'gradient') {
        targetType = 'color';
        targetColorMode = val;
      } else if (val === 'effect') {
        targetType = 'none';
        targetEffect = true;
      } else if (val === 'none') {
        targetType = 'none';
        targetEffect = false;
      }
      
      const typeInput = document.querySelector(`input[name="bgType"][value="${targetType}"]`);
      if (typeInput && !typeInput.checked) {
        typeInput.checked = true;
        typeInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
      
      if (targetColorMode) {
        const modeInput = document.querySelector(`input[name="colorMode"][value="${targetColorMode}"]`);
        if (modeInput && !modeInput.checked) {
          modeInput.checked = true;
          modeInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
      
      if (targetEffect !== null) {
        const effectToggle = document.getElementById('effect-overlay-toggle');
        if (effectToggle && effectToggle.checked !== targetEffect) {
            effectToggle.checked = targetEffect;
            effectToggle.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
      
      syncFacadeUI();
    });
  });

  function selectPresetColor(color, dotEl) {
    document.querySelectorAll('.preset-color-dot').forEach(d => d.classList.remove('active'));
    if (dotEl) dotEl.classList.add('active');
    if (colorPicker) {
      colorPicker.value = color;
      colorPicker.dispatchEvent(new Event('input', { bubbles: true }));
      colorPicker.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (colorText) {
      colorText.value = color;
    }
  }

  // Light preset colors read comfortably on light pages but are jarring as
  // an actual dark-room background, so light and dark are two permanently
  // visible, separately labeled groups, each with its own "+" button.
  const presetColorsLight = document.getElementById('preset-colors-light');
  const presetColorsDark = document.getElementById('preset-colors-dark');

  // Delegated so it covers both the built-in dots and any custom ones added
  // via the "+" button below, without re-binding listeners after each add.
  [presetColorsLight, presetColorsDark].filter(Boolean).forEach(row => {
    row.addEventListener('click', (e) => {
      const delBtn = e.target.closest('.preset-color-dot-delete');
      if (delBtn) {
        e.stopPropagation();
        const dot = delBtn.closest('.preset-color-dot');
        const color = dot.getAttribute('data-color');
        const scheme = row === presetColorsDark ? 'dark' : 'light';
        dot.remove();
        removeCustomPresetColor(scheme, color);
        return;
      }
      const dot = e.target.closest('.preset-color-dot');
      if (dot) selectPresetColor(dot.getAttribute('data-color'), dot);
    });
  });

  function createCustomPresetDot(color) {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'preset-color-dot preset-color-dot-custom';
    dot.style.backgroundColor = color;
    dot.setAttribute('data-color', color);
    const del = document.createElement('span');
    del.className = 'preset-color-dot-delete';
    del.title = 'Remove';
    del.textContent = '×';
    dot.appendChild(del);
    return dot;
  }

  async function loadCustomPresetColors() {
    const data = await chrome.storage.local.get(CUSTOM_PRESET_COLORS_KEY);
    return Object.assign({ light: [], dark: [] }, data[CUSTOM_PRESET_COLORS_KEY] || {});
  }

  async function removeCustomPresetColor(scheme, color) {
    const custom = await loadCustomPresetColors();
    custom[scheme] = (custom[scheme] || []).filter(c => c !== color);
    await chrome.storage.local.set({ [CUSTOM_PRESET_COLORS_KEY]: custom });
  }

  async function addCustomPresetColor(scheme, color) {
    const custom = await loadCustomPresetColors();
    if (!custom[scheme].includes(color)) {
      custom[scheme].push(color);
      await chrome.storage.local.set({ [CUSTOM_PRESET_COLORS_KEY]: custom });
    }
  }

  loadCustomPresetColors().then(custom => {
    if (presetColorsLight) custom.light.forEach(color => presetColorsLight.appendChild(createCustomPresetDot(color)));
    if (presetColorsDark) custom.dark.forEach(color => presetColorsDark.appendChild(createCustomPresetDot(color)));
  });

  [
    { btn: document.getElementById('add-color-btn'), row: presetColorsLight, scheme: 'light' },
    { btn: document.getElementById('add-color-btn-dark'), row: presetColorsDark, scheme: 'dark' },
  ].forEach(({ btn, row, scheme }) => {
    if (!btn || !row) return;
    btn.addEventListener('click', () => {
      const tempPicker = document.createElement('input');
      tempPicker.type = 'color';
      tempPicker.value = (colorText && colorText.value) || (scheme === 'dark' ? '#1c1c1e' : '#ffffff');
      Object.assign(tempPicker.style, { position: 'fixed', top: '0', left: '0', opacity: '0', pointerEvents: 'none' });
      document.body.appendChild(tempPicker);
      tempPicker.addEventListener('change', async () => {
        const color = tempPicker.value.toUpperCase();
        tempPicker.remove();
        if (!row.querySelector(`[data-color="${color}"]`)) {
          const dot = createCustomPresetDot(color);
          row.appendChild(dot);
          await addCustomPresetColor(scheme, color);
          selectPresetColor(color, dot);
        } else {
          selectPresetColor(color, row.querySelector(`[data-color="${color}"]`));
        }
      });
      tempPicker.click();
    });
  });

  if (copyBtn && colorText) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(colorText.value).then(() => {
        copyBtn.classList.add('copied');
        copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        setTimeout(() => {
          copyBtn.classList.remove('copied');
          copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
        }, 1500);
      });
    });
  }
});
