// Shared content-script dependency loader used by popup and options pages.
// Existing tabs are pinged first; the full dependency bundle is injected only
// when no live PageDye receiver exists (for example, after extension reload).
(() => {
  const CONTENT_SCRIPT_FILES = Object.freeze([
    'scripts/storage-schema.js',
    'scripts/gradient.js',
    'scripts/effects.js',
    'scripts/cursor.js',
    'scripts/custom-effect-sandbox.js',
    'scripts/content.js'
  ]);

  async function ping(tabId) {
    return chrome.tabs.sendMessage(tabId, { action: 'pagedyePing' });
  }

  async function inject(tabId) {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: [...CONTENT_SCRIPT_FILES]
    });
  }

  async function ensure(tabId) {
    try {
      return await ping(tabId);
    } catch (firstError) {
      try {
        await inject(tabId);
        return await ping(tabId);
      } catch (injectionError) {
        if (injectionError && firstError && !injectionError.cause) {
          try { injectionError.cause = firstError; } catch (_) {}
        }
        throw injectionError;
      }
    }
  }

  async function send(tabId, message) {
    try {
      return await chrome.tabs.sendMessage(tabId, message);
    } catch (_) {
      await inject(tabId);
      return chrome.tabs.sendMessage(tabId, message);
    }
  }

  window.PageDyeInjection = { CONTENT_SCRIPT_FILES, ensure, send };
})();
