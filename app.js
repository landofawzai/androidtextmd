(() => {
  'use strict';

  const LS_DOC = 'md-editor-doc';
  const LS_LAYOUT = 'md-editor-layout-single';
  const LS_INSTALL_DISMISSED = 'md-editor-install-dismissed-until';
  const INSTALL_DISMISS_DAYS = 30;
  const MOBILE_BREAKPOINT = 767;

  marked.setOptions({ gfm: true, breaks: true });

  const editor = document.getElementById('editor');
  const preview = document.getElementById('preview');
  const saveBtn = document.getElementById('save-btn');
  const exportBtn = document.getElementById('export-html-btn');
  const copyBtn = document.getElementById('copy-btn');
  const clearBtn = document.getElementById('clear-btn');
  const installBtn = document.getElementById('install-btn');
  const layoutToggle = document.getElementById('layout-toggle');
  const overflowBtn = document.getElementById('overflow-btn');
  const headerActions = document.querySelector('.header-actions');
  const tabs = document.querySelectorAll('.tab');
  const toast = document.getElementById('toast');

  let suggestedSaveName = null;
  let renderTimer = null;
  let saveTimer = null;
  let deferredInstall = null;
  let overflowMenu = null;

  function showToast(message, isError = false) {
    toast.textContent = message;
    toast.classList.toggle('toast-error', isError);
    toast.hidden = false;
    requestAnimationFrame(() => toast.classList.add('toast-visible'));
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
      toast.classList.remove('toast-visible');
      setTimeout(() => { toast.hidden = true; }, 200);
    }, 2000);
  }

  function render() {
    const html = DOMPurify.sanitize(marked.parse(editor.value || ''));
    preview.innerHTML = html;
  }

  function scheduleRender() {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(render, 150);
  }

  function scheduleAutosave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(LS_DOC, editor.value); } catch (_) {}
    }, 500);
  }

  function defaultFilename(ext) {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
    return `note-${stamp}.${ext}`;
  }

  function sanitizeFilename(name, fallbackExt) {
    if (!name) return defaultFilename(fallbackExt);
    // Strip path separators, keep basename, preserve extension if any.
    const base = String(name).split(/[\\/]/).pop().trim();
    if (!base) return defaultFilename(fallbackExt);
    return base;
  }

  async function saveWithPicker(text, suggestedName, mime, ext, description) {
    if ('showSaveFilePicker' in window) {
      try {
        const accept = {};
        accept[mime] = [`.${ext}`];
        const handle = await window.showSaveFilePicker({
          suggestedName,
          types: [{ description, accept }]
        });
        const writable = await handle.createWritable();
        await writable.write(text);
        await writable.close();
        return { saved: true };
      } catch (err) {
        if (err && err.name === 'AbortError') return { saved: false, cancelled: true };
        throw err;
      }
    }
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: suggestedName });
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return { saved: true };
  }

  async function saveMarkdown() {
    const name = suggestedSaveName || defaultFilename('md');
    try {
      const result = await saveWithPicker(editor.value, name, 'text/markdown', 'md', 'Markdown');
      if (result.saved) showToast('Saved');
    } catch (err) {
      console.error(err);
      showToast('Save failed', true);
    }
  }

  function buildStandaloneHtml(bodyHtml, title) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${title.replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]))}</title>
<style>
  body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; line-height: 1.65; color: #18181b; }
  h1, h2, h3, h4, h5, h6 { line-height: 1.25; }
  h1 { border-bottom: 1px solid #e4e4e7; padding-bottom: 0.3em; }
  code { font-family: ui-monospace, Menlo, Consolas, monospace; background: #f4f4f5; padding: 0.15em 0.4em; border-radius: 4px; font-size: 0.9em; }
  pre { background: #f4f4f5; padding: 14px 16px; border-radius: 6px; overflow-x: auto; }
  pre code { background: transparent; padding: 0; }
  blockquote { border-left: 3px solid #d4d4d8; padding: 0.2em 1em; margin: 0 0 1em; color: #52525b; }
  table { border-collapse: collapse; }
  th, td { border: 1px solid #e4e4e7; padding: 0.4em 0.8em; }
  th { background: #f4f4f5; }
  img { max-width: 100%; height: auto; }
  a { color: #4f46e5; }
</style>
</head>
<body>
${bodyHtml}
</body>
</html>
`;
  }

  async function exportHtml() {
    const body = DOMPurify.sanitize(marked.parse(editor.value || ''));
    const baseName = (suggestedSaveName || defaultFilename('md')).replace(/\.md$/i, '');
    const title = baseName;
    const html = buildStandaloneHtml(body, title);
    try {
      const result = await saveWithPicker(html, `${baseName}.html`, 'text/html', 'html', 'HTML');
      if (result.saved) showToast('Exported');
    } catch (err) {
      console.error(err);
      showToast('Export failed', true);
    }
  }

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(editor.value);
      showToast('Copied');
    } catch (err) {
      console.error(err);
      showToast('Copy failed', true);
    }
  }

  function clearAll() {
    if (editor.value.length > 0 && !confirm('Clear the current document?')) return;
    editor.value = '';
    suggestedSaveName = null;
    try { localStorage.removeItem(LS_DOC); } catch (_) {}
    render();
    editor.focus();
  }

  function applyLayoutMode() {
    const isNarrow = window.innerWidth <= MOBILE_BREAKPOINT;
    const forceSingle = localStorage.getItem(LS_LAYOUT) === '1';
    const single = isNarrow || forceSingle;
    document.body.classList.toggle('single-pane', single);
    if (isNarrow) {
      if (!document.body.classList.contains('show-edit') && !document.body.classList.contains('show-preview')) {
        document.body.classList.add('show-edit');
      }
    } else {
      document.body.classList.remove('show-edit');
      document.body.classList.remove('show-preview');
    }
  }

  function toggleLayout() {
    const current = localStorage.getItem(LS_LAYOUT) === '1';
    localStorage.setItem(LS_LAYOUT, current ? '0' : '1');
    applyLayoutMode();
  }

  function setActiveTab(pane) {
    tabs.forEach(t => {
      const active = t.dataset.pane === pane;
      t.classList.toggle('tab-active', active);
      t.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    document.body.classList.remove('show-edit', 'show-preview');
    document.body.classList.add(pane === 'preview' ? 'show-preview' : 'show-edit');
  }

  function closeOverflow() {
    if (overflowMenu) {
      overflowMenu.remove();
      overflowMenu = null;
      overflowBtn.setAttribute('aria-expanded', 'false');
      document.removeEventListener('click', onDocClickForOverflow, true);
    }
  }

  function onDocClickForOverflow(e) {
    if (!overflowMenu) return;
    if (overflowMenu.contains(e.target) || overflowBtn.contains(e.target)) return;
    closeOverflow();
  }

  function openOverflow() {
    if (overflowMenu) { closeOverflow(); return; }
    overflowMenu = document.createElement('div');
    overflowMenu.className = 'overflow-menu';
    const items = [
      { label: 'Copy', fn: copyAll },
      { label: 'Clear', fn: clearAll },
      { label: 'Export HTML', fn: exportHtml },
      { label: 'Save .md', fn: saveMarkdown, primary: true }
    ];
    items.forEach(({ label, fn, primary }) => {
      const b = document.createElement('button');
      b.className = 'btn ' + (primary ? 'btn-primary' : 'btn-ghost');
      b.textContent = label;
      b.addEventListener('click', () => {
        closeOverflow();
        fn();
      });
      overflowMenu.appendChild(b);
    });
    headerActions.appendChild(overflowMenu);
    overflowBtn.setAttribute('aria-expanded', 'true');
    setTimeout(() => document.addEventListener('click', onDocClickForOverflow, true), 0);
  }

  async function consumePendingShare() {
    const params = new URLSearchParams(location.search);
    if (!params.has('shared')) return null;
    try {
      const cache = await caches.open('md-editor-share');
      const response = await cache.match('/__pending_share__');
      if (!response) return null;
      await cache.delete('/__pending_share__');
      return await response.json();
    } catch (_) {
      return null;
    } finally {
      history.replaceState(null, '', '/');
    }
  }

  function buildTextFromShare(payload) {
    const parts = [];
    if (payload.title) parts.push(`# ${payload.title}`);
    if (payload.text) parts.push(payload.text);
    if (payload.url) parts.push(payload.url);
    return parts.join('\n\n');
  }

  async function applyPendingShare() {
    const payload = await consumePendingShare();
    if (!payload) return false;

    let incoming = null;
    let suggestedName = null;
    if (payload.file && typeof payload.file.content === 'string') {
      incoming = payload.file.content;
      suggestedName = sanitizeFilename(payload.file.name, 'md');
    } else {
      const t = buildTextFromShare(payload);
      if (t) incoming = t;
    }

    if (!incoming) return false;

    const current = editor.value;
    if (current && current !== incoming) {
      if (!confirm('Replace current document with shared content?')) {
        return true; // consumed, but user kept current
      }
    }
    editor.value = incoming;
    if (suggestedName) suggestedSaveName = suggestedName;
    scheduleAutosave();
    render();
    return true;
  }

  function restoreFromLocalStorage() {
    try {
      const saved = localStorage.getItem(LS_DOC);
      if (saved != null) editor.value = saved;
    } catch (_) {}
    render();
  }

  function shouldShowInstall() {
    try {
      const until = parseInt(localStorage.getItem(LS_INSTALL_DISMISSED) || '0', 10);
      return Date.now() >= until;
    } catch (_) {
      return true;
    }
  }

  function initInstallPrompt() {
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      deferredInstall = e;
      if (shouldShowInstall()) installBtn.hidden = false;
    });
    installBtn.addEventListener('click', async () => {
      if (!deferredInstall) return;
      installBtn.hidden = true;
      try {
        deferredInstall.prompt();
        const { outcome } = await deferredInstall.userChoice;
        if (outcome !== 'accepted') {
          const until = Date.now() + INSTALL_DISMISS_DAYS * 24 * 60 * 60 * 1000;
          try { localStorage.setItem(LS_INSTALL_DISMISSED, String(until)); } catch (_) {}
        }
      } finally {
        deferredInstall = null;
      }
    });
    window.addEventListener('appinstalled', () => {
      installBtn.hidden = true;
      try { localStorage.removeItem(LS_INSTALL_DISMISSED); } catch (_) {}
    });
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return;
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.warn('SW registration failed', err);
    });
  }

  editor.addEventListener('input', () => {
    scheduleRender();
    scheduleAutosave();
  });

  saveBtn.addEventListener('click', saveMarkdown);
  exportBtn.addEventListener('click', exportHtml);
  copyBtn.addEventListener('click', copyAll);
  clearBtn.addEventListener('click', clearAll);
  layoutToggle.addEventListener('click', toggleLayout);
  overflowBtn.addEventListener('click', openOverflow);

  tabs.forEach(t => t.addEventListener('click', () => setActiveTab(t.dataset.pane)));

  window.addEventListener('resize', applyLayoutMode);
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overflowMenu) closeOverflow();
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveMarkdown();
    }
  });

  applyLayoutMode();
  initInstallPrompt();

  (async () => {
    const consumed = await applyPendingShare();
    if (!consumed) restoreFromLocalStorage();
    registerServiceWorker();
  })();
})();
