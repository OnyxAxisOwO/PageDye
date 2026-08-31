// Firefox's built-in data-collection consent is optional because AI is an
// opt-in feature. Chrome does not expose the Firefox-only data_collection
// permission in permissions.getAll(), so Chrome and older compatible hosts
// simply use the extension's normal in-product disclosure.
(function (root) {
  'use strict';

  const AI_DATA_TYPES = Object.freeze([
    'browsingActivity',
    'websiteContent',
    'personalCommunications',
    'technicalAndInteraction'
  ]);

  function isFirefox() {
    return typeof navigator !== 'undefined' && /Firefox\//i.test(navigator.userAgent || '');
  }

  async function ensureForAi() {
    const permissions = root.chrome && root.chrome.permissions;
    if (!isFirefox() || !permissions || typeof permissions.request !== 'function') return true;

    // This is called directly from the chat submit handler. Request first so
    // Firefox can associate the prompt with the user's activation; only then
    // inspect the resulting grant.
    let accepted;
    try {
      accepted = await permissions.request({ data_collection: AI_DATA_TYPES.slice() });
    } catch (_) {
      return false;
    }
    if (!accepted) return false;

    if (typeof permissions.getAll !== 'function') return true;
    try {
      const granted = await permissions.getAll();
      // On Firefox versions with this feature, data_collection is present and
      // lists the optional categories currently granted. On other hosts the
      // key is absent and the request above is not needed.
      if (!Object.prototype.hasOwnProperty.call(granted, 'data_collection')) return true;
      const current = new Set(Array.isArray(granted.data_collection) ? granted.data_collection : []);
      return AI_DATA_TYPES.every((type) => current.has(type));
    } catch (_) {
      return false;
    }
  }

  root.PageDyeDataConsent = Object.freeze({ ensureForAi, AI_DATA_TYPES });
})(typeof globalThis !== 'undefined' ? globalThis : this);
