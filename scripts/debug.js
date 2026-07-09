// PageDye Debug Mode — a floating on-page panel for developers/power users,
// gated behind a global (not per-domain) toggle in the options page. Fully
// independent from scripts/content.js: it reads the same storage keys but
// keeps its own state, so it can be dropped without touching the renderer.
(() => {
  const DEBUG_MODE_KEY = '__pagedye_debug_mode__';
  const CUSTOM_EFFECTS_KEY = '__pagedye_custom_effects__';
  const POSITION_KEY = '__pagedye_debug_position__';
  const HOST_ID = 'pagedye-debug-host';
  const FPS_SAMPLE_SIZE = 90;
  const PERF_HISTORY_SIZE = 60; // 60 samples * 0.5s tick = 30s of history shown in the perf charts
  const LOG_LIMIT = 200;
  const NETWORK_LIMIT = 200;
  const NETWORK_ENTRY_EVENT = 'pagedye-debug-network-entry';
  const NETWORK_TOGGLE_EVENT = 'pagedye-debug-network-toggle';

  const domain = window.location.hostname;

  let enabled = false;
  let host = null, shadow = null;
  let ui = { open: false, tab: 'state', perfCollapsed: false };
  let position = { side: 'right', topPercent: 88 };
  let dragState = null;
  let suppressClick = false;
  let networkCaptureActive = false;

  // Console mirror
  let logs = [];
  let consolePatched = false;
  const originalConsole = {};

  // FPS / perf history (for the perf tab's sparkline charts)
  let rafId = null;
  let perfTimer = null;
  let frameTimes = [];
  let lastFrameAt = null;
  let fpsHistory = [], frameMsHistory = [], memHistory = [], longTaskPctHistory = [];
  let longTaskObserver = null;
  let longTaskBusyMs = 0;

  // Inspector
  let picking = false;
  let lockedEl = null;
  let lastSelector = '';
  let hoverBox = null, hoverLabel = null, hoverTip = null;

  // Network capture (fed by scripts/debug-network.js running in the page's
  // MAIN world — see that file for why a separate script is needed)
  let networkEntries = [];
  let networkIdSeq = 0;
  let expandedNetworkId = null;

  // A re-injection (e.g. after the extension is reloaded and a tab's content
  // scripts get re-run) would otherwise leave the previous instance's rAF
  // loop, console patch and listeners running alongside a brand new one.
  if (window.__pagedyeDebugTeardown) {
    window.__pagedyeDebugTeardown();
  }
  window.__pagedyeDebugTeardown = teardown;

  init();

  function init() {
    if (typeof chrome === 'undefined' || !chrome.runtime?.id) return;
    try {
      chrome.storage.onChanged.addListener(onStorageChanged);
      chrome.storage.local.get([DEBUG_MODE_KEY, POSITION_KEY], (data) => {
        if (typeof chrome === 'undefined' || !chrome.runtime?.id) {
          teardown();
          return;
        }
        if (data[POSITION_KEY]) {
          position = data[POSITION_KEY];
        }
        if (data[DEBUG_MODE_KEY]) enable();
      });
    } catch (e) {
      teardown();
    }
  }

  function teardown() {
    if (typeof chrome !== 'undefined' && chrome.runtime?.id && chrome.storage) {
      try {
        chrome.storage.onChanged.removeListener(onStorageChanged);
      } catch (e) {
        // ignore
      }
    }
    disable();
  }

  function onStorageChanged(changes, area) {
    if (typeof chrome === 'undefined' || !chrome.runtime?.id) {
      teardown();
      return;
    }
    if (area !== 'local') return;

    if (Object.prototype.hasOwnProperty.call(changes, DEBUG_MODE_KEY)) {
      if (changes[DEBUG_MODE_KEY].newValue) enable();
      else disable();
    }

    if (Object.prototype.hasOwnProperty.call(changes, POSITION_KEY)) {
      position = changes[POSITION_KEY].newValue || { side: 'right', topPercent: 88 };
      if (enabled) applyPosition();
    }

    if (!enabled || !ui.open) return;
    if (ui.tab === 'state' && (Object.prototype.hasOwnProperty.call(changes, domain) ||
        Object.prototype.hasOwnProperty.call(changes, CUSTOM_EFFECTS_KEY))) {
      renderTabBody();
    }
  }

  function enable() {
    if (enabled) return;
    enabled = true;
    startFpsLoop();
    startNetworkCapture();
    buildUI();
    window.addEventListener('resize', onWindowResize);
  }

  function disable() {
    if (!enabled) return;
    enabled = false;
    stopPicking();
    stopFpsLoop();
    stopNetworkCapture();
    unpatchConsole();
    destroyUI();
    window.removeEventListener('resize', onWindowResize);
  }

  function onWindowResize() {
    if (enabled) applyPosition();
  }

  // ------------------------------------------------------------------
  // Console mirror
  // ------------------------------------------------------------------
  function patchConsole() {
    if (consolePatched) return;
    consolePatched = true;
    ['log', 'info', 'warn', 'error', 'debug'].forEach((level) => {
      originalConsole[level] = console[level];
      console[level] = function (...args) {
        pushLog(level, args);
        originalConsole[level].apply(console, args);
      };
    });
    window.addEventListener('error', onWindowError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);
  }

  function unpatchConsole() {
    if (!consolePatched) return;
    consolePatched = false;
    ['log', 'info', 'warn', 'error', 'debug'].forEach((level) => {
      if (originalConsole[level]) console[level] = originalConsole[level];
    });
    window.removeEventListener('error', onWindowError);
    window.removeEventListener('unhandledrejection', onUnhandledRejection);
    logs = [];
  }

  function onWindowError(e) {
    pushLog('error', [`${e.message} (${e.filename}:${e.lineno}:${e.colno})`]);
  }

  function onUnhandledRejection(e) {
    pushLog('error', ['Unhandled promise rejection:', e.reason]);
  }

  function stringifyLogArg(a) {
    if (typeof a === 'string') return a;
    if (a instanceof Error) return a.stack || a.message;
    try { return JSON.stringify(a); } catch (e) { return String(a); }
  }

  function pushLog(level, args) {
    logs.push({ level, text: args.map(stringifyLogArg).join(' '), time: Date.now() });
    if (logs.length > LOG_LIMIT) logs.shift();
    if (ui.open && ui.tab === 'logs') renderTabBody();
  }

  // ------------------------------------------------------------------
  // FPS / performance monitor
  // ------------------------------------------------------------------
  function startFpsLoop() {
    if (rafId) return;
    lastFrameAt = null;
    frameTimes = [];
    fpsHistory = []; frameMsHistory = []; memHistory = []; longTaskPctHistory = [];
    const tick = (now) => {
      if (lastFrameAt !== null) {
        frameTimes.push(now - lastFrameAt);
        if (frameTimes.length > FPS_SAMPLE_SIZE) frameTimes.shift();
      }
      lastFrameAt = now;
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    startLongTaskObserver();

    // Sampling runs continuously (not just while the perf tab is visible) so
    // switching to it shows an already-populated history instead of an empty
    // chart every time.
    perfTimer = setInterval(() => {
      if (typeof chrome === 'undefined' || !chrome.runtime?.id) {
        teardown();
        return;
      }
      sampleTick();
      if (ui.open && ui.tab === 'perf') renderTabBody();
    }, 500);
  }

  function stopFpsLoop() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    if (perfTimer) { clearInterval(perfTimer); perfTimer = null; }
    stopLongTaskObserver();
    frameTimes = [];
    fpsHistory = []; frameMsHistory = []; memHistory = []; longTaskPctHistory = [];
  }

  function currentFps() {
    if (!frameTimes.length) return null;
    const avgMs = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
    return { fps: avgMs > 0 ? 1000 / avgMs : 0, frameMs: avgMs };
  }

  function pushHistory(arr, value) {
    arr.push(value);
    if (arr.length > PERF_HISTORY_SIZE) arr.shift();
  }

  function sampleTick() {
    const stats = currentFps();
    pushHistory(fpsHistory, stats ? stats.fps : 0);
    pushHistory(frameMsHistory, stats ? stats.frameMs : 0);
    if (performance.memory) pushHistory(memHistory, performance.memory.usedJSHeapSize / (1024 * 1024));
    if (longTaskObserver) {
      pushHistory(longTaskPctHistory, Math.min(100, (longTaskBusyMs / 500) * 100));
      longTaskBusyMs = 0;
    }
  }

  // Long Tasks API: the standard, permission-free stand-in for "CPU usage" —
  // real per-tab CPU% isn't exposed to extensions at all (chrome.system.cpu
  // is system-wide, needs a new permission, and needs a background service
  // worker this extension doesn't have). Chromium-only; feature-detected.
  function startLongTaskObserver() {
    if (longTaskObserver || typeof PerformanceObserver === 'undefined') return;
    if (!PerformanceObserver.supportedEntryTypes || !PerformanceObserver.supportedEntryTypes.includes('longtask')) return;
    try {
      longTaskObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => { longTaskBusyMs += entry.duration; });
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch (e) { longTaskObserver = null; }
  }

  function stopLongTaskObserver() {
    if (longTaskObserver) { longTaskObserver.disconnect(); longTaskObserver = null; }
    longTaskBusyMs = 0;
  }

  // ------------------------------------------------------------------
  // Network capture — scripts/debug-network.js patches fetch/XHR in the
  // page's MAIN world (a content script's own fetch/XHR are separate
  // bindings and never see the page's calls) and reports each finished
  // request here via a CustomEvent on the shared document.
  // ------------------------------------------------------------------
  function startNetworkCapture() {
    updateNetworkCaptureState();
  }

  function stopNetworkCapture() {
    document.removeEventListener(NETWORK_ENTRY_EVENT, onNetworkEntry);
    document.dispatchEvent(new CustomEvent(NETWORK_TOGGLE_EVENT, { detail: { enabled: false } }));
    networkEntries = [];
    expandedNetworkId = null;
  }

  function updateNetworkCaptureState() {
    if (networkCaptureActive) {
      document.addEventListener(NETWORK_ENTRY_EVENT, onNetworkEntry);
      document.dispatchEvent(new CustomEvent(NETWORK_TOGGLE_EVENT, { detail: { enabled: true } }));
    } else {
      document.removeEventListener(NETWORK_ENTRY_EVENT, onNetworkEntry);
      document.dispatchEvent(new CustomEvent(NETWORK_TOGGLE_EVENT, { detail: { enabled: false } }));
    }
  }

  function onNetworkEntry(e) {
    const entry = Object.assign({ id: ++networkIdSeq }, e.detail);
    networkEntries.push(entry);
    if (networkEntries.length > NETWORK_LIMIT) networkEntries.shift();
    if (ui.open && ui.tab === 'network') renderTabBody();
  }

  // ------------------------------------------------------------------
  // Element inspector — same highlight-box/label/tip pattern as the
  // background-selector picker in popup.js, but purely for inspection (no
  // writes to storage) and lives inside our own shadow root permanently
  // instead of being a one-off injected function.
  // ------------------------------------------------------------------
  function cssEscape(s) {
    if (window.CSS && CSS.escape) return CSS.escape(s);
    return String(s).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
  }

  function guessSelector(el) {
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

  function ensureInspectorOverlay() {
    if (hoverBox) return;
    hoverBox = document.createElement('div');
    hoverBox.className = 'pd-dbg-hover-box';
    hoverLabel = document.createElement('div');
    hoverLabel.className = 'pd-dbg-hover-label';
    hoverTip = document.createElement('div');
    hoverTip.className = 'pd-dbg-hover-tip';
    hoverTip.textContent = '悬停查看元素 · 点击锁定 · Esc 取消';
    shadow.appendChild(hoverBox);
    shadow.appendChild(hoverLabel);
    shadow.appendChild(hoverTip);
  }

  function startPicking() {
    // Don't fight the popup's own background/frosted-glass element picker if
    // it happens to be active at the same time.
    if (window.__pagedyePicking || picking) return;
    picking = true;
    ensureInspectorOverlay();
    hoverBox.style.display = 'block';
    hoverLabel.style.display = 'block';
    hoverTip.style.display = 'block';
    document.addEventListener('mousemove', onPickMove, true);
    document.addEventListener('click', onPickClick, true);
    document.addEventListener('keydown', onPickKey, true);
    renderTabBody();
  }

  function stopPicking() {
    if (!picking) return;
    picking = false;
    document.removeEventListener('mousemove', onPickMove, true);
    document.removeEventListener('click', onPickClick, true);
    document.removeEventListener('keydown', onPickKey, true);
    if (hoverBox) { hoverBox.style.display = 'none'; hoverLabel.style.display = 'none'; hoverTip.style.display = 'none'; }
    if (ui.open && ui.tab === 'inspector') renderTabBody();
  }

  function onPickMove(e) {
    if (e.target === host) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || el === host) return;
    const r = el.getBoundingClientRect();
    Object.assign(hoverBox.style, {
      left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px'
    });
    hoverLabel.textContent = guessSelector(el) || el.tagName.toLowerCase();
    hoverLabel.style.left = Math.min(e.clientX + 14, window.innerWidth - 240) + 'px';
    hoverLabel.style.top = (e.clientY + 18) + 'px';
  }

  function onPickClick(e) {
    if (e.target === host) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (el && el !== host) lockedEl = el;
    stopPicking();
  }

  function onPickKey(e) {
    if (e.key === 'Escape') stopPicking();
  }

  // ------------------------------------------------------------------
  // Dragging and positioning of FAB and Panel
  // ------------------------------------------------------------------
  function applyPosition() {
    if (!shadow) return;
    const fab = shadow.querySelector('.pd-dbg-fab');
    if (!fab) return;
    const size = 44;
    const rawTop = (position.topPercent / 100) * window.innerHeight - size / 2;
    const top = Math.max(6, Math.min(window.innerHeight - size - 6, rawTop));
    fab.style.top = top + 'px';
    fab.style.bottom = 'auto';

    const margin = 18;
    if (position.side === 'left') {
      fab.style.left = margin + 'px';
      fab.style.right = 'auto';
    } else {
      fab.style.right = margin + 'px';
      fab.style.left = 'auto';
    }

    if (ui.open) {
      positionPanel();
    }
  }

  function positionPanel() {
    const fab = shadow.querySelector('.pd-dbg-fab');
    const panel = shadow.getElementById('pd-dbg-panel');
    if (!fab || !panel) return;

    const rect = fab.getBoundingClientRect();
    const margin = 10;
    
    if (position.side === 'left') {
      panel.style.left = rect.left + 'px';
      panel.style.right = 'auto';
    } else {
      panel.style.right = (window.innerWidth - rect.right) + 'px';
      panel.style.left = 'auto';
    }

    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    const cap = window.innerHeight * 0.62;

    let originY = 'bottom';
    if (spaceAbove >= spaceBelow) {
      panel.style.bottom = (window.innerHeight - rect.top + 8) + 'px';
      panel.style.top = 'auto';
      panel.style.maxHeight = Math.max(200, Math.min(spaceAbove - margin * 2, cap)) + 'px';
      originY = 'bottom';
    } else {
      panel.style.top = (rect.bottom + 8) + 'px';
      panel.style.bottom = 'auto';
      panel.style.maxHeight = Math.max(200, Math.min(spaceBelow - margin * 2, cap)) + 'px';
      originY = 'top';
    }

    const originX = position.side;
    panel.style.transformOrigin = `${originY} ${originX}`;
  }

  function onFabPointerDown(e) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const fab = shadow.querySelector('.pd-dbg-fab');
    if (!fab) return;
    const rect = fab.getBoundingClientRect();
    dragState = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originLeft: rect.left,
      originTop: rect.top,
      moved: false
    };
    if (fab.setPointerCapture) {
      try { fab.setPointerCapture(e.pointerId); } catch (err) {}
    }
    fab.addEventListener('pointermove', onFabPointerMove);
    fab.addEventListener('pointerup', onFabPointerUp);
    fab.addEventListener('pointercancel', onFabPointerUp);
  }

  function onFabPointerMove(e) {
    if (!dragState || dragState.pointerId !== e.pointerId) return;
    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;
    if (!dragState.moved && Math.hypot(dx, dy) < 6) return;
    dragState.moved = true;

    const fab = shadow.querySelector('.pd-dbg-fab');
    if (!fab) return;
    fab.classList.add('pd-dbg-dragging');

    const size = 44;
    const left = Math.max(4, Math.min(window.innerWidth - size - 4, dragState.originLeft + dx));
    const top = Math.max(4, Math.min(window.innerHeight - size - 4, dragState.originTop + dy));

    fab.style.left = left + 'px';
    fab.style.right = 'auto';
    fab.style.top = top + 'px';
    fab.style.bottom = 'auto';

    if (ui.open) {
      positionPanel();
    }
  }

  function onFabPointerUp(e) {
    if (!dragState || dragState.pointerId !== e.pointerId) return;
    const wasDrag = dragState.moved;
    
    const fab = shadow.querySelector('.pd-dbg-fab');
    if (fab) {
      fab.classList.remove('pd-dbg-dragging');
      fab.removeEventListener('pointermove', onFabPointerMove);
      fab.removeEventListener('pointerup', onFabPointerUp);
      fab.removeEventListener('pointercancel', onFabPointerUp);
      if (fab.releasePointerCapture) {
        try { fab.releasePointerCapture(e.pointerId); } catch (err) {}
      }
    }

    if (wasDrag) {
      suppressClick = true;
      const rect = fab.getBoundingClientRect();
      const size = 44;
      position.side = (rect.left + size / 2) < window.innerWidth / 2 ? 'left' : 'right';
      position.topPercent = Math.max(0, Math.min(100, ((rect.top + size / 2) / window.innerHeight) * 100));
      
      try {
        chrome.storage.local.set({ [POSITION_KEY]: position });
      } catch (err) {
        // ignore storage write errors (e.g. context invalidated)
      }
      applyPosition();
    }
    dragState = null;
  }

  // ------------------------------------------------------------------
  // Panel UI
  // ------------------------------------------------------------------
  function buildUI() {
    if (!enabled) return;
    if (document.getElementById(HOST_ID)) return;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        if (enabled) buildUI();
      }, { once: true });
      return;
    }

    host = document.createElement('div');
    host.id = HOST_ID;
    Object.assign(host.style, { position: 'fixed', zIndex: '2147483647', bottom: '0', right: '0', all: 'initial' });
    document.documentElement.appendChild(host);
    shadow = host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = PANEL_CSS;
    shadow.appendChild(style);

    const fab = document.createElement('button');
    fab.className = 'pd-dbg-fab';
    fab.type = 'button';
    fab.title = 'PageDye 调试面板';
    fab.innerHTML = svgIcon(ICON_CPU, 22);
    fab.addEventListener('click', () => {
      if (suppressClick) {
        suppressClick = false;
        return;
      }
      ui.open = !ui.open;
      render();
    });
    fab.addEventListener('pointerdown', onFabPointerDown);
    shadow.appendChild(fab);

    const panel = document.createElement('div');
    panel.className = 'pd-dbg-panel';
    panel.id = 'pd-dbg-panel';
    shadow.appendChild(panel);

    shadow.addEventListener('click', onShadowClick);

    render();
    applyPosition();
  }

  function destroyUI() {
    if (host) host.remove();
    host = null; shadow = null;
    hoverBox = null; hoverLabel = null; hoverTip = null;
    ui.open = false;
  }

  const TABS = [
    { id: 'state', label: '状态' },
    { id: 'perf', label: '性能' },
    { id: 'logs', label: '日志' },
    { id: 'network', label: '网络' },
    { id: 'inspector', label: '元素' }
  ];

  function render() {
    if (!shadow) return;
    const fab = shadow.querySelector('.pd-dbg-fab');
    if (fab) fab.classList.toggle('pd-dbg-fab-open', ui.open);

    const panel = shadow.getElementById('pd-dbg-panel');
    panel.classList.toggle('pd-dbg-panel-open', ui.open);
    if (!ui.open) return;

    panel.innerHTML = `
      <div class="pd-dbg-header">
        <span class="pd-dbg-title">PageDye 调试</span>
        <span class="pd-dbg-domain">${escapeHtml(domain)}</span>
        <button type="button" class="pd-dbg-icon-btn" data-action="close" title="关闭">${svgIcon(ICON_X, 15)}</button>
      </div>
      <div class="pd-dbg-seg">
        ${TABS.map((t) => `<button type="button" class="${ui.tab === t.id ? 'active' : ''}" data-tab="${t.id}">${t.label}</button>`).join('')}
      </div>
      <div class="pd-dbg-body" id="pd-dbg-body"></div>
    `;
    renderTabBody();
    positionPanel();
  }

  function renderTabBody() {
    const body = shadow.getElementById('pd-dbg-body');
    if (!body) return;
    if (ui.tab === 'state') renderStateTab(body);
    else if (ui.tab === 'perf') renderPerfTab(body);
    else if (ui.tab === 'logs') renderLogsTab(body);
    else if (ui.tab === 'network') renderNetworkTab(body);
    else if (ui.tab === 'inspector') renderInspectorTab(body);
  }

  function kvRow(label, value) {
    return `<div class="pd-dbg-kv-row"><span>${escapeHtml(label)}</span><span>${value}</span></div>`;
  }

  function renderStateTab(body) {
    if (typeof chrome === 'undefined' || !chrome.runtime?.id) {
      teardown();
      return;
    }
    try {
      chrome.storage.local.get([domain, CUSTOM_EFFECTS_KEY], (data) => {
        if (typeof chrome === 'undefined' || !chrome.runtime?.id) {
          teardown();
          return;
        }
        if (ui.tab !== 'state') return; // user may have switched tabs while this resolved
        const settings = data[domain] || null;
        const effects = data[CUSTOM_EFFECTS_KEY] || [];
        const frosted = settings ? normalizeFrostedGlassList(settings.frostedGlass) : [];

        let html = '<div class="pd-dbg-kv">';
        html += kvRow('域名', escapeHtml(domain));
        html += kvRow('是否已配置', settings ? '是' : '否');
        if (settings) {
          html += kvRow('模式', escapeHtml(settings.mode || 'single'));
          html += kvRow('类型', escapeHtml(settings.type || 'none'));
          html += kvRow('深度兼容模式', settings.deepCompat ? '开启' : '关闭');
          html += kvRow('强兼模式', settings.deepCompatAggressive ? '开启' : '关闭');
          html += kvRow('磨砂玻璃元素数', String(frosted.length));
        }
        html += kvRow('自定义动效数(全局)', String(effects.length));
        html += '</div>';
        html += '<button type="button" class="pd-dbg-btn-secondary" data-action="copy-state-json">复制完整 JSON</button>';
        html += `<pre class="pd-dbg-json">${escapeHtml(JSON.stringify(settings, null, 2))}</pre>`;
        body.innerHTML = html;
        body.dataset.stateJson = JSON.stringify(settings, null, 2);
      });
    } catch (e) {
      teardown();
    }
  }

  function normalizeFrostedGlassList(cfg) {
    if (Array.isArray(cfg)) return cfg;
    if (cfg && typeof cfg === 'object' && cfg.selector) return [cfg];
    return [];
  }

  function lastOf(arr) {
    return arr.length ? arr[arr.length - 1] : null;
  }

  function sparkline(data, color, maxOverride) {
    const w = 300, h = 44;
    if (!data.length) return `<svg class="pd-dbg-spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"></svg>`;
    const max = maxOverride != null ? maxOverride : Math.max(1, Math.max.apply(null, data));
    const stepX = data.length > 1 ? w / (data.length - 1) : w;
    const points = data.map((v, i) => {
      const x = i * stepX;
      const y = h - Math.max(0, Math.min(1, v / max)) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    return `<svg class="pd-dbg-spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
      <polyline points="${points}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
    </svg>`;
  }

  function renderPerfTab(body) {
    const fps = lastOf(fpsHistory);
    const frameMs = lastOf(frameMsHistory);
    const mem = lastOf(memHistory);
    const longTaskPct = lastOf(longTaskPctHistory);

    let html = `
      <div class="pd-dbg-log-toolbar">
        <button type="button" class="pd-dbg-btn-secondary" data-action="toggle-perf-collapse">${ui.perfCollapsed ? '展开图表' : '折叠图表'}</button>
      </div>
    `;

    html += '<div class="pd-dbg-perf-grid">';
    html += `<div class="pd-dbg-perf-card"><span class="pd-dbg-perf-value">${fps != null ? Math.round(fps) : '--'}</span><span class="pd-dbg-perf-label">FPS</span></div>`;
    html += `<div class="pd-dbg-perf-card"><span class="pd-dbg-perf-value">${frameMs != null ? frameMs.toFixed(1) : '--'}</span><span class="pd-dbg-perf-label">帧耗时(ms)</span></div>`;
    if (performance.memory) html += `<div class="pd-dbg-perf-card"><span class="pd-dbg-perf-value">${mem != null ? mem.toFixed(1) : '--'}</span><span class="pd-dbg-perf-label">JS 堆内存(MB)</span></div>`;
    if (longTaskObserver) html += `<div class="pd-dbg-perf-card"><span class="pd-dbg-perf-value">${longTaskPct != null ? Math.round(longTaskPct) : '--'}%</span><span class="pd-dbg-perf-label">主线程繁忙度</span></div>`;
    html += '</div>';

    if (!ui.perfCollapsed) {
      html += '<div class="pd-dbg-subhead">FPS</div>' + sparkline(fpsHistory, 'var(--pd-info)', 60);
      html += '<div class="pd-dbg-subhead">帧耗时 (ms)</div>' + sparkline(frameMsHistory, 'var(--pd-warn)');
      if (performance.memory) html += '<div class="pd-dbg-subhead">JS 堆内存 (MB)</div>' + sparkline(memHistory, '#16a34a');
      if (longTaskObserver) html += '<div class="pd-dbg-subhead">主线程繁忙度 (%)</div>' + sparkline(longTaskPctHistory, 'var(--pd-danger)', 100);

      html += `<p class="pd-dbg-hint">FPS/帧耗时基于 requestAnimationFrame 采样;繁忙度基于 Long Tasks API(主线程被单个任务连续占用超过 50ms 的时间占比,是不需要额外权限时最接近"CPU 有多忙"的替代指标,浏览器扩展拿不到系统级 CPU 占用率)。每 0.5 秒采样一次,图表窗口 ${PERF_HISTORY_SIZE * 0.5} 秒。${performance.memory ? '' : ' 此浏览器不支持 JS 堆内存读数。'}${longTaskObserver ? '' : ' 此浏览器不支持 Long Tasks API,已隐藏繁忙度。'}</p>`;
    }

    body.innerHTML = html;
  }

  function levelClass(level) {
    return 'pd-dbg-log-' + level;
  }

  function renderLogsTab(body) {
    const rows = logs.map((entry) => {
      const time = new Date(entry.time).toLocaleTimeString();
      return `<div class="pd-dbg-log-row ${levelClass(entry.level)}">
        <span class="pd-dbg-log-time">${time}</span>
        <span class="pd-dbg-log-level">${entry.level}</span>
        <span class="pd-dbg-log-text">${escapeHtml(entry.text)}</span>
      </div>`;
    }).join('');
    body.innerHTML = `
      <div class="pd-dbg-log-toolbar">
        <button type="button" class="pd-dbg-btn-secondary" data-action="clear-logs">清空</button>
        <span class="pd-dbg-hint" style="margin:0;">${consolePatched ? `已捕获 ${logs.length} 条(镜像本页 console 输出)` : '打开日志标签页时开始捕获'}</span>
      </div>
      <div class="pd-dbg-log-list" id="pd-dbg-log-list">${rows || '<p class="pd-dbg-hint">暂无日志</p>'}</div>
    `;
    // Console patching starts lazily the first time the Logs tab is viewed,
    // so pages that never open it pay zero console-wrapping overhead.
    patchConsole();
    const list = body.querySelector('#pd-dbg-log-list');
    if (list) list.scrollTop = list.scrollHeight;
  }

  function statusClass(entry) {
    if (entry.error || !entry.status) return 'pd-dbg-net-status-error';
    if (entry.status >= 500) return 'pd-dbg-net-status-error';
    if (entry.status >= 400) return 'pd-dbg-net-status-warn';
    return 'pd-dbg-net-status-ok';
  }

  function shortUrl(url) {
    try {
      const u = new URL(url, location.href);
      return u.pathname + u.search || u.href;
    } catch (e) {
      return url;
    }
  }

  function renderNetworkTab(body) {
    const rows = networkEntries.slice().reverse().map((entry) => {
      const expanded = expandedNetworkId === entry.id;
      const statusText = entry.error ? '失败' : entry.status;
      let html = `<div class="pd-dbg-net-row ${expanded ? 'pd-dbg-net-row-open' : ''}" data-network-id="${entry.id}">
        <div class="pd-dbg-net-summary" data-action="toggle-network">
          <span class="pd-dbg-net-method">${escapeHtml(entry.method)}</span>
          <span class="pd-dbg-net-url" title="${escapeHtml(entry.url)}">${escapeHtml(shortUrl(entry.url))}</span>
          <span class="pd-dbg-net-status ${statusClass(entry)}">${escapeHtml(String(statusText))}</span>
          <span class="pd-dbg-net-duration">${Math.round(entry.duration)}ms</span>
        </div>`;
      if (expanded) html += renderNetworkDetail(entry);
      html += '</div>';
      return html;
    }).join('');

    body.innerHTML = `
      <div class="pd-dbg-log-toolbar">
        <button type="button" class="pd-dbg-btn-secondary" data-action="clear-network">清空</button>
        <label style="display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--pd-text-secondary); cursor: pointer; user-select: none; margin: 0;">
          <input type="checkbox" data-action="toggle-network-capture" ${networkCaptureActive ? 'checked' : ''} style="margin: 0; cursor: pointer;"/>
          <span>开启捕获</span>
        </label>
        <span class="pd-dbg-hint" style="margin: 0 0 0 auto;">${networkCaptureActive ? `已捕获 ${networkEntries.length} 条` : '捕获已关闭'}</span>
      </div>
      <div class="pd-dbg-net-list">${rows || (networkCaptureActive ? '<p class="pd-dbg-hint">暂无请求。触发页面上的操作(点击按钮、翻页等)后这里会实时出现。</p>' : '<p class="pd-dbg-hint">捕获已关闭。请勾选“开启捕获”以观察网络流量。</p>')}</div>
    `;
  }

  function headersBlock(headers) {
    const keys = Object.keys(headers || {});
    if (!keys.length) return '(无)';
    return keys.map((k) => `${escapeHtml(k)}: ${escapeHtml(headers[k])}`).join('\n');
  }

  function renderNetworkDetail(entry) {
    let html = '<div class="pd-dbg-net-detail">';
    if (entry.error) html += `<p class="pd-dbg-hint" style="color:var(--pd-danger);">请求失败:${escapeHtml(entry.error)}</p>`;
    html += '<div class="pd-dbg-subhead">请求头</div>';
    html += `<pre class="pd-dbg-json">${escapeHtml(headersBlock(entry.reqHeaders))}</pre>`;
    if (entry.reqBody) {
      html += '<div class="pd-dbg-subhead">请求体</div>';
      html += `<pre class="pd-dbg-json">${escapeHtml(entry.reqBody)}</pre>`;
    }
    html += '<div class="pd-dbg-subhead">响应头</div>';
    html += `<pre class="pd-dbg-json">${escapeHtml(headersBlock(entry.resHeaders))}</pre>`;
    if (entry.resBody != null) {
      html += '<div class="pd-dbg-subhead">响应体</div>';
      html += `<pre class="pd-dbg-json">${escapeHtml(entry.resBody)}</pre>`;
    }
    html += `<button type="button" class="pd-dbg-btn-secondary" data-action="copy-network-url" data-network-id="${entry.id}">复制 URL</button>`;
    html += '</div>';
    return html;
  }

  function renderInspectorTab(body) {
    let html = `<button type="button" class="pd-dbg-btn-primary" data-action="toggle-pick">${picking ? '停止拾取' : (lockedEl ? '重新拾取元素' : '开始拾取元素')}</button>`;
    html += `<p class="pd-dbg-hint">${picking ? '在页面上移动鼠标高亮元素,点击锁定,Esc 取消。' : '点击上方按钮后,悬停页面元素查看,点击锁定详情。'}</p>`;
    if (lockedEl && lockedEl.isConnected) {
      html += renderInspectorDetails(lockedEl);
    } else if (lockedEl) {
      html += '<p class="pd-dbg-hint">上次锁定的元素已从页面中移除。</p>';
    }
    body.innerHTML = html;
  }

  function renderInspectorDetails(el) {
    const rect = el.getBoundingClientRect();
    const cs = window.getComputedStyle(el);
    const selector = guessSelector(el);
    const className = typeof el.className === 'string' ? el.className : '';
    let html = '<div class="pd-dbg-kv">';
    html += kvRow('标签', el.tagName.toLowerCase());
    html += kvRow('ID', el.id ? escapeHtml(el.id) : '(无)');
    html += kvRow('Class', className ? escapeHtml(className) : '(无)');
    html += kvRow('尺寸', `${Math.round(rect.width)} × ${Math.round(rect.height)}`);
    html += kvRow('位置', `x:${Math.round(rect.left)} y:${Math.round(rect.top)}`);
    html += kvRow('position', escapeHtml(cs.position));
    html += kvRow('z-index', escapeHtml(cs.zIndex));
    html += kvRow('background-color', escapeHtml(cs.backgroundColor));
    html += kvRow('color', escapeHtml(cs.color));
    html += kvRow('font-size', escapeHtml(cs.fontSize));
    html += '</div>';
    html += `<div class="pd-dbg-mono pd-dbg-selector-box">${escapeHtml(selector)}</div>`;
    html += '<button type="button" class="pd-dbg-btn-secondary" data-action="copy-selector">复制选择器</button>';
    lastSelector = selector;
    return html;
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    shadow.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) { /* best-effort */ }
    ta.remove();
  }

  function onShadowClick(e) {
    const closeBtn = e.target.closest('[data-action="close"]');
    if (closeBtn) { ui.open = false; render(); return; }

    const tabBtn = e.target.closest('[data-tab]');
    if (tabBtn) { ui.tab = tabBtn.getAttribute('data-tab'); render(); return; }

    const action = e.target.closest('[data-action]');
    if (!action) return;
    const name = action.getAttribute('data-action');

    if (name === 'copy-state-json') {
      const body = shadow.getElementById('pd-dbg-body');
      copyToClipboard(body ? (body.dataset.stateJson || '') : '');
    } else if (name === 'clear-logs') {
      logs = [];
      renderTabBody();
    } else if (name === 'toggle-pick') {
      if (picking) stopPicking(); else startPicking();
    } else if (name === 'copy-selector') {
      copyToClipboard(lastSelector);
    } else if (name === 'clear-network') {
      networkEntries = [];
      expandedNetworkId = null;
      renderTabBody();
    } else if (name === 'toggle-network') {
      const id = Number(action.closest('[data-network-id]').getAttribute('data-network-id'));
      expandedNetworkId = expandedNetworkId === id ? null : id;
      renderTabBody();
    } else if (name === 'copy-network-url') {
      const id = Number(action.getAttribute('data-network-id'));
      const entry = networkEntries.find((e) => e.id === id);
      if (entry) copyToClipboard(entry.url);
    } else if (name === 'toggle-network-capture') {
      const checkbox = shadow.querySelector('[data-action="toggle-network-capture"]');
      if (checkbox) {
        networkCaptureActive = checkbox.checked;
        updateNetworkCaptureState();
        renderTabBody();
      }
    } else if (name === 'toggle-perf-collapse') {
      ui.perfCollapsed = !ui.perfCollapsed;
      renderTabBody();
      positionPanel();
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function svgIcon(pathContent, size) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${pathContent}</svg>`;
  }

  const ICON_CPU = '<rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>';
  const ICON_X = '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>';

  const PANEL_CSS = `
    :host {
      color-scheme: light dark;
      --pd-text: #18181b; --pd-text-secondary: #71717a; --pd-border: rgba(0,0,0,0.12);
      --pd-panel-bg: #ffffff; --pd-fab-bg: #18181b; --pd-fab-text: #fff;
      --pd-surface: rgba(0,0,0,0.035); --pd-card: #ffffff;
      --pd-shadow: rgba(0,0,0,0.16); --pd-focus: rgba(24,24,27,0.14);
      --pd-danger: #dc2626; --pd-warn: #d97706; --pd-info: #2563eb;
    }
    @media (prefers-color-scheme: dark) {
      :host {
        --pd-text: #f4f4f5; --pd-text-secondary: #a1a1aa; --pd-border: rgba(255,255,255,0.14);
        --pd-panel-bg: #141416; --pd-fab-bg: #fff; --pd-fab-text: #000;
        --pd-surface: rgba(255,255,255,0.045); --pd-card: #1c1c1e;
        --pd-shadow: rgba(0,0,0,0.4); --pd-focus: rgba(255,255,255,0.16);
        --pd-danger: #f87171; --pd-warn: #fbbf24; --pd-info: #60a5fa;
      }
    }
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }

    .pd-dbg-fab {
      position: fixed; bottom: 18px; right: 18px; width: 44px; height: 44px; border-radius: 50%;
      background: var(--pd-fab-bg); color: var(--pd-fab-text); border: 1px solid var(--pd-border);
      display: flex; align-items: center; justify-content: center; cursor: pointer;
      box-shadow: 0 4px 16px var(--pd-shadow); transition: transform 0.15s ease, box-shadow 0.15s ease;
      touch-action: none;
    }
    .pd-dbg-fab:hover { transform: scale(1.06); }
    .pd-dbg-fab-open { box-shadow: 0 0 0 3px var(--pd-focus), 0 4px 16px var(--pd-shadow); }
    .pd-dbg-fab.pd-dbg-dragging { transition: none !important; transform: scale(1.04) !important; cursor: grabbing !important; }

    .pd-dbg-panel {
      display: flex; flex-direction: column; position: fixed; bottom: 70px; right: 18px;
      width: 360px; max-width: calc(100vw - 24px); max-height: 62vh; border-radius: 16px;
      background: var(--pd-panel-bg); color: var(--pd-text); border: 1px solid var(--pd-border);
      box-shadow: 0 20px 60px var(--pd-shadow); overflow: hidden;
      opacity: 0; visibility: hidden; pointer-events: none; transform: translateY(8px) scale(0.97);
      transform-origin: bottom right;
      transition: opacity 0.16s ease, transform 0.16s cubic-bezier(.22,1,.36,1), visibility 0s linear 0.16s;
    }
    .pd-dbg-panel-open {
      opacity: 1; visibility: visible; pointer-events: auto; transform: translateY(0) scale(1);
      transition: opacity 0.16s ease, transform 0.16s cubic-bezier(.22,1,.36,1), visibility 0s linear 0s;
    }
    .pd-dbg-header {
      display: flex; align-items: center; gap: 8px; padding: 12px 14px;
      border-bottom: 1px solid var(--pd-border); flex: none;
    }
    .pd-dbg-title { font-size: 14px; font-weight: 700; }
    .pd-dbg-domain {
      font-size: 11px; color: var(--pd-text-secondary); background: var(--pd-surface);
      padding: 3px 8px; border-radius: 999px; max-width: 140px; overflow: hidden;
      white-space: nowrap; text-overflow: ellipsis; margin-right: auto;
    }
    .pd-dbg-icon-btn {
      display: flex; align-items: center; justify-content: center; width: 24px; height: 24px;
      border: none; background: transparent; color: var(--pd-text-secondary); border-radius: 6px; cursor: pointer;
    }
    .pd-dbg-icon-btn:hover { background: var(--pd-surface); color: var(--pd-text); }

    .pd-dbg-seg {
      display: flex; gap: 2px; background: var(--pd-surface); padding: 3px; margin: 10px 12px 0;
      border-radius: 10px; flex: none;
    }
    .pd-dbg-seg button {
      flex: 1; min-height: 28px; border: none; border-radius: 7px; background: transparent;
      color: var(--pd-text-secondary); font-size: 12px; cursor: pointer;
    }
    .pd-dbg-seg button.active { background: var(--pd-card); color: var(--pd-text); font-weight: 600; box-shadow: 0 1px 3px var(--pd-shadow); }

    .pd-dbg-body { padding: 12px; overflow-y: auto; flex: 1; min-height: 0; }
    .pd-dbg-body::-webkit-scrollbar { width: 6px; }
    .pd-dbg-body::-webkit-scrollbar-thumb { background: var(--pd-border); border-radius: 3px; }

    .pd-dbg-kv { border: 1px solid var(--pd-border); border-radius: 10px; overflow: hidden; margin-bottom: 10px; }
    .pd-dbg-kv-row {
      display: flex; justify-content: space-between; gap: 10px; padding: 7px 10px; font-size: 12px;
      border-bottom: 1px solid var(--pd-border);
    }
    .pd-dbg-kv-row:last-child { border-bottom: none; }
    .pd-dbg-kv-row > span:first-child { color: var(--pd-text-secondary); }
    .pd-dbg-kv-row > span:last-child { font-weight: 500; text-align: right; word-break: break-all; }

    .pd-dbg-hint { font-size: 11.5px; color: var(--pd-text-secondary); line-height: 1.5; margin: 6px 0 0; }

    .pd-dbg-btn-secondary, .pd-dbg-btn-primary {
      width: 100%; padding: 8px; border-radius: 8px; font-size: 12.5px; cursor: pointer; border: 1px solid var(--pd-border);
      margin-bottom: 8px;
    }
    .pd-dbg-btn-secondary { background: var(--pd-surface); color: var(--pd-text); }
    .pd-dbg-btn-primary { background: var(--pd-fab-bg); color: var(--pd-fab-text); border-color: transparent; font-weight: 600; }

    .pd-dbg-json {
      font: 11px/1.5 ui-monospace, Menlo, Consolas, monospace; background: var(--pd-surface);
      padding: 10px; border-radius: 8px; max-height: 220px; overflow: auto; white-space: pre-wrap; word-break: break-all;
      margin: 0;
    }

    .pd-dbg-perf-grid { display: flex; gap: 8px; margin-bottom: 8px; }
    .pd-dbg-perf-card {
      flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px;
      background: var(--pd-surface); border-radius: 10px; padding: 12px 6px;
    }
    .pd-dbg-perf-value { font-size: 20px; font-weight: 700; }
    .pd-dbg-perf-label { font-size: 10.5px; color: var(--pd-text-secondary); }

    .pd-dbg-spark { width: 100%; height: 44px; display: block; background: var(--pd-surface); border-radius: 8px; margin-bottom: 4px; }

    .pd-dbg-log-toolbar { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .pd-dbg-log-toolbar .pd-dbg-btn-secondary { width: auto; margin-bottom: 0; padding: 5px 10px; }
    .pd-dbg-log-list { display: flex; flex-direction: column; gap: 4px; }
    .pd-dbg-log-row {
      display: flex; gap: 6px; font: 11px/1.4 ui-monospace, Menlo, Consolas, monospace;
      padding: 5px 7px; border-radius: 6px; background: var(--pd-surface); word-break: break-all;
    }
    .pd-dbg-log-time { color: var(--pd-text-secondary); flex: none; }
    .pd-dbg-log-level { flex: none; text-transform: uppercase; font-weight: 700; }
    .pd-dbg-log-error .pd-dbg-log-level { color: var(--pd-danger); }
    .pd-dbg-log-warn .pd-dbg-log-level { color: var(--pd-warn); }
    .pd-dbg-log-info .pd-dbg-log-level, .pd-dbg-log-log .pd-dbg-log-level, .pd-dbg-log-debug .pd-dbg-log-level { color: var(--pd-info); }

    .pd-dbg-mono { font: 11px/1.4 ui-monospace, Menlo, Consolas, monospace; word-break: break-all; }
    .pd-dbg-selector-box { background: var(--pd-surface); border-radius: 8px; padding: 8px; margin-bottom: 8px; }

    .pd-dbg-net-list { display: flex; flex-direction: column; gap: 4px; }
    .pd-dbg-net-row { background: var(--pd-surface); border-radius: 6px; overflow: hidden; }
    .pd-dbg-net-summary {
      display: flex; align-items: center; gap: 6px; padding: 6px 8px; cursor: pointer;
      font: 11px/1.4 ui-monospace, Menlo, Consolas, monospace;
    }
    .pd-dbg-net-method { flex: none; font-weight: 700; color: var(--pd-info); }
    .pd-dbg-net-url { flex: 1; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
    .pd-dbg-net-status { flex: none; font-weight: 700; }
    .pd-dbg-net-status-ok { color: #16a34a; }
    .pd-dbg-net-status-warn { color: var(--pd-warn); }
    .pd-dbg-net-status-error { color: var(--pd-danger); }
    .pd-dbg-net-duration { flex: none; color: var(--pd-text-secondary); }
    .pd-dbg-net-detail { padding: 0 8px 10px; }
    .pd-dbg-subhead { font-size: 10.5px; font-weight: 700; color: var(--pd-text-secondary); text-transform: uppercase; margin: 8px 0 4px; }

    .pd-dbg-hover-box {
      position: fixed; display: none; pointer-events: none; z-index: 2147483647;
      border: 2px solid #6d5bd0; background: rgba(109,91,208,0.15); border-radius: 2px; top: 0; left: 0;
    }
    .pd-dbg-hover-label {
      position: fixed; display: none; pointer-events: none; z-index: 2147483647; top: 0; left: 0;
      background: #18181b; color: #fff; font: 11px/1.4 ui-monospace, Menlo, Consolas, monospace;
      padding: 3px 7px; border-radius: 4px; max-width: 60vw; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .pd-dbg-hover-tip {
      position: fixed; display: none; pointer-events: none; z-index: 2147483647;
      top: 12px; left: 50%; transform: translateX(-50%);
      background: #6d5bd0; color: #fff; font-size: 12px; padding: 6px 14px; border-radius: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
  `;
})();
