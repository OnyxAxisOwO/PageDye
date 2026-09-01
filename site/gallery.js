(function () {
  'use strict';

  const SLIDES = [
    {
      file: 'screenshot-01-ai-theme-lab-1280x800.png',
      address: 'pagedye://ai-theme-lab',
      tagKey: 'index.slide1Tag',
      titleKey: 'index.slide1Title',
      descKey: 'index.slide1Desc'
    },
    {
      file: 'screenshot-02-site-management-1280x800.png',
      address: 'pagedye://site-manager',
      tagKey: 'index.slide2Tag',
      titleKey: 'index.slide2Title',
      descKey: 'index.slide2Desc'
    },
    {
      file: 'screenshot-03-live-background-1280x800.png',
      address: 'pagedye://live-preview',
      tagKey: 'index.slide3Tag',
      titleKey: 'index.slide3Title',
      descKey: 'index.slide3Desc'
    },
    {
      file: 'screenshot-04-quick-customization-1280x800.png',
      address: 'pagedye://quick-customization',
      tagKey: 'index.slide4Tag',
      titleKey: 'index.slide4Title',
      descKey: 'index.slide4Desc'
    },
    {
      file: 'screenshot-05-fine-tuning-1280x800.png',
      address: 'pagedye://fine-tuning',
      tagKey: 'index.slide5Tag',
      titleKey: 'index.slide5Title',
      descKey: 'index.slide5Desc'
    },
    {
      file: 'screenshot-06-theme-library-1280x800.png',
      address: 'pagedye://theme-library',
      tagKey: 'index.slide6Tag',
      titleKey: 'index.slide6Title',
      descKey: 'index.slide6Desc'
    }
  ];

  const FOLDER_MAP = {
    'zh-CN': 'zh_CN',
    'zh-cn': 'zh_CN',
    'zh': 'zh_CN',
    'pt': 'pt_BR',
    'pt-br': 'pt_BR',
    'pt-BR': 'pt_BR'
  };

  let currentIndex = 0;
  let touchStartX = 0;
  let touchEndX = 0;

  function getActiveLang() {
    const htmlLang = document.documentElement.getAttribute('lang') || 'zh-CN';
    return FOLDER_MAP[htmlLang] || htmlLang;
  }

  function getMessage(key) {
    const raw = window.PAGEDYE_I18N_MESSAGES || {};
    const htmlLang = document.documentElement.getAttribute('lang') || 'zh-CN';
    const pack = raw[htmlLang] || raw['zh-CN'] || raw['en'] || {};
    return key.split('.').reduce((acc, seg) => (acc && acc[seg] != null ? acc[seg] : undefined), pack);
  }

  function updateGallery() {
    const slide = SLIDES[currentIndex];
    const folder = getActiveLang();
    const imgEl = document.getElementById('gallery-img');
    const addressEl = document.getElementById('gallery-address-bar');
    const tagEl = document.getElementById('gallery-caption-tag');
    const titleEl = document.getElementById('gallery-caption-title');
    const descEl = document.getElementById('gallery-caption-desc');

    if (!imgEl) return;

    // Smooth transition
    imgEl.style.opacity = '0.3';
    setTimeout(() => {
      imgEl.src = `assets/screenshots/${folder}/${slide.file}`;
      imgEl.style.opacity = '1';
    }, 120);

    if (addressEl) addressEl.textContent = slide.address;
    if (tagEl) {
      tagEl.setAttribute('data-i18n', slide.tagKey);
      tagEl.textContent = getMessage(slide.tagKey) || '';
    }
    if (titleEl) {
      titleEl.setAttribute('data-i18n', slide.titleKey);
      titleEl.textContent = getMessage(slide.titleKey) || '';
    }
    if (descEl) {
      descEl.setAttribute('data-i18n', slide.descKey);
      descEl.textContent = getMessage(slide.descKey) || '';
    }

    // Update active tab button
    document.querySelectorAll('.gallery-tab-btn').forEach((btn, idx) => {
      btn.classList.toggle('active', idx === currentIndex);
    });

    // Update active pagination dot
    document.querySelectorAll('.gallery-dot').forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentIndex);
    });
  }

  function goToSlide(index) {
    if (index < 0) index = SLIDES.length - 1;
    if (index >= SLIDES.length) index = 0;
    currentIndex = index;
    updateGallery();
  }

  function initGallery() {
    const prevBtn = document.getElementById('gallery-prev');
    const nextBtn = document.getElementById('gallery-next');
    const viewport = document.getElementById('gallery-viewport');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => goToSlide(currentIndex - 1));
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => goToSlide(currentIndex + 1));
    }

    document.querySelectorAll('.gallery-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-slide'), 10);
        if (!isNaN(idx)) goToSlide(idx);
      });
    });

    document.querySelectorAll('.gallery-dot').forEach((dot) => {
      dot.addEventListener('click', () => {
        const idx = parseInt(dot.getAttribute('data-slide'), 10);
        if (!isNaN(idx)) goToSlide(idx);
      });
    });

    // Touch swipe support
    if (viewport) {
      viewport.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      viewport.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
      }, { passive: true });
    }

    function handleSwipe() {
      const diff = touchEndX - touchStartX;
      if (Math.abs(diff) > 45) {
        if (diff < 0) goToSlide(currentIndex + 1); // Swipe left -> Next
        else goToSlide(currentIndex - 1); // Swipe right -> Prev
      }
    }

    // Listen to custom language switch event
    window.addEventListener('pagedye:langchange', () => {
      updateGallery();
    });

    // Initial render
    updateGallery();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGallery);
  } else {
    initGallery();
  }

  window.PageDyeGallery = { goToSlide, updateGallery };
})();
