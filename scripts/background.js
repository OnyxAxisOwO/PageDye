// Service-worker-only script injection for optional debugging tools.
// The regular content runtime asks for these files only when debug mode is on.
const ABANDONED_URL_RULES_KEY = '__pagedye_url_rules__';
const URL_RULES_RECOVERY_KEY = '__pagedye_url_rules_recovered_v080__';

restoreDomainSettingsFromAbandonedRules().catch((error) => {
  console.warn('Could not recover PageDye domain settings:', error);
});

async function restoreDomainSettingsFromAbandonedRules() {
  const data = await chrome.storage.local.get(null);
  if (data[URL_RULES_RECOVERY_KEY] || !Array.isArray(data[ABANDONED_URL_RULES_KEY])) return;

  const restored = Object.create(null);
  for (const rule of data[ABANDONED_URL_RULES_KEY]) {
    if (!rule || rule.enabled === false || rule.type !== 'domain' || rule.action !== 'apply') continue;
    if (typeof rule.pattern !== 'string' || !rule.pattern || rule.pattern.startsWith('__pagedye_')) continue;
    if (/[\s/\\\u0000-\u001f]/.test(rule.pattern) || Object.hasOwn(data, rule.pattern)) continue;
    if (!rule.settings || typeof rule.settings !== 'object' || Array.isArray(rule.settings)) continue;
    if (!['none', 'color', 'image', 'effect'].includes(rule.settings.type)) continue;
    restored[rule.pattern] = rule.settings;
  }

  await chrome.storage.local.set({
    ...restored,
    [URL_RULES_RECOVERY_KEY]: true
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.action !== 'pagedyeEnsureDebugRuntime') return false;
  const tabId = sender.tab && sender.tab.id;
  if (!tabId) {
    sendResponse({ ok: false, error: 'No sender tab' });
    return false;
  }

  (async () => {
    try {
      // Install the MAIN-world bridge first so debug.js cannot emit its initial
      // capture toggle before the bridge starts listening.
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['scripts/debug-network.js'],
        world: 'MAIN'
      });
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['scripts/debug.js']
      });
      sendResponse({ ok: true });
    } catch (error) {
      sendResponse({ ok: false, error: String(error && error.message || error) });
    }
  })();
  return true;
});
