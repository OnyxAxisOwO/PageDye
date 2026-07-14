document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const schema = window.PageDyeStorage;
  const presetApi = window.PageDyeConfigPresets;
  if (!schema || !presetApi) return;

  const zh = presetApi.language() === 'zh';
  const messages = {
    en: {
      nav: 'Presets & Groups', title: 'Presets & Groups',
      subtitle: 'Reuse complete configurations and manage several sites together.',
      exportSelected: 'Export selected', importSelected: 'Import selected',
      presetsTitle: 'Configuration presets',
      presetsHint: 'A preset includes wallpaper, effects, frosted glass, compatibility, cursor, and custom CSS settings.',
      presetName: 'Preset name', presetNamePlaceholder: 'My preset', presetSource: 'Copy from site',
      savePreset: 'Save preset', builtIn: 'Built-in', custom: 'Custom', deletePreset: 'Delete preset',
      applySelected: 'Apply selected', sitesTitle: 'Site groups and batch actions',
      selectSitesHint: 'Select sites, then choose one action.', selectedCount: '{count} site(s) selected',
      showGroup: 'Show group', allSites: 'All sites', applyPreset: 'Apply preset', apply: 'Apply',
      copyConfig: 'Copy site configuration', copyToSelected: 'Copy to selected', siteGroup: 'Site group',
      addToGroup: 'Add', removeFromGroup: 'Remove', newGroup: 'New group from selected',
      deleteGroup: 'Delete group', confirmDeleteGroup: 'Delete group "{name}"? Sites will keep their configurations.',
      groupNamePlaceholder: 'Work', createGroup: 'Create', domain: 'Domain', groups: 'Groups',
      configuration: 'Configuration', noSites: 'No configured sites.', noGroup: 'No group',
      chooseImportSites: 'Choose sites to import', cancel: 'Cancel', importChosen: 'Import chosen sites',
      typeNone: 'None', typeColor: 'Color', typeImage: 'Image', typeEffect: 'Effect',
      savedPreset: 'Preset saved.', applied: 'Configuration applied to {count} site(s).',
      copied: 'Configuration copied to {count} site(s).', groupCreated: 'Group created.',
      groupUpdated: 'Group updated.', exported: 'Selected sites exported.', imported: '{count} site(s) imported.',
      invalidFile: 'This is not a valid PageDye backup.', chooseSite: 'Choose at least one site first.',
      confirmDeletePreset: 'Delete preset "{name}"?', delete: 'Delete', presetDeleted: 'Preset deleted.'
    },
    zh: {
      nav: '预设与分组', title: '预设与站点分组',
      subtitle: '复用完整配置，并一次管理多个站点。',
      exportSelected: '导出选中站点', importSelected: '导入选中站点',
      presetsTitle: '配置预设', presetsHint: '预设包含壁纸、动效、磨砂玻璃、兼容模式、光标和自定义 CSS 等完整设置。',
      presetName: '预设名称', presetNamePlaceholder: '我的预设', presetSource: '复制自站点',
      savePreset: '保存预设', builtIn: '内置', custom: '自定义', deletePreset: '删除预设',
      applySelected: '应用到选中站点', sitesTitle: '站点分组与批量操作',
      selectSitesHint: '先选择站点，再执行一个批量操作。', selectedCount: '已选择 {count} 个站点',
      showGroup: '显示分组', allSites: '全部站点', applyPreset: '应用预设', apply: '应用',
      copyConfig: '复制站点配置', copyToSelected: '复制到选中站点', siteGroup: '站点分组',
      addToGroup: '加入', removeFromGroup: '移出', newGroup: '用选中站点新建分组',
      deleteGroup: '删除分组', confirmDeleteGroup: '删除分组“{name}”？站点配置会保留。',
      groupNamePlaceholder: '工作', createGroup: '新建', domain: '站点', groups: '分组',
      configuration: '配置', noSites: '暂无已配置站点。', noGroup: '未分组',
      chooseImportSites: '选择要导入的站点', cancel: '取消', importChosen: '导入选中站点',
      typeNone: '无', typeColor: '颜色', typeImage: '图片', typeEffect: '动效',
      savedPreset: '预设已保存。', applied: '已应用到 {count} 个站点。',
      copied: '已复制到 {count} 个站点。', groupCreated: '分组已创建。',
      groupUpdated: '分组已更新。', exported: '选中站点已导出。', imported: '已导入 {count} 个站点。',
      invalidFile: '这不是有效的 PageDye 备份文件。', chooseSite: '请先选择至少一个站点。',
      confirmDeletePreset: '删除预设“{name}”？', delete: '删除', presetDeleted: '预设已删除。'
    }
  }[zh ? 'zh' : 'en'];

  const el = Object.fromEntries([
    'config-export-selected', 'config-import-open', 'config-import-file', 'config-save-preset-form',
    'config-preset-name', 'config-preset-source', 'config-presets-grid', 'config-selection-summary',
    'config-group-filter', 'config-apply-preset', 'config-apply-btn', 'config-copy-source',
    'config-copy-btn', 'config-group-select', 'config-add-group-btn', 'config-remove-group-btn', 'config-delete-group-btn',
    'config-create-group-form', 'config-new-group-name', 'config-select-all', 'config-sites-body',
    'config-sites-empty', 'config-import-panel', 'config-import-file-name', 'config-import-list',
    'config-import-cancel', 'config-import-confirm'
  ].map((id) => [id.replace(/^config-/, '').replace(/-([a-z])/g, (_, char) => char.toUpperCase()), document.getElementById(id)]));

  let storageData = {};
  let sites = {};
  let presets = [];
  let groups = [];
  let selectedSites = new Set();
  let pendingImport = null;

  function text(key, values = {}) {
    return Object.entries(values).reduce((value, [name, replacement]) => value.replace(`{${name}}`, replacement), messages[key] || key);
  }

  function translate() {
    document.querySelectorAll('[data-config-i18n]').forEach((node) => {
      node.textContent = text(node.dataset.configI18n);
    });
    document.querySelectorAll('[data-config-i18n-placeholder]').forEach((node) => {
      node.placeholder = text(node.dataset.configI18nPlaceholder);
    });
    el.selectAll.setAttribute('aria-label', zh ? '选择全部站点' : 'Select all sites');
  }

  function uid(prefix) {
    const random = globalThis.crypto && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    return `${prefix}_${random.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  }

  function toast(message, isError = false) {
    const status = document.getElementById('status-msg');
    if (!status) return;
    status.textContent = message;
    status.classList.remove('hidden');
    status.style.background = isError ? '#991b1b' : '';
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => {
      status.classList.add('hidden');
      status.style.background = '';
    }, 2600);
  }

  function siteType(settings) {
    return text(`type${(settings.type || 'none').charAt(0).toUpperCase()}${(settings.type || 'none').slice(1)}`);
  }

  function allPresets() {
    return [
      ...presetApi.BUILT_INS.map((preset) => ({ ...preset, name: presetApi.displayName(preset), builtIn: true })),
      ...presets.map((preset) => ({ ...preset, builtIn: false }))
    ];
  }

  function presetById(id) {
    return allPresets().find((preset) => preset.id === id);
  }

  function applyPreview(node, settings) {
    const style = presetApi.previewStyle(settings);
    node.removeAttribute('style');
    Object.assign(node.style, style);
  }

  function fillSelect(select, options, currentValue) {
    if (!select) return;
    select.replaceChildren();
    options.forEach(({ value, label }) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      select.appendChild(option);
    });
    if (options.some((option) => option.value === currentValue)) select.value = currentValue;
  }

  async function load() {
    storageData = await chrome.storage.local.get(null);
    sites = Object.fromEntries(Object.entries(storageData).filter(([key, value]) => schema.isSiteSettingsKey(key, value)));
    presets = schema.normalizeConfigPresets(storageData[schema.KEYS.configPresets]);
    groups = schema.normalizeSiteGroups(storageData[schema.KEYS.siteGroups]);
    selectedSites = new Set([...selectedSites].filter((site) => Object.hasOwn(sites, site)));
    render();
  }

  function render() {
    renderSelects();
    renderPresets();
    renderSites();
    updateSelectionUi();
  }

  function renderSelects() {
    const siteOptions = Object.keys(sites).sort().map((site) => ({ value: site, label: site }));
    const presetOptions = allPresets().map((preset) => ({ value: preset.id, label: preset.name }));
    const groupOptions = groups.map((group) => ({ value: group.id, label: group.name }));
    fillSelect(el.presetSource, siteOptions, el.presetSource.value);
    fillSelect(el.copySource, siteOptions, el.copySource.value);
    fillSelect(el.applyPreset, presetOptions, el.applyPreset.value);
    fillSelect(el.groupSelect, groupOptions.length ? groupOptions : [{ value: '', label: text('noGroup') }], el.groupSelect.value);
    fillSelect(el.groupFilter, [{ value: '', label: text('allSites') }, ...groupOptions], el.groupFilter.value);
    el.savePresetForm.querySelector('button').disabled = siteOptions.length === 0;
  }

  function renderPresets() {
    el.presetsGrid.replaceChildren();
    allPresets().forEach((preset) => {
      const card = document.createElement('article');
      card.className = 'config-preset-card';
      const preview = document.createElement('div');
      preview.className = 'config-preset-preview';
      applyPreview(preview, preset.settings);
      const info = document.createElement('div');
      info.className = 'config-preset-info';
      const row = document.createElement('div');
      row.className = 'config-preset-name-row';
      const name = document.createElement('strong');
      name.textContent = preset.name;
      const kind = document.createElement('span');
      kind.className = 'config-preset-kind';
      kind.textContent = preset.builtIn ? text('builtIn') : text('custom');
      row.append(name, kind);
      const actions = document.createElement('div');
      actions.className = 'config-preset-card-actions';
      const apply = document.createElement('button');
      apply.type = 'button';
      apply.className = 'btn secondary-btn';
      apply.textContent = text('applySelected');
      apply.disabled = selectedSites.size === 0;
      apply.addEventListener('click', () => applyPresetToSelected(preset));
      actions.appendChild(apply);
      if (!preset.builtIn) {
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'btn secondary-btn config-icon-btn';
        remove.textContent = '×';
        remove.title = text('deletePreset');
        remove.setAttribute('aria-label', text('deletePreset'));
        remove.addEventListener('click', () => deletePreset(preset));
        actions.appendChild(remove);
      }
      info.append(row, actions);
      card.append(preview, info);
      el.presetsGrid.appendChild(card);
    });
  }

  function visibleSiteNames() {
    const group = groups.find((item) => item.id === el.groupFilter.value);
    const allowed = group ? new Set(group.sites) : null;
    return Object.keys(sites).filter((site) => !allowed || allowed.has(site)).sort();
  }

  function renderSites() {
    el.sitesBody.replaceChildren();
    const visible = visibleSiteNames();
    el.sitesEmpty.classList.toggle('hidden', visible.length > 0);
    visible.forEach((site) => {
      const settings = sites[site];
      const row = document.createElement('tr');
      const checkCell = document.createElement('td');
      checkCell.className = 'config-check-cell';
      const check = document.createElement('input');
      check.type = 'checkbox';
      check.checked = selectedSites.has(site);
      check.setAttribute('aria-label', `${text('domain')}: ${site}`);
      check.addEventListener('change', () => {
        if (check.checked) selectedSites.add(site); else selectedSites.delete(site);
        updateSelectionUi();
        renderPresets();
      });
      checkCell.appendChild(check);
      const domainCell = document.createElement('td');
      domainCell.className = 'config-site-domain';
      domainCell.textContent = site;
      const groupCell = document.createElement('td');
      const tags = document.createElement('div');
      tags.className = 'config-group-tags';
      const memberships = groups.filter((group) => group.sites.includes(site));
      memberships.forEach((group) => {
        const tag = document.createElement('span');
        tag.className = 'config-group-tag';
        tag.textContent = group.name;
        tags.appendChild(tag);
      });
      if (!memberships.length) tags.textContent = text('noGroup');
      groupCell.appendChild(tags);
      const typeCell = document.createElement('td');
      typeCell.className = 'config-type-cell';
      const mini = document.createElement('span');
      mini.className = 'config-mini-preview';
      applyPreview(mini, settings);
      const label = document.createElement('span');
      label.textContent = siteType(settings);
      typeCell.append(mini, label);
      row.append(checkCell, domainCell, groupCell, typeCell);
      el.sitesBody.appendChild(row);
    });
  }

  function updateSelectionUi() {
    const count = selectedSites.size;
    el.selectionSummary.textContent = count ? text('selectedCount', { count }) : text('selectSitesHint');
    [el.exportSelected, el.applyBtn, el.copyBtn].forEach((button) => {
      button.disabled = count === 0;
    });
    el.addGroupBtn.disabled = count === 0 || groups.length === 0;
    el.removeGroupBtn.disabled = count === 0 || groups.length === 0;
    el.deleteGroupBtn.disabled = groups.length === 0;
    el.createGroupForm.querySelector('button').disabled = count === 0;
    const visible = visibleSiteNames();
    const checked = visible.filter((site) => selectedSites.has(site)).length;
    el.selectAll.checked = visible.length > 0 && checked === visible.length;
    el.selectAll.indeterminate = checked > 0 && checked < visible.length;
  }

  async function savePreset(event) {
    event.preventDefault();
    const source = el.presetSource.value;
    const name = el.presetName.value.trim();
    if (!source || !name || !sites[source]) return;
    const now = Date.now();
    const preset = schema.normalizeConfigPreset({ id: uid('preset'), name, settings: sites[source], createdAt: now, updatedAt: now });
    presets.push(preset);
    await chrome.storage.local.set({ [schema.KEYS.configPresets]: presets });
    el.presetName.value = '';
    await load();
    toast(text('savedPreset'));
  }

  async function deletePreset(preset) {
    if (!confirm(text('confirmDeletePreset', { name: preset.name }))) return;
    presets = presets.filter((item) => item.id !== preset.id);
    await chrome.storage.local.set({ [schema.KEYS.configPresets]: presets });
    await load();
    toast(text('presetDeleted'));
  }

  async function applyPresetToSelected(preset) {
    if (!selectedSites.size) return toast(text('chooseSite'), true);
    if (!preset || !preset.settings) return;
    const settings = presetApi.settingsForApply(preset.settings);
    const write = {};
    selectedSites.forEach((site) => { write[site] = presetApi.cloneSettings(settings); });
    await chrome.storage.local.set(write);
    await load();
    toast(text('applied', { count: selectedSites.size }));
  }

  async function copyToSelected() {
    const source = el.copySource.value;
    if (!sites[source] || !selectedSites.size) return;
    const write = {};
    selectedSites.forEach((site) => { write[site] = presetApi.cloneSettings(sites[source]); });
    await chrome.storage.local.set(write);
    await load();
    toast(text('copied', { count: selectedSites.size }));
  }

  async function createGroup(event) {
    event.preventDefault();
    const name = el.newGroupName.value.trim();
    if (!name || !selectedSites.size || groups.length >= schema.MAX_SITE_GROUPS) return;
    const now = Date.now();
    groups.push({ id: uid('group'), name, sites: [...selectedSites], createdAt: now, updatedAt: now });
    await chrome.storage.local.set({ [schema.KEYS.siteGroups]: groups });
    el.newGroupName.value = '';
    await load();
    toast(text('groupCreated'));
  }

  async function updateGroup(add) {
    const id = el.groupSelect.value;
    const group = groups.find((item) => item.id === id);
    if (!group || !selectedSites.size) return;
    const next = new Set(group.sites);
    selectedSites.forEach((site) => add ? next.add(site) : next.delete(site));
    group.sites = [...next];
    group.updatedAt = Date.now();
    await chrome.storage.local.set({ [schema.KEYS.siteGroups]: groups });
    await load();
    toast(text('groupUpdated'));
  }

  async function deleteGroup() {
    const group = groups.find((item) => item.id === el.groupSelect.value);
    if (!group || !confirm(text('confirmDeleteGroup', { name: group.name }))) return;
    groups = groups.filter((item) => item.id !== group.id);
    await chrome.storage.local.set({ [schema.KEYS.siteGroups]: groups });
    await load();
    toast(text('groupUpdated'));
  }

  function downloadJson(payload, filename) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function exportSelected() {
    if (!selectedSites.size) return;
    const backup = schema.buildSelectedSitesBackup(storageData, chrome.runtime.getManifest().version, [...selectedSites]);
    downloadJson(backup, `pagedye-sites-${new Date().toISOString().slice(0, 10)}.json`);
    toast(text('exported'));
  }

  async function readImportFile(event) {
    const file = event.target.files && event.target.files[0];
    event.target.value = '';
    if (!file || file.size > schema.MAX_BACKUP_BYTES) return toast(text('invalidFile'), true);
    try {
      const payload = JSON.parse(await file.text());
      const prepared = schema.prepareImport(payload);
      const importSites = prepared.siteKeys.filter((site) => prepared.write[site]);
      if (!importSites.length) throw new Error('No sites');
      pendingImport = { prepared, payload, selected: new Set(importSites) };
      el.importFileName.textContent = file.name;
      renderImportList(importSites);
      el.importPanel.classList.remove('hidden');
      el.importPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (_) {
      pendingImport = null;
      toast(text('invalidFile'), true);
    }
  }

  function renderImportList(siteNames) {
    el.importList.replaceChildren();
    siteNames.forEach((site) => {
      const label = document.createElement('label');
      label.className = 'config-import-option';
      const check = document.createElement('input');
      check.type = 'checkbox';
      check.checked = pendingImport.selected.has(site);
      check.addEventListener('change', () => {
        if (check.checked) pendingImport.selected.add(site); else pendingImport.selected.delete(site);
        el.importConfirm.disabled = pendingImport.selected.size === 0;
      });
      const name = document.createElement('span');
      name.textContent = site;
      label.append(check, name);
      el.importList.appendChild(label);
    });
    el.importConfirm.disabled = pendingImport.selected.size === 0;
  }

  function cancelImport() {
    pendingImport = null;
    el.importPanel.classList.add('hidden');
    el.importList.replaceChildren();
  }

  async function confirmImport() {
    if (!pendingImport || !pendingImport.selected.size) return;
    const write = {};
    pendingImport.selected.forEach((site) => { write[site] = pendingImport.prepared.write[site]; });
    const importedGroups = pendingImport.prepared.write[schema.KEYS.siteGroups] || [];
    if (importedGroups.length) {
      const merged = schema.normalizeSiteGroups(storageData[schema.KEYS.siteGroups]);
      importedGroups.forEach((incoming) => {
        const chosen = incoming.sites.filter((site) => pendingImport.selected.has(site));
        if (!chosen.length) return;
        const existing = merged.find((group) => group.id === incoming.id || group.name === incoming.name);
        if (existing) existing.sites = [...new Set([...existing.sites, ...chosen])];
        else merged.push({ ...incoming, sites: chosen });
      });
      write[schema.KEYS.siteGroups] = schema.normalizeSiteGroups(merged);
    }
    const count = pendingImport.selected.size;
    await chrome.storage.local.set(write);
    cancelImport();
    await load();
    toast(text('imported', { count }));
  }

  translate();
  el.savePresetForm.addEventListener('submit', savePreset);
  el.applyBtn.addEventListener('click', () => applyPresetToSelected(presetById(el.applyPreset.value)));
  el.copyBtn.addEventListener('click', copyToSelected);
  el.createGroupForm.addEventListener('submit', createGroup);
  el.addGroupBtn.addEventListener('click', () => updateGroup(true));
  el.removeGroupBtn.addEventListener('click', () => updateGroup(false));
  el.deleteGroupBtn.addEventListener('click', deleteGroup);
  el.groupFilter.addEventListener('change', () => { renderSites(); updateSelectionUi(); });
  el.selectAll.addEventListener('change', () => {
    visibleSiteNames().forEach((site) => el.selectAll.checked ? selectedSites.add(site) : selectedSites.delete(site));
    renderSites();
    renderPresets();
    updateSelectionUi();
  });
  el.exportSelected.addEventListener('click', exportSelected);
  el.importOpen.addEventListener('click', () => el.importFile.click());
  el.importFile.addEventListener('change', readImportFile);
  el.importCancel.addEventListener('click', cancelImport);
  el.importConfirm.addEventListener('click', confirmImport);

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (Object.keys(changes).some((key) => key === schema.KEYS.configPresets || key === schema.KEYS.siteGroups ||
      schema.isSiteSettingsKey(key, changes[key].newValue) || schema.isSiteSettingsKey(key, changes[key].oldValue))) {
      load().catch((error) => toast(error.message || String(error), true));
    }
  });

  load().catch((error) => toast(error.message || String(error), true));
  if (location.hash === '#section-configs') {
    document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.target === 'section-configs'));
    document.querySelectorAll('.content-section').forEach((section) => section.classList.toggle('active', section.id === 'section-configs'));
  }
});
