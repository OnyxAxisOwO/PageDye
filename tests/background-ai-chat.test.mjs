// Covers the service-worker side of the AI chat that scripts/ai-theme.js
// cannot see on its own: resolveCurrentImage in scripts/background.js reads
// the site's already-configured background out of chrome.storage and hands
// it to PageDyeAiTheme.chat() as a numbered picture the model can choose to
// keep. Runs the real background.js (and its two importScripts siblings)
// through node:vm, same pattern as background-rules-arbiter.test.mjs, with a
// fake `fetch` standing in for the network so no real API call is made.
//
// Storage values are round-tripped through the vm context's OWN JSON before
// being handed back from the storage mock: real chrome.storage.local.get
// structured-clones its results into the caller's realm, and skipping that
// here would leave objects built by the outer (Node) realm's Object.prototype
// flowing into storage-schema.js's isPlainObject() running in the vm's realm,
// which always reports false across a node:vm context boundary.
import test from 'node:test';
import assert from 'node:assert/strict';
import { runInContext } from 'node:vm';
import { runBackgroundScript } from './helpers/dom-harness.mjs';

const AI_CONFIG_KEY = '__pagedye_ai_config__';
const DATA_URL = 'data:image/png;base64,iVBORw0KGgo=';

const SAMPLE_PROFILE = {
  hostname: 'example.com',
  path: '/',
  base: { backgroundColor: '#ffffff', textColor: '#1f2328', isDark: false },
  accentColors: ['#0969da'],
  containers: [{ selector: '#main-panel', textColor: '#1f2328', coverage: 0.4, matchCount: 1 }]
};

function chromeMock(store) {
  const listeners = [];
  // A vm context's built-ins (JSON included) aren't reflected as inspectable
  // properties on the context object itself from outside — only code actually
  // run inside the context via runInContext can see them — so the vm's own
  // JSON has to be pulled out once via an explicit assignment before it can
  // be used here to revive a value into that realm.
  let hostJson; // assigned once runBackgroundScript returns and bind() runs
  // background.js's own top-level migration check calls get() synchronously
  // during script evaluation, before there is a context to bind — it only
  // inspects Array.isArray/key presence, so the raw (outer-realm) value is
  // fine there. Every later call, once bound, gets the realm-correct revival
  // isPlainObject-based storage-schema code needs.
  const reviveInContext = (value) => (hostJson ? hostJson.parse(JSON.stringify(value)) : value);
  const chrome = {
    storage: {
      local: {
        get: (keys) => {
          let raw;
          if (Array.isArray(keys)) {
            raw = {};
            for (const key of keys) if (Object.prototype.hasOwnProperty.call(store, key)) raw[key] = store[key];
          } else if (typeof keys === 'string') {
            raw = Object.prototype.hasOwnProperty.call(store, keys) ? { [keys]: store[keys] } : {};
          } else {
            raw = { ...store };
          }
          return Promise.resolve(reviveInContext(raw));
        }
      }
    },
    runtime: { onMessage: { addListener: (fn) => listeners.push(fn) } }
  };
  return {
    chrome,
    listeners,
    bind: (ctx) => {
      runInContext('globalThis.__hostJSON = JSON;', ctx);
      hostJson = ctx.__hostJSON;
    }
  };
}

function sendMessage(listeners, message) {
  return new Promise((resolveResponse) => {
    for (const listener of listeners) {
      const keepAlive = listener(message, {}, resolveResponse);
      if (keepAlive) return;
    }
  });
}

function fakeFetch(capture, replyTheme) {
  return async (url, init) => {
    capture.url = url;
    capture.body = JSON.parse(init.body);
    return {
      ok: true,
      status: 200,
      json: async () => ({ content: [{ type: 'text', text: JSON.stringify(replyTheme) }] })
    };
  };
}

const REPLY = {
  reply: 'Kept your photo and added frosted glass.',
  themeChanged: true,
  theme: {
    themeName: 'Kept Photo',
    rationale: 'Reused the current wallpaper.',
    wallpaperImage: {
      use: true, index: 1, fit: 'cover', fixed: true,
      lightOpacity: 50, lightBlur: 0, darkOpacity: 40, darkBlur: 0,
      brightness: 100, contrast: 100, grayscale: 0, hue: 0, invert: 0
    },
    light: { angle: 135, stops: [{ color: '#000000', position: 0 }, { color: '#ffffff', position: 100 }], opacity: 100, blur: 0 },
    dark: { angle: 135, stops: [{ color: '#000000', position: 0 }, { color: '#ffffff', position: 100 }], opacity: 100, blur: 0 },
    frostedGlass: [{ selector: '#main-panel', opacity: 70, blur: 14 }]
  }
};

test('the site\'s current background image is offered to the model and can be kept', async () => {
  const store = {
    [AI_CONFIG_KEY]: { provider: 'anthropic', apiKey: 'test-key', model: 'claude-opus-5' },
    'example.com': {
      type: 'image', mode: 'auto', value: DATA_URL, opacity: 50, blur: 0,
      style: { fixed: true, size: 'cover', repeat: false },
      light: { type: 'image', value: DATA_URL, opacity: 50, blur: 0, style: { fixed: true, size: 'cover', repeat: false } },
      dark: { type: 'image', value: DATA_URL, opacity: 40, blur: 0, style: { fixed: true, size: 'cover', repeat: false } }
    }
  };
  const { chrome, listeners, bind } = chromeMock(store);
  const capture = {};
  bind(runBackgroundScript({ chrome, console, fetch: fakeFetch(capture, REPLY) }));

  const response = await sendMessage(listeners, {
    action: 'pagedyeAiChat',
    profile: SAMPLE_PROFILE,
    turns: [{ role: 'user', content: 'keep this photo but add frosted glass over the main panel' }]
  });

  assert.equal(response.ok, true, response.error);

  // The request sent to the model carried the current background as a
  // numbered, labeled picture.
  const promptBlocks = capture.body.messages[0].content;
  assert.ok(Array.isArray(promptBlocks), 'a picture was offered, so the message is blocks, not a bare string');
  assert.ok(promptBlocks.some((block) => block.type === 'text' && /CURRENT background/.test(block.text)));
  assert.ok(promptBlocks.some((block) => block.type === 'image' && block.source.data === 'iVBORw0KGgo='));

  // wallpaperImage.index === 1 resolved to that same picture, not a picture
  // the model was never actually shown.
  assert.equal(response.settings.type, 'image');
  assert.equal(response.settings.value, DATA_URL);
  assert.equal(response.settings.frostedGlass[0].selector, '#main-panel');
});

test('a site with no image background offers nothing extra to the model', async () => {
  const store = {
    [AI_CONFIG_KEY]: { provider: 'anthropic', apiKey: 'test-key', model: 'claude-opus-5' },
    'example.com': { type: 'color', mode: 'single', value: '#ffffff', opacity: 100, blur: 0 }
  };
  const { chrome, listeners, bind } = chromeMock(store);
  const capture = {};
  bind(runBackgroundScript({ chrome, console, fetch: fakeFetch(capture, REPLY) }));

  const response = await sendMessage(listeners, {
    action: 'pagedyeAiChat',
    profile: SAMPLE_PROFILE,
    turns: [{ role: 'user', content: 'something calm' }]
  });

  assert.equal(response.ok, true, response.error);
  const promptBlocks = capture.body.messages[0].content;
  assert.equal(typeof promptBlocks, 'string', 'no picture to attach means a plain string message, not blocks');
});

test('a storage lookup failure costs the model one picture, not the whole turn', async () => {
  const listeners = [];
  const chrome = {
    storage: {
      local: {
        get: (keys) => {
          if (Array.isArray(keys) && keys.includes('example.com')) return Promise.reject(new Error('boom'));
          return Promise.resolve({ [AI_CONFIG_KEY]: { provider: 'anthropic', apiKey: 'test-key', model: 'claude-opus-5' } });
        }
      }
    },
    runtime: { onMessage: { addListener: (fn) => listeners.push(fn) } }
  };
  const capture = {};
  runBackgroundScript({ chrome, console, fetch: fakeFetch(capture, REPLY) });

  const response = await sendMessage(listeners, {
    action: 'pagedyeAiChat',
    profile: SAMPLE_PROFILE,
    turns: [{ role: 'user', content: 'something calm' }]
  });

  assert.equal(response.ok, true, response.error);
});
