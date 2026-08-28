// Service-worker-only script injection for optional debugging tools.
// The regular content runtime asks for these files only when debug mode is on.
importScripts('ai-theme.js', 'storage-schema.js');

const ABANDONED_URL_RULES_KEY = '__pagedye_url_rules__';
const URL_RULES_RECOVERY_KEY = '__pagedye_url_rules_recovered_v080__';
const AI_CONFIG_KEY = '__pagedye_ai_config__';

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

// --- AI theme chat ---------------------------------------------------------
// Runs here rather than in the popup for two reasons: capturing the page
// profile needs chrome.scripting, which the popup would have to round-trip
// through this worker anyway, and a fetch started here is not torn down the
// instant the popup loses focus — which a popup-hosted chat would otherwise do
// on every stray click outside it.
//
// The API key is read from storage at call time and never travels in the
// message, so a compromised content script cannot obtain it by spoofing this
// request — the worst it could do is spend the user's own quota.
async function capturePageProfile(tabId) {
  // Two-step injection: the file installs window.PageDyeProfile, the second
  // call collects a profile from it. Both run in the same isolated world, and
  // splitting them avoids depending on the completion value of a `files`
  // injection.
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['scripts/page-profile.js']
  });
  const [captured] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => window.PageDyeProfile.build()
  });
  const profile = captured && captured.result;
  if (!profile) throw new Error('Could not read this page.');
  return profile;
}

// A conversation opened days ago against a tab that is now closed still has to
// be answerable, so the caller may replay the profile captured when the chat
// started. That is only honoured for extension pages (`sender.tab` is unset
// there): a content script must never be able to describe the page it is
// running on as something other than what page-profile.js would report.
async function resolveChatProfile(message, sender) {
  if (Number.isInteger(message.tabId)) return capturePageProfile(message.tabId);
  const replayed = message.profile;
  if (!sender.tab && replayed && typeof replayed === 'object') return replayed;
  throw new Error('No target tab.');
}

// The picture already on the page, if this site has one configured, offered
// back to the model as a numbered attachment it can choose to keep (see
// ai-theme.js's collectAllImages). Only the everyday `auto` shape is read —
// a site already running a schedule or a picture-free layer has nothing this
// can usefully surface, and skipping those is simpler than guessing which of
// several slides or periods the user means by "the current background".
async function resolveCurrentImage(profile) {
  const hostname = profile && typeof profile.hostname === 'string' ? profile.hostname : '';
  if (!hostname) return null;
  const Storage = self.PageDyeStorage;
  const defaultKey = Storage.KEYS.defaultBackground;
  const data = await chrome.storage.local.get([hostname, defaultKey]);
  const settings = Storage.normalizeSiteSettings(data[hostname]) || Storage.normalizeSiteSettings(data[defaultKey]);
  if (!settings) return null;
  const candidate = [settings, settings.light, settings.dark].find(
    (layer) => layer && layer.type === 'image' && typeof layer.value === 'string' && layer.value.startsWith('data:image/')
  );
  return candidate ? { dataUrl: candidate.value } : null;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.action !== 'pagedyeAiChat') return false;

  (async () => {
    try {
      const profile = await resolveChatProfile(message, sender);
      const data = await chrome.storage.local.get(AI_CONFIG_KEY);
      // Best-effort: a lookup failure here should cost the model one picture
      // it could have reused, not the whole turn.
      const currentImage = await resolveCurrentImage(profile).catch(() => null);
      const result = await self.PageDyeAiTheme.chat({
        config: (data && data[AI_CONFIG_KEY]) || {},
        profile,
        // The whole visible transcript, owned by the caller: the API is
        // stateless, so editing an earlier message is just a shorter array.
        turns: message.turns,
        currentImage
      });
      sendResponse({ ok: true, ...result, profile });
    } catch (error) {
      sendResponse({ ok: false, error: String((error && error.message) || error) });
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
