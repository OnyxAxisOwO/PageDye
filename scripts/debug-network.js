// PageDye Debug Mode network capture, running in the page's MAIN world.
// The fetch/XHR patch is installed only while debug network capture is active,
// and is restored when PageDye/debug is turned off.
(() => {
  if (window.__pagedyeNetworkBridgeInstalled) return;
  window.__pagedyeNetworkBridgeInstalled = true;

  const ENTRY_EVENT = 'pagedye-debug-network-entry';
  const TOGGLE_EVENT = 'pagedye-debug-network-toggle';
  const MAX_BODY_CHARS = 20000;

  let active = false;
  let patched = false;
  let nativeFetch = null;
  let nativeOpen = null;
  let nativeSend = null;
  let nativeSetHeader = null;
  let patchedFetch = null;
  let patchedOpen = null;
  let patchedSend = null;
  let patchedSetHeader = null;

  document.addEventListener(TOGGLE_EVENT, (e) => {
    active = !!(e.detail && e.detail.enabled);
    if (active) installPatch();
    else uninstallPatch();
  });

  function truncate(s) {
    if (typeof s !== 'string') return s;
    return s.length > MAX_BODY_CHARS ? s.slice(0, MAX_BODY_CHARS) + `... total ${s.length} chars, truncated` : s;
  }

  function headersToObject(headers) {
    const obj = {};
    if (!headers) return obj;
    try {
      if (headers instanceof Headers) headers.forEach((v, k) => { obj[k] = v; });
      else if (Array.isArray(headers)) headers.forEach(([k, v]) => { obj[k] = v; });
      else if (typeof headers === 'object') Object.assign(obj, headers);
    } catch (e) {}
    return obj;
  }

  function readRequestBody(body) {
    if (body == null) return null;
    if (typeof body === 'string') return truncate(body);
    if (window.URLSearchParams && body instanceof URLSearchParams) return truncate(body.toString());
    if (window.FormData && body instanceof FormData) {
      const parts = [];
      body.forEach((v, k) => {
        parts.push(`${k}=${(window.File && v instanceof File) ? `(file: ${v.name})` : v}`);
      });
      return truncate(parts.join('&'));
    }
    if (window.Blob && body instanceof Blob) return `(blob, ${body.size} bytes, ${body.type || 'unknown type'})`;
    if (body instanceof ArrayBuffer) return `(arraybuffer, ${body.byteLength} bytes)`;
    try { return truncate(JSON.stringify(body)); } catch (e) { return String(body); }
  }

  function emit(entry) {
    if (!active) return;
    document.dispatchEvent(new CustomEvent(ENTRY_EVENT, { detail: entry }));
  }

  function installPatch() {
    if (patched) return;
    patched = true;

    nativeFetch = window.fetch;
    if (nativeFetch) {
      patchedFetch = function (input, init) {
        if (!active) return nativeFetch.call(this, input, init);

        const isRequestObj = typeof Request !== 'undefined' && input instanceof Request;
        const method = ((init && init.method) || (isRequestObj ? input.method : null) || 'GET').toUpperCase();
        const url = typeof input === 'string' ? input : (isRequestObj ? input.url : String(input));
        const reqHeaders = headersToObject((init && init.headers) || (isRequestObj ? input.headers : null));
        const reqBody = readRequestBody(init && init.body);
        const startedAt = Date.now();
        const t0 = performance.now();

        return nativeFetch.call(this, input, init).then((response) => {
          const duration = performance.now() - t0;
          let clone;
          try { clone = response.clone(); } catch (e) { clone = null; }

          const resHeaders = {};
          if (clone) {
            try { clone.headers.forEach((v, k) => { resHeaders[k] = v; }); } catch (e) {}
          }
          const contentType = (clone && clone.headers.get('content-type')) || '';
          const isTextish = !clone || /json|text|xml|javascript|html|css/i.test(contentType) || !contentType;

          const finish = (resBody) => emit({
            kind: 'fetch', method, url, status: response.status, ok: response.ok,
            startedAt, duration, reqHeaders, reqBody, resHeaders, resBody
          });

          if (!clone) finish(null);
          else if (isTextish) clone.text().then((t) => finish(truncate(t))).catch(() => finish('(unable to read response body)'));
          else clone.blob().then((b) => finish(`(${contentType || 'binary'}, ${b.size} bytes)`)).catch(() => finish(null));

          return response;
        }, (err) => {
          emit({
            kind: 'fetch', method, url, status: 0, ok: false,
            startedAt, duration: performance.now() - t0,
            reqHeaders, reqBody, resHeaders: {}, resBody: null, error: String((err && err.message) || err)
          });
          throw err;
        });
      };
      window.fetch = patchedFetch;
    }

    nativeOpen = XMLHttpRequest.prototype.open;
    nativeSend = XMLHttpRequest.prototype.send;
    nativeSetHeader = XMLHttpRequest.prototype.setRequestHeader;

    patchedOpen = function (method, url, ...rest) {
      this.__pagedye = { method: String(method || 'GET').toUpperCase(), url: String(url), headers: {} };
      return nativeOpen.call(this, method, url, ...rest);
    };

    patchedSetHeader = function (name, value) {
      if (this.__pagedye) this.__pagedye.headers[name] = value;
      return nativeSetHeader.call(this, name, value);
    };

    patchedSend = function (body) {
      const meta = this.__pagedye;
      if (!active || !meta) return nativeSend.call(this, body);

      meta.startedAt = Date.now();
      meta.t0 = performance.now();
      meta.body = readRequestBody(body);

      this.addEventListener('loadend', () => {
        let resBody = null;
        try {
          if (!this.responseType || this.responseType === 'text') resBody = truncate(this.responseText);
          else if (this.responseType === 'json') resBody = truncate(JSON.stringify(this.response));
          else resBody = `(${this.responseType || 'unknown'} type, preview unavailable)`;
        } catch (e) {
          resBody = '(unable to read response body)';
        }

        const resHeaders = {};
        try {
          (this.getAllResponseHeaders() || '').trim().split(/\r?\n/).forEach((line) => {
            const idx = line.indexOf(':');
            if (idx > -1) resHeaders[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
          });
        } catch (e) {}

        emit({
          kind: 'xhr', method: meta.method, url: meta.url,
          status: this.status, ok: this.status >= 200 && this.status < 400,
          startedAt: meta.startedAt, duration: performance.now() - meta.t0,
          reqHeaders: meta.headers, reqBody: meta.body, resHeaders, resBody
        });
      });

      return nativeSend.call(this, body);
    };

    XMLHttpRequest.prototype.open = patchedOpen;
    XMLHttpRequest.prototype.setRequestHeader = patchedSetHeader;
    XMLHttpRequest.prototype.send = patchedSend;
  }

  function uninstallPatch() {
    if (!patched) return;
    if (patchedFetch && window.fetch === patchedFetch) window.fetch = nativeFetch;
    if (patchedOpen && XMLHttpRequest.prototype.open === patchedOpen) XMLHttpRequest.prototype.open = nativeOpen;
    if (patchedSetHeader && XMLHttpRequest.prototype.setRequestHeader === patchedSetHeader) XMLHttpRequest.prototype.setRequestHeader = nativeSetHeader;
    if (patchedSend && XMLHttpRequest.prototype.send === patchedSend) XMLHttpRequest.prototype.send = nativeSend;
    patched = false;
    patchedFetch = null;
    patchedOpen = null;
    patchedSend = null;
    patchedSetHeader = null;
  }
})();
