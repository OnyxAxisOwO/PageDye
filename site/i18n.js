(function () {
  const STORAGE_KEY = 'pagedye_site_lang';
  const FALLBACK_LANG = 'en';
  const DEFAULT_ORDER = ['zh-CN', 'en', 'ja', 'ko', 'de', 'fr', 'es', 'pt', 'it', 'ru'];

  const rawMessages = window.PAGEDYE_I18N_MESSAGES || {};
  const fallback = rawMessages[FALLBACK_LANG] || {};

  function toRootLang(input) {
    if (!input) return '';
    const normalized = String(input).toLowerCase().replace('_', '-');
    const explicitMap = {
      'zh-cn': 'zh-CN',
      'zh-hans': 'zh-CN',
      'zh-hant': 'zh-CN',
      'en-us': 'en',
      'en-gb': 'en',
      'ja-jp': 'ja',
      'ko-kr': 'ko',
      'de-de': 'de',
      'fr-fr': 'fr',
      'es-es': 'es',
      'es-mx': 'es',
      'pt-br': 'pt',
      'pt-pt': 'pt',
      'it-it': 'it',
      'ru-ru': 'ru'
    };

    if (rawMessages[normalized]) return normalized;
    if (explicitMap[normalized]) return explicitMap[normalized];

    const root = normalized.split('-')[0];
    return rawMessages[root] ? root : '';
  }

  function getPreferredLang() {
    const saved = localStorage.getItem(STORAGE_KEY);
    const fromStorage = toRootLang(saved);
    if (fromStorage) return fromStorage;

    const browserList = Array.from(navigator.languages || [navigator.language || navigator.userLanguage || 'en']);
    for (const code of browserList) {
      const mapped = toRootLang(code);
      if (mapped) return mapped;
      if (rawMessages[code]) return code;
    }

    return FALLBACK_LANG;
  }

  function deepMerge(base, override) {
    if (!override) return base;
    const result = Array.isArray(base) ? base.slice() : { ...base };
    Object.keys(override).forEach((key) => {
      const ov = override[key];
      const bs = result[key];
      if (ov && typeof ov === 'object' && !Array.isArray(ov) && bs && typeof bs === 'object' && !Array.isArray(bs)) {
        result[key] = deepMerge(bs, ov);
      } else {
        result[key] = ov;
      }
    });
    return result;
  }

  function getMessage(pack, key) {
    return key.split('.').reduce((acc, seg) => (acc && acc[seg] != null ? acc[seg] : undefined), pack);
  }

  function resolvePack(lang) {
    return deepMerge(fallback, rawMessages[lang] || {});
  }

  function setLangHtml(lang) {
    const htmlLang = lang === 'zh-CN' ? 'zh-CN' : lang;
    document.documentElement.setAttribute('lang', htmlLang);
  }

  function renderText(node, text, isHtml) {
    if (!node || text === undefined || text === null) return;
    if (node.tagName === 'META' && node.getAttribute('name') === 'description') {
      node.setAttribute('content', text);
      return;
    }
    if (node.tagName === 'TITLE' || node.id === 'lang-switch-label') {
      node.textContent = text;
      return;
    }
    if (isHtml) {
      node.innerHTML = text;
    } else {
      node.textContent = text;
    }
  }

  function buildSwitcherLabels(pack) {
    const selector = document.getElementById('lang-switch');
    if (!selector) return;

    const langKeyMap = {
      'zh-CN': 'zh-CN',
      en: 'en',
      ja: 'ja',
      ko: 'ko',
      de: 'de',
      fr: 'fr',
      es: 'es',
      pt: 'pt',
      it: 'it',
      ru: 'ru'
    };

    const baseLang = langKeyMap[pack._code] || pack._code;

    Array.from(selector.options).forEach((opt) => {
      const key = langKeyMap[opt.value] || opt.value;
      opt.textContent = getMessage(pack, `lang.${key}`) || getMessage(fallback, `lang.${key}`) || opt.textContent;
    });
    selector.value = baseLang;

    const label = document.getElementById('lang-switch-label');
    if (label) label.textContent = getMessage(pack, 'global.switchLanguage') || getMessage(fallback, 'global.switchLanguage');
  }

  function applyLocale(lang) {
    const pack = resolvePack(lang);
    pack._code = lang;

    setLangHtml(lang);

    const title = getMessage(pack, 'meta.title') || getMessage(fallback, 'meta.title');
    const description = getMessage(pack, 'meta.description') || getMessage(fallback, 'meta.description');
    const titleEl = document.querySelector('head > title');
    const descEl = document.querySelector('meta[name="description"]');
    if (titleEl) titleEl.textContent = title || '';
    if (descEl) descEl.setAttribute('content', description || '');

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const raw = getMessage(pack, key) || getMessage(fallback, key);
      const isHtml = el.hasAttribute('data-i18n-html');
      renderText(el, raw, isHtml);
    });

    buildSwitcherLabels(pack);

    localStorage.setItem(STORAGE_KEY, lang);
  }

  function initSwitcher() {
    const selector = document.getElementById('lang-switch');
    if (!selector) return;

    selector.addEventListener('change', () => {
      applyLocale(selector.value);
    });
  }

  function bootstrap() {
    const lang = getPreferredLang();
    applyLocale(lang);
    initSwitcher();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
  } else {
    bootstrap();
  }
})();
