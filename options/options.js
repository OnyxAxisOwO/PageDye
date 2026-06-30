document.addEventListener('DOMContentLoaded', async () => {
  const i18n = {
    en: {
      title: "PageDye Dashboard",
      appName: "PageDye",
      navSites: "Configured Sites",
      navBackup: "Backup & Restore",
      navAbout: "About",
      sitesTitle: "Configured Sites",
      sitesHint: "Manage settings for specific websites. You can remove configurations individually.",
      searchPlaceholder: "Search domains...",
      thDomain: "Domain",
      thBgType: "Background Type",
      thPreview: "Preview",
      thActions: "Actions",
      noSites: "No websites configured yet.",
      bgTypeNone: "None",
      bgTypeColor: "Color",
      bgTypeImage: "Image",
      deleteBtn: "Delete",
      confirmDelete: "Are you sure you want to delete settings for {domain}?",
      backupTitle: "Backup & Restore",
      backupHint: "Export all site configurations (including local images) as a JSON file, or import from a previous backup.",
      exportCardTitle: "Export Backup",
      exportCardText: "Save all website background settings and custom styles into a backup file.",
      exportBtn: "Export Configs",
      importCardTitle: "Import Backup",
      importCardText: "Restore background settings from a previously saved JSON backup file.",
      importBtn: "Import Configs",
      dangerZoneTitle: "Danger Zone",
      dangerZoneText: "These operations cannot be undone. Please be careful.",
      clearAllBtn: "Wipe All Configurations",
      clearAllConfirm: "Remove PageDye settings for ALL websites? This cannot be undone.",
      clearAllDone: "All sites cleared!",
      aboutTitle: "About PageDye",
      aboutText: "PageDye is a browser extension that allows you to dye any webpage's background with your choice of color or custom image. You can adjust opacity, blur, repetition, element selector, and even inject custom CSS for complete control over readability and design.",
      aboutAuthor: "Developer",
      aboutGithub: "Source Code",
      exportSuccess: "Backup exported successfully!",
      importSuccess: "Backup imported successfully!",
      importError: "Invalid backup file!",
      confirmImport: "Importing will overwrite all current settings. Continue?",
      settings: "Settings"
    },
    zh: {
      title: "PageDye 控制面板",
      appName: "PageDye",
      navSites: "已配置网站",
      navBackup: "备份与恢复",
      navAbout: "关于 PageDye",
      sitesTitle: "已配置网站列表",
      sitesHint: "管理各个网站的背景配置。您可以单独删除某个网站的配置。",
      searchPlaceholder: "搜索域名...",
      thDomain: "域名",
      thBgType: "背景类型",
      thPreview: "预览",
      thActions: "操作",
      noSites: "暂无已配置的网站。",
      bgTypeNone: "无",
      bgTypeColor: "纯色",
      bgTypeImage: "图片",
      deleteBtn: "删除",
      confirmDelete: "确定要删除 {domain} 的配置吗？",
      backupTitle: "备份与恢复",
      backupHint: "将所有网站配置（包括本地图片）导出为 JSON 文件，或从之前的备份中导入。",
      exportCardTitle: "导出备份",
      exportCardText: "将所有网站背景设置和自定义 CSS 样式保存为一个备份文件。",
      exportBtn: "导出配置",
      importCardTitle: "导入备份",
      importCardText: "从之前保存的 JSON 备份文件中恢复所有背景设置。",
      importBtn: "导入配置",
      dangerZoneTitle: "危险区域",
      dangerZoneText: "以下操作无法撤销，请谨慎操作。",
      clearAllBtn: "清除全部网站配置",
      clearAllConfirm: "确定要清除所有网站的 PageDye 设置吗？此操作无法撤销。",
      clearAllDone: "已清除全部网站!",
      aboutTitle: "关于 PageDye",
      aboutText: "PageDye 是一款能够为您定制任何网页背景的浏览器插件。您可以使用纯色或自定义图片作为背景，并能自由调整不透明度、模糊度、平铺方式，甚至能使用元素选择器和自定义 CSS，让页面背景更符合您的阅读习惯与个性偏好。",
      aboutAuthor: "开发者",
      aboutGithub: "项目源码",
      exportSuccess: "备份导出成功!",
      importSuccess: "备份导入成功!",
      importError: "无效的备份文件!",
      confirmImport: "导入将覆盖当前所有配置。确定要继续吗？",
      settings: "设置"
    }
  };

  let lang = 'en';

  // Elements
  const els = {
    navItems: document.querySelectorAll('.nav-item'),
    sections: document.querySelectorAll('.content-section'),
    versionLabel: document.getElementById('version'),
    aboutVersion: document.getElementById('about-version'),
    sitesListBody: document.getElementById('sites-list-body'),
    noSitesMsg: document.getElementById('no-sites-msg'),
    searchInput: document.getElementById('search-input'),
    exportBtn: document.getElementById('export-btn'),
    importBtn: document.getElementById('import-btn'),
    importFile: document.getElementById('import-file'),
    clearAllBtn: document.getElementById('clear-all-btn'),
    statusMsg: document.getElementById('status-msg')
  };

  // Init translations & versions
  initI18n();
  const extensionVersion = 'v' + chrome.runtime.getManifest().version;
  if (els.versionLabel) els.versionLabel.textContent = extensionVersion;
  if (els.aboutVersion) els.aboutVersion.textContent = extensionVersion;

  // Load configured sites
  await loadSitesList();

  // Sidebar navigation switching
  els.navItems.forEach(item => {
    item.addEventListener('click', () => {
      els.navItems.forEach(i => i.classList.remove('active'));
      els.sections.forEach(s => s.classList.remove('active'));
      
      item.classList.add('active');
      const targetId = item.dataset.target;
      document.getElementById(targetId).classList.add('active');
    });
  });

  // Search input filter
  els.searchInput.addEventListener('input', () => {
    filterSites(els.searchInput.value.toLowerCase().trim());
  });

  // Backup: Export Configs
  els.exportBtn.addEventListener('click', exportConfigs);

  // Backup: Import Trigger & Action
  els.importBtn.addEventListener('click', () => els.importFile.click());
  els.importFile.addEventListener('change', importConfigs);

  // Backup: Clear all
  els.clearAllBtn.addEventListener('click', clearAllSites);

  // Helper functions
  function initI18n() {
    const browserLang = navigator.language || navigator.userLanguage; 
    if (browserLang.toLowerCase().startsWith('zh')) {
      lang = 'zh';
    } else {
      lang = 'en';
    }
    
    // Set tab title
    document.title = t('title');

    // Translate elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (i18n[lang][key]) {
        el.textContent = i18n[lang][key];
      }
    });

    // Translate inputs with data-i18n-placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (i18n[lang][key]) {
        el.placeholder = i18n[lang][key];
      }
    });
  }

  function t(key) {
    return i18n[lang][key] || key;
  }

  async function loadSitesList() {
    els.sitesListBody.innerHTML = '';
    const data = await chrome.storage.local.get(null);
    
    // Filter out potential non-domain configuration keys
    const domains = Object.keys(data).filter(key => {
      const val = data[key];
      return val && typeof val === 'object' && val.type !== undefined;
    });

    if (domains.length === 0) {
      els.noSitesMsg.classList.remove('hidden');
      document.querySelector('.sites-table').classList.add('hidden');
      return;
    }

    els.noSitesMsg.classList.add('hidden');
    document.querySelector('.sites-table').classList.remove('hidden');

    // Sort domain keys alphabetically
    domains.sort().forEach(domain => {
      const settings = data[domain];
      const tr = document.createElement('tr');
      tr.dataset.domain = domain.toLowerCase();

      // 1. Domain column
      const tdDomain = document.createElement('td');
      tdDomain.textContent = domain;
      tdDomain.style.fontWeight = '500';
      tr.appendChild(tdDomain);

      // 2. Background Type badge column
      const tdBgType = document.createElement('td');
      const badge = document.createElement('span');
      badge.className = `bg-type-badge ${settings.type}`;
      
      let typeText = t('bgTypeNone');
      if (settings.type === 'color') typeText = t('bgTypeColor');
      if (settings.type === 'image') typeText = t('bgTypeImage');
      
      badge.textContent = typeText;
      tdBgType.appendChild(badge);
      tr.appendChild(tdBgType);

      // 3. Preview Swatch column
      const tdPreview = document.createElement('td');
      const swatch = document.createElement('div');
      swatch.className = 'preview-swatch';
      if (settings.type === 'color') {
        swatch.style.backgroundColor = settings.value;
      } else if (settings.type === 'image' && settings.value) {
        swatch.style.backgroundImage = `url('${settings.value}')`;
      }
      tdPreview.appendChild(swatch);
      tr.appendChild(tdPreview);

      // 4. Actions column (Delete button)
      const tdActions = document.createElement('td');
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'icon-btn-danger';
      deleteBtn.title = t('deleteBtn');
      deleteBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          <line x1="10" y1="11" x2="10" y2="17"></line>
          <line x1="14" y1="11" x2="14" y2="17"></line>
        </svg>
      `;
      deleteBtn.addEventListener('click', async () => {
        const confirmMsg = t('confirmDelete').replace('{domain}', domain);
        if (confirm(confirmMsg)) {
          await chrome.storage.local.remove(domain);
          await loadSitesList();
          showStatus(t('clearAllDone')); // reuse standard status
        }
      });
      tdActions.appendChild(deleteBtn);
      tr.appendChild(tdActions);

      els.sitesListBody.appendChild(tr);
    });
  }

  function filterSites(query) {
    const rows = els.sitesListBody.querySelectorAll('tr');
    let visibleCount = 0;

    rows.forEach(row => {
      const domain = row.dataset.domain;
      if (domain.includes(query)) {
        row.classList.remove('hidden');
        visibleCount++;
      } else {
        row.classList.add('hidden');
      }
    });

    if (visibleCount === 0) {
      els.noSitesMsg.classList.remove('hidden');
      document.querySelector('.sites-table').classList.add('hidden');
    } else {
      els.noSitesMsg.classList.add('hidden');
      document.querySelector('.sites-table').classList.remove('hidden');
    }
  }

  async function exportConfigs() {
    try {
      const data = await chrome.storage.local.get(null);
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pagedye_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showStatus(t('exportSuccess'));
    } catch (err) {
      console.error(err);
    }
  }

  function importConfigs(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (typeof importedData !== 'object' || importedData === null) {
          showStatus(t('importError'));
          return;
        }

        if (!confirm(t('confirmImport'))) return;

        await chrome.storage.local.clear();
        await chrome.storage.local.set(importedData);

        await loadSitesList();
        showStatus(t('importSuccess'));
      } catch (err) {
        console.error(err);
        showStatus(t('importError'));
      } finally {
        els.importFile.value = '';
      }
    };
    reader.readAsText(file);
  }

  async function clearAllSites() {
    if (!confirm(t('clearAllConfirm'))) return;
    await chrome.storage.local.clear();
    await loadSitesList();
    showStatus(t('clearAllDone'));
  }

  function showStatus(msg) {
    els.statusMsg.textContent = msg;
    els.statusMsg.classList.remove('hidden');
    setTimeout(() => els.statusMsg.classList.add('hidden'), 2000);
  }
});
