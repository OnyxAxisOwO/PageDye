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
      color: (typeof c.color === 'string' && c.color) || '#3b82f6',
      size: clamp(c.size, 12, 48, 24),
      hoverScale: clamp(c.hoverScale, 1, 3, 1.6),
      // Floor of 10 (not 0) so the cursor can never be dialed down to fully
      // invisible — the native pointer is force-hidden while active, so 0%
      // would leave the user with no visible pointer at all.
      opacity: Math.round(clamp(c.opacity, 10, 100, 100)),
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
  // where it renders just the small inner dot (the outer ring is a separate
  // element rendered at the same position — see start()).
  // Centering note: elements are positioned via a `translate(-50%, -50%)`
  // baked into their transform (see start()/loop()), not negative
  // margins. Margins have to be computed from our own width/2 math, which
  // ignores that a border (e.g. the ring's) gets snapped to a whole device
  // pixel independently of the element's fractional content width — that
  // mismatch used to leave the ring's rendered center off by ~1px from the
  // dot's. `translate(-50%, -50%)` is resolved by the browser against the
  // actual final border-box, so it self-corrects regardless of rounding.
  function styleDot(el, preset, color, size) {
    Object.assign(el.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      boxSizing: 'border-box',
      borderRadius: '50%',
      willChange: 'transform'
    });
    if (preset === 'ring') {
      Object.assign(el.style, {
        width: size + 'px',
        height: size + 'px',
        background: 'transparent',
        border: `2px solid ${color}`,
        boxShadow: 'none'
      });
    } else if (preset === 'glow') {
      const glowSize = size * 1.8;
      Object.assign(el.style, {
        width: glowSize + 'px',
        height: glowSize + 'px',
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
      boxSizing: 'border-box',
      width: ringSize + 'px',
      height: ringSize + 'px',
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
      pointerEvents: 'none',
      // Applied on the shadow host itself so the dot, ring, and trail
      // canvas are composited as one group and fade together uniformly,
      // instead of each element's own translucency stacking differently.
      opacity: String(config.opacity / 100)
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
    let lastSampleTime = 0;
    let hasMoved = false;

    function mouseMoveHandler(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!hasMoved) {
        hasMoved = true;
        dotX = mouseX; dotY = mouseY;
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
    let visualHoverScale = 1;
    function loop(t) {
      if (stopped) return;
      frameId = requestAnimationFrame(loop);
      const dt = last === null ? 16 : Math.min(t - last, 100);
      last = t;
      if (document.hidden || !hasMoved) return;

      // By default the cursor shape tracks the real pointer exactly (1:1) so
      // it doesn't feel like input lag. If the user opts into smoothing, the
      // dot eases toward the pointer. The (optional) outer ring always
      // renders at this same dotX/dotY — never its own independently-eased
      // position — so the inner dot stays visually centered inside the ring
      // instead of drifting off-center as the two catch up to the pointer
      // at different rates.
      if (config.smoothing) {
        dotX += (mouseX - dotX) * Math.min(1, dt / 16 * 0.55);
        dotY += (mouseY - dotY) * Math.min(1, dt / 16 * 0.55);
      } else {
        dotX = mouseX;
        dotY = mouseY;
      }
      // Animate the rendered dimensions instead of scaling the composited
      // layer. Position remains 1:1 with the pointer, while circles and
      // borders are redrawn at their current size so enlarged cursors stay
      // crisp instead of becoming a blurred bitmap.
      const targetHoverScale = root.dataset.hover ? config.hoverScale : 1;
      const scaleEase = reduceMotion ? 1 : 1 - Math.exp(-dt / 55);
      const previousHoverScale = visualHoverScale;
      visualHoverScale += (targetHoverScale - visualHoverScale) * scaleEase;
      if (Math.abs(targetHoverScale - visualHoverScale) < 0.001) {
        visualHoverScale = targetHoverScale;
      }
      const hoverScaleChanged = visualHoverScale !== previousHoverScale;
      if (hoverScaleChanged && config.preset !== 'dot-ring') {
        styleDot(dot, config.preset, config.color, config.size * visualHoverScale);
      }
      dot.style.transform = `translate3d(${dotX}px, ${dotY}px, 0) translate(-50%, -50%)`;

      if (ring) {
        if (hoverScaleChanged) {
          styleRing(ring, config.color, config.size * visualHoverScale);
        }
        ring.style.transform = `translate3d(${dotX}px, ${dotY}px, 0) translate(-50%, -50%)`;
      }

      if (trailCanvas && !reduceMotion) {
        lastSampleTime += dt;
        if (lastSampleTime >= pointIntervalMs) {
          lastSampleTime = 0;
          // Sample the dot's rendered (possibly eased) position, not the
          // raw pointer — otherwise, with smoothing on, the trail's newest
          // point sits ahead of the dot/ring instead of attached to them.
          trailPoints.push({ x: dotX, y: dotY });
          while (trailPoints.length > config.trail.length) trailPoints.shift();
        }
        // Always draw through to the dot's current position, not just the
        // last sample, so the trail stays visually attached to the cursor
        // between samples instead of trailing up to one sample interval
        // behind it.
        drawTrail(trailCtx, trailCanvas, trailPoints.concat({ x: dotX, y: dotY }), config);
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
