// Writes the PageDye preferences an AI answer proposed, for popup.js and
// options.js alike.
//
// It exists as its own file for the same reason ai-chat.css does: both pages
// offer the same button, and two copies of "which key does reduced motion live
// in" is exactly the kind of thing that drifts. Nothing here decides *whether*
// to apply — the caller only gets here because the user pressed the button.
//
// Every value is re-validated by PageDyeAiTheme.sanitizePreferences before it
// is written, even though the chat already sanitized it once: what is stored on
// a message travelled through storage since, and this write lands on keys the
// whole extension reads.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.PageDyeAiPreferences = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const UI_THEME_KEY = '__pagedye_ui_theme__';
  const DEBUG_MODE_KEY = '__pagedye_debug_mode__';
  const PAUSE_SHORTCUT_KEY = '__pagedye_pause_shortcut__';

  function isPlainObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  // The fields a proposal touches, in the order the card lists them. Returned
  // rather than rendered so each surface can label them in its own language.
  function summarize(preferences) {
    const prefs = isPlainObject(preferences) ? preferences : {};
    const parts = [];
    if (prefs.accent === 'custom' && prefs.accentColor) parts.push({ field: 'accent', value: prefs.accentColor });
    else if (prefs.accent) parts.push({ field: 'accent', value: prefs.accent });
    if (typeof prefs.reduceMotion === 'boolean') parts.push({ field: 'reduceMotion', value: prefs.reduceMotion });
    if (typeof prefs.diagnostics === 'boolean') parts.push({ field: 'diagnostics', value: prefs.diagnostics });
    if (prefs.pauseShortcut) parts.push({ field: 'pauseShortcut', value: shortcutLabel(prefs.pauseShortcut) });
    return parts;
  }

  function shortcutLabel(shortcut) {
    if (!isPlainObject(shortcut)) return '';
    const keys = [];
    if (shortcut.ctrlKey) keys.push('Ctrl');
    if (shortcut.altKey) keys.push('Alt');
    if (shortcut.shiftKey) keys.push('Shift');
    if (shortcut.metaKey) keys.push('Meta');
    keys.push(String(shortcut.code || '').replace(/^Key|^Digit/, ''));
    return keys.join('+');
  }

  // Applies only the fields the proposal actually carries. A proposal about the
  // accent must not silently reset the shortcut to a default just because it
  // said nothing about it, so the theme object is merged rather than replaced.
  async function apply(storageLocal, preferences, themeApi) {
    const api = themeApi || (typeof globalThis !== 'undefined' ? globalThis.PageDyeAiTheme : null);
    const clean = api && api.sanitizePreferences ? api.sanitizePreferences(preferences) : null;
    if (!clean) throw new Error('Nothing to apply.');

    const patch = {};

    if (clean.accent || typeof clean.reduceMotion === 'boolean') {
      const stored = await storageLocal.get(UI_THEME_KEY);
      const theme = isPlainObject(stored[UI_THEME_KEY]) ? { ...stored[UI_THEME_KEY] } : {};
      if (clean.accent === 'custom') {
        theme.accent = 'custom';
        theme.customAccent = clean.accentColor;
      } else if (clean.accent) {
        theme.accent = clean.accent;
      }
      if (typeof clean.reduceMotion === 'boolean') theme.disableAnimation = clean.reduceMotion;
      patch[UI_THEME_KEY] = theme;
    }

    if (typeof clean.diagnostics === 'boolean') patch[DEBUG_MODE_KEY] = clean.diagnostics;
    if (clean.pauseShortcut) patch[PAUSE_SHORTCUT_KEY] = clean.pauseShortcut;

    await storageLocal.set(patch);
    return clean;
  }

  return Object.freeze({
    UI_THEME_KEY,
    DEBUG_MODE_KEY,
    PAUSE_SHORTCUT_KEY,
    summarize,
    shortcutLabel,
    apply
  });
});
