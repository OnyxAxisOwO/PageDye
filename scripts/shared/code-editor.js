// Prism-backed textarea code editor (gutter, syntax highlight overlay, tab/bracket
// auto-close, smart indent) shared between popup/popup.js (Custom CSS field) and
// options/options.js (Custom CSS field + Custom Effect code field). options.js's
// version was already a strict superset of popup.js's (it added the `language`
// param and an escapeHtml fallback for languages Prism hasn't loaded a grammar
// for) — this is that superset, unchanged. Callers that only ever used CSS keep
// passing 'css' and get byte-identical behavior to before.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.PageDyeCodeEditor = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function initCodeEditor(textareaId, containerId, language) {
    language = language || 'css';
    const textarea = document.getElementById(textareaId);
    const container = document.getElementById(containerId);
    if (!textarea || !container) return null;

    const gutter = container.querySelector('.editor-gutter');
    const codeBlock = container.querySelector('.editor-highlight code');
    const preBlock = container.querySelector('.editor-highlight');
    const grammar = window.Prism && Prism.languages[language];

    function escapeHtml(s) {
      return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function updateEditor() {
      let code = textarea.value;
      const isPlaceholder = !code;

      if (isPlaceholder) {
        code = textarea.getAttribute('placeholder') || '';
        container.classList.add('placeholder-active');
      } else {
        container.classList.remove('placeholder-active');
      }

      const highlighted = grammar ? Prism.highlight(code, grammar, language) : escapeHtml(code);
      codeBlock.innerHTML = code.endsWith('\n') ? highlighted + ' ' : highlighted;

      const lineCount = code.split('\n').length;
      let gutterHTML = '';
      for (let i = 1; i <= lineCount; i++) {
        gutterHTML += `<span class="editor-gutter-num">${i}</span>`;
      }
      gutter.innerHTML = gutterHTML;

      syncScrolls();
    }

    function syncScrolls() {
      gutter.scrollTop = textarea.scrollTop;
      preBlock.scrollTop = textarea.scrollTop;
      preBlock.scrollLeft = textarea.scrollLeft;
    }

    textarea.addEventListener('scroll', syncScrolls);
    textarea.addEventListener('input', updateEditor);

    textarea.addEventListener('keydown', (e) => {
      const val = textarea.value;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      // 1. Tab Key Support (2 spaces)
      if (e.key === 'Tab') {
        e.preventDefault();
        textarea.value = val.substring(0, start) + '  ' + val.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + 2;
        updateEditor();
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }

      // 2. Overwrite closing character if already typed
      const closers = ['}', ')', ']', '"', "'"];
      if (closers.includes(e.key) && start === end) {
        const nextChar = val.charAt(start);
        if (nextChar === e.key) {
          e.preventDefault();
          textarea.selectionStart = textarea.selectionEnd = start + 1;
          return;
        }
      }

      // 3. Auto-closing brackets
      const pairs = {
        '{': '}',
        '(': ')',
        '[': ']',
        '"': '"',
        "'": "'"
      };

      if (pairs[e.key] !== undefined) {
        e.preventDefault();
        const closing = pairs[e.key];
        if (start !== end) {
          const selected = val.substring(start, end);
          textarea.value = val.substring(0, start) + e.key + selected + closing + val.substring(end);
          textarea.selectionStart = start + 1;
          textarea.selectionEnd = end + 1;
        } else {
          textarea.value = val.substring(0, start) + e.key + closing + val.substring(end);
          textarea.selectionStart = textarea.selectionEnd = start + 1;
        }
        updateEditor();
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }

      // 4. Smart Indentation on Enter key
      if (e.key === 'Enter' && start === end) {
        const charBefore = val.charAt(start - 1);
        const charAfter = val.charAt(start);
        if (charBefore === '{' && charAfter === '}') {
          e.preventDefault();
          textarea.value = val.substring(0, start) + '\n  \n' + val.substring(end);
          textarea.selectionStart = textarea.selectionEnd = start + 3;
          updateEditor();
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
        } else if (charBefore === '{') {
          e.preventDefault();
          textarea.value = val.substring(0, start) + '\n  ' + val.substring(end);
          textarea.selectionStart = textarea.selectionEnd = start + 3;
          updateEditor();
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    });

    updateEditor();

    return {
      update: updateEditor
    };
  }

  return { initCodeEditor };
});
