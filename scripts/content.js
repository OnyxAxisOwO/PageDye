(() => {
  const ROOT_ID = 'pagedye-extension-root';
  const STYLE_ID = 'pagedye-extension-style-override';
  const TARGET_STYLE_ID = 'pagedye-target-style';
  const CUSTOM_STYLE_ID = 'pagedye-custom-css';
  const FROSTED_STYLE_ID = 'pagedye-frosted-glass';
  const CUSTOM_EFFECTS_KEY = '__pagedye_custom_effects__';
  const DEFAULT_BG_KEY = '__pagedye_default_background__';
  let currentSettings = null;
  let currentActiveSettings = null;
  let slideshowTimer = null;
  let timePeriodCheckInterval = null;
  let lastTimePeriod = null;
  let currentCustomEffects = [];
  // Whether currentSettings for this page came from DEFAULT_BG_KEY rather
  // than the page's own domain entry — decides where slideshow rotation
  // writes back to, and whether a DEFAULT_BG_KEY storage change should
  // repaint this page.
  let usingDefault = false;
  let lastKnownDefault = null;

  // Initialize
  init();

  function init() {
    if (typeof chrome === 'undefined' || !chrome.runtime?.id) return;
    // Keep exactly one live listener of each kind, even if this script is
    // injected more than once (manifest at document_start + on-demand
    // re-injection from the popup after the extension is reloaded).
    try {
      if (window.__pagedyeListener) {
        chrome.runtime.onMessage.removeListener(window.__pagedyeListener);
      }
    } catch (e) {}
    window.__pagedyeListener = onMessage;
    try {
      chrome.runtime.onMessage.addListener(onMessage);
    } catch (e) {}

    try {
      if (window.__pagedyeStorageListener) {
        chrome.storage.onChanged.removeListener(window.__pagedyeStorageListener);
      }
    } catch (e) {}
    window.__pagedyeStorageListener = onStorageChanged;
    try {
      chrome.storage.onChanged.addListener(onStorageChanged);
    } catch (e) {}

    // Listen to prefers-color-scheme change
    if (window.__pagedyeMediaListener) {
      window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', window.__pagedyeMediaListener);
    }
    window.__pagedyeMediaListener = onMediaSchemeChanged;
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', onMediaSchemeChanged);

    // Load initial settings
    const domain = window.location.hostname;
    try {
      chrome.storage.local.get([domain, CUSTOM_EFFECTS_KEY, DEFAULT_BG_KEY], (data) => {
        if (typeof chrome === 'undefined' || !chrome.runtime?.id) {
          return;
        }
        currentCustomEffects = data[CUSTOM_EFFECTS_KEY] || [];
        lastKnownDefault = data[DEFAULT_BG_KEY] || null;
        usingDefault = !data[domain] && !!lastKnownDefault;
        const settings = data[domain] || lastKnownDefault;
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
              try {
                chrome.storage.local.set({ [usingDefault ? DEFAULT_BG_KEY : domain]: settings }, () => {
                  if (typeof chrome === 'undefined' || !chrome.runtime?.id) {
                    return;
                  }
                  applyBackground(settings);
                });
              } catch (e) {}
              return;
            }
          }
          applyBackground(settings);
        }
    // Listen to Alt key keyboard events for background interaction
    if (window.__pagedyeKeydownListener) {
      window.removeEventListener('keydown', window.__pagedyeKeydownListener);
    }
    if (window.__pagedyeKeyupListener) {
      window.removeEventListener('keyup', window.__pagedyeKeyupListener);
    }
    if (window.__pagedyeBlurListener) {
      window.removeEventListener('blur', window.__pagedyeBlurListener);
    }

    let isAltActive = false;
    function updateBackgroundInteractiveState() {
      const root = document.getElementById(ROOT_ID);
      if (!root) return;
      const iframe = root.shadowRoot.getElementById('pagedye-effect-iframe');
      if (!iframe) return;

      const activeSettings = currentActiveSettings;
      let customEffect = null;
      if (activeSettings && activeSettings.type === 'effect' && activeSettings.effect && activeSettings.effect.startsWith('custom:')) {
        const customId = activeSettings.effect.replace('custom:', '');
        customEffect = currentCustomEffects.find((eff) => eff.id === customId);
      }

      if (customEffect && customEffect.type === 'url' && customEffect.interactive) {
        if (isAltActive) {
          root.style.zIndex = '2147483647';
          iframe.style.pointerEvents = 'auto';
        } else {
          root.style.zIndex = '-2147483648';
          iframe.style.pointerEvents = 'none';
        }
      }
    }

    window.__pagedyeKeydownListener = (e) => {
      if (e.key === 'Alt') {
        const activeSettings = currentActiveSettings;
        let customEffect = null;
        if (activeSettings && activeSettings.type === 'effect' && activeSettings.effect && activeSettings.effect.startsWith('custom:')) {
          const customId = activeSettings.effect.replace('custom:', '');
          customEffect = currentCustomEffects.find((eff) => eff.id === customId);
        }
        if (customEffect && customEffect.type === 'url' && customEffect.interactive) {
          e.preventDefault();
          isAltActive = true;
          updateBackgroundInteractiveState();
        }
      }
    };
    window.__pagedyeKeyupListener = (e) => {
      if (e.key === 'Alt') {
        isAltActive = false;
        updateBackgroundInteractiveState();
      }
    };
    window.__pagedyeBlurListener = () => {
      isAltActive = false;
      updateBackgroundInteractiveState();
    };

    window.addEventListener('keydown', window.__pagedyeKeydownListener);
    window.addEventListener('keyup', window.__pagedyeKeyupListener);
    window.addEventListener('blur', window.__pagedyeBlurListener);
      });
    } catch (e) {}
  }

  function onMediaSchemeChanged() {
    // Re-applying also lets an "auto" effect color preset (independent of
    // the wallpaper light/dark MODE) pick up the new OS scheme live.
    if (currentSettings) {
      applyBackground(currentSettings);
    }
  }

  // Presets an "effect" wallpaper's color/bgColor can follow instead of a
  // manually-picked custom color: 'auto' tracks the OS light/dark scheme
  // live, 'light'/'dark' are fixed, 'custom' uses effectColor/effectBgColor.
  const EFFECT_LIGHT_PRESET = { color: '#18181b', bgColor: '#f5f5f5' };
  const EFFECT_DARK_PRESET = { color: '#f5f5f5', bgColor: '#0a0a0a' };

  function resolveEffectColors(settings) {
    const scheme = settings.effectColorScheme || 'auto';
    if (scheme === 'light') return EFFECT_LIGHT_PRESET;
    if (scheme === 'dark') return EFFECT_DARK_PRESET;
    if (scheme === 'custom') return { color: settings.effectColor, bgColor: settings.effectBgColor };
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return isDark ? EFFECT_DARK_PRESET : EFFECT_LIGHT_PRESET;
  }

  function onMessage(message, sender, sendResponse) {
    if (typeof chrome === 'undefined' || !chrome.runtime?.id) return;
    if (message.action === 'updateBackground') {
      currentSettings = message.settings;
      applyBackground(message.settings);
    }
    // Reply so the sender's awaited sendMessage resolves cleanly.
    try {
      sendResponse({ ok: true });
    } catch (e) {}
    return false;
  }

  // Re-apply whenever this domain's settings change in storage. This makes the
  // background update even when it's written by the in-page element picker
  // (the popup is closed at that point and can't message us).
  function onStorageChanged(changes, area) {
    if (typeof chrome === 'undefined' || !chrome.runtime?.id) return;
    if (area !== 'local') return;
    const domain = window.location.hostname;

    if (Object.prototype.hasOwnProperty.call(changes, CUSTOM_EFFECTS_KEY)) {
      currentCustomEffects = changes[CUSTOM_EFFECTS_KEY].newValue || [];
      // The custom-effect library changed (edited/deleted) — re-apply in case
      // the active background (possibly nested under auto/slideshow) is
      // running one of them. Harmless no-op otherwise.
      if (currentSettings) applyBackground(currentSettings);
    }

    let domainHandled = false;
    if (Object.prototype.hasOwnProperty.call(changes, DEFAULT_BG_KEY)) {
      lastKnownDefault = changes[DEFAULT_BG_KEY].newValue || null;
    }

    if (Object.prototype.hasOwnProperty.call(changes, domain)) {
      domainHandled = true;
      const newValue = changes[domain].newValue;
      usingDefault = !newValue && !!lastKnownDefault;
      const settings = newValue || lastKnownDefault || { type: 'none' };
      currentSettings = settings;
      applyBackground(settings);
    }

    // Only repaint from a default-background change if this page isn't
    // already covered by the domain-change branch above and has no
    // override of its own — otherwise this would clobber a site that just
    // got (or already has) its own independent settings.
    if (!domainHandled && Object.prototype.hasOwnProperty.call(changes, DEFAULT_BG_KEY) && usingDefault) {
      currentSettings = lastKnownDefault || { type: 'none' };
      applyBackground(currentSettings);
    }
  }

  function applyBackground(settings) {
    settings = settings || { type: 'none' };

    if (slideshowTimer) {
      clearTimeout(slideshowTimer);
      slideshowTimer = null;
    }
    if (timePeriodCheckInterval) {
      clearInterval(timePeriodCheckInterval);
      timePeriodCheckInterval = null;
    }

    let activeSettings = settings;
    if (settings.mode === 'auto') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const subSettings = isDark ? settings.dark : settings.light;
      activeSettings = Object.assign({}, subSettings || { type: 'none' }, {
        targetSelector: settings.targetSelector,
        customCss: settings.customCss,
        deepCompat: settings.deepCompat,
        deepCompatExclude: settings.deepCompatExclude
      });
    } else if (settings.mode === 'timeRange') {
      const activeItem = getCurrentTimePeriod(settings);
      if (activeItem) {
        lastTimePeriod = activeItem.id || 'first';
        activeSettings = Object.assign({}, activeItem, {
          targetSelector: settings.targetSelector,
          customCss: settings.customCss,
          deepCompat: settings.deepCompat,
          deepCompatExclude: settings.deepCompatExclude
        });
      } else {
        activeSettings = { type: 'none' };
      }
      setupTimeRangeCheck(settings);
    } else if (settings.mode === 'slideshow' && settings.slideshow && settings.slideshow.items && settings.slideshow.items.length > 0) {
      const sh = settings.slideshow;
      let index = sh.currentIndex || 0;
      if (index >= sh.items.length) index = 0;
      const subSettings = sh.items[index];
      activeSettings = Object.assign({}, subSettings || { type: 'none' }, {
        targetSelector: settings.targetSelector,
        customCss: settings.customCss,
        deepCompat: settings.deepCompat,
        deepCompatExclude: settings.deepCompatExclude
      });
      setupSlideshowTimer(settings);
    }

    currentActiveSettings = activeSettings;

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
      updateDeepCompat(false, '');
      return;
    }

    // Deep Compatibility Mode runs independently of selector/overlay mode:
    // some sites stack several opaque full-viewport containers *above* both
    // the negative-z-index overlay and a selector-targeted element's own
    // ::before layer (e.g. Google's mobile app shell), hiding the background
    // no matter which mode painted it.
    updateDeepCompat(!!activeSettings.deepCompat, activeSettings.deepCompatExclude);

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
    try {
      chrome.storage.local.get(domain, (data) => {
        if (typeof chrome === 'undefined' || !chrome.runtime?.id) {
          return;
        }
        const stored = data[domain];
        if (stored && stored.mode === 'slideshow' && stored.slideshow) {
          stored.slideshow.currentIndex = nextIndex;
          stored.slideshow.lastRotationTime = Date.now();
          try {
            chrome.storage.local.set({ [domain]: stored });
          } catch (e) {}
        }
      });
    } catch (e) {}
  }

  function getCurrentTimePeriod(settings) {
    if (!settings || !settings.timeRange || !Array.isArray(settings.timeRange.items) || settings.timeRange.items.length === 0) {
      return null;
    }
    const hour = new Date().getHours();
    for (const item of settings.timeRange.items) {
      const start = item.start;
      const end = item.end;
      if (start < end) {
        if (hour >= start && hour < end) return item;
      } else if (start > end) {
        if (hour >= start || hour < end) return item;
      } else {
        if (hour === start) return item;
      }
    }
    return settings.timeRange.items[0];
  }

  function setupTimeRangeCheck(settings) {
    timePeriodCheckInterval = setInterval(() => {
      const currentItem = getCurrentTimePeriod(settings);
      const currentId = currentItem ? currentItem.id : null;
      if (currentId !== lastTimePeriod) {
        lastTimePeriod = currentId;
        applyBackground(settings);
      }
    }, 60000); // Check every minute
  }

  // Full-page background: a fixed layer behind everything, with html/body
  // forced transparent so it shows through.
  function applyOverlay(settings) {
    enforceTransparency();

    let root = document.getElementById(ROOT_ID);
    let layer, canvas, iframe;

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

      iframe = document.createElement('iframe');
      iframe.id = 'pagedye-effect-iframe';
      Object.assign(iframe.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        border: 'none',
        display: 'none',
        transition: 'opacity 0.3s ease'
      });
      shadow.appendChild(iframe);
    } else {
      layer = root.shadowRoot.getElementById('pagedye-layer');
      canvas = root.shadowRoot.getElementById('pagedye-effect-canvas');
      iframe = root.shadowRoot.getElementById('pagedye-effect-iframe');
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'pagedye-effect-iframe';
        Object.assign(iframe.style, {
          position: 'absolute',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'none',
          transition: 'opacity 0.3s ease'
        });
        root.shadowRoot.appendChild(iframe);
      }
    }

    root.style.zIndex = '-2147483648';

    let customEffect = null;
    if (settings.type === 'effect' && settings.effect && settings.effect.startsWith('custom:')) {
      const customId = settings.effect.replace('custom:', '');
      customEffect = currentCustomEffects.find((e) => e.id === customId);
    }

    if (settings.type === 'effect') {
      // Effects always fill the viewport, fixed in place — a leftover
      // absolute/100%-height root from a previous non-fixed image (see
      // below) would otherwise clip or scroll the canvas away.
      root.style.position = 'fixed';
      root.style.height = '100vh';
      layer.style.backgroundImage = 'none';
      layer.style.backgroundColor = 'transparent';

      if (customEffect && customEffect.type === 'url') {
        window.PageDyeEffects.stopEffect();
        canvas.style.display = 'none';

        iframe.style.display = 'block';
        iframe.style.opacity = ((typeof settings.opacity === 'number' ? settings.opacity : 100) / 100).toString();
        iframe.style.pointerEvents = customEffect.interactive ? 'auto' : 'none';

        let targetUrl = customEffect.url || '';
        if (targetUrl && !/^https?:\/\//i.test(targetUrl)) {
          targetUrl = 'https://' + targetUrl;
        }
        if (iframe.src !== targetUrl) {
          iframe.src = targetUrl;
        }
        return;
      }

      if (iframe) {
        iframe.style.display = 'none';
        iframe.style.pointerEvents = 'none';
        iframe.src = '';
      }

      const resolvedColors = resolveEffectColors(settings);
      window.PageDyeEffects.startEffect(canvas, settings.effect || 'waves', settings.opacity, {
        color: resolvedColors.color,
        bgColor: resolvedColors.bgColor,
        density: settings.effectDensity,
        speed: settings.effectSpeed,
        text: settings.effectText
      }, currentCustomEffects);
      return;
    }

    window.PageDyeEffects.stopEffect();
    canvas.style.display = 'none';
    if (iframe) {
      iframe.style.display = 'none';
      iframe.style.pointerEvents = 'none';
      iframe.src = '';
    }

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
          `background-color: ${window.PageDyeEffects.helpers.hexToRgba(settings.value, alpha)} !important;` +
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
    window.PageDyeEffects.stopEffect();

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

  // Turns one or more chosen containers (e.g. a card/main content wrapper)
  // into frosted-glass panels: each one's own background is replaced with a
  // light/dark tint (matching the OS color scheme) and blurred via
  // backdrop-filter, so whatever sits behind it (the page's own content, or
  // PageDye's own wallpaper layer) shows through softly instead of being
  // hidden by an opaque background.
  //
  // cfg is normally an array of { selector, blur, opacity } entries — one
  // style tag per entry (unique id) so applying a new one never clobbers the
  // others. Older saved settings stored a single object here instead of an
  // array; normalizeFrostedGlassList() upgrades that shape transparently.
  function normalizeFrostedGlassList(cfg) {
    if (Array.isArray(cfg)) return cfg;
    if (cfg && typeof cfg === 'object' && cfg.selector) return [cfg];
    return [];
  }

  function applyFrostedGlass(cfg) {
    removeFrostedGlass();
    const list = normalizeFrostedGlassList(cfg);

    list.forEach((entry, i) => {
      if (!entry || !entry.selector || !entry.selector.trim()) return;

      const sel = scopeSelector(entry.selector);
      const blur = typeof entry.blur === 'number' ? entry.blur : 12;
      const alpha = (typeof entry.opacity === 'number' ? entry.opacity : 55) / 100;

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
      style.id = `${FROSTED_STYLE_ID}-${i}`;
      style.textContent = css;
      (document.head || document.documentElement).appendChild(style);
    });
  }

  function removeFrostedGlass() {
    document.querySelectorAll(`style[id^="${FROSTED_STYLE_ID}"]`).forEach((style) => style.remove());
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

  // Deep Compatibility Mode
  //
  // Some sites (Google's mobile app shell is the canonical case) stack several
  // opaque, full-viewport wrapper `<div>`s above whatever PageDye paints, so
  // neither the full-page overlay (behind everything via negative z-index) nor
  // a selector-targeted element's own ::before layer can ever show through —
  // there's always another opaque sheet sitting on top of it in paint order.
  //
  // Rather than requiring the user to hand-pick every offending wrapper (they
  // are usually unlabeled, dynamically-classed divs that differ per page), this
  // samples a grid of points across the current viewport with
  // `elementsFromPoint`, and for every element at those points whose computed
  // background is opaque-ish *and* whose box covers most of the viewport, force
  // its background transparent via a directly-set `!important` inline style
  // (highest-priority way to win against the site's own stylesheets without
  // needing a stable selector for elements that often don't have one).
  const DEEP_COMPAT_GRID_COLS = 6;
  const DEEP_COMPAT_GRID_ROWS = 8;
  const DEEP_COMPAT_MIN_COVERAGE = 0.5; // fraction of viewport area a candidate must overlap
  const DEEP_COMPAT_MIN_ALPHA = 0.15; // ignore near-fully-transparent tints/hover states
  // Some sites (e.g. Google's mobile search results) have no single dominant
  // opaque wrapper — instead the whole viewport is tiled edge-to-edge by many
  // small opaque cards, each individually well under DEEP_COMPAT_MIN_COVERAGE.
  // If most sampled points resolve to *some* opaque foreground element, treat
  // the whole tiling as a cover regardless of each tile's own size.
  const DEEP_COMPAT_TILED_POINT_RATIO = 0.6; // fraction of grid points that must hit an opaque element
  const DEEP_COMPAT_SCAN_DEBOUNCE_MS = 400;
  const DEEP_COMPAT_SAFETY_INTERVAL_MS = 3000;
  const DEEP_COMPAT_SKIP_TAGS = new Set([
    'HTML', 'BODY', 'SCRIPT', 'STYLE', 'SVG', 'PATH', 'IMG', 'VIDEO', 'CANVAS',
    'IFRAME', 'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT', 'OPTION', 'A'
  ]);

  let deepCompatEnabled = false;
  let deepCompatExcludeSelector = '';
  let deepCompatObserver = null;
  let deepCompatScanTimer = null;
  let deepCompatIntervalTimer = null;
  const deepCompatNeutralized = new Set();
  const deepCompatOriginalStyleAttrs = new WeakMap();

  // Called on every applyBackground() pass with the desired enabled state.
  // Starts/stops the watchers on an enabled-state transition, and re-scans
  // immediately if only the exclude selector changed while already running.
  function updateDeepCompat(enabled, excludeSelector) {
    deepCompatExcludeSelector = excludeSelector || '';
    if (enabled === deepCompatEnabled) {
      if (enabled) scheduleDeepCompatScan();
      return;
    }
    deepCompatEnabled = enabled;
    if (enabled) {
      startDeepCompat();
    } else {
      stopDeepCompat();
    }
  }

  function startDeepCompat() {
    scheduleDeepCompatScan();
    if (!deepCompatObserver) {
      deepCompatObserver = new MutationObserver(scheduleDeepCompatScan);
      deepCompatObserver.observe(document.documentElement, { childList: true, subtree: true });
    }
    window.addEventListener('scroll', scheduleDeepCompatScan, { passive: true });
    window.addEventListener('resize', scheduleDeepCompatScan, { passive: true });
    if (!deepCompatIntervalTimer) {
      // Safety net for changes a mutation/scroll/resize listener can miss,
      // e.g. a class toggle that resizes an existing element without adding
      // or removing any nodes.
      deepCompatIntervalTimer = setInterval(() => {
        if (document.visibilityState === 'visible') scanForOpaqueCovers();
      }, DEEP_COMPAT_SAFETY_INTERVAL_MS);
    }
  }

  function stopDeepCompat() {
    if (deepCompatObserver) {
      deepCompatObserver.disconnect();
      deepCompatObserver = null;
    }
    window.removeEventListener('scroll', scheduleDeepCompatScan);
    window.removeEventListener('resize', scheduleDeepCompatScan);
    if (deepCompatIntervalTimer) {
      clearInterval(deepCompatIntervalTimer);
      deepCompatIntervalTimer = null;
    }
    if (deepCompatScanTimer) {
      clearTimeout(deepCompatScanTimer);
      deepCompatScanTimer = null;
    }
    revertAllDeepCompat();
  }

  function scheduleDeepCompatScan() {
    if (deepCompatScanTimer) clearTimeout(deepCompatScanTimer);
    deepCompatScanTimer = setTimeout(() => {
      deepCompatScanTimer = null;
      scanForOpaqueCovers();
    }, DEEP_COMPAT_SCAN_DEBOUNCE_MS);
  }

  function parseAlpha(colorStr) {
    const m = colorStr && colorStr.match(/rgba?\(([^)]+)\)/);
    if (!m) return 1;
    const parts = m[1].split(',').map((s) => parseFloat(s.trim()));
    return parts.length === 4 ? parts[3] : 1;
  }

  function isDeepCompatExcluded(el) {
    if (!deepCompatExcludeSelector) return false;
    try {
      return el.closest(deepCompatExcludeSelector) !== null;
    } catch (e) {
      return false; // invalid user-supplied selector — fail open, exclude nothing
    }
  }

  function scanForOpaqueCovers() {
    if (!deepCompatEnabled) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (!vw || !vh) return;
    const viewportArea = vw * vh;

    const candidates = new Set();
    const tiledCandidates = new Set();
    let sampledPoints = 0;
    let opaquePoints = 0;

    for (let r = 0; r < DEEP_COMPAT_GRID_ROWS; r++) {
      const y = Math.round(((r + 0.5) / DEEP_COMPAT_GRID_ROWS) * vh);
      for (let c = 0; c < DEEP_COMPAT_GRID_COLS; c++) {
        const x = Math.round(((c + 0.5) / DEEP_COMPAT_GRID_COLS) * vw);

        let stack;
        try {
          stack = document.elementsFromPoint(x, y);
        } catch (e) {
          continue;
        }

        let frontmost = null;
        for (const el of stack) {
          if (!el || el.nodeType !== 1 || el.id === ROOT_ID) continue;
          if (DEEP_COMPAT_SKIP_TAGS.has(el.tagName)) continue;
          if (isDeepCompatExcluded(el)) continue;
          if (!frontmost) frontmost = el;

          const rect = el.getBoundingClientRect();
          const overlapW = Math.min(rect.right, vw) - Math.max(rect.left, 0);
          const overlapH = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
          if (overlapW <= 0 || overlapH <= 0) continue;
          if ((overlapW * overlapH) / viewportArea < DEEP_COMPAT_MIN_COVERAGE) continue;

          // Once we've neutralized an element, its own computed alpha reads
          // as ~0 (we forced it transparent), so re-checking it here would
          // make it look like it "stopped" covering the screen and get
          // reverted — which makes it opaque again on the very next scan,
          // producing a neutralize/revert flicker loop. Elements we already
          // neutralized stay candidates as long as they still pass the
          // position/size coverage check above; only never-touched elements
          // need the live alpha check.
          if (!deepCompatNeutralized.has(el)) {
            const alpha = parseAlpha(window.getComputedStyle(el).backgroundColor);
            if (alpha < DEEP_COMPAT_MIN_ALPHA) continue;
          }

          candidates.add(el);
        }

        // Track the frontmost qualifying element at this point separately,
        // regardless of its own size, to catch a mosaic of small opaque tiles
        // (see DEEP_COMPAT_TILED_POINT_RATIO above).
        if (frontmost) {
          sampledPoints++;
          const isOpaque = deepCompatNeutralized.has(frontmost)
            || parseAlpha(window.getComputedStyle(frontmost).backgroundColor) >= DEEP_COMPAT_MIN_ALPHA;
          if (isOpaque) {
            opaquePoints++;
            tiledCandidates.add(frontmost);
          }
        }
      }
    }

    if (sampledPoints > 0 && opaquePoints / sampledPoints >= DEEP_COMPAT_TILED_POINT_RATIO) {
      for (const el of tiledCandidates) candidates.add(el);
    }

    // Elements that no longer qualify (scrolled away, removed, or the site
    // changed their background itself) get their original style restored.
    for (const el of deepCompatNeutralized) {
      if (!candidates.has(el)) {
        revertDeepCompatElement(el);
        deepCompatNeutralized.delete(el);
      }
    }

    for (const el of candidates) {
      if (!deepCompatNeutralized.has(el)) {
        neutralizeDeepCompatElement(el);
        deepCompatNeutralized.add(el);
      }
    }
  }

  function neutralizeDeepCompatElement(el) {
    if (!deepCompatOriginalStyleAttrs.has(el)) {
      deepCompatOriginalStyleAttrs.set(el, el.getAttribute('style'));
    }
    el.style.setProperty('background-color', 'transparent', 'important');
    el.style.setProperty('background-image', 'none', 'important');
  }

  function revertDeepCompatElement(el) {
    const original = deepCompatOriginalStyleAttrs.get(el);
    if (original === null || original === undefined) {
      el.removeAttribute('style');
    } else {
      el.setAttribute('style', original);
    }
    deepCompatOriginalStyleAttrs.delete(el);
  }

  function revertAllDeepCompat() {
    for (const el of deepCompatNeutralized) revertDeepCompatElement(el);
    deepCompatNeutralized.clear();
  }

})();
