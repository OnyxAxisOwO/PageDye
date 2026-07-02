(() => {
  const ROOT_ID = 'pagedye-extension-root';
  const STYLE_ID = 'pagedye-extension-style-override';
  const TARGET_STYLE_ID = 'pagedye-target-style';
  const CUSTOM_STYLE_ID = 'pagedye-custom-css';
  const FROSTED_STYLE_ID = 'pagedye-frosted-glass';
  let currentSettings = null;
  let slideshowTimer = null;
  let effectCleanup = null;

  // Initialize
  init();

  function init() {
    // Keep exactly one live listener of each kind, even if this script is
    // injected more than once (manifest at document_start + on-demand
    // re-injection from the popup after the extension is reloaded).
    if (window.__pagedyeListener) {
      chrome.runtime.onMessage.removeListener(window.__pagedyeListener);
    }
    window.__pagedyeListener = onMessage;
    chrome.runtime.onMessage.addListener(onMessage);

    if (window.__pagedyeStorageListener) {
      chrome.storage.onChanged.removeListener(window.__pagedyeStorageListener);
    }
    window.__pagedyeStorageListener = onStorageChanged;
    chrome.storage.onChanged.addListener(onStorageChanged);

    // Listen to prefers-color-scheme change
    if (window.__pagedyeMediaListener) {
      window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', window.__pagedyeMediaListener);
    }
    window.__pagedyeMediaListener = onMediaSchemeChanged;
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', onMediaSchemeChanged);

    // Load initial settings
    const domain = window.location.hostname;
    chrome.storage.local.get(domain, (data) => {
      const settings = data[domain];
      if (settings) {
        currentSettings = settings;
        if (settings.mode === 'slideshow' && settings.slideshow && settings.slideshow.items && settings.slideshow.items.length > 1) {
          const sh = settings.slideshow;
          let needRotate = false;
          if (sh.interval === 'open') {
            needRotate = true;
          } else {
            let intervalMs = 15 * 60 * 1000;
            if (sh.interval === '30m') intervalMs = 30 * 60 * 1000;
            if (sh.interval === '1h') intervalMs = 60 * 60 * 1000;
            if (sh.interval === '24h') intervalMs = 24 * 60 * 60 * 1000;
            if (Date.now() - (sh.lastRotationTime || 0) >= intervalMs) {
              needRotate = true;
            }
          }
          
          if (needRotate) {
            let nextIndex = sh.currentIndex || 0;
            if (sh.order === 'random') {
              let rand = nextIndex;
              while (rand === nextIndex) {
                rand = Math.floor(Math.random() * sh.items.length);
              }
              nextIndex = rand;
            } else {
              nextIndex = (nextIndex + 1) % sh.items.length;
            }
            
            sh.currentIndex = nextIndex;
            sh.lastRotationTime = Date.now();
            chrome.storage.local.set({ [domain]: settings }, () => {
              applyBackground(settings);
            });
            return;
          }
        }
        applyBackground(settings);
      }
    });
  }

  function onMediaSchemeChanged() {
    if (currentSettings && currentSettings.mode === 'auto') {
      applyBackground(currentSettings);
    }
  }

  function onMessage(message, sender, sendResponse) {
    if (message.action === 'updateBackground') {
      currentSettings = message.settings;
      applyBackground(message.settings);
    }
    // Reply so the sender's awaited sendMessage resolves cleanly.
    sendResponse({ ok: true });
    return false;
  }

  // Re-apply whenever this domain's settings change in storage. This makes the
  // background update even when it's written by the in-page element picker
  // (the popup is closed at that point and can't message us).
  function onStorageChanged(changes, area) {
    if (area !== 'local') return;
    const domain = window.location.hostname;
    if (Object.prototype.hasOwnProperty.call(changes, domain)) {
      const settings = changes[domain].newValue || { type: 'none' };
      currentSettings = settings;
      applyBackground(settings);
    }
  }

  function applyBackground(settings) {
    settings = settings || { type: 'none' };

    if (slideshowTimer) {
      clearTimeout(slideshowTimer);
      slideshowTimer = null;
    }

    let activeSettings = settings;
    if (settings.mode === 'auto') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const subSettings = isDark ? settings.dark : settings.light;
      activeSettings = Object.assign({}, subSettings || { type: 'none' }, {
        targetSelector: settings.targetSelector,
        customCss: settings.customCss
      });
    } else if (settings.mode === 'slideshow' && settings.slideshow && settings.slideshow.items && settings.slideshow.items.length > 0) {
      const sh = settings.slideshow;
      let index = sh.currentIndex || 0;
      if (index >= sh.items.length) index = 0;
      const subSettings = sh.items[index];
      activeSettings = Object.assign({}, subSettings || { type: 'none' }, {
        targetSelector: settings.targetSelector,
        customCss: settings.customCss
      });
      setupSlideshowTimer(settings);
    }

    // Custom CSS and the frosted-glass container effect are both applied
    // independently of the background type/mode.
    applyCustomCss(activeSettings.customCss);
    applyFrostedGlass(settings.frostedGlass);

    const hasBackground = activeSettings.type === 'color' || activeSettings.type === 'image' || activeSettings.type === 'effect';
    // Effects are rendered on a full-viewport canvas; a per-element selector
    // doesn't apply to them, so always fall back to overlay mode.
    const selector = activeSettings.type !== 'effect' && activeSettings.targetSelector && activeSettings.targetSelector.trim();

    if (!hasBackground) {
      removeBackdrop();
      removeTargetStyle();
      return;
    }

    if (selector) {
      // Selector mode: paint the chosen element(s) directly via their own CSS
      // background. No full-page overlay; the rest of the page is untouched.
      removeBackdrop();
      applyTargetBackground(selector, activeSettings);
    } else {
      // Overlay mode: paint a full-page layer behind everything.
      removeTargetStyle();
      applyOverlay(activeSettings);
    }
  }

  function setupSlideshowTimer(settings) {
    const sh = settings.slideshow;
    if (sh.interval === 'open') return;

    let intervalMs = 15 * 60 * 1000;
    if (sh.interval === '30m') intervalMs = 30 * 60 * 1000;
    if (sh.interval === '1h') intervalMs = 60 * 60 * 1000;
    if (sh.interval === '24h') intervalMs = 24 * 60 * 60 * 1000;

    const now = Date.now();
    const last = sh.lastRotationTime || 0;
    const timePassed = now - last;
    const timeRemaining = Math.max(0, intervalMs - timePassed);

    if (timeRemaining === 0) {
      rotateSlideshow(settings);
    } else {
      slideshowTimer = setTimeout(() => {
        rotateSlideshow(settings);
      }, timeRemaining);
    }
  }

  function rotateSlideshow(settings) {
    const sh = settings.slideshow;
    if (!sh || !sh.items || sh.items.length <= 1) return;

    let nextIndex = sh.currentIndex || 0;
    if (sh.order === 'random') {
      let rand = nextIndex;
      while (rand === nextIndex) {
        rand = Math.floor(Math.random() * sh.items.length);
      }
      nextIndex = rand;
    } else {
      nextIndex = (nextIndex + 1) % sh.items.length;
    }

    const domain = window.location.hostname;
    chrome.storage.local.get(domain, (data) => {
      const stored = data[domain];
      if (stored && stored.mode === 'slideshow' && stored.slideshow) {
        stored.slideshow.currentIndex = nextIndex;
        stored.slideshow.lastRotationTime = Date.now();
        chrome.storage.local.set({ [domain]: stored });
      }
    });
  }

  // Full-page background: a fixed layer behind everything, with html/body
  // forced transparent so it shows through.
  function applyOverlay(settings) {
    enforceTransparency();

    let root = document.getElementById(ROOT_ID);
    let layer, canvas;

    if (!root) {
      root = document.createElement('div');
      root.id = ROOT_ID;
      // High negative z-index to be behind everything
      // Fixed position to cover viewport
      Object.assign(root.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        zIndex: '-2147483648', // Min integer
        pointerEvents: 'none',
        overflow: 'hidden',
        display: 'block' // Ensure it's visible
      });
      document.documentElement.appendChild(root);

      // Use Shadow DOM to isolate styles
      const shadow = root.attachShadow({ mode: 'open' });

      // A shadow tree doesn't inherit @keyframes declared in the outer
      // document's stylesheets, so the animated-gradient flow needs its own
      // copy of the keyframes rule here.
      const keyframesStyle = document.createElement('style');
      keyframesStyle.textContent = window.PageDyeGradient.GRADIENT_KEYFRAMES_CSS;
      shadow.appendChild(keyframesStyle);

      layer = document.createElement('div');
      layer.id = 'pagedye-layer';
      shadow.appendChild(layer);

      canvas = document.createElement('canvas');
      canvas.id = 'pagedye-effect-canvas';
      Object.assign(canvas.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        display: 'none',
        transition: 'opacity 0.3s ease'
      });
      shadow.appendChild(canvas);
    } else {
      layer = root.shadowRoot.getElementById('pagedye-layer');
      canvas = root.shadowRoot.getElementById('pagedye-effect-canvas');
    }

    if (settings.type === 'effect') {
      // Effects always fill the viewport, fixed in place — a leftover
      // absolute/100%-height root from a previous non-fixed image (see
      // below) would otherwise clip or scroll the canvas away.
      root.style.position = 'fixed';
      root.style.height = '100vh';
      layer.style.backgroundImage = 'none';
      layer.style.backgroundColor = 'transparent';
      startEffect(canvas, settings.effect || 'waves', settings.opacity, {
        color: settings.effectColor,
        bgColor: settings.effectBgColor,
        density: settings.effectDensity,
        speed: settings.effectSpeed
      });
      return;
    }

    stopEffect();
    canvas.style.display = 'none';

    const style = {
      width: '100%',
      height: '100%',
      transition: 'background 0.3s ease, opacity 0.3s ease',
      opacity: (settings.opacity / 100).toString(),
      position: 'relative'
    };

    if (settings.type === 'color') {
      // Colors have no "fixed position" toggle (unlike images) — they always
      // cover the fixed viewport. Reset explicitly: `root` is a persistent,
      // reused element, and a prior non-fixed image apply may have left
      // position:absolute / height:100% behind (see the image branch below).
      root.style.position = 'fixed';
      root.style.height = '100vh';
      if (settings.colorMode === 'gradient' && settings.gradient) {
        const gradient = settings.gradient;
        style.backgroundColor = 'transparent';
        style.backgroundImage = window.PageDyeGradient.buildGradientCss(gradient);
        style.filter = 'none';
        style.transform = 'none';
        if (gradient.animated) {
          style.backgroundSize = gradient.kind === 'radial' ? '200% 200%' : '300% 300%';
          style.animation = `pagedye-gradient-flow ${gradient.speed || 10}s ease infinite`;
        } else {
          // Explicitly reset both: layer is a persistent element reused
          // across re-applies, so a previous animated-gradient state would
          // otherwise stick around.
          style.backgroundSize = 'auto';
          style.animation = 'none';
        }
      } else {
        style.backgroundColor = settings.value;
        style.backgroundImage = 'none';
        style.filter = 'none';
        style.transform = 'none';
        style.backgroundSize = 'auto';
        style.animation = 'none';
      }
    } else if (settings.type === 'image') {
      style.backgroundColor = 'transparent';
      style.backgroundImage = `url("${settings.value}")`;
      style.filter = buildFilterString(settings);
      style.transform = (settings.blur || 0) > 0 ? 'scale(1.05)' : 'none'; // Prevent blur edge artifacts
      style.animation = 'none';

      if (settings.style) {
        style.backgroundPosition = 'center center';
        style.backgroundSize = settings.style.size || 'cover';
        style.backgroundRepeat = settings.style.repeat ? 'repeat' : 'no-repeat';

        if (settings.style.fixed) {
           root.style.position = 'fixed';
           root.style.height = '100vh';
        } else {
           root.style.position = 'absolute';
           root.style.height = '100%'; // Full document height
        }
      }
    }

    Object.assign(layer.style, style);
  }

  // Selector mode: applies the chosen color/image directly to the matched
  // element(s) as their CSS background, overriding the site's own styles.
  function applyTargetBackground(selector, settings) {
    removeTargetStyle();

    // We run at document_start, so our <style> is injected *before* the page's
    // own stylesheets. With equal specificity and !important, CSS breaks the tie
    // by document order (later wins) — so the site's rules would override ours
    // after a reload, leaving the element's own (opaque) background in place and
    // hiding the image/blur layer behind it. That was the "works on apply/pick,
    // gone after refresh" bug. Prefixing each selector with `:root ` raises our
    // specificity above the site's same-selector rule, so we win regardless of
    // order — no dependence on injection timing.
    const sel = scopeSelector(selector);
    const isGradient = settings.type === 'color' && settings.colorMode === 'gradient' && settings.gradient;

    let css = '';
    if (settings.type === 'color' && !isGradient) {
      const alpha = (typeof settings.opacity === 'number' ? settings.opacity : 100) / 100;
      css =
        `${sel} {` +
          'background-image: none !important;' +
          `background-color: ${hexToRgba(settings.value, alpha)} !important;` +
        '}';
    } else if (settings.type === 'image' || isGradient) {
      const st = settings.style || {};
      const opacity = (typeof settings.opacity === 'number' ? settings.opacity : 100) / 100;

      // We can't put opacity/blur on the element itself — that would also dim
      // and blur its text/children. Instead we paint the image/gradient on a
      // ::before layer sitting *behind* the element's content (z-index:-1),
      // and clear the element's own background so the layer shows through.
      // This lets opacity, blur, fixed-attachment and tiling all work
      // without touching the readability of the element's content.
      //
      // `isolation: isolate` confines the negative-z-index layer to the
      // element's own stacking context so it can't slip behind ancestors.
      const layerPos = st.fixed
        ? 'position: fixed !important; top: 0 !important; left: 0 !important;' +
          'width: 100vw !important; height: 100vh !important;'
        : 'position: absolute !important; inset: 0 !important;';

      let bgImageCss, filterStr, sizeCss, repeatCss, animationCss, positionCss;
      if (isGradient) {
        const gradient = settings.gradient;
        bgImageCss = window.PageDyeGradient.buildGradientCss(gradient);
        filterStr = 'none';
        repeatCss = 'no-repeat';
        if (gradient.animated) {
          sizeCss = gradient.kind === 'radial' ? '200% 200%' : '300% 300%';
          animationCss = `pagedye-gradient-flow ${gradient.speed || 10}s ease infinite`;
          // Omit a static background-position here: an !important author
          // declaration outranks a CSS animation's per-frame values for the
          // same property in the cascade, which would freeze the motion.
          positionCss = '';
        } else {
          sizeCss = 'auto';
          animationCss = 'none';
          positionCss = 'background-position: center center !important;';
        }
      } else {
        bgImageCss = `url("${settings.value}")`;
        filterStr = buildFilterString(settings);
        sizeCss = st.size || 'cover';
        repeatCss = st.repeat ? 'repeat' : 'no-repeat';
        animationCss = 'none';
        positionCss = 'background-position: center center !important;';
      }

      css =
        `${sel} {` +
          'position: relative !important;' +
          'isolation: isolate !important;' +
          'background-image: none !important;' +
          'background-color: transparent !important;' +
        '}' +
        `${sel}::before {` +
          'content: "" !important;' +
          layerPos +
          'z-index: -1 !important;' +
          'pointer-events: none !important;' +
          `background-image: ${bgImageCss} !important;` +
          positionCss +
          `background-size: ${sizeCss} !important;` +
          `background-repeat: ${repeatCss} !important;` +
          `filter: ${filterStr} !important;` +
          `opacity: ${opacity} !important;` +
          `animation: ${animationCss} !important;` +
        '}';
    }

    const style = document.createElement('style');
    style.id = TARGET_STYLE_ID;
    // Gradients animate via a shared keyframes name; this stylesheet is
    // self-contained (own copy of the rule) since removeBackdrop() tears
    // down the full-page-overlay path's own style tag whenever selector
    // mode is active, so that tag can't be relied on as a shared vehicle.
    style.textContent = window.PageDyeGradient.GRADIENT_KEYFRAMES_CSS + css;
    (document.head || document.documentElement).appendChild(style);
  }

  // Prefixes every selector in a (possibly comma-separated) list with `:root `
  // to boost specificity so our !important rules outrank the site's own rules
  // on the same element, independent of stylesheet order. The target is always
  // a descendant of <html>, so `:root <sel>` still matches it.
  function scopeSelector(selector) {
    return selector
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => `:root ${s}`)
      .join(', ');
  }

  function removeBackdrop() {
    // Removing the root node doesn't cancel window/document-level listeners
    // or the rAF loop an effect may have registered — stop it explicitly.
    stopEffect();

    const root = document.getElementById(ROOT_ID);
    if (root) root.remove();

    const style = document.getElementById(STYLE_ID);
    if (style) style.remove();
  }

  function enforceTransparency() {
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = `
        html, body {
          background: none !important;
          background-color: transparent !important;
        }
      `;
      (document.head || document.documentElement).appendChild(style);
    }
  }

  function removeTargetStyle() {
    const style = document.getElementById(TARGET_STYLE_ID);
    if (style) style.remove();
  }

  // Injects arbitrary user-provided CSS into the page.
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

  // Turns a chosen container (e.g. a card/main content wrapper) into a
  // frosted-glass panel: its own background is replaced with a light/dark
  // tint (matching the OS color scheme) and blurred via backdrop-filter, so
  // whatever sits behind it (the page's own content, or PageDye's own
  // wallpaper layer) shows through softly instead of being hidden by an
  // opaque background.
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

  // --- Effects (animated Canvas 2D wallpapers) --------------------------
  //
  // Each engine is a plain object: init(cfg) returns fresh per-instance state
  // (with cfg — {color, density, speed}, all user-configurable — tucked
  // inside it), resize(state, width, height) recomputes anything that
  // depends on the viewport size (particle counts, columns...), and
  // draw(ctx, canvas, state, dt) renders one frame given the elapsed time in
  // ms. onMouseMove is optional and only implemented by engines that react
  // to the cursor. density and speed are both 0-100 dials; each engine maps
  // them onto its own sensible range via effectSpeedMultiplier() or its own
  // scaling.
  const MATRIX_CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789';

  function normalizeEffectConfig(cfg) {
    return {
      color: (cfg && cfg.color) || '#ffffff',
      bgColor: (cfg && cfg.bgColor) || '#000000',
      density: clampPercent(cfg && cfg.density, 50),
      speed: clampPercent(cfg && cfg.speed, 50)
    };
  }

  function clampPercent(n, fallback) {
    return typeof n === 'number' && !isNaN(n) ? Math.max(0, Math.min(100, n)) : fallback;
  }

  // Maps a 0-100 "speed" dial to a 0.4x-2x multiplier applied on top of each
  // engine's own base speed constants.
  function effectSpeedMultiplier(speed) {
    return 0.4 + (speed / 100) * 1.6;
  }

  const EFFECT_ENGINES = {
    matrix: {
      init(cfg) {
        return { width: 0, height: 0, fontSize: 16, columns: [], cfg };
      },
      resize(state, width, height) {
        state.width = width;
        state.height = height;
        // density 0-100 maps to font size 26px (sparse, few columns) down to
        // 10px (dense, many columns) — smaller glyphs pack more columns in.
        state.fontSize = 26 - (state.cfg.density / 100) * 16;
        const speedMul = effectSpeedMultiplier(state.cfg.speed);
        const cols = Math.max(1, Math.floor(width / state.fontSize));
        state.columns = new Array(cols).fill(0).map(() => ({
          y: Math.random() * height,
          speed: (60 + Math.random() * 90) * speedMul
        }));
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
          if (col.y > height + fontSize) {
            col.y = -fontSize * (1 + Math.random() * 10);
            col.speed = (60 + Math.random() * 90) * speedMul;
          }
        });
      }
    },

    particles: {
      init(cfg) {
        return { width: 0, height: 0, particles: [], mouse: { x: -9999, y: -9999 }, cfg };
      },
      resize(state, width, height) {
        state.width = width;
        state.height = height;
        // density 0-100 maps to particle count ~20-220.
        const target = Math.round(20 + (state.cfg.density / 100) * 200);
        const count = Math.min(240, Math.max(10, target));
        const speedMul = effectSpeedMultiplier(state.cfg.speed);
        state.particles = new Array(count).fill(0).map(() => ({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 24 * speedMul,
          vy: (Math.random() - 0.5) * 24 * speedMul
        }));
      },
      onMouseMove(state, e, canvas) {
        const rect = canvas.getBoundingClientRect();
        state.mouse.x = e.clientX - rect.left;
        state.mouse.y = e.clientY - rect.top;
      },
      draw(ctx, canvas, state, dt) {
        const { width, height, particles, mouse, cfg } = state;
        if (!width || !height) return;
        ctx.fillStyle = cfg.bgColor;
        ctx.fillRect(0, 0, width, height);

        const dtSec = dt / 1000;
        const repelRadius = 90;
        const speedMul = effectSpeedMultiplier(cfg.speed);

        particles.forEach((p) => {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < repelRadius) {
            const force = (1 - dist / repelRadius) * 260 * speedMul;
            p.vx += (dx / dist) * force * dtSec;
            p.vy += (dy / dist) * force * dtSec;
          }
          p.x += p.vx * dtSec;
          p.y += p.vy * dtSec;
          // Gentle drag so a repelled particle settles back to a calm drift
          // instead of flying off and accelerating forever.
          p.vx *= 0.98;
          p.vy *= 0.98;
          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;
          p.x = Math.max(0, Math.min(width, p.x));
          p.y = Math.max(0, Math.min(height, p.y));
        });

        ctx.strokeStyle = hexToRgba(cfg.color, 0.15);
        ctx.lineWidth = 1;
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const a = particles[i];
            const b = particles[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 120) {
              ctx.globalAlpha = 1 - dist / 120;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
        }
        ctx.globalAlpha = 1;

        ctx.fillStyle = cfg.color;
        particles.forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    },

    waves: {
      init(cfg) {
        return { width: 0, height: 0, phase: 0, lineCount: 6, cfg };
      },
      resize(state, width, height) {
        state.width = width;
        state.height = height;
        // density 0-100 maps to 3-14 stacked wave lines.
        state.lineCount = Math.max(2, Math.round(3 + (state.cfg.density / 100) * 11));
      },
      draw(ctx, canvas, state, dt) {
        const { width, height, lineCount, cfg } = state;
        if (!width || !height) return;
        state.phase += dt * 0.0006 * effectSpeedMultiplier(cfg.speed);

        ctx.fillStyle = cfg.bgColor;
        ctx.fillRect(0, 0, width, height);

        for (let i = 0; i < lineCount; i++) {
          const t = i / (lineCount - 1 || 1);
          const baseY = height * (0.3 + t * 0.5);
          const amplitude = 24 + t * 40;
          const freq = 0.006 + t * 0.002;
          const speed = 1 + t * 0.6;
          const opacity = 0.12 + (1 - t) * 0.25;

          ctx.beginPath();
          ctx.strokeStyle = hexToRgba(cfg.color, opacity);
          ctx.lineWidth = 1.5;
          for (let x = 0; x <= width; x += 4) {
            const y = baseY + Math.sin(x * freq + state.phase * speed) * amplitude;
            if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }
    },

    // "Warp speed" starfield: points fly radially outward from the center,
    // accelerating and growing as they approach the edge, then wrap back to
    // the center with a fresh random angle.
    starfield: {
      init(cfg) {
        return { width: 0, height: 0, stars: [], maxR: 0, cfg };
      },
      resize(state, width, height) {
        state.width = width;
        state.height = height;
        state.maxR = Math.sqrt(width * width + height * height) / 2;
        // density 0-100 maps to 40-400 stars.
        const count = Math.min(400, Math.max(40, Math.round(40 + (state.cfg.density / 100) * 360)));
        state.stars = new Array(count).fill(0).map(() => ({
          angle: Math.random() * Math.PI * 2,
          r: Math.random() * state.maxR
        }));
      },
      draw(ctx, canvas, state, dt) {
        const { width, height, stars, cfg, maxR } = state;
        if (!width || !height || !maxR) return;
        const speedMul = effectSpeedMultiplier(cfg.speed);
        const cx = width / 2;
        const cy = height / 2;
        const dtSec = dt / 1000;

        ctx.fillStyle = cfg.bgColor;
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = cfg.color;

        stars.forEach((s) => {
          s.r += (40 + s.r * 0.6) * speedMul * dtSec;
          if (s.r > maxR) {
            s.r = 0;
            s.angle = Math.random() * Math.PI * 2;
          }
          const x = cx + Math.cos(s.angle) * s.r;
          const y = cy + Math.sin(s.angle) * s.r;
          const size = Math.max(0.6, (s.r / maxR) * 2.6);
          ctx.globalAlpha = Math.min(1, 0.3 + (s.r / maxR) * 0.9);
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1;
      }
    },

    // Calm water ripples: circles spawn at random points and expand outward,
    // fading as they grow — a slower, quieter counterpoint to the other
    // effects.
    ripple: {
      init(cfg) {
        return { width: 0, height: 0, ripples: [], spawnTimer: 0, cfg };
      },
      resize(state, width, height) {
        state.width = width;
        state.height = height;
        state.ripples = [];
        state.spawnTimer = 0;
      },
      draw(ctx, canvas, state, dt) {
        const { width, height, cfg } = state;
        if (!width || !height) return;
        const speedMul = effectSpeedMultiplier(cfg.speed);
        // density 0-100 maps to a spawn interval of 1400ms (sparse) down to
        // 250ms (dense, many concurrent ripples).
        const spawnInterval = 1400 - (cfg.density / 100) * 1150;
        const maxRadius = Math.max(width, height) * 0.5;

        ctx.fillStyle = cfg.bgColor;
        ctx.fillRect(0, 0, width, height);

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
          ctx.beginPath();
          ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
          ctx.stroke();
        });
      }
    }
  };

  // Starts (or restarts) the animated-canvas wallpaper. Battery/perf
  // safeguards: prefers-reduced-motion renders a single static frame and
  // never starts the loop; otherwise the loop keeps running but skips
  // drawing while the tab is hidden (rAF itself is already throttled by the
  // browser in background tabs, this just avoids wasted engine work too).
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
      canvas.width = width * dpr;
      canvas.height = height * dpr;
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
    if (effectCleanup) {
      effectCleanup();
      effectCleanup = null;
    }
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

  // Builds a CSS filter string from a settings object.
  // Blur, brightness, contrast, grayscale, hue-rotate and invert are combined
  // into a single filter chain. Neutral values (blur=0, brightness=100,
  // contrast=100, others=0) are omitted to keep the string clean.
  function buildFilterString(settings) {
    const blur       = settings.blur || 0;
    const f          = settings.filters || {};
    const brightness = f.brightness !== undefined ? f.brightness : 100;
    const contrast   = f.contrast   !== undefined ? f.contrast   : 100;
    const grayscale  = f.grayscale  !== undefined ? f.grayscale  : 0;
    const hue        = f.hue        !== undefined ? f.hue        : 0;
    const invert     = f.invert     !== undefined ? f.invert     : 0;

    const parts = [];
    if (blur        > 0)   parts.push(`blur(${blur}px)`);
    if (brightness !== 100) parts.push(`brightness(${brightness}%)`);
    if (contrast   !== 100) parts.push(`contrast(${contrast}%)`);
    if (grayscale  > 0)    parts.push(`grayscale(${grayscale}%)`);
    if (hue        > 0)    parts.push(`hue-rotate(${hue}deg)`);
    if (invert     > 0)    parts.push(`invert(${invert}%)`);

    return parts.length ? parts.join(' ') : 'none';
  }

})();
