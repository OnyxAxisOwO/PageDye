// Mirrors tests/popup-rule-save-integration.test.mjs for options.js: boots the
// real options.html/options.js against a chrome mock wired to the REAL
// background.js arbiter, and drives an actual rule mutation (toggling
// enabled) through options.js's own UI, proving its PageDyeRulesClient calls
// are shaped the way background.js expects.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import { createChromeMock, loadExtensionPage, waitFor, root } from './helpers/dom-harness.mjs';

const background = readFileSync(resolve(root, 'scripts/background.js'), 'utf8');
const RULES_KEY = '__pagedye_url_rules_v081__';

function fire(el, type) {
  el.dispatchEvent(new el.ownerDocument.defaultView.Event(type, { bubbles: true }));
}

function attachRealBackground(chrome) {
  const backgroundListeners = [];
  runInNewContext(background, {
    chrome: { storage: chrome.storage, runtime: { onMessage: { addListener: (fn) => backgroundListeners.push(fn) } } },
    console
  });
  const originalSendMessage = chrome.runtime.sendMessage.bind(chrome.runtime);
  chrome.runtime.sendMessage = (message) => new Promise((resolveResponse) => {
    for (const listener of backgroundListeners) {
      if (listener(message, {}, resolveResponse)) return;
    }
    originalSendMessage(message).then(resolveResponse);
  });
}

test('options.html renders a URL rule loaded through the (realm-correct) storage mock', async () => {
  const existingRule = { id: 'rule-test-1', type: 'hostname', pattern: 'example.com', action: 'apply', enabled: true, settings: { mode: 'single', type: 'color', value: '#123456' } };
  const { chrome } = createChromeMock({ initialStorage: { [RULES_KEY]: [existingRule] }, tab: null });
  const { document, errors } = await loadExtensionPage('options/options.html', { chrome });
  assert.deepEqual(errors, []);
  const rows = document.querySelectorAll('.rule-row');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].dataset.ruleId, 'rule-test-1');
});

test('options: toggling a rule\'s enabled switch round-trips through the real background arbiter', async () => {
  const existingRule = { id: 'rule-test-1', type: 'hostname', pattern: 'example.com', action: 'apply', enabled: true, settings: { mode: 'single', type: 'color', value: '#123456' } };
  const { chrome, store } = createChromeMock({ initialStorage: { [RULES_KEY]: [existingRule] }, tab: null });
  attachRealBackground(chrome);

  const { document, errors } = await loadExtensionPage('options/options.html', { chrome });
  assert.deepEqual(errors, []);

  const toggle = document.querySelector('.rule-enabled-toggle');
  assert.ok(toggle, 'rule enabled toggle should be rendered');
  assert.equal(toggle.checked, true);
  toggle.checked = false;
  fire(toggle, 'change');

  await waitFor(() => store[RULES_KEY] && store[RULES_KEY][0].enabled === false, { timeout: 2000 });
  assert.equal(store[RULES_KEY].length, 1, 'still exactly one rule');
  assert.equal(store[RULES_KEY][0].id, 'rule-test-1');
  assert.equal(store[RULES_KEY][0].settings.value, '#123456', 'unrelated settings must be untouched');
});
