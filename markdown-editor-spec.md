# Personal Markdown Editor — Build Spec

> A zero-bloat, offline-first, share-target PWA for pasting markdown from Claude (or anywhere) on Android and saving it as a file. Single user. No auth. No backend.

---

## 1. Purpose

Most Android markdown editors are bloated with note-trees, tags, sync, plugins, and paywalls. This tool does one thing: **receive markdown text (paste or Android Share) → render it → save it as a `.md` file locally.** That's the entire feature set.

Use case: Claude generates markdown on desktop or mobile → share/paste into this editor on Android → hit save → `.md` file ends up in Downloads or a folder of the user's choice.

## 2. Non-Goals (Do NOT Build)

- No note organization, folders, tags, or search across notes.
- No multi-document state — the editor holds ONE document at a time.
- No cloud sync, no accounts, no auth.
- No plugin system, no theme switcher, no settings page.
- No toolbar of formatting buttons. The user writes markdown by hand.
- No collaboration, no comments, no version history beyond a single undo stack.
- No Play Store listing — deploys as a PWA only.

If a feature is not explicitly listed in §4, do not build it.

## 3. User Workflow

1. User opens `editor.example.com` on Android Chrome once and taps "Install app" (or "Add to Home screen"). The PWA is now installed.
2. Claude (or any app) produces markdown text. User taps Share → selects "Markdown Editor".
3. The editor launches with the shared text already in the textarea and a rendered preview next to it.
4. User reviews, optionally edits, then taps **Save .md**. A system save dialog appears (File System Access API on supported Chrome versions) or the file downloads with a sensible filename.
5. User closes the app. If they reopen it without new shared text, the last document is auto-restored from `localStorage`.

Alternate entry: user opens the app directly, pastes text into the textarea, same flow from step 3.

## 4. Features (MVP — Complete Scope)

| # | Feature | Detail |
|---|---------|--------|
| 1 | Paste area | Full-width `<textarea>`. Monospace font. Auto-grows on desktop, fixed-height with internal scroll on mobile. |
| 2 | Live preview | Renders markdown via `marked.js`. Updates on every `input` event, debounced 150ms. |
| 3 | Layout toggle | Split view (editor + preview side-by-side) on screens ≥ 768px. Single-pane toggle (Edit / Preview tabs) on narrower screens. A gear-free icon button flips them manually too. |
| 4 | Save as .md | Primary action. Uses File System Access API (`showSaveFilePicker`) when available; falls back to `<a download>` blob URL. Default filename: `note-{YYYY-MM-DD-HHmm}.md`. Editable before save when picker is available. |
| 5 | Export as HTML | Secondary action. Same flow as Save, but outputs a single self-contained `.html` file with the rendered markdown wrapped in minimal CSS. |
| 6 | Copy all | Copies current textarea contents to clipboard. Uses `navigator.clipboard.writeText`. Toast confirms. |
| 7 | Clear | Empties the textarea after a confirm dialog. Clears auto-save. |
| 8 | Auto-save | On every `input` event (debounced 500ms), writes textarea contents to `localStorage` key `md-editor-doc`. Restored on load if present AND no share-target payload. |
| 9 | Share target | Manifest registers a single POST share target at `/share` (`multipart/form-data`) accepting inline text (`title`/`text`/`url`) and files (`.md`, `.txt`, `text/markdown`, `text/plain`). The service worker intercepts the POST, parses the form, stashes the payload in a `Cache` entry keyed by `/__pending_share__`, and redirects to `/?shared=1`. On load, the app consumes the payload; if a file is present its contents load into the textarea and its filename becomes the default save-name, otherwise the text fields are combined. Confirm-on-overwrite if the current doc is non-empty and differs from the incoming payload. Full details in §7.1. |
| 10 | Offline | Full functionality offline via service worker. Marked.js is bundled locally, not loaded from CDN at runtime. |
| 11 | Install prompt | Listens for `beforeinstallprompt` and shows a small "Install" button in the header. Dismissal is remembered for 30 days via `localStorage` key `md-editor-install-dismissed-until`, then the button reappears. |

That is the entire feature list. If in doubt, cut.

## 5. Tech Stack

- **HTML + vanilla JS + CSS.** No framework, no build step, no bundler.
- **marked.js** v12.0.2 for markdown → HTML. Vendored locally at `/vendor/marked.min.js` (copied into the repo, not linked from a CDN).
- **DOMPurify** v3.1.6 for sanitizing rendered HTML before inserting into the preview pane. Also vendored at `/vendor/purify.min.js`.
- **Service Worker** (vanilla, ~30 lines) for offline caching.
- **Web App Manifest** with `share_target` registered.

Vendored files must include a header comment recording the exact version and upstream source URL, e.g. `// marked.min.js v12.0.2 — https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js`. No Node.js. No npm. No TypeScript. Files are served directly as static assets.

**Browser support.** The PWA targets Chromium-based browsers on Android (Chrome ≥ 89, Edge ≥ 89) and desktop. The share target requires `method: POST` + files support, which Firefox Android does not implement — sharing into the app will not appear as an option there. Acceptance criteria in §12 assume Chrome on Android.

## 6. File Structure

```
/
├── index.html              # Single-page app entry
├── app.js                  # All application logic (~250 lines max)
├── styles.css              # All styling (~150 lines max)
├── manifest.webmanifest    # PWA manifest with share_target
├── sw.js                   # Service worker
├── icons/
│   ├── icon-192.png
│   ├── icon-512.png
│   └── icon-maskable.png
└── vendor/
    ├── marked.min.js
    └── purify.min.js
```

Total: ~8 source files. Under 20 KB of hand-written code.

## 7. Implementation Notes

### 7.1 Share target

Android's share sheet sends two fundamentally different payloads: inline text (when the user shares a selection or a chat response) and files (when the user shares an attachment, like the `.md` files Claude generates as artifacts). The PWA must handle both.

#### Manifest declaration

In `manifest.webmanifest` — a single `share_target` supporting both cases:

```json
"share_target": {
  "action": "/share",
  "method": "POST",
  "enctype": "multipart/form-data",
  "params": {
    "title": "title",
    "text": "text",
    "url": "url",
    "files": [
      {
        "name": "file",
        "accept": ["text/markdown", "text/plain", ".md", ".txt"]
      }
    ]
  }
}
```

Using `POST` + `multipart/form-data` is required for file sharing. Text-only shares still work: Android will POST a multipart body with only the `text` / `title` / `url` fields populated.

#### Service worker handling

The SW intercepts every `POST /share` request, parses the form, stashes the payload in a `Cache`, and redirects to `/` where the app picks it up. This indirection exists because a POST cannot land on a static SPA directly — the SW translates it into a GET the app can read.

```js
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (event.request.method === 'POST' && url.pathname === '/share') {
    event.respondWith(handleShare(event.request));
    return;
  }

  // Existing cache-first app-shell logic below...
});

async function handleShare(request) {
  const formData = await request.formData();
  const payload = {
    title: formData.get('title') || '',
    text: formData.get('text') || '',
    url: formData.get('url') || '',
    file: null
  };

  // Only the first file is honored; additional files in the share are ignored.
  const file = formData.get('file');
  if (file && typeof file !== 'string' && file.size > 0) {
    payload.file = {
      name: file.name || 'shared.md',
      content: await file.text()
    };
  }

  const cache = await caches.open('md-editor-share');
  await cache.put(
    '/__pending_share__',
    new Response(JSON.stringify(payload), {
      headers: { 'Content-Type': 'application/json' }
    })
  );

  return Response.redirect('/?shared=1', 303);
}
```

#### App-side pickup

On load, `app.js` checks for `?shared=1` and reads the cached payload:

```js
async function consumePendingShare() {
  const params = new URLSearchParams(location.search);
  if (!params.has('shared')) return null;

  try {
    const cache = await caches.open('md-editor-share');
    const response = await cache.match('/__pending_share__');
    if (!response) return null;
    await cache.delete('/__pending_share__');
    return await response.json();
  } finally {
    history.replaceState(null, '', '/');
  }
}
```

Priority order when applying the payload:

1. **If `file` is present** → load `file.content` into the textarea; set the default save-name to `file.name` (stripped of path, preserving `.md` extension).
2. **Else if `text` is present** → combine `title` (as a `# heading` if non-empty) + blank line + `text` + (if `url`) blank line + `url`.
3. **Else** → fall through to the normal `localStorage` restore path.

If the textarea is already non-empty and the incoming payload differs, show a confirm dialog: *"Replace current document with shared content?"* with Replace / Cancel.

#### Why it works for the Claude artifact flow

When Claude generates a `.md` file as an artifact on Android:
1. User taps the file → Android opens a system preview with a share button.
2. User taps share → selects Markdown Editor.
3. Android POSTs the file to `/share` as `multipart/form-data` with the filename intact.
4. SW reads it, caches it, redirects to `/?shared=1`.
5. App loads the file contents into the textarea and uses Claude's original filename as the default save-name.

No chat transcript, no preamble — just the file contents, same as if the user had downloaded it and opened it manually.

**Caveat:** The Claude Android app's share behavior for `.md` artifacts has not been independently verified for this spec. If the app only exposes artifacts via "Copy" (inline text) rather than the system file share sheet, the text-share path still works and produces the same end state minus the original filename. Verify manually during AC #4.

### 7.2 Save as .md

```js
async function saveMarkdown(text, suggestedName) {
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName,
        types: [{ description: 'Markdown', accept: { 'text/markdown': ['.md'] } }]
      });
      const writable = await handle.createWritable();
      await writable.write(text);
      await writable.close();
      return { saved: true };
    } catch (err) {
      if (err.name === 'AbortError') return { saved: false, cancelled: true };
      throw err;
    }
  }
  // Fallback: blob download
  const blob = new Blob([text], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: suggestedName });
  a.click();
  URL.revokeObjectURL(url);
  return { saved: true };
}
```

User cancellation of the picker (AbortError) must be silent — no toast, no error. Only real write failures surface an error toast. On Android Chrome 121+ the File System Access API picker works and lands the file in user-chosen storage. On older browsers the fallback drops into Downloads — acceptable.

### 7.3 Service worker

Cache-first for app shell (`index.html`, `app.js`, `styles.css`, `manifest.webmanifest`, `/vendor/*`, `/icons/*`). Network-only for everything else (there shouldn't be anything else). Cache name includes a version string; bump to invalidate.

```js
const CACHE = 'md-editor-v1';
const ASSETS = ['/', '/app.js', '/styles.css', '/manifest.webmanifest',
                '/vendor/marked.min.js', '/vendor/purify.min.js',
                '/icons/icon-192.png', '/icons/icon-512.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(keys => Promise.all(
    keys.filter(k => k !== CACHE && k !== 'md-editor-share').map(k => caches.delete(k))
  ))
));
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Handle share-target POST first (see §7.1)
  if (e.request.method === 'POST' && url.pathname === '/share') {
    e.respondWith(handleShare(e.request));
    return;
  }
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
```

Note the `md-editor-share` cache is preserved across SW activations so a pending share survives a background SW update between the POST and the page load.

A GET request to `/share` (e.g., a bookmark, reload, or direct navigation) is not intercepted by the SW handler above — it falls through to the static `index.html` via the nginx SPA fallback in §11. The app then sees no `?shared=1` parameter, reads no pending payload, and continues to the normal `localStorage` restore path. This is the intended silent fallback, not a bug.

### 7.4 Preview rendering

```js
preview.innerHTML = DOMPurify.sanitize(marked.parse(textarea.value));
```

Configure `marked` with `{ gfm: true, breaks: true }`. Always sanitize — shared text is untrusted.

### 7.5 Auto-save

```js
let saveTimer;
textarea.addEventListener('input', () => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    localStorage.setItem('md-editor-doc', textarea.value);
  }, 500);
});
```

On load, if `consumePendingShare()` returns null (no pending share from §7.1): `textarea.value = localStorage.getItem('md-editor-doc') || '';`

## 8. UI / Styling

- **Dark theme only.** Background `#0a0a0b`. Cards/panels `#18181b`. Text `#e4e4e7`. Accent `#6366f1`.
- **Editor font:** `'IBM Plex Mono', ui-monospace, monospace`. Loaded from Google Fonts in `index.html` with `font-display: swap`. The font is **not** bundled locally — offline loads (including the first launch after install, if the Google Fonts request was never cached) will render in system monospace. This is the accepted tradeoff for staying under the 100 KB budget in AC #9; do not bundle a woff2 locally. 15px, line-height 1.6.
- **Preview font:** system-ui for body, IBM Plex Mono for code blocks. 16px.
- **Header:** 48px tall, sticky, contains app name (left), layout toggle icon, install button (when applicable), and action cluster (Copy, Clear, Export HTML, Save .md) right-aligned. On mobile, non-primary actions collapse into an overflow menu.
- **Save .md** is the only filled button (indigo `#6366f1` background). All others are ghost buttons.
- **Split view:** 50/50 with a 1px `#27272a` divider. Editor on the left, preview on the right. Both scroll independently.
- **Mobile tabs:** two pill-shaped tabs at the top of the content area — "Edit" and "Preview". Active tab has `#6366f1` underline.
- **Toast:** small pill that slides up from the bottom for 2s on copy/save success. Background `#18181b`, text `#4ade80` for success, `#f87171` for error.
- **Max width:** editor pane caps at 1200px centered. No full-bleed on large screens.
- No animations beyond toast slide and a 150ms fade on tab switches.

## 9. Icons

Three PNG icons in `/icons/`:
- `icon-192.png` — 192×192, standard
- `icon-512.png` — 512×512, standard
- `icon-maskable.png` — 512×512, with 20% safe-zone padding, `purpose: "maskable"` in manifest

Visual: solid `#0a0a0b` square background, centered white `M↓` glyph in IBM Plex Mono Bold, 60% of icon height. They're placeholders, not branding. Generate them with one of:

- A one-off Python script using Pillow (`pip install pillow`), or
- A Node script using `sharp` run with `npx` (no persistent `package.json`), or
- ImageMagick: `convert -size 512x512 xc:'#0a0a0b' -fill white -font IBM-Plex-Mono-Bold -pointsize 300 -gravity center -annotate 0 'M↓' icon-512.png` and resize for the 192 variant.

Commit the generated PNGs to `/icons/` — do not regenerate at build time (there is no build step).

## 10. Manifest

```json
{
  "name": "Markdown Editor",
  "short_name": "MD Editor",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#0a0a0b",
  "theme_color": "#0a0a0b",
  "orientation": "any",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "share_target": {
    "action": "/share",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url",
      "files": [
        {
          "name": "file",
          "accept": ["text/markdown", "text/plain", ".md", ".txt"]
        }
      ]
    }
  }
}
```

## 11. Deploy

Static files, served over HTTPS (PWAs require it). Two acceptable deploy paths:

1. **Hetzner VPS** (preferred — matches existing infra). Drop the directory into any nginx vhost. Example snippet:

   ```nginx
   server {
     listen 443 ssl http2;
     server_name editor.example.com;
     root /var/www/md-editor;
     index index.html;
     location / { try_files $uri $uri/ /index.html; }
     location = /sw.js { add_header Cache-Control "no-cache"; }
   }
   ```

   Put it behind Cloudflare for SSL + CDN.

2. **Local-only** (fallback — for a true pocket tool). Serve from `python3 -m http.server` on localhost for testing, then host the files on any static-capable origin the user controls. PWA install requires HTTPS, so plain local files won't register as a share target.

No environment variables. No secrets. No build pipeline.

## 12. Acceptance Criteria

The build is done when all of these are true:

1. Opening the installed PWA on Android shows a textarea and (on ≥768px) a preview side-by-side.
2. Pasting markdown updates the preview within ~200ms.
3. Tapping Share on any Android app with text selected lists "Markdown Editor" as a target, and choosing it launches the app with that text pre-filled.
4. **Sharing a `.md` file** (e.g., from the Files app, a Claude-generated artifact preview, or any file manager) to Markdown Editor launches the app with the file contents in the textarea and the original filename as the default save-name.
5. Tapping "Save .md" results in a `.md` file on the device with the textarea contents.
6. Closing the app and reopening it without new shared text restores the previous document.
7. Turning off the network and reloading the app still loads and works (minus share target, which needs an install).
8. No console errors on a fresh Android Chrome load.
9. Total transferred bytes on first load (minus icons and the Google Fonts request) under 100 KB. Expected breakdown: marked.min.js ≈ 40 KB, purify.min.js ≈ 22 KB, `index.html` + `app.js` + `styles.css` + `manifest.webmanifest` + `sw.js` combined ≤ 38 KB. Bundling a woff2 locally would blow the budget — see §8.

## 13. Out of Scope for v1 (Possible Later)

Listed only so Claude Code does not build them now:

- Multiple saved documents / file list view
- Open existing `.md` files from disk via a file picker inside the app (sharing a file in still works — see §7.1)
- Syntax highlighting in code blocks (would require highlight.js → +30 KB)
- Math rendering (KaTeX)
- Mermaid diagrams
- Custom CSS for exported HTML
- Print stylesheet

Any of these can be revisited after the v1 has been in use for a week.

---

*End of spec. Hand this to Claude Code. Expected build time: 4–6 hours.*
