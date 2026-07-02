document.addEventListener('DOMContentLoaded', async () => {
  const i18n = {
    en: {
      title: "PageDye Dashboard",
      appName: "PageDye",
      navSites: "Configured Sites",
      navCustomEffects: "Custom Effects",
      navAppearance: "Appearance",
      navBackup: "Backup & Restore",
      navAi: "AI Pick (Beta)",
      navAbout: "About",
      aiTitle: "AI Pick (Beta)",
      aiHint: "Configure an OpenAI-compatible endpoint so the popup's \"AI Pick\" button can suggest a background selector on tricky sites. Your key and page structure (tags/classes/computed styles, no page text) are sent directly to this endpoint from your browser — no PageDye server involved.",
      aiBaseUrl: "Base URL",
      aiBaseUrlHint: "The OpenAI-compatible API root, without a trailing /chat/completions.",
      aiApiKey: "API Key",
      aiModel: "Model",
      aiSaveBtn: "Save AI Settings",
      aiSaved: "AI settings saved",
      appearanceTitle: "Appearance",
      appearanceHint: "Customize the colors of this dashboard itself (not your websites' backgrounds).",
      pageBackground: "Page Background",
      pageBackgroundHint: "The outer area surrounding the dashboard panel. Pick a color, or upload an image.",
      containerBackground: "Container Background",
      containerBackgroundHint: "The sidebar and main panel background. Pick a color, or upload an image.",
      appearanceReset: "Reset to Default",
      appearanceSaved: "Appearance updated!",
      appearanceResetDone: "Appearance reset!",
      dragOrClick: "Drag image here, or",
      chooseFile: "choose file",
      savedImage: "Saved image",
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
      effectAurora: "Aurora",
      effectSnow: "Snow",
      effectBubbles: "Bubbles",
      effectConstellation: "Constellation",
      effectFireflies: "Fireflies",
      effectGridPulse: "Grid Pulse",
      effectRain: "Rain",
      effectConfetti: "Confetti",
      effectPlasma: "Plasma",
      effectVortex: "Vortex",
      effectTypewriter: "Typewriter",
      effectText: "Text",
      effectColorScheme: "Color Preset",
      effectColorSchemeHint: "Auto follows your system's light/dark setting live.",
      effectSchemeAuto: "Auto",
      effectSchemeLight: "Light",
      effectSchemeDark: "Dark",
      effectSchemeCustom: "Custom",
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
      customEffectsTitle: "Custom Effects",
      customEffectsHint: "Write your own animated Canvas wallpaper and use it on any site, just like the built-in effects. Extension only — not available in PageDye Lite or the site widget.",
      newCustomEffect: "New Custom Effect",
      importEffectBtn: "Import",
      thEffectName: "Name",
      thEffectUpdated: "Updated",
      noCustomEffects: "No custom effects yet.",
      backToCustomEffects: "Back to Custom Effects",
      effectNameLabel: "Name",
      startFromTemplate: "Start from template",
      templateBlank: "Blank skeleton",
      templateWaves: "Waves source",
      templateParticles: "Particles source",
      effectCode: "Code",
      effectCodeHint: "Must evaluate to an object with init(cfg), resize(state, width, height) and draw(ctx, canvas, state, dt) — the same shape as PageDye's built-in effects. cfg has color/bgColor/density/speed/text. Helpers: window.PageDyeEffects.helpers.{hexToRgba, effectSpeedMultiplier, clampPercent}.",
      effectPreviewLabel: "Live Preview",
      exportEffectBtn: "Export",
      untitledEffect: "Untitled Effect",
      editBtn: "Edit",
      confirmDeleteEffect: "Delete custom effect \"{name}\"? Any site using it will fall back to Waves.",
      customEffectsOptgroup: "Custom",
      manageCustomEffects: "Manage custom effects…",
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
      navCustomEffects: "自定义动效",
      navAppearance: "外观",
      navBackup: "备份与恢复",
      navAi: "AI 智能识别（测试）",
      navAbout: "关于 PageDye",
      aiTitle: "AI 智能识别（测试）",
      aiHint: "配置一个 OpenAI 兼容接口，弹窗里的「AI 智能识别」按钮就能在刁钻网站上自动推荐背景选择器。你的 key 和页面结构信息（标签/class/计算样式，不含正文文本）会直接从你的浏览器发给该接口，不经过任何 PageDye 服务器。",
      aiBaseUrl: "接口地址",
      aiBaseUrlHint: "OpenAI 兼容接口的根地址，不要带结尾的 /chat/completions。",
      aiApiKey: "API Key",
      aiModel: "模型",
      aiSaveBtn: "保存 AI 设置",
      aiSaved: "AI 设置已保存",
      appearanceTitle: "外观",
      appearanceHint: "自定义控制面板本身的配色（不影响您各个网站的背景设置）。",
      pageBackground: "页面背景",
      pageBackgroundHint: "控制面板外层的背景区域。可选择颜色，或上传一张背景图片。",
      containerBackground: "容器背景",
      containerBackgroundHint: "侧边栏与主面板的背景。可选择颜色，或上传一张背景图片。",
      appearanceReset: "恢复默认",
      appearanceSaved: "外观已更新!",
      appearanceResetDone: "外观已重置!",
      dragOrClick: "拖拽图片至此，或",
      chooseFile: "选择文件",
      savedImage: "已保存的图片",
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
      effectAurora: "极光",
      effectSnow: "雪花",
      effectBubbles: "气泡",
      effectConstellation: "星座",
      effectFireflies: "萤火虫",
      effectGridPulse: "网格脉冲",
      effectRain: "雨丝",
      effectConfetti: "彩纸",
      effectPlasma: "流光",
      effectVortex: "漩涡",
      effectTypewriter: "打字机",
      effectText: "文字内容",
      effectColorScheme: "颜色预置",
      effectColorSchemeHint: "自动会实时跟随系统的浅色/深色设置。",
      effectSchemeAuto: "自动",
      effectSchemeLight: "浅色",
      effectSchemeDark: "深色",
      effectSchemeCustom: "自定义",
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
      customEffectsTitle: "自定义动效",
      customEffectsHint: "编写你自己的 Canvas 动态壁纸，像内置动效一样在任意网站使用。仅浏览器扩展版支持——PageDye Lite 和网页体验版暂不支持。",
      newCustomEffect: "新建自定义动效",
      importEffectBtn: "导入",
      thEffectName: "名称",
      thEffectUpdated: "更新时间",
      noCustomEffects: "还没有自定义动效。",
      backToCustomEffects: "返回自定义动效",
      effectNameLabel: "名称",
      startFromTemplate: "起始模板",
      templateBlank: "空白骨架",
      templateWaves: "Waves 源码",
      templateParticles: "Particles 源码",
      effectCode: "代码",
      effectCodeHint: "代码需要返回一个包含 init(cfg)、resize(state, width, height)、draw(ctx, canvas, state, dt) 的对象——和 PageDye 内置动效的形状完全一致。cfg 里有 color/bgColor/density/speed/text。可用的辅助函数：window.PageDyeEffects.helpers.{hexToRgba, effectSpeedMultiplier, clampPercent}。",
      effectPreviewLabel: "实时预览",
      exportEffectBtn: "导出",
      untitledEffect: "未命名动效",
      editBtn: "编辑",
      confirmDeleteEffect: "删除自定义动效“{name}”？正在使用它的站点会回退到 Waves。",
      customEffectsOptgroup: "自定义",
      manageCustomEffects: "管理自定义动效…",
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

  const UI_THEME_KEY = '__pagedye_ui_theme__';
  const CUSTOM_EFFECTS_KEY = '__pagedye_custom_effects__';
  const AI_CONFIG_KEY = '__pagedye_ai_config__';
  const UI_THEME_DEFAULTS = { pageBg: '#f1f5f9', containerBg: '#ffffff', pageBgImage: null, containerBgImage: null };
  let currentUiTheme = Object.assign({}, UI_THEME_DEFAULTS);

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
    themePageBg: document.getElementById('theme-page-bg'),
    themePageBgText: document.getElementById('theme-page-bg-text'),
    themeContainerBg: document.getElementById('theme-container-bg'),
    themeContainerBgText: document.getElementById('theme-container-bg-text'),
    themeResetBtn: document.getElementById('theme-reset-btn'),
    themePageBgDrop: document.getElementById('theme-page-bg-drop'),
    themePageBgFile: document.getElementById('theme-page-bg-file'),
    themePageBgFileInfo: document.getElementById('theme-page-bg-file-info'),
    themePageBgFilename: document.getElementById('theme-page-bg-filename'),
    themePageBgRemove: document.getElementById('theme-page-bg-remove'),
    themeContainerBgDrop: document.getElementById('theme-container-bg-drop'),
    themeContainerBgFile: document.getElementById('theme-container-bg-file'),
    themeContainerBgFileInfo: document.getElementById('theme-container-bg-file-info'),
    themeContainerBgFilename: document.getElementById('theme-container-bg-filename'),
    themeContainerBgRemove: document.getElementById('theme-container-bg-remove'),

    aiBaseUrl: document.getElementById('ai-base-url'),
    aiApiKey: document.getElementById('ai-api-key'),
    aiModel: document.getElementById('ai-model'),
    aiSaveBtn: document.getElementById('ai-save-btn'),
    aiSaveStatus: document.getElementById('ai-save-status'),

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
    editResetBtn: document.getElementById('edit-reset-btn'),

    // Custom effects
    customEffectsListBody: document.getElementById('custom-effects-list-body'),
    noCustomEffectsMsg: document.getElementById('no-custom-effects-msg'),
    newCustomEffectBtn: document.getElementById('new-custom-effect-btn'),
    importCustomEffectBtn: document.getElementById('import-custom-effect-btn'),
    importEffectFile: document.getElementById('import-effect-file'),
    editCustomEffectBackBtn: document.getElementById('edit-effect-back-btn'),
    editCustomEffectHeading: document.getElementById('edit-custom-effect-heading'),
    editCustomEffectName: document.getElementById('edit-custom-effect-name'),
    editCustomEffectTemplate: document.getElementById('edit-custom-effect-template'),
    editCustomEffectTemplateControl: document.getElementById('edit-custom-effect-template-control'),
    editCustomEffectCode: document.getElementById('edit-custom-effect-code'),
    editCustomEffectError: document.getElementById('edit-custom-effect-error'),
    editCustomEffectPreviewCanvas: document.getElementById('edit-custom-effect-preview-canvas'),
    editCustomEffectExportBtn: document.getElementById('edit-custom-effect-export-btn'),
    editCustomEffectExportDivider: document.getElementById('edit-custom-effect-export-divider'),
    editCustomEffectDeleteBtn: document.getElementById('edit-custom-effect-delete-btn'),
    editCustomEffectSaveBtn: document.getElementById('edit-custom-effect-save-btn')
  };

  // Init translations & versions
  initI18n();
  let editCssEditorController = initCodeEditor('edit-custom-css', 'edit-custom-css-editor', 'css');
  let editCustomEffectCodeController = initCodeEditor('edit-custom-effect-code', 'edit-custom-effect-code-editor', 'javascript');
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
  await loadCustomEffectsList();
  await populateCustomEffectOptions(document.getElementById('edit-effect-kind'));

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !Object.prototype.hasOwnProperty.call(changes, CUSTOM_EFFECTS_KEY)) return;
    populateCustomEffectOptions(document.getElementById('edit-effect-kind'));
    if (document.getElementById('section-custom-effects').classList.contains('active')) {
      loadCustomEffectsList();
    }
  });

  // Opened from the popup's "manage custom effects" link.
  if (location.hash === '#section-custom-effects') {
    const navBtn = document.querySelector('.nav-item[data-target="section-custom-effects"]');
    if (navBtn) navBtn.click();
  }

  // Load & wire up dashboard appearance (page/container background colors)
  await initUiTheme();

  // Sidebar navigation switching
  els.navItems.forEach(item => {
    item.addEventListener('click', () => {
      // Leaving the custom-effect editor (or any section) shouldn't leave
      // its live-preview rAF loop running in the background.
      window.PageDyeEffects.stopEffect();
      els.navItems.forEach(i => i.classList.remove('active'));
      els.sections.forEach(s => s.classList.remove('active'));

      item.classList.add('active');
      const targetId = item.dataset.target;
      document.getElementById(targetId).classList.add('active');
    });
  });

  // AI Pick settings: load existing config into the form, save on click.
  (async () => {
    const data = await chrome.storage.local.get(AI_CONFIG_KEY);
    const cfg = data[AI_CONFIG_KEY];
    if (cfg) {
      els.aiBaseUrl.value = cfg.baseUrl || '';
      els.aiApiKey.value = cfg.apiKey || '';
      els.aiModel.value = cfg.model || '';
    }
  })();

  els.aiSaveBtn.addEventListener('click', async () => {
    const cfg = {
      baseUrl: els.aiBaseUrl.value.trim(),
      apiKey: els.aiApiKey.value.trim(),
      model: els.aiModel.value.trim()
    };
    await chrome.storage.local.set({ [AI_CONFIG_KEY]: cfg });
    els.aiSaveStatus.textContent = t('aiSaved');
    setTimeout(() => { els.aiSaveStatus.textContent = ''; }, 2000);
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

  // ---- Custom Effects -------------------------------------------------

  let currentEditingEffectId = null;
  let effectPreviewDebounceTimer = null;

  function generateEffectId() {
    return 'ce_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  // Starter code offered when creating a new custom effect. "waves" and
  // "particles" are real ports of the built-in engines (scripts/effects.js)
  // so users can study/tweak working code instead of an API doc + a blank
  // page — the color/speed helpers those engines reach via closure are
  // called through window.PageDyeEffects.helpers here since compiled custom
  // code runs in the global scope, not inside that module's closure.
  const CUSTOM_EFFECT_TEMPLATES = {
    blank:
`return {
  init(cfg) {
    return { width: 0, height: 0, t: 0, cfg };
  },
  resize(state, width, height) {
    state.width = width;
    state.height = height;
  },
  draw(ctx, canvas, state, dt) {
    const { width, height, cfg } = state;
    if (!width || !height) return;
    state.t += dt;

    ctx.fillStyle = cfg.bgColor;
    ctx.fillRect(0, 0, width, height);

    const helpers = window.PageDyeEffects.helpers;
    const speedMul = helpers.effectSpeedMultiplier(cfg.speed);
    const r = 20 + (cfg.density / 100) * 40 + 10 * Math.sin(state.t * 0.003 * speedMul);
    ctx.fillStyle = cfg.color;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, Math.max(4, r), 0, Math.PI * 2);
    ctx.fill();
  }
};`,
    waves:
`return {
  init(cfg) {
    return { width: 0, height: 0, phase: 0, lineCount: 6, cfg };
  },
  resize(state, width, height) {
    state.width = width;
    state.height = height;
    // density 0-100 maps to 3-14 stacked wave lines.
    state.lineCount = Math.max(2, Math.round(3 + (state.cfg.density / 100) * 11));
  },
  draw(ctx, canvas, state, dt) {
    const { width, height, lineCount, cfg } = state;
    if (!width || !height) return;
    const helpers = window.PageDyeEffects.helpers;
    state.phase += dt * 0.0006 * helpers.effectSpeedMultiplier(cfg.speed);

    ctx.fillStyle = cfg.bgColor;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < lineCount; i++) {
      const t = i / (lineCount - 1 || 1);
      const baseY = height * (0.3 + t * 0.5);
      const amplitude = 24 + t * 40;
      const freq = 0.006 + t * 0.002;
      const speed = 1 + t * 0.6;
      const opacity = 0.12 + (1 - t) * 0.25;

      ctx.beginPath();
      ctx.strokeStyle = helpers.hexToRgba(cfg.color, opacity);
      ctx.lineWidth = 1.5;
      for (let x = 0; x <= width; x += 4) {
        const y = baseY + Math.sin(x * freq + state.phase * speed) * amplitude;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
};`,
    particles:
`return {
  init(cfg) {
    return { width: 0, height: 0, particles: [], mouse: { x: -9999, y: -9999 }, cfg };
  },
  resize(state, width, height) {
    state.width = width;
    state.height = height;
    const helpers = window.PageDyeEffects.helpers;
    // density 0-100 maps to particle count ~20-220.
    const target = Math.round(20 + (state.cfg.density / 100) * 200);
    const count = Math.min(240, Math.max(10, target));
    const speedMul = helpers.effectSpeedMultiplier(state.cfg.speed);
    state.particles = new Array(count).fill(0).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 24 * speedMul,
      vy: (Math.random() - 0.5) * 24 * speedMul
    }));
  },
  onMouseMove(state, e, canvas) {
    const rect = canvas.getBoundingClientRect();
    state.mouse.x = e.clientX - rect.left;
    state.mouse.y = e.clientY - rect.top;
  },
  draw(ctx, canvas, state, dt) {
    const { width, height, particles, mouse, cfg } = state;
    if (!width || !height) return;
    const helpers = window.PageDyeEffects.helpers;
    ctx.fillStyle = cfg.bgColor;
    ctx.fillRect(0, 0, width, height);

    const dtSec = dt / 1000;
    const repelRadius = 90;
    const speedMul = helpers.effectSpeedMultiplier(cfg.speed);

    particles.forEach((p) => {
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      if (dist < repelRadius) {
        const force = (1 - dist / repelRadius) * 260 * speedMul;
        p.vx += (dx / dist) * force * dtSec;
        p.vy += (dy / dist) * force * dtSec;
      }
      p.x += p.vx * dtSec;
      p.y += p.vy * dtSec;
      p.vx *= 0.98;
      p.vy *= 0.98;
      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;
      p.x = Math.max(0, Math.min(width, p.x));
      p.y = Math.max(0, Math.min(height, p.y));
    });

    ctx.strokeStyle = helpers.hexToRgba(cfg.color, 0.15);
    ctx.lineWidth = 1;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i];
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.globalAlpha = 1 - dist / 120;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = cfg.color;
    particles.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    });
  }
};`
  };

  async function loadCustomEffectsList() {
    els.customEffectsListBody.innerHTML = '';
    const data = await chrome.storage.local.get(CUSTOM_EFFECTS_KEY);
    const list = (data[CUSTOM_EFFECTS_KEY] || []).slice().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

    if (list.length === 0) {
      els.noCustomEffectsMsg.classList.remove('hidden');
      document.querySelector('.effects-table').classList.add('hidden');
      return;
    }

    els.noCustomEffectsMsg.classList.add('hidden');
    document.querySelector('.effects-table').classList.remove('hidden');

    list.forEach((entry) => {
      const tr = document.createElement('tr');

      const tdName = document.createElement('td');
      tdName.textContent = entry.name || t('untitledEffect');
      tr.appendChild(tdName);

      const tdUpdated = document.createElement('td');
      tdUpdated.textContent = entry.updatedAt ? new Date(entry.updatedAt).toLocaleDateString() : '';
      tr.appendChild(tdUpdated);

      const tdActions = document.createElement('td');
      const actionsWrap = document.createElement('div');
      actionsWrap.className = 'effect-actions-cell';
      tdActions.appendChild(actionsWrap);

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'ghost-link-btn';
      editBtn.textContent = t('editBtn');
      editBtn.addEventListener('click', () => openEditCustomEffect(entry.id));
      actionsWrap.appendChild(editBtn);

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
        if (!(await showConfirm(t('confirmDeleteEffect').replace('{name}', entry.name || t('untitledEffect'))))) return;
        const freshData = await chrome.storage.local.get(CUSTOM_EFFECTS_KEY);
        const freshList = (freshData[CUSTOM_EFFECTS_KEY] || []).filter((e) => e.id !== entry.id);
        await chrome.storage.local.set({ [CUSTOM_EFFECTS_KEY]: freshList });
        await loadCustomEffectsList();
      });
      actionsWrap.appendChild(deleteBtn);

      tr.appendChild(tdActions);
      els.customEffectsListBody.appendChild(tr);
    });
  }

  // Compiles the in-progress code and, only if it's valid, runs it live on
  // the small preview canvas — a syntax/runtime error shows the red banner
  // instead of silently falling back to a built-in effect the way the
  // production startEffect() path does (that fallback is right for a real
  // site background, but would be confusing here: "why does my broken code
  // look fine?").
  function updateCustomEffectPreview() {
    clearTimeout(effectPreviewDebounceTimer);
    effectPreviewDebounceTimer = setTimeout(() => {
      window.PageDyeEffects.stopEffect();
      const canvas = els.editCustomEffectPreviewCanvas;
      const code = els.editCustomEffectCode.value;

      if (!code.trim()) {
        els.editCustomEffectError.classList.add('hidden');
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      const compiled = window.PageDyeEffects.compileCustomEffect(code);
      if (!compiled.ok) {
        els.editCustomEffectError.textContent = compiled.error;
        els.editCustomEffectError.classList.remove('hidden');
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      els.editCustomEffectError.classList.add('hidden');
      window.PageDyeEffects.startEffect(
        canvas,
        'custom:__preview__',
        100,
        { color: '#ffffff', bgColor: '#000000', density: 50, speed: 50, text: 'PageDye' },
        [{ id: '__preview__', code }],
        (err) => {
          els.editCustomEffectError.textContent = (err && err.message) ? err.message : String(err);
          els.editCustomEffectError.classList.remove('hidden');
        }
      );
    }, 350);
  }

  function openNewCustomEffect() {
    currentEditingEffectId = null;
    els.editCustomEffectHeading.textContent = t('newCustomEffect');
    els.editCustomEffectName.value = '';
    els.editCustomEffectTemplateControl.classList.remove('hidden');
    els.editCustomEffectTemplate.value = 'blank';
    els.editCustomEffectCode.value = CUSTOM_EFFECT_TEMPLATES.blank;
    editCustomEffectCodeController.update();
    els.editCustomEffectError.classList.add('hidden');
    els.editCustomEffectDeleteBtn.classList.add('hidden');
    els.editCustomEffectExportBtn.classList.add('hidden');
    els.editCustomEffectExportDivider.classList.add('hidden');

    els.sections.forEach((s) => s.classList.remove('active'));
    document.getElementById('section-edit-custom-effect').classList.add('active');
    updateCustomEffectPreview();
  }

  async function openEditCustomEffect(id) {
    const data = await chrome.storage.local.get(CUSTOM_EFFECTS_KEY);
    const entry = (data[CUSTOM_EFFECTS_KEY] || []).find((e) => e.id === id);
    if (!entry) return;

    currentEditingEffectId = id;
    els.editCustomEffectHeading.textContent = entry.name || t('untitledEffect');
    els.editCustomEffectName.value = entry.name || '';
    // Editing existing code — the template picker would silently overwrite
    // it, so it's only offered when creating a new effect.
    els.editCustomEffectTemplateControl.classList.add('hidden');
    els.editCustomEffectCode.value = entry.code;
    editCustomEffectCodeController.update();
    els.editCustomEffectError.classList.add('hidden');
    els.editCustomEffectDeleteBtn.classList.remove('hidden');
    els.editCustomEffectExportBtn.classList.remove('hidden');
    els.editCustomEffectExportDivider.classList.remove('hidden');

    els.sections.forEach((s) => s.classList.remove('active'));
    document.getElementById('section-edit-custom-effect').classList.add('active');
    updateCustomEffectPreview();
  }

  function closeCustomEffectEditor() {
    window.PageDyeEffects.stopEffect();
    els.sections.forEach((s) => s.classList.remove('active'));
    document.getElementById('section-custom-effects').classList.add('active');
    loadCustomEffectsList();
  }

  async function saveCustomEffect() {
    const name = els.editCustomEffectName.value.trim() || t('untitledEffect');
    const code = els.editCustomEffectCode.value;

    const compiled = window.PageDyeEffects.compileCustomEffect(code);
    if (!compiled.ok) {
      els.editCustomEffectError.textContent = compiled.error;
      els.editCustomEffectError.classList.remove('hidden');
      return;
    }

    const data = await chrome.storage.local.get(CUSTOM_EFFECTS_KEY);
    const list = data[CUSTOM_EFFECTS_KEY] || [];
    const id = currentEditingEffectId || generateEffectId();
    const entry = { id, name, code, updatedAt: Date.now() };
    const idx = list.findIndex((e) => e.id === id);
    if (idx >= 0) list[idx] = entry; else list.push(entry);
    await chrome.storage.local.set({ [CUSTOM_EFFECTS_KEY]: list });

    showStatus(t('saved'));
    closeCustomEffectEditor();
  }

  function exportCustomEffectEntry(entry) {
    const payload = { pagedyeCustomEffect: true, name: entry.name, code: entry.code };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pagedye-effect-${(entry.name || 'effect').replace(/[^a-z0-9-_]+/gi, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importCustomEffectFile(file) {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!parsed || typeof parsed.code !== 'string') {
          showStatus(t('importError'));
          return;
        }
        const data = await chrome.storage.local.get(CUSTOM_EFFECTS_KEY);
        const list = data[CUSTOM_EFFECTS_KEY] || [];
        list.push({ id: generateEffectId(), name: parsed.name || t('untitledEffect'), code: parsed.code, updatedAt: Date.now() });
        await chrome.storage.local.set({ [CUSTOM_EFFECTS_KEY]: list });
        await loadCustomEffectsList();
        showStatus(t('importSuccess'));
      } catch (err) {
        console.error(err);
        showStatus(t('importError'));
      }
    };
    reader.readAsText(file);
  }

  // Appends the user's custom effects as an <optgroup> after the built-in
  // <option>s of a per-site "Effect" <select> (edit-effect-kind here,
  // popup.js's #effect-kind mirrors this). Re-run on every load and again
  // whenever the custom-effect library changes so an edit/delete/rename
  // shows up without reopening the page.
  async function populateCustomEffectOptions(selectEl) {
    if (!selectEl) return;
    const previousValue = selectEl.value;
    const existingGroup = selectEl.querySelector('optgroup[data-custom-effects]');
    if (existingGroup) existingGroup.remove();

    const data = await chrome.storage.local.get(CUSTOM_EFFECTS_KEY);
    const list = data[CUSTOM_EFFECTS_KEY] || [];
    if (list.length > 0) {
      const group = document.createElement('optgroup');
      group.setAttribute('data-custom-effects', '');
      group.label = t('customEffectsOptgroup');
      list.forEach((entry) => {
        const opt = document.createElement('option');
        opt.value = 'custom:' + entry.id;
        opt.textContent = entry.name || t('untitledEffect');
        group.appendChild(opt);
      });
      selectEl.appendChild(group);
    }

    if (previousValue && Array.from(selectEl.options).some((o) => o.value === previousValue)) {
      selectEl.value = previousValue;
    }
  }

  async function exportConfigs() {
    try {
      const data = await chrome.storage.local.get(null);
      delete data[UI_THEME_KEY];
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
        const staleKeys = Object.keys(existing).filter((key) => key !== UI_THEME_KEY && !(key in importedData));
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
    const themeData = await chrome.storage.local.get(UI_THEME_KEY);
    await chrome.storage.local.clear();
    if (themeData[UI_THEME_KEY]) {
      await chrome.storage.local.set({ [UI_THEME_KEY]: themeData[UI_THEME_KEY] });
    }
    await loadSitesList();
    showStatus(t('clearAllDone'));
  }

  // Dashboard Appearance (page/container background colors & images)
  async function initUiTheme() {
    const data = await chrome.storage.local.get(UI_THEME_KEY);
    currentUiTheme = Object.assign({}, UI_THEME_DEFAULTS, data[UI_THEME_KEY] || {});
    applyUiTheme(currentUiTheme);
    syncUiThemeInputs(currentUiTheme);

    const onPageBgChange = (value) => {
      els.themePageBg.value = value;
      els.themePageBgText.value = value;
      saveUiTheme({ pageBg: value });
    };
    const onContainerBgChange = (value) => {
      els.themeContainerBg.value = value;
      els.themeContainerBgText.value = value;
      saveUiTheme({ containerBg: value });
    };

    els.themePageBg.addEventListener('input', (e) => onPageBgChange(e.target.value));
    els.themePageBgText.addEventListener('change', (e) => {
      if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) onPageBgChange(e.target.value);
    });
    els.themeContainerBg.addEventListener('input', (e) => onContainerBgChange(e.target.value));
    els.themeContainerBgText.addEventListener('change', (e) => {
      if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) onContainerBgChange(e.target.value);
    });

    setupThemeImageUpload('page', els.themePageBgDrop, els.themePageBgFile, els.themePageBgFileInfo, els.themePageBgFilename, els.themePageBgRemove);
    setupThemeImageUpload('container', els.themeContainerBgDrop, els.themeContainerBgFile, els.themeContainerBgFileInfo, els.themeContainerBgFilename, els.themeContainerBgRemove);

    els.themeResetBtn.addEventListener('click', async () => {
      await chrome.storage.local.remove(UI_THEME_KEY);
      currentUiTheme = Object.assign({}, UI_THEME_DEFAULTS);
      applyUiTheme(currentUiTheme);
      syncUiThemeInputs(currentUiTheme);
      showStatus(t('appearanceResetDone'));
    });
  }

  function setupThemeImageUpload(field, dropEl, fileEl, fileInfoEl, filenameEl, removeEl) {
    const imageKey = field === 'page' ? 'pageBgImage' : 'containerBgImage';

    dropEl.addEventListener('click', () => fileEl.click());
    dropEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropEl.classList.add('dragover');
    });
    dropEl.addEventListener('dragleave', () => dropEl.classList.remove('dragover'));
    dropEl.addEventListener('drop', (e) => {
      e.preventDefault();
      dropEl.classList.remove('dragover');
      if (e.dataTransfer.files.length) handleThemeImageFile(e.dataTransfer.files[0]);
    });
    fileEl.addEventListener('change', (e) => {
      if (e.target.files.length) handleThemeImageFile(e.target.files[0]);
    });

    function handleThemeImageFile(file) {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const image = { data: e.target.result, name: file.name };
        dropEl.classList.add('hidden');
        fileInfoEl.classList.remove('hidden');
        filenameEl.textContent = file.name;
        saveUiTheme({ [imageKey]: image });
      };
      reader.readAsDataURL(file);
    }

    removeEl.addEventListener('click', () => {
      fileEl.value = '';
      dropEl.classList.remove('hidden');
      fileInfoEl.classList.add('hidden');
      saveUiTheme({ [imageKey]: null });
    });
  }

  function syncUiThemeInputs(theme) {
    els.themePageBg.value = theme.pageBg;
    els.themePageBgText.value = theme.pageBg;
    els.themeContainerBg.value = theme.containerBg;
    els.themeContainerBgText.value = theme.containerBg;

    syncThemeImageUi(theme.pageBgImage, els.themePageBgDrop, els.themePageBgFileInfo, els.themePageBgFilename);
    syncThemeImageUi(theme.containerBgImage, els.themeContainerBgDrop, els.themeContainerBgFileInfo, els.themeContainerBgFilename);
  }

  function syncThemeImageUi(image, dropEl, fileInfoEl, filenameEl) {
    if (image && image.data) {
      dropEl.classList.add('hidden');
      fileInfoEl.classList.remove('hidden');
      filenameEl.textContent = image.name || t('savedImage');
    } else {
      dropEl.classList.remove('hidden');
      fileInfoEl.classList.add('hidden');
    }
  }

  function applyUiTheme(theme) {
    const root = document.documentElement.style;
    root.setProperty('--bg-outer', theme.pageBg);
    root.setProperty('--bg-color', theme.pageBg);
    root.setProperty('--surface-card', theme.containerBg);
    root.setProperty('--sidebar-bg', theme.containerBg);

    applyThemeBgImage(document.body, theme.pageBgImage);
    applyThemeBgImage(document.querySelector('.dashboard-container'), theme.containerBgImage);
    applyThemeBgImage(document.querySelector('.sidebar'), theme.containerBgImage);
  }

  function applyThemeBgImage(el, image) {
    if (!el) return;
    if (image && image.data) {
      el.style.backgroundImage = `url('${image.data}')`;
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
      el.style.backgroundRepeat = 'no-repeat';
    } else {
      el.style.backgroundImage = '';
      el.style.backgroundSize = '';
      el.style.backgroundPosition = '';
      el.style.backgroundRepeat = '';
    }
  }

  let themeSaveDebounceTimer = null;
  function saveUiTheme(partial) {
    currentUiTheme = Object.assign({}, currentUiTheme, partial);
    applyUiTheme(currentUiTheme);

    if (themeSaveDebounceTimer) clearTimeout(themeSaveDebounceTimer);
    themeSaveDebounceTimer = setTimeout(async () => {
      await chrome.storage.local.set({ [UI_THEME_KEY]: currentUiTheme });
      showStatus(t('appearanceSaved'));
    }, 300);
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
      document.getElementById('edit-effect-text').value = subSettings.effectText || 'PageDye';
      document.getElementById('edit-effect-text-control').classList.toggle('hidden', document.getElementById('edit-effect-kind').value !== 'typewriter');
      document.getElementById('edit-effect-color-scheme').value = subSettings.effectColorScheme || 'auto';
      document.getElementById('edit-effect-color-custom-control').classList.toggle('hidden', document.getElementById('edit-effect-color-scheme').value !== 'custom');
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
      dest.effectText = document.getElementById('edit-effect-text').value || 'PageDye';
      dest.effectColorScheme = document.getElementById('edit-effect-color-scheme').value;
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
    document.getElementById('edit-effect-text').value = 'PageDye';
    document.getElementById('edit-effect-text-control').classList.add('hidden');
    document.getElementById('edit-effect-color-scheme').value = 'auto';
    document.getElementById('edit-effect-color-custom-control').classList.add('hidden');
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
                await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['scripts/gradient.js', 'scripts/effects.js', 'scripts/content.js'] });
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
      // Full opacity makes an effect's flat bgColor look harsh; nudge a
      // still-untouched (100%) slider down when switching into this type.
      if (radio.value === 'effect' && document.getElementById('edit-opacity').value === '100') {
        document.getElementById('edit-opacity').value = 85;
        document.getElementById('edit-opacity-val').textContent = '85%';
      }
      updateEditUI(radio.value);
      updateEditInteractivePreviews();
      triggerEditImmediateSave();
    });
  });

  // Effect kind / color / density / speed
  document.getElementById('edit-effect-kind').addEventListener('change', () => {
    document.getElementById('edit-effect-text-control').classList.toggle(
      'hidden', document.getElementById('edit-effect-kind').value !== 'typewriter'
    );
    triggerEditImmediateSave();
  });
  document.getElementById('edit-effect-text').addEventListener('input', () => queueEditAutoSave());
  document.getElementById('edit-effect-color-scheme').addEventListener('change', () => {
    document.getElementById('edit-effect-color-custom-control').classList.toggle(
      'hidden', document.getElementById('edit-effect-color-scheme').value !== 'custom'
    );
    triggerEditImmediateSave();
  });
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

  // Custom Effects
  els.newCustomEffectBtn.addEventListener('click', openNewCustomEffect);
  els.editCustomEffectBackBtn.addEventListener('click', closeCustomEffectEditor);
  els.editCustomEffectSaveBtn.addEventListener('click', saveCustomEffect);

  els.editCustomEffectTemplate.addEventListener('change', () => {
    const tpl = CUSTOM_EFFECT_TEMPLATES[els.editCustomEffectTemplate.value];
    if (tpl === undefined) return;
    els.editCustomEffectCode.value = tpl;
    editCustomEffectCodeController.update();
    updateCustomEffectPreview();
  });

  els.editCustomEffectCode.addEventListener('input', updateCustomEffectPreview);

  els.editCustomEffectDeleteBtn.addEventListener('click', async () => {
    if (!currentEditingEffectId) return;
    const name = els.editCustomEffectName.value.trim() || t('untitledEffect');
    if (!(await showConfirm(t('confirmDeleteEffect').replace('{name}', name)))) return;
    const data = await chrome.storage.local.get(CUSTOM_EFFECTS_KEY);
    const list = (data[CUSTOM_EFFECTS_KEY] || []).filter((e) => e.id !== currentEditingEffectId);
    await chrome.storage.local.set({ [CUSTOM_EFFECTS_KEY]: list });
    closeCustomEffectEditor();
  });

  els.editCustomEffectExportBtn.addEventListener('click', async () => {
    if (!currentEditingEffectId) return;
    const data = await chrome.storage.local.get(CUSTOM_EFFECTS_KEY);
    const entry = (data[CUSTOM_EFFECTS_KEY] || []).find((e) => e.id === currentEditingEffectId);
    if (entry) exportCustomEffectEntry(entry);
  });

  els.importCustomEffectBtn.addEventListener('click', () => els.importEffectFile.click());
  els.importEffectFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) importCustomEffectFile(file);
    e.target.value = '';
  });
});

// language defaults to 'css'. When Prism doesn't have a grammar for the
// requested language loaded (lib/prism.js only bundles core+css — no
// javascript/clike component), falls back to plain escaped text so the
// gutter/tab/bracket-autocomplete behavior below still works without color
// highlighting, rather than throwing on Prism.highlight(code, undefined, ...).
function initCodeEditor(textareaId, containerId, language) {
  language = language || 'css';
  const textarea = document.getElementById(textareaId);
  const container = document.getElementById(containerId);
  if (!textarea || !container) return null;

  const gutter = container.querySelector('.editor-gutter');
  const codeBlock = container.querySelector('.editor-highlight code');
  const preBlock = container.querySelector('.editor-highlight');
  const grammar = window.Prism && Prism.languages[language];

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function updateEditor() {
    let code = textarea.value;
    const isPlaceholder = !code;

    if (isPlaceholder) {
      code = textarea.getAttribute('placeholder') || '';
      container.classList.add('placeholder-active');
    } else {
      container.classList.remove('placeholder-active');
    }

    const highlighted = grammar ? Prism.highlight(code, grammar, language) : escapeHtml(code);
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
