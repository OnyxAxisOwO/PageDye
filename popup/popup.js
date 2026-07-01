// Self-contained element picker. This function is serialized and injected
// into the page via chrome.scripting.executeScript, so it must NOT reference
// anything from the popup's scope (everything it needs comes via arguments).
// It highlights the hovered element, and on click writes the final settings
// (current form state + the picked selector) straight to storage for this
// domain. The content script's storage listener then paints that element
// immediately — no popup reopen required.
function pagedyeElementPicker(settings, domain) {
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
      const next = Object.assign({}, settings, { targetSelector: selector });
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
      advanced: "Advanced",
      targetSelector: "Background Selector",
      targetSelectorHint: "Pick an element (or type a CSS selector) and PageDye applies your color/image directly to that element instead of the whole page. Leave empty for a full-page background.",
      pickElement: "Pick",
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
      savedImage: "Saved Image"
    },
    zh: {
      title: "PageDye 设置",
      appName: "PageDye",
      bgType: "背景类型",
      typeNone: "无",
      typeColor: "纯色",
      typeImage: "图片",
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
      advanced: "高级设置",
      targetSelector: "背景选择器",
      targetSelectorHint: "拾取一个元素（或手动输入 CSS 选择器），PageDye 会把颜色/图片直接应用到该元素，而不是整页。留空则为整页背景。",
      pickElement: "拾取",
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
      savedImage: "已保存的壁纸"
    }
  };

  // Elements
  const els = {
    domainBadge: document.getElementById('current-domain'),
    bgTypes: document.getElementsByName('bgType'),
    sectionColor: document.getElementById('section-color'),
    sectionImage: document.getElementById('section-image'),
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

    // Advanced
    targetSelector: document.getElementById('target-selector'),
    pickBtn: document.getElementById('pick-btn'),
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
      await chrome.scripting.executeScript({ target: { tabId }, files: ['scripts/content.js'] });
    } catch (e) {
      // Injection can fail on restricted pages (chrome://, Web Store, etc.).
    }
    return await chrome.tabs.sendMessage(tabId, message);
  }

  // State
  let currentDomain = '';
  let currentImageBase64 = null;
  let lang = 'en';
  let activeScheme = 'light';
  let activeSlideshowIndex = 0;
  let currentSettings = null;
  let saveDebounceTimer = null;

  // Init
  initI18n();
  const versionEl = document.getElementById('version');
  if (versionEl) versionEl.textContent = 'v' + chrome.runtime.getManifest().version;
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
      updateUI(radio.value);
      updateInteractivePreviews();
      triggerImmediateSave();
    });
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

  // URL Preview
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
  els.customCss.addEventListener('input', () => queueAutoSave());

  // Advanced: element picker
  els.pickBtn.addEventListener('click', startPicker);

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

    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
      settingsBtn.title = lang === 'zh' ? '设置' : 'Settings';
    }
  }

  function t(key) {
    return i18n[lang][key] || key;
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

    const blur = els.blur.value;
    els.imagePreviewBg.style.filter = `blur(${blur}px)`;
    els.imagePreviewBg.style.transform = 'scale(1.08)';

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
    } else if (subSettings.type === 'image') {
      if (subSettings.value && subSettings.value.startsWith('data:')) {
        currentImageBase64 = subSettings.value;
        els.dropArea.classList.add('hidden');
        els.fileInfo.classList.remove('hidden');
        els.fileName.textContent = t('savedImage'); 
      } else {
        els.imageUrl.value = subSettings.value || '';
      }
    }

    els.opacity.value = subSettings.opacity !== undefined ? subSettings.opacity : 100;
    els.opacityVal.textContent = `${els.opacity.value}%`;
    els.blur.value = subSettings.blur !== undefined ? subSettings.blur : 0;
    els.blurVal.textContent = `${els.blur.value}px`;
    
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
    } else if (type === 'image') {
      value = currentImageBase64 || els.imageUrl.value;
    }

    dest.type = type;
    dest.value = value;
    dest.opacity = parseInt(els.opacity.value, 10);
    dest.blur = parseInt(els.blur.value, 10);
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
    els.customCss.value = currentSettings.customCss || '';
    
    // Auto expand accordion if target selector or custom css has values
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
      
      if (item.type === 'color') {
        card.style.backgroundColor = item.value || '#ffffff';
        card.style.backgroundImage = 'none';
      } else if (item.type === 'image' && item.value) {
        card.style.backgroundImage = `url('${item.value}')`;
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
      if (light.type === 'color') {
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
      if (dark.type === 'color') {
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
          if (item.type === 'color') {
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
    els.blurControl.classList.add('hidden'); 

    if (type === 'color') {
      els.sectionColor.classList.remove('hidden');
    } else if (type === 'image') {
      els.sectionImage.classList.remove('hidden');
      els.blurControl.classList.remove('hidden'); 
      updatePreview(); 
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
    currentSettings.customCss = els.customCss.value;
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
      customCss: ''
    };
    activeScheme = 'light';
    activeSlideshowIndex = 0;
    
    const radio = document.querySelector('input[name="wpMode"][value="single"]');
    if (radio) radio.checked = true;
    updateModeUI('single');

    document.querySelector('input[value="none"]').click();
    els.opacity.value = 100;
    els.blur.value = 0;
    clearFile();
    els.imageUrl.value = '';
    els.targetSelector.value = '';
    els.customCss.value = '';

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
        files: ['scripts/content.js']
      });
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: pagedyeElementPicker,
        args: [settings, currentDomain]
      });
      window.close();
    } catch (err) {
      console.log('Cannot start picker on this page', err);
      setSavingState();
      els.statusText.textContent = t('pickerFailed');
    }
  }
});
