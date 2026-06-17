(() => {
  const ROOT_ID = 'pagedye-extension-root';
  const STYLE_ID = 'pagedye-extension-style-override';
  const TARGET_STYLE_ID = 'pagedye-target-style';
  const CUSTOM_STYLE_ID = 'pagedye-custom-css';

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

    // Load initial settings
    const domain = window.location.hostname;
    chrome.storage.local.get(domain, (data) => {
      const settings = data[domain];
      if (settings) {
        applyBackground(settings);
        // We run at document_start, so our injected <style> lands *before* the
        // page's own stylesheets. With equal specificity and !important, the
        // CSS "later wins" tiebreak then favors the site — which can drop our
        // selector-mode blur/opacity and let the element's own background
        // cover the image layer (the bug: works on apply, gone after reload).
        // Re-apply once the document is ready so our <style> ends up last.
        reapplyWhenReady();
      }
    });
  }

  // Re-applies the background after the page's own stylesheets have loaded, so
  // our injected rules win the document-order tiebreak against same-specificity
  // !important site rules. Re-reads storage each time so it always uses the
  // latest settings (in case they changed since document_start).
  function reapplyWhenReady() {
    const domain = window.location.hostname;
    const rerun = () => chrome.storage.local.get(domain, (data) => {
      if (data[domain]) applyBackground(data[domain]);
    });
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', rerun, { once: true });
    }
    window.addEventListener('load', rerun, { once: true });
  }

  function onMessage(message, sender, sendResponse) {
    if (message.action === 'updateBackground') {
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
      applyBackground(changes[domain].newValue || { type: 'none' });
    }
  }

  function applyBackground(settings) {
    settings = settings || { type: 'none' };

    // Custom CSS is applied independently of the background type.
    applyCustomCss(settings.customCss);

    const hasBackground = settings.type === 'color' || settings.type === 'image';
    const selector = settings.targetSelector && settings.targetSelector.trim();

    if (!hasBackground) {
      removeBackdrop();
      removeTargetStyle();
      return;
    }

    if (selector) {
      // Selector mode: paint the chosen element(s) directly via their own CSS
      // background. No full-page overlay; the rest of the page is untouched.
      removeBackdrop();
      applyTargetBackground(selector, settings);
    } else {
      // Overlay mode: paint a full-page layer behind everything.
      removeTargetStyle();
      applyOverlay(settings);
    }
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
      style.filter = `blur(${settings.blur}px)`;
      style.transform = 'scale(1.05)'; // Prevent blur edge artifacts

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

    let css = '';
    if (settings.type === 'color') {
      const alpha = (typeof settings.opacity === 'number' ? settings.opacity : 100) / 100;
      css =
        `${selector} {` +
          'background-image: none !important;' +
          `background-color: ${hexToRgba(settings.value, alpha)} !important;` +
        '}';
    } else if (settings.type === 'image') {
      const st = settings.style || {};
      const opacity = (typeof settings.opacity === 'number' ? settings.opacity : 100) / 100;
      const blur = settings.blur || 0;

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
        `${selector} {` +
          'position: relative !important;' +
          'isolation: isolate !important;' +
          'background-image: none !important;' +
          'background-color: transparent !important;' +
        '}' +
        `${selector}::before {` +
          'content: "" !important;' +
          layerPos +
          'z-index: -1 !important;' +
          'pointer-events: none !important;' +
          `background-image: url("${settings.value}") !important;` +
          'background-position: center center !important;' +
          `background-size: ${st.size || 'cover'} !important;` +
          `background-repeat: ${st.repeat ? 'repeat' : 'no-repeat'} !important;` +
          `filter: blur(${blur}px) !important;` +
          `opacity: ${opacity} !important;` +
        '}';
    }

    const style = document.createElement('style');
    style.id = TARGET_STYLE_ID;
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
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

})();
