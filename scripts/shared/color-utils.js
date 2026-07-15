// Color math shared verbatim between popup/popup.js and options/options.js.
// These are the functions that were byte-for-byte identical in both files before
// extraction: normalizeHexColor/hexToRgba/shiftHexColor/hexToHsl/hslToHex and the
// accent lookup helpers built on them, plus the UI_THEME_ACCENTS palette they share.
// colorIsLight and the Material-You surface-tone derivations are intentionally NOT
// here — they already behave differently between popup and options and were left
// duplicated rather than silently reconciled.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.PageDyeColorUtils = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

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

  function getUiAccentColor(theme) {
    if (theme.accent === 'custom') {
      return normalizeHexColor(theme.customAccent, UI_THEME_ACCENTS.neutral);
    }
    return UI_THEME_ACCENTS[theme.accent] || UI_THEME_ACCENTS.neutral;
  }

  function getDisplayAccentColor(accentHex, isDark) {
    const { h, s, l } = hexToHsl(accentHex);
    const targetL = isDark ? Math.max(l, 70) : Math.min(l, 45);
    return hslToHex(h, s, targetL);
  }

  return {
    UI_THEME_ACCENTS,
    normalizeHexColor,
    hexToRgba,
    shiftHexColor,
    hexToHsl,
    hslToHex,
    getUiAccentColor,
    getDisplayAccentColor
  };
});
