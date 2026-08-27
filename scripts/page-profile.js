// Page visual profile sampler: builds a compact, content-free description of
// what the current page *looks like* — its base colors, and the opaque
// containers stacked on top of them — for the AI theme generator to reason
// about.
//
// Deliberately samples computed styles instead of markup. Everything a theme
// decision actually depends on (what color is this panel right now, how much
// of the viewport does it cover, is the page already dark) exists only in
// getComputedStyle output and layout geometry; none of it appears in the HTML
// source, where `class="card"` says nothing about the color it resolves to.
// The useful side effect is that no page text is ever read — the profile
// carries geometry, colors and selectors only, so a user's inbox or dashboard
// contents never leave the browser even though the page was "read".
//
// Containers are found by hit-testing a grid of viewport points rather than
// walking the DOM. elementsFromPoint returns the actual paint stack at each
// point, which is exactly the question being asked: what is covering the
// wallpaper? A DOM walk would instead enumerate thousands of elements and
// still need geometry to tell which of them are visible, so the grid is both
// cheaper and a closer match to the problem.
//
// Injected on demand via chrome.scripting.executeScript (NOT a manifest
// content script) — a feature used once per site should not cost every page
// load. Injecting the file only defines the sampler; the caller then runs
// `func: () => window.PageDyeProfile.build()` to collect a profile. Both land
// in the same isolated world, so the second call sees the global the first
// one installed.

window.PageDyeProfile = (function () {
  'use strict';

  // Enough points to catch a sidebar or a row of cards without turning the
  // sampler into a layout-thrashing hot loop; every point costs one
  // elementsFromPoint hit test plus the getComputedStyle calls for its stack.
  const GRID_COLS = 7;
  const GRID_ROWS = 7;
  const MAX_CANDIDATES = 12;
  // A container has to actually obscure something to be worth frosting.
  const MIN_VIEWPORT_AREA_RATIO = 0.02;
  const MIN_OPAQUE_ALPHA = 0.35;
  // Utility-class frameworks (Tailwind, Primer) leave elements whose only
  // usable classes are things like `.p-1`, which resolve to a selector
  // matching hundreds of nodes. Frosting that many turns the whole page
  // translucent, so such a candidate is worse than no candidate at all.
  const MAX_SELECTOR_MATCHES = 40;

  function parseCssColor(value) {
    if (typeof value !== 'string') return null;
    const match = value.match(/^rgba?\(([^)]+)\)$/i);
    if (!match) return null;
    // Both the legacy comma form and the modern space/slash form are possible
    // depending on the browser, so split on anything that separates channels.
    const parts = match[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    if (parts.length < 3 || parts.some((part) => !Number.isFinite(part))) return null;
    return {
      r: Math.round(parts[0]),
      g: Math.round(parts[1]),
      b: Math.round(parts[2]),
      a: parts.length > 3 ? parts[3] : 1
    };
  }

  function toHex(rgb) {
    if (!rgb) return null;
    const channel = (value) => Math.max(0, Math.min(255, value)).toString(16).padStart(2, '0');
    return `#${channel(rgb.r)}${channel(rgb.g)}${channel(rgb.b)}`;
  }

  // Perceived lightness on the same 0-1 scale the WCAG contrast formula uses,
  // so "is this page already dark" matches what a reader would say rather than
  // a naive channel average (which calls pure blue and pure yellow equal).
  function relativeLuminance(rgb) {
    if (!rgb) return 1;
    const linear = (value) => {
      const channel = value / 255;
      return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * linear(rgb.r) + 0.7152 * linear(rgb.g) + 0.0722 * linear(rgb.b);
  }

  // Build-generated class names (CSS modules, styled-components, emotion) are
  // rebuilt on every deploy, so a selector pinned to one silently stops
  // matching the next time the site ships. Dropping them costs specificity but
  // keeps the saved theme working.
  const HASHED_CLASS_PATTERNS = [
    /^(css|sc|jsx|emotion|svelte)-[a-z0-9]{4,}$/i,
    // The CSS-modules convention itself, whatever the hash looks like:
    // `MarketingHeader-module__root__Tk7n3`.
    /-module__/i,
    /^_[a-zA-Z0-9]{5,}$/
  ];

  // Distinguishes a build hash from a hand-written BEM element. Both appear
  // after `__`, so the pattern alone cannot tell `card__body` (stable, worth
  // keeping) from `card__gl6dE` (regenerated next deploy). Hashes mix
  // character classes the way real words don't — a digit next to letters, or
  // camelCase with digits — which is a cheap and reliable separator.
  function looksLikeHash(token) {
    if (token.length < 4 || token.length > 12) return false;
    return /\d/.test(token) && /[a-zA-Z]/.test(token);
  }

  function isUsableClass(name) {
    if (typeof name !== 'string' || !name) return false;
    if (name.length > 60) return false;
    // Anything needing CSS escaping is more trouble than the specificity is
    // worth, and would also have to survive storage-schema's selector check.
    if (!/^[a-zA-Z][\w-]*$/.test(name)) return false;
    if (HASHED_CLASS_PATTERNS.some((pattern) => pattern.test(name))) return false;
    // Only underscore-separated names get the hash check. Dash-separated
    // names are conventionally hand-written (`col-md-6`, `bgColor-muted`),
    // and running the digit heuristic on them rejects perfectly stable
    // utility classes.
    if (!name.includes('_')) return true;
    const segments = name.split(/_+/);
    return !looksLikeHash(segments[segments.length - 1]);
  }

  function isUsableId(value) {
    return typeof value === 'string' && /^[a-zA-Z][\w-]{0,60}$/.test(value);
  }

  const SEMANTIC_TAGS = new Set(['main', 'header', 'nav', 'footer', 'aside', 'article', 'section']);

  // Returns the most stable selector that still resolves to `el`, preferring
  // meaning (semantic tag, id, content classes) over position. An nth-child
  // path is the last resort because it breaks the moment the site reorders a
  // sibling, and it is never returned for a frosted-glass target — a selector
  // that matches the wrong node after a redesign tints the wrong panel.
  function buildSelector(el) {
    if (!el || el.nodeType !== 1) return null;
    const tag = el.tagName.toLowerCase();

    if (isUsableId(el.id)) {
      const selector = `#${el.id}`;
      if (matchesExactly(selector, el)) return selector;
    }

    const classes = Array.from(el.classList || []).filter(isUsableClass).slice(0, 3);

    if (SEMANTIC_TAGS.has(tag)) {
      // A bare semantic tag is the most redesign-proof selector there is, but
      // only when the page uses it once; otherwise qualify it with a class.
      if (matchesExactly(tag, el)) return tag;
      for (const cls of classes) {
        const selector = `${tag}.${cls}`;
        if (matchesExactly(selector, el)) return selector;
      }
    }

    // Multi-class first: a single generic class like `.card` may match far more
    // than intended, and over-matching is the failure mode that makes a whole
    // page go translucent.
    if (classes.length > 1) {
      const selector = `${tag}.${classes.join('.')}`;
      if (selectorMatches(selector, el)) return selector;
    }
    for (const cls of classes) {
      const selector = `${tag}.${cls}`;
      if (selectorMatches(selector, el)) return selector;
    }
    if (SEMANTIC_TAGS.has(tag) && selectorMatches(tag, el)) return tag;

    const role = el.getAttribute && el.getAttribute('role');
    if (role && /^[a-zA-Z][\w-]*$/.test(role)) {
      const selector = `${tag}[role="${role}"]`;
      if (selectorMatches(selector, el)) return selector;
    }
    return null;
  }

  function selectorMatches(selector, el) {
    try {
      return el.matches(selector);
    } catch (_) {
      return false;
    }
  }

  function matchesExactly(selector, el) {
    try {
      const found = document.querySelectorAll(selector);
      return found.length === 1 && found[0] === el;
    } catch (_) {
      return false;
    }
  }

  function countMatches(selector) {
    try {
      return document.querySelectorAll(selector).length;
    } catch (_) {
      return 0;
    }
  }

  function isPageDyeOwned(el) {
    for (let node = el; node && node.nodeType === 1; node = node.parentElement) {
      if (typeof node.id === 'string' && node.id.startsWith('pagedye-')) return true;
    }
    return false;
  }

  function viewportCoverage(rect, viewportWidth, viewportHeight) {
    const width = Math.max(0, Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0));
    const height = Math.max(0, Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0));
    const area = viewportWidth * viewportHeight;
    return area > 0 ? (width * height) / area : 0;
  }

  function describeElement(el, style, rect, viewportWidth, viewportHeight) {
    const background = parseCssColor(style.backgroundColor);
    const selector = buildSelector(el);
    return {
      selector,
      tag: el.tagName.toLowerCase(),
      matchCount: selector ? countMatches(selector) : 0,
      backgroundColor: toHex(background),
      backgroundAlpha: background ? Math.round(background.a * 100) / 100 : 0,
      textColor: toHex(parseCssColor(style.color)),
      hasBackgroundImage: style.backgroundImage !== 'none',
      borderRadius: parseInt(style.borderRadius, 10) || 0,
      position: style.position,
      coverage: Math.round(viewportCoverage(rect, viewportWidth, viewportHeight) * 1000) / 1000
    };
  }

  // Walks each hit-test stack and keeps every element that paints its own
  // opaque background. Those, and only those, are what a wallpaper has to
  // fight with — an element with a transparent background is already showing
  // whatever is behind it and needs no frosting.
  function collectCandidates(viewportWidth, viewportHeight) {
    const seen = new Map();

    for (let col = 0; col < GRID_COLS; col++) {
      for (let row = 0; row < GRID_ROWS; row++) {
        const x = Math.round(((col + 0.5) / GRID_COLS) * viewportWidth);
        const y = Math.round(((row + 0.5) / GRID_ROWS) * viewportHeight);
        let stack;
        try {
          stack = document.elementsFromPoint(x, y);
        } catch (_) {
          continue;
        }
        for (const el of stack) {
          if (!el || el.nodeType !== 1) continue;
          if (el === document.body || el === document.documentElement) continue;
          if (isPageDyeOwned(el)) continue;
          const existing = seen.get(el);
          if (existing) {
            existing.hits++;
            continue;
          }
          seen.set(el, { el, hits: 1 });
        }
      }
    }

    const candidates = [];
    for (const entry of seen.values()) {
      const el = entry.el;
      let style;
      let rect;
      try {
        style = window.getComputedStyle(el);
        rect = el.getBoundingClientRect();
      } catch (_) {
        continue;
      }
      if (style.visibility === 'hidden' || style.display === 'none') continue;
      const background = parseCssColor(style.backgroundColor);
      const opacity = parseFloat(style.opacity);
      const effectiveAlpha = (background ? background.a : 0) * (Number.isFinite(opacity) ? opacity : 1);
      if (effectiveAlpha < MIN_OPAQUE_ALPHA) continue;
      if (viewportCoverage(rect, viewportWidth, viewportHeight) < MIN_VIEWPORT_AREA_RATIO) continue;

      const described = describeElement(el, style, rect, viewportWidth, viewportHeight);
      if (!described.selector) continue;
      if (described.matchCount > MAX_SELECTOR_MATCHES) continue;
      described.hits = entry.hits;
      candidates.push(described);
    }

    // Rank by how much of the viewport each one actually covers: the biggest
    // opaque surfaces are both the worst wallpaper offenders and the ones the
    // model should spend its attention on.
    candidates.sort((a, b) => b.coverage - a.coverage);

    // Two elements sharing a selector are one styling decision, not two.
    const bySelector = new Map();
    for (const candidate of candidates) {
      const existing = bySelector.get(candidate.selector);
      if (existing) {
        existing.coverage = Math.round((existing.coverage + candidate.coverage) * 1000) / 1000;
        continue;
      }
      bySelector.set(candidate.selector, candidate);
    }
    return Array.from(bySelector.values()).slice(0, MAX_CANDIDATES);
  }

  // The color the page falls back to behind everything else. body usually
  // declares it, but plenty of sites leave body transparent and paint html
  // instead, so fall through rather than reporting a misleading transparent.
  function resolveBaseBackground() {
    for (const el of [document.body, document.documentElement]) {
      if (!el) continue;
      let style;
      try {
        style = window.getComputedStyle(el);
      } catch (_) {
        continue;
      }
      const color = parseCssColor(style.backgroundColor);
      if (color && color.a > 0.1) return color;
    }
    return { r: 255, g: 255, b: 255, a: 1 };
  }

  // A few representative accent colors, so a generated palette can stay in the
  // same family as the site's own branding instead of clashing with buttons
  // and links it cannot restyle.
  function collectAccentColors() {
    const counts = new Map();
    let scanned = 0;
    let nodes;
    try {
      nodes = document.querySelectorAll('a, button, [role="button"]');
    } catch (_) {
      return [];
    }
    for (const el of nodes) {
      if (scanned >= 60) break;
      if (isPageDyeOwned(el)) continue;
      let style;
      let rect;
      try {
        style = window.getComputedStyle(el);
        rect = el.getBoundingClientRect();
      } catch (_) {
        continue;
      }
      if (rect.width < 1 || rect.height < 1) continue;
      scanned++;
      const background = parseCssColor(style.backgroundColor);
      const source = background && background.a > 0.5 ? background : parseCssColor(style.color);
      const hex = toHex(source);
      if (!hex) continue;
      counts.set(hex, (counts.get(hex) || 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([hex]) => hex);
  }

  function build() {
    const viewportWidth = Math.max(1, window.innerWidth || document.documentElement.clientWidth || 1);
    const viewportHeight = Math.max(1, window.innerHeight || document.documentElement.clientHeight || 1);
    const baseBackground = resolveBaseBackground();
    const bodyStyle = document.body ? window.getComputedStyle(document.body) : null;

    return {
      hostname: window.location.hostname,
      // Path only — no query string or hash, which routinely carry search
      // terms, session tokens and other things that have no business being
      // sent to a theme generator.
      path: window.location.pathname,
      viewport: { width: viewportWidth, height: viewportHeight },
      prefersDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
      base: {
        backgroundColor: toHex(baseBackground),
        textColor: bodyStyle ? toHex(parseCssColor(bodyStyle.color)) : null,
        fontFamily: bodyStyle ? String(bodyStyle.fontFamily || '').slice(0, 120) : null,
        // Reported rather than derived downstream so the model and PageDye
        // agree on what "this page is already dark" means.
        isDark: relativeLuminance(baseBackground) < 0.18
      },
      accentColors: collectAccentColors(),
      containers: collectCandidates(viewportWidth, viewportHeight)
    };
  }

  return { build, parseCssColor, relativeLuminance, buildSelector, isUsableClass };
})();
