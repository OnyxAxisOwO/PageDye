(() => {
  const ROOT_ID = 'pagedye-extension-root';
  const STYLE_ID = 'pagedye-extension-style-override';
  const TARGET_STYLE_ID = 'pagedye-target-style';
  const CUSTOM_STYLE_ID = 'pagedye-custom-css';
  let currentSettings = null;
  let slideshowTimer = null;

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

    // Custom CSS is applied independently of the background type.
    applyCustomCss(activeSettings.customCss);

    const hasBackground = activeSettings.type === 'color' || activeSettings.type === 'image';
    const selector = activeSettings.targetSelector && activeSettings.targetSelector.trim();

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
    let layer;

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
      layer = document.createElement('div');
      layer.id = 'pagedye-layer';
      shadow.appendChild(layer);
    } else {
      layer = root.shadowRoot.getElementById('pagedye-layer');
    }

    const style = {
      width: '100%',
      height: '100%',
      transition: 'background 0.3s ease, opacity 0.3s ease',
      opacity: (settings.opacity / 100).toString(),
      position: 'relative'
    };

    if (settings.type === 'color') {
      style.backgroundColor = settings.value;
      style.backgroundImage = 'none';
      style.filter = 'none';
      style.transform = 'none';
    } else if (settings.type === 'image') {
      style.backgroundColor = 'transparent';
      style.backgroundImage = `url("${settings.value}")`;
      style.filter = buildFilterString(settings);
      style.transform = (settings.blur || 0) > 0 ? 'scale(1.05)' : 'none'; // Prevent blur edge artifacts

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

    let css = '';
    if (settings.type === 'color') {
      const alpha = (typeof settings.opacity === 'number' ? settings.opacity : 100) / 100;
      css =
        `${sel} {` +
          'background-image: none !important;' +
          `background-color: ${hexToRgba(settings.value, alpha)} !important;` +
        '}';
    } else if (settings.type === 'image') {
      const st = settings.style || {};
      const opacity = (typeof settings.opacity === 'number' ? settings.opacity : 100) / 100;
      const filterStr = buildFilterString(settings);

      // We can't put opacity/blur on the element itself — that would also dim
      // and blur its text/children. Instead we paint the image on a ::before
      // layer sitting *behind* the element's content (z-index:-1), and clear
      // the element's own background so the layer shows through. This lets
      // opacity, blur, fixed-attachment and tiling all work without touching
      // the readability of the element's content.
      //
      // `isolation: isolate` confines the negative-z-index layer to the
      // element's own stacking context so it can't slip behind ancestors.
      const layerPos = st.fixed
        ? 'position: fixed !important; top: 0 !important; left: 0 !important;' +
          'width: 100vw !important; height: 100vh !important;'
        : 'position: absolute !important; inset: 0 !important;';

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
          `background-image: url("${settings.value}") !important;` +
          'background-position: center center !important;' +
          `background-size: ${st.size || 'cover'} !important;` +
          `background-repeat: ${st.repeat ? 'repeat' : 'no-repeat'} !important;` +
          `filter: ${filterStr} !important;` +
          `opacity: ${opacity} !important;` +
        '}';
    }

    const style = document.createElement('style');
    style.id = TARGET_STYLE_ID;
    style.textContent = css;
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
