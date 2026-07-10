import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const read = (file) => readFileSync(resolve(root, file), 'utf8');

test('manifest has valid required extension assets', () => {
  const manifest = JSON.parse(read('manifest.json'));
  assert.equal(manifest.manifest_version, 3);
  assert.match(manifest.version, /^\d+\.\d+\.\d+$/);

  const contentScripts = manifest.content_scripts.flatMap((entry) => entry.js || []);
  const iconAssets = [manifest.action.default_icon, ...Object.values(manifest.icons || {})];
  for (const asset of [manifest.action.default_popup, manifest.options_ui.page, ...contentScripts, ...iconAssets]) {
    assert.ok(existsSync(resolve(root, asset)), `missing manifest asset: ${asset}`);
  }
});

test('popup and options include their shared image preparation helper', () => {
  for (const page of ['popup/popup.html', 'options/options.html']) {
    assert.match(read(page), /scripts\/image\.js/);
  }
  const helper = read('scripts/image.js');
  assert.match(helper, /image\/webp/);
  assert.match(helper, /MAX_DIMENSION = 2560/);
});

test('performance safeguards cancel hidden-page work and retain the temporary shortcut', () => {
  const effects = read('scripts/effects.js');
  const content = read('scripts/content.js');
  assert.match(effects, /document\.addEventListener\('visibilitychange', visibilityHandler\)/);
  assert.match(effects, /performanceMode === 'low'/);
  assert.match(content, /pauseDeepCompatWatchers/);
  assert.match(content, /matchesPauseShortcut/);
  assert.match(read('options/options.js'), /PAUSE_SHORTCUT_KEY/);
});
