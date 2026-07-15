// Regression safety net for the popup.js / options.js refactor. These tests boot
// the real, unmodified extension pages inside jsdom (see tests/helpers/dom-harness.mjs)
// against an in-memory chrome.storage mock, and drive representative user
// interactions end to end. They exist to catch "forgot to update a call site" /
// "moved this DOM lookup and now it throws" mistakes that plain source-text regex
// tests (the bulk of tests/extension.test.mjs) cannot catch, before the popup/options
// shared-code extraction, CSS consolidation, and storage-serialization phases.
import assert from 'node:assert/strict';
import test from 'node:test';
import { createChromeMock, loadExtensionPage, waitFor } from './helpers/dom-harness.mjs';

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
