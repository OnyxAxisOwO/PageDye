import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const read = (file) => readFileSync(resolve(root, file), 'utf8');
const require = createRequire(import.meta.url);
const storageSchema = require(resolve(root, 'scripts/storage-schema.js'));

function pngDimensions(file) {
  const buffer = readFileSync(resolve(root, file));
  assert.equal(buffer.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
}

test('manifest has valid required extension assets', () => {
  const manifest = JSON.parse(read('manifest.json'));
  assert.equal(manifest.manifest_version, 3);
  assert.match(manifest.version, /^\d+\.\d+\.\d+$/);

  const contentScripts = manifest.content_scripts.flatMap((entry) => entry.js || []);
  const iconAssets = [...Object.values(manifest.action.default_icon || {}), ...Object.values(manifest.icons || {})];
  const sandboxAssets = manifest.sandbox?.pages || [];
  const webAssets = (manifest.web_accessible_resources || []).flatMap((entry) => entry.resources || []);
  for (const asset of [manifest.action.default_popup, manifest.options_ui.page, manifest.background?.service_worker, ...contentScripts, ...sandboxAssets, ...webAssets, ...iconAssets]) {
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
  const modeControls = userscript.match(/function renderModeControls\(\) \{([\s\S]*?)if \(settings\.mode === 'auto'\)/)?.[1] || '';
  assert.doesNotMatch(modeControls, /<span>/);
  assert.equal((modeControls.match(/class="pd-mode-button /g) || []).length, 4);
  assert.match(userscript, /const hideTargetControls = ui\.tab === 'advanced'/);
  assert.match(userscript, /seg\.hidden = hideTargetControls/);
  assert.match(userscript, /hint\.hidden = hideTargetControls/);
  assert.match(userscript, /class="pd-period-item /);
  assert.match(userscript, /class="pd-period-actions /);
  assert.match(userscript, /\.pd-btn-secondary\.pd-period-action/);
});


test('content injection is complete, idempotent, and tears down replaced runtimes', () => {
  const manifest = JSON.parse(read('manifest.json'));
  const eagerScripts = manifest.content_scripts.flatMap((entry) => entry.js || []);
  assert.deepEqual(eagerScripts.slice(0, 6), [
    'scripts/storage-schema.js',
    'scripts/gradient.js',
    'scripts/effects.js',
    'scripts/cursor.js',
    'scripts/custom-effect-sandbox.js',
    'scripts/content.js'
  ]);
  assert.ok(!eagerScripts.includes('scripts/debug.js'));
  assert.ok(!eagerScripts.includes('scripts/debug-network.js'));
  assert.equal(manifest.background.service_worker, 'scripts/background.js');
  assert.ok(!manifest.permissions.includes('activeTab'));

  const injection = read('scripts/injection.js');
  assert.match(injection, /async function ensure[\s\S]*await ping\(tabId\)[\s\S]*await inject\(tabId\)/);
  assert.match(injection, /scripts\/cursor\.js/);
  const content = read('scripts/content.js');
  assert.match(content, /window\.__pagedyeContentTeardown/);
  assert.match(content, /usingDefault \? DEFAULT_BG_KEY : domain/);
  assert.match(read('scripts/effects.js'), /PageDyeEffects\.stopEffect/);
});

test('backup schema accepts supported data and blocks arbitrary storage keys', () => {
  const site = { mode: 'single', type: 'color', value: '#123456', opacity: 150, blur: -5 };
  const backup = storageSchema.buildBackup({
    'example.com': site,
    [storageSchema.KEYS.defaultBackground]: site,
    [storageSchema.KEYS.uiTheme]: { pageBg: '#fff' },
    arbitrary: { secret: true }
  }, '0.8.0');
  assert.equal(backup.schemaVersion, 1);
  assert.deepEqual(Object.keys(backup.sites), ['example.com']);
  assert.equal(backup.sites['example.com'].opacity, 100);
  assert.equal(backup.sites['example.com'].blur, 0);
  assert.ok(!Object.hasOwn(backup, storageSchema.KEYS.uiTheme));

  const prepared = storageSchema.prepareImport({
    schemaVersion: 1,
    sites: { 'example.com': site },
    defaultBackground: null,
    customEffects: [],
    customPresetColors: { light: ['#abcdef'], dark: [] },
    [storageSchema.KEYS.extensionEnabled]: false,
    malicious: { injected: true }
  });
  assert.deepEqual(prepared.siteKeys, ['example.com']);
  assert.equal(prepared.write['example.com'].type, 'color');
  assert.ok(!Object.hasOwn(prepared.write, storageSchema.KEYS.extensionEnabled));
  assert.ok(!Object.hasOwn(prepared.write, 'malicious'));
  assert.ok(prepared.removeKeys.includes(storageSchema.KEYS.defaultBackground));
  assert.throws(() => storageSchema.prepareImport([]));
});

test('custom effect URLs and code imports are constrained', () => {
  assert.equal(storageSchema.normalizeEffectUrl('example.com'), 'https://example.com/');
  assert.equal(storageSchema.normalizeEffectUrl('http://example.com'), null);
  assert.equal(storageSchema.normalizeEffectUrl('javascript:alert(1)'), null);
  assert.equal(storageSchema.normalizeEffectUrl('http://localhost:3000/demo'), 'http://localhost:3000/demo');
  assert.equal(storageSchema.normalizeCustomEffect({ type: 'url', url: 'javascript:alert(1)' }), null);
  assert.equal(storageSchema.normalizeCustomEffect({ type: 'code', code: 'x'.repeat(storageSchema.MAX_EFFECT_CODE_CHARS + 1) }), null);
});

test('site clearing is scoped and URL iframes are sandboxed', () => {
  const options = read('options/options.js');
  const clearBlock = options.match(/async function clearAllSites\(\) \{([\s\S]*?)showStatus\(t\('clearAllDone'\)\)/)?.[1] || '';
  assert.doesNotMatch(clearBlock, /storage\.local\.clear/);
  assert.match(clearBlock, /isSiteSettingsKey/);
  assert.match(read('options/options.html'), /sandbox="allow-scripts allow-forms allow-pointer-lock"/);
  assert.match(read('options/options.html'), /referrerpolicy="no-referrer"/);
  const content = read('scripts/content.js');
  assert.match(content, /setAttribute\('sandbox', 'allow-scripts allow-forms allow-pointer-lock'\)/);
  assert.match(content, /normalizeEffectUrl/);
});

test('extension icons are non-empty PNGs with exact dimensions', () => {
  for (const size of [16, 48, 128]) {
    const file = `icons/icon${size}.png`;
    assert.ok(statSync(resolve(root, file)).size > 0);
    assert.deepEqual(pngDimensions(file), [size, size]);
  }
});

test('confirm dialog and reset controls have baseline accessibility support', () => {
  const optionsHtml = read('options/options.html');
  assert.match(optionsHtml, /role="dialog"/);
  assert.match(optionsHtml, /aria-modal="true"/);
  assert.match(optionsHtml, /aria-labelledby="confirm-modal-title"/);
  assert.match(optionsHtml, /id="edit-reset-btn"[^>]*type="button"|type="button"[^>]*id="edit-reset-btn"/);
  assert.match(read('popup/popup.html'), /id="reset-btn"[^>]*type="button"|type="button"[^>]*id="reset-btn"/);
  const options = read('options/options.js');
  assert.match(options, /event\.key === 'Escape'/);
  assert.match(options, /event\.key === 'Tab'/);
  assert.match(options, /previousFocus/);
});


test('custom Canvas effects run through the isolated extension sandbox', () => {
  const manifest = JSON.parse(read('manifest.json'));
  assert.deepEqual(manifest.sandbox.pages, ['sandbox/effect.html']);
  assert.match(manifest.content_security_policy.extension_pages, /script-src 'self'/);
  assert.doesNotMatch(manifest.content_security_policy.extension_pages, /unsafe-eval/);
  assert.match(manifest.content_security_policy.sandbox, /unsafe-eval/);
  assert.match(manifest.content_security_policy.sandbox, /connect-src 'none'/);

  const webAssets = manifest.web_accessible_resources.flatMap((entry) => entry.resources || []);
  for (const asset of ['sandbox/effect.html', 'sandbox/effect-runtime.js', 'scripts/effects.js']) {
    assert.ok(webAssets.includes(asset));
  }
  assert.match(read('options/options.html'), /scripts\/custom-effect-sandbox\.js/);

  const helper = read('scripts/custom-effect-sandbox.js');
  assert.match(helper, /event\.source !== state\.iframe\.contentWindow/);
  assert.match(helper, /message\.channel/);
  assert.match(helper, /chrome\.runtime\.getURL\('sandbox\/effect\.html'\)/);
  assert.match(helper, /release\(iframe, new Error\('Custom effect sandbox did not become ready\.'\)\)/);
  const runtime = read('sandbox/effect-runtime.js');
  assert.match(runtime, /event\.source !== parent/);
  assert.match(runtime, /strictCustom: true/);

  const content = read('scripts/content.js');
  const codeBranch = content.match(/if \(customEffect && customEffect\.type === 'code'\) \{([\s\S]*?)\n    \}/)?.[1] || '';
  assert.match(codeBranch, /PageDyeCustomSandbox\.start/);
  assert.doesNotMatch(codeBranch, /PageDyeEffects\.startEffect/);
});

test('code import warnings precede sandbox validation', () => {
  const options = read('options/options.js');
  const standalone = options.slice(options.indexOf('function importCustomEffectFile'), options.indexOf('// Appends the user'));
  assert.ok(standalone.indexOf('showConfirm(warning)') >= 0);
  assert.ok(standalone.indexOf('showConfirm(warning)') < standalone.indexOf('PageDyeCustomSandbox.validate'));

  const backup = options.slice(options.indexOf('function importConfigs'), options.indexOf('async function clearAllSites'));
  assert.ok(backup.indexOf('showConfirm(warning)') >= 0);
  assert.ok(backup.indexOf('showConfirm(warning)') < backup.indexOf('PageDyeCustomSandbox.validate'));
});

test('picker injection uses the shared complete dependency loader', () => {
  const popup = read('popup/popup.js');
  assert.ok((popup.match(/PageDyeInjection\.ensure\(tab\.id\)/g) || []).length >= 4);
  assert.doesNotMatch(popup, /files: \['scripts\/gradient\.js', 'scripts\/effects\.js', 'scripts\/cursor\.js', 'scripts\/content\.js'\]/);
  const injection = read('scripts/injection.js');
  assert.match(injection, /scripts\/storage-schema\.js/);
  assert.match(injection, /scripts\/custom-effect-sandbox\.js/);
});

test('image and backup limits reject oversize data instead of truncating it', () => {
  assert.equal(storageSchema.MAX_CUSTOM_EFFECTS, 100);
  const tooLargeValue = `data:image/png;base64,${'a'.repeat(storageSchema.MAX_IMAGE_VALUE_CHARS + 1)}`;
  const oversized = { mode: 'single', type: 'image', value: tooLargeValue };
  assert.equal(storageSchema.normalizeSiteSettings(oversized), null);
  assert.throws(() => storageSchema.buildBackup({ 'example.com': oversized }, '0.8.0'), /oversized/);
  assert.equal(storageSchema.isSiteSettingsKey('__proto__', { mode: 'single', type: 'color', value: '#fff' }), false);
  assert.equal(storageSchema.isSiteSettingsKey('constructor', { mode: 'single', type: 'color', value: '#fff' }), false);

  const imageHelper = read('scripts/image.js');
  assert.match(imageHelper, /MAX_INPUT_IMAGE_BYTES/);
  assert.match(imageHelper, /MAX_STORED_IMAGE_BYTES/);
  assert.match(imageHelper, /file\.size > MAX_STORED_IMAGE_BYTES/);
  assert.doesNotMatch(read('scripts/storage-schema.js'), /clean\.value = trimString/);
  assert.match(read('options/options.js'), /backupBytes > window\.PageDyeStorage\.MAX_BACKUP_BYTES/);
});

test('release package includes sandbox resources', () => {
  assert.match(read('.github/workflows/release.yml'), /FILES="[^"]*\bsandbox\b[^"]*"/);
});
