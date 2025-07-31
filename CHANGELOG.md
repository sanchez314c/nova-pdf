# Changelog

All notable changes to Nova PDF Reader will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added (2026-03-27 - Neo-Noir Glass Monitor Restyle: Title Bar, About Modal, Status Bar)
- **`AboutModal.tsx`** — New modal with app icon, version, description, MIT license attribution, email, and GitHub badge. Closes on X button, overlay click, or Escape key.
- **`StatusBar.tsx`** — 28px footer bar showing TTS online/offline status dot, page count, and version badge in teal. Renders below `.app-content` inside `.electron-app-root`.
- **`title-bar-left` / `title-bar-center` / `title-bar-right`** CSS classes — explicit `display: flex; align-items: center` so all title bar elements render on one horizontal line.
- **`.title-bar-actions` / `.title-bar-action`** — flat icon button style (no background circle) for the About (ⓘ) button.
- **`.status-bar` CSS block** — 28px footer bar with left/right sections and `.app-version` teal accent.
- **`.about-overlay` / `.about-modal` / `.about-close-btn`** CSS — modal overlay with backdrop blur and glass card styling.
- **`body::before`** — ambient box-shadow behind the floating window chrome.
- **`@keyframes fadeIn`** — used by `.about-overlay` entrance animation.

### Changed (2026-03-27 - Neo-Noir Glass Monitor Restyle: Title Bar, About Modal, Status Bar)
- **`Header.tsx`** — Rewrote to canonical layout: hamburger + icon + "Nova PDF" + "Reader" tagline on one left row; TTS badge + Open PDF + About icon + window controls on right row. Added `onAboutOpen` prop.
- **`App.tsx`** — Imports and renders `AboutModal` and `StatusBar`; manages `aboutOpen` state; passes `onAboutOpen` to `Header`.
- **`Sidebar.tsx`** — Removed implicit logo section; nav content starts at top with `margin-top: 4px`. Section labels updated to 10px, 600 weight, 1.5px letter-spacing.
- **Window controls** — Resized from 32px → 28px circles, gap reduced from 10px → 6px, border removed (pure background fill), close hover uses solid `var(--error)` background.
- **`.electron-app-root`** — Switched from `@apply` shorthand to explicit flex properties; added `border: 1px solid var(--glass-border)` and `border-radius: var(--radius-xl)`.
- **`.app-content`** — Switched from `@apply` to explicit `display: flex; flex: 1; overflow: hidden`.
- **`.sidebar`** — Switched from `@apply` to explicit CSS properties.
- **`--glass-border`** token — Tightened from `rgba(255,255,255,0.05)` → `rgba(255,255,255,0.03)` per canonical spec.

### Removed (2026-03-27 - Step 8: Wire Audit Cleanup)
- **Dead IPC handlers** in `main/index.ts`: `pdf:getMetadata`, `text:getMetadata`, `tts:speakStream` — registered but never invoked from any renderer component
- **Dead preload bridge methods**: `pdf.getMetadata`, `text.getMetadata`, `tts.speakStream`, `tts.onChunk` — exposed but never called; removed from `NovaAPI` interface and `contextBridge.exposeInMainWorld`
- **Dead preload interfaces**: `PDFMetadata`, `TextMetadata` — no longer referenced after getMetadata removal
- **`tts:chunk` from validChannels allowlist** in preload — streaming event with no renderer subscriber
- **Dead service methods**: `PDFService.getAllText`, `PDFService.closeDocument`, `PDFService.getMetadata`; `TextService.getAllText`, `TextService.closeDocument`, `TextService.getMetadata`; `TTSService.speakStream`, `TTSService.startEngine`
- **Dead `TTSService` fields**: `dockerProcess: ChildProcess | null`, `isRunning: boolean` — only set by the now-removed `startEngine`; `ChildProcess` type import also removed
- **Simplified `TTSService.stopEngine`**: removed unreachable `dockerProcess.kill()` branch
- **Dead interface `TextMetadata`** from `textService.ts`
- **Dead store state `theme`** in `appStore.ts` — defined but no component reads or sets it
- **Dead store actions `setTTSStatus`, `setVoices`, `setTheme`** in `appStore.ts` — defined but no component calls them
- **Dead global type declarations** in `App.tsx`: `getMetadata` from pdf/text, `speakStream` and `onChunk` from tts

### Removed (2026-03-27 - Step 6: Dead Code Cleanup)
- `src/shared/types.ts` — exported types were never imported by any file; preload, services, store, and components all define their own local interfaces
- `src/renderer/components/index.ts` — barrel export file; App.tsx imports directly from individual component files, making the barrel unreachable
- `globals.css`: removed 13 unused CSS class definitions: `.main-content`, `.glass-card` (alias for `.card`), `.hero-card`, `.feature-card`, `.glass-panel`, `.btn-ghost`, `.model-item`, `.badge` and all badge variants, `.nav-section-label`, `.warning-banner`, `.loading-overlay`, `.spinner`, `.progress-bar`, `.progress-fill`
- `globals.css`: removed 4 unused utility classes: `.drag-handle`, `.glass`, `.glow-accent`, `.glow-secondary`

### Security
- Upgraded `pdfjs-dist` from 3.11.174 to 4.10.38 — fixes GHSA-wgrm-67xf-hhpq (arbitrary JS execution via malicious PDF)
- Added runtime type guards for all IPC handler arguments in main process
- Added path normalization (`resolve` + `normalize`) to `pdfService` and `textService` to prevent path traversal
- Added input validation (length, format, range) for all TTS arguments (`text`, `voice`, `speed`)
- Fixed `onChunk` IPC listener leak — now returns a cleanup function instead of permanently stacking listeners
- Added `window:maximized-changed` to preload channel allowlist with type-narrowing guard

### Added
- `docs/AUDIT_REPORT.md`: Full forensic audit report (15 findings, all remediated)
- LRU cache eviction (max 10 docs) in `pdfService` and `textService` — prevents unbounded memory growth
- File size guard in `textService` (50 MB max) to prevent OOM on huge text files
- `DropZone` now supports `.txt` and `.md` drag-and-drop (previously only PDF)
- `TextDocument` and `TextMetadata` exported from `shared/types.ts`; `IPCChannel` union expanded to cover all registered channels
- `worker-src blob:` added to CSP in `index.html` — required for pdf.js v4 Web Workers
- `window:maximized-changed` event from main process replaces 500ms polling for maximize state

### Changed
- Replaced 500ms polling `setInterval` for window maximize state with event-driven `window:maximized-changed` IPC events
- `startEngine()` timer now properly cleared on success/error/exit (was leaking a 60s timer handle)
- `stopEngine()` now awaits `docker stop` completion instead of fire-and-forget detached spawn
- `pdfService.cleanup()` and `textService.cleanup()` now called in `before-quit` hook
- Removed duplicate `ipcMain.on('window-is-maximized')` synchronous handler — only async `ipcMain.handle` remains

### Removed
- Dead dependencies: `better-sqlite3`, `drizzle-orm`, `electron-store`, `uuid`, `@types/better-sqlite3`, `@types/uuid` (zero usage in source)

### Fixed
- Blob URL memory leak in `TTSControls` — `URL.revokeObjectURL()` now called on each new play, on stop, and when audio ends naturally
- `handleMaximize` in `App.tsx` no longer speculatively flips state before the OS confirms — state is now purely event-driven

---

### Added (docs)
- docs/TESTING.md: Vitest test setup, example patterns, Electron IPC mocking guide
- docs/PERFORMANCE.md: TTS latency benchmarks, memory profile, rendering notes
- docs/CONFIGURATION.md: TTS backend config, Electron window settings, AppPreferences spec
- docs/MIGRATION.md: Upgrade notes v1.0.x to v1.1.x, future migration plans

### Changed
- README.md: Rewritten for accuracy (correct voice count, script table, architecture description)
- VERSION_MAP.md: Updated to v1.1.1 active, added package identifiers and dependency table
- docs/DOCUMENTATION_INDEX.md: Full master index of all 27 docs with descriptions and audiences
- docs/README.md: Updated to include all 19 docs/ entries

## [1.1.1] - 2026-03-14

### Added
- Full documentation standardization: 15 docs/ files created (ARCHITECTURE, API, INSTALLATION, DEVELOPMENT, BUILD_COMPILE, DEPLOYMENT, QUICK_START, WORKFLOW, TECHSTACK, FAQ, TROUBLESHOOTING, LEARNINGS, PRD, TODO, docs/README)
- CODE_OF_CONDUCT.md (Contributor Covenant v2.1)
- .github/ISSUE_TEMPLATE/bug_report.md
- .github/ISSUE_TEMPLATE/feature_request.md
- .github/PULL_REQUEST_TEMPLATE.md

### Changed
- LICENSE: updated copyright year to 2026, copyright holder to Jason Paul Michaels
- VERSION_MAP.md: updated to reflect all versions correctly
- docs/DOCUMENTATION_INDEX.md: superseded by docs/README.md

### Removed
- changelog.md (lowercase duplicate): moved to archive

## [1.0.0] - 2025-02-01

### Added
- Initial release of Nova PDF Reader
- PDF viewing with clean text extraction via pdf.js
- Text/Markdown file support with paginated display
- CUDA-accelerated text-to-speech via Kokoro-82M (35x-100x realtime)
- Streaming audio generation with chunk-based playback
- 10+ voices across American and British English
- Auto-continue playback across pages
- Modern dark UI with React 18 + Tailwind CSS
- Electron desktop application with context isolation and sandbox security
- Docker Compose configurations for GPU and CPU TTS backends
- Local TTS server option via conda + FastAPI
- Drag-and-drop PDF file opening
- Voice selection and speed control (0.5x - 2.0x)
- TTS text sanitization (strips markdown, URLs, HTML)
- Linux packaging support (AppImage and .deb)
- Run-from-source script for development

## [1.0.1] - 2025-02-07

### Added
- Repository compliance files (LICENSE, CONTRIBUTING, SECURITY, CODE_OF_CONDUCT)
- GitHub issue and PR templates
- CI/CD workflow via GitHub Actions
- EditorConfig for consistent formatting
- Enhanced .gitignore with Python patterns

### Changed
- Enhanced README with badges and improved structure

## [1.1.0] - 2025-02-08

### Changed
- **Neo-Noir Glass Monitor Design System** — Complete visual overhaul
  - Updated accent color from Emerald (#10b981) to Teal (#14b8a6)
  - Implemented layered shadow system for 3D depth (3-5 shadow layers per element)
  - Added ambient gradient mesh backgrounds to hero/feature cards
  - Implemented glass edge highlight with ::before pseudo-elements
  - Replaced backdrop-filter reliance with semi-transparent backgrounds
  - Added body padding (16px) for floating window effect

### Fixed
- Electron window hasShadow now set to false (CSS handles depth)
- Scrollbar width reduced to 6px for cleaner appearance
- Input focus states now use teal glow effect
- Window manager border removed via `type: 'popup'` configuration
- Window size adjusted to account for body padding (32px total)

### Technical
- Updated theme.css with complete Neo-Noir design token system
- Updated globals.css with new component styles
- Updated tailwind.config.js with noir color palette
- Restyled DropZone component with ambient gradient mesh
- All hover states now include lift transform + shadow escalation
- Added `--enable-transparent-visuals` flag for proper Linux transparency
