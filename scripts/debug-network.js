// PageDye Debug Mode — network capture, running in the page's MAIN world.
// A content script's default (isolated) world has its own separate fetch/
// XMLHttpRequest bindings from the page's, so it can never see calls the
// page itself makes — patching them here, in the same JS context as the
// page, is the only way to observe them. chrome.* APIs aren't reachable
// from the MAIN world, so this bridges to the isolated-world scripts/debug.js
// purely through CustomEvents on the shared document (the DOM, unlike the
// JS heap, is shared across worlds).
//
// The patch itself always installs (cheap — just an extra call frame), but
// stays a no-op pass-through until scripts/debug.js broadcasts that debug
// mode is on, so this has ~zero cost for the vast majority of users who
// never enable it.
(() => {
  if (window.__pagedyeNetworkPatched) return;
  window.__pagedyeNetworkPatched = true;

  const ENTRY_EVENT = 'pagedye-debug-network-entry';
  const TOGGLE_EVENT = 'pagedye-debug-network-toggle';
  const MAX_BODY_CHARS = 20000;

  let active = false;
  document.addEventListener(TOGGLE_EVENT, (e) => {
    active = !!(e.detail && e.detail.enabled);
  });

  function truncate(s) {
    if (typeof s !== 'string') return s;
    return s.length > MAX_BODY_CHARS ? s.slice(0, MAX_BODY_CHARS) + `…(共 ${s.length} 字符,已截断)` : s;
  }

  function headersToObject(headers) {
    const obj = {};
    if (!headers) return obj;
    try {
      if (headers instanceof Headers) headers.forEach((v, k) => { obj[k] = v; });
      else if (Array.isArray(headers)) headers.forEach(([k, v]) => { obj[k] = v; });
      else if (typeof headers === 'object') Object.assign(obj, headers);
    } catch (e) { /* best-effort */ }
    return obj;
  }

  function readRequestBody(body) {
    if (body == null) return null;
    if (typeof body === 'string') return truncate(body);
    if (window.URLSearchParams && body instanceof URLSearchParams) return truncate(body.toString());
    if (window.FormData && body instanceof FormData) {
      const parts = [];
      body.forEach((v, k) => { parts.push(`${k}=${(window.File && v instanceof File) ? `(文件: ${v.name})` : v}`); });
      return truncate(parts.join('&'));
    }
    if (window.Blob && body instanceof Blob) return `(blob,${body.size} 字节,${body.type || '未知类型'})`;
    if (body instanceof ArrayBuffer) return `(arraybuffer,${body.byteLength} 字节)`;
    try { return truncate(JSON.stringify(body)); } catch (e) { return String(body); }
  }

  function emit(entry) {
    if (!active) return;
    document.dispatchEvent(new CustomEvent(ENTRY_EVENT, { detail: entry }));
  }

  // --- fetch ---
  const nativeFetch = window.fetch;
  if (nativeFetch) {
    window.fetch = function (input, init) {
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
        if (clone) { try { clone.headers.forEach((v, k) => { resHeaders[k] = v; }); } catch (e) {} }
        const contentType = (clone && clone.headers.get('content-type')) || '';
        const isTextish = !clone || /json|text|xml|javascript|html|css/i.test(contentType) || !contentType;

        const finish = (resBody) => emit({
          kind: 'fetch', method, url, status: response.status, ok: response.ok,
          startedAt, duration, reqHeaders, reqBody, resHeaders, resBody
        });

        if (!clone) { finish(null); }
        else if (isTextish) clone.text().then((t) => finish(truncate(t))).catch(() => finish('(无法读取响应体)'));
        else clone.blob().then((b) => finish(`(${contentType || '二进制'},${b.size} 字节)`)).catch(() => finish(null));

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
  }

  // --- XMLHttpRequest ---
  const nativeOpen = XMLHttpRequest.prototype.open;
  const nativeSend = XMLHttpRequest.prototype.send;
  const nativeSetHeader = XMLHttpRequest.prototype.setRequestHeader;

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this.__pagedye = { method: String(method || 'GET').toUpperCase(), url: String(url), headers: {} };
    return nativeOpen.call(this, method, url, ...rest);
  };

  XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
    if (this.__pagedye) this.__pagedye.headers[name] = value;
    return nativeSetHeader.call(this, name, value);
  };

  XMLHttpRequest.prototype.send = function (body) {
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
        else resBody = `(${this.responseType || 'unknown'} 类型,无法预览)`;
      } catch (e) { resBody = '(无法读取响应体)'; }

      const resHeaders = {};
      try {
        (this.getAllResponseHeaders() || '').trim().split(/\r?\n/).forEach((line) => {
          const idx = line.indexOf(':');
          if (idx > -1) resHeaders[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
        });
      } catch (e) { /* best-effort */ }

      emit({
        kind: 'xhr', method: meta.method, url: meta.url,
        status: this.status, ok: this.status >= 200 && this.status < 400,
        startedAt: meta.startedAt, duration: performance.now() - meta.t0,
        reqHeaders: meta.headers, reqBody: meta.body, resHeaders, resBody
      });
    });

    return nativeSend.call(this, body);
  };
})();
