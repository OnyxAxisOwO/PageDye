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

test('release versions stay synchronized and Lite defines the time-range icon', () => {
  const manifest = JSON.parse(read('manifest.json'));
  const packageJson = JSON.parse(read('package.json'));
  const userscript = read('userscript/pagedye.user.js');

  assert.equal(packageJson.version, manifest.version);
  assert.match(userscript, new RegExp(`^// @version\\s+${manifest.version.replaceAll('.', '\\.')}\\s*$`, 'm'));
  assert.match(userscript, new RegExp(`const VERSION = '${manifest.version.replaceAll('.', '\\.')}';`));
  assert.match(userscript, /clock:\s*'<circle[^']+<polyline/);
  assert.match(userscript, /svgIcon\(ICON\.clock, 14\)/);
  for (const page of ['popup/popup.html', 'options/options.html', 'site/index.html']) {
    assert.match(read(page), new RegExp(`v${manifest.version.replaceAll('.', '\\.')}\\b`));
  }
});

test('Lite mode and time-period controls use responsive layout classes', () => {
  const userscript = read('userscript/pagedye.user.js');

  assert.match(userscript, /class="pd-mode-switch"/);
  assert.match(userscript, /grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(userscript, /class="pd-period-item /);
  assert.match(userscript, /class="pd-period-actions /);
  assert.match(userscript, /\.pd-btn-secondary\.pd-period-action/);
});
