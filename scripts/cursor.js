// Custom cursor overlay: replaces the native pointer with a small styled DOM
// shape (ball/ring/glow/dot-ring presets), scales it up when hovering
// interactive elements, and optionally renders a fading/comet/sparkle mouse
// trail on its own canvas. Fully self-contained — creates and owns its own
// fixed, shadow-DOM-isolated root (independent of content.js's background
// overlay root), so it works regardless of whether a background/effect is
// also active. Loaded as a plain global-scope script (no bundler/module
// system in this codebase) by content.js (via manifest.json content_scripts)
// — must load after effects.js and before content.js.
//
// Desktop-only by design: a touch device has no persistent pointer to
// replace, so start() is a no-op unless the browser reports a fine,
// hover-capable pointer (matchMedia('(hover: hover) and (pointer: fine)')).
// Tear down any previous instance before replacing window.PageDyeCursor —
// this file can be re-injected on top of an already-running content script
// (for example after an extension reload and on-demand runtime restore),
// and without this the old instance's root, rAF loop and listeners
// are simply orphaned rather than replaced, so overlays pile up and visibly
// overlap.
if (window.PageDyeCursor && typeof window.PageDyeCursor.stop === 'function') {
  try { window.PageDyeCursor.stop(); } catch (e) {}
}

window.PageDyeCursor = (function () {
  const ROOT_ID = 'pagedye-cursor-root';
  const HIDE_STYLE_ID = 'pagedye-cursor-hide-style';
  const HOVER_SELECTOR = 'a, button, [role="button"], input, select, textarea, label, summary';

  const PRESETS = {
    ball: { name_en: 'Ball', name_zh: '实心球' },
    ring: { name_en: 'Ring', name_zh: '空心环' },
    glow: { name_en: 'Glow Orb', name_zh: '发光球' },
    'dot-ring': { name_en: 'Dot & Ring', name_zh: '点环组合' }
  };

  const TRAIL_STYLES = {
    fade: { name_en: 'Fade', name_zh: '渐隐' },
    comet: { name_en: 'Comet', name_zh: '彗星' },
    sparkle: { name_en: 'Sparkle', name_zh: '闪烁' }
  };

  let cleanup = null;

  function clamp(n, min, max, fallback) {
    return typeof n === 'number' && !isNaN(n) ? Math.max(min, Math.min(max, n)) : fallback;
  }

  function normalizeCursorConfig(cfg) {
    const c = cfg || {};
    const trail = c.trail || {};
    return {
      preset: PRESETS[c.preset] ? c.preset : 'ball',
      color: (typeof c.color === 'string' && c.color) || '#ff5fa2',
      size: clamp(c.size, 12, 48, 24),
      hoverScale: clamp(c.hoverScale, 1, 3, 1.6),
      // Off by default: easing the cursor toward the pointer instead of
      // tracking it 1:1 reads as input lag and hurts precise clicking.
      // Users who want the "premium" trailing look can opt in.
      smoothing: !!c.smoothing,
      trail: {
        enabled: !!trail.enabled,
        style: TRAIL_STYLES[trail.style] ? trail.style : 'fade',
        length: Math.round(clamp(trail.length, 4, 40, 12)),
        speed: clamp(trail.speed, 0, 100, 50)
      }
    };
  }

  function hexToRgba(hex, alpha) {
    hex = String(hex || '#ffffff').replace('#', '');
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
    const r = parseInt(hex.slice(0, 2), 16) || 0;
    const g = parseInt(hex.slice(2, 4), 16) || 0;
    const b = parseInt(hex.slice(4, 6), 16) || 0;
    const a = (typeof alpha === 'number' && !isNaN(alpha)) ? alpha : 1;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  // Styles the primary shape element for every preset except 'dot-ring',
  // where it renders just the small inner dot (the outer ring is a separate,
  // independently-lagged element — see start()).
  function styleDot(el, preset, color, size) {
    Object.assign(el.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      borderRadius: '50%',
      willChange: 'transform'
    });
    if (preset === 'ring') {
      Object.assign(el.style, {
        width: size + 'px',
        height: size + 'px',
        marginLeft: (-size / 2) + 'px',
        marginTop: (-size / 2) + 'px',
        background: 'transparent',
        border: `2px solid ${color}`,
        boxShadow: 'none'
      });
    } else if (preset === 'glow') {
      const glowSize = size * 1.8;
      Object.assign(el.style, {
        width: glowSize + 'px',
        height: glowSize + 'px',
        marginLeft: (-glowSize / 2) + 'px',
        marginTop: (-glowSize / 2) + 'px',
        background: `radial-gradient(circle, ${hexToRgba(color, 0.9)} 0%, ${hexToRgba(color, 0)} 70%)`,
        border: 'none',
        boxShadow: 'none'
      });
    } else {
      // ball, and the inner dot of dot-ring
      const dotSize = preset === 'dot-ring' ? Math.max(4, size * 0.3) : size;
      Object.assign(el.style, {
        width: dotSize + 'px',
        height: dotSize + 'px',
        marginLeft: (-dotSize / 2) + 'px',
        marginTop: (-dotSize / 2) + 'px',
        background: color,
        border: 'none',
        boxShadow: `0 0 ${dotSize * 0.4}px ${hexToRgba(color, 0.5)}`
      });
    }
  }

  function styleRing(el, color, size) {
    const ringSize = size * 1.9;
    Object.assign(el.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: ringSize + 'px',
      height: ringSize + 'px',
      marginLeft: (-ringSize / 2) + 'px',
      marginTop: (-ringSize / 2) + 'px',
      borderRadius: '50%',
      background: 'transparent',
      border: `1.5px solid ${hexToRgba(color, 0.7)}`,
      willChange: 'transform'
    });
  }

  function drawTrail(ctx, canvas, points, cfg) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const n = points.length;
    if (n < 2) return;
    const color = cfg.color;

    if (cfg.trail.style === 'comet') {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (let i = 1; i < n; i++) {
        const t = i / (n - 1);
        ctx.strokeStyle = hexToRgba(color, t * 0.55);
        ctx.lineWidth = Math.max(1, t * cfg.size * 0.45);
        ctx.beginPath();
        ctx.moveTo(points[i - 1].x, points[i - 1].y);
        ctx.lineTo(points[i].x, points[i].y);
        ctx.stroke();
      }
    } else {
      for (let i = 0; i < n; i++) {
        const t = (i + 1) / n;
        const p = points[i];
        const sparkle = cfg.trail.style === 'sparkle';
        const alpha = t * (sparkle ? 0.7 : 0.45);
        const radius = sparkle
          ? Math.max(0.5, cfg.size * 0.14 * t * (0.5 + Math.random() * 0.6))
          : Math.max(0.5, cfg.size * 0.16 * t);
        ctx.fillStyle = hexToRgba(color, alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Starts (or restarts) the custom cursor. No-op if the pointer isn't
  // fine/hover-capable (touch devices) — there is no persistent cursor there
  // to replace. Mirrors effects.js's startEffect(): unconditionally tears
  // down any previous instance first, respects prefers-reduced-motion (for
  // the trail only — the cursor shape itself must track the real pointer 1:1
  // regardless), and pauses trail drawing while the tab is hidden.
  function start(cfg) {
    stop();

    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const config = normalizeCursorConfig(cfg);

    const hideStyle = document.createElement('style');
    hideStyle.id = HIDE_STYLE_ID;
    hideStyle.textContent = ':root, :root * { cursor: none !important; }';
    (document.head || document.documentElement).appendChild(hideStyle);

    const root = document.createElement('div');
    root.id = ROOT_ID;
    Object.assign(root.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '0',
      height: '0',
      zIndex: '2147483647',
      pointerEvents: 'none'
    });
    document.documentElement.appendChild(root);
    const shadow = root.attachShadow({ mode: 'open' });

    const dot = document.createElement('div');
    styleDot(dot, config.preset, config.color, config.size);
    shadow.appendChild(dot);

    let ring = null;
    if (config.preset === 'dot-ring') {
      ring = document.createElement('div');
      styleRing(ring, config.color, config.size);
      shadow.appendChild(ring);
    }

    let trailCanvas = null;
    let trailCtx = null;
    let trailDpr = 1;
    const trailPoints = [];
    if (config.trail.enabled) {
      trailCanvas = document.createElement('canvas');
      Object.assign(trailCanvas.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none'
      });
      shadow.appendChild(trailCanvas);
      trailCtx = trailCanvas.getContext('2d');
    }

    function resizeTrailCanvas() {
      if (!trailCanvas) return;
      trailDpr = Math.min(window.devicePixelRatio || 1, 2);
      trailCanvas.width = window.innerWidth * trailDpr;
      trailCanvas.height = window.innerHeight * trailDpr;
      trailCtx.setTransform(trailDpr, 0, 0, trailDpr, 0, 0);
    }
    resizeTrailCanvas();
    window.addEventListener('resize', resizeTrailCanvas);

    let mouseX = -9999;
    let mouseY = -9999;
    let dotX = mouseX;
    let dotY = mouseY;
    let ringX = mouseX;
    let ringY = mouseY;
    let lastSampleTime = 0;
    let hasMoved = false;

    function mouseMoveHandler(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!hasMoved) {
        hasMoved = true;
        dotX = mouseX; dotY = mouseY;
        ringX = mouseX; ringY = mouseY;
      }
    }
    window.addEventListener('mousemove', mouseMoveHandler);

    function hoverInHandler(e) {
      if (e.target && e.target.closest && e.target.closest(HOVER_SELECTOR)) {
        root.dataset.hover = '1';
      }
    }
    function hoverOutHandler(e) {
      if (e.target && e.target.closest && e.target.closest(HOVER_SELECTOR)) {
        delete root.dataset.hover;
      }
    }
    document.addEventListener('mouseover', hoverInHandler);
    document.addEventListener('mouseout', hoverOutHandler);

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pointIntervalMs = 60 - (config.trail.speed / 100) * 50;

    let frameId = null;
    let stopped = false;
    let last = null;
    function loop(t) {
      if (stopped) return;
      frameId = requestAnimationFrame(loop);
      const dt = last === null ? 16 : Math.min(t - last, 100);
      last = t;
      if (document.hidden || !hasMoved) return;

      // By default the cursor shape tracks the real pointer exactly (1:1) so
      // it doesn't feel like input lag. If the user opts into smoothing, the
      // dot eases toward the pointer and the (optional) outer ring uses an
      // even slower factor so it visibly trails the dot — the "premium"
      // dot+ring cursor look.
      if (config.smoothing) {
        dotX += (mouseX - dotX) * Math.min(1, dt / 16 * 0.55);
        dotY += (mouseY - dotY) * Math.min(1, dt / 16 * 0.55);
      } else {
        dotX = mouseX;
        dotY = mouseY;
      }
      // Scale (hover grow/shrink) snaps instantly, same as position — the
      // cursor shape is the real pointer, not a separately-animated object
      // trailing behind it. This used to be a CSS `transition: transform`,
      // which (since it shares the `transform` property with translate3d)
      // eased the position too and made the cursor visibly lag behind the
      // real pointer even with smoothing off.
      const dotScale = root.dataset.hover ? (config.preset === 'dot-ring' ? 1 : config.hoverScale) : 1;
      dot.style.transform = `translate3d(${dotX}px, ${dotY}px, 0) scale(${dotScale})`;

      if (ring) {
        if (config.smoothing) {
          ringX += (mouseX - ringX) * Math.min(1, dt / 16 * 0.18);
          ringY += (mouseY - ringY) * Math.min(1, dt / 16 * 0.18);
        } else {
          ringX = mouseX;
          ringY = mouseY;
        }
        const ringScale = root.dataset.hover ? config.hoverScale : 1;
        ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) scale(${ringScale})`;
      }

      if (trailCanvas && !reduceMotion) {
        lastSampleTime += dt;
        if (lastSampleTime >= pointIntervalMs) {
          lastSampleTime = 0;
          trailPoints.push({ x: mouseX, y: mouseY });
          while (trailPoints.length > config.trail.length) trailPoints.shift();
        }
        drawTrail(trailCtx, trailCanvas, trailPoints, config);
      }
    }
    frameId = requestAnimationFrame(loop);

    cleanup = () => {
      stopped = true;
      if (frameId) cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resizeTrailCanvas);
      window.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseover', hoverInHandler);
      document.removeEventListener('mouseout', hoverOutHandler);
      root.remove();
      hideStyle.remove();
    };
  }

  function stop() {
    if (cleanup) {
      cleanup();
      cleanup = null;
    }
    // Defensive: catches a root/style left behind by a truly orphaned prior
    // instance (e.g. context invalidated mid-script) that the cleanup
    // closure above couldn't reach.
    const staleRoot = document.getElementById(ROOT_ID);
    if (staleRoot) staleRoot.remove();
    const staleStyle = document.getElementById(HIDE_STYLE_ID);
    if (staleStyle) staleStyle.remove();
  }

  return {
    PRESETS,
    TRAIL_STYLES,
    normalizeCursorConfig,
    start,
    stop
  };
})();
