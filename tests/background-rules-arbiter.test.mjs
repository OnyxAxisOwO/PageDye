// Verifies the URL_RULES_KEY write-serialization arbiter added to
// scripts/background.js (see the big comment block there for the "why").
// Executes the real background.js source via node:vm (same pattern the
// existing "abandoned URL-rule migration" test in extension.test.mjs uses),
// against a chrome.storage mock with REALISTIC async delays so that, if the
// serialization were broken, two concurrent writers really would race and
// lose an update -- these tests fail loudly if that regresses.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { runBackgroundScript } from './helpers/dom-harness.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const RULES_KEY = '__pagedye_url_rules_v081__';

function createChromeMock(initialRules, { delayMs = 5 } = {}) {
  const store = { [RULES_KEY]: initialRules };
  const listeners = [];
  const chrome = {
    storage: {
      local: {
        get: (keys) => new Promise((resolveGet) => {
          setTimeout(() => {
            if (typeof keys === 'string') resolveGet({ [keys]: store[keys] });
            else resolveGet({ ...store });
          }, delayMs);
        }),
        set: (obj) => new Promise((resolveSet) => {
          setTimeout(() => {
            Object.assign(store, obj);
            resolveSet();
          }, delayMs);
        })
      }
    },
    runtime: {
      onMessage: { addListener: (fn) => listeners.push(fn) },
      onConnect: { addListener() {} }
    }
  };
  return { chrome, listeners, getStore: () => store };
}

function sendMessage(listeners, message) {
  return new Promise((resolveResponse) => {
    for (const listener of listeners) {
      const keepAlive = listener(message, {}, resolveResponse);
      if (keepAlive) return;
    }
  });
}

test('concurrent setRuleSettings writes to DIFFERENT rules do not lose either update', async () => {
  const initialRules = [
    { id: 'rule-a', type: 'hostname', pattern: 'a.example', action: 'apply', enabled: true, settings: { type: 'none' } },
    { id: 'rule-b', type: 'hostname', pattern: 'b.example', action: 'apply', enabled: true, settings: { type: 'none' } }
  ];
  const { chrome, listeners, getStore } = createChromeMock(initialRules, { delayMs: 5 });
  runBackgroundScript({ chrome, console, URL });

  const [respA, respB] = await Promise.all([
    sendMessage(listeners, { action: 'pagedyeMutateUrlRules', op: 'setRuleSettings', payload: { ruleId: 'rule-a', settings: { type: 'color', value: '#111111' } } }),
    sendMessage(listeners, { action: 'pagedyeMutateUrlRules', op: 'setRuleSettings', payload: { ruleId: 'rule-b', settings: { type: 'color', value: '#222222' } } })
  ]);

  assert.equal(respA.ok, true);
  assert.equal(respB.ok, true);

  const rules = getStore()[RULES_KEY];
  assert.equal(rules.find((r) => r.id === 'rule-a').settings.value, '#111111');
  assert.equal(rules.find((r) => r.id === 'rule-b').settings.value, '#222222');
});

test('rule writes normalize CSS-facing settings before storage', async () => {
  const initialRules = [{
    id: 'rule-a',
    type: 'hostname',
    pattern: 'a.example',
    action: 'apply',
    enabled: true,
    settings: { type: 'none' }
  }];
  const { chrome, listeners, getStore } = createChromeMock(initialRules, { delayMs: 1 });
  runBackgroundScript({ chrome, console, URL });

  const response = await sendMessage(listeners, {
    action: 'pagedyeMutateUrlRules',
    op: 'setRuleSettings',
    payload: {
      ruleId: 'rule-a',
      settings: {
        type: 'color',
        value: '#111111',
        style: { size: 'url(https://evil.example)', fixed: 'yes', repeat: 'yes' },
        gradient: {
          stops: [{ color: '#ffffff', position: 0 }, { color: '#000000', position: 100 }],
          speed: 999
        },
        frostedGlass: [{ selector: 'body; background:url(https://evil.example)', opacity: 50, blur: 10 }]
      }
    }
  });

  assert.equal(response.ok, true);
  const settings = getStore()[RULES_KEY][0].settings;
  assert.equal(settings.style.size, 'cover');
  assert.equal(settings.style.fixed, true);
  assert.equal(settings.style.repeat, false);
  assert.equal(settings.gradient.speed, 60);
  assert.equal(JSON.stringify(settings.frostedGlass), '[]');
});

test('a concurrent insertRule does not get lost behind an overlapping setRuleSettings', async () => {
  const initialRules = [{ id: 'rule-a', type: 'hostname', pattern: 'a.example', action: 'apply', enabled: true, settings: { type: 'none' } }];
  const { chrome, listeners, getStore } = createChromeMock(initialRules, { delayMs: 5 });
  runBackgroundScript({ chrome, console, URL });

  const newRule = { id: 'rule-new', type: 'hostname', pattern: 'new.example', action: 'apply', enabled: true, settings: { type: 'image', value: 'x' } };
  const [respSet, respInsert] = await Promise.all([
    sendMessage(listeners, { action: 'pagedyeMutateUrlRules', op: 'setRuleSettings', payload: { ruleId: 'rule-a', settings: { type: 'color', value: '#333333' } } }),
    sendMessage(listeners, { action: 'pagedyeMutateUrlRules', op: 'insertRule', payload: { rule: newRule } })
  ]);

  assert.equal(respSet.ok, true);
  assert.equal(respInsert.ok, true);

  const rules = getStore()[RULES_KEY];
  assert.equal(rules.length, 2, 'both the pre-existing rule and the concurrently-inserted rule must survive');
  assert.equal(rules.find((r) => r.id === 'rule-a').settings.value, '#333333');
  assert.ok(rules.find((r) => r.id === 'rule-new'));
});

test('reorderRules keeps a rule the sender did not know about instead of dropping it', async () => {
  const initialRules = [
    { id: 'rule-a', type: 'hostname', pattern: 'a.example', action: 'apply', enabled: true, settings: { type: 'none' } },
    { id: 'rule-b', type: 'hostname', pattern: 'b.example', action: 'apply', enabled: true, settings: { type: 'none' } },
    { id: 'rule-c', type: 'hostname', pattern: 'c.example', action: 'apply', enabled: true, settings: { type: 'none' } }
  ];
  const { chrome, listeners, getStore } = createChromeMock(initialRules, { delayMs: 1 });
  runBackgroundScript({ chrome, console, URL });

  // Sender's ordering only knows about rule-a/rule-b (as if rule-c was
  // inserted by someone else after this sender last fetched the list).
  const resp = await sendMessage(listeners, { action: 'pagedyeMutateUrlRules', op: 'reorderRules', payload: { orderedIds: ['rule-b', 'rule-a'] } });
  assert.equal(resp.ok, true);

  const rules = getStore()[RULES_KEY];
  assert.equal(JSON.stringify(rules.map((r) => r.id)), JSON.stringify(['rule-b', 'rule-a', 'rule-c']));
});

test('deleteRule and setRuleEnabled apply correctly and unknown ops are rejected', async () => {
  const initialRules = [
    { id: 'rule-a', type: 'hostname', pattern: 'a.example', action: 'apply', enabled: true, settings: { type: 'none' } },
    { id: 'rule-b', type: 'hostname', pattern: 'b.example', action: 'apply', enabled: true, settings: { type: 'none' } }
  ];
  const { chrome, listeners, getStore } = createChromeMock(initialRules, { delayMs: 1 });
  runBackgroundScript({ chrome, console, URL });

  await sendMessage(listeners, { action: 'pagedyeMutateUrlRules', op: 'setRuleEnabled', payload: { ruleId: 'rule-b', enabled: false } });
  await sendMessage(listeners, { action: 'pagedyeMutateUrlRules', op: 'deleteRule', payload: { ruleId: 'rule-a' } });

  const rules = getStore()[RULES_KEY];
  assert.equal(JSON.stringify(rules.map((r) => r.id)), JSON.stringify(['rule-b']));
  assert.equal(rules[0].enabled, false);

  const badResp = await sendMessage(listeners, { action: 'pagedyeMutateUrlRules', op: 'notARealOp', payload: {} });
  assert.equal(badResp.ok, false);
});
