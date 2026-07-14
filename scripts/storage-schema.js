(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.PageDyeStorage = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const BACKUP_SCHEMA_VERSION = 3;
  const MAX_BACKUP_BYTES = 64 * 1024 * 1024;
  const MAX_EFFECT_FILE_BYTES = 512 * 1024;
  const MAX_EFFECT_CODE_CHARS = 200000;
  const MAX_EFFECT_NAME_CHARS = 120;
  const MAX_CUSTOM_EFFECTS = 100;
  const MAX_URL_RULES = 1000;
  const MAX_CONFIG_PRESETS = 100;
  const MAX_SITE_GROUPS = 100;
  const MAX_GROUP_SITES = 1000;
  const MAX_URL_CHARS = 2048;
  const MAX_IMAGE_VALUE_CHARS = 32 * 1024 * 1024;

  const KEYS = Object.freeze({
    uiTheme: '__pagedye_ui_theme__',
    pauseShortcut: '__pagedye_pause_shortcut__',
    customEffects: '__pagedye_custom_effects__',
    customPresetColors: '__pagedye_custom_preset_colors__',
    debugMode: '__pagedye_debug_mode__',
    debugPosition: '__pagedye_debug_position__',
    defaultBackground: '__pagedye_default_background__',
    extensionEnabled: '__pagedye_extension_enabled__',
    urlRules: '__pagedye_url_rules_v081__',
    configPresets: '__pagedye_config_presets__',
    siteGroups: '__pagedye_site_groups__'
  });

  const RESERVED_KEYS = new Set(Object.values(KEYS));
  const BACKUP_GLOBAL_KEYS = new Set([
    KEYS.defaultBackground,
    KEYS.customEffects,
    KEYS.customPresetColors,
    KEYS.urlRules,
    KEYS.configPresets,
    KEYS.siteGroups
  ]);
  const MODES = new Set(['single', 'auto', 'timeRange', 'slideshow']);
  const TYPES = new Set(['none', 'color', 'image', 'effect']);
  const URL_RULE_TYPES = new Set(['hostname', 'exact', 'prefix', 'wildcard']);
  const FORBIDDEN_OBJECT_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

  function isPlainObject(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
  }

  function clampNumber(value, min, max, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, number));
  }

  function trimString(value, maxLength) {
    return typeof value === 'string' ? value.slice(0, maxLength) : '';
  }

  function sanitizeJson(value, depth = 0) {
    if (depth > 10) return undefined;
    if (value === null || typeof value === 'boolean') return value;
    if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
    if (typeof value === 'string') return value.length <= MAX_IMAGE_VALUE_CHARS ? value : undefined;
    if (Array.isArray(value)) {
      return value.slice(0, 250).map((item) => sanitizeJson(item, depth + 1)).filter((item) => item !== undefined);
    }
    if (!isPlainObject(value)) return undefined;

    const clean = Object.create(null);
    for (const key of Object.keys(value).slice(0, 250)) {
      if (FORBIDDEN_OBJECT_KEYS.has(key) || key.length > 200) continue;
      const next = sanitizeJson(value[key], depth + 1);
      if (next !== undefined) clean[key] = next;
    }
    return clean;
  }

  function normalizeLayer(layer) {
    if (!isPlainObject(layer)) return null;
    const clean = sanitizeJson(layer);
    if (!clean) return null;
    clean.type = TYPES.has(layer.type) ? layer.type : 'none';
    if (Object.prototype.hasOwnProperty.call(layer, 'value')) {
      if (typeof layer.value !== 'string' || layer.value.length > MAX_IMAGE_VALUE_CHARS) return null;
      clean.value = layer.value;
    }
    if (Object.prototype.hasOwnProperty.call(layer, 'opacity')) {
      clean.opacity = clampNumber(layer.opacity, 0, 100, 100);
    }
    if (Object.prototype.hasOwnProperty.call(layer, 'blur')) {
      clean.blur = clampNumber(layer.blur, 0, 100, 0);
    }
    if (Object.prototype.hasOwnProperty.call(layer, 'customCss')) {
      clean.customCss = trimString(layer.customCss, MAX_EFFECT_CODE_CHARS);
    }
    if (Object.prototype.hasOwnProperty.call(layer, 'targetSelector')) {
      clean.targetSelector = trimString(layer.targetSelector, 2000);
    }
    if (Object.prototype.hasOwnProperty.call(layer, 'deepCompatExclude')) {
      clean.deepCompatExclude = trimString(layer.deepCompatExclude, 4000);
    }
    return clean;
  }

  function normalizeSiteSettings(settings) {
    if (!isPlainObject(settings) || !TYPES.has(settings.type)) return null;
    const clean = normalizeLayer(settings);
    if (!clean) return null;
    clean.mode = MODES.has(settings.mode) ? settings.mode : 'single';

    if (isPlainObject(settings.light)) {
      clean.light = normalizeLayer(settings.light);
      if (!clean.light) return null;
    }
    if (isPlainObject(settings.dark)) {
      clean.dark = normalizeLayer(settings.dark);
      if (!clean.dark) return null;
    }

    if (isPlainObject(settings.timeRange)) {
      const range = sanitizeJson(settings.timeRange) || Object.create(null);
      const items = Array.isArray(settings.timeRange.items) ? settings.timeRange.items : [];
      range.items = items.slice(0, 48).map((source, index) => {
        const item = normalizeLayer(source);
        if (!item) return null;
        item.id = trimString(source.id, 80) || `period-${index + 1}`;
        item.name = trimString(source.name, 120);
        item.start = clampNumber(source.start, 0, 23, 0);
        item.end = clampNumber(source.end, 0, 23, 0);
        return item;
      });
      if (range.items.some((item) => !item)) return null;
      clean.timeRange = range;
    }

    if (isPlainObject(settings.slideshow)) {
      const slideshow = sanitizeJson(settings.slideshow) || Object.create(null);
      const items = Array.isArray(settings.slideshow.items) ? settings.slideshow.items : [];
      slideshow.items = items.slice(0, 200).map(normalizeLayer);
      if (slideshow.items.some((item) => !item)) return null;
      slideshow.currentIndex = Math.floor(clampNumber(settings.slideshow.currentIndex, 0, Math.max(0, slideshow.items.length - 1), 0));
      slideshow.lastRotationTime = clampNumber(settings.slideshow.lastRotationTime, 0, Number.MAX_SAFE_INTEGER, Date.now());
      clean.slideshow = slideshow;
    }

    if (Array.isArray(settings.frostedGlass)) {
      clean.frostedGlass = settings.frostedGlass.slice(0, 100).map((item) => sanitizeJson(item)).filter(Boolean);
    }
    return clean;
  }

  function isSiteKeyName(key) {
    return typeof key === 'string' && key.length > 0 && key.length <= 253 &&
      !RESERVED_KEYS.has(key) && !FORBIDDEN_OBJECT_KEYS.has(key) && !key.startsWith('__pagedye_') &&
      !/[\s/\\\u0000-\u001f]/.test(key);
  }

  function isSiteSettingsKey(key, value) {
    return isSiteKeyName(key) && !!normalizeSiteSettings(value);
  }

  function normalizeRulePattern(type, value) {
    if (!URL_RULE_TYPES.has(type) || typeof value !== 'string') return null;
    const input = value.trim();
    if (!input || input.length > MAX_URL_CHARS || /[\u0000-\u001f]/.test(input)) return null;

    if (type === 'hostname' || type === 'wildcard') {
      const hostnameInput = type === 'wildcard' && input.startsWith('*.') ? input.slice(2) : input;
      if (type === 'wildcard' && !input.startsWith('*.')) return null;
      if (/[/\\?#]/.test(hostnameInput)) return null;
      try {
        const url = new URL(`https://${hostnameInput}`);
        if (url.hostname !== hostnameInput.toLowerCase() || url.port || url.username || url.password) return null;
        return type === 'wildcard' ? `*.${url.hostname}` : url.hostname;
      } catch (_) {
        return null;
      }
    }

    if (type === 'exact') {
      try {
        const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(input) ? input : `https://${input}`);
        if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
        url.hash = '';
        return url.href;
      } catch (_) {
        return null;
      }
    }

    const withoutStar = input.endsWith('*') ? input.slice(0, -1) : input;
    try {
      const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(withoutStar) ? withoutStar : `https://${withoutStar}`);
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) return null;
      let pathname = url.pathname || '/';
      if (!pathname.endsWith('/')) pathname += '/';
      return `${url.hostname}${pathname}*`;
    } catch (_) {
      return null;
    }
  }

  function normalizeUrlRule(rule) {
    if (!isPlainObject(rule)) return null;
    const sourceType = rule.type === 'domain' ? 'hostname' : rule.type;
    if (!URL_RULE_TYPES.has(sourceType)) return null;
    const pattern = normalizeRulePattern(sourceType, rule.pattern);
    const action = rule.action === 'exclude' ? 'exclude' : rule.action === 'apply' ? 'apply' : null;
    const id = trimString(rule.id, 100);
    if (!id || !/^[a-zA-Z0-9_-]+$/.test(id) || !pattern || !action) return null;
    const clean = {
      id,
      type: sourceType,
      pattern,
      action,
      enabled: rule.enabled !== false
    };
    if (action === 'apply') {
      clean.settings = normalizeSiteSettings(rule.settings);
      if (!clean.settings) return null;
    }
    return clean;
  }

  function normalizeUrlRules(value) {
    if (!Array.isArray(value)) return [];
    const rules = [];
    const ids = new Set();
    for (const source of value.slice(0, MAX_URL_RULES)) {
      const rule = normalizeUrlRule(source);
      if (!rule || ids.has(rule.id)) continue;
      ids.add(rule.id);
      rules.push(rule);
    }
    return rules;
  }

  function urlRuleMatches(rule, value) {
    const clean = normalizeUrlRule(rule);
    if (!clean || clean.enabled === false) return false;
    let url;
    try {
      url = value instanceof URL ? value : new URL(value);
    } catch (_) {
      return false;
    }
    const hostname = url.hostname.toLowerCase();
    if (clean.type === 'hostname') return hostname === clean.pattern;
    if (clean.type === 'wildcard') return hostname.endsWith(`.${clean.pattern.slice(2)}`);
    if (clean.type === 'prefix') {
      const separator = clean.pattern.indexOf('/');
      const ruleHost = clean.pattern.slice(0, separator);
      const pathPrefix = clean.pattern.slice(separator, -1);
      const pathBase = pathPrefix.length > 1 && pathPrefix.endsWith('/') ? pathPrefix.slice(0, -1) : pathPrefix;
      return hostname === ruleHost && (url.pathname === pathBase || url.pathname.startsWith(pathPrefix));
    }
    const comparable = new URL(url.href);
    comparable.hash = '';
    return comparable.href === clean.pattern;
  }

  function resolveUrlSettings(value, rules, hostnameSettings, defaultSettings) {
    for (const rule of Array.isArray(rules) ? rules : []) {
      if (!urlRuleMatches(rule, value)) continue;
      if (rule.action === 'exclude') {
        return { settings: null, rule, source: 'exclude', excluded: true };
      }
      const settings = normalizeSiteSettings(rule.settings);
      if (settings) return { settings, rule, source: 'rule', excluded: false };
    }
    if (normalizeSiteSettings(hostnameSettings)) {
      return { settings: hostnameSettings, rule: null, source: 'hostname', excluded: false };
    }
    if (normalizeSiteSettings(defaultSettings)) {
      return { settings: defaultSettings, rule: null, source: 'default', excluded: false };
    }
    return { settings: null, rule: null, source: 'none', excluded: false };
  }

  function normalizeEffectUrl(value) {
    if (typeof value !== 'string') return null;
    let candidate = value.trim();
    if (!candidate || candidate.length > MAX_URL_CHARS) return null;
    if (!/^[a-z][a-z\d+.-]*:/i.test(candidate)) candidate = `https://${candidate}`;
    try {
      const url = new URL(candidate);
      const localHttp = url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]', '::1'].includes(url.hostname);
      if (url.protocol !== 'https:' && !localHttp) return null;
      if (url.username || url.password) return null;
      return url.href;
    } catch (_) {
      return null;
    }
  }

  function normalizeCustomEffect(entry, options = {}) {
    if (!isPlainObject(entry)) return null;
    const type = entry.type === 'url' ? 'url' : entry.type === 'code' || entry.type == null ? 'code' : null;
    if (!type) return null;
    const clean = {
      id: trimString(entry.id, 100),
      name: trimString(entry.name, MAX_EFFECT_NAME_CHARS) || options.fallbackName || 'Untitled Effect',
      type,
      code: '',
      url: '',
      interactive: !!entry.interactive,
      updatedAt: clampNumber(entry.updatedAt, 0, Number.MAX_SAFE_INTEGER, Date.now())
    };
    if (type === 'code') {
      if (typeof entry.code !== 'string' || entry.code.length > MAX_EFFECT_CODE_CHARS) return null;
      clean.code = entry.code;
    } else {
      const url = normalizeEffectUrl(entry.url);
      if (!url) return null;
      clean.url = url;
    }
    return clean;
  }

  function normalizeCustomEffects(value) {
    if (!Array.isArray(value)) return [];
    return value.slice(0, MAX_CUSTOM_EFFECTS).map((entry) => normalizeCustomEffect(entry)).filter(Boolean);
  }

  function normalizePresetColors(value) {
    const clean = { light: [], dark: [] };
    if (!isPlainObject(value)) return clean;
    for (const mode of ['light', 'dark']) {
      if (!Array.isArray(value[mode])) continue;
      clean[mode] = value[mode].slice(0, 50).filter((color) => typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color));
    }
    return clean;
  }

  function normalizeConfigPreset(entry) {
    if (!isPlainObject(entry)) return null;
    const id = trimString(entry.id, 100);
    const name = trimString(entry.name, 80).trim();
    const settings = normalizeSiteSettings(entry.settings);
    if (!id || !/^[a-zA-Z0-9_-]+$/.test(id) || !name || !settings) return null;
    return {
      id,
      name,
      settings,
      createdAt: clampNumber(entry.createdAt, 0, Number.MAX_SAFE_INTEGER, Date.now()),
      updatedAt: clampNumber(entry.updatedAt, 0, Number.MAX_SAFE_INTEGER, Date.now())
    };
  }

  function normalizeConfigPresets(value) {
    if (!Array.isArray(value)) return [];
    const presets = [];
    const ids = new Set();
    for (const source of value.slice(0, MAX_CONFIG_PRESETS)) {
      const preset = normalizeConfigPreset(source);
      if (!preset || ids.has(preset.id)) continue;
      ids.add(preset.id);
      presets.push(preset);
    }
    return presets;
  }

  function normalizeSiteGroup(entry) {
    if (!isPlainObject(entry)) return null;
    const id = trimString(entry.id, 100);
    const name = trimString(entry.name, 80).trim();
    if (!id || !/^[a-zA-Z0-9_-]+$/.test(id) || !name || !Array.isArray(entry.sites)) return null;
    if (entry.sites.length > MAX_GROUP_SITES) return null;
    const sites = [];
    const seen = new Set();
    for (const site of entry.sites) {
      if (!isSiteKeyName(site) || seen.has(site)) return null;
      seen.add(site);
      sites.push(site);
    }
    return {
      id,
      name,
      sites,
      createdAt: clampNumber(entry.createdAt, 0, Number.MAX_SAFE_INTEGER, Date.now()),
      updatedAt: clampNumber(entry.updatedAt, 0, Number.MAX_SAFE_INTEGER, Date.now())
    };
  }

  function normalizeSiteGroups(value) {
    if (!Array.isArray(value)) return [];
    const groups = [];
    const ids = new Set();
    for (const source of value.slice(0, MAX_SITE_GROUPS)) {
      const group = normalizeSiteGroup(source);
      if (!group || ids.has(group.id)) continue;
      ids.add(group.id);
      groups.push(group);
    }
    return groups;
  }

  function buildBackup(storage, appVersion) {
    const source = isPlainObject(storage) ? storage : {};
    const sites = Object.create(null);
    for (const [key, value] of Object.entries(source)) {
      if (!isSiteKeyName(key) || !isPlainObject(value) || !Object.prototype.hasOwnProperty.call(value, 'type')) continue;
      const normalized = normalizeSiteSettings(value);
      if (!normalized) throw new Error(`Invalid or oversized site configuration: ${key}`);
      sites[key] = normalized;
    }
    const defaultSource = source[KEYS.defaultBackground];
    const defaultBackground = normalizeSiteSettings(defaultSource);
    if (defaultSource !== null && defaultSource !== undefined && !defaultBackground) {
      throw new Error('Invalid or oversized default background configuration.');
    }
    const rawUrlRules = source[KEYS.urlRules];
    const urlRules = normalizeUrlRules(rawUrlRules);
    if (rawUrlRules !== undefined && (!Array.isArray(rawUrlRules) || rawUrlRules.length > MAX_URL_RULES || urlRules.length !== rawUrlRules.length)) {
      throw new Error('Invalid or oversized URL rules collection.');
    }
    const rawConfigPresets = source[KEYS.configPresets];
    const configPresets = normalizeConfigPresets(rawConfigPresets);
    if (rawConfigPresets !== undefined && (!Array.isArray(rawConfigPresets) || rawConfigPresets.length > MAX_CONFIG_PRESETS || configPresets.length !== rawConfigPresets.length)) {
      throw new Error('Invalid or oversized configuration presets collection.');
    }
    const rawSiteGroups = source[KEYS.siteGroups];
    const siteGroups = normalizeSiteGroups(rawSiteGroups);
    if (rawSiteGroups !== undefined && (!Array.isArray(rawSiteGroups) || rawSiteGroups.length > MAX_SITE_GROUPS || siteGroups.length !== rawSiteGroups.length)) {
      throw new Error('Invalid or oversized site groups collection.');
    }
    return {
      schemaVersion: BACKUP_SCHEMA_VERSION,
      appVersion: trimString(appVersion, 40),
      exportedAt: new Date().toISOString(),
      sites,
      urlRules,
      defaultBackground,
      customEffects: normalizeCustomEffects(source[KEYS.customEffects]),
      customPresetColors: normalizePresetColors(source[KEYS.customPresetColors]),
      configPresets,
      siteGroups
    };
  }

  function buildSelectedSitesBackup(storage, appVersion, selectedSites) {
    const backup = buildBackup(storage, appVersion);
    const selected = new Set(Array.isArray(selectedSites) ? selectedSites.filter(isSiteKeyName) : []);
    const sites = Object.create(null);
    for (const [key, settings] of Object.entries(backup.sites)) {
      if (selected.has(key)) sites[key] = settings;
    }
    return {
      ...backup,
      sites,
      urlRules: [],
      defaultBackground: null,
      customEffects: [],
      customPresetColors: { light: [], dark: [] },
      configPresets: [],
      siteGroups: backup.siteGroups
        .map((group) => ({ ...group, sites: group.sites.filter((site) => selected.has(site)) }))
        .filter((group) => group.sites.length > 0),
      selectionOnly: true
    };
  }

  function prepareImport(payload) {
    if (!isPlainObject(payload)) throw new Error('Backup must be a JSON object.');
    const write = Object.create(null);
    const removeKeys = [];
    const siteKeys = [];

    if (Object.prototype.hasOwnProperty.call(payload, 'schemaVersion')) {
      if (![1, 2, BACKUP_SCHEMA_VERSION].includes(payload.schemaVersion) || !isPlainObject(payload.sites)) {
        throw new Error('Unsupported or invalid PageDye backup schema.');
      }
      const siteEntries = Object.entries(payload.sites);
      if (siteEntries.length > 1000) throw new Error('Backup contains too many site configurations.');
      for (const [key, value] of siteEntries) {
        const normalized = normalizeSiteSettings(value);
        if (!isSiteSettingsKey(key, normalized)) throw new Error(`Invalid site configuration key: ${key}`);
        write[key] = normalized;
        siteKeys.push(key);
      }
      if (payload.schemaVersion >= 2) {
        if (!Array.isArray(payload.urlRules) || payload.urlRules.length > MAX_URL_RULES) {
          throw new Error('Invalid URL rules collection.');
        }
        const urlRules = normalizeUrlRules(payload.urlRules);
        if (urlRules.length !== payload.urlRules.length) throw new Error('Invalid or duplicate URL rule.');
        write[KEYS.urlRules] = urlRules;
      } else {
        removeKeys.push(KEYS.urlRules);
      }
      const defaultSettings = normalizeSiteSettings(payload.defaultBackground);
      if (payload.defaultBackground !== null && payload.defaultBackground !== undefined && !defaultSettings) {
        throw new Error('Invalid default background configuration.');
      }
      if (defaultSettings) write[KEYS.defaultBackground] = defaultSettings;
      else removeKeys.push(KEYS.defaultBackground);

      if (!Array.isArray(payload.customEffects) || payload.customEffects.length > MAX_CUSTOM_EFFECTS) {
        throw new Error('Invalid custom effects collection.');
      }
      const effects = [];
      const effectIds = new Set();
      for (const entry of payload.customEffects) {
        const effect = normalizeCustomEffect(entry);
        if (!effect || !effect.id || effectIds.has(effect.id)) throw new Error('Invalid or duplicate custom effect.');
        effectIds.add(effect.id);
        effects.push(effect);
      }
      write[KEYS.customEffects] = effects;
      if (!isPlainObject(payload.customPresetColors)) throw new Error('Invalid custom preset colors.');
      write[KEYS.customPresetColors] = normalizePresetColors(payload.customPresetColors);
      if (payload.schemaVersion >= 3) {
        if (!Array.isArray(payload.configPresets) || payload.configPresets.length > MAX_CONFIG_PRESETS) {
          throw new Error('Invalid configuration presets collection.');
        }
        const presets = normalizeConfigPresets(payload.configPresets);
        if (presets.length !== payload.configPresets.length) throw new Error('Invalid or duplicate configuration preset.');
        write[KEYS.configPresets] = presets;

        if (!Array.isArray(payload.siteGroups) || payload.siteGroups.length > MAX_SITE_GROUPS) {
          throw new Error('Invalid site groups collection.');
        }
        const groups = normalizeSiteGroups(payload.siteGroups);
        if (groups.length !== payload.siteGroups.length) throw new Error('Invalid or duplicate site group.');
        write[KEYS.siteGroups] = groups;
      } else {
        removeKeys.push(KEYS.configPresets, KEYS.siteGroups);
      }
    } else {
      if (!Object.prototype.hasOwnProperty.call(payload, KEYS.urlRules)) removeKeys.push(KEYS.urlRules);
      for (const [key, value] of Object.entries(payload)) {
        if (isSiteKeyName(key) && isPlainObject(value) && Object.prototype.hasOwnProperty.call(value, 'type')) {
          const normalized = normalizeSiteSettings(value);
          if (!normalized) throw new Error(`Invalid or oversized site configuration: ${key}`);
          write[key] = normalized;
          siteKeys.push(key);
        } else if (key === KEYS.defaultBackground) {
          const normalized = normalizeSiteSettings(value);
          if (normalized) write[key] = normalized;
        } else if (key === KEYS.customEffects) {
          write[key] = normalizeCustomEffects(value);
        } else if (key === KEYS.customPresetColors) {
          write[key] = normalizePresetColors(value);
        } else if (key === KEYS.urlRules) {
          const urlRules = normalizeUrlRules(value);
          if (!Array.isArray(value) || urlRules.length !== value.length) throw new Error('Invalid URL rules collection.');
          write[key] = urlRules;
        } else if (key === KEYS.configPresets) {
          const presets = normalizeConfigPresets(value);
          if (!Array.isArray(value) || presets.length !== value.length) throw new Error('Invalid configuration presets collection.');
          write[key] = presets;
        } else if (key === KEYS.siteGroups) {
          const groups = normalizeSiteGroups(value);
          if (!Array.isArray(value) || groups.length !== value.length) throw new Error('Invalid site groups collection.');
          write[key] = groups;
        }
      }
      if (!siteKeys.length && !Object.keys(write).some((key) => BACKUP_GLOBAL_KEYS.has(key))) {
        throw new Error('No supported PageDye settings were found.');
      }
    }

    return { write, removeKeys, siteKeys, replaceSiteConfigs: true };
  }

  return Object.freeze({
    BACKUP_SCHEMA_VERSION,
    MAX_BACKUP_BYTES,
    MAX_EFFECT_FILE_BYTES,
    MAX_EFFECT_CODE_CHARS,
    MAX_EFFECT_NAME_CHARS,
    MAX_CUSTOM_EFFECTS,
    MAX_URL_RULES,
    MAX_CONFIG_PRESETS,
    MAX_SITE_GROUPS,
    MAX_GROUP_SITES,
    MAX_URL_CHARS,
    MAX_IMAGE_VALUE_CHARS,
    KEYS,
    isPlainObject,
    isSiteSettingsKey,
    normalizeSiteSettings,
    normalizeRulePattern,
    normalizeUrlRule,
    normalizeUrlRules,
    urlRuleMatches,
    resolveUrlSettings,
    normalizeEffectUrl,
    normalizeCustomEffect,
    normalizeCustomEffects,
    normalizePresetColors,
    normalizeConfigPreset,
    normalizeConfigPresets,
    normalizeSiteGroup,
    normalizeSiteGroups,
    buildBackup,
    buildSelectedSitesBackup,
    prepareImport
  });
});
