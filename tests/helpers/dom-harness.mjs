// Shared test harness for booting the real popup.html / options.html (with their
// real, unmodified scripts) inside jsdom, backed by an in-memory chrome.* mock.
// Used to smoke-test that the extension pages still load and can complete a save
// round-trip after refactors that move code between files.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import jsdomPkg from 'jsdom';

const { JSDOM, ResourceLoader } = jsdomPkg;

export const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));

// Creates an isolated in-memory chrome.storage.local + chrome.tabs/scripting/runtime
// mock. Each call returns a fresh store so tests don't leak state into each other.
export function createChromeMock({ initialStorage = {}, tab = { id: 1, url: 'https://example.com/', active: true }, onMessage } = {}) {
  const store = { ...initialStorage };
  const changeListeners = [];
  const calls = { tabsSendMessage: [], scriptingExecuteScript: [], runtimeSendMessage: [] };

  function fireChanged(changes) {
    if (Object.keys(changes).length === 0) return;
    for (const listener of changeListeners) listener(changes, 'local');
  }

  const local = {
    async get(keys) {
      if (keys == null) return { ...store };
      if (typeof keys === 'string') {
        return Object.prototype.hasOwnProperty.call(store, keys) ? { [keys]: store[keys] } : {};
      }
      if (Array.isArray(keys)) {
        const out = {};
        for (const k of keys) if (Object.prototype.hasOwnProperty.call(store, k)) out[k] = store[k];
        return out;
      }
      if (typeof keys === 'object') {
        const out = {};
        for (const k of Object.keys(keys)) out[k] = Object.prototype.hasOwnProperty.call(store, k) ? store[k] : keys[k];
        return out;
      }
      return {};
    },
    async set(obj) {
      const changes = {};
      for (const [k, v] of Object.entries(obj)) {
        changes[k] = { oldValue: store[k], newValue: v };
        store[k] = v;
      }
      fireChanged(changes);
    },
    async remove(keys) {
      const arr = Array.isArray(keys) ? keys : [keys];
      const changes = {};
      for (const k of arr) {
        if (Object.prototype.hasOwnProperty.call(store, k)) {
          changes[k] = { oldValue: store[k], newValue: undefined };
          delete store[k];
        }
      }
      fireChanged(changes);
    },
    async clear() {
      const changes = {};
      for (const [k, v] of Object.entries(store)) {
        changes[k] = { oldValue: v, newValue: undefined };
        delete store[k];
      }
      fireChanged(changes);
    }
  };

  const chrome = {
    storage: {
      local,
      onChanged: {
        addListener: (fn) => changeListeners.push(fn),
        removeListener: (fn) => {
          const i = changeListeners.indexOf(fn);
          if (i >= 0) changeListeners.splice(i, 1);
        }
      }
    },
    runtime: {
      id: 'pagedye-test',
      getManifest: () => ({ version: '0.0.0-test' }),
      onMessage: { addListener() {}, removeListener() {} },
      async sendMessage(message) {
        calls.runtimeSendMessage.push(message);
        if (onMessage) return onMessage(message);
        return {};
      }
    },
    tabs: {
      async query() { return tab ? [tab] : []; },
      async sendMessage(tabId, message) {
        calls.tabsSendMessage.push({ tabId, message });
        return { ok: true };
      }
    },
    scripting: {
      async executeScript(opts) {
        calls.scriptingExecuteScript.push(opts);
        return [];
      }
    }
  };

  return { chrome, store, calls, fireChanged };
}

// Intercepts fetches for the given page's own script (by absolute file suffix)
// and rewrites its source before jsdom executes it. Used only for debugging;
// pass patchSource: null for a faithful, unmodified load.
class PatchingLoader extends ResourceLoader {
  constructor(patches) {
    super();
    this.patches = patches || [];
  }
  fetch(url, options) {
    for (const { suffix, transform } of this.patches) {
      if (url.endsWith(suffix)) {
        const filePath = fileURLToPath(url);
        const src = readFileSync(filePath, 'utf8');
        return Promise.resolve(Buffer.from(transform(src), 'utf8'));
      }
    }
    return super.fetch(url, options);
  }
}

function installPolyfills(window, { prefersDark = false } = {}) {
  const store = new Map();
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
      clear: () => store.clear()
    }
  });
  window.matchMedia = (query) => ({
    matches: query.includes('prefers-color-scheme: dark') ? prefersDark : false,
    media: query,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() { return true; }
  });
}

// Loads an extension page (e.g. 'popup/popup.html') with its real scripts executing
// against the given chrome mock. Resolves once the window 'load' event fires and a
// short settle delay has passed (covers the page's own async DOMContentLoaded init).
export async function loadExtensionPage(relHtmlPath, { chrome, patches = [], settleMs = 250, prefersDark = false } = {}) {
  const htmlPath = resolve(root, relHtmlPath);
  const html = readFileSync(htmlPath, 'utf8');
  const errors = [];
  const dom = new JSDOM(html, {
    url: pathToFileURL(htmlPath).href,
    runScripts: 'dangerously',
    resources: new PatchingLoader(patches),
    pretendToBeVisual: true,
    beforeParse(window) {
      installPolyfills(window, { prefersDark });
      // Real chrome.storage.local.get() always hands back plain objects
      // freshly deserialized in the CALLING page's own realm -- there's no
      // such thing as "the wrong realm" in a real browser. Our mock's store
      // lives in this test file's (outer, non-jsdom) realm though, so a
      // value seeded via createChromeMock's initialStorage would otherwise
      // come back with THIS module's Object.prototype, not the jsdom
      // window's -- which fails storage-schema.js's isPlainObject() (a
      // strict `Object.getPrototypeOf(v) === Object.prototype` check) purely
      // on cross-realm identity, not any real difference in shape. Round-
      // tripping through the window's OWN JSON re-creates the object using
      // that window's realm, matching real chrome.storage fidelity.
      window.chrome = {
        ...chrome,
        storage: {
          ...chrome.storage,
          local: {
            ...chrome.storage.local,
            async get(keys) {
              const result = await chrome.storage.local.get(keys);
              return window.JSON.parse(window.JSON.stringify(result));
            }
          }
        }
      };
    }
  });

  dom.window.addEventListener('error', (e) => {
    errors.push((e && e.error) || e.message || e);
  });

  await new Promise((resolvePromise, reject) => {
    const timeout = setTimeout(() => reject(new Error(`timed out loading ${relHtmlPath}`)), 10000);
    dom.window.addEventListener('load', () => { clearTimeout(timeout); resolvePromise(); });
  });
  await new Promise((r) => setTimeout(r, settleMs));

  return { dom, window: dom.window, document: dom.window.document, errors };
}

export async function waitFor(conditionFn, { timeout = 2000, interval = 20 } = {}) {
  const start = Date.now();
  for (;;) {
    const value = conditionFn();
    if (value) return value;
    if (Date.now() - start > timeout) throw new Error('waitFor: timed out');
    await new Promise((r) => setTimeout(r, interval));
  }
}
