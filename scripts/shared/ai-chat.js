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
      thinking: 'Reading the page and designing…',
      thinkingAgain: 'Working on your change…',
      emptyTitle: 'Design a background by chatting',
      emptyBody: 'It reads the colours and layout of the page you are on — never its text — and proposes a wallpaper that keeps the site readable. Ask for changes in plain language.',
      suggestionCalm: 'Something calm and low contrast',
      suggestionDark: 'A dark theme that matches this site',
      suggestionSurprise: 'Surprise me',
      setupTitle: 'Add an API key to start',
      setupBody: 'The chat runs on your own API key — Anthropic, or any OpenAI-compatible endpoint. Nothing is sent anywhere until you add one.',
      setupAction: 'Open AI settings',
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
      previewing: 'Previewing — not saved yet.',
      frostedCount: 'Frosted glass: {count}',
      light: 'Light',
      dark: 'Dark',
      backgroundOff: 'Background turned off',
      timeRangeCount: 'Changes through the day: {count} periods',
      slideshowCount: 'Slideshow: {count} slides',
      noTarget: 'Open the page you want a theme for, then try again.',
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
      thinking: '正在读取页面并设计…',
      thinkingAgain: '正在按你的要求修改…',
      emptyTitle: '用聊天的方式设计背景',
      emptyBody: '它会读取当前页面的配色和布局（不会读取正文内容），给出一套不影响阅读的背景方案。想改哪里，直接用大白话说。',
      suggestionCalm: '来点安静、低对比度的',
      suggestionDark: '做一个和这个网站搭的深色主题',
      suggestionSurprise: '随便来一个惊喜',
      setupTitle: '先填一个 API 密钥',
      setupBody: '对话使用你自己的 API 密钥，支持 Anthropic 和任意 OpenAI 兼容接口。在你填写之前，不会向任何地方发送数据。',
      setupAction: '打开 AI 设置',
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
      previewing: '正在预览，尚未保存。',
      frostedCount: '磨砂玻璃：{count} 处',
      light: '浅色',
      dark: '深色',
      backgroundOff: '背景已关闭',
      timeRangeCount: '按时段切换：{count} 个时段',
      slideshowCount: '轮播：{count} 张',
      noTarget: '请先打开你想配背景的网页，然后再试一次。',
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
    // The generator trims a message to this before sending, so the field stops
    // there too rather than silently dropping the tail of a long one.
    const maxMessageChars = (globalThis.PageDyeAiTheme && globalThis.PageDyeAiTheme.MAX_INSTRUCTION_CHARS) || 1000;

    function str(key, vars) {
      const value = (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.en[key] || key;
      return vars ? value.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match)) : value;
    }

    let conversations = [];
    let activeId = '';
    let busy = false;
    let editingId = '';
    let previewId = '';
    let configured = false;
    // Whether the configured model reads images, answered by the user in AI
    // settings. Nothing can ask an endpoint, and a model that cannot see one
    // rejects the whole message, so the attachment button is not offered until
    // someone has said it is safe to.
    let visionEnabled = false;
    // Wide options screens show the list as a permanent column via CSS, so this
    // only drives the overlay the popup and narrow screens use.
    let historyOpen = false;
    let lastWritten = '';
    let flash = '';
    // Attachments picked but not sent yet. They belong to the composer, not to
    // a conversation, so switching conversations clears them.
    let pendingImages = [];
    let dragging = false;

    // --- structure ------------------------------------------------------------

    host.classList.add('ai-chat', `ai-chat-${variant}`);
    host.textContent = '';

    const sidebar = el('div', 'ai-chat-sidebar');
    const sidebarHead = el('div', 'ai-chat-sidebar-head');
    const newChatBtn = button('ai-chat-new', '', () => startNewConversation());
    newChatBtn.appendChild(icon(['M12 5v14', 'M5 12h14'], 14));
    newChatBtn.appendChild(el('span', null, str('newChat')));
    const sidebarHeadActions = el('div', 'ai-chat-sidebar-head-actions');
    const clearAllBtn = button('ai-chat-clear-all', '', async () => {
      if (!conversations.length) return;
      if (!doc.defaultView.confirm(str('confirmClearAll'))) return;
      conversations = [];
      activeId = '';
      await persist();
      await startNewConversation();
    });
    clearAllBtn.appendChild(icon(['M3 6h18', 'M8 6V4h8v2', 'M19 6l-1 14H6L5 6', 'M10 11v6', 'M14 11v6'], 13));
    clearAllBtn.title = str('clearAll');
    clearAllBtn.setAttribute('aria-label', str('clearAll'));
    sidebarHeadActions.appendChild(clearAllBtn);
    sidebarHeadActions.appendChild(newChatBtn);
    sidebarHead.appendChild(el('span', 'ai-chat-sidebar-title', str('history')));
    sidebarHead.appendChild(sidebarHeadActions);
    const sidebarList = el('div', 'ai-chat-list');
    sidebar.appendChild(sidebarHead);
    sidebar.appendChild(sidebarList);

    const main = el('div', 'ai-chat-main');
    const bar = el('div', 'ai-chat-bar');
    const historyBtn = button('ai-chat-bar-btn', '', () => {
      historyOpen = !historyOpen;
      render();
    });
    historyBtn.appendChild(icon(['M3 12a9 9 0 1 0 3-6.7L3 8', 'M3 3v5h5', 'M12 7v5l3 2'], 15));
    historyBtn.title = str('history');
    historyBtn.setAttribute('aria-label', str('history'));
    const barTitle = el('span', 'ai-chat-bar-title', str('chatTitle'));
    const barNewBtn = button('ai-chat-bar-btn', '', () => startNewConversation());
    barNewBtn.appendChild(icon(['M12 5v14', 'M5 12h14'], 15));
    barNewBtn.title = str('newChat');
    barNewBtn.setAttribute('aria-label', str('newChat'));
    bar.appendChild(historyBtn);
    bar.appendChild(barTitle);
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
    sendBtn.appendChild(icon(['M12 19V5', 'M5 12l7-7 7 7'], 16));
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

    function renderSidebar() {
      clearAllBtn.hidden = !conversations.length;
      sidebarList.textContent = '';
      if (!conversations.length) {
        sidebarList.appendChild(el('p', 'ai-chat-list-empty', str('noHistory')));
        return;
      }
      conversations.forEach((conversation) => {
        const row = el('div', `ai-chat-list-item${conversation.id === activeId ? ' active' : ''}`);
        const open = button('ai-chat-list-open', '');
        open.appendChild(el('span', 'ai-chat-list-title', conversation.title || conversation.hostname || str('newChat')));
        if (conversation.hostname) open.appendChild(el('span', 'ai-chat-list-host', conversation.hostname));
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
      card.appendChild(button('ai-chat-setup-action', str('setupAction'), () => openAiSettings()));
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
      ['suggestionCalm', 'suggestionDark', 'suggestionSurprise'].forEach((key) => {
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

    function renderUserMessage(conversation, message) {
      const row = el('div', 'ai-msg ai-msg-user');
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
          conversation.messages.push(Store.userMessage(text, Date.now(), edited));
          conversation.updatedAt = Date.now();
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

      // The assistant's own words are plain prose on the page — no bubble —
      // so a long answer reads like a document instead of a chat log.
      const answer = el('div', 'ai-answer');
      Markdown.renderInto(answer, message.reply);
      row.appendChild(answer);

      if (message.theme && message.settings && message.themeChanged) row.appendChild(renderThemeCard(message));

      const actions = el('div', 'ai-msg-actions');
      actions.appendChild(button('ai-chat-mini-btn', str('regenerate'), async () => {
        conversation.messages = Store.truncateFrom(conversation, message.id);
        await persist();
        render();
        await runTurn(conversation.id);
      }));
      actions.appendChild(button('ai-chat-mini-btn', str('copy'), () => copyText(message.reply)));
      row.appendChild(actions);
      return row;
    }

    function renderPending(conversation) {
      const row = el('div', 'ai-msg ai-msg-assistant');
      const pending = el('div', 'ai-chat-pending');
      pending.appendChild(el('span', 'ai-chat-spinner'));
      const firstTurn = conversation.messages.filter((message) => message.role === 'assistant' && !message.error).length === 0;
      pending.appendChild(el('span', null, str(firstTurn ? 'thinking' : 'thinkingAgain')));
      row.appendChild(pending);
      return row;
    }

    function render() {
      const conversation = active();
      host.classList.toggle('history-open', historyOpen);
      barTitle.textContent = (conversation && (conversation.title || conversation.hostname)) || str('chatTitle');
      renderSidebar();

      scroll.textContent = '';
      if (!configured) scroll.appendChild(renderSetup());
      if (conversation && conversation.messages.length) {
        conversation.messages.forEach((message) => {
          scroll.appendChild(message.role === 'user'
            ? renderUserMessage(conversation, message)
            : renderAssistantMessage(conversation, message));
        });
      } else if (configured) {
        scroll.appendChild(renderEmpty(conversation));
      }
      if (busy && conversation) scroll.appendChild(renderPending(conversation));

      const empty = !conversation || !conversation.messages.length;
      input.placeholder = str(empty ? 'placeholderFirst' : 'placeholder');
      input.disabled = busy || !configured;
      sendBtn.disabled = busy || !configured;
      renderComposerAttachments();
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
    // profile stored with the conversation otherwise, so a conversation about
    // a tab the user has since closed still answers.
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
      throw new Error(str('noTarget'));
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

    async function runTurn(conversationId) {
      if (busy) return;
      const conversation = byId(conversationId);
      if (!conversation) return;
      busy = true;
      setFlash('');
      render();
      scrollToEnd();

      try {
        const args = await resolveProfileArgs(conversation);
        const response = await browser.runtime.sendMessage({
          action: 'pagedyeAiChat',
          turns: Store.toTurns(conversation),
          ...args
        });
        if (!response) throw new Error(str('failed'));
        if (!response.ok) throw new Error(response.error || str('failed'));

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
        busy = false;
        render();
        scrollToEnd();
        // The popup paints a new theme on the live tab straight away: seeing it
        // is the whole point, and nothing is written to storage until Apply.
        if (onPreview && config.autoPreview && message.settings && message.themeChanged) await startPreview(message);
      } catch (error) {
        const at = Date.now();
        const target = byId(conversationId);
        if (!target) return;
        target.messages.push(Store.assistantMessage({
          error: friendlyError(String((error && error.message) || error))
        }, at));
        target.updatedAt = at;
        await persist();
        busy = false;
        render();
        scrollToEnd();
      } finally {
        busy = false;
      }
    }

    async function submit() {
      if (busy || !configured) return;
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
      conversation.messages.push(Store.userMessage(text, at, images));
      conversation.updatedAt = at;
      if (!conversation.title) conversation.title = Store.deriveTitle(conversation);
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
      const data = await browser.storage.local.get(AI_CONFIG_KEY);
      const normalized = globalThis.PageDyeAiTheme.normalizeConfig(data && data[AI_CONFIG_KEY]);
      configured = !!(normalized.apiKey && normalized.model);
      visionEnabled = normalized.vision === true;
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
