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
      invalidUrl: "Invalid URL"
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
      invalidUrl: "无效的链接"
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
    saveBtn: document.getElementById('save-btn'),
    resetBtn: document.getElementById('reset-btn'),
    statusMsg: document.getElementById('status-msg')
  };

  // State
  let currentDomain = '';
  let currentImageBase64 = null;
  let lang = 'en';

  // Init
  initI18n();
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.url) {
    try {
      const url = new URL(tab.url);
      currentDomain = url.hostname;
      els.domainBadge.textContent = currentDomain;
      loadSettings(currentDomain);
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

  // Actions
  els.saveBtn.addEventListener('click', saveSettings);
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

  async function saveSettings() {
    const type = document.querySelector('input[name="bgType"]:checked').value;
    let value = '';

    if (type === 'color') {
      value = els.colorPicker.value;
    } else if (type === 'image') {
      const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
      if (activeTab === 'url') {
        value = els.imageUrl.value;
      } else {
        value = currentImageBase64;
      }
    }

    const settings = {
      type,
      value,
      opacity: parseInt(els.opacity.value, 10),
      blur: parseInt(els.blur.value, 10),
      style: {
        fixed: els.bgFixed.checked,
        size: els.bgSize.value,
        repeat: els.bgRepeat.checked
      },
      timestamp: Date.now()
    };

    try {
      await chrome.storage.local.set({ [currentDomain]: settings });
      
      // Notify Content Script
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
          chrome.tabs.sendMessage(tab.id, { action: 'updateBackground', settings });
        }
      } catch (err) {
        console.log('Content script might not be ready', err);
      }

      showStatus(t('saved'));
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
    
    // Notify Content Script
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      chrome.tabs.sendMessage(tab.id, { action: 'updateBackground', settings: { type: 'none' } });
    }
    showStatus(t('resetMsg'));
  }

  function showStatus(msg) {
    els.statusMsg.textContent = msg;
    els.statusMsg.classList.remove('hidden');
    setTimeout(() => els.statusMsg.classList.add('hidden'), 2000);
  }
});
