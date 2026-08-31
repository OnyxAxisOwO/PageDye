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

test('popup: an unreadable frosted panel is called out, and a fixed one stops being', async () => {
  // The math is covered in tests/readability.test.mjs. What this covers is the
  // wiring: that the popup captures the page's text colors, feeds them the
  // wallpaper the user is actually editing, and puts the result on screen.
  const { chrome, store } = createChromeMock();
  chrome.scripting.executeScript = async (opts) => (opts.func ? [{
    result: {
      base: { backgroundColor: '#ffffff', textColor: '#1f2328' },
      containers: [{ selector: '#main', textColor: '#1f2328', coverage: 0.5, matchCount: 1 }]
    }
  }] : []);

  const { document, errors } = await loadExtensionPage('popup/popup.html', { chrome });
  assert.deepEqual(errors, []);

  // A near-black wallpaper behind a barely-there panel holding near-black text.
  const typeColor = document.getElementById('type-color');
  typeColor.checked = true;
  fire(typeColor, 'change');
  const colorPicker = document.getElementById('color-picker');
  colorPicker.value = '#101820';
  fire(colorPicker, 'input');
  await waitFor(() => store['example.com'] && store['example.com'].value === '#101820', { timeout: 2000 });

  document.getElementById('frosted-add-btn').click();
  const selector = document.querySelector('.frosted-entry-selector');
  selector.value = '#main';
  fire(selector, 'input');
  const opacity = document.querySelector('.frosted-entry-opacity');
  opacity.value = '20';
  fire(opacity, 'input');

  const box = document.getElementById('frosted-contrast');
  await waitFor(() => !box.hidden && /#main/.test(box.textContent), { timeout: 3000 });
  assert.match(box.textContent, /invisible|1\.\d:1|2\.\d:1/, box.textContent);
  assert.ok(box.classList.contains('severe'), 'unreadable is not merely imperfect');

  // Turning the panel almost solid white is the fix, and the warning has to
  // clear — a check that only ever accuses is one users learn to ignore.
  const colorToggle = document.querySelector('.frosted-entry-color-toggle');
  colorToggle.checked = true;
  fire(colorToggle, 'input');
  const colorInput = document.querySelector('.frosted-entry-color');
  colorInput.value = '#ffffff';
  fire(colorInput, 'input');
  document.querySelector('.frosted-entry-opacity').value = '96';
  fire(document.querySelector('.frosted-entry-opacity'), 'input');

  await waitFor(() => box.hidden, { timeout: 3000 });
});

test('popup: a page the extension cannot read simply offers no contrast check', async () => {
  // executeScript resolving to nothing is what a store page, a PDF or a tab
  // that navigated mid-capture looks like. It must not throw, and must not
  // produce a warning built on colors nobody supplied.
  const { chrome, store } = createChromeMock();
  const { document, errors } = await loadExtensionPage('popup/popup.html', { chrome });

  document.getElementById('frosted-add-btn').click();
  const selector = document.querySelector('.frosted-entry-selector');
  selector.value = '#main';
  fire(selector, 'input');
  await waitFor(() => store['example.com'] && store['example.com'].frostedGlass, { timeout: 2000 });
  await new Promise((r) => setTimeout(r, 500));

  assert.deepEqual(errors, []);
  assert.equal(document.getElementById('frosted-contrast').hidden, true);
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

test('popup: in Light/Dark mode the scheme thumbnail repaints on the edit, not on the save', async () => {
  // The thumbnails used to render straight out of currentSettings, which only
  // receives the form at save time — so picking a background left the card
  // showing the previous one until something else forced a repaint.
  const style = { fixed: true, size: 'cover', repeat: false };
  const { chrome } = createChromeMock({
    initialStorage: {
      'example.com': {
        mode: 'auto',
        type: 'color',
        value: '#111111',
        opacity: 100,
        blur: 0,
        style,
        light: { type: 'color', value: '#111111', opacity: 100, blur: 0, style },
        dark: { type: 'color', value: '#222222', opacity: 100, blur: 0, style }
      }
    }
  });
  const { document, errors } = await loadExtensionPage('popup/popup.html', { chrome });
  assert.deepEqual(errors, []);
  assert.ok(document.getElementById('card-scheme-light').classList.contains('active'));

  const colorPicker = document.getElementById('color-picker');
  colorPicker.value = '#ff00aa';
  fire(colorPicker, 'input');

  // Synchronous on purpose: the save behind this edit is debounced, and the
  // card must not wait for it.
  assert.equal(document.getElementById('preview-card-light').style.backgroundColor, 'rgb(255, 0, 170)');
  assert.equal(
    document.getElementById('preview-card-dark').style.backgroundColor,
    'rgb(34, 34, 34)',
    'the scheme that is not being edited keeps its own background'
  );

  fire(document.getElementById('card-scheme-dark'), 'click');
  assert.equal(document.getElementById('preview-card-light').style.backgroundColor, 'rgb(255, 0, 170)');
});

test('popup: a custom cursor image round-trips, and a custom cursor with no image still draws something', async () => {
  const cursorImage = 'data:image/png;base64,iVBORw0KGgo=';
  const { chrome, store } = createChromeMock({
    initialStorage: {
      'example.com': {
        type: 'none',
        value: '',
        opacity: 100,
        blur: 0,
        style: { fixed: true, size: 'cover', repeat: false },
        cursor: { enabled: true, preset: 'custom', image: cursorImage, color: '#3b82f6', size: 24 }
      }
    }
  });
  const { document, errors } = await loadExtensionPage('popup/popup.html', { chrome });
  assert.deepEqual(errors, []);

  const customSwatch = document.querySelector('.cursor-preset-swatch[data-preset="custom"]');
  assert.ok(customSwatch, 'the shape grid offers a custom-image swatch');
  assert.ok(customSwatch.classList.contains('active'));
  assert.equal(document.getElementById('cursor-custom-control').classList.contains('hidden'), false);
  assert.equal(document.getElementById('cursor-file-info').classList.contains('hidden'), false);
  assert.equal(document.getElementById('cursor-image-thumb').getAttribute('src'), cursorImage);

  fire(document.getElementById('cursor-remove-file'), 'click');
  await waitFor(() => store['example.com'].cursor && store['example.com'].cursor.image === '');
  assert.equal(document.getElementById('cursor-drop-area').classList.contains('hidden'), false);
  assert.equal(document.getElementById('cursor-file-info').classList.contains('hidden'), true);

  // The native pointer is hidden while the overlay runs, so "custom shape,
  // nothing to draw" must never reach the page as an invisible cursor.
  const { PageDyeCursor } = document.defaultView;
  assert.equal(PageDyeCursor.normalizeCursorConfig({ preset: 'custom' }).preset, 'ball');
  assert.equal(PageDyeCursor.normalizeCursorConfig({ preset: 'custom', image: 'javascript:alert(1)' }).preset, 'ball');
  assert.equal(PageDyeCursor.normalizeCursorConfig({ preset: 'custom', image: cursorImage }).preset, 'custom');
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

test('popup: clear edited text removes only the active page override', async () => {
  const pageUrl = 'https://example.com/article#comments';
  const { chrome, store } = createChromeMock({
    tab: { id: 1, url: pageUrl, active: true },
    initialStorage: {
      __pagedye_text_overrides_v1__: {
        'https://example.com/article': { entries: [{ selector: '#copy', text: 'Updated text' }] },
        'https://example.com/other': { entries: [{ selector: '#copy', text: 'Keep this' }] }
      }
    }
  });
  const { document, errors } = await loadExtensionPage('popup/popup.html', { chrome });
  assert.deepEqual(errors, []);

  const originalConfirm = document.defaultView.confirm;
  document.defaultView.confirm = () => true;
  document.getElementById('text-editor-clear-btn').click();
  await waitFor(() => store.__pagedye_text_overrides_v1__ &&
    !store.__pagedye_text_overrides_v1__['https://example.com/article']);
  document.defaultView.confirm = originalConfirm;

  assert.ok(store.__pagedye_text_overrides_v1__['https://example.com/other']);
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

test('options: in-page tabs switch views, and old deep links still land on them', async () => {
  const { chrome } = createChromeMock({
    tab: null,
    initialStorage: {
      'example.com': { type: 'color', value: '#123456' },
      __pagedye_url_rules_v081__: [{ id: 'r1', type: 'hostname', pattern: 'example.com', action: 'exclude', enabled: true }],
      __pagedye_custom_effects__: [{ id: 'e1', name: 'Dot', type: 'code', code: 'return {};' }]
    }
  });
  const { document, errors } = await loadExtensionPage('options/options.html', { chrome });
  assert.deepEqual(errors, []);

  const active = (sectionId) => [...document.querySelectorAll(`#${sectionId} .tab-pane.active`)].map((pane) => pane.id);
  assert.deepEqual(active('section-sites'), ['pane-sites-saved'], 'the first tab opens by default');

  fire(document.querySelector('.page-tab[data-pane="pane-sites-rules"]'), 'click');
  assert.deepEqual(active('section-sites'), ['pane-sites-rules']);
  assert.equal(document.querySelector('.page-tab[data-pane="pane-sites-rules"]').classList.contains('active'), true);
  assert.equal(document.querySelector('.page-tab[data-pane="pane-sites-saved"]').classList.contains('active'), false);

  // Counts are on the tabs, so the other views answer "how many" without being opened.
  await waitFor(() => document.getElementById('count-rules').textContent === '1');
  assert.equal(document.getElementById('count-rules').hidden, false);
  assert.equal(document.getElementById('count-effects').textContent, '1');
});

test('options: switching sections returns to the top of the new one', async () => {
  // Below 768px the document scrolls, not .main-content. Resetting only the
  // desktop scroller left a phone looking at empty space past the end of a
  // short section, which reads as a blank page.
  const { chrome } = createChromeMock({ tab: null });
  const { document, window, errors } = await loadExtensionPage('options/options.html', { chrome });
  assert.deepEqual(errors, []);

  const scrolls = [];
  window.scrollTo = (...args) => scrolls.push(args);
  fire(document.querySelector('.nav-item[data-target="section-settings"]'), 'click');

  assert.deepEqual(scrolls, [[0, 0]], 'the document scroller has to be reset too');
  assert.equal(document.querySelector('.main-content').scrollTop, 0);
});

test('options: a tab switch animates in the direction the tab bar moved', async () => {
  const { chrome } = createChromeMock({ tab: null });
  const { document, errors } = await loadExtensionPage('options/options.html', { chrome });
  assert.deepEqual(errors, []);

  const pane = (id) => document.getElementById(id);
  const tab = (id) => document.querySelector(`.page-tab[data-pane="${id}"]`);

  // The first paint of a section has no previous tab, so no direction.
  assert.equal(pane('pane-sites-saved').classList.contains('enter-forward'), false);
  assert.equal(pane('pane-sites-saved').classList.contains('enter-back'), false);

  fire(tab('pane-sites-rules'), 'click');
  assert.ok(pane('pane-sites-rules').classList.contains('enter-forward'), 'rightwards move enters from the right');

  fire(tab('pane-sites-saved'), 'click');
  assert.ok(pane('pane-sites-saved').classList.contains('enter-back'), 'leftwards move enters from the left');
  assert.equal(pane('pane-sites-rules').classList.contains('enter-forward'), false, 'the leaving panel is cleaned up');
});

test('options: a deep link to a section that became a tab opens that tab', async () => {
  // Regression: the alias table is read while the page is still initialising,
  // so declaring it below that point left every deep link throwing on a
  // temporal-dead-zone reference and silently staying on the first section.
  for (const [hash, section, pane] of [
    ['#section-custom-effects', 'section-configs', 'pane-library-effects'],
    ['#section-backup', 'section-storage', 'pane-data-backup'],
    ['#section-appearance', 'section-settings', null]
  ]) {
    const { chrome } = createChromeMock({ tab: null });
    const { document, errors } = await loadExtensionPage('options/options.html', { chrome, hash });
    assert.deepEqual(errors, [], `${hash} should load cleanly`);
    assert.ok(document.getElementById(section).classList.contains('active'), `${hash} should open ${section}`);
    assert.ok(
      document.querySelector(`.nav-item[data-target="${section}"]`).classList.contains('active'),
      `${hash} should also highlight the ${section} nav item`
    );
    if (pane) {
      assert.deepEqual([...document.querySelectorAll(`#${section} .tab-pane.active`)].map((p) => p.id), [pane]);
    }
  }
});

test('options: the AI-generate button on Custom Effects opens the AI workspace', async () => {
  const { chrome } = createChromeMock({ tab: null });
  const { document, errors } = await loadExtensionPage('options/options.html', { chrome });
  assert.deepEqual(errors, []);

  fire(document.querySelector('.nav-item[data-target="section-configs"]'), 'click');
  fire(document.querySelector('.page-tab[data-pane="pane-library-effects"]'), 'click');
  fire(document.getElementById('ai-custom-effect-btn'), 'click');

  assert.ok(document.getElementById('section-ai-chat').classList.contains('active'));
  assert.ok(document.querySelector('.nav-item[data-target="section-ai-chat"]').classList.contains('active'));
});

test('options: the dashboard repaints when its own preferences change from elsewhere', async () => {
  // The AI chat's settings card (and the popup) can now write these keys, so
  // the page has to follow the key rather than only its own picker — otherwise
  // pressing apply looks like it did nothing until a reload.
  const { chrome, store } = createChromeMock({ tab: null });
  const { document, errors } = await loadExtensionPage('options/options.html', { chrome });
  assert.deepEqual(errors, []);

  await chrome.storage.local.set({
    __pagedye_ui_theme__: { accent: 'teal', disableAnimation: true },
    __pagedye_debug_mode__: true,
    __pagedye_pause_shortcut__: { code: 'KeyK', altKey: true, shiftKey: true, ctrlKey: false, metaKey: false }
  });

  await waitFor(() => document.querySelector('.theme-color-dot[data-theme-accent="teal"]').classList.contains('active'), { timeout: 3000 });
  assert.equal(document.getElementById('theme-disable-animation').checked, true, 'the motion toggle follows too');
  assert.equal(document.getElementById('debug-mode-toggle').checked, true);
  assert.match(document.getElementById('pause-shortcut-input').value, /K/);
  assert.equal(store.__pagedye_ui_theme__.accent, 'teal');
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
