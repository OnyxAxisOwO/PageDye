// Conversation storage for the AI chat.
//
// The API is stateless: every turn re-sends the whole transcript. That is what
// makes "edit an earlier message and run again" a matter of truncating an
// array rather than of reconciling server-side state, so the transcript kept
// here IS the conversation — nothing about it lives anywhere else.
//
// Everything read back out of chrome.storage.local goes through
// normalizeConversations() first. The stored blob is a plain JSON object a
// user can overwrite via an imported backup or a second extension, and the
// theme inside it is fed to the wallpaper renderer, so it is treated as
// untrusted input on the way in rather than assumed to be what this file last
// wrote. The theme itself is re-validated a second time by ai-theme's
// sanitizeTheme and a third by storage-schema's normalizeSiteSettings before
// any of it reaches a page.
//
// Loaded as a plain global-scope script (no bundler in this codebase), with
// the same globalThis wrapper as storage-schema.js.

(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.PageDyeAiChatStore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const STORAGE_KEY = '__pagedye_ai_chats__';

  // Chat history is convenience, not data the user would miss a backup of, so
  // the caps are set low enough that a long-running install cannot quietly
  // grow a multi-megabyte value in local storage.
  const MAX_CONVERSATIONS = 30;
  const MAX_MESSAGES = 80;
  const MAX_CONTENT_CHARS = 4000;
  const MAX_TITLE_CHARS = 60;

  // Attachments. The data URL is the picture itself, so these are the caps
  // that decide how large the stored history can get: scripts/image.js keeps
  // one attachment under a megabyte, and a conversation stops carrying the
  // pixels of its older ones once the budget below is used up. Dropping the
  // oldest first matches how the model already sees the conversation, which
  // trims from the same end.
  const MAX_IMAGES_PER_MESSAGE = 4;
  const MAX_IMAGE_CHARS = 2 * 1024 * 1024;
  const MAX_CONVERSATION_IMAGE_CHARS = 10 * 1024 * 1024;
  // Only what both provider shapes accept, and only base64 — a data URL is
  // spliced into an <img> src in the transcript and posted to the API, so a
  // permissive parse here is a hole in both places at once.
  const IMAGE_DATA_URL_RE = /^data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+=*$/;

  function isPlainObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  function trimTo(value, limit) {
    return typeof value === 'string' ? value.slice(0, limit) : '';
  }

  function newId() {
    const crypto = typeof globalThis !== 'undefined' ? globalThis.crypto : null;
    if (crypto && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  }

  function normalizeImage(raw) {
    if (!isPlainObject(raw)) return null;
    const dataUrl = typeof raw.dataUrl === 'string' ? raw.dataUrl : '';
    if (dataUrl.length > MAX_IMAGE_CHARS || !IMAGE_DATA_URL_RE.test(dataUrl)) return null;
    const image = { dataUrl, name: trimTo(raw.name, 80) };
    if (Number.isFinite(raw.width) && Number.isFinite(raw.height)) {
      image.width = Math.max(0, Math.round(raw.width));
      image.height = Math.max(0, Math.round(raw.height));
    }
    return image;
  }

  function normalizeImages(raw) {
    return (Array.isArray(raw) ? raw : []).map(normalizeImage).filter(Boolean).slice(0, MAX_IMAGES_PER_MESSAGE);
  }

  // The pictures are kept for the newest messages and dropped from the oldest
  // once the budget is spent. The message itself stays: a bubble that says
  // what was asked reads better than a gap in the transcript.
  function trimImageBudget(messages) {
    let spent = 0;
    for (let index = messages.length - 1; index >= 0; index--) {
      const message = messages[index];
      if (!message.images || !message.images.length) continue;
      const kept = [];
      for (const image of message.images) {
        if (spent + image.dataUrl.length > MAX_CONVERSATION_IMAGE_CHARS) break;
        spent += image.dataUrl.length;
        kept.push(image);
      }
      message.images = kept;
    }
    return messages;
  }

  // What the turn cost and how fast it was, as ai-theme measured it. Kept with
  // the message so the numbers survive a reload; every field is optional
  // because plenty of endpoints report no token counts at all.
  const MAX_THINKING_CHARS = 12000;

  function normalizeStats(raw) {
    if (!isPlainObject(raw)) return null;
    const count = (value) => (Number.isFinite(value) && value >= 0 ? value : null);
    const stats = {
      ms: count(raw.ms),
      firstTokenMs: count(raw.firstTokenMs),
      streamed: raw.streamed === true,
      inputTokens: count(raw.inputTokens),
      outputTokens: count(raw.outputTokens),
      tps: count(raw.tps)
    };
    return stats.ms === null ? null : stats;
  }

  function normalizeMessage(raw) {
    if (!isPlainObject(raw)) return null;
    const id = typeof raw.id === 'string' && raw.id ? raw.id.slice(0, 64) : newId();
    const at = Number.isFinite(raw.at) ? raw.at : 0;

    if (raw.role === 'user') {
      const content = trimTo(raw.content, MAX_CONTENT_CHARS);
      return { id, role: 'user', content, images: normalizeImages(raw.images), at };
    }
    if (raw.role !== 'assistant') return null;

    return {
      id,
      role: 'assistant',
      reply: trimTo(raw.reply, MAX_CONTENT_CHARS),
      themeChanged: !!raw.themeChanged,
      // Shapes are checked by ai-theme/storage-schema at use time; the store
      // only guarantees "an object or nothing".
      theme: isPlainObject(raw.theme) ? raw.theme : null,
      settings: isPlainObject(raw.settings) ? raw.settings : null,
      // PageDye's own preferences the answer proposed, kept so the apply
      // button survives a reload. Re-validated by ai-theme before it is
      // written, the same as `settings`.
      preferences: isPlainObject(raw.preferences) ? raw.preferences : null,
      stats: normalizeStats(raw.stats),
      // The model's own reasoning, shown collapsed under the answer.
      thinking: trimTo(raw.thinking, MAX_THINKING_CHARS),
      error: trimTo(raw.error, 400),
      at
    };
  }

  // The visible title, which is the first thing the user recognises a
  // conversation by: their own opening line if they wrote one, the site
  // otherwise. Stored rather than derived so a rename sticks.
  function deriveTitle(conversation) {
    const first = conversation.messages.find((message) => message.role === 'user' && message.content.trim());
    if (first) return first.content.trim().replace(/\s+/g, ' ').slice(0, MAX_TITLE_CHARS);
    return conversation.hostname || '';
  }

  function normalizeConversation(raw) {
    if (!isPlainObject(raw)) return null;
    const messages = trimImageBudget((Array.isArray(raw.messages) ? raw.messages : [])
      .map(normalizeMessage)
      .filter(Boolean)
      .slice(-MAX_MESSAGES));

    const conversation = {
      id: typeof raw.id === 'string' && raw.id ? raw.id.slice(0, 64) : newId(),
      hostname: trimTo(raw.hostname, 255),
      title: trimTo(raw.title, MAX_TITLE_CHARS),
      // The profile captured when the chat began, replayed when the tab it was
      // captured from is gone. Without it a conversation stops working the
      // moment the user closes the page it is about.
      profile: isPlainObject(raw.profile) ? raw.profile : null,
      messages,
      createdAt: Number.isFinite(raw.createdAt) ? raw.createdAt : 0,
      updatedAt: Number.isFinite(raw.updatedAt) ? raw.updatedAt : 0
    };
    if (!conversation.title) conversation.title = deriveTitle(conversation);
    return conversation;
  }

  function normalizeConversations(raw) {
    const list = Array.isArray(raw) ? raw : (isPlainObject(raw) && Array.isArray(raw.conversations) ? raw.conversations : []);
    return list
      .map(normalizeConversation)
      .filter(Boolean)
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
      .slice(0, MAX_CONVERSATIONS);
  }

  function createConversation({ hostname = '', profile = null, at = 0 } = {}) {
    return {
      id: newId(),
      hostname: trimTo(hostname, 255),
      title: trimTo(hostname, MAX_TITLE_CHARS),
      profile: isPlainObject(profile) ? profile : null,
      messages: [],
      createdAt: at,
      updatedAt: at
    };
  }

  function userMessage(content, at = 0, images = []) {
    return { id: newId(), role: 'user', content: trimTo(content, MAX_CONTENT_CHARS), images: normalizeImages(images), at };
  }

  function assistantMessage(answer, at = 0) {
    const source = isPlainObject(answer) ? answer : {};
    return {
      id: newId(),
      role: 'assistant',
      reply: trimTo(source.reply, MAX_CONTENT_CHARS),
      themeChanged: !!source.themeChanged,
      theme: isPlainObject(source.theme) ? source.theme : null,
      settings: isPlainObject(source.settings) ? source.settings : null,
      preferences: isPlainObject(source.preferences) ? source.preferences : null,
      stats: normalizeStats(source.stats),
      thinking: trimTo(source.thinking, MAX_THINKING_CHARS),
      error: trimTo(source.error, 400),
      at
    };
  }

  // What the model is shown. Failed turns are left out entirely: replaying "I
  // could not reach the API" as though the assistant had said it teaches the
  // model that refusing is a valid answer shape.
  function toTurns(conversation) {
    return (conversation && Array.isArray(conversation.messages) ? conversation.messages : [])
      .filter((message) => message.role === 'user' || (!message.error && (message.reply || message.theme)))
      .map((message) => {
        if (message.role !== 'user') {
          return { role: 'assistant', reply: message.reply, themeChanged: message.themeChanged, theme: message.theme };
        }
        // Omitted rather than sent empty: a turn with no attachment is the
        // common case, and an empty array would travel on every one of them.
        const turn = { role: 'user', content: message.content };
        if (message.images && message.images.length) turn.images = message.images;
        return turn;
      });
  }

  // Editing a message rewrites history from that point: everything after it
  // was an answer to a question that no longer exists.
  function truncateFrom(conversation, messageId) {
    const index = conversation.messages.findIndex((message) => message.id === messageId);
    if (index === -1) return conversation.messages.slice();
    return conversation.messages.slice(0, index);
  }

  // The last theme the user could still be looking at, used as the starting
  // point when a turn only asks a question.
  function latestTheme(conversation) {
    const messages = conversation && Array.isArray(conversation.messages) ? conversation.messages : [];
    for (let index = messages.length - 1; index >= 0; index--) {
      if (messages[index].role === 'assistant' && messages[index].theme) return messages[index];
    }
    return null;
  }

  async function load(storage) {
    const data = await storage.get(STORAGE_KEY);
    return normalizeConversations(data && data[STORAGE_KEY]);
  }

  async function save(storage, conversations) {
    const list = normalizeConversations(conversations);
    await storage.set({ [STORAGE_KEY]: list });
    return list;
  }

  return Object.freeze({
    STORAGE_KEY,
    MAX_CONVERSATIONS,
    MAX_MESSAGES,
    MAX_CONTENT_CHARS,
    MAX_IMAGES_PER_MESSAGE,
    MAX_IMAGE_CHARS,
    MAX_CONVERSATION_IMAGE_CHARS,
    newId,
    deriveTitle,
    normalizeMessage,
    normalizeImages,
    normalizeConversation,
    normalizeConversations,
    createConversation,
    userMessage,
    assistantMessage,
    toTurns,
    truncateFrom,
    latestTheme,
    load,
    save
  });
});
