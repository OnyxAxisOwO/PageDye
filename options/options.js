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
      modalTitle: "Notification",
      confirmOk: "Confirm",
      confirmCancel: "Cancel",
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
      settings: "Settings",
      backToSites: "Back to Sites",
      editTitle: "Edit Configuration:",
      bgType: "Background Type",
      typeNone: "None",
      typeColor: "Color",
      typeImage: "Image",
      typeEffect: "Effects",
      effectKind: "Effect",
      effectKindHint: "A minimalist black & white animated wallpaper, rendered locally with Canvas — no external assets.",
      effectMatrix: "Matrix",
      effectParticles: "Particles",
      effectWaves: "Waves",
      effectStarfield: "Starfield",
      effectRipple: "Ripple",
      effectColor: "Color",
      effectBgColor: "Background Color",
      effectDensity: "Density",
      effectSpeed: "Speed",
      color: "Color",
      tabLocal: "Local File",
      tabUrl: "URL",
      dropText: "Click or Drop image here",
      opacity: "Opacity",
      blur: "Blur",
      fixed: "Fixed Position",
      sizeCover: "Cover",
      sizeContain: "Contain",
      sizeAuto: "Auto",
      repeat: "Repeat",
      reset: "Reset",
      save: "Save",
      saved: "Saved!",
      resetMsg: "Reset!",
      error: "Error saving!",
      tabWallpaper: "Wallpaper",
      tabFrostedGlass: "Frosted Glass",
      advanced: "Advanced Settings",
      targetSelector: "Background Selector",
      targetSelectorHint: "Pick an element (or type a CSS selector) and PageDye applies your color/image directly to that element instead of the whole page. Leave empty for a full-page background.",
      frostedGlass: "Frosted Glass",
      frostedGlassHint: "Pick a card/container element and PageDye makes its background semi-transparent and blurred, so your wallpaper shows through underneath it.",
      frostedBlur: "Blur",
      frostedOpacity: "Tint",
      customCss: "Custom CSS",
      customCssHint: "Injected into this site. Use !important to override stubborn styles.",
      autoScheme: "Auto Light/Dark",
      schemeLight: "Light Version",
      schemeDark: "Dark Version",
      wallpaperMode: "Wallpaper Mode",
      modeSingle: "Single",
      modeAuto: "Light/Dark",
      modeSlideshow: "Slideshow",
      rotationInterval: "Interval",
      intervalOpen: "Each Open",
      interval15m: "15 Mins",
      interval30m: "30 Mins",
      interval1h: "1 Hour",
      interval24h: "1 Day",
      randomOrder: "Random Order",
      wallpapersList: "Wallpapers",
      advancedFilters: "Advanced Filters",
      filtersReset: "Reset",
      filterBrightness: "Brightness",
      filterContrast: "Contrast",
      filterGrayscale: "Grayscale",
      filterHue: "Hue Rotate",
      filterInvert: "Invert",
      colorModeSolid: "Solid",
      colorModeGradient: "Gradient",
      gradientLinear: "Linear",
      gradientRadial: "Radial",
      gradientAngle: "Angle",
      gradientShape: "Shape",
      gradientShapeCircle: "Circle",
      gradientShapeEllipse: "Ellipse",
      gradientStops: "Color Stops",
      gradientAddStop: "+ Add Stop",
      gradientRemoveStop: "Remove stop",
      gradientPresets: "Style Palette",
      gradientExtractFromImage: "Extract from wallpaper",
      gradientExtractDisabledHint: "Set an image first to extract colors from it",
      gradientExtractFailed: "Couldn't read colors from this image",
      gradientGenerateFromColor: "Generate from color",
      gradientAnimated: "Animated",
      gradientSpeed: "Speed"
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
      bgTypeColor: "颜色",
      bgTypeImage: "图片",
      deleteBtn: "删除",
      confirmDelete: "确定要删除 {domain} 的配置吗？",
      modalTitle: "提示",
      confirmOk: "确定",
      confirmCancel: "取消",
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
      settings: "设置",
      backToSites: "返回网站列表",
      editTitle: "编辑配置:",
      bgType: "背景类型",
      typeNone: "无",
      typeColor: "颜色",
      typeImage: "图片",
      typeEffect: "动效",
      effectKind: "特效",
      effectKindHint: "极简黑白动态壁纸，完全通过 Canvas 本地渲染，不依赖任何外部资源。",
      effectMatrix: "代码雨",
      effectParticles: "粒子",
      effectWaves: "波浪",
      effectStarfield: "星空穿梭",
      effectRipple: "水波纹",
      effectColor: "颜色",
      effectBgColor: "背景颜色",
      effectDensity: "密度",
      effectSpeed: "速度",
      color: "颜色",
      tabLocal: "本地文件",
      tabUrl: "链接",
      dropText: "点击或拖拽图片到此处",
      opacity: "不透明度",
      blur: "模糊度",
      fixed: "固定背景",
      sizeCover: "覆盖 (Cover)",
      sizeContain: "包含 (Contain)",
      sizeAuto: "自动 (Auto)",
      repeat: "平铺",
      reset: "重置",
      save: "保存",
      saved: "已保存!",
      resetMsg: "已重置!",
      error: "保存失败!",
      tabWallpaper: "壁纸",
      tabFrostedGlass: "磨砂玻璃",
      advanced: "高级设置",
      targetSelector: "背景选择器",
      targetSelectorHint: "拾取一个元素（或手动输入 CSS 选择器），PageDye 会把颜色/图片直接应用到该元素，而不是整页。留空则为整页背景。",
      frostedGlass: "磨砂玻璃",
      frostedGlassHint: "拾取一个卡片/容器元素，PageDye 会让它的背景变为半透明并加上模糊效果，让底层的壁纸若隐若现地透上来。",
      frostedBlur: "模糊度",
      frostedOpacity: "透明度",
      customCss: "自定义 CSS",
      customCssHint: "将注入到本网站。可用 !important 覆盖顽固样式。",
      autoScheme: "昼夜双态联动",
      schemeLight: "日光版",
      schemeDark: "夜间版",
      wallpaperMode: "壁纸模式",
      modeSingle: "单一壁纸",
      modeAuto: "昼夜联动",
      modeSlideshow: "幻灯轮换",
      rotationInterval: "轮换间隔",
      intervalOpen: "每次打开",
      interval15m: "15分钟",
      interval30m: "30分钟",
      interval1h: "1小时",
      interval24h: "1天",
      randomOrder: "随机顺序",
      wallpapersList: "壁纸列表",
      advancedFilters: "高级滤镜",
      filtersReset: "重置",
      filterBrightness: "亮度",
      filterContrast: "对比度",
      filterGrayscale: "灰度",
      filterHue: "色相旋转",
      filterInvert: "反色",
      colorModeSolid: "纯色",
      colorModeGradient: "渐变",
      gradientLinear: "线性",
      gradientRadial: "径向",
      gradientAngle: "角度",
      gradientShape: "形状",
      gradientShapeCircle: "圆形",
      gradientShapeEllipse: "椭圆形",
      gradientStops: "颜色节点",
      gradientAddStop: "+ 添加节点",
      gradientRemoveStop: "删除此节点",
      gradientPresets: "风格调色板",
      gradientExtractFromImage: "从壁纸提取",
      gradientExtractDisabledHint: "请先设置图片才能提取颜色",
      gradientExtractFailed: "无法从该图片提取颜色",
      gradientGenerateFromColor: "从颜色生成",
      gradientAnimated: "流动动画",
      gradientSpeed: "速度"
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
    statusMsg: document.getElementById('status-msg'),

    // Edit site controls
    editWpModes: document.getElementsByName('edit-wpMode'),
    editSchemeCardsContainer: document.getElementById('edit-scheme-cards-container'),
    editCardSchemeLight: document.getElementById('edit-card-scheme-light'),
    editCardSchemeDark: document.getElementById('edit-card-scheme-dark'),
    editPreviewCardLight: document.getElementById('edit-preview-card-light'),
    editPreviewCardDark: document.getElementById('edit-preview-card-dark'),
    
    editSlideshowConfigPanel: document.getElementById('edit-slideshow-config-panel'),
    editSlideshowInterval: document.getElementById('edit-slideshow-interval'),
    editSlideshowRandom: document.getElementById('edit-slideshow-random'),
    editWallpapersGrid: document.getElementById('edit-wallpapers-grid'),
    editStatusDot: document.getElementById('edit-status-dot'),
    editStatusText: document.getElementById('edit-status-text'),
    editResetBtn: document.getElementById('edit-reset-btn')
  };

  // Init translations & versions
  initI18n();
  let editCssEditorController = initCustomCssEditor('edit-custom-css', 'edit-custom-css-editor');
  const editGradientKeyframesStyle = document.createElement('style');
  editGradientKeyframesStyle.textContent = window.PageDyeGradient.GRADIENT_KEYFRAMES_CSS;
  document.head.appendChild(editGradientKeyframesStyle);
  renderEditGradientPresetsGrid();
  const extensionVersion = 'v' + chrome.runtime.getManifest().version;
  if (els.versionLabel) els.versionLabel.textContent = extensionVersion;
  if (els.aboutVersion) els.aboutVersion.textContent = extensionVersion;
  const editVersionEl = document.getElementById('edit-version');
  if (editVersionEl) editVersionEl.textContent = extensionVersion;

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

      // 1. Domain column (clickable domain link)
      const tdDomain = document.createElement('td');
      const domainLink = document.createElement('button');
      domainLink.type = 'button';
      domainLink.className = 'domain-edit-link';
      domainLink.textContent = domain;
      domainLink.addEventListener('click', () => {
        openEditSite(domain);
      });
      tdDomain.appendChild(domainLink);
      tr.appendChild(tdDomain);

      // 2. Background Type badge column
      const tdBgType = document.createElement('td');
      const badge = document.createElement('span');
      
      let typeText = t('bgTypeNone');
      if (settings.mode === 'auto') {
        badge.className = 'bg-type-badge auto';
        typeText = t('autoScheme');
      } else if (settings.mode === 'slideshow') {
        badge.className = 'bg-type-badge slideshow';
        const count = settings.slideshow && settings.slideshow.items ? settings.slideshow.items.length : 0;
        typeText = `${t('modeSlideshow')} (${count})`;
      } else {
        badge.className = `bg-type-badge ${settings.type}`;
        if (settings.type === 'color') typeText = t('bgTypeColor');
        if (settings.type === 'image') typeText = t('bgTypeImage');
      }
      
      badge.textContent = typeText;
      tdBgType.appendChild(badge);
      tr.appendChild(tdBgType);

      // 3. Preview Swatch column (supports settings opacity)
      const tdPreview = document.createElement('td');
      
      if (settings.mode === 'auto') {
        const swatch = document.createElement('div');
        swatch.className = 'preview-swatch preview-swatch-auto';
        
        const lightSwatch = document.createElement('div');
        lightSwatch.className = 'swatch-half light-half';
        if (settings.light.type === 'color' && settings.light.colorMode === 'gradient' && settings.light.gradient) {
          lightSwatch.style.backgroundImage = window.PageDyeGradient.buildGradientCss(settings.light.gradient);
        } else if (settings.light.type === 'color') {
          lightSwatch.style.backgroundColor = settings.light.value;
        } else if (settings.light.type === 'image' && settings.light.value) {
          lightSwatch.style.backgroundImage = `url('${settings.light.value}')`;
        }
        lightSwatch.style.opacity = (settings.light.opacity !== undefined ? settings.light.opacity : 100) / 100;

        const darkSwatch = document.createElement('div');
        darkSwatch.className = 'swatch-half dark-half';
        if (settings.dark.type === 'color' && settings.dark.colorMode === 'gradient' && settings.dark.gradient) {
          darkSwatch.style.backgroundImage = window.PageDyeGradient.buildGradientCss(settings.dark.gradient);
        } else if (settings.dark.type === 'color') {
          darkSwatch.style.backgroundColor = settings.dark.value;
        } else if (settings.dark.type === 'image' && settings.dark.value) {
          darkSwatch.style.backgroundImage = `url('${settings.dark.value}')`;
        }
        darkSwatch.style.opacity = (settings.dark.opacity !== undefined ? settings.dark.opacity : 100) / 100;
        
        swatch.appendChild(lightSwatch);
        swatch.appendChild(darkSwatch);
        tdPreview.appendChild(swatch);
      } else if (settings.mode === 'slideshow' && settings.slideshow && settings.slideshow.items) {
        const stack = document.createElement('div');
        stack.className = 'preview-swatch-stack';
        
        const items = settings.slideshow.items.slice(0, 3);
        items.forEach((item) => {
          const itemEl = document.createElement('div');
          itemEl.className = 'stack-item';
          if (item.type === 'color' && item.colorMode === 'gradient' && item.gradient) {
            itemEl.style.backgroundImage = window.PageDyeGradient.buildGradientCss(item.gradient);
          } else if (item.type === 'color') {
            itemEl.style.backgroundColor = item.value;
          } else if (item.type === 'image' && item.value) {
            itemEl.style.backgroundImage = `url('${item.value}')`;
          }
          itemEl.style.opacity = (item.opacity !== undefined ? item.opacity : 100) / 100;
          stack.appendChild(itemEl);
        });
        tdPreview.appendChild(stack);
      } else {
        const swatch = document.createElement('div');
        swatch.className = 'preview-swatch';
        if (settings.type === 'color' && settings.colorMode === 'gradient' && settings.gradient) {
          swatch.style.backgroundImage = window.PageDyeGradient.buildGradientCss(settings.gradient);
        } else if (settings.type === 'color') {
          swatch.style.backgroundColor = settings.value;
        } else if (settings.type === 'image' && settings.value) {
          swatch.style.backgroundImage = `url('${settings.value}')`;
        }
        const opVal = settings.opacity !== undefined ? settings.opacity : 100;
        swatch.style.opacity = opVal / 100;
        tdPreview.appendChild(swatch);
      }
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
        if (await showConfirm(confirmMsg)) {
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

        if (!(await showConfirm(t('confirmImport')))) return;

        // Write the backup first, then drop only the keys it doesn't
        // mention — if set() fails partway (quota, disk, browser crash),
        // the existing config is left intact instead of already being
        // wiped by an unconditional clear() with nothing to replace it.
        const existing = await chrome.storage.local.get(null);
        await chrome.storage.local.set(importedData);
        const staleKeys = Object.keys(existing).filter((key) => !(key in importedData));
        if (staleKeys.length) await chrome.storage.local.remove(staleKeys);

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
    if (!(await showConfirm(t('clearAllConfirm')))) return;
    await chrome.storage.local.clear();
    await loadSitesList();
    showStatus(t('clearAllDone'));
  }

  function showStatus(msg) {
    els.statusMsg.textContent = msg;
    els.statusMsg.classList.remove('hidden');
    setTimeout(() => els.statusMsg.classList.add('hidden'), 2000);
  }

  function showConfirm(message) {
    return new Promise((resolve) => {
      const modal = document.getElementById('confirm-modal');
      const msgEl = document.getElementById('confirm-modal-message');
      const titleEl = document.getElementById('confirm-modal-title');
      const cancelBtn = document.getElementById('confirm-modal-cancel');
      const okBtn = document.getElementById('confirm-modal-ok');

      titleEl.textContent = t('modalTitle');
      msgEl.textContent = message;
      cancelBtn.textContent = t('confirmCancel');
      okBtn.textContent = t('confirmOk');

      // Clear previous listeners by replacing nodes
      const newCancelBtn = cancelBtn.cloneNode(true);
      const newOkBtn = okBtn.cloneNode(true);
      cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
      okBtn.parentNode.replaceChild(newOkBtn, okBtn);

      const hide = () => {
        modal.classList.remove('active');
        setTimeout(() => modal.classList.add('hidden'), 250);
      };

      newCancelBtn.addEventListener('click', () => {
        hide();
        resolve(false);
      });

      newOkBtn.addEventListener('click', () => {
        hide();
        resolve(true);
      });

      // Show modal
      modal.classList.remove('hidden');
      // trigger reflow
      modal.offsetHeight; 
      modal.classList.add('active');
    });
  }

  // Edit Site Feature Implementation
  let currentEditingDomain = '';
  let editCurrentImageBase64 = null;
  let editActiveScheme = 'light';
  let editActiveSlideshowIndex = 0;
  let currentEditSettings = null;
  let editGradientStopsState = [];

  function populateEditForm(subSettings) {
    document.querySelector(`input[name="edit-bgType"][value="${subSettings.type || 'none'}"]`).checked = true;
    updateEditUI(subSettings.type || 'none');

    editCurrentImageBase64 = null;
    document.getElementById('edit-image-url').value = '';
    document.getElementById('edit-image-file').value = '';
    document.getElementById('edit-drop-area').classList.remove('hidden');
    document.getElementById('edit-file-info').classList.add('hidden');

    if (subSettings.type === 'color') {
      document.getElementById('edit-color-picker').value = subSettings.value || '#ffffff';
      document.getElementById('edit-color-text').value = subSettings.value || '#ffffff';

      const colorMode = subSettings.colorMode || 'solid';
      populateEditGradientPanel(subSettings.gradient || window.PageDyeGradient.defaultGradient(subSettings.value));
      updateEditColorModeUI(colorMode);
    } else if (subSettings.type === 'image') {
      if (subSettings.value && subSettings.value.startsWith('data:')) {
        editCurrentImageBase64 = subSettings.value;
        document.getElementById('edit-drop-area').classList.add('hidden');
        document.getElementById('edit-file-info').classList.remove('hidden');
        document.getElementById('edit-filename').textContent = t('savedImage');
      } else {
        document.getElementById('edit-image-url').value = subSettings.value || '';
      }
    } else if (subSettings.type === 'effect') {
      document.getElementById('edit-effect-kind').value = subSettings.effect || 'waves';
      document.getElementById('edit-effect-color').value = subSettings.effectColor || '#ffffff';
      document.getElementById('edit-effect-color-text').value = subSettings.effectColor || '#ffffff';
      document.getElementById('edit-effect-bg-color').value = subSettings.effectBgColor || '#000000';
      document.getElementById('edit-effect-bg-color-text').value = subSettings.effectBgColor || '#000000';
      document.getElementById('edit-effect-density').value = subSettings.effectDensity !== undefined ? subSettings.effectDensity : 50;
      document.getElementById('edit-effect-density-val').textContent = `${document.getElementById('edit-effect-density').value}%`;
      document.getElementById('edit-effect-speed').value = subSettings.effectSpeed !== undefined ? subSettings.effectSpeed : 50;
      document.getElementById('edit-effect-speed-val').textContent = `${document.getElementById('edit-effect-speed').value}%`;
    }

    document.getElementById('edit-opacity').value = subSettings.opacity !== undefined ? subSettings.opacity : 100;
    document.getElementById('edit-opacity-val').textContent = `${document.getElementById('edit-opacity').value}%`;
    document.getElementById('edit-blur').value = subSettings.blur !== undefined ? subSettings.blur : 0;
    document.getElementById('edit-blur-val').textContent = `${document.getElementById('edit-blur').value}px`;

    // Populate advanced filters
    const f = subSettings.filters || {};
    const bri = f.brightness !== undefined ? f.brightness : 100;
    const con = f.contrast !== undefined ? f.contrast : 100;
    const gry = f.grayscale !== undefined ? f.grayscale : 0;
    const hue = f.hue !== undefined ? f.hue : 0;
    const inv = f.invert !== undefined ? f.invert : 0;
    document.getElementById('edit-filter-brightness').value = bri;
    document.getElementById('edit-filter-brightness-val').textContent = `${bri}%`;
    document.getElementById('edit-filter-contrast').value = con;
    document.getElementById('edit-filter-contrast-val').textContent = `${con}%`;
    document.getElementById('edit-filter-grayscale').value = gry;
    document.getElementById('edit-filter-grayscale-val').textContent = `${gry}%`;
    document.getElementById('edit-filter-hue').value = hue;
    document.getElementById('edit-filter-hue-val').textContent = `${hue}deg`;
    document.getElementById('edit-filter-invert').value = inv;
    document.getElementById('edit-filter-invert-val').textContent = `${inv}%`;

    if (subSettings.style) {
      document.getElementById('edit-bg-fixed').checked = subSettings.style.fixed !== false;
      document.getElementById('edit-bg-size').value = subSettings.style.size || 'cover';
      document.getElementById('edit-bg-repeat').checked = !!subSettings.style.repeat;
    }

    updateEditPreview();
  }

  function collectEditFormTo(dest) {
    const type = document.querySelector('input[name="edit-bgType"]:checked').value;
    let value = '';

    if (type === 'color') {
      value = document.getElementById('edit-color-picker').value;
      dest.colorMode = document.querySelector('input[name="edit-colorMode"]:checked').value;
      dest.gradient = collectEditGradientFromForm();
    } else if (type === 'image') {
      value = editCurrentImageBase64 || document.getElementById('edit-image-url').value;
    } else if (type === 'effect') {
      dest.effect = document.getElementById('edit-effect-kind').value;
      dest.effectColor = document.getElementById('edit-effect-color').value;
      dest.effectBgColor = document.getElementById('edit-effect-bg-color').value;
      dest.effectDensity = parseInt(document.getElementById('edit-effect-density').value, 10);
      dest.effectSpeed = parseInt(document.getElementById('edit-effect-speed').value, 10);
    }

    dest.type = type;
    dest.value = value;
    dest.opacity = parseInt(document.getElementById('edit-opacity').value, 10);
    dest.blur = parseInt(document.getElementById('edit-blur').value, 10);
    dest.filters = {
      brightness: parseInt(document.getElementById('edit-filter-brightness').value, 10),
      contrast:   parseInt(document.getElementById('edit-filter-contrast').value,   10),
      grayscale:  parseInt(document.getElementById('edit-filter-grayscale').value,  10),
      hue:        parseInt(document.getElementById('edit-filter-hue').value,        10),
      invert:     parseInt(document.getElementById('edit-filter-invert').value,     10)
    };
    dest.style = {
      fixed: document.getElementById('edit-bg-fixed').checked,
      size: document.getElementById('edit-bg-size').value,
      repeat: document.getElementById('edit-bg-repeat').checked
    };
  }

  let editSaveDebounceTimer = null;
  function queueEditAutoSave() {
    setEditSavingState();
    if (editSaveDebounceTimer) clearTimeout(editSaveDebounceTimer);
    editSaveDebounceTimer = setTimeout(() => {
      saveEditSettings(true);
    }, 400);
  }

  function triggerEditImmediateSave() {
    setEditSavingState();
    if (editSaveDebounceTimer) clearTimeout(editSaveDebounceTimer);
    saveEditSettings(true);
  }

  function setEditSavingState() {
    els.editStatusDot.classList.add('saving');
    els.editStatusText.textContent = t('statusSaving') || 'Saving...';
  }

  function setEditSyncedState() {
    els.editStatusDot.classList.remove('saving');
    els.editStatusText.textContent = t('statusSynced') || 'Synced';
  }

  async function openEditSite(domain) {
    currentEditingDomain = domain;
    document.getElementById('edit-domain-name').textContent = domain;

    els.sections.forEach(s => s.classList.remove('active'));
    document.getElementById('section-edit-site').classList.add('active');

    const data = await chrome.storage.local.get(domain);
    currentEditSettings = data[domain] || {
      mode: 'single',
      type: 'none',
      value: '',
      opacity: 100,
      blur: 0,
      style: { fixed: true, size: 'cover', repeat: false }
    };

    if (!currentEditSettings.mode) {
      currentEditSettings.mode = 'single';
    }

    if (!currentEditSettings.light) {
      currentEditSettings.light = {
        type: currentEditSettings.type && currentEditSettings.type !== 'none' ? currentEditSettings.type : 'none',
        value: currentEditSettings.value || '',
        opacity: currentEditSettings.opacity !== undefined ? currentEditSettings.opacity : 100,
        blur: currentEditSettings.blur !== undefined ? currentEditSettings.blur : 0,
        style: Object.assign({ fixed: true, size: 'cover', repeat: false }, currentEditSettings.style || {})
      };
    }
    if (!currentEditSettings.dark) {
      currentEditSettings.dark = {
        type: currentEditSettings.type && currentEditSettings.type !== 'none' ? currentEditSettings.type : 'none',
        value: currentEditSettings.value || '',
        opacity: currentEditSettings.opacity !== undefined ? currentEditSettings.opacity : 100,
        blur: currentEditSettings.blur !== undefined ? currentEditSettings.blur : 0,
        style: Object.assign({ fixed: true, size: 'cover', repeat: false }, currentEditSettings.style || {})
      };
    }

    if (!currentEditSettings.slideshow) {
      currentEditSettings.slideshow = {
        interval: 'open',
        order: 'sequential',
        currentIndex: 0,
        lastRotationTime: Date.now(),
        items: [
          {
            type: currentEditSettings.type || 'none',
            value: currentEditSettings.value || '',
            opacity: currentEditSettings.opacity !== undefined ? currentEditSettings.opacity : 100,
            blur: currentEditSettings.blur !== undefined ? currentEditSettings.blur : 0,
            style: Object.assign({ fixed: true, size: 'cover', repeat: false }, currentEditSettings.style || {})
          }
        ]
      };
    }

    const mode = currentEditSettings.mode || 'single';
    const radio = document.querySelector(`input[name="edit-wpMode"][value="${mode}"]`);
    if (radio) radio.checked = true;
    updateEditModeUI(mode);

    document.getElementById('edit-target-selector').value = currentEditSettings.targetSelector || '';
    document.getElementById('edit-custom-css').value = currentEditSettings.customCss || '';
    if (editCssEditorController) editCssEditorController.update();

    const editFrostedGlass = currentEditSettings.frostedGlass || {};
    document.getElementById('edit-frosted-selector').value = editFrostedGlass.selector || '';
    document.getElementById('edit-frosted-blur').value = editFrostedGlass.blur !== undefined ? editFrostedGlass.blur : 12;
    document.getElementById('edit-frosted-blur-val').textContent = `${document.getElementById('edit-frosted-blur').value}px`;
    document.getElementById('edit-frosted-opacity').value = editFrostedGlass.opacity !== undefined ? editFrostedGlass.opacity : 55;
    document.getElementById('edit-frosted-opacity-val').textContent = `${document.getElementById('edit-frosted-opacity').value}%`;

    const editAccordionAdvanced = document.getElementById('edit-accordion-advanced');
    if (editAccordionAdvanced) {
      editAccordionAdvanced.open = !!(currentEditSettings.targetSelector || currentEditSettings.customCss);
    }
  }

  function updateEditModeUI(mode) {
    els.editSchemeCardsContainer.classList.add('hidden');
    els.editSlideshowConfigPanel.classList.add('hidden');

    const activeModeBadge = document.getElementById('edit-active-mode-badge');
    if (activeModeBadge) {
      if (mode === 'single') {
        activeModeBadge.textContent = t('modeSingle');
      } else if (mode === 'auto') {
        activeModeBadge.textContent = t('modeAuto');
      } else if (mode === 'slideshow') {
        activeModeBadge.textContent = t('modeSlideshow');
      }
    }

    if (mode === 'single') {
      populateEditForm(currentEditSettings);
    } else if (mode === 'auto') {
      els.editSchemeCardsContainer.classList.remove('hidden');
      els.editCardSchemeLight.classList.remove('active');
      els.editCardSchemeDark.classList.remove('active');
      if (editActiveScheme === 'dark') {
        els.editCardSchemeDark.classList.add('active');
      } else {
        editActiveScheme = 'light';
        els.editCardSchemeLight.classList.add('active');
      }
      populateEditForm(currentEditSettings[editActiveScheme]);
    } else if (mode === 'slideshow') {
      els.editSlideshowConfigPanel.classList.remove('hidden');
      els.editSlideshowInterval.value = currentEditSettings.slideshow.interval || 'open';
      els.editSlideshowRandom.checked = currentEditSettings.slideshow.order === 'random';
      
      editActiveSlideshowIndex = currentEditSettings.slideshow.currentIndex || 0;
      if (editActiveSlideshowIndex >= currentEditSettings.slideshow.items.length) {
        editActiveSlideshowIndex = 0;
      }
      renderEditWallpapersGrid();
      populateEditForm(currentEditSettings.slideshow.items[editActiveSlideshowIndex]);
    }
    updateEditInteractivePreviews();
  }

  function renderEditWallpapersGrid() {
    els.editWallpapersGrid.innerHTML = '';
    const items = currentEditSettings.slideshow.items || [];
    
    items.forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = 'wallpaper-grid-card';
      if (idx === editActiveSlideshowIndex) card.classList.add('active');
      
      if (item.type === 'color' && item.colorMode === 'gradient' && item.gradient) {
        card.style.backgroundImage = window.PageDyeGradient.buildGradientCss(item.gradient);
      } else if (item.type === 'color') {
        card.style.backgroundColor = item.value || '#ffffff';
        card.style.backgroundImage = 'none';
      } else if (item.type === 'image' && item.value) {
        card.style.backgroundImage = `url('${item.value}')`;
      } else if (item.type === 'effect') {
        card.classList.add('type-none');
        card.textContent = t('typeEffect');
      } else {
        card.classList.add('type-none');
        card.textContent = 'None';
      }
      card.dataset.index = idx;

      if (items.length > 1) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-grid-btn';
        deleteBtn.textContent = '×';
        deleteBtn.type = 'button';
        deleteBtn.title = lang === 'zh' ? '删除此壁纸' : 'Delete wallpaper';
        card.appendChild(deleteBtn);
      }
      els.editWallpapersGrid.appendChild(card);
    });

    const addCard = document.createElement('div');
    addCard.className = 'add-grid-card';
    addCard.textContent = '+';
    els.editWallpapersGrid.appendChild(addCard);
  }

  function updateEditInteractivePreviews() {
    if (!currentEditSettings) return;
    
    const mode = currentEditSettings.mode || 'single';
    if (mode === 'auto') {
      const light = currentEditSettings.light;
      if (light.type === 'color' && light.colorMode === 'gradient' && light.gradient) {
        els.editPreviewCardLight.style.backgroundImage = window.PageDyeGradient.buildGradientCss(light.gradient);
        els.editPreviewCardLight.style.backgroundColor = '';
      } else if (light.type === 'color') {
        els.editPreviewCardLight.style.backgroundColor = light.value || '#ffffff';
        els.editPreviewCardLight.style.backgroundImage = 'none';
      } else if (light.type === 'image' && light.value) {
        els.editPreviewCardLight.style.backgroundImage = `url('${light.value}')`;
      } else {
        els.editPreviewCardLight.style.backgroundColor = 'var(--surface-bg)';
        els.editPreviewCardLight.style.backgroundImage = 'none';
      }
      els.editPreviewCardLight.style.opacity = (light.opacity !== undefined ? light.opacity : 100) / 100;

      const dark = currentEditSettings.dark;
      if (dark.type === 'color' && dark.colorMode === 'gradient' && dark.gradient) {
        els.editPreviewCardDark.style.backgroundImage = window.PageDyeGradient.buildGradientCss(dark.gradient);
        els.editPreviewCardDark.style.backgroundColor = '';
      } else if (dark.type === 'color') {
        els.editPreviewCardDark.style.backgroundColor = dark.value || '#ffffff';
        els.editPreviewCardDark.style.backgroundImage = 'none';
      } else if (dark.type === 'image' && dark.value) {
        els.editPreviewCardDark.style.backgroundImage = `url('${dark.value}')`;
      } else {
        els.editPreviewCardDark.style.backgroundColor = 'var(--surface-bg)';
        els.editPreviewCardDark.style.backgroundImage = 'none';
      }
      els.editPreviewCardDark.style.opacity = (dark.opacity !== undefined ? dark.opacity : 100) / 100;
    } else if (mode === 'slideshow') {
      const activeCard = els.editWallpapersGrid.querySelector(`.wallpaper-grid-card.active`);
      if (activeCard) {
        const item = currentEditSettings.slideshow.items[editActiveSlideshowIndex];
        if (item) {
          activeCard.textContent = '';
          activeCard.style.backgroundColor = '';
          activeCard.style.backgroundImage = '';
          if (item.type === 'color' && item.colorMode === 'gradient' && item.gradient) {
            activeCard.style.backgroundImage = window.PageDyeGradient.buildGradientCss(item.gradient);
            activeCard.className = 'wallpaper-grid-card active';
          } else if (item.type === 'color') {
            activeCard.style.backgroundColor = item.value || '#ffffff';
            activeCard.className = 'wallpaper-grid-card active';
          } else if (item.type === 'image' && item.value) {
            activeCard.style.backgroundImage = `url('${item.value}')`;
            activeCard.className = 'wallpaper-grid-card active';
          } else {
            activeCard.className = 'wallpaper-grid-card active type-none';
            activeCard.textContent = 'None';
          }
          
          const count = currentEditSettings.slideshow.items.length;
          if (count > 1 && !activeCard.querySelector('.delete-grid-btn')) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-grid-btn';
            deleteBtn.textContent = '×';
            deleteBtn.type = 'button';
            deleteBtn.title = lang === 'zh' ? '删除此壁纸' : 'Delete wallpaper';
            activeCard.appendChild(deleteBtn);
          }
        }
      }
    }
  }

  function updateEditUI(type) {
    document.getElementById('edit-section-color').classList.add('hidden');
    document.getElementById('edit-section-image').classList.add('hidden');
    document.getElementById('edit-section-effects').classList.add('hidden');
    document.getElementById('edit-section-styles').classList.add('hidden');
    document.getElementById('edit-image-options').classList.add('hidden');
    document.getElementById('edit-blur-control').classList.add('hidden');
    document.getElementById('edit-advanced-filters').classList.add('hidden');

    if (type === 'color') {
      document.getElementById('edit-section-color').classList.remove('hidden');
      document.getElementById('edit-section-styles').classList.remove('hidden');
      const checkedColorMode = document.querySelector('input[name="edit-colorMode"]:checked');
      updateEditColorModeUI(checkedColorMode ? checkedColorMode.value : 'solid');
    } else if (type === 'image') {
      document.getElementById('edit-section-image').classList.remove('hidden');
      document.getElementById('edit-section-styles').classList.remove('hidden');
      document.getElementById('edit-image-options').classList.remove('hidden');
      document.getElementById('edit-blur-control').classList.remove('hidden');
      document.getElementById('edit-advanced-filters').classList.remove('hidden');
      updateEditPreview();
    } else if (type === 'effect') {
      document.getElementById('edit-section-effects').classList.remove('hidden');
      document.getElementById('edit-section-styles').classList.remove('hidden');
    }
  }

  function updateEditColorModeUI(colorMode) {
    const isGradient = colorMode === 'gradient';
    const radio = document.querySelector(`input[name="edit-colorMode"][value="${colorMode || 'solid'}"]`);
    if (radio) radio.checked = true;
    document.getElementById('edit-solid-color-panel').classList.toggle('hidden', isGradient);
    document.getElementById('edit-gradient-panel').classList.toggle('hidden', !isGradient);
    if (isGradient) {
      // Guards against toggling to Gradient on a slot that has never been
      // through populateEditGradientPanel (e.g. a fresh domain whose type
      // starts as 'none'/'image') — without this, the stop list and live
      // preview would stay empty until the next full populateEditForm call.
      if (editGradientStopsState.length < window.PageDyeGradient.MIN_STOPS) {
        renderEditGradientStops(window.PageDyeGradient.defaultGradient(document.getElementById('edit-color-picker').value).stops);
      }
      const kindRadio = document.querySelector('input[name="edit-gradientKind"]:checked');
      updateEditGradientKindUI(kindRadio ? kindRadio.value : 'linear');
      updateEditGradientPreview();
      updateEditGradientExtractButtonState();
    }
  }

  function updateEditGradientKindUI(kind) {
    document.getElementById('edit-gradient-angle-control').classList.toggle('hidden', kind !== 'linear');
    document.getElementById('edit-gradient-shape-control').classList.toggle('hidden', kind !== 'radial');
  }

  function populateEditGradientPanel(gradient) {
    const kindRadio = document.querySelector(`input[name="edit-gradientKind"][value="${gradient.kind || 'linear'}"]`);
    if (kindRadio) kindRadio.checked = true;
    document.getElementById('edit-gradient-angle').value = gradient.angle !== undefined ? gradient.angle : 90;
    document.getElementById('edit-gradient-angle-val').textContent = `${document.getElementById('edit-gradient-angle').value}°`;
    document.getElementById('edit-gradient-shape').value = gradient.shape || 'circle';
    document.getElementById('edit-gradient-animated').checked = !!gradient.animated;
    document.getElementById('edit-gradient-speed').value = gradient.speed !== undefined ? gradient.speed : 10;
    document.getElementById('edit-gradient-speed-val').textContent = `${document.getElementById('edit-gradient-speed').value}s`;
    document.getElementById('edit-gradient-speed-control').classList.toggle('hidden', !gradient.animated);

    const stops = (gradient.stops && gradient.stops.length >= window.PageDyeGradient.MIN_STOPS)
      ? gradient.stops
      : window.PageDyeGradient.defaultGradient().stops;
    renderEditGradientStops(stops);

    updateEditGradientKindUI(gradient.kind || 'linear');
    updateEditGradientPreview();
  }

  // Rebuilds the stop-row list from scratch; listeners are delegated on the
  // parent (see the edit-gradient-stops-list input/click handlers below)
  // since rows are recreated on every add/remove.
  function renderEditGradientStops(stops) {
    editGradientStopsState = stops.map(s => ({ color: s.color, position: s.position }));
    const list = document.getElementById('edit-gradient-stops-list');
    list.innerHTML = '';

    editGradientStopsState.forEach((stop, idx) => {
      const row = document.createElement('div');
      row.className = 'gradient-stop-row';
      row.dataset.index = idx;

      const colorInput = document.createElement('input');
      colorInput.type = 'color';
      colorInput.className = 'gradient-stop-color';
      colorInput.value = stop.color;

      const hexInput = document.createElement('input');
      hexInput.type = 'text';
      hexInput.className = 'gradient-stop-hex';
      hexInput.value = stop.color;

      const posInput = document.createElement('input');
      posInput.type = 'number';
      posInput.className = 'gradient-stop-pos';
      posInput.min = '0';
      posInput.max = '100';
      posInput.value = stop.position;

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'gradient-stop-remove';
      removeBtn.textContent = '×';
      removeBtn.title = t('gradientRemoveStop');
      removeBtn.disabled = editGradientStopsState.length <= window.PageDyeGradient.MIN_STOPS;

      row.appendChild(colorInput);
      row.appendChild(hexInput);
      row.appendChild(posInput);
      row.appendChild(removeBtn);
      list.appendChild(row);
    });

    document.getElementById('edit-gradient-add-stop').disabled = editGradientStopsState.length >= window.PageDyeGradient.MAX_STOPS;
  }

  function collectEditGradientFromForm() {
    const kindRadio = document.querySelector('input[name="edit-gradientKind"]:checked');
    return {
      kind: kindRadio ? kindRadio.value : 'linear',
      angle: parseInt(document.getElementById('edit-gradient-angle').value, 10),
      shape: document.getElementById('edit-gradient-shape').value,
      stops: editGradientStopsState.map(s => ({ color: s.color, position: s.position })),
      animated: document.getElementById('edit-gradient-animated').checked,
      speed: parseInt(document.getElementById('edit-gradient-speed').value, 10)
    };
  }

  function updateEditGradientPreview() {
    const gradient = collectEditGradientFromForm();
    const bg = document.getElementById('edit-gradient-preview-bg');
    bg.style.backgroundImage = window.PageDyeGradient.buildGradientCss(gradient);
    bg.style.opacity = (parseInt(document.getElementById('edit-opacity').value, 10) || 100) / 100;
    if (gradient.animated) {
      bg.style.backgroundSize = gradient.kind === 'radial' ? '200% 200%' : '300% 300%';
      bg.style.animation = `pagedye-gradient-flow ${gradient.speed || 10}s ease infinite`;
    } else {
      bg.style.backgroundSize = 'auto';
      bg.style.animation = 'none';
    }
    // Every gradient control funnels through this function, so this is the
    // one place needed to keep the Auto/Slideshow scheme-card swatches live
    // too (they read currentEditSettings.light/dark/slideshow directly,
    // same as the solid-color and image controls already keep them in sync).
    updateEditInteractivePreviews();
  }

  function renderEditGradientPresetsGrid() {
    const grid = document.getElementById('edit-gradient-presets-grid');
    grid.innerHTML = '';
    window.PageDyeGradient.GRADIENT_PRESETS.forEach((preset, idx) => {
      const swatch = document.createElement('div');
      swatch.className = 'gradient-preset-swatch';
      swatch.style.background = window.PageDyeGradient.buildGradientCss(preset);
      swatch.title = lang === 'zh' ? preset.name_zh : preset.name_en;
      swatch.dataset.index = idx;
      grid.appendChild(swatch);
    });
  }

  function updateEditGradientExtractButtonState() {
    const hasImage = !!(editCurrentImageBase64 || document.getElementById('edit-image-url').value);
    const btn = document.getElementById('edit-gradient-extract-btn');
    btn.disabled = !hasImage;
    btn.title = hasImage ? '' : t('gradientExtractDisabledHint');
  }

  // Maps a flat hex list (from either Monet helper) to evenly-spaced stops.
  function normalizeEditStopObjects(hexColors) {
    const n = hexColors.length;
    return hexColors.map((color, i) => ({ color, position: n === 1 ? 0 : Math.round((i * 100) / (n - 1)) }));
  }

  function updateEditPreview() {
    let imageUrl = '';
    if (editCurrentImageBase64) {
      imageUrl = `url('${editCurrentImageBase64}')`;
    } else {
      const urlVal = document.getElementById('edit-image-url').value;
      if (urlVal) {
        imageUrl = `url('${urlVal}')`;
      }
    }
    const bgPreview = document.getElementById('edit-image-preview-bg');
    bgPreview.style.backgroundImage = imageUrl;

    const blur       = parseInt(document.getElementById('edit-blur').value, 10) || 0;
    const brightness = parseInt(document.getElementById('edit-filter-brightness').value, 10);
    const contrast   = parseInt(document.getElementById('edit-filter-contrast').value, 10);
    const grayscale  = parseInt(document.getElementById('edit-filter-grayscale').value, 10);
    const hue        = parseInt(document.getElementById('edit-filter-hue').value, 10);
    const invert     = parseInt(document.getElementById('edit-filter-invert').value, 10);

    const filterStr = [
      blur        > 0                ? `blur(${blur}px)`              : '',
      brightness !== 100             ? `brightness(${brightness}%)`   : '',
      contrast   !== 100             ? `contrast(${contrast}%)`       : '',
      grayscale  > 0                 ? `grayscale(${grayscale}%)`     : '',
      hue        > 0                 ? `hue-rotate(${hue}deg)`        : '',
      invert     > 0                 ? `invert(${invert}%)`           : ''
    ].filter(Boolean).join(' ') || 'none';

    bgPreview.style.filter = filterStr;
    bgPreview.style.transform = blur > 0 ? 'scale(1.08)' : 'none';

    const opacity = document.getElementById('edit-opacity').value;
    bgPreview.style.opacity = opacity / 100;
  }

  function collectEditSettings() {
    const mode = document.querySelector('input[name="edit-wpMode"]:checked').value;
    currentEditSettings.mode = mode;

    if (mode === 'single') {
      collectEditFormTo(currentEditSettings);
    } else if (mode === 'auto') {
      collectEditFormTo(currentEditSettings[editActiveScheme]);
    } else if (mode === 'slideshow') {
      collectEditFormTo(currentEditSettings.slideshow.items[editActiveSlideshowIndex]);
      currentEditSettings.slideshow.interval = els.editSlideshowInterval.value;
      currentEditSettings.slideshow.order = els.editSlideshowRandom.checked ? 'random' : 'sequential';
    }

    currentEditSettings.targetSelector = document.getElementById('edit-target-selector').value.trim();
    currentEditSettings.customCss = document.getElementById('edit-custom-css').value;
    currentEditSettings.frostedGlass = {
      selector: document.getElementById('edit-frosted-selector').value.trim(),
      blur: parseInt(document.getElementById('edit-frosted-blur').value, 10) || 0,
      opacity: parseInt(document.getElementById('edit-frosted-opacity').value, 10)
    };
    currentEditSettings.timestamp = Date.now();
  }

  async function saveEditSettings(silent = true) {
    if (!currentEditSettings) return;
    collectEditSettings();

    try {
      await chrome.storage.local.set({ [currentEditingDomain]: currentEditSettings });
      setEditSyncedState();
      notifyTabsOfDomain(currentEditingDomain, currentEditSettings);
    } catch (err) {
      els.editStatusText.textContent = t('error');
      console.error(err);
    }
  }

  async function resetEditSettings() {
    if (!(await showConfirm(t('confirmDelete').replace('{domain}', currentEditingDomain)))) return;
    setEditSavingState();
    await chrome.storage.local.remove(currentEditingDomain);
    
    currentEditSettings = {
      mode: 'single',
      type: 'none',
      value: '',
      opacity: 100,
      blur: 0,
      style: { fixed: true, size: 'cover', repeat: false },
      light: { type: 'none', value: '', opacity: 100, blur: 0, style: { fixed: true, size: 'cover', repeat: false } },
      dark: { type: 'none', value: '', opacity: 100, blur: 0, style: { fixed: true, size: 'cover', repeat: false } },
      slideshow: {
        interval: 'open',
        order: 'sequential',
        currentIndex: 0,
        lastRotationTime: Date.now(),
        items: [
          { type: 'none', value: '', opacity: 100, blur: 0, style: { fixed: true, size: 'cover', repeat: false } }
        ]
      },
      targetSelector: '',
      customCss: '',
      frostedGlass: { selector: '', blur: 12, opacity: 55 }
    };
    editActiveScheme = 'light';
    editActiveSlideshowIndex = 0;
    
    const radio = document.querySelector('input[name="edit-wpMode"][value="single"]');
    if (radio) radio.checked = true;
    updateEditModeUI('single');

    document.getElementById('edit-type-none').checked = true;
    updateEditUI('none');
    document.getElementById('edit-opacity').value = 100;
    document.getElementById('edit-opacity-val').textContent = '100%';
    document.getElementById('edit-blur').value = 0;
    document.getElementById('edit-blur-val').textContent = '0px';
    document.getElementById('edit-effect-kind').value = 'waves';
    document.getElementById('edit-effect-color').value = '#ffffff';
    document.getElementById('edit-effect-color-text').value = '#ffffff';
    document.getElementById('edit-effect-bg-color').value = '#000000';
    document.getElementById('edit-effect-bg-color-text').value = '#000000';
    document.getElementById('edit-effect-density').value = 50;
    document.getElementById('edit-effect-density-val').textContent = '50%';
    document.getElementById('edit-effect-speed').value = 50;
    document.getElementById('edit-effect-speed-val').textContent = '50%';
    editCurrentImageBase64 = null;
    document.getElementById('edit-image-file').value = '';
    document.getElementById('edit-drop-area').classList.remove('hidden');
    document.getElementById('edit-file-info').classList.add('hidden');
    document.getElementById('edit-image-url').value = '';
    document.getElementById('edit-target-selector').value = '';
    document.getElementById('edit-custom-css').value = '';
    document.getElementById('edit-frosted-selector').value = '';
    document.getElementById('edit-frosted-blur').value = 12;
    document.getElementById('edit-frosted-blur-val').textContent = '12px';
    document.getElementById('edit-frosted-opacity').value = 55;
    document.getElementById('edit-frosted-opacity-val').textContent = '55%';
    if (editCssEditorController) editCssEditorController.update();

    notifyTabsOfDomain(currentEditingDomain, { type: 'none' });
    setEditSyncedState();
  }

  async function notifyTabsOfDomain(domain, settings) {
    try {
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (tab.url) {
          try {
            const url = new URL(tab.url);
            if (url.hostname.toLowerCase() === domain.toLowerCase()) {
              try {
                await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['scripts/gradient.js', 'scripts/content.js'] });
              } catch (e) {}
              chrome.tabs.sendMessage(tab.id, { action: 'updateBackground', settings });
            }
          } catch (e) {}
        }
      }
    } catch (err) {
      console.error('Error notifying tabs:', err);
    }
  }

  // Edit Site Event Listeners Setup
  const editTypeRadios = document.getElementsByName('edit-bgType');
  editTypeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      // When switching to image type, restore the previously saved image value
      // so that editCurrentImageBase64 is not lost when cycling through types.
      if (radio.value === 'image') {
        // Determine which settings object is currently active
        let activeSettings = currentEditSettings;
        const mode = currentEditSettings ? (currentEditSettings.mode || 'single') : 'single';
        if (mode === 'auto') {
          activeSettings = currentEditSettings[editActiveScheme];
        } else if (mode === 'slideshow') {
          activeSettings = currentEditSettings.slideshow.items[editActiveSlideshowIndex];
        }
        // Restore base64 image if the saved value is a data URI, otherwise clear
        if (activeSettings && activeSettings.value && activeSettings.value.startsWith('data:')) {
          editCurrentImageBase64 = activeSettings.value;
        } else {
          editCurrentImageBase64 = null;
        }
        // Sync the file-info UI to match the restored state
        if (editCurrentImageBase64) {
          document.getElementById('edit-drop-area').classList.add('hidden');
          document.getElementById('edit-file-info').classList.remove('hidden');
          document.getElementById('edit-filename').textContent = t('savedImage') || 'Saved image';
        } else {
          document.getElementById('edit-drop-area').classList.remove('hidden');
          document.getElementById('edit-file-info').classList.add('hidden');
          // Restore URL value if applicable
          if (activeSettings && activeSettings.value && !activeSettings.value.startsWith('data:')) {
            document.getElementById('edit-image-url').value = activeSettings.value;
          }
        }
      }
      updateEditUI(radio.value);
      updateEditInteractivePreviews();
      triggerEditImmediateSave();
    });
  });

  // Effect kind / color / density / speed
  document.getElementById('edit-effect-kind').addEventListener('change', () => triggerEditImmediateSave());
  const editEffectColor = document.getElementById('edit-effect-color');
  const editEffectColorText = document.getElementById('edit-effect-color-text');
  editEffectColor.addEventListener('input', (e) => {
    editEffectColorText.value = e.target.value;
    queueEditAutoSave();
  });
  editEffectColorText.addEventListener('input', (e) => {
    editEffectColor.value = e.target.value;
    queueEditAutoSave();
  });
  const editEffectBgColor = document.getElementById('edit-effect-bg-color');
  const editEffectBgColorText = document.getElementById('edit-effect-bg-color-text');
  editEffectBgColor.addEventListener('input', (e) => {
    editEffectBgColorText.value = e.target.value;
    queueEditAutoSave();
  });
  editEffectBgColorText.addEventListener('input', (e) => {
    editEffectBgColor.value = e.target.value;
    queueEditAutoSave();
  });
  const editEffectDensity = document.getElementById('edit-effect-density');
  const editEffectDensityVal = document.getElementById('edit-effect-density-val');
  editEffectDensity.addEventListener('input', (e) => {
    editEffectDensityVal.textContent = `${e.target.value}%`;
    queueEditAutoSave();
  });
  const editEffectSpeed = document.getElementById('edit-effect-speed');
  const editEffectSpeedVal = document.getElementById('edit-effect-speed-val');
  editEffectSpeed.addEventListener('input', (e) => {
    editEffectSpeedVal.textContent = `${e.target.value}%`;
    queueEditAutoSave();
  });

  const editColorPicker = document.getElementById('edit-color-picker');
  const editColorText = document.getElementById('edit-color-text');
  editColorPicker.addEventListener('input', (e) => {
    editColorText.value = e.target.value;
    updateEditInteractivePreviews();
    queueEditAutoSave();
  });
  editColorText.addEventListener('input', (e) => {
    editColorPicker.value = e.target.value;
    updateEditInteractivePreviews();
    queueEditAutoSave();
  });

  // Gradient: Solid <-> Gradient sub-mode switch.
  // Note the order below (save, then re-derive the preview) for every
  // *discrete* gradient action in this section: triggerEditImmediateSave()
  // synchronously runs collectEditFormTo(), which is what writes the form's
  // gradient into currentEditSettings[activeSlot] — updateEditGradientPreview()
  // piggybacks a scheme-card/slideshow-thumbnail refresh (see its own
  // definition) that reads exactly that object, so it must run *after* the
  // save or it renders one action behind. Debounced slider edits (angle,
  // speed, per-stop color/position) keep the opposite order, matching the
  // existing solid-color/opacity slider precedent elsewhere in this file.
  document.getElementsByName('edit-colorMode').forEach(radio => {
    radio.addEventListener('change', () => {
      updateEditColorModeUI(radio.value);
      triggerEditImmediateSave();
      updateEditGradientPreview();
    });
  });

  // Gradient: Linear <-> Radial
  document.getElementsByName('edit-gradientKind').forEach(radio => {
    radio.addEventListener('change', () => {
      updateEditGradientKindUI(radio.value);
      triggerEditImmediateSave();
      updateEditGradientPreview();
    });
  });

  document.getElementById('edit-gradient-angle').addEventListener('input', (e) => {
    document.getElementById('edit-gradient-angle-val').textContent = `${e.target.value}°`;
    updateEditGradientPreview();
    queueEditAutoSave();
  });

  document.getElementById('edit-gradient-shape').addEventListener('change', () => {
    triggerEditImmediateSave();
    updateEditGradientPreview();
  });

  document.getElementById('edit-gradient-animated').addEventListener('change', (e) => {
    document.getElementById('edit-gradient-speed-control').classList.toggle('hidden', !e.target.checked);
    triggerEditImmediateSave();
    updateEditGradientPreview();
  });

  document.getElementById('edit-gradient-speed').addEventListener('input', (e) => {
    document.getElementById('edit-gradient-speed-val').textContent = `${e.target.value}s`;
    updateEditGradientPreview();
    queueEditAutoSave();
  });

  document.getElementById('edit-gradient-add-stop').addEventListener('click', () => {
    if (editGradientStopsState.length >= window.PageDyeGradient.MAX_STOPS) return;
    const lastPos = editGradientStopsState.length ? editGradientStopsState[editGradientStopsState.length - 1].position : 0;
    editGradientStopsState.push({ color: '#ffffff', position: Math.min(100, lastPos + 10) });
    renderEditGradientStops(editGradientStopsState);
    triggerEditImmediateSave();
    updateEditGradientPreview();
  });

  const editGradientStopsList = document.getElementById('edit-gradient-stops-list');

  editGradientStopsList.addEventListener('input', (e) => {
    const row = e.target.closest('.gradient-stop-row');
    if (!row) return;
    const idx = parseInt(row.dataset.index, 10);
    if (e.target.classList.contains('gradient-stop-color')) {
      row.querySelector('.gradient-stop-hex').value = e.target.value;
      editGradientStopsState[idx].color = e.target.value;
    } else if (e.target.classList.contains('gradient-stop-hex')) {
      row.querySelector('.gradient-stop-color').value = e.target.value;
      editGradientStopsState[idx].color = e.target.value;
    } else if (e.target.classList.contains('gradient-stop-pos')) {
      editGradientStopsState[idx].position = Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0));
    }
    updateEditGradientPreview();
    queueEditAutoSave();
  });

  editGradientStopsList.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.gradient-stop-remove');
    if (!removeBtn) return;
    if (editGradientStopsState.length <= window.PageDyeGradient.MIN_STOPS) return;
    const idx = parseInt(removeBtn.closest('.gradient-stop-row').dataset.index, 10);
    editGradientStopsState.splice(idx, 1);
    renderEditGradientStops(editGradientStopsState);
    triggerEditImmediateSave();
    updateEditGradientPreview();
  });

  document.getElementById('edit-gradient-presets-grid').addEventListener('click', (e) => {
    const swatch = e.target.closest('.gradient-preset-swatch');
    if (!swatch) return;
    const preset = window.PageDyeGradient.GRADIENT_PRESETS[parseInt(swatch.dataset.index, 10)];
    populateEditGradientPanel(Object.assign({ animated: false, speed: 10 }, preset));
    triggerEditImmediateSave();
    updateEditGradientPreview();
  });

  document.getElementById('edit-gradient-generate-btn').addEventListener('click', () => {
    const seed = editColorPicker.value;
    const stops = window.PageDyeGradient.clampStops(normalizeEditStopObjects(window.PageDyeGradient.generateTonalPalette(seed)));
    renderEditGradientStops(stops);
    triggerEditImmediateSave();
    updateEditGradientPreview();
  });

  document.getElementById('edit-gradient-extract-btn').addEventListener('click', async () => {
    const imgSrc = editCurrentImageBase64 || document.getElementById('edit-image-url').value;
    if (!imgSrc) return;
    const extractBtn = document.getElementById('edit-gradient-extract-btn');
    extractBtn.disabled = true;
    const result = await window.PageDyeGradient.extractPaletteFromImage(imgSrc, 5);
    updateEditGradientExtractButtonState();
    if (!result.ok) {
      els.editStatusText.textContent = t('gradientExtractFailed');
      setTimeout(setEditSyncedState, 1800);
      return;
    }
    const stops = window.PageDyeGradient.clampStops(normalizeEditStopObjects(result.colors));
    renderEditGradientStops(stops);
    triggerEditImmediateSave();
    updateEditGradientPreview();
  });



  const editDropArea = document.getElementById('edit-drop-area');
  const editFileInput = document.getElementById('edit-image-file');
  editDropArea.addEventListener('click', () => editFileInput.click());
  editFileInput.addEventListener('change', (e) => {
    if (e.target.files.length) handleEditFile(e.target.files[0]);
  });
  editDropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    editDropArea.classList.add('dragover');
  });
  editDropArea.addEventListener('dragleave', () => editDropArea.classList.remove('dragover'));
  editDropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    editDropArea.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
      handleEditFile(e.dataTransfer.files[0]);
    }
  });

  function handleEditFile(file) {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      editCurrentImageBase64 = e.target.result;
      document.getElementById('edit-image-url').value = '';
      editDropArea.classList.add('hidden');
      document.getElementById('edit-file-info').classList.remove('hidden');
      document.getElementById('edit-filename').textContent = file.name;
      updateEditPreview();
      updateEditInteractivePreviews();
      triggerEditImmediateSave();
    };
    reader.readAsDataURL(file);
  }

  document.getElementById('edit-remove-file').addEventListener('click', () => {
    editCurrentImageBase64 = null;
    editFileInput.value = '';
    editDropArea.classList.remove('hidden');
    document.getElementById('edit-file-info').classList.add('hidden');
    updateEditPreview();
    updateEditInteractivePreviews();
    triggerEditImmediateSave();
  });

  const editOpacity = document.getElementById('edit-opacity');
  const editOpacityVal = document.getElementById('edit-opacity-val');
  editOpacity.addEventListener('input', (e) => {
    editOpacityVal.textContent = `${e.target.value}%`;
    updateEditPreview();
    updateEditInteractivePreviews();
    queueEditAutoSave();
  });

  const editBlur = document.getElementById('edit-blur');
  const editBlurVal = document.getElementById('edit-blur-val');
  editBlur.addEventListener('input', (e) => {
    editBlurVal.textContent = `${e.target.value}px`;
    updateEditPreview();
    updateEditInteractivePreviews();
    queueEditAutoSave();
  });

  document.getElementById('edit-image-url').addEventListener('input', (e) => {
    if (e.target.value) {
      editCurrentImageBase64 = null;
      editFileInput.value = '';
      editDropArea.classList.remove('hidden');
      document.getElementById('edit-file-info').classList.add('hidden');
    }
    updateEditPreview();
    updateEditInteractivePreviews();
    queueEditAutoSave();
  });

  // Advanced filter sliders
  const filterDefs = [
    { id: 'edit-filter-brightness', valId: 'edit-filter-brightness-val', unit: '%' },
    { id: 'edit-filter-contrast',   valId: 'edit-filter-contrast-val',   unit: '%' },
    { id: 'edit-filter-grayscale',  valId: 'edit-filter-grayscale-val',  unit: '%' },
    { id: 'edit-filter-hue',        valId: 'edit-filter-hue-val',        unit: 'deg' },
    { id: 'edit-filter-invert',     valId: 'edit-filter-invert-val',     unit: '%' }
  ];
  filterDefs.forEach(({ id, valId, unit }) => {
    document.getElementById(id).addEventListener('input', (e) => {
      document.getElementById(valId).textContent = `${e.target.value}${unit}`;
      updateEditPreview();
      queueEditAutoSave();
    });
  });

  document.getElementById('edit-filters-reset').addEventListener('click', () => {
    document.getElementById('edit-filter-brightness').value = 100;
    document.getElementById('edit-filter-brightness-val').textContent = '100%';
    document.getElementById('edit-filter-contrast').value = 100;
    document.getElementById('edit-filter-contrast-val').textContent = '100%';
    document.getElementById('edit-filter-grayscale').value = 0;
    document.getElementById('edit-filter-grayscale-val').textContent = '0%';
    document.getElementById('edit-filter-hue').value = 0;
    document.getElementById('edit-filter-hue-val').textContent = '0deg';
    document.getElementById('edit-filter-invert').value = 0;
    document.getElementById('edit-filter-invert-val').textContent = '0%';
    updateEditPreview();
    triggerEditImmediateSave();
  });



  // Toggles and inputs on edit view
  document.getElementById('edit-bg-fixed').addEventListener('change', () => triggerEditImmediateSave());
  document.getElementById('edit-bg-size').addEventListener('change', () => triggerEditImmediateSave());
  document.getElementById('edit-bg-repeat').addEventListener('change', () => triggerEditImmediateSave());
  document.getElementById('edit-target-selector').addEventListener('input', () => queueEditAutoSave());
  document.getElementById('edit-custom-css').addEventListener('input', () => queueEditAutoSave());
  document.getElementById('edit-frosted-selector').addEventListener('input', () => queueEditAutoSave());

  const editFrostedBlur = document.getElementById('edit-frosted-blur');
  const editFrostedBlurVal = document.getElementById('edit-frosted-blur-val');
  editFrostedBlur.addEventListener('input', (e) => {
    editFrostedBlurVal.textContent = `${e.target.value}px`;
    queueEditAutoSave();
  });

  const editFrostedOpacity = document.getElementById('edit-frosted-opacity');
  const editFrostedOpacityVal = document.getElementById('edit-frosted-opacity-val');
  editFrostedOpacity.addEventListener('input', (e) => {
    editFrostedOpacityVal.textContent = `${e.target.value}%`;
    queueEditAutoSave();
  });

  document.getElementById('edit-back-btn').addEventListener('click', () => {
    els.sections.forEach(s => s.classList.remove('active'));
    document.getElementById('section-sites').classList.add('active');
    loadSitesList();
  });

  // Top-level tabs: Wallpaper vs Frosted Glass
  const editPanelWallpaper = document.getElementById('edit-panel-wallpaper');
  const editPanelFrosted = document.getElementById('edit-panel-frosted');
  document.getElementsByName('edit-mainTab').forEach((radio) => {
    radio.addEventListener('change', () => {
      const isFrosted = radio.checked && radio.value === 'frosted';
      editPanelWallpaper.classList.toggle('hidden', isFrosted);
      editPanelFrosted.classList.toggle('hidden', !isFrosted);
    });
  });

  // Edit Wallpaper Mode Switch
  els.editWpModes.forEach(radio => {
    radio.addEventListener('change', () => {
      if (!currentEditSettings) return;
      
      const prevMode = currentEditSettings.mode || 'single';
      if (prevMode === 'single') {
        collectEditFormTo(currentEditSettings);
      } else if (prevMode === 'auto') {
        collectEditFormTo(currentEditSettings[editActiveScheme]);
      } else if (prevMode === 'slideshow') {
        collectEditFormTo(currentEditSettings.slideshow.items[editActiveSlideshowIndex]);
        currentEditSettings.slideshow.interval = els.editSlideshowInterval.value;
        currentEditSettings.slideshow.order = els.editSlideshowRandom.checked ? 'random' : 'sequential';
      }
      
      currentEditSettings.mode = radio.value;
      updateEditModeUI(radio.value);
      triggerEditImmediateSave();
    });
  });

  // Auto Mode cards click handlers inside Edit Panel
  els.editCardSchemeLight.addEventListener('click', () => {
    if (!currentEditSettings || editActiveScheme === 'light') return;
    collectEditFormTo(currentEditSettings[editActiveScheme]);
    editActiveScheme = 'light';
    els.editCardSchemeDark.classList.remove('active');
    els.editCardSchemeLight.classList.add('active');
    populateEditForm(currentEditSettings[editActiveScheme]);
  });

  els.editCardSchemeDark.addEventListener('click', () => {
    if (!currentEditSettings || editActiveScheme === 'dark') return;
    collectEditFormTo(currentEditSettings[editActiveScheme]);
    editActiveScheme = 'dark';
    els.editCardSchemeLight.classList.remove('active');
    els.editCardSchemeDark.classList.add('active');
    populateEditForm(currentEditSettings[editActiveScheme]);
  });

  // Slideshow visual grid clicks using delegation inside Edit Panel
  els.editWallpapersGrid.addEventListener('click', (e) => {
    if (!currentEditSettings || !currentEditSettings.slideshow) return;

    // 1. Add Card Click
    const addCard = e.target.closest('.add-grid-card');
    if (addCard) {
      collectEditFormTo(currentEditSettings.slideshow.items[editActiveSlideshowIndex]);
      const newItem = {
        type: 'none',
        value: '',
        opacity: 100,
        blur: 0,
        style: { fixed: true, size: 'cover', repeat: false }
      };
      currentEditSettings.slideshow.items.push(newItem);
      editActiveSlideshowIndex = currentEditSettings.slideshow.items.length - 1;
      renderEditWallpapersGrid();
      populateEditForm(currentEditSettings.slideshow.items[editActiveSlideshowIndex]);
      triggerEditImmediateSave();
      return;
    }

    // 2. Delete Card Click
    const deleteBtn = e.target.closest('.delete-grid-btn');
    if (deleteBtn) {
      e.stopPropagation();
      const card = deleteBtn.closest('.wallpaper-grid-card');
      const idx = parseInt(card.dataset.index, 10);
      currentEditSettings.slideshow.items.splice(idx, 1);
      
      if (editActiveSlideshowIndex >= currentEditSettings.slideshow.items.length) {
        editActiveSlideshowIndex = currentEditSettings.slideshow.items.length - 1;
      }
      
      renderEditWallpapersGrid();
      populateEditForm(currentEditSettings.slideshow.items[editActiveSlideshowIndex]);
      triggerEditImmediateSave();
      return;
    }

    // 3. Select Card Click
    const card = e.target.closest('.wallpaper-grid-card');
    if (card) {
      const idx = parseInt(card.dataset.index, 10);
      if (editActiveSlideshowIndex === idx) return;
      collectEditFormTo(currentEditSettings.slideshow.items[editActiveSlideshowIndex]);
      editActiveSlideshowIndex = idx;
      
      // Update selected border
      els.editWallpapersGrid.querySelectorAll('.wallpaper-grid-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      
      populateEditForm(currentEditSettings.slideshow.items[editActiveSlideshowIndex]);
    }
  });

  // Edit Slideshow inputs listeners
  els.editSlideshowInterval.addEventListener('change', () => {
    if (currentEditSettings && currentEditSettings.slideshow) {
      currentEditSettings.slideshow.interval = els.editSlideshowInterval.value;
      triggerEditImmediateSave();
    }
  });

  els.editSlideshowRandom.addEventListener('change', () => {
    if (currentEditSettings && currentEditSettings.slideshow) {
      currentEditSettings.slideshow.order = els.editSlideshowRandom.checked ? 'random' : 'sequential';
      triggerEditImmediateSave();
    }
  });

  els.editResetBtn.addEventListener('click', resetEditSettings);
});

function initCustomCssEditor(textareaId, containerId) {
  const textarea = document.getElementById(textareaId);
  const container = document.getElementById(containerId);
  if (!textarea || !container) return null;

  const gutter = container.querySelector('.editor-gutter');
  const codeBlock = container.querySelector('.editor-highlight code');
  const preBlock = container.querySelector('.editor-highlight');

  function updateEditor() {
    let code = textarea.value;
    const isPlaceholder = !code;
    
    if (isPlaceholder) {
      code = textarea.getAttribute('placeholder') || '';
      container.classList.add('placeholder-active');
    } else {
      container.classList.remove('placeholder-active');
    }

    const highlighted = Prism.highlight(code, Prism.languages.css, 'css');
    codeBlock.innerHTML = code.endsWith('\n') ? highlighted + ' ' : highlighted;

    const lineCount = code.split('\n').length;
    let gutterHTML = '';
    for (let i = 1; i <= lineCount; i++) {
      gutterHTML += `<span class="editor-gutter-num">${i}</span>`;
    }
    gutter.innerHTML = gutterHTML;
    
    syncScrolls();
  }

  function syncScrolls() {
    gutter.scrollTop = textarea.scrollTop;
    preBlock.scrollTop = textarea.scrollTop;
    preBlock.scrollLeft = textarea.scrollLeft;
  }

  textarea.addEventListener('scroll', syncScrolls);
  textarea.addEventListener('input', updateEditor);

  textarea.addEventListener('keydown', (e) => {
    const val = textarea.value;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // 1. Tab Key Support (2 spaces)
    if (e.key === 'Tab') {
      e.preventDefault();
      textarea.value = val.substring(0, start) + '  ' + val.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + 2;
      updateEditor();
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // 2. Overwrite closing character if already typed
    const closers = ['}', ')', ']', '"', "'"];
    if (closers.includes(e.key) && start === end) {
      const nextChar = val.charAt(start);
      if (nextChar === e.key) {
        e.preventDefault();
        textarea.selectionStart = textarea.selectionEnd = start + 1;
        return;
      }
    }

    // 3. Auto-closing brackets
    const pairs = {
      '{': '}',
      '(': ')',
      '[': ']',
      '"': '"',
      "'": "'"
    };

    if (pairs[e.key] !== undefined) {
      e.preventDefault();
      const closing = pairs[e.key];
      if (start !== end) {
        const selected = val.substring(start, end);
        textarea.value = val.substring(0, start) + e.key + selected + closing + val.substring(end);
        textarea.selectionStart = start + 1;
        textarea.selectionEnd = end + 1;
      } else {
        textarea.value = val.substring(0, start) + e.key + closing + val.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + 1;
      }
      updateEditor();
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // 4. Smart Indentation on Enter key
    if (e.key === 'Enter' && start === end) {
      const charBefore = val.charAt(start - 1);
      const charAfter = val.charAt(start);
      if (charBefore === '{' && charAfter === '}') {
        e.preventDefault();
        textarea.value = val.substring(0, start) + '\n  \n' + val.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + 3;
        updateEditor();
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      } else if (charBefore === '{') {
        e.preventDefault();
        textarea.value = val.substring(0, start) + '\n  ' + val.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + 3;
        updateEditor();
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  });

  updateEditor();

  return {
    update: updateEditor
  };
}
