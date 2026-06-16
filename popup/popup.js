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
      noTab: "No Active Tab",
      invalidUrl: "Invalid URL",
      advanced: "Advanced",
      targetSelector: "Background Selector",
      targetSelectorHint: "Pick an element (or type a CSS selector) and PageDye applies your color/image directly to that element instead of the whole page. Leave empty for a full-page background.",
      pickElement: "Pick",
      customCss: "Custom CSS",
      customCssHint: "Injected into this site. Use !important to override stubborn styles.",
      clearAll: "Clear All Sites",
      clearAllConfirm: "Remove PageDye settings for ALL websites? This cannot be undone.",
      clearAllDone: "All sites cleared!",
      pickerFailed: "Can't pick on this page"
    },
    zh: {
      title: "PageDye 设置",
      appName: "PageDye",
      bgType: "背景类型",
      typeNone: "无",
      typeColor: "纯色",
      typeImage: "图片",
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
      noTab: "无活动标签页",
      invalidUrl: "无效的链接",
      advanced: "高级设置",
      targetSelector: "背景选择器",
      targetSelectorHint: "拾取一个元素（或手动输入 CSS 选择器），PageDye 会把颜色/图片直接应用到该元素，而不是整页。留空则为整页背景。",
      pickElement: "拾取",
      customCss: "自定义 CSS",
      customCssHint: "将注入到本网站。可用 !important 覆盖顽固样式。",
      clearAll: "清除全部网站",
      clearAllConfirm: "确定要清除所有网站的 PageDye 设置吗？此操作无法撤销。",
      clearAllDone: "已清除全部网站!",
      pickerFailed: "此页面无法拾取"
    }
  };

  // Elements
  const els = {
    domainBadge: document.getElementById('current-domain'),
    bgTypes: document.getElementsByName('bgType'),
    sectionColor: document.getElementById('section-color'),
    sectionImage: document.getElementById('section-image'),
    sectionStyles: document.getElementById('section-styles'),
    colorPicker: document.getElementById('color-picker'),
    colorText: document.getElementById('color-text'),
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
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
    advancedToggle: document.getElementById('advanced-toggle'),
    advancedBody: document.getElementById('advanced-body'),
    targetSelector: document.getElementById('target-selector'),
    pickBtn: document.getElementById('pick-btn'),
    customCss: document.getElementById('custom-css'),
    clearAllBtn: document.getElementById('clear-all-btn'),

    saveBtn: document.getElementById('save-btn'),
    resetBtn: document.getElementById('reset-btn'),
    statusMsg: document.getElementById('status-msg')
  };

  // Sends a message to the tab's content script, injecting it first if it is
  // not reachable (page predates the extension, or the extension was reloaded
  // while the tab stayed open). Requires the "scripting" permission.
  async function sendToTab(tabId, message) {
    try {
      return await chrome.tabs.sendMessage(tabId, message);
    } catch (e) {
      await chrome.scripting.executeScript({ target: { tabId }, files: ['scripts/content.js'] });
      return await chrome.tabs.sendMessage(tabId, message);
    }
  }

  // State
  let currentDomain = '';
  let currentImageBase64 = null;
  let lang = 'en';

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
    radio.addEventListener('change', () => updateUI(radio.value));
  });

  // Color Picker Sync
  els.colorPicker.addEventListener('input', (e) => els.colorText.value = e.target.value);
  els.colorText.addEventListener('input', (e) => els.colorPicker.value = e.target.value);

  // Tabs
  els.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      els.tabBtns.forEach(b => b.classList.remove('active'));
      els.tabContents.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
      updatePreview();
    });
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
    updatePreview(); // Opacity affects container or overlay? For now preview just shows image.
    // Actually opacity is for the whole layer.
  });
  els.blur.addEventListener('input', (e) => {
    els.blurVal.textContent = `${e.target.value}px`;
    updatePreview();
  });

  // URL Preview
  els.imageUrl.addEventListener('input', (e) => {
    updatePreview();
  });

  // Advanced: collapsible toggle
  els.advancedToggle.addEventListener('click', () => {
    const open = els.advancedBody.classList.toggle('hidden') === false;
    els.advancedToggle.setAttribute('aria-expanded', String(open));
  });

  // Advanced: element picker
  els.pickBtn.addEventListener('click', startPicker);

  // Advanced: clear every site's settings
  els.clearAllBtn.addEventListener('click', clearAllSites);

  // Actions
  els.saveBtn.addEventListener('click', () => saveSettings());
  els.resetBtn.addEventListener('click', resetSettings);

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
  }

  function t(key) {
    return i18n[lang][key] || key;
  }

  function disableAll() {
    document.querySelector('main').style.opacity = '0.5';
    document.querySelector('main').style.pointerEvents = 'none';
    els.saveBtn.disabled = true;
    els.resetBtn.disabled = true;
  }

  function updatePreview() {
    // 1. Image
    let imageUrl = '';
    const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
    
    if (activeTab === 'url') {
       if (els.imageUrl.value) {
         imageUrl = `url('${els.imageUrl.value}')`;
       }
    } else {
       if (currentImageBase64) {
         imageUrl = `url('${currentImageBase64}')`;
       }
    }
    els.imagePreviewBg.style.backgroundImage = imageUrl;

    // 2. Blur
    const blur = els.blur.value;
    els.imagePreviewBg.style.filter = `blur(${blur}px)`;
    els.imagePreviewBg.style.transform = 'scale(1.08)';
  }

  async function loadSettings(domain) {
    const data = await chrome.storage.local.get(domain);
    const settings = data[domain] || { type: 'none', opacity: 100, blur: 0, style: { fixed: true, size: 'cover', repeat: false } };

    // Set Type
    document.querySelector(`input[name="bgType"][value="${settings.type}"]`).checked = true;
    updateUI(settings.type);

    // Set Values based on type
    if (settings.type === 'color') {
      els.colorPicker.value = settings.value || '#ffffff';
      els.colorText.value = settings.value || '#ffffff';
    } else if (settings.type === 'image') {
      // Check if it's base64 or url
      if (settings.value && settings.value.startsWith('data:')) {
        // Local file
        currentImageBase64 = settings.value;
        // Update UI state for local file
        els.tabBtns[0].click(); 
        els.dropArea.classList.add('hidden');
        els.fileInfo.classList.remove('hidden');
        els.fileName.textContent = t('saved'); 
      } else {
        // URL
        els.imageUrl.value = settings.value || '';
        els.tabBtns[1].click(); 
      }
    }

    // Common Styles
    els.opacity.value = settings.opacity;
    els.opacityVal.textContent = `${settings.opacity}%`;
    els.blur.value = settings.blur;
    els.blurVal.textContent = `${settings.blur}px`;
    
    if (settings.style) {
      els.bgFixed.checked = settings.style.fixed;
      els.bgSize.value = settings.style.size || 'cover';
      els.bgRepeat.checked = settings.style.repeat;
    }

    // Advanced fields
    els.targetSelector.value = settings.targetSelector || '';
    els.customCss.value = settings.customCss || '';
    // Auto-expand advanced section if it holds any settings
    if (els.targetSelector.value || els.customCss.value) {
      els.advancedBody.classList.remove('hidden');
      els.advancedToggle.setAttribute('aria-expanded', 'true');
    }

    // Trigger preview update
    updatePreview();
  }

  function updateUI(type) {
    els.sectionColor.classList.add('hidden');
    els.sectionImage.classList.add('hidden');
    els.sectionStyles.classList.add('hidden');
    els.imageOptions.classList.add('hidden');
    els.blurControl.classList.add('hidden'); // Hide blur by default

    if (type === 'color') {
      els.sectionColor.classList.remove('hidden');
      els.sectionStyles.classList.remove('hidden');
      // Blur hidden for color
    } else if (type === 'image') {
      els.sectionImage.classList.remove('hidden');
      els.sectionStyles.classList.remove('hidden');
      els.imageOptions.classList.remove('hidden');
      els.blurControl.classList.remove('hidden'); // Show blur for image
      updatePreview(); // Update preview when showing image section
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
      els.dropArea.classList.add('hidden');
      els.fileInfo.classList.remove('hidden');
      els.fileName.textContent = file.name;
      updatePreview();
    };
    reader.readAsDataURL(file);
  }

  function clearFile() {
    currentImageBase64 = null;
    els.fileInput.value = '';
    els.dropArea.classList.remove('hidden');
    els.fileInfo.classList.add('hidden');
    updatePreview();
  }

  // Reads the current form into a settings object (no side effects).
  function collectSettings() {
    const type = document.querySelector('input[name="bgType"]:checked').value;
    let value = '';

    if (type === 'color') {
      value = els.colorPicker.value;
    } else if (type === 'image') {
      const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
      value = activeTab === 'url' ? els.imageUrl.value : currentImageBase64;
    }

    return {
      type,
      value,
      opacity: parseInt(els.opacity.value, 10),
      blur: parseInt(els.blur.value, 10),
      style: {
        fixed: els.bgFixed.checked,
        size: els.bgSize.value,
        repeat: els.bgRepeat.checked
      },
      targetSelector: els.targetSelector.value.trim(),
      customCss: els.customCss.value,
      timestamp: Date.now()
    };
  }

  async function saveSettings(silent = false) {
    const settings = collectSettings();

    try {
      await chrome.storage.local.set({ [currentDomain]: settings });

      // Notify Content Script
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
          await sendToTab(tab.id, { action: 'updateBackground', settings });
        }
      } catch (err) {
        console.log('Content script might not be ready', err);
      }

      if (!silent) showStatus(t('saved'));
    } catch (err) {
      showStatus(t('error'));
      console.error(err);
    }
  }

  async function resetSettings() {
    await chrome.storage.local.remove(currentDomain);
    // Reset UI
    document.querySelector('input[value="none"]').click();
    els.opacity.value = 100;
    els.blur.value = 0;
    clearFile();
    els.imageUrl.value = '';
    els.targetSelector.value = '';
    els.customCss.value = '';

    // Notify Content Script
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      chrome.tabs.sendMessage(tab.id, { action: 'updateBackground', settings: { type: 'none' } });
    }
    showStatus(t('resetMsg'));
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
      // Force the LATEST content script onto the page first. An already-open
      // tab may still be running an old version (e.g. the overlay-based one);
      // re-injecting guarantees the current storage listener / direct-paint
      // logic is what reacts to the picked selector.
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
      showStatus(t('pickerFailed'));
    }
  }

  // Wipe PageDye settings for every website.
  async function clearAllSites() {
    if (!confirm(t('clearAllConfirm'))) return;
    await chrome.storage.local.clear();

    // Reset the current site's UI and live preview.
    document.querySelector('input[value="none"]').click();
    els.opacity.value = 100;
    els.blur.value = 0;
    clearFile();
    els.imageUrl.value = '';
    els.targetSelector.value = '';
    els.customCss.value = '';

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      try {
        await sendToTab(tab.id, { action: 'updateBackground', settings: { type: 'none' } });
      } catch (err) {
        console.log('Content script might not be ready', err);
      }
    }
    showStatus(t('clearAllDone'));
  }

  function showStatus(msg) {
    els.statusMsg.textContent = msg;
    els.statusMsg.classList.remove('hidden');
    setTimeout(() => els.statusMsg.classList.add('hidden'), 2000);
  }
});
