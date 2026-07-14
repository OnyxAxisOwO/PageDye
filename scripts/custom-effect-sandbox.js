// Runs user-authored Canvas effects inside an extension sandbox page. The
// sandbox has an opaque origin, no extension APIs, and a CSP that blocks
// network access. Parent/frame messages are authenticated by source window
// plus a random per-frame channel token.
(() => {
  'use strict';

  if (window.PageDyeCustomSandbox && typeof window.PageDyeCustomSandbox.dispose === 'function') {
    try { window.PageDyeCustomSandbox.dispose(); } catch (_) {}
  }

  const MESSAGE_TYPE = 'pagedyeEffectSandbox';
  const READY_TIMEOUT_MS = 8000;
  const REQUEST_TIMEOUT_MS = 8000;
  const statesByChannel = new Map();
  const statesByFrame = new WeakMap();
  let requestSequence = 0;

  function token() {
    if (crypto && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
  }

  function toError(value) {
    return value instanceof Error ? value : new Error(String(value || 'Custom effect sandbox error.'));
  }

  function configureFrame(iframe) {
    iframe.setAttribute('sandbox', 'allow-scripts');
    iframe.setAttribute('referrerpolicy', 'no-referrer');
    iframe.setAttribute('allow', '');
    iframe.setAttribute('title', 'PageDye isolated custom Canvas effect');
  }

  function clearPointerForwarding(state) {
    if (state.pointerHandler) window.removeEventListener('mousemove', state.pointerHandler, true);
    if (state.pointerFrame) cancelAnimationFrame(state.pointerFrame);
    state.pointerHandler = null;
    state.pointerFrame = null;
    state.pointerEvent = null;
  }

  function installPointerForwarding(state) {
    clearPointerForwarding(state);
    state.pointerHandler = (event) => {
      state.pointerEvent = event;
      if (state.pointerFrame) return;
      state.pointerFrame = requestAnimationFrame(() => {
        state.pointerFrame = null;
        const current = state.pointerEvent;
        state.pointerEvent = null;
        if (!current || state.released || !state.iframe.contentWindow) return;
        state.iframe.contentWindow.postMessage({
          type: MESSAGE_TYPE,
          channel: state.channel,
          action: 'pointer',
          clientX: current.clientX,
          clientY: current.clientY,
          screenX: current.screenX,
          screenY: current.screenY,
          buttons: current.buttons,
          ctrlKey: current.ctrlKey,
          shiftKey: current.shiftKey,
          altKey: current.altKey,
          metaKey: current.metaKey
        }, '*');
      });
    };
    window.addEventListener('mousemove', state.pointerHandler, true);
  }

  function createState(iframe) {
    configureFrame(iframe);
    const channel = token();
    let resolveReady;
    let rejectReady;
    const ready = new Promise((resolve, reject) => {
      resolveReady = resolve;
      rejectReady = reject;
    });
    const state = {
      iframe,
      channel,
      ready,
      resolveReady,
      rejectReady,
      pending: new Map(),
      released: false,
      onError: null,
      pointerHandler: null,
      pointerFrame: null,
      pointerEvent: null,
      readyTimer: null
    };
    statesByChannel.set(channel, state);
    statesByFrame.set(iframe, state);
    state.readyTimer = setTimeout(() => {
      release(iframe, new Error('Custom effect sandbox did not become ready.'));
    }, READY_TIMEOUT_MS);
    iframe.src = `${chrome.runtime.getURL('sandbox/effect.html')}#${encodeURIComponent(channel)}`;
    return state;
  }

  function ensureState(iframe) {
    const existing = statesByFrame.get(iframe);
    return existing && !existing.released ? existing : createState(iframe);
  }

  function request(state, action, payload) {
    return state.ready.then(() => new Promise((resolve, reject) => {
      if (state.released || !state.iframe.contentWindow) {
        reject(new Error('Custom effect sandbox was released.'));
        return;
      }
      const requestId = `${Date.now()}-${++requestSequence}`;
      const timer = setTimeout(() => {
        state.pending.delete(requestId);
        reject(new Error('Custom effect sandbox request timed out.'));
      }, REQUEST_TIMEOUT_MS);
      state.pending.set(requestId, { resolve, reject, timer });
      state.iframe.contentWindow.postMessage({
        type: MESSAGE_TYPE,
        channel: state.channel,
        action,
        requestId,
        ...payload
      }, '*');
    }));
  }

  function release(iframe, reason) {
    const state = statesByFrame.get(iframe);
    if (!state) return;
    const error = reason ? toError(reason) : new Error('Custom effect sandbox was released.');
    state.released = true;
    statesByChannel.delete(state.channel);
    statesByFrame.delete(iframe);
    clearTimeout(state.readyTimer);
    clearPointerForwarding(state);
    state.rejectReady(error);
    for (const pending of state.pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    state.pending.clear();
    state.onError = null;
  }

  function stop(iframe) {
    const state = statesByFrame.get(iframe);
    if (!state || state.released || !iframe.contentWindow) return;
    iframe.contentWindow.postMessage({ type: MESSAGE_TYPE, channel: state.channel, action: 'stop' }, '*');
    clearPointerForwarding(state);
  }

  async function start(iframe, effect, config, options = {}) {
    const state = ensureState(iframe);
    state.onError = typeof options.onError === 'function' ? options.onError : null;
    iframe.style.display = 'block';
    iframe.style.pointerEvents = 'none';
    iframe.style.opacity = ((typeof options.opacity === 'number' ? options.opacity : 100) / 100).toString();
    installPointerForwarding(state);
    const result = await request(state, 'start', {
      name: effect && effect.name,
      code: effect && effect.code,
      config: config || {}
    });
    if (!result.ok) {
      clearPointerForwarding(state);
      if (state.onError) state.onError(new Error(result.error || 'Unable to start custom effect.'));
    }
    return result;
  }

  async function validate(code) {
    const iframe = document.createElement('iframe');
    Object.assign(iframe.style, {
      position: 'fixed',
      width: '1px',
      height: '1px',
      left: '-10000px',
      top: '-10000px',
      opacity: '0',
      pointerEvents: 'none'
    });
    (document.body || document.documentElement).appendChild(iframe);
    try {
      return await request(ensureState(iframe), 'validate', { code: String(code || '') });
    } finally {
      release(iframe);
      iframe.remove();
    }
  }

  function handleMessage(event) {
    const message = event.data;
    if (!message || message.type !== MESSAGE_TYPE || typeof message.channel !== 'string') return;
    const state = statesByChannel.get(message.channel);
    if (!state || state.released || event.source !== state.iframe.contentWindow) return;

    if (message.action === 'ready') {
      clearTimeout(state.readyTimer);
      state.resolveReady();
      return;
    }
    if (message.action === 'runtimeError') {
      if (state.onError) state.onError(new Error(message.error || 'Custom effect runtime error.'));
      return;
    }
    if (message.action === 'result') {
      const pending = state.pending.get(message.requestId);
      if (!pending) return;
      state.pending.delete(message.requestId);
      clearTimeout(pending.timer);
      pending.resolve({ ok: message.ok === true, error: message.error || '' });
    }
  }

  function dispose() {
    window.removeEventListener('message', handleMessage);
    for (const state of [...statesByChannel.values()]) release(state.iframe);
  }

  window.addEventListener('message', handleMessage);
  window.PageDyeCustomSandbox = Object.freeze({ start, validate, stop, release, dispose });
})();
