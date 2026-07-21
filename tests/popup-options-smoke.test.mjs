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
