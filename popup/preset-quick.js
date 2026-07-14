document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const schema = window.PageDyeStorage;
  const presetApi = window.PageDyeConfigPresets;
  const select = document.getElementById('quick-preset-select');
  const applyButton = document.getElementById('quick-preset-apply');
  const saveButton = document.getElementById('quick-preset-save');
  const manageButton = document.getElementById('quick-preset-manage');
  const status = document.getElementById('quick-preset-status');
  if (!schema || !presetApi || !select) return;

  const zh = presetApi.language() === 'zh';
  const copy = zh ? {
    label: '预设', apply: '应用', saveCurrent: '保存', manage: '管理预设',
    customGroup: '我的预设', builtInGroup: '内置预设',
    saved: '已把当前站点保存为“{name}”', applied: '已应用“{name}”',
    noSettings: '当前页面还没有可保存的配置', unavailable: '此页面无法使用预设',
    limit: '最多可保存 100 个自定义预设'
  } : {
    label: 'Preset', apply: 'Apply', saveCurrent: 'Save', manage: 'Manage presets',
    customGroup: 'My presets', builtInGroup: 'Built-in presets',
    saved: 'Saved this site as “{name}”', applied: 'Applied “{name}”',
    noSettings: 'This page has no configuration to save yet', unavailable: 'Presets are unavailable on this page',
    limit: 'You can save up to 100 custom presets'
  };

  let activeTab = null;
  let activeUrl = null;
  let hostname = '';
  let userPresets = [];

  function message(key, values = {}) {
    return Object.entries(values).reduce((value, [name, replacement]) => value.replace(`{${name}}`, replacement), copy[key] || key);
  }

  function translate() {
    document.querySelectorAll('[data-preset-i18n]').forEach((node) => { node.textContent = message(node.dataset.presetI18n); });
    document.querySelectorAll('[data-preset-i18n-title]').forEach((node) => {
      const value = message(node.dataset.presetI18nTitle);
      node.title = value;
      node.setAttribute('aria-label', value);
    });
  }

  function showStatus(value, error = false) {
    status.textContent = value;
    status.classList.toggle('error', error);
    status.classList.add('visible');
    clearTimeout(showStatus.timer);
    showStatus.timer = setTimeout(() => status.classList.remove('visible'), 2800);
  }

  function allPresets() {
    return [
      ...presetApi.BUILT_INS.map((preset) => ({ ...preset, name: presetApi.displayName(preset) })),
      ...userPresets
    ];
  }

  function fillSelect() {
    const current = select.value;
    select.replaceChildren();
    const addGroup = (label, presets) => {
      const group = document.createElement('optgroup');
      group.label = label;
      presets.forEach((preset) => {
        const option = document.createElement('option');
        option.value = preset.id;
        option.textContent = preset.name || presetApi.displayName(preset);
        group.appendChild(option);
      });
      select.appendChild(group);
    };
    addGroup(copy.builtInGroup, presetApi.BUILT_INS);
    if (userPresets.length) addGroup(copy.customGroup, userPresets);
    if ([...select.options].some((option) => option.value === current)) select.value = current;
  }

  async function getContext() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    activeTab = tabs[0] || null;
    try {
      activeUrl = new URL(activeTab && activeTab.url);
      if (!['http:', 'https:'].includes(activeUrl.protocol)) throw new Error('unsupported');
      hostname = activeUrl.hostname;
    } catch (_) {
      activeUrl = null;
      hostname = '';
      applyButton.disabled = true;
      saveButton.disabled = true;
      showStatus(copy.unavailable, true);
    }
  }

  async function loadPresets() {
    const data = await chrome.storage.local.get(schema.KEYS.configPresets);
    userPresets = schema.normalizeConfigPresets(data[schema.KEYS.configPresets]);
    fillSelect();
  }

  async function resolveCurrent() {
    if (!activeUrl || !hostname) return { data: {}, result: null, rules: [] };
    const data = await chrome.storage.local.get([hostname, schema.KEYS.defaultBackground, schema.KEYS.urlRules]);
    const rules = schema.normalizeUrlRules(data[schema.KEYS.urlRules]);
    const result = schema.resolveUrlSettings(activeUrl.href, rules, data[hostname], data[schema.KEYS.defaultBackground]);
    return { data, result, rules };
  }

  async function applyPreset() {
    const preset = allPresets().find((item) => item.id === select.value);
    if (!preset || !activeUrl) return;
    applyButton.disabled = true;
    try {
      if (window.PageDyePopupPresets) await window.PageDyePopupPresets.beforeApply();
      const { result, rules } = await resolveCurrent();
      const settings = presetApi.settingsForApply(preset.settings);
      if (result && result.source === 'rule' && result.rule && result.rule.action === 'apply') {
        const index = rules.findIndex((rule) => rule.id === result.rule.id);
        rules[index] = { ...rules[index], settings };
        await chrome.storage.local.set({ [schema.KEYS.urlRules]: rules });
      } else {
        await chrome.storage.local.set({ [hostname]: settings });
      }
      if (window.PageDyePopupPresets) await window.PageDyePopupPresets.refresh();
      if (activeTab && activeTab.id && window.PageDyeInjection) {
        try {
          await window.PageDyeInjection.ensure(activeTab.id);
          await window.PageDyeInjection.send(activeTab.id, { action: 'updateBackground', settings });
        } catch (_) {
          // Storage remains the source of truth; restricted pages apply on their next eligible load.
        }
      }
      showStatus(message('applied', { name: preset.name }));
    } catch (error) {
      showStatus(error.message || String(error), true);
    } finally {
      applyButton.disabled = false;
    }
  }

  async function saveCurrentAsPreset() {
    if (!activeUrl) return;
    saveButton.disabled = true;
    try {
      const { result } = await resolveCurrent();
      if (!result || !result.settings) return showStatus(copy.noSettings, true);
      const data = await chrome.storage.local.get(schema.KEYS.configPresets);
      const presets = schema.normalizeConfigPresets(data[schema.KEYS.configPresets]);
      if (presets.length >= schema.MAX_CONFIG_PRESETS) return showStatus(copy.limit, true);
      const now = Date.now();
      const time = new Intl.DateTimeFormat(zh ? 'zh-CN' : 'en', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(now);
      const name = `${hostname} · ${time}`;
      const random = globalThis.crypto && crypto.randomUUID ? crypto.randomUUID() : `${now}_${Math.random().toString(36).slice(2)}`;
      const preset = schema.normalizeConfigPreset({
        id: `preset_${random.replace(/[^a-zA-Z0-9_-]/g, '')}`,
        name,
        settings: result.settings,
        createdAt: now,
        updatedAt: now
      });
      presets.push(preset);
      await chrome.storage.local.set({ [schema.KEYS.configPresets]: presets });
      userPresets = presets;
      fillSelect();
      select.value = preset.id;
      showStatus(message('saved', { name }));
    } catch (error) {
      showStatus(error.message || String(error), true);
    } finally {
      saveButton.disabled = false;
    }
  }

  translate();
  applyButton.addEventListener('click', applyPreset);
  saveButton.addEventListener('click', saveCurrentAsPreset);
  manageButton.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('options/options.html#section-configs') });
  });
  Promise.all([getContext(), loadPresets()]).catch((error) => showStatus(error.message || String(error), true));
});
