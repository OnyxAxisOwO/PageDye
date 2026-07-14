// Service-worker-only script injection for optional debugging tools.
// The regular content runtime asks for these files only when debug mode is on.
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
