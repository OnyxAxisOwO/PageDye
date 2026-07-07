// PageDye Debug Mode — a floating on-page panel for developers/power users,
// gated behind a global (not per-domain) toggle in the options page. Fully
// independent from scripts/content.js: it reads the same storage keys but
// keeps its own state, so it can be dropped without touching the renderer.
(() => {
  const DEBUG_MODE_KEY = '__pagedye_debug_mode__';
  const CUSTOM_EFFECTS_KEY = '__pagedye_custom_effects__';
  const HOST_ID = 'pagedye-debug-host';
  const FPS_SAMPLE_SIZE = 90;
  const LOG_LIMIT = 200;

  const domain = window.location.hostname;

  let enabled = false;
  let host = null, shadow = null;
  let ui = { open: false, tab: 'state' };

  // Console mirror
  let logs = [];
  let consolePatched = false;
  const originalConsole = {};

  // FPS
  let rafId = null;
  let perfTimer = null;
  let frameTimes = [];
  let lastFrameAt = null;

  // Inspector
  let picking = false;
  let lockedEl = null;
  let lastSelector = '';
  let hoverBox = null, hoverLabel = null, hoverTip = null;

  // A re-injection (e.g. after the extension is reloaded and a tab's content
  // scripts get re-run) would otherwise leave the previous instance's rAF
  // loop, console patch and listeners running alongside a brand new one.
  if (window.__pagedyeDebugTeardown) {
    window.__pagedyeDebugTeardown();
  }
  window.__pagedyeDebugTeardown = teardown;

  init();

  function init() {
    chrome.storage.onChanged.addListener(onStorageChanged);
    chrome.storage.local.get([DEBUG_MODE_KEY], (data) => {
      if (data[DEBUG_MODE_KEY]) enable();
    });
  }

  function teardown() {
    chrome.storage.onChanged.removeListener(onStorageChanged);
    disable();
  }

  function onStorageChanged(changes, area) {
    if (area !== 'local') return;

    if (Object.prototype.hasOwnProperty.call(changes, DEBUG_MODE_KEY)) {
      if (changes[DEBUG_MODE_KEY].newValue) enable();
      else disable();
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
    buildUI();
  }

  function disable() {
    if (!enabled) return;
    enabled = false;
    stopPicking();
    stopFpsLoop();
    unpatchConsole();
    destroyUI();
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
    const tick = (now) => {
      if (lastFrameAt !== null) {
        frameTimes.push(now - lastFrameAt);
        if (frameTimes.length > FPS_SAMPLE_SIZE) frameTimes.shift();
      }
      lastFrameAt = now;
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    perfTimer = setInterval(() => {
      if (ui.open && ui.tab === 'perf') updatePerfDisplay();
    }, 500);
  }

  function stopFpsLoop() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    if (perfTimer) { clearInterval(perfTimer); perfTimer = null; }
    frameTimes = [];
  }

  function currentFps() {
    if (!frameTimes.length) return null;
    const avgMs = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
    return { fps: avgMs > 0 ? 1000 / avgMs : 0, frameMs: avgMs };
  }

  function updatePerfDisplay() {
    const body = shadow && shadow.getElementById('pd-dbg-body');
    if (!body) return;
    const stats = currentFps();
    const fpsEl = body.querySelector('#pd-dbg-fps');
    const msEl = body.querySelector('#pd-dbg-frametime');
    const memEl = body.querySelector('#pd-dbg-memory');
    if (fpsEl) fpsEl.textContent = stats ? Math.round(stats.fps) : '--';
    if (msEl) msEl.textContent = stats ? stats.frameMs.toFixed(1) : '--';
    if (memEl && performance.memory) {
      memEl.textContent = formatBytes(performance.memory.usedJSHeapSize);
    }
  }

  function formatBytes(n) {
    if (!n && n !== 0) return '--';
    const mb = n / (1024 * 1024);
    return mb.toFixed(1) + ' MB';
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
  // Panel UI
  // ------------------------------------------------------------------
  function buildUI() {
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
    fab.addEventListener('click', () => { ui.open = !ui.open; render(); });
    shadow.appendChild(fab);

    const panel = document.createElement('div');
    panel.className = 'pd-dbg-panel';
    panel.id = 'pd-dbg-panel';
    shadow.appendChild(panel);

    shadow.addEventListener('click', onShadowClick);

    render();
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
  }

  function renderTabBody() {
    const body = shadow.getElementById('pd-dbg-body');
    if (!body) return;
    if (ui.tab === 'state') renderStateTab(body);
    else if (ui.tab === 'perf') renderPerfTab(body);
    else if (ui.tab === 'logs') renderLogsTab(body);
    else if (ui.tab === 'inspector') renderInspectorTab(body);
  }

  function kvRow(label, value) {
    return `<div class="pd-dbg-kv-row"><span>${escapeHtml(label)}</span><span>${value}</span></div>`;
  }

  function renderStateTab(body) {
    chrome.storage.local.get([domain, CUSTOM_EFFECTS_KEY], (data) => {
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
        html += kvRow('磨砂玻璃元素数', String(frosted.length));
      }
      html += kvRow('自定义动效数(全局)', String(effects.length));
      html += '</div>';
      html += '<button type="button" class="pd-dbg-btn-secondary" data-action="copy-state-json">复制完整 JSON</button>';
      html += `<pre class="pd-dbg-json">${escapeHtml(JSON.stringify(settings, null, 2))}</pre>`;
      body.innerHTML = html;
      body.dataset.stateJson = JSON.stringify(settings, null, 2);
    });
  }

  function normalizeFrostedGlassList(cfg) {
    if (Array.isArray(cfg)) return cfg;
    if (cfg && typeof cfg === 'object' && cfg.selector) return [cfg];
    return [];
  }

  function renderPerfTab(body) {
    body.innerHTML = `
      <div class="pd-dbg-perf-grid">
        <div class="pd-dbg-perf-card"><span class="pd-dbg-perf-value" id="pd-dbg-fps">--</span><span class="pd-dbg-perf-label">FPS</span></div>
        <div class="pd-dbg-perf-card"><span class="pd-dbg-perf-value" id="pd-dbg-frametime">--</span><span class="pd-dbg-perf-label">帧耗时(ms)</span></div>
        ${performance.memory ? '<div class="pd-dbg-perf-card"><span class="pd-dbg-perf-value" id="pd-dbg-memory">--</span><span class="pd-dbg-perf-label">JS 堆内存</span></div>' : ''}
      </div>
      <p class="pd-dbg-hint">基于 requestAnimationFrame,最近 ${FPS_SAMPLE_SIZE} 帧的滚动平均,每 0.5 秒刷新一次。${performance.memory ? '' : '(此浏览器不支持 JS 堆内存读数)'}</p>
    `;
    updatePerfDisplay();
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
    }
    .pd-dbg-fab:hover { transform: scale(1.06); }
    .pd-dbg-fab-open { box-shadow: 0 0 0 3px var(--pd-focus), 0 4px 16px var(--pd-shadow); }

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

    .pd-dbg-body { padding: 12px; overflow-y: auto; }
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

    .pd-dbg-log-toolbar { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .pd-dbg-log-toolbar .pd-dbg-btn-secondary { width: auto; margin-bottom: 0; padding: 5px 10px; }
    .pd-dbg-log-list { display: flex; flex-direction: column; gap: 4px; max-height: 320px; overflow-y: auto; }
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
