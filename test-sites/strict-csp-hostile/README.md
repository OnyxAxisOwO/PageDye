# Strict CSP Hostile Test Site

This is a local-only test site for PageDye compatibility checks.

It intentionally uses:

- A very strict `Content-Security-Policy` response header.
- Opaque full-page layout layers.
- Self-hosted CSS and JS only.
- `frame-src 'none'` to challenge iframe-based custom effects.
- A small defensive script that removes obvious PageDye injected DOM/style nodes.

Run it from this folder:

```powershell
python server.py
```

Then open:

```text
http://127.0.0.1:8787/
```

This site is intentionally hostile to visual customization. It is only for local testing.
