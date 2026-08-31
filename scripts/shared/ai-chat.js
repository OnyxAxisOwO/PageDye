// The AI chat surface, mounted by both popup.js and options.js.
//
// One component with two skins rather than two implementations: the popup and
// the options page show the same transcript, the same theme cards and the same
// first-run onboarding, and the only real differences are how wide it is and
// whether a generated theme can be previewed on a live tab. Those differences
// arrive as mount() options; everything else — history, editing, regeneration,
// markdown — is defined once here.
//
// Every turn re-sends the whole transcript (see scripts/shared/ai-chat-store.js),
// which is what makes editing an earlier message work: truncate the array at
// that message, append the rewritten one, and ask again. There is no server
// state to reconcile.
//
// Model output is never given to innerHTML. Prose goes through
// scripts/shared/markdown.js, which builds elements; palettes are re-validated
// here before they are interpolated into a CSS gradient, because a theme read
// back from storage is not necessarily one this extension wrote. Attachments
// get the same treatment: a data URL is checked against the same pattern the
// store and the generator use before it becomes an <img> src.

(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.PageDyeAiChat = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const AI_CONFIG_KEY = '__pagedye_ai_config__';
  const HEX_RE = /^#[0-9a-f]{6}$/i;
  const IMAGE_DATA_URL_RE = /^data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+=*$/;
  const SVG_NS = 'http://www.w3.org/2000/svg';

  const PAPERCLIP = [
    'M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48'
  ];
  const CROSS = ['M18 6L6 18', 'M6 6l12 12'];
  const MENU = ['M3 6h18', 'M3 12h18', 'M3 18h18'];

  // The opening prompts. Far more than fit on screen, so each visit offers a
  // different three — a fixed trio is read once and then becomes furniture,
  // while a rotating one keeps suggesting things the user did not know to ask
  // for. Every string is sent verbatim as the message, so each has to read as
  // something a person would actually type.
  const SUGGESTION_KEYS = [
    'suggestionCalm', 'suggestionDark', 'suggestionSurprise', 'suggestionWarm',
    'suggestionCool', 'suggestionSolid', 'suggestionSoftGradient', 'suggestionFrosted',
    'suggestionTimeOfDay', 'suggestionEffect', 'suggestionBrand', 'suggestionReading',
    'suggestionMono', 'suggestionRetro', 'suggestionDeep', 'suggestionSubtle'
  ];
  const SUGGESTIONS_SHOWN = 3;

  function pickSuggestions(count) {
    const pool = SUGGESTION_KEYS.slice();
    const picked = [];
    while (picked.length < count && pool.length) {
      picked.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    }
    return picked;
  }

  const STRINGS = {
    en: {
      chatTitle: 'AI Theme Chat',
      newChat: 'New chat',
      history: 'History',
      noHistory: 'No conversations yet.',
      deleteChat: 'Delete this conversation',
      confirmDelete: 'Delete this conversation?',
      clearAll: 'Clear all',
      confirmClearAll: 'Delete all conversations? This cannot be undone.',
      placeholder: 'Ask for a change…',
      placeholderFirst: 'Describe the look you want…',
      send: 'Send',
      attach: 'Attach an image',
      removeImage: 'Remove this image',
      dropHint: 'Drop images here',
      tooManyImages: 'Up to {count} images per message.',
      imageTooLarge: 'That image is too large.',
      imageFailed: 'That image could not be read.',
      imageWallpaper: 'Your image as the wallpaper',
      imagesUnsupported: 'This model cannot read images. Pick a vision model in AI settings, or edit the message and remove the picture.',
      streamFallback: 'Streaming was not available this time, so the whole answer arrived at once — {reason}.',
      statsStreamed: 'streamed',
      statsOneShot: 'one-shot',
      statsFirstToken: 'first token {seconds}s',
      statsTokens: '{input} in / {output} out',
      statsOutputOnly: '{output} out',
      statsSpeed: '{tps} tok/s',
      reasoning: 'Reasoning',
      reasoningLive: 'Thinking…',
      stop: 'Stop',
      stopped: 'Stopped.',
      thinking: 'Reading the page and designing…',
      thinkingAgain: 'Working on your change…',
      emptyTitle: 'Design a background by chatting',
      emptyBody: 'It reads the colours and layout of the page you are on — never its text — and proposes a wallpaper that keeps the site readable. Ask for changes in plain language.',
      suggestionCalm: 'Something calm and low contrast',
      suggestionDark: 'A dark theme that matches this site',
      suggestionSurprise: 'Surprise me',
      suggestionWarm: 'Warm sunset colours',
      suggestionCool: 'Cool blues and greens',
      suggestionSolid: 'Just a plain colour, nothing fancy',
      suggestionSoftGradient: 'A soft gradient that stays out of the way',
      suggestionFrosted: 'Frost the panels so the text stays sharp',
      suggestionTimeOfDay: 'Change through the day, warmer at night',
      suggestionEffect: 'Add a slow animated effect',
      suggestionBrand: 'Follow this site\'s own colours',
      suggestionReading: 'Easy on the eyes for long reading',
      suggestionMono: 'Almost no colour — greys only',
      suggestionRetro: 'Something retro',
      suggestionDeep: 'Deep and dark, like late at night',
      suggestionSubtle: 'Barely there — I should hardly notice it',
      setupTitle: 'Add an API key to start',
      setupBody: 'The chat runs on your own API key — Anthropic, or any OpenAI-compatible endpoint. Nothing is sent anywhere until you add one.',
      setupAction: 'Open AI settings',
      setupStart: 'Set up step by step',
      workspaceOpen: 'Open the full workspace',
      workspaceHint: 'More room, with the conversation list, a live preview and model management.',
      edit: 'Edit',
      copy: 'Copy',
      copied: 'Copied',
      cancel: 'Cancel',
      saveAndResend: 'Save & resend',
      regenerate: 'Regenerate',
      retry: 'Try again',
      preview: 'Preview',
      undoPreview: 'Undo preview',
      apply: 'Apply',
      applied: 'Applied to this site.',
      saveTheme: 'Add to themes',
      themeSaved: 'Kept as “{name}” in your themes.',
      dataConsentRequired: 'AI data-sharing consent is required before sending this request.',
      prefsTitle: 'PageDye settings',
      prefsBody: 'This changes PageDye itself, not this page.',
      prefsApply: 'Change settings',
      prefsApplied: 'PageDye settings updated.',
      prefsAccent: 'Interface colour',
      prefsReduceMotion: 'Reduce interface motion',
      prefsDiagnostics: 'Diagnostics on websites',
      prefsPauseShortcut: 'Pause shortcut',
      prefsOn: 'On',
      prefsOff: 'Off',
      previewing: 'Previewing — not saved yet.',
      frostedCount: 'Frosted glass: {count}',
      light: 'Light',
      dark: 'Dark',
      backgroundOff: 'Background turned off',
      timeRangeCount: 'Changes through the day: {count} periods',
      slideshowCount: 'Slideshow: {count} slides',
      failed: 'Something went wrong.'
    },
    zh: {
      chatTitle: 'AI 主题对话',
      newChat: '新对话',
      history: '历史记录',
      noHistory: '还没有对话记录。',
      deleteChat: '删除这个对话',
      confirmDelete: '删除这个对话？',
      clearAll: '清空全部',
      confirmClearAll: '删除全部对话？此操作无法撤销。',
      placeholder: '想改哪里？直接说…',
      placeholderFirst: '描述你想要的风格…',
      send: '发送',
      attach: '添加图片',
      removeImage: '移除这张图片',
      dropHint: '把图片拖到这里',
      tooManyImages: '每条消息最多 {count} 张图片。',
      imageTooLarge: '这张图片太大了。',
      imageFailed: '这张图片读不出来。',
      imageWallpaper: '用你上传的图片当背景',
      imagesUnsupported: '这个模型看不了图片。去 AI 设置换一个支持看图的模型，或者编辑这条消息把图片去掉。',
      streamFallback: '这次没能流式返回，整段答案一次性到达——{reason}。',
      statsStreamed: '流式',
      statsOneShot: '一次性',
      statsFirstToken: '首字 {seconds}s',
      statsTokens: '输入 {input} / 输出 {output}',
      statsOutputOnly: '输出 {output}',
      statsSpeed: '{tps} tok/s',
      reasoning: '思考过程',
      reasoningLive: '正在思考…',
      stop: '停止',
      stopped: '已停止。',
      thinking: '正在读取页面并设计…',
      thinkingAgain: '正在按你的要求修改…',
      emptyTitle: '用聊天的方式设计背景',
      emptyBody: '它会读取当前页面的配色和布局（不会读取正文内容），给出一套不影响阅读的背景方案。想改哪里，直接用大白话说。',
      suggestionCalm: '来点安静、低对比度的',
      suggestionDark: '做一个和这个网站搭的深色主题',
      suggestionSurprise: '随便来一个惊喜',
      suggestionWarm: '暖一点的落日色',
      suggestionCool: '清爽的蓝绿色调',
      suggestionSolid: '就要一个纯色，别太花',
      suggestionSoftGradient: '柔和的渐变，别抢正文',
      suggestionFrosted: '把面板做成磨砂，让字更清楚',
      suggestionTimeOfDay: '随时间变化，晚上暖一点',
      suggestionEffect: '加一个慢慢动的特效',
      suggestionBrand: '跟着这个网站自己的配色走',
      suggestionReading: '适合长时间阅读，不刺眼',
      suggestionMono: '近乎无彩，只要黑白灰',
      suggestionRetro: '来点复古感',
      suggestionDeep: '深一点，像深夜那种',
      suggestionSubtle: '很淡就行，几乎察觉不到',
      setupTitle: '先填一个 API 密钥',
      setupBody: '对话使用你自己的 API 密钥，支持 Anthropic 和任意 OpenAI 兼容接口。在你填写之前，不会向任何地方发送数据。',
      setupAction: '打开 AI 设置',
      setupStart: '开始引导设置',
      workspaceOpen: '在完整页面中打开',
      workspaceHint: '更大的工作台：会话历史、实时预览、模型管理。',
      edit: '编辑',
      copy: '复制',
      copied: '已复制',
      cancel: '取消',
      saveAndResend: '保存并重新发送',
      regenerate: '重新生成',
      retry: '重试',
      preview: '预览',
      undoPreview: '撤销预览',
      apply: '应用',
      applied: '已应用到该网站。',
      saveTheme: '添加到主题',
      themeSaved: '已收进主题库，名字是“{name}”。',
      dataConsentRequired: '发送请求前需要同意 AI 数据传输。',
      prefsTitle: 'PageDye 设置',
      prefsBody: '这一项改的是 PageDye 自己，不是当前网页。',
      prefsApply: '更改设置',
      prefsApplied: 'PageDye 设置已更新。',
      prefsAccent: '界面主题色',
      prefsReduceMotion: '减少界面动画',
      prefsDiagnostics: '网页上的诊断按钮',
      prefsPauseShortcut: '暂停快捷键',
      prefsOn: '开',
      prefsOff: '关',
      previewing: '正在预览，尚未保存。',
      frostedCount: '磨砂玻璃：{count} 处',
      light: '浅色',
      dark: '深色',
      backgroundOff: '背景已关闭',
      timeRangeCount: '按时段切换：{count} 个时段',
      slideshowCount: '轮播：{count} 张',
      failed: '出错了。'
    }
  };

  // --- small DOM helpers ------------------------------------------------------

  function makeDom(doc) {
    function el(tag, className, text) {
      const node = doc.createElement(tag);
      if (className) node.className = className;
      if (text != null) node.textContent = text;
      return node;
    }
    function button(className, text, onClick) {
      const node = el('button', className, text);
      node.type = 'button';
      if (onClick) node.addEventListener('click', onClick);
      return node;
    }
    function icon(paths, size) {
      const svg = doc.createElementNS(SVG_NS, 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('width', String(size || 16));
      svg.setAttribute('height', String(size || 16));
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-width', '2');
      svg.setAttribute('stroke-linecap', 'round');
      svg.setAttribute('stroke-linejoin', 'round');
      svg.setAttribute('aria-hidden', 'true');
      paths.forEach((d) => {
        const path = doc.createElementNS(SVG_NS, 'path');
        path.setAttribute('d', d);
        svg.appendChild(path);
      });
      return svg;
    }
    return { el, button, icon };
  }

  // A theme read back from storage is not necessarily one this extension
  // wrote — a backup import or a second extension can put anything under the
  // key — and this string goes straight into a style property. So every stop
  // is re-checked here instead of trusting that sanitizeTheme saw it.
  function swatchGradient(slot) {
    if (!slot) return '';
    // A solid slot has no stops to validate — it previews as a flat chip via
    // a degenerate two-stop gradient, so callers do not need a second code
    // path for "this slot has no gradient at all".
    if (slot.colorMode === 'solid') {
      const color = typeof slot.solidColor === 'string' ? slot.solidColor : '';
      return HEX_RE.test(color) ? `linear-gradient(${color}, ${color})` : '';
    }
    if (!Array.isArray(slot.stops) || slot.stops.length < 2) return '';
    const angle = Number(slot.angle);
    if (!Number.isFinite(angle) || angle < 0 || angle > 360) return '';
    const stops = [];
    for (const stop of slot.stops) {
      const position = Number(stop && stop.position);
      if (!stop || !HEX_RE.test(String(stop.color)) || !Number.isFinite(position) || position < 0 || position > 100) return '';
      stops.push(`${String(stop.color)} ${Math.round(position)}%`);
    }
    // Both shapes go through the same allow-list as everything else here: the
    // swatch has to show what would actually be painted, and a chip that
    // previews a radial theme as a linear one is a wrong answer, not a
    // simplification.
    if (slot.kind === 'radial') {
      const shape = slot.shape === 'circle' ? 'circle' : 'ellipse';
      return `radial-gradient(${shape} at center, ${stops.join(', ')})`;
    }
    return `linear-gradient(${Math.round(angle)}deg, ${stops.join(', ')})`;
  }

  // Same reasoning as swatchGradient above, for the same reason: an attachment
  // read back from storage is not necessarily one this extension wrote, and
  // this string becomes an <img> src.
  function safeImageSrc(dataUrl) {
    const candidate = typeof dataUrl === 'string' ? dataUrl.trim() : '';
    return IMAGE_DATA_URL_RE.test(candidate) ? candidate : '';
  }

  function mount(config) {
    const host = config.root;
    if (!host) throw new Error('PageDyeAiChat.mount needs a root element.');

    const doc = host.ownerDocument;
    const { el, button, icon } = makeDom(doc);
    const browser = config.chrome || (typeof globalThis !== 'undefined' ? globalThis.chrome : null);
    const Store = config.store || (typeof globalThis !== 'undefined' ? globalThis.PageDyeAiChatStore : null);
    const Markdown = config.markdown || (typeof globalThis !== 'undefined' ? globalThis.PageDyeMarkdown : null);
    // Looked up per call rather than captured: the page that hosts the chat
    // loads scripts/image.js as a plain global, and a test that wants a
    // different one substitutes it on the window.
    const imageApi = () => config.image || (doc.defaultView && doc.defaultView.PageDyeImage) || null;
    const maxImages = (Store && Store.MAX_IMAGES_PER_MESSAGE) || 4;
    const variant = config.variant === 'options' ? 'options' : 'popup';
    const lang = STRINGS[config.lang] ? config.lang : 'en';
    const resolveTarget = config.resolveTarget || (async () => null);
    const onApply = config.onApply || (async () => {});
    const onPreview = config.onPreview || null;
    const onRestore = config.onRestore || null;
    const openAiSettings = config.openAiSettings || (() => {});
    // The first-run wizard, when the host page has one to offer. With it, the
    // setup card leads there first and keeps plain settings as the side door;
    // without it the card behaves as it always has.
    const openOnboarding = typeof config.openOnboarding === 'function' ? config.openOnboarding : null;
    // Leaves this surface for the fullscreen one. Absent on the dashboard,
    // which already IS that surface; the popup passes it, and gets both a
    // button in the bar and a one-time invitation under the first answer.
    const openWorkspace = typeof config.openWorkspace === 'function' ? config.openWorkspace : null;
    // Absent on a surface that does not offer it; the card is simply not
    // rendered there, rather than offering a button that does nothing.
    const onApplyPreferences = config.onApplyPreferences || null;
    // Keeps a designed theme in the library instead of only on this one site,
    // so it can be applied to others later. Absent on a surface that has no
    // library to put it in; the button is then simply not offered.
    const onSaveTheme = config.onSaveTheme || null;
    const ensureAiDataConsent = typeof config.ensureAiDataConsent === 'function'
      ? config.ensureAiDataConsent
      : null;
    // A second pane for the sidebar, supplied by the host page: the dashboard
    // hands over its own navigation so the fullscreen chat still offers a way
    // back to the rest of PageDye. When present the sidebar grows a two-tab
    // head; the popup passes nothing and keeps its plain history list.
    const navPanel = config.navPanel || null;
    const navLabel = config.navLabel || '';
    // A host-owned row (target page, model picker…) parked above the
    // transcript. The component only places it; what it does is the host's.
    const mainHeader = config.mainHeader || null;
    // Fired with the latest designed theme of the active conversation (or
    // null) whenever that changes — it is what the dashboard's live preview
    // panel tracks. The message handed over is the stored one: theme,
    // settings and id all present.
    const onThemeUpdate = typeof config.onThemeUpdate === 'function' ? config.onThemeUpdate : null;
    let lastThemeSignature = null;
    // The generator trims a message to this before sending, so the field stops
    // there too rather than silently dropping the tail of a long one.
    const maxMessageChars = (globalThis.PageDyeAiTheme && globalThis.PageDyeAiTheme.MAX_INSTRUCTION_CHARS) || 1000;

    function str(key, vars) {
      const value = (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.en[key] || key;
      return vars ? value.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match)) : value;
    }

    // A different three every time the page is opened.
    const shownSuggestions = pickSuggestions(SUGGESTIONS_SHOWN);

    let conversations = [];
    let activeId = '';
    let busy = false;
    // Ends the turn in flight, when there is one that can be ended: set by the
    // port path of requestTurn (disconnecting the port aborts the request in
    // the worker), null on the sendMessage fallback, which cannot be stopped.
    let cancelTurn = null;
    let editingId = '';
    let previewId = '';
    // The id of a user message that was just pushed, so the very next render
    // (and only that one) plays its send-in animation. Read-and-cleared like
    // the flags above it — the turn-in-flight renders after it reuse the same
    // node data but must not replay the animation on it.
    let justSentId = '';
    let configured = false;
    // Whether the configured model reads images, answered by the user in AI
    // settings. Nothing can ask an endpoint, and a model that cannot see one
    // rejects the whole message, so the attachment button is not offered until
    // someone has said it is safe to.
    let visionEnabled = false;
    // Only used to decide whether a one-shot answer is worth remarking on:
    // with streaming switched off it is exactly what the user asked for.
    let streamingEnabled = true;
    // Wide options screens show the list as a permanent column via CSS, so this
    // only drives the overlay the popup and narrow screens use.
    let historyOpen = false;
    let lastWritten = '';
    let flash = '';
    // Attachments picked but not sent yet. They belong to the composer, not to
    // a conversation, so switching conversations clears them.
    let pendingImages = [];
    let dragging = false;
    // What has arrived of the current answer's visible half. Painted in place
    // of the "thinking" line, so a long answer reads as it is written instead
    // of appearing all at once after a spinner.
    let streamingReply = '';
    // The model's reasoning for the turn in flight. On a thinking model this
    // is the only thing there is to show for most of the wait.
    let streamingThinking = '';
    // The nodes of the turn in flight, so a delta can patch the text it
    // changed instead of rebuilding the transcript. A full render per chunk
    // restarts the spinner's animation several times a second — which reads
    // as a twitch — and throws away the reasoning box's scroll position.
    let pendingNodes = null;
    // Which conversation the transcript on screen belongs to, so a switch (or
    // a brand new one) can be told apart from the many renders a single turn
    // causes while it streams — only the former is worth animating.
    let lastRenderedId = null;

    // --- structure ------------------------------------------------------------

    host.classList.add('ai-chat', `ai-chat-${variant}`);
    host.textContent = '';

    const sidebar = el('div', 'ai-chat-sidebar');
    // One full-width row, the way every chat app starts its rail: the single
    // most common action gets the single most obvious control.
    const sidebarHead = el('div', 'ai-chat-sidebar-head');
    const newChatBtn = button('ai-chat-new', '', () => startNewConversation());
    newChatBtn.appendChild(icon(['M12 5v14', 'M5 12h14'], 14));
    newChatBtn.appendChild(el('span', null, str('newChat')));
    sidebarHead.appendChild(el('span', 'ai-chat-sidebar-title', str('history')));
    sidebarHead.appendChild(newChatBtn);
    // Destructive-for-everything lives at the bottom, small and quiet: it is
    // used once a month, not once a conversation, and a trash can enthroned
    // above the list read as a primary action.
    const clearAllBtn = button('ai-chat-clear-all', '', async () => {
      if (!conversations.length) return;
      if (!doc.defaultView.confirm(str('confirmClearAll'))) return;
      conversations = [];
      activeId = '';
      await persist();
      await startNewConversation();
    });
    clearAllBtn.appendChild(icon(['M3 6h18', 'M8 6V4h8v2', 'M19 6l-1 14H6L5 6', 'M10 11v6', 'M14 11v6'], 12));
    clearAllBtn.appendChild(el('span', null, str('clearAll')));
    const sidebarFoot = el('div', 'ai-chat-sidebar-foot');
    sidebarFoot.appendChild(clearAllBtn);
    const sidebarList = el('div', 'ai-chat-list');
    if (navPanel) {
      // Two panes behind two tabs: the conversation list, and whatever the
      // host page parked in navPanel (the dashboard passes its navigation).
      let railTab = 'history';
      const railTabs = el('div', 'ai-chat-rail-tabs');
      railTabs.setAttribute('role', 'tablist');
      const historyPane = el('div', 'ai-chat-rail-pane');
      historyPane.appendChild(sidebarHead);
      historyPane.appendChild(sidebarList);
      historyPane.appendChild(sidebarFoot);
      const navPane = el('div', 'ai-chat-rail-pane ai-chat-rail-nav');
      navPane.appendChild(navPanel);
      const tabs = [
        { key: 'history', label: str('history'), pane: historyPane },
        { key: 'nav', label: navLabel, pane: navPane }
      ].map((entry, index) => {
        const tab = button('ai-chat-rail-tab', entry.label, () => {
          if (railTab === entry.key) return;
          // The pane arrives from the side the tab moved towards, which is
          // what the dashboard's own tabs do.
          const from = tabs.findIndex((item) => item.key === railTab);
          railTab = entry.key;
          paintRail(index > from ? 'enter-forward' : 'enter-back');
        });
        tab.setAttribute('role', 'tab');
        railTabs.appendChild(tab);
        return { ...entry, tab, index };
      });
      const paintRail = (direction) => {
        tabs.forEach((entry) => {
          const active = railTab === entry.key;
          entry.tab.classList.toggle('active', active);
          entry.tab.setAttribute('aria-selected', String(active));
          entry.pane.classList.remove('enter-forward', 'enter-back');
          entry.pane.classList.toggle('active', active);
          if (active && direction) entry.pane.classList.add(direction);
        });
      };
      paintRail();
      sidebar.appendChild(railTabs);
      sidebar.appendChild(historyPane);
      sidebar.appendChild(navPane);
    } else {
      sidebar.appendChild(sidebarHead);
      sidebar.appendChild(sidebarList);
      sidebar.appendChild(sidebarFoot);
    }

    const main = el('div', 'ai-chat-main');
    const bar = el('div', 'ai-chat-bar');
    const historyBtn = button('ai-chat-bar-btn', '', () => {
      historyOpen = !historyOpen;
      render();
    });
    // A menu glyph, not a clock: this opens the list of conversations, and the
    // history icon read as "go back to something you were looking at".
    historyBtn.appendChild(icon(MENU, 16));
    historyBtn.title = str('history');
    historyBtn.setAttribute('aria-label', str('history'));
    const barTitle = el('span', 'ai-chat-bar-title', str('chatTitle'));
    const barNewBtn = button('ai-chat-bar-btn', '', () => startNewConversation());
    barNewBtn.appendChild(icon(['M12 5v14', 'M5 12h14'], 15));
    barNewBtn.title = str('newChat');
    barNewBtn.setAttribute('aria-label', str('newChat'));
    bar.appendChild(historyBtn);
    bar.appendChild(barTitle);
    if (openWorkspace) {
      const barWorkspaceBtn = button('ai-chat-bar-btn', '', () => openWorkspace());
      // The "leave for a bigger window" glyph: a box with an arrow escaping
      // its top-right corner.
      barWorkspaceBtn.appendChild(icon([
        'M14 4h6v6', 'M20 4l-8 8',
        'M20 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4'
      ], 15));
      barWorkspaceBtn.title = str('workspaceOpen');
      barWorkspaceBtn.setAttribute('aria-label', str('workspaceOpen'));
      bar.appendChild(barWorkspaceBtn);
    }
    bar.appendChild(barNewBtn);

    const scroll = el('div', 'ai-chat-scroll');
    const flashLine = el('div', 'ai-chat-flash');
    flashLine.setAttribute('role', 'status');
    flashLine.setAttribute('aria-live', 'polite');

    const composer = el('form', 'ai-chat-composer');
    const pendingStrip = el('div', 'ai-chat-attachments');
    const composerRow = el('div', 'ai-chat-composer-row');
    const input = el('textarea', 'ai-chat-input');
    input.rows = 1;
    input.spellcheck = false;
    input.maxLength = maxMessageChars;
    const fileInput = el('input', 'ai-chat-file');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.multiple = true;
    fileInput.hidden = true;
    const attachBtn = button('ai-chat-attach', '', () => fileInput.click());
    attachBtn.appendChild(icon(PAPERCLIP, 16));
    attachBtn.title = str('attach');
    attachBtn.setAttribute('aria-label', str('attach'));
    const sendBtn = button('ai-chat-send', '');
    // One button, two jobs: send when idle, stop while a turn is being
    // generated — the convention every chat app has settled on, and the only
    // discoverable place for "stop paying for tokens I no longer want".
    const sendIcon = icon(['M12 19V5', 'M5 12l7-7 7 7'], 16);
    const stopIcon = icon(['M7 7h10v10H7z'], 14);
    stopIcon.style.display = 'none';
    sendBtn.appendChild(sendIcon);
    sendBtn.appendChild(stopIcon);
    sendBtn.title = str('send');
    sendBtn.setAttribute('aria-label', str('send'));
    composerRow.appendChild(attachBtn);
    composerRow.appendChild(input);
    composerRow.appendChild(sendBtn);
    composer.appendChild(pendingStrip);
    composer.appendChild(composerRow);
    composer.appendChild(fileInput);

    const dropHint = el('div', 'ai-chat-drop', str('dropHint'));

    main.appendChild(bar);
    if (mainHeader) main.appendChild(mainHeader);
    main.appendChild(scroll);
    main.appendChild(flashLine);
    main.appendChild(composer);
    main.appendChild(dropHint);
    host.appendChild(sidebar);
    host.appendChild(main);

    // --- state helpers --------------------------------------------------------

    function active() {
      return byId(activeId);
    }

    // Storage is the source of truth: persist() replaces the whole array with
    // what came back normalized, so any conversation object held across an
    // await is stale by definition. Everything that mutates one looks it up by
    // id at the moment it mutates instead of holding a reference.
    function byId(id) {
      return conversations.find((entry) => entry.id === id) || null;
    }

    async function persist() {
      const saved = await Store.save(browser.storage.local, conversations);
      conversations = saved;
      lastWritten = JSON.stringify(saved);
      if (!active() && saved.length) activeId = saved[0].id;
    }

    function setFlash(text) {
      flash = text || '';
      flashLine.textContent = flash;
      flashLine.classList.toggle('visible', !!flash);
    }

    function scrollToEnd() {
      scroll.scrollTop = scroll.scrollHeight;
    }

    async function copyText(text) {
      try {
        await doc.defaultView.navigator.clipboard.writeText(text);
        setFlash(str('copied'));
      } catch (_) {
        // Clipboard permission is not guaranteed in every browser build, and a
        // failed copy is not worth an error state in the transcript.
      }
    }

    // --- attachments ----------------------------------------------------------

    function thumbnail(image, onRemove) {
      const chip = el('div', 'ai-chat-attachment');
      const src = safeImageSrc(image && image.dataUrl);
      if (!src) return null;
      const thumb = el('img', 'ai-chat-attachment-img');
      thumb.src = src;
      thumb.alt = (image && image.name) || '';
      thumb.draggable = false;
      chip.appendChild(thumb);
      if (image && image.name) chip.title = image.name;
      if (onRemove) {
        const remove = button('ai-chat-attachment-remove', '', onRemove);
        remove.appendChild(icon(CROSS, 11));
        remove.title = str('removeImage');
        remove.setAttribute('aria-label', str('removeImage'));
        chip.appendChild(remove);
      }
      return chip;
    }

    // Repaints itself in place when a chip is removed, so an editor holds one
    // array and one node instead of re-rendering the transcript around it.
    function renderAttachmentStrip(images, editable) {
      const strip = el('div', 'ai-chat-attachments');
      const paint = () => {
        strip.textContent = '';
        images.forEach((image, index) => {
          const chip = thumbnail(image, editable ? () => {
            images.splice(index, 1);
            paint();
          } : null);
          if (chip) strip.appendChild(chip);
        });
      };
      paint();
      return strip;
    }

    function renderComposerAttachments() {
      pendingStrip.textContent = '';
      pendingImages.forEach((image, index) => {
        const chip = thumbnail(image, () => {
          pendingImages.splice(index, 1);
          renderComposerAttachments();
        });
        if (chip) pendingStrip.appendChild(chip);
      });
      attachBtn.hidden = !visionEnabled;
      attachBtn.disabled = busy || !configured || pendingImages.length >= maxImages;
    }

    // One at a time rather than in parallel: each file is decoded and re-encoded
    // through a canvas, and a handful of large photos at once is enough to lock
    // up the popup for a noticeable moment.
    async function addFiles(fileList) {
      if (busy || !configured || !visionEnabled) return;
      const files = Array.from(fileList || []).filter((file) => file && file.type && file.type.startsWith('image/'));
      if (!files.length) return;

      const room = maxImages - pendingImages.length;
      if (files.length > room) setFlash(str('tooManyImages', { count: maxImages }));
      if (room <= 0) return;

      const api = imageApi();
      if (!api || typeof api.prepareChatImage !== 'function') {
        setFlash(str('imageFailed'));
        return;
      }
      for (const file of files.slice(0, room)) {
        try {
          const prepared = await api.prepareChatImage(file);
          pendingImages.push({
            dataUrl: prepared.dataUrl,
            name: prepared.name,
            width: prepared.width,
            height: prepared.height
          });
          renderComposerAttachments();
        } catch (error) {
          // The size limit is the one failure worth naming: it is the only one
          // the user can do something about.
          setFlash(/too large/i.test(String((error && error.message) || error)) ? str('imageTooLarge') : str('imageFailed'));
        }
      }
    }

    function carriesFiles(event) {
      if (!visionEnabled) return false;
      const types = event.dataTransfer && event.dataTransfer.types;
      return !!types && Array.prototype.indexOf.call(types, 'Files') !== -1;
    }

    function setDragging(state) {
      if (dragging === state) return;
      dragging = state;
      host.classList.toggle('dragging', state);
    }

    // --- rendering ------------------------------------------------------------

    function renderSidebar(switched) {
      sidebarFoot.hidden = !conversations.length;
      sidebarList.textContent = '';
      if (!conversations.length) {
        sidebarList.appendChild(el('p', 'ai-chat-list-empty', str('noHistory')));
        return;
      }
      conversations.forEach((conversation) => {
        const isActive = conversation.id === activeId;
        const row = el('div', `ai-chat-list-item${isActive ? ' active' : ''}${isActive && switched ? ' switched' : ''}`);
        const open = button('ai-chat-list-open', '');
        const title = conversation.title || conversation.hostname || str('newChat');
        open.appendChild(el('span', 'ai-chat-list-title', title));
        // Only when it says something the title does not: a conversation named
        // after its site would otherwise show the same hostname twice.
        if (conversation.hostname && conversation.hostname !== title) {
          open.appendChild(el('span', 'ai-chat-list-host', conversation.hostname));
        }
        open.addEventListener('click', () => {
          activeId = conversation.id;
          editingId = '';
          pendingImages = [];
          historyOpen = false;
          render();
          scrollToEnd();
        });
        const remove = button('ai-chat-list-delete', '', async () => {
          if (!doc.defaultView.confirm(str('confirmDelete'))) return;
          conversations = conversations.filter((entry) => entry.id !== conversation.id);
          if (activeId === conversation.id) activeId = conversations.length ? conversations[0].id : '';
          await persist();
          if (!activeId) await startNewConversation();
          else render();
        });
        remove.appendChild(icon(['M3 6h18', 'M8 6V4h8v2', 'M19 6l-1 14H6L5 6', 'M10 11v6', 'M14 11v6'], 13));
        remove.title = str('deleteChat');
        remove.setAttribute('aria-label', str('deleteChat'));
        row.appendChild(open);
        row.appendChild(remove);
        sidebarList.appendChild(row);
      });
    }

    function renderSetup() {
      const card = el('div', 'ai-chat-setup');
      card.appendChild(el('h3', 'ai-chat-setup-title', str('setupTitle')));
      card.appendChild(el('p', 'ai-chat-setup-body', str('setupBody')));
      if (openOnboarding) {
        card.appendChild(button('ai-chat-setup-action', str('setupStart'), () => openOnboarding()));
        card.appendChild(button('ai-chat-setup-alt', str('setupAction'), () => openAiSettings()));
      } else {
        card.appendChild(button('ai-chat-setup-action', str('setupAction'), () => openAiSettings()));
      }
      return card;
    }

    // Shown once, under the first answer, and never again: by then the user
    // has seen the popup do the job and knows what it is they would be taking
    // somewhere bigger. Offering it before that is advertising a room they
    // have no reason to want yet, and offering it every turn is nagging.
    function renderWorkspaceInvite() {
      const card = button('ai-chat-workspace', '', () => openWorkspace());
      const mark = el('span', 'ai-chat-workspace-mark');
      mark.appendChild(icon([
        'M14 4h6v6', 'M20 4l-8 8',
        'M20 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4'
      ], 15));
      card.appendChild(mark);
      const copy = el('span', 'ai-chat-workspace-copy');
      copy.appendChild(el('strong', null, str('workspaceOpen')));
      copy.appendChild(el('span', null, str('workspaceHint')));
      card.appendChild(copy);
      card.appendChild(icon(['m9 6 6 6-6 6'], 14));
      return card;
    }

    function renderEmpty(conversation) {
      const empty = el('div', 'ai-chat-empty');
      empty.appendChild(el('h3', 'ai-chat-empty-title', str('emptyTitle')));
      empty.appendChild(el('p', 'ai-chat-empty-body', str('emptyBody')));
      if (conversation && conversation.hostname) {
        empty.appendChild(el('span', 'ai-chat-empty-host', conversation.hostname));
      }
      const suggestions = el('div', 'ai-chat-suggestions');
      // Chosen once per mount rather than per render: re-rolling them as the
      // transcript repaints would shuffle the buttons under the pointer.
      shownSuggestions.forEach((key) => {
        suggestions.appendChild(button('ai-chat-suggestion', str(key), () => {
          input.value = str(key);
          submit();
        }));
      });
      empty.appendChild(suggestions);
      return empty;
    }

    function renderThemeCard(message) {
      const card = el('div', 'ai-chat-theme');
      const head = el('div', 'ai-chat-theme-head');
      head.appendChild(el('span', 'ai-chat-theme-name', (message.theme && message.theme.themeName) || ''));
      card.appendChild(head);

      const settings = message.settings;
      // A theme built on one of the user's own pictures is shown as that
      // picture: the two gradient chips describe the fallback, not what the
      // page would look like if it were applied. A schedule or a background
      // turned off has no single palette to swatch, so those get their own
      // one-line summary instead of a (misleading, or empty) light/dark pair.
      const wallpaper = settings && settings.type === 'image' ? safeImageSrc(settings.value) : '';
      if (wallpaper) {
        const preview = el('div', 'ai-chat-theme-image');
        const thumb = el('img', 'ai-chat-theme-image-src');
        thumb.src = wallpaper;
        thumb.alt = '';
        preview.appendChild(thumb);
        card.appendChild(preview);
        card.appendChild(el('p', 'ai-chat-theme-meta', str('imageWallpaper')));
      } else if (settings && settings.mode === 'timeRange' && settings.timeRange) {
        const count = Array.isArray(settings.timeRange.items) ? settings.timeRange.items.length : 0;
        card.appendChild(el('p', 'ai-chat-theme-meta', str('timeRangeCount', { count })));
      } else if (settings && settings.mode === 'slideshow' && settings.slideshow) {
        const count = Array.isArray(settings.slideshow.items) ? settings.slideshow.items.length : 0;
        card.appendChild(el('p', 'ai-chat-theme-meta', str('slideshowCount', { count })));
      } else if (settings && settings.mode === 'single' && settings.type === 'none') {
        card.appendChild(el('p', 'ai-chat-theme-meta', str('backgroundOff')));
      } else {
        const swatches = el('div', 'ai-chat-swatches');
        [['light', str('light')], ['dark', str('dark')]].forEach(([slot, label]) => {
          const gradient = swatchGradient(message.theme && message.theme[slot]);
          if (!gradient) return;
          const item = el('div', 'ai-chat-swatch');
          const chip = el('div', 'ai-chat-swatch-chip');
          chip.style.backgroundImage = gradient;
          item.appendChild(chip);
          item.appendChild(el('span', 'ai-chat-swatch-label', label));
          swatches.appendChild(item);
        });
        if (swatches.childNodes.length) card.appendChild(swatches);
      }

      const frosted = message.theme && Array.isArray(message.theme.frostedGlass) ? message.theme.frostedGlass.length : 0;
      if (frosted) card.appendChild(el('p', 'ai-chat-theme-meta', str('frostedCount', { count: frosted })));

      const actions = el('div', 'ai-chat-theme-actions');
      if (onPreview) {
        const isPreviewing = previewId === message.id;
        actions.appendChild(button('ai-chat-theme-btn', isPreviewing ? str('undoPreview') : str('preview'), async () => {
          if (isPreviewing) await stopPreview();
          else await startPreview(message);
        }));
      }
      if (onSaveTheme) {
        const save = button('ai-chat-theme-btn', str('saveTheme'), async () => {
          save.disabled = true;
          try {
            const name = await onSaveTheme(message.settings, message.theme, active());
            setFlash(str('themeSaved', { name: name || '' }));
          } catch (error) {
            save.disabled = false;
            setFlash(String((error && error.message) || error));
          }
        });
        actions.appendChild(save);
      }
      actions.appendChild(button('ai-chat-theme-btn primary', str('apply'), async () => {
        try {
          await onApply(message.settings, active());
          previewId = '';
          setFlash(str('applied'));
          render();
        } catch (error) {
          setFlash(String((error && error.message) || error));
        }
      }));
      card.appendChild(actions);
      return card;
    }

    // PageDye's own settings, proposed rather than applied: this one button
    // changes the extension everywhere, so it is never folded into the theme
    // card and never happens without being pressed.
    function renderPreferencesCard(message) {
      const prefsApi = doc.defaultView && doc.defaultView.PageDyeAiPreferences;
      if (!prefsApi) return null;
      const parts = prefsApi.summarize(message.preferences);
      if (!parts.length) return null;

      const card = el('div', 'ai-chat-prefs');
      card.appendChild(el('h4', 'ai-chat-prefs-title', str('prefsTitle')));
      card.appendChild(el('p', 'ai-chat-prefs-body', str('prefsBody')));

      const list = el('dl', 'ai-chat-prefs-list');
      const labels = {
        accent: 'prefsAccent',
        reduceMotion: 'prefsReduceMotion',
        diagnostics: 'prefsDiagnostics',
        pauseShortcut: 'prefsPauseShortcut'
      };
      parts.forEach((part) => {
        list.appendChild(el('dt', null, str(labels[part.field] || part.field)));
        const value = typeof part.value === 'boolean' ? str(part.value ? 'prefsOn' : 'prefsOff') : String(part.value);
        list.appendChild(el('dd', null, value));
      });
      card.appendChild(list);

      const actions = el('div', 'ai-chat-theme-actions');
      actions.appendChild(button('ai-chat-theme-btn primary', str('prefsApply'), async () => {
        try {
          await onApplyPreferences(message.preferences, active());
          setFlash(str('prefsApplied'));
          render();
        } catch (error) {
          setFlash(String((error && error.message) || error));
        }
      }));
      card.appendChild(actions);
      return card;
    }

    function renderUserMessage(conversation, message) {
      const row = el('div', 'ai-msg ai-msg-user');
      // Not cleared here: submit() and runTurn() each render synchronously
      // before the first paint, so the node this creates is thrown away and
      // rebuilt by runTurn's own render before anyone sees it. runTurn clears
      // the flag once that second render is the one on screen.
      if (message.id === justSentId) row.classList.add('ai-msg-sent');
      const images = Array.isArray(message.images) ? message.images : [];
      // Shown above the bubble in both modes: what was attached is part of the
      // question. Editing works on a copy, where a picture can also be taken
      // off — which is the way out when the model turns out not to read them.
      const edited = editingId === message.id ? images.slice() : images;
      if (edited.length) row.appendChild(renderAttachmentStrip(edited, editingId === message.id));
      if (editingId === message.id) {
        const editor = el('div', 'ai-msg-editor');
        const area = el('textarea', 'ai-chat-input ai-msg-edit-input');
        area.maxLength = maxMessageChars;
        area.value = message.content;
        area.rows = Math.min(8, Math.max(2, message.content.split('\n').length + 1));
        const actions = el('div', 'ai-msg-editor-actions');
        actions.appendChild(button('ai-chat-mini-btn', str('cancel'), () => {
          editingId = '';
          render();
        }));
        actions.appendChild(button('ai-chat-mini-btn primary', str('saveAndResend'), async () => {
          const text = area.value.trim();
          editingId = '';
          // Everything after this message answered a question that no longer
          // exists, so the transcript is rewritten from here.
          conversation.messages = Store.truncateFrom(conversation, message.id);
          const resent = Store.userMessage(text, Date.now(), edited);
          conversation.messages.push(resent);
          conversation.updatedAt = Date.now();
          justSentId = resent.id;
          await persist();
          render();
          await runTurn(conversation.id);
        }));
        editor.appendChild(area);
        editor.appendChild(actions);
        row.appendChild(editor);
        return row;
      }

      // An attachment on its own is a whole message; an empty bubble under it
      // would only be a gap.
      if (message.content || !edited.length) row.appendChild(el('div', 'ai-bubble', message.content));
      const actions = el('div', 'ai-msg-actions');
      actions.appendChild(button('ai-chat-mini-btn', str('edit'), () => {
        editingId = message.id;
        render();
      }));
      actions.appendChild(button('ai-chat-mini-btn', str('copy'), () => copyText(message.content)));
      row.appendChild(actions);
      return row;
    }

    // The model's reasoning. Open while the turn is running — it is the only
    // sign of life on a model that thinks for ten seconds before writing a
    // word — and collapsed once the answer it produced is there to read.
    function renderThinking(text, live) {
      const box = el('details', 'ai-thinking');
      if (live) box.open = true;
      const head = el('summary', 'ai-thinking-head', str(live ? 'reasoningLive' : 'reasoning'));
      box.appendChild(head);
      // Plain text, not markdown: reasoning is full of half-finished lists and
      // stray backticks that a renderer turns into a mess mid-stream.
      const body = el('div', 'ai-thinking-body', text);
      box.appendChild(body);
      // Follows the newest line while it is being written, the way a log does.
      if (live) requestAnimationFrame(() => { body.scrollTop = body.scrollHeight; });
      return box;
    }

    // The measured cost of one turn, as a single muted line: how long it took,
    // how long the first character took to appear, what it spent, and how fast
    // it generated. Parts the endpoint did not report are simply left out.
    function renderStats(stats) {
      const seconds = (ms) => (ms >= 10000 ? String(Math.round(ms / 1000)) : (Math.round(ms / 100) / 10).toFixed(1));
      const parts = [`${seconds(stats.ms)}s`];
      parts.push(str(stats.streamed ? 'statsStreamed' : 'statsOneShot'));
      if (stats.firstTokenMs !== null && stats.firstTokenMs !== undefined) {
        parts.push(str('statsFirstToken', { seconds: seconds(stats.firstTokenMs) }));
      }
      if (stats.outputTokens !== null && stats.outputTokens !== undefined) {
        parts.push(stats.inputTokens === null || stats.inputTokens === undefined
          ? str('statsOutputOnly', { output: stats.outputTokens })
          : str('statsTokens', { input: stats.inputTokens, output: stats.outputTokens }));
      }
      if (stats.tps !== null && stats.tps !== undefined) parts.push(str('statsSpeed', { tps: stats.tps }));
      return el('div', 'ai-msg-stats', parts.join(' · '));
    }

    function renderAssistantMessage(conversation, message) {
      const row = el('div', 'ai-msg ai-msg-assistant');

      if (message.error) {
        const failure = el('div', 'ai-chat-error');
        failure.appendChild(el('span', 'ai-chat-error-text', message.error));
        failure.appendChild(button('ai-chat-mini-btn', str('retry'), async () => {
          conversation.messages = Store.truncateFrom(conversation, message.id);
          await persist();
          render();
          await runTurn(conversation.id);
        }));
        row.appendChild(failure);
        return row;
      }

      if (message.thinking) row.appendChild(renderThinking(message.thinking, false));

      // The assistant's own words are plain prose on the page — no bubble —
      // so a long answer reads like a document instead of a chat log.
      const answer = el('div', 'ai-answer');
      Markdown.renderInto(answer, message.reply);
      row.appendChild(answer);

      if (message.theme && message.settings && message.themeChanged) row.appendChild(renderThemeCard(message));
      if (message.preferences && onApplyPreferences) {
        const prefsCard = renderPreferencesCard(message);
        if (prefsCard) row.appendChild(prefsCard);
      }

      const actions = el('div', 'ai-msg-actions');
      actions.appendChild(button('ai-chat-mini-btn', str('regenerate'), async () => {
        conversation.messages = Store.truncateFrom(conversation, message.id);
        await persist();
        render();
        await runTurn(conversation.id);
      }));
      actions.appendChild(button('ai-chat-mini-btn', str('copy'), () => copyText(message.reply)));
      row.appendChild(actions);
      if (message.stats) row.appendChild(renderStats(message.stats));
      return row;
    }

    function renderPending(conversation) {
      const row = el('div', 'ai-msg ai-msg-assistant');
      pendingNodes = { thinking: null, answer: null };
      // Reasoning shows above whichever of the two follows it, because that is
      // the order it was written in.
      if (streamingThinking) {
        const box = renderThinking(streamingThinking, true);
        pendingNodes.thinking = box.querySelector('.ai-thinking-body');
        row.appendChild(box);
      }
      // Once text is arriving it replaces the spinner entirely: two indicators
      // for one turn is noise, and the words are the better progress bar.
      if (streamingReply) {
        const answer = el('div', 'ai-answer ai-answer-streaming');
        Markdown.renderInto(answer, streamingReply);
        pendingNodes.answer = answer;
        row.appendChild(answer);
        return row;
      }
      const pending = el('div', 'ai-chat-pending');
      pending.appendChild(el('span', 'ai-chat-spinner'));
      const firstTurn = conversation.messages.filter((message) => message.role === 'assistant' && !message.error).length === 0;
      pending.appendChild(el('span', null, str(firstTurn ? 'thinking' : 'thinkingAgain')));
      row.appendChild(pending);
      return row;
    }

    // Writes the newest text into the nodes already on screen. Refuses — and
    // leaves it to render() — when the turn has moved to a different shape,
    // which happens twice at most: when reasoning starts, and when the answer
    // does.
    function updatePending() {
      if (!pendingNodes) return false;
      if (!!streamingThinking !== !!pendingNodes.thinking) return false;
      if (!!streamingReply !== !!pendingNodes.answer) return false;
      const box = pendingNodes.thinking;
      if (box) {
        // Same rule as the transcript: follow the newest line only while the
        // reader was already at the bottom of it.
        const atEnd = box.scrollHeight - box.scrollTop - box.clientHeight < 24;
        box.textContent = streamingThinking;
        if (atEnd) box.scrollTop = box.scrollHeight;
      }
      if (pendingNodes.answer) Markdown.renderInto(pendingNodes.answer, streamingReply);
      return true;
    }

    function render() {
      pendingNodes = null;
      const conversation = active();
      // Whether this render is a different conversation than the one on
      // screen, decided before anything is rebuilt: a turn in flight causes
      // many renders of the same conversation, and only an actual switch is
      // worth animating.
      const switched = activeId !== lastRenderedId;
      lastRenderedId = activeId;
      host.classList.toggle('history-open', historyOpen);
      barTitle.textContent = (conversation && (conversation.title || conversation.hostname)) || str('chatTitle');
      renderSidebar(switched);

      // Switching conversations replaces the whole transcript at once, which
      // reads as a flicker without something to mark it as a different page
      // arriving. Restarted by hand: the scroll node is reused across renders,
      // so nothing about it would re-trigger the animation on its own.
      if (switched) {
        scroll.classList.remove('ai-chat-switching');
        // Reading a layout property is what makes the removal land before the
        // class goes back on; without it the two changes coalesce into none.
        void scroll.offsetWidth;
        scroll.classList.add('ai-chat-switching');
      }

      scroll.textContent = '';
      if (!configured) scroll.appendChild(renderSetup());
      if (conversation && conversation.messages.length) {
        // Exactly one answer so far means the first round just landed, which
        // is the single moment the workspace invitation belongs in — see
        // renderWorkspaceInvite. From the second answer on it is gone.
        const answers = conversation.messages.filter((message) => message.role !== 'user').length;
        const inviteAfterFirstAnswer = !!openWorkspace && answers === 1 && !busy;
        conversation.messages.forEach((message) => {
          const isUser = message.role === 'user';
          scroll.appendChild(isUser
            ? renderUserMessage(conversation, message)
            : renderAssistantMessage(conversation, message));
          if (!isUser && inviteAfterFirstAnswer) scroll.appendChild(renderWorkspaceInvite());
        });
      } else if (configured) {
        scroll.appendChild(renderEmpty(conversation));
      }
      if (busy && conversation) scroll.appendChild(renderPending(conversation));

      const empty = !conversation || !conversation.messages.length;
      // Lets a skin centre the greeting in an empty transcript instead of
      // pinning it to the top; ignored by any skin that does not want to.
      host.classList.toggle('is-empty', empty);
      input.placeholder = str(empty ? 'placeholderFirst' : 'placeholder');
      input.disabled = busy || !configured;
      syncSendButton();
      renderComposerAttachments();

      if (onThemeUpdate) {
        const latest = conversation ? Store.latestTheme(conversation) : null;
        const signature = `${conversation ? conversation.id : ''}:${latest ? latest.id : ''}`;
        if (signature !== lastThemeSignature) {
          lastThemeSignature = signature;
          onThemeUpdate(latest, conversation);
        }
      }
    }

    // The send button flips to a stop square only while there is actually a
    // turn that can be stopped; the sendMessage fallback keeps the old
    // disabled state, because a button that promises to stop and cannot is
    // worse than one that is greyed out.
    function syncSendButton() {
      const stoppable = busy && !!cancelTurn;
      sendBtn.classList.toggle('stop', stoppable);
      sendBtn.disabled = busy ? !stoppable : !configured;
      sendIcon.style.display = stoppable ? 'none' : '';
      stopIcon.style.display = stoppable ? '' : 'none';
      const label = str(stoppable ? 'stop' : 'send');
      sendBtn.title = label;
      sendBtn.setAttribute('aria-label', label);
    }

    // --- preview --------------------------------------------------------------

    async function startPreview(message) {
      if (!onPreview) return;
      try {
        await onPreview(message.settings, active());
        previewId = message.id;
        setFlash(str('previewing'));
        render();
      } catch (error) {
        setFlash(String((error && error.message) || error));
      }
    }

    async function stopPreview() {
      previewId = '';
      setFlash('');
      try {
        if (onRestore) await onRestore(active());
      } catch (_) {
        // Restoring is best-effort: the page can always be reloaded.
      }
      render();
    }

    // --- turns ----------------------------------------------------------------

    // Which page the request describes. A fresh capture whenever the right tab
    // is open, because the page may have changed since the chat started; the
    // profile stored with the conversation otherwise. Neither is required to
    // send the turn: not every request is about a page (PageDye preferences, a
    // brand-new custom effect), and one that IS needs a chance to say so and
    // explain what is missing rather than dead-ending in a client-side error
    // the user can only "Try again" into the same wall — see the "no page"
    // framing this feeds into buildUserPrompt (scripts/ai-theme.js).
    async function resolveProfileArgs(conversation) {
      let target = null;
      try {
        target = await resolveTarget();
      } catch (_) {
        target = null;
      }
      const sameSite = !target || !target.hostname || !conversation.hostname || target.hostname === conversation.hostname;
      if (target && Number.isInteger(target.tabId) && sameSite) return { tabId: target.tabId };
      if (conversation.profile) return { profile: conversation.profile };
      return {};
    }

    function friendlyError(message) {
      // The two configuration failures point at the same fix and get the
      // onboarding card back; everything else is a server or network message
      // worth showing verbatim rather than flattening into "an error occurred".
      if (/No API key|No model/i.test(message)) {
        configured = false;
        return str('setupBody');
      }
      // The endpoint's own words are kept after the explanation: "content must
      // be a string" means nothing on its own, but it is what a user searching
      // their provider's docs will match on.
      const rejectedImage = message.match(/^This model or endpoint did not accept an attached image\.\s*(.*)$/is);
      if (rejectedImage) return `${str('imagesUnsupported')} ${rejectedImage[1]}`.trim();
      return message || str('failed');
    }

    // One turn, over a port so the reply can arrive in pieces. Resolves with
    // the same object the one-shot path used to return, so everything
    // downstream — the store, the theme card, the error handling — is unchanged.
    //
    // Falls back to sendMessage when the port cannot be opened at all (an older
    // service worker, or a test harness that only mocks sendMessage), because a
    // turn that works without streaming beats a turn that does not work.
    function requestTurn(payload, onDelta, onThinking) {
      const connect = browser.runtime && browser.runtime.connect;
      if (typeof connect !== 'function') {
        return browser.runtime.sendMessage({ action: 'pagedyeAiChat', ...payload });
      }

      let port;
      try {
        port = browser.runtime.connect({ name: 'pagedye-ai-chat-stream' });
      } catch (_) {
        return browser.runtime.sendMessage({ action: 'pagedyeAiChat', ...payload });
      }

      return new Promise((resolve, reject) => {
        let settled = false;
        const finish = (fn, value) => {
          if (settled) return;
          settled = true;
          cancelTurn = null;
          try {
            port.disconnect();
          } catch (_) {
            // Already disconnected, which is the state we wanted.
          }
          fn(value);
        };

        // Disconnecting is the abort: the worker cancels the request the
        // moment its end of the port closes. Resolved rather than rejected —
        // a stop is an outcome the user asked for, not a failure.
        cancelTurn = () => finish(resolve, { ok: true, stopped: true });

        port.onMessage.addListener((message) => {
          if (!message) return;
          if (message.type === 'delta') {
            onDelta(String(message.reply || ''));
            return;
          }
          if (message.type === 'thinking') {
            onThinking(String(message.thinking || ''));
            return;
          }
          if (message.type === 'done') finish(resolve, message);
        });

        // The worker can be torn down mid-turn, and a disconnect with nothing
        // delivered would otherwise hang the chat on its spinner forever.
        port.onDisconnect.addListener(() => {
          finish(reject, new Error(str('failed')));
        });

        port.postMessage({ action: 'start', ...payload });
        syncSendButton();
      });
    }

    async function runTurn(conversationId) {
      if (busy) return;
      const conversation = byId(conversationId);
      if (!conversation) return;
      busy = true;
      streamingReply = '';
      streamingThinking = '';
      setFlash('');
      render();
      // This render (not submit's, which lands before the first paint) is the
      // one that actually reaches the screen, so the send animation's job is
      // done — clear before the streaming renders below rebuild the same row
      // again and would otherwise replay it.
      justSentId = '';
      scrollToEnd();

      try {
        const args = await resolveProfileArgs(conversation);
        // Both callbacks do the same bookkeeping around one assignment, so
        // what is worth explaining is written once here.
        const stream = (apply) => {
          // Ignore a straggling delta from a turn that is no longer the one
          // on screen: switching conversations mid-request is allowed.
          if (!busy || activeId !== conversationId) return;
          const atEnd = scroll.scrollHeight - scroll.scrollTop - scroll.clientHeight < 40;
          apply();
          if (!updatePending()) render();
          // Only follow along while the reader was already at the bottom, so
          // scrolling up to re-read something is not fought by every chunk.
          if (atEnd) scrollToEnd();
        };
        const response = await requestTurn(
          { turns: Store.toTurns(conversation), ...args },
          (text) => stream(() => { streamingReply = text; }),
          (text) => stream(() => { streamingThinking = text; })
        );
        if (!response) throw new Error(str('failed'));
        if (!response.ok) throw new Error(response.error || str('failed'));
        // The user pressed stop. What had already streamed in is kept as the
        // answer — it is what they read while deciding to stop — and a turn
        // stopped before any text arrived simply leaves no message.
        if (response.stopped) {
          const at = Date.now();
          const target = byId(conversationId);
          if (!target) return;
          const partial = streamingReply.trim();
          if (partial) {
            target.messages.push(Store.assistantMessage({ reply: partial, thinking: streamingThinking }, at));
            target.updatedAt = at;
            await persist();
          }
          streamingReply = '';
          streamingThinking = '';
          busy = false;
          setFlash(str('stopped'));
          render();
          scrollToEnd();
          return;
        }
        // The endpoint refused to stream and the turn was quietly re-sent
        // one-shot. Worth saying: otherwise a working fallback is
        // indistinguishable from streaming being broken. Held rather than
        // shown here because the auto-preview below writes to the same line.
        const streamNotice = streamingEnabled && response.streamed === false && response.streamFallback
          ? str('streamFallback', { reason: response.streamFallback })
          : '';
        if (streamNotice) setFlash(streamNotice);

        const at = Date.now();
        const target = byId(conversationId);
        // The conversation can be deleted from another window mid-request.
        if (!target) return;
        if (response.profile) {
          target.profile = response.profile;
          if (!target.hostname && response.profile.hostname) target.hostname = response.profile.hostname;
        }
        const message = Store.assistantMessage(response, at);
        target.messages.push(message);
        target.updatedAt = at;
        await persist();
        streamingReply = '';
        streamingThinking = '';
        busy = false;
        render();
        scrollToEnd();
        // The popup paints a new theme on the live tab straight away: seeing it
        // is the whole point, and nothing is written to storage until Apply.
        if (onPreview && config.autoPreview && message.settings && message.themeChanged) await startPreview(message);
        // Why the answer arrived all at once outlives "previewing…", which the
        // painted page says by itself.
        if (streamNotice) setFlash(streamNotice);
      } catch (error) {
        const at = Date.now();
        const target = byId(conversationId);
        if (!target) return;
        target.messages.push(Store.assistantMessage({
          error: friendlyError(String((error && error.message) || error))
        }, at));
        target.updatedAt = at;
        await persist();
        streamingReply = '';
        streamingThinking = '';
        busy = false;
        render();
        scrollToEnd();
      } finally {
        streamingReply = '';
        streamingThinking = '';
        busy = false;
        cancelTurn = null;
      }
    }

    async function submit() {
      if (busy || !configured) return;
      if (ensureAiDataConsent && !(await ensureAiDataConsent())) {
        setFlash(str('dataConsentRequired'));
        return;
      }
      let conversation = active();
      if (!conversation) conversation = await startNewConversation({ silent: true });

      const text = input.value.trim();
      const images = pendingImages.slice();
      // An empty first message is a legitimate request — "just design one" —
      // but an empty follow-up is a stray Enter, unless a picture came with it.
      if (!text && !images.length && conversation.messages.length) return;

      input.value = '';
      pendingImages = [];
      renderComposerAttachments();
      resizeInput();
      const at = Date.now();
      const sent = Store.userMessage(text, at, images);
      conversation.messages.push(sent);
      conversation.updatedAt = at;
      if (!conversation.title) conversation.title = Store.deriveTitle(conversation);
      justSentId = sent.id;
      await persist();
      render();
      scrollToEnd();
      await runTurn(conversation.id);
    }

    async function startNewConversation({ silent = false } = {}) {
      let hostname = '';
      try {
        const target = await resolveTarget();
        hostname = (target && target.hostname) || '';
      } catch (_) {
        hostname = '';
      }
      const conversation = Store.createConversation({ hostname, at: Date.now() });
      conversations = [conversation, ...conversations];
      activeId = conversation.id;
      editingId = '';
      previewId = '';
      pendingImages = [];
      historyOpen = false;
      await persist();
      if (!silent) {
        render();
        input.focus();
      }
      return active() || conversation;
    }

    // --- composer -------------------------------------------------------------

    function resizeInput() {
      input.style.height = 'auto';
      input.style.height = `${Math.min(160, input.scrollHeight)}px`;
    }

    composer.addEventListener('submit', (event) => {
      event.preventDefault();
      submit();
    });
    sendBtn.addEventListener('click', (event) => {
      event.preventDefault();
      if (busy) {
        if (cancelTurn) cancelTurn();
        return;
      }
      submit();
    });
    input.addEventListener('input', resizeInput);
    fileInput.addEventListener('change', () => {
      // Copied out before the reset: `files` is live, and clearing the input
      // empties the very list this is holding.
      const files = Array.from(fileInput.files || []);
      // Cleared so choosing the same file twice in a row still fires.
      fileInput.value = '';
      addFiles(files);
    });
    // A screenshot goes to the clipboard, not to a file, so pasting one has to
    // work or half the images a user would want to send are out of reach.
    input.addEventListener('paste', (event) => {
      const files = Array.from((event.clipboardData && event.clipboardData.files) || []);
      if (!files.length) return;
      event.preventDefault();
      addFiles(files);
    });
    ['dragenter', 'dragover'].forEach((type) => {
      main.addEventListener(type, (event) => {
        if (!carriesFiles(event)) return;
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
        setDragging(true);
      });
    });
    main.addEventListener('dragleave', (event) => {
      // Only the pointer actually leaving the panel counts; crossing between
      // children fires dragleave too.
      if (event.target === main || !main.contains(event.relatedTarget)) setDragging(false);
    });
    main.addEventListener('drop', (event) => {
      if (!carriesFiles(event)) return;
      event.preventDefault();
      setDragging(false);
      addFiles(event.dataTransfer.files);
    });
    input.addEventListener('keydown', (event) => {
      // Enter sends, Shift+Enter is a newline — the convention every chat UI
      // shares. isComposing keeps an IME candidate selection from sending.
      if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return;
      event.preventDefault();
      submit();
    });

    // --- boot -----------------------------------------------------------------

    async function readConfig() {
      const normalized = await globalThis.PageDyeAiTheme.loadConfig(browser.storage.local);
      configured = !!(normalized.apiKey && normalized.model);
      visionEnabled = normalized.vision === true;
      streamingEnabled = normalized.streaming !== false;
      // Turning it off mid-composition drops what was staged: it could not be
      // sent, and leaving it on screen next to a hidden button is a puzzle.
      if (!visionEnabled && pendingImages.length) pendingImages = [];
    }

    async function start() {
      await readConfig();
      conversations = await Store.load(browser.storage.local);
      lastWritten = JSON.stringify(conversations);

      // The popup opens on the page the user is looking at, so it lands in that
      // site's most recent conversation rather than whatever was last touched.
      let preferred = conversations[0] || null;
      if (variant === 'popup') {
        try {
          const target = await resolveTarget();
          if (target && target.hostname) {
            preferred = conversations.find((entry) => entry.hostname === target.hostname) || null;
          }
        } catch (_) {
          preferred = conversations[0] || null;
        }
      }
      if (preferred) activeId = preferred.id;
      else await startNewConversation({ silent: true });

      render();
      resizeInput();
      scrollToEnd();
    }

    if (browser && browser.storage && browser.storage.onChanged) {
      browser.storage.onChanged.addListener((changes, area) => {
        if (area !== 'local') return;
        if (Object.prototype.hasOwnProperty.call(changes, AI_CONFIG_KEY)) {
          readConfig().then(render).catch(() => {});
        }
        // A second window editing the same history should not stomp a turn in
        // flight, and our own writes are recognised rather than re-applied.
        if (Object.prototype.hasOwnProperty.call(changes, Store.STORAGE_KEY) && !busy) {
          const incoming = JSON.stringify(Store.normalizeConversations(changes[Store.STORAGE_KEY].newValue));
          if (incoming === lastWritten) return;
          Store.load(browser.storage.local).then((list) => {
            conversations = list;
            lastWritten = JSON.stringify(list);
            if (!active() && list.length) activeId = list[0].id;
            render();
          }).catch(() => {});
        }
      });
    }

    const ready = start().catch((error) => {
      setFlash(String((error && error.message) || error));
    });

    return {
      ready,
      render,
      // preventScroll because the popup mounts this inside a horizontally
      // sliding panel: a plain focus() scrolls the composer into view, which
      // scrolls that slider's overflow:hidden viewport and leaves every tab
      // offset afterwards.
      focus: () => input.focus({ preventScroll: true }),
      newConversation: () => startNewConversation()
    };
  }

  return Object.freeze({ STRINGS, mount, swatchGradient });
});
