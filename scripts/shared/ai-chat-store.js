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

  function normalizeMessage(raw) {
    if (!isPlainObject(raw)) return null;
    const id = typeof raw.id === 'string' && raw.id ? raw.id.slice(0, 64) : newId();
    const at = Number.isFinite(raw.at) ? raw.at : 0;

    if (raw.role === 'user') {
      const content = trimTo(raw.content, MAX_CONTENT_CHARS);
      return { id, role: 'user', content, at };
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
    const messages = (Array.isArray(raw.messages) ? raw.messages : [])
      .map(normalizeMessage)
      .filter(Boolean)
      .slice(-MAX_MESSAGES);

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

  function userMessage(content, at = 0) {
    return { id: newId(), role: 'user', content: trimTo(content, MAX_CONTENT_CHARS), at };
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
      .map((message) => (message.role === 'user'
        ? { role: 'user', content: message.content }
        : { role: 'assistant', reply: message.reply, themeChanged: message.themeChanged, theme: message.theme }));
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
    newId,
    deriveTitle,
    normalizeMessage,
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
