// The first-run wizard. Collects a provider, key, endpoint and model one
// screen at a time, and writes the AI config exactly once, at the end — the
// same merge discipline options.js and ai-workspace.js use, so a half-finished
// wizard leaves whatever configuration already existed untouched.
//
// The onboarded flag is separate from the config on purpose: "has been walked
// through this once" and "has a working key" are different questions. Skipping
// sets the flag without a config, so the popup stops routing people here; a
// finished run sets both.
(function () {
  'use strict';

  const AI_CONFIG_KEY = '__pagedye_ai_config__';
  const ONBOARDED_KEY = '__pagedye_ai_onboarded__';
  const UI_THEME_KEY = '__pagedye_ui_theme__';

  const aiTheme = window.PageDyeAiTheme;

  // ------------------------------------------------------------------- i18n --

  const STRINGS = {
    en: {
      title: 'Welcome · PageDye',
      back: 'Back',
      skip: 'Maybe later',
      next: 'Next',
      finish: 'Finish',
      helloKicker: 'PageDye AI',
      helloTitle: 'Design themes by talking',
      helloBody: 'A few steps from now, an AI running on your own key will design wallpapers for any site you visit. Nothing leaves this browser until you say so.',
      helloAction: 'Begin',
      privacyTitle: 'First, the promises',
      privacyBody: 'Before anything gets filled in, this is how PageDye treats what you’re about to enter.',
      privacyKey: 'Your key is stored only in this browser’s local extension storage — exported backups never include it.',
      privacyContent: 'Generating a theme sends only a description of a page’s colours and layout — never the text you read or write there.',
      privacyDirect: 'Requests go straight from this browser to the endpoint you choose. There is no middleman server.',
      privacyTracking: 'No analytics, no telemetry, no accounts. PageDye has nothing to phone home to.',
      privacyAction: 'Understood, continue',
      providerTitle: 'How do you want to connect?',
      providerBody: 'Both run on a key you already own. You can switch at any time in AI settings.',
      providerAnthropic: 'The Claude models, straight from api.anthropic.com. Works out of the box with an Anthropic API key.',
      providerOpenaiName: 'OpenAI Compatible',
      providerOpenai: 'Any service with a /chat/completions endpoint — DeepSeek, OpenRouter, Groq, or an Ollama running on this machine.',
      keysTitle: 'Your key, your endpoint',
      keysBody: 'Paste the API key for the service you picked. The endpoint address is optional — leave it empty to use the default.',
      keysKeyLabel: 'API key',
      keysUrlLabel: 'API base URL',
      keysOptional: 'optional',
      keysReveal: 'Show key',
      keysUrlHint: 'Empty means {url}. A base address or a full …/chat/completions endpoint both work; the key is sent to whatever host you put here.',
      keysUrlHintAnthropic: 'Empty means {url}. Only fill this in if you proxy the Anthropic API through a host you trust.',
      keysPrivacy: 'Stored on this device only. Sent exclusively to the endpoint above.',
      keysErrorKey: 'The key looks empty.',
      modelTitle: 'Pick a model',
      modelBody: 'PageDye asks your endpoint what it offers, so you choose from what is really there.',
      modelDetecting: 'Asking the endpoint which models it serves…',
      modelCount: 'The endpoint lists {count} models.',
      modelFilter: 'Filter…',
      modelRetry: 'Try again',
      modelManual: 'Type a model id instead',
      modelManualLabel: 'Model id',
      modelManualHint: 'Exactly as your provider’s documentation spells it.',
      modelDetectAgain: 'Detect models instead',
      doneTitle: 'All set',
      doneBody: 'Open any website, tell the AI what mood you’re after, and watch the page change. Everything here can be revisited in AI settings.',
      doneAction: 'Enter the AI workspace'
    },
    zh: {
      title: '欢迎使用 · PageDye',
      back: '返回',
      skip: '稍后再说',
      next: '下一步',
      finish: '完成',
      helloKicker: 'PageDye AI',
      helloTitle: '用聊天的方式设计主题',
      helloBody: '几步之后，一位跑在你自己密钥上的 AI 就能为你访问的任何网站设计壁纸。在你点头之前，不会有任何数据离开这台浏览器。',
      helloAction: '开始',
      privacyTitle: '先把话说在前面',
      privacyBody: '在你填写任何内容之前，这是 PageDye 对待它们的方式。',
      privacyKey: '密钥只保存在本浏览器的扩展本地存储中，导出备份时绝不会包含它。',
      privacyContent: '生成主题时只会发送页面的配色与布局描述——绝不发送你在页面上阅读或输入的正文内容。',
      privacyDirect: '请求从这台浏览器直达你选择的接口，中间没有任何中转服务器。',
      privacyTracking: '没有统计、没有追踪、不需要账号。PageDye 没有任何可以“回传”的地方。',
      privacyAction: '我了解了，继续',
      providerTitle: '选择接入方式',
      providerBody: '两种方式都使用你自己的密钥，之后随时可以在 AI 设置里切换。',
      providerAnthropic: 'Claude 系列模型，直连 api.anthropic.com。有 Anthropic 密钥即可使用。',
      providerOpenaiName: 'OpenAI 兼容',
      providerOpenai: '任何提供 /chat/completions 接口的服务都能接入——DeepSeek、OpenRouter、Groq，或本机运行的 Ollama。',
      keysTitle: '你的密钥与接口',
      keysBody: '填入你所选服务的 API 密钥。接口地址是可选的，留空则使用默认地址。',
      keysKeyLabel: 'API 密钥',
      keysUrlLabel: 'API 地址',
      keysOptional: '可选',
      keysReveal: '显示密钥',
      keysUrlHint: '留空即使用 {url}。填基础地址或完整的 …/chat/completions 端点都可以；密钥会发送到你在这里填写的主机。',
      keysUrlHintAnthropic: '留空即使用 {url}。只有当你通过自己信任的代理访问 Anthropic 接口时才需要填写。',
      keysPrivacy: '只存在本机，只发往上面这一个接口。',
      keysErrorKey: '密钥还没有填写。',
      modelTitle: '选择模型',
      modelBody: 'PageDye 会询问你的接口提供哪些模型，让你从真实存在的列表里挑。',
      modelDetecting: '正在询问接口提供哪些模型…',
      modelCount: '接口列出了 {count} 个模型。',
      modelFilter: '筛选…',
      modelRetry: '重试',
      modelManual: '改为手动填写模型 ID',
      modelManualLabel: '模型 ID',
      modelManualHint: '照着你的服务商文档里的写法填。',
      modelDetectAgain: '改为自动检测模型',
      doneTitle: '一切就绪',
      doneBody: '打开任意网站，告诉 AI 你想要的感觉，看着页面变样。这里的每一项都可以随时在 AI 设置里修改。',
      doneAction: '进入 AI 工作台'
    }
  };

  const lang = String(navigator.language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en';

  function t(key, vars) {
    const value = (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.en[key] || key;
    return vars ? value.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match)) : value;
  }

  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  document.title = t('title');
  document.querySelectorAll('[data-i18n]').forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => {
    node.placeholder = t(node.dataset.i18nPlaceholder);
  });
  document.querySelectorAll('[data-i18n-title]').forEach((node) => {
    node.title = t(node.dataset.i18nTitle);
  });

  // ------------------------------------------------------------------ state --

  const state = {
    provider: aiTheme.DEFAULT_PROVIDER,
    apiKey: '',
    baseUrl: '',
    model: '',
    // What the last successful detection returned, and the inputs it ran
    // with — so stepping back to edit the key refetches, but flipping back
    // and forth between two screens does not.
    detected: [],
    detectedFor: '',
    manual: false
  };

  const els = {
    back: document.getElementById('back-btn'),
    skip: document.getElementById('skip-btn'),
    dots: document.getElementById('dots'),
    steps: Array.from(document.querySelectorAll('.step')),
    providerCards: Array.from(document.querySelectorAll('.provider')),
    providerNext: document.getElementById('provider-next'),
    keyInput: document.getElementById('key-input'),
    keyReveal: document.getElementById('key-reveal'),
    urlInput: document.getElementById('url-input'),
    urlHint: document.getElementById('url-hint'),
    keysError: document.getElementById('keys-error'),
    keysNext: document.getElementById('keys-next'),
    modelLoading: document.getElementById('model-loading'),
    modelError: document.getElementById('model-error'),
    modelErrorText: document.getElementById('model-error-text'),
    modelRetry: document.getElementById('model-retry'),
    modelPicker: document.getElementById('model-picker'),
    modelCount: document.getElementById('model-count'),
    modelFilter: document.getElementById('model-filter'),
    modelList: document.getElementById('model-list'),
    modelManual: document.getElementById('model-manual'),
    modelManualInput: document.getElementById('model-manual-input'),
    modelManualSuggestions: document.getElementById('model-manual-suggestions'),
    modelNext: document.getElementById('model-next'),
    doneSummary: document.getElementById('done-summary'),
    doneOpen: document.getElementById('done-open')
  };

  // The user's own interface theme reaches the ceremony too: the whole page
  // is repainted in Material You tones derived from their accent seed, the
  // same derivation applyUiThemeAccent runs in options.js — repeated here
  // because that one lives inside options.js's init closure. The CSS ships
  // neutral fallbacks, so a failed read just looks like the default theme.
  function applyDynamicColor(theme) {
    const { hexToHsl, hslToHex, hexToRgba, shiftHexColor, getUiAccentColor, getDisplayAccentColor } = window.PageDyeColorUtils;
    const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const seed = getUiAccentColor(theme && typeof theme === 'object' ? theme : {});
    const accent = getDisplayAccentColor(seed, isDark);

    const { l: accentL } = hexToHsl(accent);
    const accentIsLight = accentL >= 55;
    const root = document.documentElement.style;
    root.setProperty('--md-sys-color-primary', accent);
    root.setProperty('--md-sys-color-on-primary', accentIsLight ? '#000000' : '#ffffff');
    root.setProperty('--md-sys-color-primary-hover', shiftHexColor(accent, accentIsLight ? -32 : 24));
    root.setProperty('--md-sys-color-primary-container', hexToRgba(accent, 0.18));
    root.setProperty('--md-sys-color-on-primary-container', accent);
    root.setProperty('--md-sys-color-secondary-container', hexToRgba(accent, isDark ? 0.12 : 0.14));
    root.setProperty('--md-sys-color-on-secondary-container', accent);
    root.setProperty('--md-state-hover', hexToRgba(accent, 0.08));
    // The three tones the margin shapes are drawn in — the accent at low
    // alpha, so they tint with the theme instead of being fixed grey.
    root.setProperty('--deco-1', hexToRgba(accent, isDark ? 0.085 : 0.11));
    root.setProperty('--deco-2', hexToRgba(accent, isDark ? 0.05 : 0.065));
    root.setProperty('--deco-3', hexToRgba(accent, isDark ? 0.12 : 0.16));

    // The Material You neutral palette: the seed's hue at low chroma, tones
    // mirroring getMaterialYouSurfaceTones in options.js.
    const { h, s } = hexToHsl(seed);
    const surfaceSat = Math.min(45, s);
    const outlineSat = Math.min(30, s * 0.8);
    const textSat = Math.min(12, s * 0.3);
    const tones = isDark
      ? {
        '--md-sys-color-surface': hslToHex(h, surfaceSat, 6),
        '--md-sys-color-surface-container-low': hslToHex(h, surfaceSat, 9),
        '--md-sys-color-surface-container': hslToHex(h, surfaceSat, 11),
        '--md-sys-color-surface-container-high': hslToHex(h, surfaceSat, 16),
        '--md-sys-color-surface-container-highest': hslToHex(h, surfaceSat, 21),
        '--md-sys-color-on-surface': hslToHex(h, textSat, 89),
        '--md-sys-color-on-surface-variant': hslToHex(h, textSat, 76),
        '--md-sys-color-outline': hslToHex(h, outlineSat, 58),
        '--md-sys-color-outline-variant': hslToHex(h, outlineSat, 28)
      }
      : {
        '--md-sys-color-surface': hslToHex(h, surfaceSat, 97),
        '--md-sys-color-surface-container-low': hslToHex(h, surfaceSat, 95),
        '--md-sys-color-surface-container': hslToHex(h, surfaceSat, 93),
        '--md-sys-color-surface-container-high': hslToHex(h, surfaceSat, 91),
        '--md-sys-color-surface-container-highest': hslToHex(h, surfaceSat, 89),
        '--md-sys-color-on-surface': hslToHex(h, textSat, 9),
        '--md-sys-color-on-surface-variant': hslToHex(h, textSat, 28),
        '--md-sys-color-outline': hslToHex(h, outlineSat, 47),
        '--md-sys-color-outline-variant': hslToHex(h, outlineSat, 76)
      };
    Object.keys(tones).forEach((name) => root.setProperty(name, tones[name]));
  }

  // PageDye's own "reduce interface motion" preference reaches this page too;
  // prefers-reduced-motion is handled in CSS alone.
  chrome.storage.local.get(UI_THEME_KEY).then((data) => {
    const theme = data && data[UI_THEME_KEY];
    if (theme && typeof theme === 'object' && theme.disableAnimation) {
      document.documentElement.classList.add('no-anim');
    }
    applyDynamicColor(theme);
  }).catch(() => {});

  // ------------------------------------------------------------- navigation --

  const ORDER = ['hello', 'privacy', 'provider', 'keys', 'model', 'done'];
  let current = 0;
  let leaving = false;

  ORDER.forEach(() => {
    const dot = document.createElement('span');
    dot.className = 'dot';
    els.dots.appendChild(dot);
  });

  function stepAt(index) {
    return els.steps.find((step) => step.dataset.step === ORDER[index]);
  }

  function paintChrome() {
    // No way back from the celebration: the config is already written, and
    // "undo" for it lives in AI settings, not in re-running the wizard.
    els.back.hidden = current === 0 || ORDER[current] === 'done';
    // Skipping stops making sense once a key has been typed into the flow.
    els.skip.hidden = current > 2;
    Array.from(els.dots.children).forEach((dot, index) => {
      dot.classList.toggle('active', index === current);
      dot.classList.toggle('passed', index < current);
    });
  }

  function goTo(index, direction) {
    if (leaving || index === current) return;
    const from = stepAt(current);
    const to = stepAt(index);
    if (!to) return;
    const enterStep = () => {
      from.classList.remove('active', 'leaving-forward', 'leaving-back');
      current = index;
      to.classList.add('active');
      to.scrollTop = 0;
      paintChrome();
      onEnter(ORDER[index]);
    };
    const reduced = document.documentElement.classList.contains('no-anim')
      || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    if (reduced) {
      enterStep();
      return;
    }
    leaving = true;
    from.classList.add(direction === 'back' ? 'leaving-back' : 'leaving-forward');
    setTimeout(() => {
      leaving = false;
      enterStep();
    }, 290);
  }

  function next() { goTo(current + 1, 'forward'); }
  function back() { goTo(current - 1, 'back'); }

  document.querySelectorAll('[data-next]').forEach((node) => {
    node.addEventListener('click', next);
  });
  els.back.addEventListener('click', back);

  els.skip.addEventListener('click', async () => {
    try {
      await chrome.storage.local.set({ [ONBOARDED_KEY]: true });
    } catch (_) {
      // Storage said no; the dashboard is still the right place to land.
    }
    location.replace('options.html');
  });

  // --------------------------------------------------------- step: provider --

  function paintProvider() {
    els.providerCards.forEach((card) => {
      card.setAttribute('aria-checked', String(card.dataset.provider === state.provider));
    });
  }

  els.providerCards.forEach((card) => {
    card.addEventListener('click', () => {
      state.provider = card.dataset.provider;
      paintProvider();
    });
  });
  els.providerNext.addEventListener('click', next);

  // ------------------------------------------------------------- step: keys --

  function preset() {
    return aiTheme.PROVIDERS[state.provider] || aiTheme.PROVIDERS[aiTheme.DEFAULT_PROVIDER];
  }

  function paintKeys() {
    const fallback = preset().defaultBaseUrl;
    els.urlInput.placeholder = fallback;
    els.urlHint.textContent = t(state.provider === 'anthropic' ? 'keysUrlHintAnthropic' : 'keysUrlHint', { url: fallback });
    els.keysNext.disabled = !els.keyInput.value.trim();
  }

  els.keyInput.addEventListener('input', () => {
    els.keysError.hidden = true;
    els.keysNext.disabled = !els.keyInput.value.trim();
  });
  els.urlInput.addEventListener('input', () => {
    els.keysError.hidden = true;
  });

  els.keyReveal.addEventListener('click', () => {
    const show = els.keyInput.type === 'password';
    els.keyInput.type = show ? 'text' : 'password';
    els.keyReveal.setAttribute('aria-pressed', String(show));
  });

  function showKeysError(message) {
    els.keysError.textContent = message;
    els.keysError.hidden = false;
    els.keysError.classList.remove('shake');
    // Forces the animation to restart when the same error fires twice.
    void els.keysError.offsetWidth;
    els.keysError.classList.add('shake');
  }

  function submitKeys() {
    const apiKey = els.keyInput.value.trim();
    if (!apiKey) {
      showKeysError(t('keysErrorKey'));
      return;
    }
    // Validated with the same rule every request runs through, so a URL that
    // passes here cannot fail differently later.
    try {
      aiTheme.normalizeBaseUrl(els.urlInput.value, preset().defaultBaseUrl);
    } catch (error) {
      showKeysError(String((error && error.message) || error));
      return;
    }
    state.apiKey = apiKey;
    state.baseUrl = els.urlInput.value.trim();
    next();
  }

  els.keysNext.addEventListener('click', submitKeys);
  [els.keyInput, els.urlInput].forEach((input) => {
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.isComposing) submitKeys();
    });
  });

  // ------------------------------------------------------------ step: model --

  function modelState(name) {
    els.modelLoading.hidden = name !== 'loading';
    els.modelError.hidden = name !== 'error';
    els.modelPicker.hidden = name !== 'picker';
    els.modelManual.hidden = name !== 'manual';
  }

  function paintModelNext() {
    const value = state.manual ? els.modelManualInput.value.trim() : state.model;
    els.modelNext.disabled = !value;
  }

  function renderModelList(filter) {
    const query = (filter || '').trim().toLowerCase();
    els.modelList.textContent = '';
    const shown = state.detected.filter((entry) => !query
      || entry.id.toLowerCase().includes(query)
      || (entry.label || '').toLowerCase().includes(query));
    shown.forEach((entry, index) => {
      const option = document.createElement('button');
      option.type = 'button';
      option.className = 'model-option';
      option.setAttribute('role', 'radio');
      option.setAttribute('aria-checked', String(entry.id === state.model));
      // Staggered like the reveal blocks, but capped: item forty arriving a
      // full two seconds late reads as broken, not ceremonial.
      option.style.setProperty('--d', `${Math.min(index * 0.04, 0.4)}s`);
      const name = document.createElement('span');
      name.className = 'model-option-name';
      const label = document.createElement('span');
      label.className = 'model-option-label';
      label.textContent = entry.label || entry.id;
      name.appendChild(label);
      if (entry.label && entry.label !== entry.id) {
        const id = document.createElement('span');
        id.className = 'model-option-id';
        id.textContent = entry.id;
        name.appendChild(id);
      }
      option.appendChild(name);
      // A tick rather than a radio ring: nothing else on this page draws a
      // ring, and one row in twenty carrying an empty circle reads as a form.
      const check = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      check.setAttribute('class', 'model-check');
      check.setAttribute('viewBox', '0 0 24 24');
      check.setAttribute('fill', 'none');
      check.setAttribute('stroke', 'currentColor');
      check.setAttribute('stroke-width', '2.6');
      check.setAttribute('stroke-linecap', 'round');
      check.setAttribute('stroke-linejoin', 'round');
      const tick = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      tick.setAttribute('d', 'M5 12.5l4.5 4.5L19 6.5');
      check.appendChild(tick);
      option.appendChild(check);
      option.addEventListener('click', () => {
        state.model = entry.id;
        els.modelList.querySelectorAll('.model-option').forEach((node) => {
          node.setAttribute('aria-checked', 'false');
        });
        option.setAttribute('aria-checked', 'true');
        paintModelNext();
      });
      els.modelList.appendChild(option);
    });
  }

  function showDetected() {
    state.manual = false;
    els.modelCount.textContent = t('modelCount', { count: state.detected.length });
    els.modelFilter.hidden = state.detected.length <= 10;
    els.modelFilter.placeholder = t('modelFilter');
    els.modelFilter.value = '';
    // Something sensible already lit up: what the config had, the provider's
    // default, or the first thing listed — picked in that order.
    if (!state.detected.some((entry) => entry.id === state.model)) {
      const fallback = preset().defaultModel;
      state.model = state.detected.some((entry) => entry.id === fallback)
        ? fallback
        : state.detected[0].id;
    }
    renderModelList('');
    modelState('picker');
    paintModelNext();
  }

  async function detectModels() {
    const signature = [state.provider, state.apiKey, state.baseUrl].join(' ');
    if (state.detectedFor === signature && state.detected.length) {
      showDetected();
      return;
    }
    modelState('loading');
    paintModelNext();
    try {
      const models = await aiTheme.listModels({
        provider: state.provider,
        apiKey: state.apiKey,
        baseUrl: state.baseUrl
      });
      state.detected = models;
      state.detectedFor = signature;
      showDetected();
    } catch (error) {
      els.modelErrorText.textContent = String((error && error.message) || error);
      modelState('error');
    }
  }

  function showManual() {
    state.manual = true;
    // The ids this codebase has actually confirmed, as suggestions — only the
    // Anthropic preset carries any.
    els.modelManualSuggestions.textContent = '';
    preset().models.forEach((id) => {
      const option = document.createElement('option');
      option.value = id;
      els.modelManualSuggestions.appendChild(option);
    });
    if (!els.modelManualInput.value) {
      els.modelManualInput.value = state.model || preset().defaultModel;
    }
    modelState('manual');
    paintModelNext();
    els.modelManualInput.focus();
  }

  els.modelRetry.addEventListener('click', () => {
    state.detectedFor = '';
    detectModels();
  });
  document.getElementById('model-manual-link').addEventListener('click', showManual);
  document.getElementById('model-manual-link-2').addEventListener('click', showManual);
  document.getElementById('model-detect-link').addEventListener('click', () => {
    state.manual = false;
    detectModels();
  });
  els.modelFilter.addEventListener('input', () => renderModelList(els.modelFilter.value));
  els.modelManualInput.addEventListener('input', paintModelNext);
  els.modelManualInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.isComposing && !els.modelNext.disabled) finish();
  });

  // ------------------------------------------------------------------ finish --

  async function finish() {
    const modelId = state.manual ? els.modelManualInput.value.trim() : state.model;
    if (!modelId) return;
    els.modelNext.disabled = true;

    const detected = state.detected.find((entry) => entry.id === modelId);
    try {
      // Read-merge-write, like every other writer of this key: the wizard
      // only owns the fields it collected. Streaming, the style prompt and
      // any shortlist built elsewhere survive a re-run.
      const data = await chrome.storage.local.get(AI_CONFIG_KEY);
      const stored = aiTheme.normalizeConfig(data && data[AI_CONFIG_KEY]);
      const models = stored.models.some((entry) => entry.id === modelId)
        ? stored.models
        : stored.models.concat([detected || { id: modelId }]);
      await chrome.storage.local.set({
        [AI_CONFIG_KEY]: Object.assign({}, stored, {
          provider: state.provider,
          apiKey: state.apiKey,
          baseUrl: state.baseUrl,
          model: modelId,
          models,
          // The provider's own answer to "can every model here see images",
          // the same reset switching provider in settings performs.
          vision: preset().vision === true
        }),
        [ONBOARDED_KEY]: true
      });
    } catch (error) {
      els.modelErrorText.textContent = String((error && error.message) || error);
      modelState('error');
      paintModelNext();
      return;
    }

    const providerName = preset().label;
    const shownModel = (detected && detected.label) || modelId;
    els.doneSummary.textContent = `${providerName} · ${shownModel}`;
    next();
  }

  els.modelNext.addEventListener('click', finish);

  els.doneOpen.addEventListener('click', () => {
    // replace(), not href: Back from the workspace should not land in the
    // middle of a ceremony that has already happened.
    location.replace('options.html#section-ai');
  });

  // ------------------------------------------------------------- step hooks --

  function onEnter(name) {
    if (name === 'provider') paintProvider();
    if (name === 'keys') {
      paintKeys();
      els.keyInput.focus({ preventScroll: true });
    }
    if (name === 'model') {
      if (state.manual) showManual();
      else detectModels();
    }
  }

  // -------------------------------------------------------------------- boot --

  // An existing configuration prefills the wizard instead of being ignored:
  // re-running it is how you re-configure, and starting from what is already
  // there beats retyping a working key.
  chrome.storage.local.get(AI_CONFIG_KEY).then((data) => {
    const stored = data && data[AI_CONFIG_KEY];
    if (!stored || typeof stored !== 'object') return;
    const config = aiTheme.normalizeConfig(stored);
    state.provider = config.provider;
    state.model = config.model;
    if (config.apiKey) els.keyInput.value = config.apiKey;
    if (config.baseUrl) els.urlInput.value = config.baseUrl;
    paintProvider();
    paintKeys();
  }).catch(() => {});

  stepAt(0).classList.add('active');
  paintChrome();
  paintProvider();
  paintKeys();
})();
