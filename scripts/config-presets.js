(function (root) {
  'use strict';

  const base = {
    mode: 'single',
    type: 'color',
    value: '#F4F7F6',
    opacity: 100,
    blur: 0,
    style: { fixed: true, size: 'cover', repeat: false },
    targetSelector: '',
    deepCompat: false,
    deepCompatAggressive: false,
    deepCompatExclude: '',
    frostedGlass: [],
    customCss: ''
  };

  function settings(overrides) {
    return Object.assign({}, base, overrides, {
      style: Object.assign({}, base.style, overrides && overrides.style)
    });
  }

  const BUILT_INS = Object.freeze([
    {
      id: 'builtin-light-aurora',
      names: { en: 'Light Aurora', zh: '浅色极光' },
      settings: settings({
        type: 'color', value: '#F3FBFA', effectEnabled: true, effect: 'aurora',
        effectColorScheme: 'custom', effectColor: '#2D9C91', effectBgColor: '#F3FBFA',
        effectDensity: 38, effectSpeed: 24
      })
    },
    {
      id: 'builtin-dark-aurora',
      names: { en: 'Dark Aurora', zh: '深色极光' },
      settings: settings({
        type: 'color', value: '#071A1D', effectEnabled: true, effect: 'aurora',
        effectColorScheme: 'custom', effectColor: '#70D6C8', effectBgColor: '#071A1D',
        effectDensity: 46, effectSpeed: 32
      })
    },
    {
      id: 'builtin-day',
      names: { en: 'Day', zh: '日间' },
      settings: settings({
        type: 'color', value: '#F4F9FA', opacity: 100, effectEnabled: true, effect: 'particles',
        effectColorScheme: 'custom', effectColor: '#2D817A', effectBgColor: '#F4F9FA',
        effectDensity: 28, effectSpeed: 20
      })
    },
    {
      id: 'builtin-night',
      names: { en: 'Night', zh: '夜间' },
      settings: settings({
        type: 'color', value: '#101516', opacity: 96, effectEnabled: true, effect: 'particles',
        effectColorScheme: 'custom', effectColor: '#80D5D1', effectBgColor: '#101516',
        effectDensity: 32, effectSpeed: 18
      })
    }
  ]);

  function language() {
    return (navigator.language || 'en').toLowerCase().startsWith('zh') ? 'zh' : 'en';
  }

  function displayName(preset) {
    return preset.names ? (preset.names[language()] || preset.names.en) : preset.name;
  }

  function cloneSettings(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function settingsForApply(value) {
    const next = cloneSettings(value);
    const migrateLayer = (layer) => {
      if (!layer || typeof layer !== 'object') return;
      if (layer.type === 'effect') {
        layer.type = 'none';
        layer.effectEnabled = true;
        layer.effect = layer.effect || layer.effectKind || layer.value || 'waves';
        layer.value = '';
      }
      delete layer.effectKind;
    };

    migrateLayer(next);
    migrateLayer(next.light);
    migrateLayer(next.dark);
    if (next.timeRange && Array.isArray(next.timeRange.items)) next.timeRange.items.forEach(migrateLayer);
    if (next.slideshow && Array.isArray(next.slideshow.items)) next.slideshow.items.forEach(migrateLayer);
    return next;
  }

  function previewStyle(value) {
    const layer = value && value.mode === 'auto' ? (value.dark || value.light || value) : value;
    if (!layer) return { background: '#DDE5E3' };
    const kind = layer.effect || layer.effectKind || layer.value || 'effect';
    const auroraBg = layer.effectBgColor || layer.value || '';
    const lightAurora = /^#(?:[\da-f]{6})$/i.test(auroraBg) &&
      (parseInt(auroraBg.slice(1, 3), 16) * 299 + parseInt(auroraBg.slice(3, 5), 16) * 587 + parseInt(auroraBg.slice(5, 7), 16) * 114) / 1000 > 170;
    const particleBg = /^#[\da-f]{6}$/i.test(layer.effectBgColor || '') ? layer.effectBgColor : '#1B1724';
    const particleColor = /^#[\da-f]{6}$/i.test(layer.effectColor || '') ? layer.effectColor : '#FFB35C';
    const effectPreviews = {
      aurora: lightAurora
        ? 'linear-gradient(135deg, #F3FBFA 8%, #BDE9E3 48%, #2D9C91 100%)'
        : 'linear-gradient(135deg, #071A1D 8%, #1E5B62 48%, #70D6C8 100%)',
      particles: `radial-gradient(circle at 25% 30%, ${particleColor} 0 2px, transparent 3px), radial-gradient(circle at 72% 62%, ${particleColor} 0 2px, transparent 3px), ${particleBg}`
    };
    if (layer.type === 'effect' || layer.effectEnabled) {
      return { background: effectPreviews[kind] || 'linear-gradient(135deg, #1B2425, #667876)' };
    }
    if (layer.type === 'image' && typeof layer.value === 'string' && layer.value) {
      const escaped = layer.value.replace(/["\\\n\r]/g, '');
      return { backgroundImage: `url("${escaped}")`, backgroundColor: '#18201F' };
    }
    if (layer.type === 'color' && layer.colorMode === 'gradient' && layer.gradient && root.PageDyeGradient) {
      return { backgroundImage: root.PageDyeGradient.buildGradientCss(layer.gradient), backgroundColor: layer.value || '#18201F' };
    }
    if (layer.type === 'color') return { background: layer.value || '#DDE5E3' };
    return { background: effectPreviews[kind] || 'linear-gradient(135deg, #1B2425, #667876)' };
  }

  root.PageDyeConfigPresets = Object.freeze({
    BUILT_INS,
    language,
    displayName,
    cloneSettings,
    settingsForApply,
    previewStyle
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
