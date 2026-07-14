(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.PageDyeStorageManager = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const DATA_IMAGE_RE = /^data:image\/([a-z0-9.+-]+)(?:;[^,]*)?,/i;

  function getSchema(schema) {
    return schema || (root && root.PageDyeStorage);
  }

  function utf8Bytes(value) {
    const text = String(value == null ? '' : value);
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(text).byteLength;
    if (typeof Buffer !== 'undefined') return Buffer.byteLength(text, 'utf8');
    return unescape(encodeURIComponent(text)).length;
  }

  function jsonBytes(value) {
    try {
      return utf8Bytes(JSON.stringify(value));
    } catch (_) {
      return 0;
    }
  }

  function isLocalImage(value) {
    return typeof value === 'string' && DATA_IMAGE_RE.test(value);
  }

  function imageMime(value) {
    const match = typeof value === 'string' ? value.match(DATA_IMAGE_RE) : null;
    return match ? `image/${match[1].toLowerCase()}` : '';
  }

  function dataUrlBytes(value) {
    if (!isLocalImage(value)) return 0;
    const comma = value.indexOf(',');
    const header = value.slice(0, comma);
    const payload = value.slice(comma + 1);
    if (/;base64(?:;|$)/i.test(header)) {
      const clean = payload.replace(/\s/g, '');
      const padding = clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0;
      return Math.max(0, Math.floor(clean.length * 3 / 4) - padding);
    }
    try {
      return utf8Bytes(decodeURIComponent(payload));
    } catch (_) {
      return utf8Bytes(payload);
    }
  }

  function fingerprint(value) {
    let first = 2166136261;
    let second = 2246822519;
    for (let index = 0; index < value.length; index += 1) {
      const code = value.charCodeAt(index);
      first = Math.imul(first ^ code, 16777619);
      second = Math.imul(second ^ code, 3266489917);
    }
    return `${(first >>> 0).toString(16).padStart(8, '0')}${(second >>> 0).toString(16).padStart(8, '0')}`;
  }

  function formatBytes(value) {
    const bytes = Math.max(0, Number(value) || 0);
    if (bytes < 1024) return `${Math.round(bytes)} B`;
    const units = ['KB', 'MB', 'GB', 'TB'];
    let size = bytes / 1024;
    let unit = units[0];
    for (let index = 1; index < units.length && size >= 1024; index += 1) {
      size /= 1024;
      unit = units[index];
    }
    const digits = size >= 100 ? 0 : size >= 10 ? 1 : 2;
    return `${size.toFixed(digits)} ${unit}`;
  }

  function ownerKey(type, id) {
    return `${type}:${id}`;
  }

  function analyze(storage, schemaOverride) {
    const schema = getSchema(schemaOverride);
    if (!schema) throw new Error('PageDye storage schema is unavailable.');
    const source = storage && typeof storage === 'object' && !Array.isArray(storage) ? storage : {};
    const images = [];
    const owners = new Map();

    function ensureOwner(owner, totalBytes) {
      const id = ownerKey(owner.type, owner.id);
      if (!owners.has(id)) {
        owners.set(id, {
          id,
          ownerId: owner.id,
          label: owner.label,
          type: owner.type,
          site: owner.site || '',
          totalBytes: Math.max(0, totalBytes || 0),
          imageBytes: 0,
          imageCount: 0,
          referencedImageCount: 0
        });
      }
      return owners.get(id);
    }

    function addImage(rootKey, path, layer, active, owner, location) {
      if (!layer || !isLocalImage(layer.value)) return;
      const value = layer.value;
      const bytes = dataUrlBytes(value);
      const storageBytes = utf8Bytes(value);
      const record = {
        id: `${rootKey}:${path.join('.')}`,
        rootKey,
        path: path.slice(),
        ownerId: ownerKey(owner.type, owner.id),
        owner: owner.label,
        ownerType: owner.type,
        site: owner.site || '',
        location,
        active: !!active && layer.type === 'image',
        referenced: layer.type === 'image',
        removable: true,
        dataUrl: value,
        mime: imageMime(value),
        bytes,
        storageBytes,
        fingerprint: fingerprint(value),
        duplicateCount: 1
      };
      images.push(record);
      const summary = ensureOwner(owner);
      summary.imageBytes += storageBytes;
      summary.imageCount += 1;
      if (record.referenced) summary.referencedImageCount += 1;
    }

    function scanSettings(rootKey, path, settings, owner) {
      if (!settings || typeof settings !== 'object') return;
      const mode = ['auto', 'timeRange', 'slideshow'].includes(settings.mode) ? settings.mode : 'single';
      addImage(rootKey, path.concat('value'), settings, mode === 'single', owner, 'single');
      if (settings.light && typeof settings.light === 'object') {
        addImage(rootKey, path.concat('light', 'value'), settings.light, mode === 'auto', owner, 'light');
      }
      if (settings.dark && typeof settings.dark === 'object') {
        addImage(rootKey, path.concat('dark', 'value'), settings.dark, mode === 'auto', owner, 'dark');
      }
      const timeItems = settings.timeRange && Array.isArray(settings.timeRange.items) ? settings.timeRange.items : [];
      timeItems.forEach((layer, index) => addImage(
        rootKey,
        path.concat('timeRange', 'items', index, 'value'),
        layer,
        mode === 'timeRange',
        owner,
        layer && layer.name ? `time: ${layer.name}` : `time ${index + 1}`
      ));
      const slideItems = settings.slideshow && Array.isArray(settings.slideshow.items) ? settings.slideshow.items : [];
      slideItems.forEach((layer, index) => addImage(
        rootKey,
        path.concat('slideshow', 'items', index, 'value'),
        layer,
        mode === 'slideshow',
        owner,
        `slide ${index + 1}`
      ));
    }

    for (const [key, value] of Object.entries(source)) {
      if (!schema.isSiteSettingsKey(key, value)) continue;
      const owner = { id: key, label: key, type: 'site', site: key };
      ensureOwner(owner, jsonBytes({ [key]: value }));
      scanSettings(key, [], value, owner);
    }

    const defaultKey = schema.KEYS.defaultBackground;
    if (source[defaultKey] && schema.normalizeSiteSettings(source[defaultKey])) {
      const owner = { id: defaultKey, label: 'Default background', type: 'default' };
      ensureOwner(owner, jsonBytes({ [defaultKey]: source[defaultKey] }));
      scanSettings(defaultKey, [], source[defaultKey], owner);
    }

    const rulesKey = schema.KEYS.urlRules;
    const rawRules = Array.isArray(source[rulesKey]) ? source[rulesKey] : [];
    rawRules.forEach((rule, index) => {
      const clean = schema.normalizeUrlRule(rule);
      if (!clean || clean.action !== 'apply' || !rule.settings) return;
      const owner = {
        id: clean.id,
        label: clean.pattern,
        type: 'rule',
        site: clean.pattern
      };
      ensureOwner(owner, jsonBytes(rule));
      scanSettings(rulesKey, [index, 'settings'], rule.settings, owner);
    });

    const presetsKey = schema.KEYS.configPresets;
    const rawPresets = Array.isArray(source[presetsKey]) ? source[presetsKey] : [];
    rawPresets.forEach((preset, index) => {
      const clean = schema.normalizeConfigPreset(preset);
      if (!clean || !preset.settings) return;
      const owner = { id: clean.id, label: clean.name, type: 'preset' };
      ensureOwner(owner, jsonBytes(preset));
      scanSettings(presetsKey, [index, 'settings'], preset.settings, owner);
    });

    const themeKey = schema.KEYS.uiTheme;
    const theme = source[themeKey];
    if (theme && typeof theme === 'object') {
      const owner = { id: themeKey, label: 'Dashboard appearance', type: 'appearance' };
      ensureOwner(owner, jsonBytes({ [themeKey]: theme }));
      for (const field of ['pageBgImage', 'containerBgImage']) {
        const image = theme[field];
        if (!image || !isLocalImage(image.data)) continue;
        const shim = { type: 'image', value: image.data };
        addImage(themeKey, [field, 'data'], shim, true, owner, field === 'pageBgImage' ? 'page background' : 'panel background');
      }
    }

    const duplicateGroups = [];
    const byValue = new Map();
    images.forEach((record) => {
      if (!byValue.has(record.dataUrl)) byValue.set(record.dataUrl, []);
      byValue.get(record.dataUrl).push(record);
    });
    byValue.forEach((records) => {
      if (records.length < 2) return;
      records.forEach((record) => { record.duplicateCount = records.length; });
      duplicateGroups.push({
        fingerprint: records[0].fingerprint,
        bytes: records[0].bytes,
        storageBytes: records[0].storageBytes,
        count: records.length,
        reclaimableBytes: records[0].storageBytes * (records.length - 1),
        imageIds: records.map((record) => record.id),
        owners: [...new Set(records.map((record) => record.owner))]
      });
    });
    duplicateGroups.sort((a, b) => b.reclaimableBytes - a.reclaimableBytes);

    const imageStorageBytes = images.reduce((sum, record) => sum + record.storageBytes, 0);
    const unused = images.filter((record) => !record.referenced);
    const uniqueImageBytes = [...byValue.values()].reduce((sum, records) => sum + records[0].storageBytes, 0);
    const duplicateBytes = duplicateGroups.reduce((sum, group) => sum + group.reclaimableBytes, 0);
    const knownOwnerBytes = [...owners.values()].reduce((sum, owner) => sum + owner.totalBytes, 0);
    const estimatedTotalBytes = jsonBytes(source);
    if (estimatedTotalBytes > knownOwnerBytes) {
      ensureOwner({ id: 'other', label: 'Other PageDye data', type: 'other' }, estimatedTotalBytes - knownOwnerBytes);
    }

    return {
      images,
      owners: [...owners.values()].sort((a, b) => b.totalBytes - a.totalBytes),
      duplicateGroups,
      stats: {
        estimatedTotalBytes,
        imageStorageBytes,
        uniqueImageBytes,
        duplicateBytes,
        unusedBytes: unused.reduce((sum, record) => sum + record.storageBytes, 0),
        unusedCount: unused.length,
        imageCount: images.length,
        uniqueImageCount: byValue.size,
        duplicateGroupCount: duplicateGroups.length,
        ownerCount: owners.size
      }
    };
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function setAtPath(target, path, value) {
    if (!path.length) return;
    let cursor = target;
    for (let index = 0; index < path.length - 1; index += 1) {
      if (cursor == null) return;
      cursor = cursor[path[index]];
    }
    if (cursor != null) cursor[path[path.length - 1]] = value;
  }

  function patchReferences(storage, records, valueForRecord) {
    const write = Object.create(null);
    const clonedRoots = new Set();
    records.forEach((record) => {
      if (!record || !Object.prototype.hasOwnProperty.call(storage, record.rootKey)) return;
      if (!clonedRoots.has(record.rootKey)) {
        write[record.rootKey] = clone(storage[record.rootKey]);
        clonedRoots.add(record.rootKey);
      }
      setAtPath(write[record.rootKey], record.path, valueForRecord(record));
    });
    return write;
  }

  function removeUnreferenced(storage, imageIds, schemaOverride) {
    const selected = imageIds ? new Set(imageIds) : null;
    const analysis = analyze(storage, schemaOverride);
    const records = analysis.images.filter((record) => !record.referenced && record.removable && (!selected || selected.has(record.id)));
    return {
      write: patchReferences(storage, records, () => ''),
      removedCount: records.length,
      removedBytes: records.reduce((sum, record) => sum + record.storageBytes, 0)
    };
  }

  function replaceImages(storage, replacements, schemaOverride) {
    const map = replacements instanceof Map ? replacements : new Map(Object.entries(replacements || {}));
    const analysis = analyze(storage, schemaOverride);
    const records = analysis.images.filter((record) => map.has(record.dataUrl) && isLocalImage(map.get(record.dataUrl)));
    return {
      write: patchReferences(storage, records, (record) => map.get(record.dataUrl)),
      replacedCount: records.length,
      originalBytes: records.reduce((sum, record) => sum + record.storageBytes, 0),
      replacementBytes: records.reduce((sum, record) => sum + utf8Bytes(map.get(record.dataUrl)), 0)
    };
  }

  return Object.freeze({
    isLocalImage,
    imageMime,
    dataUrlBytes,
    utf8Bytes,
    jsonBytes,
    fingerprint,
    formatBytes,
    analyze,
    removeUnreferenced,
    replaceImages
  });
});
