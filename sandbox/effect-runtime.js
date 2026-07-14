(() => {
  'use strict';

  const MESSAGE_TYPE = 'pagedyeEffectSandbox';
  const channel = decodeURIComponent(location.hash.slice(1));
  const canvas = document.getElementById('effect-canvas');
  const pointerTarget = new EventTarget();

  function errorMessage(error) {
    return error && error.message ? error.message : String(error || 'Unknown custom effect error.');
  }

  function send(payload) {
    parent.postMessage({ type: MESSAGE_TYPE, channel, ...payload }, '*');
  }

  function reply(requestId, ok, error) {
    send({ action: 'result', requestId, ok, error: error || '' });
  }

  function stop() {
    window.PageDyeEffects.stopEffect();
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  window.addEventListener('message', (event) => {
    if (event.source !== parent) return;
    const message = event.data;
    if (!message || message.type !== MESSAGE_TYPE || message.channel !== channel) return;

    if (message.action === 'pointer') {
      pointerTarget.dispatchEvent(new MouseEvent('mousemove', {
        clientX: Number(message.clientX) || 0,
        clientY: Number(message.clientY) || 0,
        screenX: Number(message.screenX) || 0,
        screenY: Number(message.screenY) || 0,
        buttons: Number(message.buttons) || 0,
        ctrlKey: !!message.ctrlKey,
        shiftKey: !!message.shiftKey,
        altKey: !!message.altKey,
        metaKey: !!message.metaKey
      }));
      return;
    }

    if (message.action === 'stop') {
      stop();
      return;
    }

    if (message.action === 'validate') {
      const result = window.PageDyeEffects.compileCustomEffect(String(message.code || ''));
      reply(message.requestId, result.ok, result.error);
      return;
    }

    if (message.action === 'start') {
      stop();
      let initialError = null;
      let starting = true;
      const onError = (error) => {
        const text = errorMessage(error);
        if (starting) initialError = text;
        else send({ action: 'runtimeError', error: text });
      };
      const started = window.PageDyeEffects.startEffect(
        canvas,
        'custom:__sandbox__',
        100,
        message.config || {},
        [{ id: '__sandbox__', name: message.name || 'Custom Effect', code: String(message.code || '') }],
        onError,
        { strictCustom: true, eventTarget: pointerTarget }
      );
      starting = false;
      reply(message.requestId, started === true && !initialError, initialError || (started === true ? '' : 'Unable to start custom effect.'));
    }
  });

  window.addEventListener('error', (event) => {
    send({ action: 'runtimeError', error: event.message || 'Unhandled sandbox error.' });
  });
  window.addEventListener('unhandledrejection', (event) => {
    send({ action: 'runtimeError', error: errorMessage(event.reason) });
  });

  send({ action: 'ready' });
})();
