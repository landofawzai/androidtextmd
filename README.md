# Markdown Editor

> Offline-first PWA for pasting markdown from Claude (or anywhere) on Android and saving it as a `.md` file. Single user. No auth. No backend.

**Live:** https://landofawzai.github.io/androidtextmd/

## What it does

Paste or type markdown → live preview → **Save .md** → file lands in Downloads (or a folder you pick, via the File System Access API on Chrome 121+). Also exports standalone HTML and copies raw markdown to clipboard. Works fully offline after first load.

That's the whole feature set by design — no folders, tags, sync, accounts, or plugins. See [markdown-editor-spec.md](markdown-editor-spec.md) for the complete specification.

## Install on Android

1. Open the live URL above in Chrome on Android.
2. Chrome menu → **Install app** (or "Add to Home screen").
3. Find **MD Editor** in your app drawer (swipe up from home).
4. Long-press and drag to the home screen if you want it there.

## Local development

No build step, no dependencies. Serve the files over any static HTTP server:

```bash
python -m http.server 8765
# then open http://127.0.0.1:8765/
```

For PWA install and full offline behavior you need HTTPS — use the deployed URL or host behind any HTTPS-capable origin (Cloudflare Pages, Netlify, Hetzner + nginx, etc.).

## Stack

- Vanilla HTML + JS + CSS. No framework, no bundler.
- [marked](https://marked.js.org) v12.0.2 — markdown → HTML
- [DOMPurify](https://github.com/cure53/DOMPurify) v3.1.6 — HTML sanitization
- Service Worker for offline + share target
- Web App Manifest for installability

Shell transfer on first load: **~82 KB uncompressed** (under the 100 KB budget in the spec). Vendored libraries live in [vendor/](vendor/); regenerate icons with [scripts/make-icons.py](scripts/make-icons.py).

## File layout

```
index.html              # single-page app entry
app.js                  # all application logic
styles.css              # dark theme styles
manifest.webmanifest    # PWA manifest with share_target
sw.js                   # service worker (offline + share target)
icons/                  # 192, 512, and maskable PNGs
vendor/                 # marked + DOMPurify (version-pinned)
scripts/make-icons.py   # regenerates icons/ via Pillow
markdown-editor-spec.md # full specification
```

## Deploy

Currently hosted on GitHub Pages from `main` branch, root folder. Path-scoped assets mean the app works at any subpath. Note: `share_target` doesn't surface in the Android share sheet on subpath deploys — copy-paste is the primary flow. For share-sheet integration move to a custom domain or an origin-root host.

## Known limitations

- Android share sheet integration requires serving from an origin root (not a subpath). The current GitHub Pages deploy can't register as a share target.
- IBM Plex Mono is loaded from Google Fonts at runtime; offline loads fall back to system monospace (intentional, per spec §8).
- Firefox Android does not implement `share_target` — sharing into the app won't appear as an option there.
