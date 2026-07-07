// Self-contained element picker. This function is serialized and injected
// into the page via chrome.scripting.executeScript, so it must NOT reference
// anything from the popup's scope (everything it needs comes via arguments).
// It highlights the hovered element, and on click writes the final settings
// (current form state + the picked selector) straight to storage for this
// domain. The content script's storage listener then paints that element
// immediately — no popup reopen required.
function pagedyeElementPicker(settings, domain, fieldPath) {
  if (window.__pagedyePicking) return;
  window.__pagedyePicking = true;

  const box = document.createElement('div');
  Object.assign(box.style, {
    position: 'fixed', zIndex: '2147483647', pointerEvents: 'none',
    border: '2px solid #2563eb', background: 'rgba(37,99,235,0.2)',
    boxSizing: 'border-box', borderRadius: '2px', display: 'none', top: '0', left: '0'
  });

  const label = document.createElement('div');
  Object.assign(label.style, {
    position: 'fixed', zIndex: '2147483647', pointerEvents: 'none',
    background: '#111827', color: '#fff',
    font: '12px/1.4 ui-monospace, Menlo, Consolas, monospace',
    padding: '4px 8px', borderRadius: '4px', maxWidth: '60vw',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)', display: 'none'
  });

  const tip = document.createElement('div');
  tip.textContent = 'PageDye: click an element to apply your background to it · Esc to cancel';
  Object.assign(tip.style, {
    position: 'fixed', zIndex: '2147483647', pointerEvents: 'none',
    top: '12px', left: '50%', transform: 'translateX(-50%)',
    background: '#2563eb', color: '#fff',
    font: '13px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    padding: '6px 14px', borderRadius: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
  });

  document.documentElement.appendChild(box);
  document.documentElement.appendChild(label);
  document.documentElement.appendChild(tip);

  let current = null;

  function cssEscape(s) {
    if (window.CSS && CSS.escape) return CSS.escape(s);
    return String(s).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
  }

  function getSelector(el) {
    if (!el || el.nodeType !== 1) return '';
    if (el.id) return '#' + cssEscape(el.id);

    const parts = [];
    let node = el;
    while (node && node.nodeType === 1 && node.tagName.toLowerCase() !== 'html') {
      if (node.id) { parts.unshift('#' + cssEscape(node.id)); break; }

      let part = node.tagName.toLowerCase();
      const classes = Array.from(node.classList).filter((c) => c && !c.startsWith('pagedye'));
      if (classes.length) {
        part += '.' + classes.slice(0, 3).map(cssEscape).join('.');
      } else if (node.parentElement) {
        const sameTag = Array.from(node.parentElement.children).filter((c) => c.tagName === node.tagName);
        if (sameTag.length > 1) part += ':nth-of-type(' + (sameTag.indexOf(node) + 1) + ')';
      }
      parts.unshift(part);

      if (node.tagName.toLowerCase() === 'body') break;
      node = node.parentElement;
      if (parts.length >= 6) break;
    }
    return parts.join(' > ');
  }

  function onMove(e) {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || el === box || el === label || el === tip) return;
    current = el;
    const r = el.getBoundingClientRect();
    Object.assign(box.style, {
      display: 'block', left: r.left + 'px', top: r.top + 'px',
      width: r.width + 'px', height: r.height + 'px'
    });
    label.textContent = getSelector(el);
    label.style.display = 'block';
    label.style.left = Math.min(e.clientX + 14, window.innerWidth - 220) + 'px';
    label.style.top = (e.clientY + 18) + 'px';
  }

  function cleanup() {
    document.removeEventListener('mousemove', onMove, true);
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('keydown', onKey, true);
    box.remove();
    label.remove();
    tip.remove();
    window.__pagedyePicking = false;
  }

  function onClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    const el = current || document.elementFromPoint(e.clientX, e.clientY);
    const selector = getSelector(el);
    try {
      const path = fieldPath && fieldPath.length ? fieldPath : ['targetSelector'];
      const next = JSON.parse(JSON.stringify(settings));
      let obj = next;
      for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        const nextKey = path[i + 1];
        if (obj[key] === undefined || obj[key] === null) {
          obj[key] = (typeof nextKey === 'number') ? [] : {};
        }
        obj = obj[key];
      }
      obj[path[path.length - 1]] = selector;
      // frostedGlass entries need blur/opacity alongside the selector — back
      // them in with defaults if this picker call just created the entry.
      if (path[0] === 'frostedGlass' && path.length > 1) {
        if (typeof obj.blur !== 'number') obj.blur = 12;
        if (typeof obj.opacity !== 'number') obj.opacity = 55;
      }
      chrome.storage.local.set({ [domain]: next });
    } catch (err) { /* storage unavailable */ }
    cleanup();
  }

  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); cleanup(); }
  }

  document.addEventListener('mousemove', onMove, true);
  document.addEventListener('click', onClick, true);
  document.addEventListener('keydown', onKey, true);
}

document.addEventListener('DOMContentLoaded', async () => {
  // Translations
  const i18n = {
    en: {
      title: "PageDye Settings",
      appName: "PageDye",
      bgType: "Background Type",
      typeNone: "None",
      typeColor: "Color",
      typeImage: "Image",
      typeEffect: "Effects",
      effectKind: "Effect",
      effectKindHint: "A minimalist black & white animated wallpaper, rendered locally with Canvas — no external assets.",
      customEffectsOptgroup: "Custom",
      untitledEffect: "Untitled Effect",
      manageCustomEffects: "Manage custom effects…",
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
      noTab: "No Active Tab",
      invalidUrl: "Invalid URL",
      tabWallpaper: "Wallpaper",
      tabFrostedGlass: "Frosted Glass",
      advanced: "Advanced",
      targetSelector: "Background Selector",
      targetSelectorHint: "Pick an element (or type a CSS selector) and PageDye applies your color/image directly to that element instead of the whole page. Leave empty for a full-page background.",
      pickElement: "Pick",
      deepCompat: "Deep Compatibility Mode",
      deepCompatBadge: "For stubborn sites",
      deepCompatEnable: "Enable for this site",
      deepCompatHint: "For stubborn sites (e.g. Google's mobile pages) where several stacked opaque containers hide the background no matter what. Automatically detects and neutralizes full-viewport opaque layers — including a mosaic of many small opaque cards, not just one big wrapper. May occasionally strip a background some element needed for contrast — use the exclude field below if so.",
      deepCompatExcludePlaceholder: "Exclude selector (optional): .modal, [role=dialog]",
      frostedGlass: "Frosted Glass",
      frostedGlassHint: "Pick a card/container element and PageDye makes its background semi-transparent and blurred, so your wallpaper shows through underneath it.",
      frostedBlur: "Blur",
      frostedOpacity: "Tint",
      frostedAddBtn: "+ Add element",
      customCss: "Custom CSS",
      customCssHint: "Injected into this site. Use !important to override stubborn styles.",
      pickerFailed: "Can't pick on this page",
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
      selectSchemeToEdit: "Select background to edit",
      statusSynced: "Synced",
      statusSaving: "Saving...",
      dragOrClick: "Drag image here, or",
      chooseFile: "choose file",
      orPasteUrl: "Or paste image URL",
      adjustStyles: "Adjust Styles",
      activeImage: "Wallpaper Image",
      savedImage: "Saved Image",
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
      title: "PageDye 设置",
      appName: "PageDye",
      bgType: "背景类型",
      typeNone: "无",
      typeColor: "颜色",
      typeImage: "图片",
      typeEffect: "动效",
      effectKind: "特效",
      effectKindHint: "极简黑白动态壁纸，完全通过 Canvas 本地渲染，不依赖任何外部资源。",
      customEffectsOptgroup: "自定义",
      untitledEffect: "未命名动效",
      manageCustomEffects: "管理自定义动效…",
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
      noTab: "无活动标签页",
      invalidUrl: "无效的链接",
      tabWallpaper: "壁纸",
      tabFrostedGlass: "磨砂玻璃",
      advanced: "高级设置",
      targetSelector: "背景选择器",
      targetSelectorHint: "拾取一个元素（或手动输入 CSS 选择器），PageDye 会把颜色/图片直接应用到该元素，而不是整页。留空则为整页背景。",
      pickElement: "拾取",
      deepCompat: "深度兼容模式",
      deepCompatBadge: "顽固网站专用",
      deepCompatEnable: "为此网站启用",
      deepCompatHint: "适用于顽固网站（例如 Google 移动端页面）：多层不透明容器叠在一起，导致无论怎么设置背景都被遮住。开启后会自动检测并清除铺满视口的不透明背景层——包括由许多小块不透明卡片拼成的情况，不只是单个大容器。可能偶尔误伤某些依赖背景色做对比度的元素，遇到这种情况可在下方填入排除选择器。",
      deepCompatExcludePlaceholder: "排除选择器（可选）：.modal, [role=dialog]",
      frostedGlass: "磨砂玻璃",
      frostedGlassHint: "拾取一个卡片/容器元素，PageDye 会让它的背景变为半透明并加上模糊效果，让底层的壁纸若隐若现地透上来。",
      frostedBlur: "模糊度",
      frostedOpacity: "透明度",
      frostedAddBtn: "+ 添加元素",
      customCss: "自定义 CSS",
      customCssHint: "将注入到本网站。可用 !important 覆盖顽固样式。",
      pickerFailed: "此页面无法拾取",
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
      selectSchemeToEdit: "选择要编辑的背景",
      statusSynced: "配置已同步",
      statusSaving: "正在保存...",
      dragOrClick: "拖拽图片至此，或",
      chooseFile: "选择文件",
      orPasteUrl: "或输入图片链接",
      adjustStyles: "调整壁纸样式",
      activeImage: "当前图片",
      savedImage: "已保存的壁纸",
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

  // Elements
  const els = {
    domainBadge: document.getElementById('current-domain'),
    bgTypes: document.getElementsByName('bgType'),
    sectionColor: document.getElementById('section-color'),
    sectionImage: document.getElementById('section-image'),
    sectionEffects: document.getElementById('section-effects'),
    effectKind: document.getElementById('effect-kind'),
    manageCustomEffectsLink: document.getElementById('manage-custom-effects-link'),
    effectTextControl: document.getElementById('effect-text-control'),
    effectText: document.getElementById('effect-text'),
    effectColorScheme: document.getElementById('effect-color-scheme'),
    effectColorCustomControl: document.getElementById('effect-color-custom-control'),
    effectColor: document.getElementById('effect-color'),
    effectColorText: document.getElementById('effect-color-text'),
    effectBgColor: document.getElementById('effect-bg-color'),
    effectBgColorText: document.getElementById('effect-bg-color-text'),
    effectDensity: document.getElementById('effect-density'),
    effectDensityVal: document.getElementById('effect-density-val'),
    effectSpeed: document.getElementById('effect-speed'),
    effectSpeedVal: document.getElementById('effect-speed-val'),
    sectionStyles: document.getElementById('section-styles'),
    colorPicker: document.getElementById('color-picker'),
    colorText: document.getElementById('color-text'),
    imageUrl: document.getElementById('image-url'),
    dropArea: document.getElementById('drop-area'),
    fileInput: document.getElementById('image-file'),
    fileInfo: document.getElementById('file-info'),
    fileName: document.querySelector('.filename'),
    removeFileBtn: document.getElementById('remove-file'),
    
    // Preview
    imagePreview: document.getElementById('image-preview'),
    imagePreviewBg: document.getElementById('image-preview-bg'),
    
    opacity: document.getElementById('opacity'),
    opacityVal: document.getElementById('opacity-val'),
    blur: document.getElementById('blur'),
    blurVal: document.getElementById('blur-val'),
    blurControl: document.getElementById('blur-control'),
    bgFixed: document.getElementById('bg-fixed'),
    bgSize: document.getElementById('bg-size'),
    bgRepeat: document.getElementById('bg-repeat'),
    imageOptions: document.getElementById('image-options'),

    // Gradient
    colorModes: document.getElementsByName('colorMode'),
    solidColorPanel: document.getElementById('solid-color-panel'),
    gradientPanel: document.getElementById('gradient-panel'),
    gradientPreviewBg: document.getElementById('gradient-preview-bg'),
    gradientKinds: document.getElementsByName('gradientKind'),
    gradientAngleControl: document.getElementById('gradient-angle-control'),
    gradientAngle: document.getElementById('gradient-angle'),
    gradientAngleVal: document.getElementById('gradient-angle-val'),
    gradientShapeControl: document.getElementById('gradient-shape-control'),
    gradientShape: document.getElementById('gradient-shape'),
    gradientStopsList: document.getElementById('gradient-stops-list'),
    gradientAddStop: document.getElementById('gradient-add-stop'),
    gradientPresetsGrid: document.getElementById('gradient-presets-grid'),
    gradientExtractBtn: document.getElementById('gradient-extract-btn'),
    gradientGenerateBtn: document.getElementById('gradient-generate-btn'),
    gradientAnimated: document.getElementById('gradient-animated'),
    gradientSpeedControl: document.getElementById('gradient-speed-control'),
    gradientSpeed: document.getElementById('gradient-speed'),
    gradientSpeedVal: document.getElementById('gradient-speed-val'),

    // Advanced
    targetSelector: document.getElementById('target-selector'),
    pickBtn: document.getElementById('pick-btn'),
    deepCompatToggle: document.getElementById('deep-compat-toggle'),
    deepCompatExclude: document.getElementById('deep-compat-exclude'),
    frostedList: document.getElementById('frosted-list'),
    frostedAddBtn: document.getElementById('frosted-add-btn'),
    customCss: document.getElementById('custom-css'),
    settingsBtn: document.getElementById('settings-btn'),

    resetBtn: document.getElementById('reset-btn'),

    // Modes & Schemes
    wpModes: document.getElementsByName('wpMode'),
    schemeCardsContainer: document.getElementById('scheme-cards-container'),
    cardSchemeLight: document.getElementById('card-scheme-light'),
    cardSchemeDark: document.getElementById('card-scheme-dark'),
    previewCardLight: document.getElementById('preview-card-light'),
    previewCardDark: document.getElementById('preview-card-dark'),
    
    slideshowConfigPanel: document.getElementById('slideshow-config-panel'),
    slideshowInterval: document.getElementById('slideshow-interval'),
    slideshowRandom: document.getElementById('slideshow-random'),
    wallpapersGrid: document.getElementById('wallpapers-grid'),
    statusDot: document.getElementById('status-dot'),
    statusText: document.getElementById('status-text')
  };

  // Sends a message to the tab's content script, injecting it first if it is
  // not reachable (page predates the extension, or the extension was reloaded
  // while the tab stayed open). Requires the "scripting" permission.
  async function sendToTab(tabId, message) {
    try {
      await chrome.scripting.executeScript({ target: { tabId }, files: ['scripts/gradient.js', 'scripts/effects.js', 'scripts/content.js'] });
    } catch (e) {
      // Injection can fail on restricted pages (chrome://, Web Store, etc.).
    }
    return await chrome.tabs.sendMessage(tabId, message);
  }

  const CUSTOM_EFFECTS_KEY = '__pagedye_custom_effects__';

  // State
  let currentDomain = '';
  let currentImageBase64 = null;
  let lang = 'en';
  let activeScheme = 'light';
  let activeSlideshowIndex = 0;
  let currentSettings = null;
  let saveDebounceTimer = null;
  let gradientStopsState = [];
  let frostedGlassState = [];
  let cssEditorController = null;

  // Init
  initI18n();
  cssEditorController = initCustomCssEditor('custom-css', 'custom-css-editor');
  const gradientKeyframesStyle = document.createElement('style');
  gradientKeyframesStyle.textContent = window.PageDyeGradient.GRADIENT_KEYFRAMES_CSS;
  document.head.appendChild(gradientKeyframesStyle);
  renderGradientPresetsGrid();
  const versionEl = document.getElementById('version');
  if (versionEl) versionEl.textContent = 'v' + chrome.runtime.getManifest().version;
  await populateCustomEffectOptions(els.effectKind);
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && Object.prototype.hasOwnProperty.call(changes, CUSTOM_EFFECTS_KEY)) {
      populateCustomEffectOptions(els.effectKind);
    }
  });
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.url) {
    try {
      const url = new URL(tab.url);
      currentDomain = url.hostname;
      els.domainBadge.textContent = currentDomain;
      els.domainBadge.title = lang === 'zh' ? '点击复制域名' : 'Click to copy domain';
      await loadSettings(currentDomain);
    } catch (e) {
      els.domainBadge.textContent = t('invalidUrl');
      disableAll();
    }
  } else {
    els.domainBadge.textContent = t('noTab');
    disableAll();
  }

  // Event Listeners
  
  // Background Type Switch
  els.bgTypes.forEach(radio => {
    radio.addEventListener('change', () => {
      // Full opacity makes an effect's flat bgColor look harsh; nudge a
      // still-untouched (100%) slider down when switching into this type.
      if (radio.value === 'effect' && els.opacity.value === '100') {
        els.opacity.value = 85;
        els.opacityVal.textContent = '85%';
      }
      updateUI(radio.value);
      updateInteractivePreviews();
      triggerImmediateSave();
    });
  });

  // Effect kind / color / density / speed
  els.effectKind.addEventListener('change', () => {
    els.effectTextControl.classList.toggle('hidden', els.effectKind.value !== 'typewriter');
    triggerImmediateSave();
  });
  if (els.manageCustomEffectsLink) {
    els.manageCustomEffectsLink.addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('options/options.html') + '#section-custom-effects' });
      window.close();
    });
  }
  els.effectText.addEventListener('input', () => queueAutoSave());
  els.effectColorScheme.addEventListener('change', () => {
    els.effectColorCustomControl.classList.toggle('hidden', els.effectColorScheme.value !== 'custom');
    triggerImmediateSave();
  });
  els.effectColor.addEventListener('input', (e) => {
    els.effectColorText.value = e.target.value;
    queueAutoSave();
  });
  els.effectColorText.addEventListener('input', (e) => {
    els.effectColor.value = e.target.value;
    queueAutoSave();
  });
  els.effectBgColor.addEventListener('input', (e) => {
    els.effectBgColorText.value = e.target.value;
    queueAutoSave();
  });
  els.effectBgColorText.addEventListener('input', (e) => {
    els.effectBgColor.value = e.target.value;
    queueAutoSave();
  });
  els.effectDensity.addEventListener('input', (e) => {
    els.effectDensityVal.textContent = `${e.target.value}%`;
    queueAutoSave();
  });
  els.effectSpeed.addEventListener('input', (e) => {
    els.effectSpeedVal.textContent = `${e.target.value}%`;
    queueAutoSave();
  });

  // Color Picker Sync
  els.colorPicker.addEventListener('input', (e) => {
    els.colorText.value = e.target.value;
    updateInteractivePreviews();
    queueAutoSave();
  });
  els.colorText.addEventListener('input', (e) => {
    els.colorPicker.value = e.target.value;
    updateInteractivePreviews();
    queueAutoSave();
  });

  // Gradient: Solid <-> Gradient sub-mode switch.
  // Note the order below (save, then re-derive the preview) for every
  // *discrete* gradient action in this section: triggerImmediateSave()
  // synchronously runs collectFormTo(), which is what writes the form's
  // gradient into currentSettings[activeSlot] — updateGradientPreview()
  // piggybacks a scheme-card/slideshow-thumbnail refresh (see its own
  // definition) that reads exactly that object, so it must run *after* the
  // save or it renders one action behind. Debounced slider edits (angle,
  // speed, per-stop color/position) keep the opposite order, matching the
  // existing solid-color/opacity slider precedent elsewhere in this file.
  els.colorModes.forEach(radio => {
    radio.addEventListener('change', () => {
      updateColorModeUI(radio.value);
      triggerImmediateSave();
      updateGradientPreview();
    });
  });

  // Gradient: Linear <-> Radial
  els.gradientKinds.forEach(radio => {
    radio.addEventListener('change', () => {
      updateGradientKindUI(radio.value);
      triggerImmediateSave();
      updateGradientPreview();
    });
  });

  els.gradientAngle.addEventListener('input', (e) => {
    els.gradientAngleVal.textContent = `${e.target.value}°`;
    updateGradientPreview();
    queueAutoSave();
  });

  els.gradientShape.addEventListener('change', () => {
    triggerImmediateSave();
    updateGradientPreview();
  });

  els.gradientAnimated.addEventListener('change', (e) => {
    els.gradientSpeedControl.classList.toggle('hidden', !e.target.checked);
    triggerImmediateSave();
    updateGradientPreview();
  });

  els.gradientSpeed.addEventListener('input', (e) => {
    els.gradientSpeedVal.textContent = `${e.target.value}s`;
    updateGradientPreview();
    queueAutoSave();
  });

  els.gradientAddStop.addEventListener('click', () => {
    if (gradientStopsState.length >= window.PageDyeGradient.MAX_STOPS) return;
    const lastPos = gradientStopsState.length ? gradientStopsState[gradientStopsState.length - 1].position : 0;
    gradientStopsState.push({ color: '#ffffff', position: Math.min(100, lastPos + 10) });
    renderGradientStops(gradientStopsState);
    triggerImmediateSave();
    updateGradientPreview();
  });

  // Stop rows are rebuilt on every render, so listeners are delegated on the
  // (stable) parent container rather than attached per-row.
  els.gradientStopsList.addEventListener('input', (e) => {
    const row = e.target.closest('.gradient-stop-row');
    if (!row) return;
    const idx = parseInt(row.dataset.index, 10);
    if (e.target.classList.contains('gradient-stop-color')) {
      row.querySelector('.gradient-stop-hex').value = e.target.value;
      gradientStopsState[idx].color = e.target.value;
    } else if (e.target.classList.contains('gradient-stop-hex')) {
      row.querySelector('.gradient-stop-color').value = e.target.value;
      gradientStopsState[idx].color = e.target.value;
    } else if (e.target.classList.contains('gradient-stop-pos')) {
      gradientStopsState[idx].position = Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0));
    }
    updateGradientPreview();
    queueAutoSave();
  });

  els.gradientStopsList.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.gradient-stop-remove');
    if (!removeBtn) return;
    if (gradientStopsState.length <= window.PageDyeGradient.MIN_STOPS) return;
    const idx = parseInt(removeBtn.closest('.gradient-stop-row').dataset.index, 10);
    gradientStopsState.splice(idx, 1);
    renderGradientStops(gradientStopsState);
    triggerImmediateSave();
    updateGradientPreview();
  });

  els.gradientPresetsGrid.addEventListener('click', (e) => {
    const swatch = e.target.closest('.gradient-preset-swatch');
    if (!swatch) return;
    const preset = window.PageDyeGradient.GRADIENT_PRESETS[parseInt(swatch.dataset.index, 10)];
    populateGradientPanel(Object.assign({ animated: false, speed: 10 }, preset));
    triggerImmediateSave();
    updateGradientPreview();
  });

  els.gradientGenerateBtn.addEventListener('click', () => {
    const seed = els.colorPicker.value;
    const stops = window.PageDyeGradient.clampStops(normalizeToStopObjects(window.PageDyeGradient.generateTonalPalette(seed)));
    renderGradientStops(stops);
    triggerImmediateSave();
    updateGradientPreview();
  });

  els.gradientExtractBtn.addEventListener('click', async () => {
    const imgSrc = currentImageBase64 || els.imageUrl.value;
    if (!imgSrc) return;
    els.gradientExtractBtn.disabled = true;
    const result = await window.PageDyeGradient.extractPaletteFromImage(imgSrc, 5);
    updateGradientExtractButtonState();
    if (!result.ok) {
      els.statusText.textContent = t('gradientExtractFailed');
      setTimeout(setSyncedState, 1800);
      return;
    }
    const stops = window.PageDyeGradient.clampStops(normalizeToStopObjects(result.colors));
    renderGradientStops(stops);
    triggerImmediateSave();
    updateGradientPreview();
  });

  // File Upload
  els.dropArea.addEventListener('click', () => els.fileInput.click());
  els.fileInput.addEventListener('change', handleFileSelect);
  els.dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    els.dropArea.classList.add('dragover');
  });
  els.dropArea.addEventListener('dragleave', () => els.dropArea.classList.remove('dragover'));
  els.dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    els.dropArea.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
      handleFile(e.dataTransfer.files[0]);
    }
  });
  els.removeFileBtn.addEventListener('click', clearFile);

  // Sliders
  els.opacity.addEventListener('input', (e) => {
    els.opacityVal.textContent = `${e.target.value}%`;
    updatePreview();
    updateInteractivePreviews();
    queueAutoSave();
  });
  els.blur.addEventListener('input', (e) => {
    els.blurVal.textContent = `${e.target.value}px`;
    updatePreview();
    updateInteractivePreviews();
    queueAutoSave();
  });

  // Advanced filter sliders (popup)
  const popupFilterDefs = [
    { id: 'filter-brightness', valId: 'filter-brightness-val', unit: '%' },
    { id: 'filter-contrast',   valId: 'filter-contrast-val',   unit: '%' },
    { id: 'filter-grayscale',  valId: 'filter-grayscale-val',  unit: '%' },
    { id: 'filter-hue',        valId: 'filter-hue-val',        unit: 'deg' },
    { id: 'filter-invert',     valId: 'filter-invert-val',     unit: '%' }
  ];
  popupFilterDefs.forEach(({ id, valId, unit }) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', (e) => {
        document.getElementById(valId).textContent = `${e.target.value}${unit}`;
        updatePreview();
        queueAutoSave();
      });
    }
  });

  const popupFiltersResetBtn = document.getElementById('filters-reset');
  if (popupFiltersResetBtn) {
    popupFiltersResetBtn.addEventListener('click', () => {
      document.getElementById('filter-brightness').value = 100;
      document.getElementById('filter-brightness-val').textContent = '100%';
      document.getElementById('filter-contrast').value = 100;
      document.getElementById('filter-contrast-val').textContent = '100%';
      document.getElementById('filter-grayscale').value = 0;
      document.getElementById('filter-grayscale-val').textContent = '0%';
      document.getElementById('filter-hue').value = 0;
      document.getElementById('filter-hue-val').textContent = '0deg';
      document.getElementById('filter-invert').value = 0;
      document.getElementById('filter-invert-val').textContent = '0%';
      updatePreview();
      triggerImmediateSave();
    });
  }


  els.imageUrl.addEventListener('input', (e) => {
    // If user enters a URL, clear local file state
    if (e.target.value) {
      currentImageBase64 = null;
      els.fileInput.value = '';
      els.dropArea.classList.remove('hidden');
      els.fileInfo.classList.add('hidden');
    }
    updatePreview();
    updateInteractivePreviews();
    queueAutoSave();
  });

  // Style Toggles
  els.bgFixed.addEventListener('change', () => triggerImmediateSave());
  els.bgSize.addEventListener('change', () => triggerImmediateSave());
  els.bgRepeat.addEventListener('change', () => triggerImmediateSave());

  // Advanced inputs
  els.targetSelector.addEventListener('input', () => queueAutoSave());
  els.deepCompatToggle.addEventListener('change', () => triggerImmediateSave());
  els.deepCompatExclude.addEventListener('input', () => queueAutoSave());
  els.customCss.addEventListener('input', () => queueAutoSave());

  // Frosted glass entries are rebuilt on every render, so listeners are
  // delegated on the (stable) parent container rather than attached per-row.
  els.frostedList.addEventListener('input', (e) => {
    const row = e.target.closest('.frosted-entry');
    if (!row) return;
    const idx = parseInt(row.dataset.index, 10);
    if (e.target.classList.contains('frosted-entry-selector')) {
      frostedGlassState[idx].selector = e.target.value;
    } else if (e.target.classList.contains('frosted-entry-blur')) {
      frostedGlassState[idx].blur = parseFloat(e.target.value) || 0;
      row.querySelector('.frosted-entry-blur-val').textContent = `${e.target.value}px`;
    } else if (e.target.classList.contains('frosted-entry-opacity')) {
      frostedGlassState[idx].opacity = parseInt(e.target.value, 10);
      row.querySelector('.frosted-entry-opacity-val').textContent = `${e.target.value}%`;
    }
    queueAutoSave();
  });

  els.frostedList.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.frosted-entry-remove');
    if (removeBtn) {
      const idx = parseInt(removeBtn.closest('.frosted-entry').dataset.index, 10);
      frostedGlassState.splice(idx, 1);
      renderFrostedList(frostedGlassState);
      triggerImmediateSave();
      return;
    }
    const pickBtn = e.target.closest('.frosted-entry-pick');
    if (pickBtn) {
      const idx = parseInt(pickBtn.closest('.frosted-entry').dataset.index, 10);
      startFrostedPicker(idx);
    }
  });

  els.frostedAddBtn.addEventListener('click', () => {
    frostedGlassState.push({ selector: '', blur: 12, opacity: 55 });
    renderFrostedList(frostedGlassState);
    triggerImmediateSave();
  });

  // Advanced: element picker
  els.pickBtn.addEventListener('click', startPicker);

  // Top-level tabs: Wallpaper vs Frosted Glass
  const panelWallpaper = document.getElementById('panel-wallpaper');
  const panelFrosted = document.getElementById('panel-frosted');
  document.getElementsByName('mainTab').forEach((radio) => {
    radio.addEventListener('change', () => {
      const isFrosted = radio.checked && radio.value === 'frosted';
      panelWallpaper.classList.toggle('hidden', isFrosted);
      panelFrosted.classList.toggle('hidden', !isFrosted);
    });
  });

  // Wallpaper Mode Switch
  els.wpModes.forEach(radio => {
    radio.addEventListener('change', () => {
      if (!currentSettings) return;
      
      const prevMode = currentSettings.mode || 'single';
      if (prevMode === 'single') {
        collectFormTo(currentSettings);
      } else if (prevMode === 'auto') {
        collectFormTo(currentSettings[activeScheme]);
      } else if (prevMode === 'slideshow') {
        collectFormTo(currentSettings.slideshow.items[activeSlideshowIndex]);
        currentSettings.slideshow.interval = els.slideshowInterval.value;
        currentSettings.slideshow.order = els.slideshowRandom.checked ? 'random' : 'sequential';
      }
      
      currentSettings.mode = radio.value;
      updateModeUI(radio.value);
      triggerImmediateSave();
    });
  });

  // Auto Mode side-by-side cards selection listeners
  els.cardSchemeLight.addEventListener('click', () => {
    if (!currentSettings || activeScheme === 'light') return;
    collectFormTo(currentSettings[activeScheme]);
    activeScheme = 'light';
    els.cardSchemeDark.classList.remove('active');
    els.cardSchemeLight.classList.add('active');
    populateForm(currentSettings[activeScheme]);
  });

  els.cardSchemeDark.addEventListener('click', () => {
    if (!currentSettings || activeScheme === 'dark') return;
    collectFormTo(currentSettings[activeScheme]);
    activeScheme = 'dark';
    els.cardSchemeLight.classList.remove('active');
    els.cardSchemeDark.classList.add('active');
    populateForm(currentSettings[activeScheme]);
  });

  // Slideshow Grid interactions using delegation
  els.wallpapersGrid.addEventListener('click', (e) => {
    if (!currentSettings || !currentSettings.slideshow) return;

    // 1. Add Card Click
    const addCard = e.target.closest('.add-grid-card');
    if (addCard) {
      collectFormTo(currentSettings.slideshow.items[activeSlideshowIndex]);
      const newItem = {
        type: 'none',
        value: '',
        opacity: 100,
        blur: 0,
        style: { fixed: true, size: 'cover', repeat: false }
      };
      currentSettings.slideshow.items.push(newItem);
      activeSlideshowIndex = currentSettings.slideshow.items.length - 1;
      renderWallpapersGrid();
      populateForm(currentSettings.slideshow.items[activeSlideshowIndex]);
      triggerImmediateSave();
      return;
    }

    // 2. Delete Card Click
    const deleteBtn = e.target.closest('.delete-grid-btn');
    if (deleteBtn) {
      e.stopPropagation();
      const card = deleteBtn.closest('.wallpaper-grid-card');
      const idx = parseInt(card.dataset.index, 10);
      currentSettings.slideshow.items.splice(idx, 1);
      
      if (activeSlideshowIndex >= currentSettings.slideshow.items.length) {
        activeSlideshowIndex = currentSettings.slideshow.items.length - 1;
      }
      
      renderWallpapersGrid();
      populateForm(currentSettings.slideshow.items[activeSlideshowIndex]);
      triggerImmediateSave();
      return;
    }

    // 3. Select Card Click
    const card = e.target.closest('.wallpaper-grid-card');
    if (card) {
      const idx = parseInt(card.dataset.index, 10);
      if (activeSlideshowIndex === idx) return;
      collectFormTo(currentSettings.slideshow.items[activeSlideshowIndex]);
      activeSlideshowIndex = idx;
      
      // Update selected state border
      els.wallpapersGrid.querySelectorAll('.wallpaper-grid-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      
      populateForm(currentSettings.slideshow.items[activeSlideshowIndex]);
    }
  });

  // Slideshow config inputs save triggers
  els.slideshowInterval.addEventListener('change', () => {
    if (currentSettings && currentSettings.slideshow) {
      currentSettings.slideshow.interval = els.slideshowInterval.value;
      triggerImmediateSave();
    }
  });

  els.slideshowRandom.addEventListener('change', () => {
    if (currentSettings && currentSettings.slideshow) {
      currentSettings.slideshow.order = els.slideshowRandom.checked ? 'random' : 'sequential';
      triggerImmediateSave();
    }
  });

  // Advanced: open settings dashboard with robust fallback
  els.settingsBtn.addEventListener('click', () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage(() => {
        if (chrome.runtime.lastError) {
          chrome.tabs.create({ url: chrome.runtime.getURL('options/options.html') });
        }
      });
    } else {
      chrome.tabs.create({ url: chrome.runtime.getURL('options/options.html') });
    }
  });

  // Actions
  els.resetBtn.addEventListener('click', resetSettings);
  
  // Copy domain hostname
  els.domainBadge.addEventListener('click', async () => {
    const text = els.domainBadge.textContent;
    if (!text || text === '...' || text === t('invalidUrl') || text === t('noTab')) return;
    try {
      await navigator.clipboard.writeText(text);
      setSavingState();
      setTimeout(setSyncedState, 1000);
    } catch (err) {
      console.error('Failed to copy domain name:', err);
    }
  });

  // Functions
  function initI18n() {
    const browserLang = navigator.language || navigator.userLanguage; 
    if (browserLang.toLowerCase().startsWith('zh')) {
      lang = 'zh';
    } else {
      lang = 'en';
    }
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (i18n[lang][key]) {
        el.textContent = i18n[lang][key];
      }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (i18n[lang][key]) {
        el.placeholder = i18n[lang][key];
      }
    });

    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
      settingsBtn.title = lang === 'zh' ? '设置' : 'Settings';
    }
  }

  function t(key) {
    return i18n[lang][key] || key;
  }

  // Appends the user's custom effects as an <optgroup> after the built-in
  // <option>s — mirrors options.js's copy of the same logic (no shared
  // module between popup/options for this small a helper, consistent with
  // this file already keeping its own copy of initCustomCssEditor).
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

  // Disable UI when no tab found
  function disableAll() {
    document.querySelector('main').style.opacity = '0.5';
    document.querySelector('main').style.pointerEvents = 'none';
    els.resetBtn.disabled = true;
  }

  function updatePreview() {
    let imageUrl = '';
    if (currentImageBase64) {
      imageUrl = `url('${currentImageBase64}')`;
    } else if (els.imageUrl.value) {
      imageUrl = `url('${els.imageUrl.value}')`;
    }
    els.imagePreviewBg.style.backgroundImage = imageUrl;

    const blur       = parseInt(els.blur.value, 10) || 0;
    const brightness = parseInt(document.getElementById('filter-brightness').value, 10);
    const contrast   = parseInt(document.getElementById('filter-contrast').value,   10);
    const grayscale  = parseInt(document.getElementById('filter-grayscale').value,  10);
    const hue        = parseInt(document.getElementById('filter-hue').value,         10);
    const invert     = parseInt(document.getElementById('filter-invert').value,      10);

    const filterStr = [
      blur        > 0    ? `blur(${blur}px)`             : '',
      brightness !== 100 ? `brightness(${brightness}%)`  : '',
      contrast   !== 100 ? `contrast(${contrast}%)`      : '',
      grayscale  > 0     ? `grayscale(${grayscale}%)`    : '',
      hue        > 0     ? `hue-rotate(${hue}deg)`       : '',
      invert     > 0     ? `invert(${invert}%)`          : ''
    ].filter(Boolean).join(' ') || 'none';

    els.imagePreviewBg.style.filter = filterStr;
    els.imagePreviewBg.style.transform = blur > 0 ? 'scale(1.08)' : 'none';

    const opacity = els.opacity.value;
    els.imagePreviewBg.style.opacity = opacity / 100;
  }

  function populateForm(subSettings) {
    document.querySelector(`input[name="bgType"][value="${subSettings.type || 'none'}"]`).checked = true;
    updateUI(subSettings.type || 'none');

    currentImageBase64 = null;
    els.imageUrl.value = '';
    els.fileInput.value = '';
    els.dropArea.classList.remove('hidden');
    els.fileInfo.classList.add('hidden');

    if (subSettings.type === 'color') {
      els.colorPicker.value = subSettings.value || '#ffffff';
      els.colorText.value = subSettings.value || '#ffffff';

      const colorMode = subSettings.colorMode || 'solid';
      populateGradientPanel(subSettings.gradient || window.PageDyeGradient.defaultGradient(subSettings.value));
      updateColorModeUI(colorMode);
    } else if (subSettings.type === 'image') {
      if (subSettings.value && subSettings.value.startsWith('data:')) {
        currentImageBase64 = subSettings.value;
        els.dropArea.classList.add('hidden');
        els.fileInfo.classList.remove('hidden');
        els.fileName.textContent = t('savedImage'); 
      } else {
        els.imageUrl.value = subSettings.value || '';
      }
    } else if (subSettings.type === 'effect') {
      els.effectKind.value = subSettings.effect || 'waves';
      els.effectText.value = subSettings.effectText || 'PageDye';
      els.effectTextControl.classList.toggle('hidden', els.effectKind.value !== 'typewriter');
      els.effectColorScheme.value = subSettings.effectColorScheme || 'auto';
      els.effectColorCustomControl.classList.toggle('hidden', els.effectColorScheme.value !== 'custom');
      els.effectColor.value = subSettings.effectColor || '#ffffff';
      els.effectColorText.value = subSettings.effectColor || '#ffffff';
      els.effectBgColor.value = subSettings.effectBgColor || '#000000';
      els.effectBgColorText.value = subSettings.effectBgColor || '#000000';
      els.effectDensity.value = subSettings.effectDensity !== undefined ? subSettings.effectDensity : 50;
      els.effectDensityVal.textContent = `${els.effectDensity.value}%`;
      els.effectSpeed.value = subSettings.effectSpeed !== undefined ? subSettings.effectSpeed : 50;
      els.effectSpeedVal.textContent = `${els.effectSpeed.value}%`;
    }

    els.opacity.value = subSettings.opacity !== undefined ? subSettings.opacity : 100;
    els.opacityVal.textContent = `${els.opacity.value}%`;
    els.blur.value = subSettings.blur !== undefined ? subSettings.blur : 0;
    els.blurVal.textContent = `${els.blur.value}px`;

    // Populate advanced filters
    const f = subSettings.filters || {};
    const bri = f.brightness !== undefined ? f.brightness : 100;
    const con = f.contrast   !== undefined ? f.contrast   : 100;
    const gry = f.grayscale  !== undefined ? f.grayscale  : 0;
    const hue = f.hue        !== undefined ? f.hue        : 0;
    const inv = f.invert     !== undefined ? f.invert     : 0;
    document.getElementById('filter-brightness').value = bri;
    document.getElementById('filter-brightness-val').textContent = `${bri}%`;
    document.getElementById('filter-contrast').value = con;
    document.getElementById('filter-contrast-val').textContent = `${con}%`;
    document.getElementById('filter-grayscale').value = gry;
    document.getElementById('filter-grayscale-val').textContent = `${gry}%`;
    document.getElementById('filter-hue').value = hue;
    document.getElementById('filter-hue-val').textContent = `${hue}deg`;
    document.getElementById('filter-invert').value = inv;
    document.getElementById('filter-invert-val').textContent = `${inv}%`;
    
    if (subSettings.style) {
      els.bgFixed.checked = subSettings.style.fixed !== false;
      els.bgSize.value = subSettings.style.size || 'cover';
      els.bgRepeat.checked = !!subSettings.style.repeat;
    }

    updatePreview();
  }

  function collectFormTo(dest) {
    const type = document.querySelector('input[name="bgType"]:checked').value;
    let value = '';

    if (type === 'color') {
      value = els.colorPicker.value;
      dest.colorMode = document.querySelector('input[name="colorMode"]:checked').value;
      dest.gradient = collectGradientFromForm();
    } else if (type === 'image') {
      value = currentImageBase64 || els.imageUrl.value;
    } else if (type === 'effect') {
      dest.effect = els.effectKind.value;
      dest.effectText = els.effectText.value || 'PageDye';
      dest.effectColorScheme = els.effectColorScheme.value;
      dest.effectColor = els.effectColor.value;
      dest.effectBgColor = els.effectBgColor.value;
      dest.effectDensity = parseInt(els.effectDensity.value, 10);
      dest.effectSpeed = parseInt(els.effectSpeed.value, 10);
    }

    dest.type = type;
    dest.value = value;
    dest.opacity = parseInt(els.opacity.value, 10);
    dest.blur = parseInt(els.blur.value, 10);
    dest.filters = {
      brightness: parseInt(document.getElementById('filter-brightness').value, 10),
      contrast:   parseInt(document.getElementById('filter-contrast').value,   10),
      grayscale:  parseInt(document.getElementById('filter-grayscale').value,  10),
      hue:        parseInt(document.getElementById('filter-hue').value,         10),
      invert:     parseInt(document.getElementById('filter-invert').value,      10)
    };
    dest.style = {
      fixed: els.bgFixed.checked,
      size: els.bgSize.value,
      repeat: els.bgRepeat.checked
    };
  }

  async function loadSettings(domain) {
    const data = await chrome.storage.local.get(domain);
    currentSettings = data[domain] || {
      mode: 'single',
      type: 'none',
      value: '',
      opacity: 100,
      blur: 0,
      style: { fixed: true, size: 'cover', repeat: false }
    };

    if (!currentSettings.mode) {
      currentSettings.mode = 'single';
    }

    if (!currentSettings.light) {
      currentSettings.light = {
        type: currentSettings.type && currentSettings.type !== 'none' ? currentSettings.type : 'none',
        value: currentSettings.value || '',
        opacity: currentSettings.opacity !== undefined ? currentSettings.opacity : 100,
        blur: currentSettings.blur !== undefined ? currentSettings.blur : 0,
        style: Object.assign({ fixed: true, size: 'cover', repeat: false }, currentSettings.style || {})
      };
    }
    if (!currentSettings.dark) {
      currentSettings.dark = {
        type: currentSettings.type && currentSettings.type !== 'none' ? currentSettings.type : 'none',
        value: currentSettings.value || '',
        opacity: currentSettings.opacity !== undefined ? currentSettings.opacity : 100,
        blur: currentSettings.blur !== undefined ? currentSettings.blur : 0,
        style: Object.assign({ fixed: true, size: 'cover', repeat: false }, currentSettings.style || {})
      };
    }

    if (!currentSettings.slideshow) {
      currentSettings.slideshow = {
        interval: 'open',
        order: 'sequential',
        currentIndex: 0,
        lastRotationTime: Date.now(),
        items: [
          {
            type: currentSettings.type || 'none',
            value: currentSettings.value || '',
            opacity: currentSettings.opacity !== undefined ? currentSettings.opacity : 100,
            blur: currentSettings.blur !== undefined ? currentSettings.blur : 0,
            style: Object.assign({ fixed: true, size: 'cover', repeat: false }, currentSettings.style || {})
          }
        ]
      };
    }

    const mode = currentSettings.mode || 'single';
    const radio = document.querySelector(`input[name="wpMode"][value="${mode}"]`);
    if (radio) radio.checked = true;
    updateModeUI(mode);

    els.targetSelector.value = currentSettings.targetSelector || '';
    els.deepCompatToggle.checked = !!currentSettings.deepCompat;
    els.deepCompatExclude.value = currentSettings.deepCompatExclude || '';
    els.customCss.value = currentSettings.customCss || '';
    if (cssEditorController) cssEditorController.update();

    renderFrostedList(normalizeFrostedGlassList(currentSettings.frostedGlass));

    // Auto expand accordion if target selector or custom css has values.
    // Deep Compatibility Mode now has its own always-expanded accordion.
    const accordionAdvanced = document.getElementById('accordion-advanced');
    if (els.targetSelector.value || els.customCss.value) {
      if (accordionAdvanced) accordionAdvanced.open = true;
    } else {
      if (accordionAdvanced) accordionAdvanced.open = false;
    }
    
    updateInteractivePreviews();
  }

  function updateModeUI(mode) {
    els.schemeCardsContainer.classList.add('hidden');
    els.slideshowConfigPanel.classList.add('hidden');

    const activeModeBadge = document.getElementById('active-mode-badge');
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
      populateForm(currentSettings);
    } else if (mode === 'auto') {
      els.schemeCardsContainer.classList.remove('hidden');
      els.cardSchemeLight.classList.remove('active');
      els.cardSchemeDark.classList.remove('active');
      if (activeScheme === 'dark') {
        els.cardSchemeDark.classList.add('active');
      } else {
        activeScheme = 'light';
        els.cardSchemeLight.classList.add('active');
      }
      populateForm(currentSettings[activeScheme]);
    } else if (mode === 'slideshow') {
      els.slideshowConfigPanel.classList.remove('hidden');
      els.slideshowInterval.value = currentSettings.slideshow.interval || 'open';
      els.slideshowRandom.checked = currentSettings.slideshow.order === 'random';
      
      activeSlideshowIndex = currentSettings.slideshow.currentIndex || 0;
      if (activeSlideshowIndex >= currentSettings.slideshow.items.length) {
        activeSlideshowIndex = 0;
      }
      renderWallpapersGrid();
      populateForm(currentSettings.slideshow.items[activeSlideshowIndex]);
    }
    updateInteractivePreviews();
  }

  function renderWallpapersGrid() {
    els.wallpapersGrid.innerHTML = '';
    const items = currentSettings.slideshow.items || [];
    
    items.forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = 'wallpaper-grid-card';
      if (idx === activeSlideshowIndex) card.classList.add('active');
      
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
      els.wallpapersGrid.appendChild(card);
    });

    const addCard = document.createElement('div');
    addCard.className = 'add-grid-card';
    addCard.textContent = '+';
    els.wallpapersGrid.appendChild(addCard);
  }

  function updateInteractivePreviews() {
    if (!currentSettings) return;
    
    const mode = currentSettings.mode || 'single';
    if (mode === 'auto') {
      const light = currentSettings.light;
      if (light.type === 'color' && light.colorMode === 'gradient' && light.gradient) {
        els.previewCardLight.style.backgroundImage = window.PageDyeGradient.buildGradientCss(light.gradient);
        els.previewCardLight.style.backgroundColor = '';
      } else if (light.type === 'color') {
        els.previewCardLight.style.backgroundColor = light.value || '#ffffff';
        els.previewCardLight.style.backgroundImage = 'none';
      } else if (light.type === 'image' && light.value) {
        els.previewCardLight.style.backgroundImage = `url('${light.value}')`;
      } else {
        els.previewCardLight.style.backgroundColor = 'var(--surface-bg)';
        els.previewCardLight.style.backgroundImage = 'none';
      }
      els.previewCardLight.style.opacity = (light.opacity !== undefined ? light.opacity : 100) / 100;

      const dark = currentSettings.dark;
      if (dark.type === 'color' && dark.colorMode === 'gradient' && dark.gradient) {
        els.previewCardDark.style.backgroundImage = window.PageDyeGradient.buildGradientCss(dark.gradient);
        els.previewCardDark.style.backgroundColor = '';
      } else if (dark.type === 'color') {
        els.previewCardDark.style.backgroundColor = dark.value || '#ffffff';
        els.previewCardDark.style.backgroundImage = 'none';
      } else if (dark.type === 'image' && dark.value) {
        els.previewCardDark.style.backgroundImage = `url('${dark.value}')`;
      } else {
        els.previewCardDark.style.backgroundColor = 'var(--surface-bg)';
        els.previewCardDark.style.backgroundImage = 'none';
      }
      els.previewCardDark.style.opacity = (dark.opacity !== undefined ? dark.opacity : 100) / 100;
    } else if (mode === 'slideshow') {
      const activeCard = els.wallpapersGrid.querySelector(`.wallpaper-grid-card.active`);
      if (activeCard) {
        const item = currentSettings.slideshow.items[activeSlideshowIndex];
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
          
          const count = currentSettings.slideshow.items.length;
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

  function updateUI(type) {
    els.sectionColor.classList.add('hidden');
    els.sectionImage.classList.add('hidden');
    els.sectionEffects.classList.add('hidden');
    els.sectionStyles.classList.add('hidden');
    els.blurControl.classList.add('hidden');
    const advFilters = document.getElementById('advanced-filters');
    if (advFilters) advFilters.classList.add('hidden');

    if (type === 'color') {
      els.sectionColor.classList.remove('hidden');
      els.sectionStyles.classList.remove('hidden');
      const checkedColorMode = document.querySelector('input[name="colorMode"]:checked');
      updateColorModeUI(checkedColorMode ? checkedColorMode.value : 'solid');
    } else if (type === 'image') {
      els.sectionImage.classList.remove('hidden');
      els.sectionStyles.classList.remove('hidden');
      els.blurControl.classList.remove('hidden');
      if (advFilters) advFilters.classList.remove('hidden');
      updatePreview();
    } else if (type === 'effect') {
      els.sectionEffects.classList.remove('hidden');
      els.sectionStyles.classList.remove('hidden');
    }

    // Toggle image position options if image is active
    const imgOptions = document.getElementById('image-options');
    if (imgOptions) {
      if (type === 'image') {
        imgOptions.classList.remove('hidden');
      } else {
        imgOptions.classList.add('hidden');
      }
    }
  }

  function updateColorModeUI(colorMode) {
    const isGradient = colorMode === 'gradient';
    const radio = document.querySelector(`input[name="colorMode"][value="${colorMode || 'solid'}"]`);
    if (radio) radio.checked = true;
    els.solidColorPanel.classList.toggle('hidden', isGradient);
    els.gradientPanel.classList.toggle('hidden', !isGradient);
    if (isGradient) {
      // Guards against toggling to Gradient on a slot that has never been
      // through populateGradientPanel (e.g. a fresh domain whose type
      // starts as 'none'/'image') — without this, the stop list and live
      // preview would stay empty until the next full populateForm call.
      if (gradientStopsState.length < window.PageDyeGradient.MIN_STOPS) {
        renderGradientStops(window.PageDyeGradient.defaultGradient(els.colorPicker.value).stops);
      }
      const kindRadio = document.querySelector('input[name="gradientKind"]:checked');
      updateGradientKindUI(kindRadio ? kindRadio.value : 'linear');
      updateGradientPreview();
      updateGradientExtractButtonState();
    }
  }

  function updateGradientKindUI(kind) {
    els.gradientAngleControl.classList.toggle('hidden', kind !== 'linear');
    els.gradientShapeControl.classList.toggle('hidden', kind !== 'radial');
  }

  function populateGradientPanel(gradient) {
    const kindRadio = document.querySelector(`input[name="gradientKind"][value="${gradient.kind || 'linear'}"]`);
    if (kindRadio) kindRadio.checked = true;
    els.gradientAngle.value = gradient.angle !== undefined ? gradient.angle : 90;
    els.gradientAngleVal.textContent = `${els.gradientAngle.value}°`;
    els.gradientShape.value = gradient.shape || 'circle';
    els.gradientAnimated.checked = !!gradient.animated;
    els.gradientSpeed.value = gradient.speed !== undefined ? gradient.speed : 10;
    els.gradientSpeedVal.textContent = `${els.gradientSpeed.value}s`;
    els.gradientSpeedControl.classList.toggle('hidden', !gradient.animated);

    const stops = (gradient.stops && gradient.stops.length >= window.PageDyeGradient.MIN_STOPS)
      ? gradient.stops
      : window.PageDyeGradient.defaultGradient().stops;
    renderGradientStops(stops);

    updateGradientKindUI(gradient.kind || 'linear');
    updateGradientPreview();
  }

  // Rebuilds the stop-row list from scratch. Rows are plain DOM nodes built
  // via createElement (not innerHTML) so user-typed hex text never needs
  // HTML-escaping. Listeners are delegated on the parent (see the
  // gradient-stops-list input/click handlers above), since rows are
  // recreated on every add/remove.
  function renderGradientStops(stops) {
    gradientStopsState = stops.map(s => ({ color: s.color, position: s.position }));
    els.gradientStopsList.innerHTML = '';

    gradientStopsState.forEach((stop, idx) => {
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
      removeBtn.disabled = gradientStopsState.length <= window.PageDyeGradient.MIN_STOPS;

      row.appendChild(colorInput);
      row.appendChild(hexInput);
      row.appendChild(posInput);
      row.appendChild(removeBtn);
      els.gradientStopsList.appendChild(row);
    });

    els.gradientAddStop.disabled = gradientStopsState.length >= window.PageDyeGradient.MAX_STOPS;
  }

  // Older saved settings stored frostedGlass as a single { selector, blur,
  // opacity } object. Upgrade that shape to a one-entry array transparently.
  function normalizeFrostedGlassList(fg) {
    if (Array.isArray(fg)) return fg;
    if (fg && typeof fg === 'object' && fg.selector) return [fg];
    return [];
  }

  // Rebuilds the frosted-entry list from scratch, one card per element, so
  // applying frosted glass to a new element never clobbers the others.
  function renderFrostedList(list) {
    frostedGlassState = list.map(f => ({
      selector: f.selector || '',
      blur: f.blur !== undefined ? f.blur : 12,
      opacity: f.opacity !== undefined ? f.opacity : 55
    }));
    els.frostedList.innerHTML = '';

    frostedGlassState.forEach((entry, idx) => {
      const row = document.createElement('div');
      row.className = 'frosted-entry';
      row.dataset.index = idx;

      const selectorRow = document.createElement('div');
      selectorRow.className = 'selector-row';

      const selectorInput = document.createElement('input');
      selectorInput.type = 'text';
      selectorInput.className = 'frosted-entry-selector';
      selectorInput.placeholder = '.card, main';
      selectorInput.value = entry.selector;

      const pickBtn = document.createElement('button');
      pickBtn.type = 'button';
      pickBtn.className = 'secondary pick-btn frosted-entry-pick';
      pickBtn.textContent = t('pickElement');

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'frosted-entry-remove';
      removeBtn.textContent = '×';
      removeBtn.title = t('gradientRemoveStop');

      selectorRow.appendChild(selectorInput);
      selectorRow.appendChild(pickBtn);
      selectorRow.appendChild(removeBtn);

      const blurLabelRow = document.createElement('div');
      blurLabelRow.className = 'label-row';
      const blurLabel = document.createElement('label');
      blurLabel.textContent = t('frostedBlur');
      const blurVal = document.createElement('span');
      blurVal.className = 'val-badge frosted-entry-blur-val';
      blurVal.textContent = `${entry.blur}px`;
      blurLabelRow.appendChild(blurLabel);
      blurLabelRow.appendChild(blurVal);

      const blurInput = document.createElement('input');
      blurInput.type = 'range';
      blurInput.className = 'frosted-entry-blur';
      blurInput.min = '0';
      blurInput.max = '30';
      blurInput.step = '0.1';
      blurInput.value = entry.blur;

      const opacityLabelRow = document.createElement('div');
      opacityLabelRow.className = 'label-row';
      const opacityLabel = document.createElement('label');
      opacityLabel.textContent = t('frostedOpacity');
      const opacityVal = document.createElement('span');
      opacityVal.className = 'val-badge frosted-entry-opacity-val';
      opacityVal.textContent = `${entry.opacity}%`;
      opacityLabelRow.appendChild(opacityLabel);
      opacityLabelRow.appendChild(opacityVal);

      const opacityInput = document.createElement('input');
      opacityInput.type = 'range';
      opacityInput.className = 'frosted-entry-opacity';
      opacityInput.min = '0';
      opacityInput.max = '100';
      opacityInput.value = entry.opacity;

      row.appendChild(selectorRow);
      row.appendChild(blurLabelRow);
      row.appendChild(blurInput);
      row.appendChild(opacityLabelRow);
      row.appendChild(opacityInput);
      els.frostedList.appendChild(row);
    });
  }

  function collectGradientFromForm() {
    const kindRadio = document.querySelector('input[name="gradientKind"]:checked');
    return {
      kind: kindRadio ? kindRadio.value : 'linear',
      angle: parseInt(els.gradientAngle.value, 10),
      shape: els.gradientShape.value,
      stops: gradientStopsState.map(s => ({ color: s.color, position: s.position })),
      animated: els.gradientAnimated.checked,
      speed: parseInt(els.gradientSpeed.value, 10)
    };
  }

  function updateGradientPreview() {
    const gradient = collectGradientFromForm();
    els.gradientPreviewBg.style.backgroundImage = window.PageDyeGradient.buildGradientCss(gradient);
    els.gradientPreviewBg.style.opacity = (parseInt(els.opacity.value, 10) || 100) / 100;
    if (gradient.animated) {
      els.gradientPreviewBg.style.backgroundSize = gradient.kind === 'radial' ? '200% 200%' : '300% 300%';
      els.gradientPreviewBg.style.animation = `pagedye-gradient-flow ${gradient.speed || 10}s ease infinite`;
    } else {
      els.gradientPreviewBg.style.backgroundSize = 'auto';
      els.gradientPreviewBg.style.animation = 'none';
    }
    // Every gradient control funnels through this function, so this is the
    // one place needed to keep the Auto/Slideshow scheme-card swatches live
    // too (they read currentSettings.light/dark/slideshow directly, same as
    // the solid-color and image controls already keep them in sync).
    updateInteractivePreviews();
  }

  function renderGradientPresetsGrid() {
    els.gradientPresetsGrid.innerHTML = '';
    window.PageDyeGradient.GRADIENT_PRESETS.forEach((preset, idx) => {
      const swatch = document.createElement('div');
      swatch.className = 'gradient-preset-swatch';
      swatch.style.background = window.PageDyeGradient.buildGradientCss(preset);
      swatch.title = lang === 'zh' ? preset.name_zh : preset.name_en;
      swatch.dataset.index = idx;
      els.gradientPresetsGrid.appendChild(swatch);
    });
  }

  function updateGradientExtractButtonState() {
    const hasImage = !!(currentImageBase64 || els.imageUrl.value);
    els.gradientExtractBtn.disabled = !hasImage;
    els.gradientExtractBtn.title = hasImage ? '' : t('gradientExtractDisabledHint');
  }

  // Maps a flat hex list (from either Monet helper) to evenly-spaced stops.
  function normalizeToStopObjects(hexColors) {
    const n = hexColors.length;
    return hexColors.map((color, i) => ({ color, position: n === 1 ? 0 : Math.round((i * 100) / (n - 1)) }));
  }

  function handleFileSelect(e) {
    if (e.target.files.length) {
      handleFile(e.target.files[0]);
    }
  }

  function handleFile(file) {
    if (!file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      currentImageBase64 = e.target.result;
      els.imageUrl.value = ''; // Clear URL if choosing file
      els.dropArea.classList.add('hidden');
      els.fileInfo.classList.remove('hidden');
      els.fileName.textContent = file.name;
      updatePreview();
      updateInteractivePreviews();
      triggerImmediateSave();
    };
    reader.readAsDataURL(file);
  }

  function clearFile() {
    currentImageBase64 = null;
    els.fileInput.value = '';
    els.dropArea.classList.remove('hidden');
    els.fileInfo.classList.add('hidden');
    updatePreview();
    updateInteractivePreviews();
    triggerImmediateSave();
  }

  function collectSettings() {
    const mode = document.querySelector('input[name="wpMode"]:checked').value;
    currentSettings.mode = mode;

    if (mode === 'single') {
      collectFormTo(currentSettings);
    } else if (mode === 'auto') {
      collectFormTo(currentSettings[activeScheme]);
    } else if (mode === 'slideshow') {
      collectFormTo(currentSettings.slideshow.items[activeSlideshowIndex]);
      currentSettings.slideshow.interval = els.slideshowInterval.value;
      currentSettings.slideshow.order = els.slideshowRandom.checked ? 'random' : 'sequential';
    }

    currentSettings.targetSelector = els.targetSelector.value.trim();
    currentSettings.deepCompat = els.deepCompatToggle.checked;
    currentSettings.deepCompatExclude = els.deepCompatExclude.value.trim();
    currentSettings.customCss = els.customCss.value;
    currentSettings.frostedGlass = frostedGlassState.map(f => ({
      selector: f.selector.trim(),
      blur: f.blur,
      opacity: f.opacity
    }));
    currentSettings.timestamp = Date.now();

    return currentSettings;
  }

  function queueAutoSave() {
    setSavingState();
    if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
    saveDebounceTimer = setTimeout(() => {
      saveSettings(true);
    }, 400);
  }

  function triggerImmediateSave() {
    setSavingState();
    if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
    saveSettings(true);
  }

  function setSavingState() {
    els.statusDot.classList.add('saving');
    els.statusText.textContent = t('statusSaving');
  }

  function setSyncedState() {
    els.statusDot.classList.remove('saving');
    els.statusText.textContent = t('statusSynced');
  }

  async function saveSettings(silent = true) {
    const settings = collectSettings();

    try {
      await chrome.storage.local.set({ [currentDomain]: settings });

      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
          await sendToTab(tab.id, { action: 'updateBackground', settings });
        }
      } catch (err) {
        console.log('Content script might not be ready', err);
      }

      setSyncedState();
    } catch (err) {
      els.statusText.textContent = t('error');
      console.error(err);
    }
  }

  async function resetSettings() {
    setSavingState();
    await chrome.storage.local.remove(currentDomain);
    
    currentSettings = {
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
      deepCompat: false,
      deepCompatExclude: '',
      customCss: '',
      frostedGlass: []
    };
    activeScheme = 'light';
    activeSlideshowIndex = 0;
    
    const radio = document.querySelector('input[name="wpMode"][value="single"]');
    if (radio) radio.checked = true;
    updateModeUI('single');

    // Clear every field collectSettings() reads *before* anything below
    // triggers a save (the "none" click and clearFile() both synchronously
    // save via triggerImmediateSave()). Reading these fields after the save
    // fires would persist their stale pre-reset values — targetSelector,
    // customCss and frostedGlass live outside populateForm()/currentSettings
    // and are otherwise only cleared afterwards, too late to be picked up.
    els.opacity.value = 100;
    els.blur.value = 0;
    els.effectKind.value = 'waves';
    els.effectText.value = 'PageDye';
    els.effectTextControl.classList.add('hidden');
    els.effectColorScheme.value = 'auto';
    els.effectColorCustomControl.classList.add('hidden');
    els.effectColor.value = '#ffffff';
    els.effectColorText.value = '#ffffff';
    els.effectBgColor.value = '#000000';
    els.effectBgColorText.value = '#000000';
    els.effectDensity.value = 50;
    els.effectDensityVal.textContent = '50%';
    els.effectSpeed.value = 50;
    els.effectSpeedVal.textContent = '50%';
    els.imageUrl.value = '';
    els.targetSelector.value = '';
    els.deepCompatToggle.checked = false;
    els.deepCompatExclude.value = '';
    els.customCss.value = '';
    renderFrostedList([]);
    if (cssEditorController) cssEditorController.update();

    document.querySelector('input[value="none"]').click();
    clearFile();

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      chrome.tabs.sendMessage(tab.id, { action: 'updateBackground', settings: { type: 'none' } });
    }
    setSyncedState();
  }

  // Inject the element picker directly into the page, passing the current form
  // state so the picker can write the final settings (form + picked selector)
  // itself. We use executeScript (not messaging) so it works even when the
  // content script isn't reachable. The picker applies the result immediately
  // via the content script's storage listener — no popup reopen needed.
  async function startPicker() {
    const settings = collectSettings();
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['scripts/gradient.js', 'scripts/effects.js', 'scripts/content.js']
      });
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: pagedyeElementPicker,
        args: [settings, currentDomain, ['targetSelector']]
      });
      window.close();
    } catch (err) {
      console.log('Cannot start picker on this page', err);
      setSavingState();
      els.statusText.textContent = t('pickerFailed');
    }
  }

  // Same flow as startPicker(), but writes the picked selector into
  // frostedGlass[index].selector instead of targetSelector — each frosted
  // entry keeps its own selector, so picking a new element never overwrites
  // any other entry's.
  async function startFrostedPicker(index) {
    const settings = collectSettings();
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['scripts/gradient.js', 'scripts/effects.js', 'scripts/content.js']
      });
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: pagedyeElementPicker,
        args: [settings, currentDomain, ['frostedGlass', index, 'selector']]
      });
      window.close();
    } catch (err) {
      console.log('Cannot start picker on this page', err);
      setSavingState();
      els.statusText.textContent = t('pickerFailed');
    }
  }
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
