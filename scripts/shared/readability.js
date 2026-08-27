// Contrast checking for the one failure mode PageDye can actually cause.
//
// PageDye replaces backgrounds and cannot restyle a page's text. That is the
// constraint the AI prompt spends most of its words on — but the AI is opt-in
// and needs an API key, while anyone can drag a photo onto a site and make its
// body copy unreadable. This module is the same check without a model: pure
// arithmetic over colors the extension already knows.
//
// What it models is exactly what content.js paints, in the same order:
//
//   page background            the site's own color, under everything
//   -> wallpaper               a gradient stop or image color at `opacity`
//   -> frosted panel           the tint (or the OS-scheme default) at its own
//                              opacity, sitting on top of the wallpaper
//   -> the page's own text     which does not move, and which is the thing
//                              that has to stay legible
//
// Contrast is WCAG 2.x relative luminance, the same ratio a browser devtools
// panel reports, so a number here is a number a user can check independently.
//
// Pure and DOM-free on purpose: it runs in the popup, the options page and
// node's test runner without any of them having to agree on a rendering
// context. Loaded as a plain global-scope script like the other shared modules.

(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.PageDyeReadability = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const HEX_RE = /^#[0-9a-fA-F]{6}$/;
  const SHORT_HEX_RE = /^#[0-9a-fA-F]{3}$/;

  // WCAG 2.x AA for body text. Large text only needs 3:1, but a container
  // selector says nothing about the size of the text inside it, so the stricter
  // of the two is the only one that can be applied without guessing.
  const AA_NORMAL = 4.5;
  // Below this the text is not "a bit tight", it is gone. Worth telling the
  // user about in stronger terms than a merely imperfect ratio.
  const SEVERE = 3;

  // The untinted frosted default, straight out of content.js's
  // applyFrostedGlass. It follows the OS scheme, which is why a check has to
  // run against both: the user's own scheme today does not make the other one
  // stop existing.
  const SCHEME_DEFAULTS = { light: '#ffffff', dark: '#141414' };

  function toRgb(color) {
    if (typeof color !== 'string') return null;
    let hex = color.trim();
    if (SHORT_HEX_RE.test(hex)) hex = '#' + hex.slice(1).split('').map((c) => c + c).join('');
    if (!HEX_RE.test(hex)) return null;
    return {
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16)
    };
  }

  function toHex(rgb) {
    return '#' + [rgb.r, rgb.g, rgb.b]
      .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
      .join('');
  }

  function relativeLuminance(color) {
    const rgb = toRgb(color);
    if (!rgb) return null;
    const linear = (value) => {
      const channel = value / 255;
      return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * linear(rgb.r) + 0.7152 * linear(rgb.g) + 0.0722 * linear(rgb.b);
  }

  // 1 (identical) to 21 (black on white).
  function contrastRatio(a, b) {
    const la = relativeLuminance(a);
    const lb = relativeLuminance(b);
    if (la === null || lb === null) return null;
    const lighter = Math.max(la, lb);
    const darker = Math.min(la, lb);
    return (lighter + 0.05) / (darker + 0.05);
  }

  // `top` painted at `alpha` over `bottom`. Straight source-over compositing,
  // which is what a browser does with an rgba() background-color.
  function blendOver(top, alpha, bottom) {
    const fg = toRgb(top);
    const bg = toRgb(bottom);
    if (!fg || !bg) return null;
    const a = Math.max(0, Math.min(1, Number(alpha)));
    return toHex({
      r: fg.r * a + bg.r * (1 - a),
      g: fg.g * a + bg.g * (1 - a),
      b: fg.b * a + bg.b * (1 - a)
    });
  }

  function percentToAlpha(value, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.max(0, Math.min(100, number)) / 100;
  }

  // Every color the wallpaper actually resolves to on the page, after its own
  // opacity is composited over the site's own background. A gradient is only
  // as readable as its worst stop, so all of them come back.
  function wallpaperColors(wallpaper) {
    const source = wallpaper && typeof wallpaper === 'object' ? wallpaper : {};
    const pageBackground = toRgb(source.pageBackground) ? source.pageBackground : '#ffffff';
    const alpha = percentToAlpha(source.opacity, 1);
    const colors = (Array.isArray(source.colors) ? source.colors : [])
      .map((color) => blendOver(color, alpha, pageBackground))
      .filter(Boolean);
    // With no wallpaper of its own the page background is still what the text
    // sits on, so the check has something to report against rather than
    // silently passing.
    return colors.length ? colors : [pageBackground];
  }

  // The worst contrast one frosted container ends up with, across every
  // wallpaper color and both OS schemes. Returns null when the check cannot be
  // made — an unknown selector, or a text color the profile could not read —
  // because a guessed warning is worse than no warning.
  function frostedContrast(entry, wallpaper, textColor) {
    if (!toRgb(textColor)) return null;
    const source = entry && typeof entry === 'object' ? entry : {};
    const alpha = percentToAlpha(source.opacity, 0.55);
    // A tint is one fixed color in both schemes; without one the renderer
    // swaps near-white for near-black, so both have to be checked.
    const tints = toRgb(source.color)
      ? [{ scheme: 'both', color: source.color }]
      : [{ scheme: 'light', color: SCHEME_DEFAULTS.light }, { scheme: 'dark', color: SCHEME_DEFAULTS.dark }];

    let worst = null;
    for (const backdrop of wallpaperColors(wallpaper)) {
      for (const tint of tints) {
        const panel = blendOver(tint.color, alpha, backdrop);
        const ratio = contrastRatio(panel, textColor);
        if (ratio === null) continue;
        if (!worst || ratio < worst.ratio) worst = { ratio, scheme: tint.scheme, panel, backdrop };
      }
    }
    return worst;
  }

  function findContainer(containers, selector) {
    return (Array.isArray(containers) ? containers : [])
      .find((container) => container && container.selector === selector) || null;
  }

  // The whole check, worst first. `containers` is a page profile's container
  // list (scripts/page-profile.js), which is where the text colors come from —
  // without it nothing can be judged, and an empty result says exactly that
  // rather than pretending everything passed.
  function check({ frostedGlass, wallpaper, containers } = {}) {
    const findings = [];
    for (const entry of (Array.isArray(frostedGlass) ? frostedGlass : [])) {
      if (!entry || !entry.selector) continue;
      const container = findContainer(containers, entry.selector);
      if (!container) continue;
      const worst = frostedContrast(entry, wallpaper, container.textColor);
      if (!worst || worst.ratio >= AA_NORMAL) continue;
      findings.push({
        selector: entry.selector,
        textColor: container.textColor,
        ratio: Math.round(worst.ratio * 10) / 10,
        scheme: worst.scheme,
        panel: worst.panel,
        severe: worst.ratio < SEVERE
      });
    }
    return findings.sort((a, b) => a.ratio - b.ratio);
  }

  return Object.freeze({
    AA_NORMAL,
    SEVERE,
    SCHEME_DEFAULTS,
    relativeLuminance,
    contrastRatio,
    blendOver,
    wallpaperColors,
    frostedContrast,
    check
  });
});
