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

test('popup: a frosted panel can take its tint from the wallpaper, and says so when it cannot', async () => {
  // todo #7's second half. The derivation lives in scripts/gradient.js; what
  // this covers is the wiring around it — that the button reaches the form the
  // user is actually looking at, and that the result lands in both the picker
  // and storage.
  const { chrome, store } = createChromeMock();
  const { document, errors } = await loadExtensionPage('popup/popup.html', { chrome });
  assert.deepEqual(errors, []);

  const typeColor = document.getElementById('type-color');
  typeColor.checked = true;
  fire(typeColor, 'change');
  const colorPicker = document.getElementById('color-picker');
  colorPicker.value = '#10233f';
  fire(colorPicker, 'input');
  await waitFor(() => store['example.com'] && store['example.com'].value === '#10233f', { timeout: 2000 });

  document.getElementById('frosted-add-btn').click();
  const tintBtn = document.querySelector('.frosted-entry-tint');
  assert.ok(tintBtn, 'every frosted entry offers to take a tint from the wallpaper');

  tintBtn.click();
  await waitFor(() => {
    const entry = (store['example.com'] || {}).frostedGlass;
    return entry && entry[0] && entry[0].color;
  }, { timeout: 2000 });

  const tint = store['example.com'].frostedGlass[0].color;
  // A dark navy wallpaper gets a dark tint that keeps its hue — the panel has
  // to commit to one color for both OS schemes, so it follows the wallpaper.
  assert.match(tint, /^#[0-9a-f]{6}$/);
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(tint.slice(i, i + 2), 16));
  assert.ok(Math.max(r, g, b) < 80, `expected a dark tint, got ${tint}`);
  assert.ok(b > r, `expected the wallpaper's blue to survive, got ${tint}`);
  assert.equal(document.querySelector('.frosted-entry-color').value, tint, 'the picker shows it for editing');

  // A background of "none" has no palette to sample, and that has to be said
  // rather than silently leaving the old tint in place. Every status the line
  // shows is recorded rather than polled: an autosave toast from the type
  // change lands on the same element and would race the assertion.
  const statusEl = document.getElementById('status-text');
  const seen = [];
  new document.defaultView.MutationObserver(() => seen.push(statusEl.textContent))
    .observe(statusEl, { childList: true, characterData: true, subtree: true });

  const typeNone = document.getElementById('type-none');
  typeNone.checked = true;
  fire(typeNone, 'change');
  document.querySelector('.frosted-entry-tint').click();
  await waitFor(() => seen.some((text) => /no color/i.test(text)), { timeout: 2000 });
});

test('popup: switching to video type shows the video panel and persists type:video to the site key', async () => {
  // prepareVideo() needs real video decoding, which jsdom doesn't implement,
  // so this exercises the radio -> panel -> collectFormTo -> save wiring
  // (the part hand-written for this feature and at risk of a typo/mismatched
  // element id) without going through an actual file upload.
  const { chrome, store } = createChromeMock();
  const { document, errors } = await loadExtensionPage('popup/popup.html', { chrome });
  assert.deepEqual(errors, []);

  const typeVideo = document.getElementById('type-video');
  assert.ok(typeVideo, 'type-video radio should exist in the real bgType segmented control');
  typeVideo.checked = true;
  fire(typeVideo, 'change');

  await waitFor(() => store['example.com'] && store['example.com'].type === 'video');
  assert.equal(store['example.com'].type, 'video');

  assert.equal(document.getElementById('section-video').classList.contains('inactive'), false);
  assert.equal(document.getElementById('section-image').classList.contains('inactive'), true);
  assert.equal(document.getElementById('image-repeat-row').classList.contains('hidden'), true, 'Repeat has no meaning for a looping video');
});

test('popup: Reset clears the active target, and only after confirmation', async () => {
  const { chrome, store } = createChromeMock({
    initialStorage: {
      'example.com': { type: 'color', value: '#112233', opacity: 100, blur: 0, style: { fixed: true, size: 'cover', repeat: false } }
    }
  });
  const { document, window, errors } = await loadExtensionPage('popup/popup.html', { chrome });
  assert.deepEqual(errors, []);

  const clearBtn = document.getElementById('reset-btn');
  assert.ok(clearBtn, 'Reset is the single entry point for clearing a target');
  assert.equal(document.getElementById('clear-current-btn'), null, 'its duplicate must not come back');

  let confirmMessage = null;
  window.confirm = (msg) => { confirmMessage = msg; return false; };
  fire(clearBtn, 'click');
  await new Promise((r) => setTimeout(r, 50));
  assert.ok(confirmMessage, 'clicking must prompt for confirmation before clearing anything');
  assert.equal(store['example.com'].type, 'color', 'declining the confirmation must leave the config untouched');

  window.confirm = () => true;
  fire(clearBtn, 'click');
  await waitFor(() => store['example.com'] && store['example.com'].type === 'none');
  assert.equal(document.getElementById('type-none').checked, true);
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

test('popup: a site-specific background can always switch to and edit the global default, without losing the site override', async () => {
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
  assert.equal(store['example.com'].value, '#112233', 'merely viewing the default tab must not delete the site override');

  const colorPicker = document.getElementById('color-picker');
  colorPicker.value = '#abcdef';
  fire(colorPicker, 'input');
  await waitFor(() => store.__pagedye_default_background__.value === '#abcdef');
  assert.equal(store['example.com'].value, '#112233', 'editing the default must not touch the untouched site override');

  const siteTarget = document.getElementById('target-site');
  siteTarget.checked = true;
  fire(siteTarget, 'change');
  await waitFor(() => document.getElementById('color-picker').value === '#112233');
  assert.equal(store['example.com'].value, '#112233', 'switching back to the site tab must restore its own settings, not a blank slate');
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

test('options: switching to video type shows the video panel, hides Repeat, and persists type:video', async () => {
  const { chrome, store } = createChromeMock({
    initialStorage: { 'example.com': { type: 'color', value: '#112233', opacity: 100, blur: 0, style: { fixed: true, size: 'cover', repeat: false } } },
    tab: null
  });
  const { document, errors } = await loadExtensionPage('options/options.html', { chrome });
  assert.deepEqual(errors, []);

  const siteLink = Array.from(document.querySelectorAll('.domain-edit-link')).find((link) => link.textContent === 'example.com');
  assert.ok(siteLink);
  fire(siteLink, 'click');
  // Wait for the form to actually finish loading the site's settings, not
  // just for the section to become visible -- openEditSite() is async, and
  // the 'active' class can toggle before currentEditSettings is populated.
  await waitFor(() => document.getElementById('section-edit-site').classList.contains('active') &&
    document.getElementById('edit-type-color').checked === true);

  const videoFacade = document.getElementById('edit-style-facade-video');
  assert.ok(videoFacade, 'edit-style-facade-video should exist in the facade control');
  videoFacade.checked = true;
  fire(videoFacade, 'change');

  await waitFor(() => store['example.com'] && store['example.com'].type === 'video');
  assert.equal(document.getElementById('edit-type-video').checked, true);
  assert.equal(document.getElementById('edit-section-video').classList.contains('hidden'), false);
  assert.equal(document.getElementById('edit-section-color').classList.contains('hidden'), true);
  assert.equal(document.getElementById('edit-image-repeat-row').classList.contains('hidden'), true);
});

test('options: site editor exposes a top-level switch to edit the global default, without losing the site override', async () => {
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
  assert.equal(store['example.com'].value, '#112233', 'merely viewing the default tab must not delete the site override');

  const colorPicker = document.getElementById('edit-color-picker');
  colorPicker.value = '#abcdef';
  fire(colorPicker, 'input');
  await waitFor(() => store.__pagedye_default_background__.value === '#abcdef');
  assert.equal(store['example.com'].value, '#112233', 'editing the default must not touch the untouched site override');

  const siteTarget = document.getElementById('edit-target-site');
  siteTarget.checked = true;
  fire(siteTarget, 'change');
  await waitFor(() => document.getElementById('edit-color-picker').value === '#112233');
  assert.equal(store['example.com'].value, '#112233', 'switching back to the site tab must restore its own settings, not a blank slate');
});

test('options: the mobile sidebar drawer opens, closes on backdrop click, and closes on nav click', async () => {
  const { chrome } = createChromeMock({ tab: null });
  const { document, errors } = await loadExtensionPage('options/options.html', { chrome });
  assert.deepEqual(errors, []);

  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  const toggle = document.getElementById('mobile-nav-toggle');
  const closeBtn = document.getElementById('sidebar-close-btn');
  assert.ok(sidebar && backdrop && toggle && closeBtn, 'mobile drawer controls should exist');

  fire(toggle, 'click');
  assert.ok(sidebar.classList.contains('mobile-open'), 'toggle must open the drawer');
  assert.ok(backdrop.classList.contains('visible'), 'toggle must reveal the backdrop');
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');

  fire(closeBtn, 'click');
  assert.ok(!sidebar.classList.contains('mobile-open'), 'the close button must close the drawer');
  assert.ok(!backdrop.classList.contains('visible'));

  fire(toggle, 'click');
  fire(backdrop, 'click');
  assert.ok(!sidebar.classList.contains('mobile-open'), 'clicking the backdrop must close the drawer');

  fire(toggle, 'click');
  const settingsNav = document.querySelector('.nav-item[data-target="section-settings"]');
  fire(settingsNav, 'click');
  assert.ok(!sidebar.classList.contains('mobile-open'), 'picking a section must close the drawer');
  assert.ok(document.getElementById('section-settings').classList.contains('active'));
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
