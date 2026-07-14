(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.PageDyeStorage = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const BACKUP_SCHEMA_VERSION = 1;
  const MAX_BACKUP_BYTES = 64 * 1024 * 1024;
  const MAX_EFFECT_FILE_BYTES = 512 * 1024;
  const MAX_EFFECT_CODE_CHARS = 200000;
  const MAX_EFFECT_NAME_CHARS = 120;
  const MAX_CUSTOM_EFFECTS = 100;
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
    extensionEnabled: '__pagedye_extension_enabled__'
  });

  const RESERVED_KEYS = new Set(Object.values(KEYS));
  const BACKUP_GLOBAL_KEYS = new Set([
    KEYS.defaultBackground,
    KEYS.customEffects,
    KEYS.customPresetColors
  ]);
  const MODES = new Set(['single', 'auto', 'timeRange', 'slideshow']);
  const TYPES = new Set(['none', 'color', 'image', 'effect']);
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
    return {
      schemaVersion: BACKUP_SCHEMA_VERSION,
      appVersion: trimString(appVersion, 40),
      exportedAt: new Date().toISOString(),
      sites,
      defaultBackground,
      customEffects: normalizeCustomEffects(source[KEYS.customEffects]),
      customPresetColors: normalizePresetColors(source[KEYS.customPresetColors])
    };
  }

  function prepareImport(payload) {
    if (!isPlainObject(payload)) throw new Error('Backup must be a JSON object.');
    const write = Object.create(null);
    const removeKeys = [];
    const siteKeys = [];

    if (Object.prototype.hasOwnProperty.call(payload, 'schemaVersion')) {
      if (payload.schemaVersion !== BACKUP_SCHEMA_VERSION || !isPlainObject(payload.sites)) {
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
    } else {
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
    MAX_URL_CHARS,
    MAX_IMAGE_VALUE_CHARS,
    KEYS,
    isPlainObject,
    isSiteSettingsKey,
    normalizeSiteSettings,
    normalizeEffectUrl,
    normalizeCustomEffect,
    normalizeCustomEffects,
    normalizePresetColors,
    buildBackup,
    prepareImport
  });
});
