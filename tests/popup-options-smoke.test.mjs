// Regression safety net for the popup.js / options.js refactor. These tests boot
// the real, unmodified extension pages inside jsdom (see tests/helpers/dom-harness.mjs)
// against an in-memory chrome.storage mock, and drive representative user
// interactions end to end. They exist to catch "forgot to update a call site" /
// "moved this DOM lookup and now it throws" mistakes that plain source-text regex
// tests (the bulk of tests/extension.test.mjs) cannot catch, before the popup/options
// shared-code extraction, CSS consolidation, and storage-serialization phases.
import assert from 'node:assert/strict';
import test from 'node:test';
import jsdomPkg from 'jsdom';
import { createChromeMock, loadExtensionPage, waitFor } from './helpers/dom-harness.mjs';

const { JSDOM } = jsdomPkg;

function fire(el, type) {
  el.dispatchEvent(new el.ownerDocument.defaultView.Event(type, { bubbles: true }));
}

test('popup.html boots with no uncaught errors and resolves the active tab domain', async () => {
  const { chrome } = createChromeMock();
  const { document, errors } = await loadExtensionPage('popup/popup.html', { chrome });
  assert.deepEqual(errors, []);
  assert.equal(document.getElementById('current-domain').textContent, 'example.com');
});

test('popup: switching background type to color and picking a color saves to the site key', async () => {
  const { chrome, store } = createChromeMock();
  const { document, errors } = await loadExtensionPage('popup/popup.html', { chrome });
  assert.deepEqual(errors, []);

  const typeColor = document.getElementById('type-color');
  typeColor.checked = true;
  fire(typeColor, 'change');

  await waitFor(() => store['example.com'] && store['example.com'].type === 'color');

  const colorPicker = document.getElementById('color-picker');
  colorPicker.value = '#ff00aa';
  fire(colorPicker, 'input');

  await waitFor(() => store['example.com'] && store['example.com'].value === '#ff00aa', { timeout: 2000 });

  assert.equal(store['example.com'].type, 'color');
  assert.equal(store['example.com'].value, '#ff00aa');
});

test('popup: rapid successive color edits debounce into one trailing save with the final value', async () => {
  const { chrome, store } = createChromeMock();
  const { document, errors } = await loadExtensionPage('popup/popup.html', { chrome });
  assert.deepEqual(errors, []);

  const typeColor = document.getElementById('type-color');
  typeColor.checked = true;
  fire(typeColor, 'change');
  await waitFor(() => store['example.com'] && store['example.com'].type === 'color');

  const colorPicker = document.getElementById('color-picker');
  const setCallsBefore = () => JSON.stringify(store['example.com']);
  colorPicker.value = '#111111';
  fire(colorPicker, 'input');
  colorPicker.value = '#222222';
  fire(colorPicker, 'input');
  colorPicker.value = '#333333';
  fire(colorPicker, 'input');

  // Immediately after firing, the debounce (400ms) should not have saved yet.
  await new Promise((r) => setTimeout(r, 50));
  assert.notEqual(store['example.com'].value, '#333333', 'debounce should not have fired yet');

  await waitFor(() => store['example.com'].value === '#333333', { timeout: 2000 });
  assert.equal(store['example.com'].value, '#333333', 'only the last debounced value should be persisted');
});

test('popup: a site-specific background can always switch to and edit the global default', async () => {
  const { chrome, store } = createChromeMock({
    initialStorage: {
      'example.com': { type: 'color', value: '#112233', opacity: 100, blur: 0, style: { fixed: true, size: 'cover', repeat: false } },
      __pagedye_default_background__: { type: 'color', value: '#445566', opacity: 100, blur: 0, style: { fixed: true, size: 'cover', repeat: false } }
    }
  });
  const { document, errors } = await loadExtensionPage('popup/popup.html', { chrome });
  assert.deepEqual(errors, []);

  const defaultTarget = document.getElementById('target-default');
  defaultTarget.checked = true;
  fire(defaultTarget, 'change');
  await waitFor(() => document.getElementById('color-picker').value === '#445566');
  assert.equal(store['example.com'], undefined, 'switching to the default must remove the site override');

  const colorPicker = document.getElementById('color-picker');
  colorPicker.value = '#abcdef';
  fire(colorPicker, 'input');
  await waitFor(() => store.__pagedye_default_background__.value === '#abcdef');
  assert.equal(store['example.com'], undefined);
});

test('popup: auto mode edits the currently active dark scheme and replacing a standalone effect disables it', async () => {
  const { chrome, store } = createChromeMock({
    initialStorage: {
      'example.com': {
        mode: 'auto',
        type: 'none',
        value: '',
        opacity: 100,
        blur: 0,
        style: { fixed: true, size: 'cover', repeat: false },
        light: { type: 'image', value: 'data:image/png;base64,light-image', effectEnabled: false, opacity: 100, blur: 0, style: { fixed: true, size: 'cover', repeat: false } },
        dark: { type: 'none', value: '', effectEnabled: true, effect: 'waves', opacity: 100, blur: 0, style: { fixed: true, size: 'cover', repeat: false } }
      }
    }
  });
  const { document, errors } = await loadExtensionPage('popup/popup.html', { chrome, prefersDark: true });
  assert.deepEqual(errors, []);

  assert.ok(document.getElementById('card-scheme-dark').classList.contains('active'));
  assert.equal(document.getElementById('style-facade-effect').checked, true);

  const imageFacade = document.getElementById('style-facade-image');
  imageFacade.checked = true;
  fire(imageFacade, 'change');

  await waitFor(() => store['example.com'].dark.type === 'image' && store['example.com'].dark.effectEnabled === false);
  assert.equal(store['example.com'].light.type, 'image', 'the inactive light scheme must remain untouched');
});

test('popup: text editor injects its in-page picker into the active tab', async () => {
  const { chrome, calls } = createChromeMock();
  const { document, errors } = await loadExtensionPage('popup/popup.html', { chrome });
  assert.deepEqual(errors, []);

  fire(document.getElementById('text-editor-start-btn'), 'click');
  await waitFor(() => calls.scriptingExecuteScript.some((call) => call.func && call.func.name === 'pagedyeTextPicker'));

  assert.ok(calls.tabsSendMessage.some((call) => call.message.action === 'pagedyePing'));
});

test('in-page text picker highlights, edits, and persists text without reloading', async () => {
  const { chrome, calls } = createChromeMock();
  const { document } = await loadExtensionPage('popup/popup.html', { chrome });
  fire(document.getElementById('text-editor-start-btn'), 'click');
  const injection = await waitFor(() => calls.scriptingExecuteScript.find((call) => call.func && call.func.name === 'pagedyeTextPicker'));

  const page = new JSDOM('<!doctype html><html><body><p id="copy">Original text</p></body></html>', {
    url: 'https://example.com/article#comments',
    runScripts: 'dangerously',
    pretendToBeVisual: true
  });
  const stored = {};
  page.window.chrome = {
    storage: { local: {
      get(key, callback) {
        const result = { [key]: stored[key] };
        if (callback) callback(result);
        return Promise.resolve(result);
      },
      set(value, callback) {
        Object.assign(stored, value);
        if (callback) callback();
        return Promise.resolve();
      }
    } }
  };
  const text = page.window.document.getElementById('copy');
  page.window.document.elementFromPoint = () => text;
  page.window.eval(`(${injection.func.toString()})(...${JSON.stringify(injection.args)})`);

  assert.ok(Array.from(page.window.document.documentElement.children).some((element) => element.textContent.includes('hover text')));
  text.dispatchEvent(new page.window.MouseEvent('click', { bubbles: true, clientX: 10, clientY: 10 }));
  const input = page.window.document.querySelector('textarea');
  assert.ok(input, 'clicking text opens the editor input');
  input.value = 'Updated text';
  fire(input, 'input');
  assert.equal(text.textContent, 'Updated text');
  Array.from(page.window.document.querySelectorAll('button')).find((button) => button.textContent === 'Save').click();
  await waitFor(() => stored.__pagedye_text_overrides_v1__);

  assert.deepEqual(JSON.parse(JSON.stringify(stored.__pagedye_text_overrides_v1__['https://example.com/article'].entries)), [
    { selector: '#copy', text: 'Updated text' }
  ]);
});

test('options.html boots with no uncaught errors', async () => {
  const { chrome } = createChromeMock({ tab: null });
  const { document, errors } = await loadExtensionPage('options/options.html', { chrome });
  assert.deepEqual(errors, []);
  assert.ok(document.querySelector('.dashboard-container'));
});

test('options: picking an accent color in Appearance debounce-saves the UI theme', async () => {
  const { chrome, store } = createChromeMock({ tab: null });
  const { document, errors } = await loadExtensionPage('options/options.html', { chrome });
  assert.deepEqual(errors, []);

  const blueDot = document.querySelector('.theme-color-dot[data-theme-accent="blue"]');
  assert.ok(blueDot, 'blue accent dot should exist');
  fire(blueDot, 'click');

  await waitFor(() => store.__pagedye_ui_theme__ && store.__pagedye_ui_theme__.accent === 'blue', { timeout: 2000 });
  assert.equal(store.__pagedye_ui_theme__.accent, 'blue');
});

test('options: auto-mode editor opens the scheme currently used by the system', async () => {
  const autoSettings = {
    mode: 'auto',
    type: 'none',
    value: '',
    opacity: 100,
    blur: 0,
    style: { fixed: true, size: 'cover', repeat: false },
    light: { type: 'image', value: 'data:image/png;base64,light-image', opacity: 100, blur: 0, style: { fixed: true, size: 'cover', repeat: false } },
    dark: { type: 'effect', effect: 'waves', opacity: 100, blur: 0, style: { fixed: true, size: 'cover', repeat: false } }
  };
  const { chrome, store } = createChromeMock({ initialStorage: { 'example.com': autoSettings }, tab: null });
  const { document, errors } = await loadExtensionPage('options/options.html', { chrome, prefersDark: true });
  assert.deepEqual(errors, []);

  const siteLink = Array.from(document.querySelectorAll('.domain-edit-link')).find((link) => link.textContent === 'example.com');
  assert.ok(siteLink);
  fire(siteLink, 'click');

  await waitFor(() => document.getElementById('section-edit-site').classList.contains('active') &&
    document.getElementById('edit-card-scheme-dark').classList.contains('active'));
  assert.equal(document.getElementById('edit-type-effect').checked, true);

  const imageFacade = document.getElementById('edit-style-facade-image');
  imageFacade.checked = true;
  fire(imageFacade, 'change');

  await waitFor(() => !document.getElementById('edit-section-image').classList.contains('hidden') &&
    store['example.com'].dark.type === 'image');
  assert.equal(document.getElementById('edit-type-image').checked, true);
  assert.equal(document.getElementById('edit-section-effects').classList.contains('hidden'), true);
});

test('options: site editor exposes a top-level switch to edit the global default', async () => {
  const siteSettings = { type: 'color', value: '#112233', opacity: 100, blur: 0, style: { fixed: true, size: 'cover', repeat: false } };
  const defaultSettings = { type: 'color', value: '#445566', opacity: 100, blur: 0, style: { fixed: true, size: 'cover', repeat: false } };
  const { chrome, store } = createChromeMock({
    initialStorage: { 'example.com': siteSettings, __pagedye_default_background__: defaultSettings },
    tab: null
  });
  const { document, errors } = await loadExtensionPage('options/options.html', { chrome });
  assert.deepEqual(errors, []);

  const siteLink = Array.from(document.querySelectorAll('.domain-edit-link')).find((link) => link.textContent === 'example.com');
  fire(siteLink, 'click');
  await waitFor(() => !document.getElementById('edit-target-tabs').classList.contains('hidden'));

  const defaultTarget = document.getElementById('edit-target-default');
  defaultTarget.checked = true;
  fire(defaultTarget, 'change');
  await waitFor(() => document.getElementById('edit-color-picker').value === '#445566');
  assert.equal(store['example.com'], undefined, 'the site must now inherit the global default');

  const colorPicker = document.getElementById('edit-color-picker');
  colorPicker.value = '#abcdef';
  fire(colorPicker, 'input');
  await waitFor(() => store.__pagedye_default_background__.value === '#abcdef');
  assert.equal(store['example.com'], undefined);
});

test('options: clearing local data removes default backgrounds, images, and preferences', async () => {
  const { chrome, store } = createChromeMock({
    tab: null,
    initialStorage: {
      'example.com': { type: 'image', value: 'data:image/png;base64,stored-image' },
      __pagedye_default_background__: { type: 'image', value: 'data:image/png;base64,default-image' },
      __pagedye_custom_effects__: [{ id: 'effect-1', name: 'Stored effect', type: 'code', code: 'return;' }],
      __pagedye_ui_theme__: { accent: 'blue' }
    }
  });
  const { document, window, errors } = await loadExtensionPage('options/options.html', { chrome });
  assert.deepEqual(errors, []);

  window.localStorage.setItem('pagedye_last_popup_tab', 'effects');
  fire(document.getElementById('clear-all-btn'), 'click');
  await waitFor(() => document.getElementById('confirm-modal').classList.contains('active'));
  fire(document.getElementById('confirm-modal-ok'), 'click');

  await waitFor(() => Object.keys(store).length === 0);
  assert.equal(window.localStorage.getItem('pagedye_last_popup_tab'), null);
});
