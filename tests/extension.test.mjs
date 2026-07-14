import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

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

test('popup keeps its scroll area and bottom navigation as direct layout siblings', () => {
  const popup = read('popup/popup.html');
  assert.match(popup, /<\/main>\s*<div class="bottom-nav"/);
  assert.doesNotMatch(popup, /main-controls-wrapper/);
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
  assert.match(content, /persistActiveSettings/);
  assert.match(content, /resolveUrlSettings/);
  assert.match(read('scripts/effects.js'), /PageDyeEffects\.stopEffect/);
});

test('the abandoned URL-rule migration restores domain settings once', async () => {
  const background = read('scripts/background.js');
  const existing = { mode: 'single', type: 'image', value: 'existing' };
  const recovered = { mode: 'single', type: 'color', value: '#123456' };
  const data = {
    'existing.example': existing,
    __pagedye_url_rules__: [
      { enabled: true, type: 'domain', action: 'apply', pattern: 'restored.example', settings: recovered },
      { enabled: true, type: 'domain', action: 'apply', pattern: 'existing.example', settings: recovered },
      { enabled: true, type: 'wildcard', action: 'apply', pattern: '*.ignored.example', settings: recovered },
      { enabled: true, type: 'domain', action: 'exclude', pattern: 'excluded.example', settings: recovered }
    ]
  };
  let resolveWrite;
  const writeFinished = new Promise((resolveWritePromise) => { resolveWrite = resolveWritePromise; });
  let written;
  const chrome = {
    storage: { local: {
      get: async () => data,
      set: async (value) => { written = JSON.parse(JSON.stringify(value)); resolveWrite(); }
    } },
    runtime: { onMessage: { addListener() {} } }
  };

  runInNewContext(background, { chrome, console });
  await writeFinished;

  assert.deepEqual(written, {
    'restored.example': recovered,
    __pagedye_url_rules_recovered_v080__: true
  });
});

test('backup schema accepts supported data and blocks arbitrary storage keys', () => {
  const site = { mode: 'single', type: 'color', value: '#123456', opacity: 150, blur: -5 };
  const backup = storageSchema.buildBackup({
    'example.com': site,
    [storageSchema.KEYS.defaultBackground]: site,
    [storageSchema.KEYS.uiTheme]: { pageBg: '#fff' },
    arbitrary: { secret: true }
  }, '0.8.0');
  assert.equal(backup.schemaVersion, 3);
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

test('URL rules use ordered first-match resolution across all supported match types', () => {
  const red = { mode: 'single', type: 'color', value: '#ff0000' };
  const blue = { mode: 'single', type: 'color', value: '#0000ff' };
  const rules = [
    { id: 'disabled', type: 'exact', pattern: 'https://github.com/settings/profile', action: 'exclude', enabled: false },
    { id: 'exact', type: 'exact', pattern: 'https://github.com/settings/profile?tab=keys', action: 'apply', settings: red },
    { id: 'exclude', type: 'prefix', pattern: 'github.com/settings/*', action: 'exclude' },
    { id: 'host', type: 'hostname', pattern: 'github.com', action: 'apply', settings: blue }
  ];

  const exact = storageSchema.resolveUrlSettings('https://github.com/settings/profile?tab=keys#section', rules, null, null);
  assert.equal(exact.source, 'rule');
  assert.equal(exact.rule.id, 'exact');
  assert.equal(exact.settings.value, '#ff0000');

  const excluded = storageSchema.resolveUrlSettings('https://github.com/settings/security', rules, blue, red);
  assert.equal(excluded.source, 'exclude');
  assert.equal(excluded.excluded, true);
  assert.equal(excluded.settings, null);

  const hostname = storageSchema.resolveUrlSettings('https://github.com/explore', rules, null, null);
  assert.equal(hostname.rule.id, 'host');
  assert.equal(hostname.settings.value, '#0000ff');

  assert.equal(storageSchema.urlRuleMatches(
    { id: 'prefix', type: 'prefix', pattern: 'github.com/settings/*', action: 'exclude' },
    'https://github.com/settings'
  ), true);
  assert.equal(storageSchema.urlRuleMatches(
    { id: 'prefix', type: 'prefix', pattern: 'github.com/settings/*', action: 'exclude' },
    'https://github.com/settings-old'
  ), false);
  assert.equal(storageSchema.urlRuleMatches(
    { id: 'wild', type: 'wildcard', pattern: '*.example.com', action: 'apply', settings: red },
    'https://docs.example.com/page'
  ), true);
  assert.equal(storageSchema.urlRuleMatches(
    { id: 'wild', type: 'wildcard', pattern: '*.example.com', action: 'apply', settings: red },
    'https://example.com/page'
  ), false);
});

test('URL rules are validated and included in current backups', () => {
  const settings = { mode: 'single', type: 'color', value: '#123456' };
  const rule = { id: 'rule_1', type: 'prefix', pattern: 'github.com/settings/*', action: 'apply', enabled: false, settings };
  assert.equal(storageSchema.normalizeRulePattern('exact', 'github.com/a#fragment'), 'https://github.com/a');
  assert.equal(storageSchema.normalizeRulePattern('wildcard', 'example.com'), null);
  assert.equal(storageSchema.normalizeRulePattern('prefix', 'github.com/settings/*'), 'github.com/settings/*');

  const backup = storageSchema.buildBackup({ [storageSchema.KEYS.urlRules]: [rule] }, '0.8.1');
  assert.equal(backup.schemaVersion, 3);
  assert.equal(backup.urlRules.length, 1);
  assert.equal(backup.urlRules[0].enabled, false);
  assert.throws(() => storageSchema.buildBackup({
    [storageSchema.KEYS.urlRules]: [{ ...rule, pattern: 'bad pattern' }]
  }, '0.8.1'), /URL rules/);

  const prepared = storageSchema.prepareImport({
    schemaVersion: 2,
    sites: {},
    urlRules: [rule],
    defaultBackground: null,
    customEffects: [],
    customPresetColors: { light: [], dark: [] }
  });
  assert.equal(prepared.write[storageSchema.KEYS.urlRules][0].id, 'rule_1');
  assert.throws(() => storageSchema.prepareImport({
    schemaVersion: 2,
    sites: {},
    urlRules: [{ ...rule, pattern: 'bad pattern' }],
    defaultBackground: null,
    customEffects: [],
    customPresetColors: { light: [], dark: [] }
  }), /URL rule/);

  const legacy = storageSchema.prepareImport({
    schemaVersion: 1,
    sites: {},
    defaultBackground: null,
    customEffects: [],
    customPresetColors: { light: [], dark: [] }
  });
  assert.ok(legacy.removeKeys.includes(storageSchema.KEYS.urlRules));
  assert.ok(storageSchema.prepareImport({ 'example.com': settings }).removeKeys.includes(storageSchema.KEYS.urlRules));
});

test('configuration presets, site groups, and selected-site backups are validated', () => {
  const red = { mode: 'single', type: 'color', value: '#ff0000' };
  const blue = { mode: 'single', type: 'color', value: '#0000ff' };
  const preset = { id: 'preset_1', name: 'Reading', settings: red, createdAt: 1, updatedAt: 2 };
  const group = { id: 'group_1', name: 'Work', sites: ['one.example', 'two.example'], createdAt: 1, updatedAt: 2 };
  const storage = {
    'one.example': red,
    'two.example': blue,
    [storageSchema.KEYS.configPresets]: [preset],
    [storageSchema.KEYS.siteGroups]: [group]
  };

  const backup = storageSchema.buildBackup(storage, '0.8.1');
  assert.equal(backup.schemaVersion, 3);
  assert.equal(backup.configPresets[0].name, 'Reading');
  assert.deepEqual(backup.siteGroups[0].sites, ['one.example', 'two.example']);

  const selected = storageSchema.buildSelectedSitesBackup(storage, '0.8.1', ['two.example']);
  assert.deepEqual(Object.keys(selected.sites), ['two.example']);
  assert.deepEqual(selected.siteGroups[0].sites, ['two.example']);
  assert.deepEqual(selected.configPresets, []);
  assert.equal(selected.selectionOnly, true);

  const prepared = storageSchema.prepareImport(backup);
  assert.equal(prepared.write[storageSchema.KEYS.configPresets][0].id, 'preset_1');
  assert.equal(prepared.write[storageSchema.KEYS.siteGroups][0].id, 'group_1');

  assert.throws(() => storageSchema.prepareImport({
    ...backup,
    configPresets: [preset, preset]
  }), /preset/);
  assert.throws(() => storageSchema.buildBackup({
    [storageSchema.KEYS.siteGroups]: [{ ...group, sites: ['one.example', 'one.example'] }]
  }, '0.8.1'), /site groups/);
});

test('preset and group interfaces expose quick and advanced workflows', () => {
  const optionsHtml = read('options/options.html');
  const popupHtml = read('popup/popup.html');
  const manager = read('options/config-manager.js');
  const quick = read('popup/preset-quick.js');

  assert.match(optionsHtml, /id="section-configs"/);
  assert.match(optionsHtml, /id="config-export-selected"/);
  assert.match(optionsHtml, /id="config-import-list"/);
  assert.match(optionsHtml, /id="config-copy-source"/);
  assert.match(optionsHtml, /id="config-group-select"/);
  assert.match(popupHtml, /id="quick-preset-save"/);
  assert.match(popupHtml, /id="quick-preset-apply"/);
  assert.match(manager, /buildSelectedSitesBackup/);
  assert.match(manager, /pendingImport\.selected/);
  assert.match(manager, /settingsForApply/);
  assert.match(quick, /result\.source === 'rule'/);
  assert.match(quick, /PageDyePopupPresets\.beforeApply/);
  assert.match(quick, /PageDyePopupPresets\.refresh/);
});

test('options default interface background follows the system color scheme', () => {
  const options = read('options/options.js');
  const css = read('options/options.css');
  assert.match(options, /SYSTEM_DARK_QUERY = window\.matchMedia\('\(prefers-color-scheme: dark\)'\)/);
  assert.match(options, /backgroundMode: 'system'/);
  assert.match(options, /currentUiTheme\.backgroundMode !== 'system'/);
  assert.match(css, /html\s*\{[^}]*background:\s*var\(--bg-color\)/s);
});

test('configuration presets use the current effect model and migrate legacy layers before apply', () => {
  const context = { navigator: { language: 'en' } };
  context.globalThis = context;
  runInNewContext(read('scripts/config-presets.js'), context);
  const api = context.PageDyeConfigPresets;
  assert.deepEqual(Array.from(api.BUILT_INS, (preset) => preset.id), [
    'builtin-light-aurora', 'builtin-dark-aurora', 'builtin-day', 'builtin-night'
  ]);
  const lightAurora = api.BUILT_INS.find((preset) => preset.id === 'builtin-light-aurora');
  const aurora = api.BUILT_INS.find((preset) => preset.id === 'builtin-dark-aurora');
  const day = api.BUILT_INS.find((preset) => preset.id === 'builtin-day');
  const night = api.BUILT_INS.find((preset) => preset.id === 'builtin-night');
  assert.equal(lightAurora.settings.effect, 'aurora');
  assert.notEqual(api.previewStyle(lightAurora.settings).background, api.previewStyle(aurora.settings).background);
  assert.equal(aurora.settings.type, 'color');
  assert.equal(aurora.settings.effectEnabled, true);
  assert.equal(aurora.settings.effect, 'aurora');
  assert.match(api.previewStyle(aurora.settings).background, /linear-gradient/);
  assert.equal(day.settings.effect, 'particles');
  assert.equal(night.settings.effect, 'particles');
  assert.notEqual(api.previewStyle(day.settings).background, api.previewStyle(night.settings).background);

  const legacy = api.settingsForApply({
    mode: 'auto', type: 'effect', value: 'particles', effectKind: 'particles',
    light: { type: 'effect', value: 'aurora', effectKind: 'aurora' },
    dark: { type: 'color', value: '#111111' }
  });
  assert.equal(legacy.type, 'none');
  assert.equal(legacy.effectEnabled, true);
  assert.equal(legacy.effect, 'particles');
  assert.equal(legacy.light.type, 'none');
  assert.equal(legacy.light.effect, 'aurora');
  assert.equal(legacy.dark.type, 'color');
});

test('options expose rule priority, drag sorting, disabling, and rule editing', () => {
  const html = read('options/options.html');
  const options = read('options/options.js');
  assert.match(html, /id="rule-form"/);
  assert.match(html, /value="exact"/);
  assert.match(html, /value="prefix"/);
  assert.match(html, /value="wildcard"/);
  assert.match(options, /tr\.draggable = true/);
  assert.match(options, /rule-enabled-toggle/);
  assert.match(options, /currentEditingRuleId/);
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
