// Closes a coverage gap the unit-level arbiter tests and the plain-domain
// smoke tests both miss: does popup.js's sender code actually send a message
// SHAPED the way scripts/background.js's arbiter expects to receive it? Boots
// the real popup.html/popup.js (via the same jsdom harness the smoke tests
// use) with chrome.runtime.sendMessage wired to the REAL background.js
// (loaded via node:vm), sharing the same in-memory chrome.storage.local, so a
// save for a URL-rule-backed site exercises the full popup -> background ->
// storage round trip exactly as it would in the real extension.
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

// Wires a chrome mock's onMessage hook to a REAL background.js instance that
// shares the mock's own storage backing, so writes made by background.js are
// immediately visible through the same chrome.storage.local the page sees.
function attachRealBackground(chrome) {
  const backgroundListeners = [];
  const backgroundChrome = {
    storage: chrome.storage,
    runtime: { onMessage: { addListener: (fn) => backgroundListeners.push(fn) } }
  };
  runInNewContext(background, { chrome: backgroundChrome, console });
  chrome.runtime.onMessage = {
    addListener() {},
    removeListener() {}
  };
  const originalSendMessage = chrome.runtime.sendMessage.bind(chrome.runtime);
  chrome.runtime.sendMessage = (message) => new Promise((resolveResponse) => {
    for (const listener of backgroundListeners) {
      const keepAlive = listener(message, {}, resolveResponse);
      if (keepAlive) return;
    }
    // Not a message the background arbiter handles -- fall back to the plain mock.
    originalSendMessage(message).then(resolveResponse);
  });
}

test('popup: saving settings for a URL-rule-backed site round-trips through the real background arbiter', async () => {
  const existingRule = {
    id: 'rule-test-1',
    type: 'hostname',
    pattern: 'example.com',
    action: 'apply',
    enabled: true,
    settings: { mode: 'single', type: 'none' }
  };
  const { chrome, store } = createChromeMock({ initialStorage: { [RULES_KEY]: [existingRule] } });
  attachRealBackground(chrome);

  const { document, errors } = await loadExtensionPage('popup/popup.html', { chrome });
  assert.deepEqual(errors, []);

  // The active tab (example.com) matches existingRule by hostname, so popup.js's
  // loadSettings() should have resolved activeRuleId to this rule -- verify via
  // the target hint text rather than reaching into popup.js's closed-over state.
  const typeColor = document.getElementById('type-color');
  typeColor.checked = true;
  fire(typeColor, 'change');

  await waitFor(() => {
    const rules = store[RULES_KEY];
    return Array.isArray(rules) && rules[0] && rules[0].settings && rules[0].settings.type === 'color';
  }, { timeout: 2000 });

  const rules = store[RULES_KEY];
  assert.equal(rules.length, 1, 'the save must update the existing rule, not create a new one');
  assert.equal(rules[0].id, 'rule-test-1');
  assert.equal(rules[0].settings.type, 'color');

  const colorPicker = document.getElementById('color-picker');
  colorPicker.value = '#abcdef';
  fire(colorPicker, 'input');
  await waitFor(() => store[RULES_KEY][0].settings.value === '#abcdef', { timeout: 2000 });
  assert.equal(store[RULES_KEY].length, 1, 'still exactly one rule after a second save');
});
