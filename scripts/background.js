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

// --- Serialized URL_RULES_KEY write arbiter --------------------------------
// popup.js, options.js, content.js, and the injected element-picker each used
// to run their own unguarded get(URL_RULES_KEY) -> mutate -> set(URL_RULES_KEY)
// against this one shared array (e.g. a slideshow auto-rotation write in an
// open tab could land between another context's read and write and get
// silently discarded). The background service worker is a single execution
// context every sender can reach via chrome.runtime.sendMessage, so funneling
// every mutation through the queue below makes each get-modify-set atomic
// relative to the others -- only one can be in flight at a time, and the next
// one always reads the result of the previous one, not a stale snapshot.
const URL_RULES_KEY = '__pagedye_url_rules_v081__';
const MAX_URL_RULES = 1000; // mirrors scripts/storage-schema.js's MAX_URL_RULES

let urlRulesWriteQueue = Promise.resolve();
function serializeUrlRulesWrite(task) {
  const settle = () => {};
  const result = urlRulesWriteQueue.then(task, task);
  urlRulesWriteQueue = result.then(settle, settle);
  return result;
}

function cloneJson(value) {
  return value === undefined ? value : JSON.parse(JSON.stringify(value));
}

function setAtPath(target, path, value) {
  let node = target;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    const nextKey = path[i + 1];
    if (node[key] === null || typeof node[key] !== 'object') node[key] = typeof nextKey === 'number' ? [] : {};
    node = node[key];
  }
  node[path[path.length - 1]] = value;
}

const URL_RULES_OPS = {
  setRuleSettings({ ruleId, settings }, rules) {
    const index = rules.findIndex((rule) => rule && rule.id === ruleId);
    if (index === -1) return rules;
    const next = rules.slice();
    next[index] = { ...next[index], settings };
    return next;
  },
  patchRuleSettingsField({ ruleId, fieldPath, value }, rules) {
    const index = rules.findIndex((rule) => rule && rule.id === ruleId);
    if (index === -1 || !Array.isArray(fieldPath) || fieldPath.length === 0) return rules;
    const next = rules.slice();
    const settings = cloneJson(next[index].settings) || {};
    setAtPath(settings, fieldPath, value);
    next[index] = { ...next[index], settings };
    return next;
  },
  insertRule({ rule }, rules) {
    if (!rule || typeof rule !== 'object' || typeof rule.id !== 'string' || !rule.id) return rules;
    return [rule, ...rules].slice(0, MAX_URL_RULES);
  },
  deleteRule({ ruleId }, rules) {
    return rules.filter((rule) => !rule || rule.id !== ruleId);
  },
  setRuleEnabled({ ruleId, enabled }, rules) {
    const index = rules.findIndex((rule) => rule && rule.id === ruleId);
    if (index === -1) return rules;
    const next = rules.slice();
    next[index] = { ...next[index], enabled: !!enabled };
    return next;
  },
  reorderRules({ orderedIds }, rules) {
    if (!Array.isArray(orderedIds)) return rules;
    const byId = new Map(rules.filter(Boolean).map((rule) => [rule.id, rule]));
    const reordered = orderedIds.map((id) => byId.get(id)).filter(Boolean);
    const mentioned = new Set(orderedIds);
    // A rule a concurrent writer just inserted/wasn't in this sender's
    // (possibly slightly stale) ordering list is kept, not silently dropped.
    const remainder = rules.filter((rule) => rule && !mentioned.has(rule.id));
    return [...reordered, ...remainder];
  }
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.action !== 'pagedyeMutateUrlRules') return false;
  const op = URL_RULES_OPS[message.op];
  if (!op) {
    sendResponse({ ok: false, error: 'Unknown URL rules op: ' + message.op });
    return false;
  }

  serializeUrlRulesWrite(async () => {
    try {
      const data = await chrome.storage.local.get(URL_RULES_KEY);
      const current = Array.isArray(data[URL_RULES_KEY]) ? data[URL_RULES_KEY] : [];
      const next = op(message.payload || {}, current);
      if (next !== current) await chrome.storage.local.set({ [URL_RULES_KEY]: next });
      sendResponse({ ok: true, rules: next });
    } catch (error) {
      sendResponse({ ok: false, error: String((error && error.message) || error) });
    }
  });
  return true;
});
