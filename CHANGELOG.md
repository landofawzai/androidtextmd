# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] — 2026-04-21

First functional release. Deployed to https://landofawzai.github.io/androidtextmd/ and installable as a PWA on Android Chrome.

### Added
- Single-page markdown editor with live preview (150ms debounce).
- Save as `.md` via File System Access API with blob-download fallback.
- Export rendered HTML as a standalone styled file.
- Copy-all and clear-with-confirm actions.
- Auto-save of textarea contents to `localStorage` (500ms debounce).
- Share target manifest entry (POST + multipart/form-data) for both text and file shares.
- Service worker with cache-first app shell, offline support, and share-POST handling.
- Install prompt with 30-day re-prompt window after dismissal.
- Split-pane layout on ≥768px screens; Edit/Preview tabs on mobile.
- Scope-relative paths so the app runs under any subpath (e.g. GitHub Pages).

### Specification
- See [markdown-editor-spec.md](markdown-editor-spec.md) for the frozen spec this release implements.

## [Unreleased]
