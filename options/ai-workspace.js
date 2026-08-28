// The dashboard's AI workspace: everything options.js used to wire around the
// chat component, rebuilt for the fullscreen layout.
//
// The component itself (scripts/shared/ai-chat.js) still owns the transcript;
// this file owns what surrounds it on this page only — which open tab is being
// designed for (a chip above the transcript instead of the old select-then-new
// flow: it defaults to the page you were just on and can be changed at any
// point), which model answers (a chip fed from the shortlist kept in AI
// settings), the mock live preview on the right, and the model shortlist
// manager inside the settings card.
//
// It is a separate file for the same reason config-manager.js is: options.js
// is long past the point where one more subsystem belongs inside it.

(function () {
  'use strict';

  const AI_CONFIG_KEY = '__pagedye_ai_config__';
  const SIDE_HIDDEN_KEY = 'pagedye-ai-side-hidden';
  const RAIL_COLLAPSED_KEY = 'pagedye-ai-rail-collapsed';
  // Below this the side panel is an overlay drawer rather than a column;
  // mirrors the breakpoint in options.css.
  const DRAWER_QUERY = '(max-width: 1100px)';
  const HEX_RE = /^#[0-9a-f]{6}$/i;
  const IMAGE_DATA_URL_RE = /^data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+=*$/;

  function init(deps) {
    const t = deps.t;
    // options.js's t() does plain lookups; the counts and names below need
    // placeholder substitution, so it happens here.
    function str(key, vars) {
      const value = t(key);
      return vars ? value.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match)) : value;
    }
    const doc = document;

    const els = {
      root: doc.getElementById('ai-chat-root'),
      workspace: doc.querySelector('#section-ai-chat .ai-workspace'),
      side: doc.getElementById('ai-side'),
      sideToggle: doc.getElementById('ai-side-toggle'),
      railToggle: doc.getElementById('ai-rail-toggle'),
      mainHeader: doc.getElementById('ai-main-header'),
      navPanel: doc.getElementById('ai-rail-nav-panel'),
      mountParts: doc.getElementById('ai-mount-parts'),
      targetChip: doc.getElementById('ai-target-chip'),
      targetChipLabel: doc.getElementById('ai-target-chip-label'),
      targetMenu: doc.getElementById('ai-target-menu'),
      targetMenuList: doc.getElementById('ai-target-menu-list'),
      modelChip: doc.getElementById('ai-model-chip'),
      modelChipLabel: doc.getElementById('ai-model-chip-label'),
      modelMenu: doc.getElementById('ai-model-menu'),
      modelMenuList: doc.getElementById('ai-model-menu-list'),
      modelMenuManage: doc.getElementById('ai-model-menu-manage'),
      modelInput: doc.getElementById('ai-model-input'),
      modelList: doc.getElementById('ai-model-list'),
      modelAdd: doc.getElementById('ai-model-add'),
      modelDetect: doc.getElementById('ai-model-detect'),
      detectPanel: doc.getElementById('ai-model-detect-panel'),
      detectStatus: doc.getElementById('ai-model-detect-status'),
      detectList: doc.getElementById('ai-model-detect-list'),
      detectActions: doc.getElementById('ai-model-detect-actions'),
      detectAdd: doc.getElementById('ai-model-detect-add'),
      detectCancel: doc.getElementById('ai-model-detect-cancel'),
      settingsCard: doc.getElementById('settings-ai'),
      apiKeyInput: doc.getElementById('ai-api-key-input'),
      previewFrame: doc.getElementById('ai-preview-frame'),
      previewMeta: doc.getElementById('ai-preview-meta'),
      previewConfig: doc.getElementById('ai-preview-config'),
      previewLight: doc.getElementById('ai-preview-scheme-light'),
      previewDark: doc.getElementById('ai-preview-scheme-dark')
    };
    if (!els.root || !window.PageDyeAiChat) return null;

    const aiTheme = window.PageDyeAiTheme;

    // --- config ---------------------------------------------------------------

    let config = aiTheme.normalizeConfig(null);

    async function readConfig() {
      const data = await chrome.storage.local.get(AI_CONFIG_KEY);
      config = aiTheme.normalizeConfig(data && data[AI_CONFIG_KEY]);
    }

    // The same merge discipline as options.js's saveAiConfig: re-read before
    // writing so a chip click cannot clobber a field edited elsewhere.
    let writeChain = Promise.resolve();
    function saveConfig(partial) {
      writeChain = writeChain.catch(() => {}).then(async () => {
        const data = await chrome.storage.local.get(AI_CONFIG_KEY);
        const stored = aiTheme.normalizeConfig(data && data[AI_CONFIG_KEY]);
        await chrome.storage.local.set({ [AI_CONFIG_KEY]: Object.assign({}, stored, partial) });
      });
      return writeChain;
    }

    // --- chip menus -----------------------------------------------------------

    const menus = [
      { chip: els.targetChip, panel: els.targetMenu },
      { chip: els.modelChip, panel: els.modelMenu }
    ];

    function closeMenus(except) {
      menus.forEach((menu) => {
        if (menu.panel === except) return;
        menu.panel.hidden = true;
        menu.chip.setAttribute('aria-expanded', 'false');
      });
    }

    function toggleMenu(menu, onOpen) {
      const open = menu.panel.hidden;
      closeMenus(open ? menu.panel : null);
      menu.panel.hidden = !open;
      menu.chip.setAttribute('aria-expanded', String(open));
      if (open && onOpen) onOpen();
    }

    doc.addEventListener('click', (event) => {
      if (!event.target.closest('.ai-chip-group')) closeMenus();
    });
    doc.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenus();
    });

    // --- target page ----------------------------------------------------------
    // The old flow asked for a tab up front, in a select that had to be
    // refreshed by hand. The chip inverts it: it defaults to the page you most
    // recently had in front of you, re-reads the tab list every time it is
    // opened, and can be changed mid-conversation.

    let target = null; // {tabId, hostname, title}

    function hostnameOf(url) {
      try {
        return new URL(url).hostname;
      } catch (_) {
        return '';
      }
    }

    async function usableTabs() {
      const tabs = await chrome.tabs.query({});
      // Only pages a content script can be injected into: no about:, chrome://
      // or the dashboard itself. Most recently used first, which is also what
      // "the page I was just on" means when nothing was picked.
      return tabs
        .filter((tab) => Number.isInteger(tab.id) && typeof tab.url === 'string' && /^https?:/i.test(tab.url))
        .sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));
    }

    function paintTargetChip() {
      els.targetChipLabel.textContent = (target && target.hostname) || t('aiChatNoTabs');
      els.targetChip.classList.toggle('placeholder', !target);
    }

    async function refreshTarget() {
      const tabs = await usableTabs();
      const stillOpen = target && tabs.find((tab) => tab.id === target.tabId);
      if (stillOpen) {
        target = { tabId: stillOpen.id, hostname: hostnameOf(stillOpen.url), title: stillOpen.title || '' };
      } else {
        const first = tabs[0];
        target = first ? { tabId: first.id, hostname: hostnameOf(first.url), title: first.title || '' } : null;
      }
      paintTargetChip();
      return tabs;
    }

    async function openTargetMenu() {
      els.targetMenuList.textContent = '';
      const tabs = await refreshTarget();
      if (!tabs.length) {
        const empty = doc.createElement('p');
        empty.className = 'ai-chip-menu-empty';
        empty.textContent = t('aiChatNoTabs');
        els.targetMenuList.appendChild(empty);
        return;
      }
      tabs.forEach((tab) => {
        const item = doc.createElement('button');
        item.type = 'button';
        item.className = 'ai-chip-menu-item';
        if (target && tab.id === target.tabId) item.classList.add('active');
        const host = doc.createElement('span');
        host.className = 'ai-chip-menu-item-title';
        host.textContent = hostnameOf(tab.url);
        const title = doc.createElement('span');
        title.className = 'ai-chip-menu-item-sub';
        title.textContent = (tab.title || '').slice(0, 80);
        item.appendChild(host);
        if (title.textContent) item.appendChild(title);
        item.addEventListener('click', () => {
          target = { tabId: tab.id, hostname: hostnameOf(tab.url), title: tab.title || '' };
          targetPicked = true;
          paintTargetChip();
          closeMenus();
        });
        els.targetMenuList.appendChild(item);
      });
    }

    els.targetChip.addEventListener('click', () => toggleMenu(menus[0], openTargetMenu));

    // --- model picker ---------------------------------------------------------

    function paintModelChip() {
      const label = aiTheme.modelLabel(config, config.model);
      els.modelChipLabel.textContent = label || t('aiModelNone');
      els.modelChip.classList.toggle('placeholder', !label);
    }

    function openModelMenu() {
      els.modelMenuList.textContent = '';
      const options = config.models.slice();
      // The active model is offered even when it was never saved, so the menu
      // always shows what a send would actually use.
      if (config.model && !options.some((entry) => entry.id === config.model)) {
        options.unshift({ id: config.model });
      }
      if (!options.length) {
        const empty = doc.createElement('p');
        empty.className = 'ai-chip-menu-empty';
        empty.textContent = t('aiModelMenuEmpty');
        els.modelMenuList.appendChild(empty);
        return;
      }
      options.forEach((entry) => {
        const item = doc.createElement('button');
        item.type = 'button';
        item.className = 'ai-chip-menu-item';
        if (entry.id === config.model) item.classList.add('active');
        const name = doc.createElement('span');
        name.className = 'ai-chip-menu-item-title';
        name.textContent = entry.label || entry.id;
        item.appendChild(name);
        if (entry.label) {
          const sub = doc.createElement('span');
          sub.className = 'ai-chip-menu-item-sub';
          sub.textContent = entry.id;
          item.appendChild(sub);
        }
        item.addEventListener('click', () => {
          closeMenus();
          saveConfig({ model: entry.id });
        });
        els.modelMenuList.appendChild(item);
      });
    }

    els.modelChip.addEventListener('click', () => toggleMenu(menus[1], openModelMenu));
    if (els.modelMenuManage) {
      els.modelMenuManage.addEventListener('click', () => {
        closeMenus();
        openAiSettings();
      });
    }

    // --- model shortlist manager (inside the settings card) -------------------

    function renderModelList() {
      if (!els.modelList) return;
      els.modelList.textContent = '';
      if (!config.models.length) {
        const empty = doc.createElement('p');
        empty.className = 'ai-model-list-empty';
        empty.textContent = t('aiModelsEmpty');
        els.modelList.appendChild(empty);
        return;
      }
      config.models.forEach((entry) => {
        const row = doc.createElement('div');
        row.className = 'ai-model-row';
        if (entry.id === config.model) row.classList.add('active');

        const use = doc.createElement('button');
        use.type = 'button';
        use.className = 'ai-model-use';
        use.title = t('aiModelUse');
        use.setAttribute('aria-label', t('aiModelUse'));
        use.addEventListener('click', () => saveConfig({ model: entry.id }));
        row.appendChild(use);

        const fields = doc.createElement('div');
        fields.className = 'ai-model-fields';
        const label = doc.createElement('input');
        label.type = 'text';
        label.className = 'ai-model-label';
        label.placeholder = t('aiModelLabelPlaceholder');
        label.value = entry.label || '';
        label.maxLength = 60;
        label.addEventListener('change', () => {
          const next = config.models.map((model) => (model.id === entry.id
            ? (label.value.trim() ? { id: model.id, label: label.value.trim() } : { id: model.id })
            : model));
          saveConfig({ models: next });
        });
        const id = doc.createElement('span');
        id.className = 'ai-model-id';
        id.textContent = entry.id;
        id.title = entry.id;
        fields.appendChild(label);
        fields.appendChild(id);
        row.appendChild(fields);

        const remove = doc.createElement('button');
        remove.type = 'button';
        remove.className = 'ai-model-remove';
        remove.title = t('aiModelRemove');
        remove.setAttribute('aria-label', t('aiModelRemove'));
        remove.textContent = '×';
        remove.addEventListener('click', () => {
          saveConfig({ models: config.models.filter((model) => model.id !== entry.id) });
        });
        row.appendChild(remove);

        els.modelList.appendChild(row);
      });
    }

    if (els.modelAdd) {
      els.modelAdd.addEventListener('click', () => {
        const id = (els.modelInput && els.modelInput.value.trim()) || config.model;
        if (!id || config.models.some((model) => model.id === id)) return;
        saveConfig({ models: config.models.concat([{ id }]) });
      });
    }

    // --- detecting available models -------------------------------------------
    // Asks the configured endpoint what it serves, then asks the user which of
    // those to keep. Never adds anything by itself: the request runs on the
    // button press, the additions on a second one.

    let detected = [];

    function closeDetectPanel() {
      if (!els.detectPanel) return;
      els.detectPanel.hidden = true;
      els.detectList.textContent = '';
      els.detectActions.hidden = true;
      detected = [];
    }

    async function detectModels() {
      if (!els.detectPanel) return;
      els.detectPanel.hidden = false;
      els.detectActions.hidden = true;
      els.detectList.textContent = '';
      els.detectStatus.textContent = t('aiModelDetecting');
      els.modelDetect.disabled = true;
      try {
        const models = await aiTheme.listModels(config);
        detected = models;
        els.detectStatus.textContent = str('aiModelDetected', { count: models.length });
        models.forEach((entry, index) => {
          const row = doc.createElement('label');
          row.className = 'ai-model-detect-row';
          const box = doc.createElement('input');
          box.type = 'checkbox';
          box.dataset.index = String(index);
          const known = config.models.some((model) => model.id === entry.id);
          box.disabled = known;
          const name = doc.createElement('span');
          name.className = 'ai-model-detect-name';
          name.textContent = entry.label && entry.label !== entry.id ? `${entry.label} — ${entry.id}` : entry.id;
          row.appendChild(box);
          row.appendChild(name);
          if (known) {
            const badge = doc.createElement('span');
            badge.className = 'ai-model-detect-known';
            badge.textContent = t('aiModelAlreadySaved');
            row.appendChild(badge);
          }
          els.detectList.appendChild(row);
        });
        els.detectActions.hidden = false;
      } catch (error) {
        els.detectStatus.textContent = String((error && error.message) || error);
      } finally {
        els.modelDetect.disabled = false;
      }
    }

    if (els.modelDetect) els.modelDetect.addEventListener('click', () => { detectModels(); });
    if (els.detectCancel) els.detectCancel.addEventListener('click', closeDetectPanel);
    if (els.detectAdd) {
      els.detectAdd.addEventListener('click', () => {
        const picked = [...els.detectList.querySelectorAll('input:checked')]
          .map((box) => detected[Number(box.dataset.index)])
          .filter(Boolean);
        if (picked.length) {
          const merged = config.models.slice();
          picked.forEach((entry) => {
            if (!merged.some((model) => model.id === entry.id)) merged.push(entry);
          });
          saveConfig({ models: merged });
        }
        closeDetectPanel();
      });
    }

    // --- side panel -----------------------------------------------------------

    function setSideHidden(hidden, persist) {
      els.workspace.classList.toggle('side-hidden', hidden);
      if (els.sideToggle) els.sideToggle.setAttribute('aria-expanded', String(!hidden));
      if (!persist) return;
      try {
        localStorage.setItem(SIDE_HIDDEN_KEY, hidden ? '1' : '');
      } catch (_) {
        // A browser build without page storage just forgets the preference.
      }
    }

    if (els.sideToggle) {
      els.sideToggle.addEventListener('click', () => {
        setSideHidden(!els.workspace.classList.contains('side-hidden'), true);
      });
    }
    // No stored choice yet: open on a screen wide enough for three columns,
    // closed where the CSS turns the panel into an overlay drawer — a drawer
    // that starts covering the chat would read as broken. The default is not
    // persisted (only a press of the toggle is a choice worth remembering),
    // and it follows the window until that press happens.
    function applyDefaultSideState() {
      try {
        const stored = localStorage.getItem(SIDE_HIDDEN_KEY);
        if (stored === null) setSideHidden(window.matchMedia(DRAWER_QUERY).matches);
        else setSideHidden(stored === '1');
      } catch (_) { /* same as above */ }
    }
    applyDefaultSideState();
    window.addEventListener('resize', applyDefaultSideState);

    // Where the drawer has to start so it does not bury the button that opens
    // it. In drawer mode the panel is absolutely positioned over the chat, and
    // anchoring it at the top put it straight on top of its own toggle: the
    // drawer opened and then swallowed every click aimed at closing it. The
    // header's bottom edge is measured rather than guessed because the chat's
    // own bar appears above it on narrow screens, which moves it.
    function syncDrawerTop() {
      if (!els.mainHeader || !els.workspace) return;
      const top = els.workspace.getBoundingClientRect().top;
      const bottom = els.mainHeader.getBoundingClientRect().bottom;
      // Zero while the section is hidden, which is most of the page's life:
      // writing that would anchor the drawer at the very top again, so it is
      // ignored and the next real measurement wins.
      const offset = Math.round(bottom - top);
      if (offset > 0) els.workspace.style.setProperty('--ai-drawer-top', `${offset}px`);
    }
    window.addEventListener('resize', syncDrawerTop);
    // The header has no height until the chat page is first shown, and gains
    // one exactly when the section becomes visible — which is the moment worth
    // measuring at, and the one a load-time call always misses.
    if (typeof ResizeObserver === 'function') {
      new ResizeObserver(syncDrawerTop).observe(els.mainHeader);
    }

    // A drawer floating over the chat dismisses like the chip menus do: a
    // click anywhere outside it, or Escape. Neither is persisted — putting a
    // drawer away is not the same as choosing to work without the panel.
    doc.addEventListener('click', (event) => {
      if (!window.matchMedia(DRAWER_QUERY).matches) return;
      if (els.workspace.classList.contains('side-hidden')) return;
      if (event.target.closest('#ai-side') || event.target.closest('#ai-side-toggle')) return;
      setSideHidden(true);
    });
    doc.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || !window.matchMedia(DRAWER_QUERY).matches) return;
      if (!els.workspace.classList.contains('side-hidden')) setSideHidden(true);
    });

    // --- conversation rail ----------------------------------------------------
    // Folds away like any chat app's, from the button at the far left of the
    // header. Under 900px the rail is already an overlay with its own toggle,
    // so the button hides there (CSS) and the class goes unused.

    function setRailCollapsed(collapsed, persist) {
      els.root.classList.toggle('rail-collapsed', collapsed);
      if (els.railToggle) els.railToggle.setAttribute('aria-expanded', String(!collapsed));
      if (!persist) return;
      try {
        localStorage.setItem(RAIL_COLLAPSED_KEY, collapsed ? '1' : '');
      } catch (_) { /* forgotten, like the side panel's choice */ }
    }

    if (els.railToggle) {
      els.railToggle.addEventListener('click', () => {
        setRailCollapsed(!els.root.classList.contains('rail-collapsed'), true);
      });
    }
    try {
      if (localStorage.getItem(RAIL_COLLAPSED_KEY) === '1') setRailCollapsed(true);
    } catch (_) { /* same as above */ }

    function openAiSettings() {
      setSideHidden(false);
      if (els.settingsCard) els.settingsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (els.apiKeyInput) els.apiKeyInput.focus({ preventScroll: true });
    }

    // --- mock preview ---------------------------------------------------------
    // A miniature fake page the current design is painted onto. It exists
    // because this page cannot show the real tab (it may not even be visible),
    // and two gradient chips undersell what a theme actually does to a page.

    let previewScheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    let previewMessage = null;

    const mock = buildMock();
    if (els.previewFrame) els.previewFrame.appendChild(mock.root);

    function buildMock() {
      const root = doc.createElement('div');
      root.className = 'ai-mock';
      const backdrop = doc.createElement('div');
      backdrop.className = 'ai-mock-backdrop';
      const page = doc.createElement('div');
      page.className = 'ai-mock-page';

      const nav = doc.createElement('div');
      nav.className = 'ai-mock-nav ai-mock-panel';
      nav.appendChild(chip('ai-mock-dot'));
      nav.appendChild(chip('ai-mock-line ai-mock-line-nav'));
      const hero = doc.createElement('div');
      hero.className = 'ai-mock-hero ai-mock-panel';
      hero.appendChild(chip('ai-mock-line ai-mock-line-title'));
      hero.appendChild(chip('ai-mock-line'));
      hero.appendChild(chip('ai-mock-line ai-mock-line-short'));
      const cards = doc.createElement('div');
      cards.className = 'ai-mock-cards';
      const cardA = doc.createElement('div');
      cardA.className = 'ai-mock-card ai-mock-panel';
      cardA.appendChild(chip('ai-mock-line'));
      cardA.appendChild(chip('ai-mock-line ai-mock-line-short'));
      const cardB = doc.createElement('div');
      cardB.className = 'ai-mock-card ai-mock-panel';
      cardB.appendChild(chip('ai-mock-line'));
      cardB.appendChild(chip('ai-mock-line ai-mock-line-short'));
      cards.appendChild(cardA);
      cards.appendChild(cardB);

      page.appendChild(nav);
      page.appendChild(hero);
      page.appendChild(cards);
      root.appendChild(backdrop);
      root.appendChild(page);
      return { root, backdrop, panels: [nav, hero, cardA, cardB] };

      function chip(className) {
        const node = doc.createElement('span');
        node.className = className;
        return node;
      }
    }

    // The same defensive stance as the chat's own swatches: a settings object
    // read back from storage is untrusted, and these strings land in style
    // properties, so every color and every data URL is re-checked here.
    function gradientCss(gradient) {
      if (!gradient || !Array.isArray(gradient.stops) || gradient.stops.length < 2) return '';
      const stops = [];
      for (const stop of gradient.stops) {
        const position = Number(stop && stop.position);
        if (!stop || !HEX_RE.test(String(stop.color)) || !Number.isFinite(position) || position < 0 || position > 100) return '';
        stops.push(`${String(stop.color)} ${Math.round(position)}%`);
      }
      if (gradient.kind === 'radial') {
        const shape = gradient.shape === 'circle' ? 'circle' : 'ellipse';
        return `radial-gradient(${shape} at center, ${stops.join(', ')})`;
      }
      const angle = Number(gradient.angle);
      return `linear-gradient(${Number.isFinite(angle) ? Math.round(angle) : 135}deg, ${stops.join(', ')})`;
    }

    function clamp(value, min, max, fallback) {
      const number = Number(value);
      if (!Number.isFinite(number)) return fallback;
      return Math.min(max, Math.max(min, number));
    }

    // Which layer of the settings the mock paints for the chosen scheme, plus
    // the line of context under it ("period 2 of 4" and the like).
    function activeLayer(settings) {
      if (!settings || (settings.mode === 'single' && settings.type === 'none')) {
        return { layer: null, note: settings ? t('aiPreviewOff') : '' };
      }
      if (settings.mode === 'timeRange' && settings.timeRange && Array.isArray(settings.timeRange.items) && settings.timeRange.items.length) {
        const items = settings.timeRange.items;
        const hour = new Date().getHours();
        const current = items.find((period) => {
          const start = clamp(period.start, 0, 23, 0);
          const end = clamp(period.end, 0, 23, 0);
          return start <= end ? (hour >= start && hour < end) : (hour >= start || hour < end);
        }) || items[0];
        return { layer: current, note: str('aiPreviewTimeRange', { count: items.length, name: current.name || '' }) };
      }
      if (settings.mode === 'slideshow' && settings.slideshow && Array.isArray(settings.slideshow.items) && settings.slideshow.items.length) {
        return { layer: settings.slideshow.items[0], note: str('aiPreviewSlideshow', { count: settings.slideshow.items.length }) };
      }
      const layer = previewScheme === 'dark' ? (settings.dark || settings) : (settings.light || settings);
      return { layer, note: '' };
    }

    function paintBackdrop(layer) {
      const backdrop = mock.backdrop;
      backdrop.style.background = '';
      backdrop.style.backgroundImage = '';
      backdrop.style.backgroundSize = '';
      backdrop.style.backgroundRepeat = '';
      backdrop.style.backgroundPosition = '';
      backdrop.style.filter = '';
      backdrop.style.opacity = '';
      backdrop.classList.remove('animated');
      if (!layer) return;

      backdrop.style.opacity = String(clamp(layer.opacity, 0, 100, 100) / 100);
      const filters = [];
      // The preview is roughly a quarter of a page, so lengths shrink with it:
      // a full-page 40px blur painted verbatim would fog the whole miniature.
      const blur = clamp(layer.blur, 0, 100, 0);
      if (blur) filters.push(`blur(${Math.round(blur * 0.25 * 10) / 10}px)`);

      if (layer.type === 'image' && typeof layer.value === 'string' && IMAGE_DATA_URL_RE.test(layer.value.trim())) {
        backdrop.style.backgroundImage = `url("${layer.value.trim()}")`;
        const style = layer.style || {};
        backdrop.style.backgroundSize = style.repeat ? '40%' : (style.size === 'contain' ? 'contain' : (style.size === 'stretch' ? '100% 100%' : 'cover'));
        backdrop.style.backgroundRepeat = style.repeat ? 'repeat' : 'no-repeat';
        backdrop.style.backgroundPosition = 'center';
        const imageFilters = layer.filters || {};
        const brightness = clamp(imageFilters.brightness, 20, 180, 100);
        const contrast = clamp(imageFilters.contrast, 20, 180, 100);
        const grayscale = clamp(imageFilters.grayscale, 0, 100, 0);
        const hue = clamp(imageFilters.hue, 0, 360, 0);
        const invert = clamp(imageFilters.invert, 0, 100, 0);
        if (brightness !== 100) filters.push(`brightness(${brightness}%)`);
        if (contrast !== 100) filters.push(`contrast(${contrast}%)`);
        if (grayscale) filters.push(`grayscale(${grayscale}%)`);
        if (hue) filters.push(`hue-rotate(${hue}deg)`);
        if (invert) filters.push(`invert(${invert}%)`);
      } else if (layer.colorMode === 'gradient' || (layer.gradient && !layer.colorMode)) {
        const css = gradientCss(layer.gradient);
        if (css) backdrop.style.backgroundImage = css;
        if (layer.gradient && layer.gradient.animated) backdrop.classList.add('animated');
      } else if (typeof layer.value === 'string' && HEX_RE.test(layer.value.trim())) {
        backdrop.style.background = layer.value.trim();
      }
      if (filters.length) backdrop.style.filter = filters.join(' ');
    }

    function hexToRgba(hex, alpha) {
      const value = hex.slice(1);
      const r = parseInt(value.slice(0, 2), 16);
      const g = parseInt(value.slice(2, 4), 16);
      const b = parseInt(value.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    function paintPanels(settings) {
      const frosted = settings && Array.isArray(settings.frostedGlass) ? settings.frostedGlass : [];
      const entry = frosted.length ? frosted[0] : null;
      mock.panels.forEach((panel) => {
        panel.classList.toggle('frosted', !!entry);
        panel.style.background = '';
        panel.style.backdropFilter = '';
        if (!entry) return;
        const opacity = clamp(entry.opacity, 0, 100, 55) / 100;
        const blur = clamp(entry.blur, 0, 100, 12);
        const tint = typeof entry.color === 'string' && HEX_RE.test(entry.color) ? entry.color : '';
        panel.style.background = tint
          ? hexToRgba(tint, opacity)
          : (previewScheme === 'dark' ? `rgba(13, 17, 23, ${opacity})` : `rgba(255, 255, 255, ${opacity})`);
        panel.style.backdropFilter = `blur(${Math.round(blur * 0.35 * 10) / 10}px)`;
      });
    }

    // --- what the design actually sets -------------------------------------
    // The picture above says what it looks like; this says what it is. Read
    // off the same layer the mock paints, so the two can never disagree, and
    // only fields the theme actually uses get a row — "no effect" on every
    // theme is noise, not information.

    function row(list, label, value, swatches) {
      if (value == null || value === '') return;
      const dt = doc.createElement('dt');
      dt.textContent = label;
      list.appendChild(dt);
      const dd = doc.createElement('dd');
      if (Array.isArray(swatches) && swatches.length) {
        const strip = doc.createElement('span');
        strip.className = 'ai-preview-swatches';
        swatches.forEach((color) => {
          const chip = doc.createElement('span');
          chip.className = 'ai-preview-swatch';
          // Re-checked rather than trusted: it goes into a style property, and
          // the theme travelled through storage to get here.
          if (HEX_RE.test(color)) chip.style.background = color;
          strip.appendChild(chip);
        });
        dd.appendChild(strip);
      }
      dd.appendChild(doc.createTextNode(String(value)));
      list.appendChild(dd);
    }

    function percent(value, fallback) {
      return clamp(value, 0, 100, fallback) + '%';
    }

    // Only the filters actually doing something: five rows of "unchanged"
    // would bury the one that is not.
    function filterSummary(filters) {
      const source = filters && typeof filters === 'object' ? filters : {};
      const parts = [];
      const brightness = clamp(source.brightness, 20, 180, 100);
      const contrast = clamp(source.contrast, 20, 180, 100);
      const grayscale = clamp(source.grayscale, 0, 100, 0);
      const hue = clamp(source.hue, 0, 360, 0);
      const invert = clamp(source.invert, 0, 100, 0);
      if (brightness !== 100) parts.push(t('aiCfgBrightness') + ' ' + brightness + '%');
      if (contrast !== 100) parts.push(t('aiCfgContrast') + ' ' + contrast + '%');
      if (grayscale) parts.push(t('aiCfgGrayscale') + ' ' + grayscale + '%');
      if (hue) parts.push(t('aiCfgHue') + ' ' + hue + '\u00b0');
      if (invert) parts.push(t('aiCfgInvert') + ' ' + invert + '%');
      return parts.join(' \u00b7 ');
    }

    const FITS = { cover: 'aiCfgFitCover', contain: 'aiCfgFitContain', stretch: 'aiCfgFitStretch', auto: 'aiCfgFitTile' };

    function describeLayer(list, layer) {
      if (!layer) return;
      if (layer.type === 'image') {
        row(list, t('aiCfgKind'), t('aiCfgKindImage'));
        const style = layer.style || {};
        const fit = style.repeat ? 'auto' : (style.size || 'cover');
        row(list, t('aiCfgFit'), t(FITS[fit] || FITS.cover) + (style.fixed === false ? '' : ' \u00b7 ' + t('aiCfgFixed')));
        row(list, t('aiCfgFilters'), filterSummary(layer.filters));
      } else if (layer.colorMode === 'gradient' && layer.gradient) {
        const gradient = layer.gradient;
        const stops = (Array.isArray(gradient.stops) ? gradient.stops : [])
          .filter((stop) => stop && HEX_RE.test(String(stop.color)));
        row(list, t('aiCfgKind'), gradient.kind === 'radial'
          ? t('aiCfgGradientRadial') + ' \u00b7 ' + (gradient.shape === 'circle' ? t('aiCfgShapeCircle') : t('aiCfgShapeEllipse'))
          : t('aiCfgGradientLinear') + ' \u00b7 ' + clamp(gradient.angle, 0, 360, 135) + '\u00b0');
        row(list, t('aiCfgColors'),
          stops.map((stop) => String(stop.color).toLowerCase()).join(' \u2192 '),
          stops.map((stop) => String(stop.color)));
        if (gradient.animated) {
          row(list, t('aiCfgAnimated'), str('aiCfgAnimatedValue', { seconds: clamp(gradient.speed, 4, 60, 12) }));
        }
      } else if (layer.type === 'color') {
        const color = typeof layer.value === 'string' && HEX_RE.test(layer.value) ? layer.value.toLowerCase() : '';
        row(list, t('aiCfgKind'), t('aiCfgKindSolid'));
        row(list, t('aiCfgColors'), color, color ? [color] : null);
      }
      row(list, t('aiCfgOpacity'), percent(layer.opacity, 100));
      const blur = clamp(layer.blur, 0, 100, 0);
      if (blur) row(list, t('aiCfgBlur'), String(blur));
      if (layer.effectEnabled && layer.effect) {
        row(list, t('aiCfgEffect'), layer.effect
          + ' \u00b7 ' + t('aiCfgDensity') + ' ' + clamp(layer.effectDensity, 0, 100, 50)
          + ' \u00b7 ' + t('aiCfgSpeed') + ' ' + clamp(layer.effectSpeed, 0, 100, 50));
      }
    }

    const RUN_MODES = { normal: 'aiCfgRunNormal', enhanced: 'aiCfgRunEnhanced', strong: 'aiCfgRunStrong' };

    function renderConfig(settings, layer) {
      const list = els.previewConfig;
      if (!list) return;
      list.textContent = '';
      if (!settings) return;

      if (settings.mode === 'single' && settings.type === 'none') {
        row(list, t('aiCfgKind'), t('aiPreviewOff'));
        return;
      }

      describeLayer(list, layer);

      const frosted = (Array.isArray(settings.frostedGlass) ? settings.frostedGlass : []).slice(0, 6);
      frosted.forEach((entry, index) => {
        if (!entry || typeof entry !== 'object') return;
        const tint = typeof entry.color === 'string' && HEX_RE.test(entry.color) ? entry.color.toLowerCase() : '';
        row(list,
          frosted.length > 1 ? t('aiCfgFrosted') + ' ' + (index + 1) : t('aiCfgFrosted'),
          entry.selector + ' \u00b7 ' + percent(entry.opacity, 55)
            + ' \u00b7 ' + t('aiCfgBlur') + ' ' + clamp(entry.blur, 0, 100, 12)
            + (tint ? ' \u00b7 ' + tint : ''),
          tint ? [tint] : null);
      });

      // Normal is the everyday answer and says nothing; the two that cost
      // performance are worth stating.
      const runMode = settings.deepCompatAggressive ? 'strong' : (settings.deepCompat ? 'enhanced' : 'normal');
      if (runMode !== 'normal') {
        row(list, t('aiCfgRunMode'), t(RUN_MODES[runMode]));
        row(list, t('aiCfgRunExclude'), settings.deepCompatExclude || '');
      }
      row(list, t('aiCfgTarget'), settings.targetSelector || '');
    }

    function renderPreview() {
      if (!els.previewFrame) return;
      mock.root.dataset.scheme = previewScheme;
      if (els.previewLight) els.previewLight.classList.toggle('active', previewScheme === 'light');
      if (els.previewDark) els.previewDark.classList.toggle('active', previewScheme === 'dark');

      const settings = previewMessage && previewMessage.settings;
      const theme = previewMessage && previewMessage.theme;
      const { layer, note } = activeLayer(settings);
      paintBackdrop(layer);
      paintPanels(settings && !(settings.mode === 'single' && settings.type === 'none') ? settings : null);

      const parts = [];
      if (!settings) {
        parts.push(t('aiPreviewEmpty'));
      } else {
        if (theme && theme.themeName) parts.push(theme.themeName);
        if (note) parts.push(note);
        const frosted = Array.isArray(settings.frostedGlass) ? settings.frostedGlass.length : 0;
        if (frosted) parts.push(str('aiPreviewFrosted', { count: frosted }));
        if (layer && layer.effectEnabled && layer.effect) parts.push(str('aiPreviewEffect', { name: layer.effect }));
      }
      if (els.previewMeta) els.previewMeta.textContent = parts.join(' · ');
      renderConfig(settings, layer);
    }

    if (els.previewLight) {
      els.previewLight.addEventListener('click', () => {
        previewScheme = 'light';
        renderPreview();
      });
    }
    if (els.previewDark) {
      els.previewDark.addEventListener('click', () => {
        previewScheme = 'dark';
        renderPreview();
      });
    }

    // --- rail navigation ------------------------------------------------------
    // The dashboard's own destinations, shown behind the rail's second tab.
    // navigateToSection plays the collapse animation before it switches.

    if (els.navPanel) {
      els.navPanel.addEventListener('click', (event) => {
        const item = event.target.closest('[data-ai-nav]');
        if (item) deps.navigateToSection(item.dataset.aiNav);
      });
    }

    // --- mount ----------------------------------------------------------------

    els.mainHeader.remove();
    els.navPanel.remove();
    if (els.mountParts) els.mountParts.remove();

    window.PageDyeAiChat.mount({
      root: els.root,
      variant: 'options',
      lang: deps.lang,
      mainHeader: els.mainHeader,
      navPanel: els.navPanel,
      navLabel: t('aiRailNav'),
      resolveTarget: async () => {
        // Refresh only when nothing usable is held: re-querying on every turn
        // would silently retarget a conversation when the user changes tabs.
        if (!target) await refreshTarget();
        return target ? { tabId: target.tabId, hostname: target.hostname } : null;
      },
      onApply: async (settings, conversation) => {
        const hostname = (conversation && conversation.hostname) || '';
        if (!hostname) throw new Error(t('aiChatNoTabs'));
        // Re-validated here rather than trusted: the theme travelled through
        // storage since it was generated, and this write lands on the key the
        // content script reads on every page load.
        const normalized = window.PageDyeStorage.normalizeSiteSettings(settings);
        if (!normalized) throw new Error(t('error'));
        await chrome.storage.local.set({ [hostname]: normalized });
        if (deps.onSiteSaved) await deps.onSiteSaved();
      },
      // PageDye's own preferences, applied only when the card's button is
      // pressed. The shared applier re-validates and merges rather than
      // replacing, so a proposal about the accent leaves the shortcut alone.
      onApplyPreferences: async (preferences) => {
        await window.PageDyeAiPreferences.apply(chrome.storage.local, preferences);
      },
      // Keeps the design in the library rather than only on this site, filed
      // under the model's own name for it. The Library page reloads itself
      // from the storage change, so nothing has to be refreshed from here.
      onSaveTheme: async (settings, theme) => window.PageDyeConfigPresets.saveToLibrary(
        chrome.storage.local, settings, theme && theme.themeName
      ),
      onThemeUpdate: (message) => {
        previewMessage = message;
        renderPreview();
      },
      openAiSettings,
      // The first-run wizard, in this same tab: it is a fullscreen ceremony,
      // and it ends by navigating back to this page's AI section itself.
      openOnboarding: () => {
        location.href = chrome.runtime.getURL('options/welcome.html');
      }
    });

    // --- boot -----------------------------------------------------------------

    function paintAll() {
      paintModelChip();
      renderModelList();
      renderPreview();
      // Measured after mount() has adopted the header into the chat column,
      // which is the only point at which it has a height.
      syncDrawerTop();
    }

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local' || !Object.prototype.hasOwnProperty.call(changes, AI_CONFIG_KEY)) return;
      readConfig().then(paintAll).catch(() => {});
    });

    readConfig().then(paintAll).catch(() => {});
    refreshTarget();

    return { openAiSettings };
  }

  window.PageDyeAiWorkspace = { init };
})();
