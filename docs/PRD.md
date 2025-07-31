# Product Requirements Document
## Nova PDF Reader v1.1.1

---

## 1. Product Overview

Nova PDF Reader is a local-first Electron desktop application for Linux that reads PDF and text documents aloud using high-quality, CUDA-accelerated text-to-speech. It runs entirely on the user's machine — no cloud, no uploads, no subscription.

The core bet is simple: existing TTS solutions either require sending your documents to a server, sound robotic, or are buried inside tools built for something else. Nova does one thing — read your documents to you, at quality that's actually usable, from hardware you already own.

Built on Electron 33, React 18, Vite 6, TypeScript, and Tailwind CSS 3.4. TTS is powered by Kokoro-82M via Kokoro-FastAPI, running in Docker with NVIDIA GPU passthrough or as a local Python server.

**Current version:** 1.1.1
**Initial release:** 2025-02-01
**Platform:** Linux (primary), Ubuntu 24.04 tested

---

## 2. Target Users

**Primary user:** A Linux/Ubuntu power user with an NVIDIA GPU who reads a lot — technical documentation, books, research papers, long articles. They want to listen while doing something else: commuting, cooking, exercising, working with their hands.

**What they care about:**
- Audio quality that doesn't grate after 10 minutes
- Complete privacy — documents never leave the machine
- Something that just works without a complex setup ritual

**What they don't need (and Nova doesn't provide):**
- PDF annotation or editing
- Cloud sync or backup
- Multi-platform support (not yet)
- OCR for scanned documents
- Password-protected PDF decryption

---

## 3. Functional Requirements

### 3.1 File Loading

| Capability | Status | Details |
|---|---|---|
| Open PDF via file dialog | Implemented | Native system dialog, filters for .pdf / .txt / .md |
| Open PDF via drag-and-drop | Partially implemented | DropZone only handles .pdf drops; .txt and .md are ignored in the drop handler even though `App.tsx` handles them via `file:opened` channel |
| Open text/markdown files | Implemented | Handled via `text:open` IPC, dialog supports .txt and .md |
| File type detection | Implemented | Based on extension; routes to pdfService or textService |

**Known bug:** Dropping a .txt or .md file onto the DropZone does nothing. The issue is in `DropZone.tsx` — it only calls `window.nova.pdf.open`. The `file:opened` channel handler in `App.tsx` correctly routes both types, so opening via dialog works fine.

### 3.2 PDF Processing

- Text extraction via pdfjs-dist v3.11.174
- Page-by-page extraction using `getTextContent()`, joining text items with spaces
- Document cache (`Map<string, PDFDocumentProxy>`) to avoid re-parsing on page navigation
- Metadata extraction: title, author, subject, creator, producer, creation date
- Page count reported on open

**Limitation:** No text layer detection. When a PDF page has no embedded text (scanned image, complex layout), the viewer shows "No text content found on this page" without any explanation that OCR would be needed.

### 3.3 Text/Markdown Processing

- Raw file read via Node.js `fs/promises`
- Virtual pagination at 3,000 characters per page
- Split logic prefers newline boundaries over mid-word cuts (falls back to last space if no newline within 70% of the target)
- Metadata: word count, character count, page count

**Limitation:** Pagination splits on characters, not sentences. A paragraph can break mid-sentence between pages.

### 3.4 TTS Engine

Two deployment options:

**Option A — Docker (primary)**
- Image: `ghcr.io/remsky/kokoro-fastapi-gpu:latest`
- GPU: NVIDIA GPU passthrough via Docker Compose (`--gpus all`)
- CPU fallback: `docker-compose.cpu.yml`
- Port: 8880
- Health check: polls `/v1/audio/voices`

**Option B — Local Python server**
- `tts-server/server.py` — FastAPI + Kokoro + PyTorch
- Requires conda environment with torch, soundfile, kokoro
- Same API surface as Option A

The app itself doesn't know or care which backend is running — it just hits `http://localhost:8880`.

**TTS API calls:**
- `GET /v1/audio/voices` — status check and voice list
- `POST /v1/audio/speech` — generate audio
  - Non-streaming: returns WAV
  - Streaming: returns MP3 chunks

**Default voices (hardcoded fallback if API unreachable):**
- American English: Bella (F), Nicole (F), Sarah (F), Sky (F), Adam (M), Michael (M)
- British English: Emma (F), Isabella (F), George (M), Lewis (M)

The live API can return more voices depending on what Kokoro-FastAPI exposes.

### 3.5 Playback Controls

| Control | Status | Notes |
|---|---|---|
| Play | Implemented | Fetches full page audio, plays via HTML `<audio>` element |
| Pause / Resume | Implemented | Uses `audioRef.current.pause()` / `.play()` |
| Stop | Implemented | Resets playback position, aborts streaming requests |
| Auto-advance to next page | Implemented | Triggers on `audioEnded` event if `shouldContinueRef` is set |
| Speed control | Implemented | Slider 0.5x to 2.0x, step 0.1. Clamped in Zustand store. Applied via `audioRef.current.playbackRate` |
| Voice selection | Implemented | Dropdown populated from live API; falls back to hardcoded list |

**Stop limitation:** `tts:stop` only aborts streaming requests via `AbortController`. Non-streaming `speak()` calls (the main playback path) cannot be cancelled mid-request — the audio will keep generating server-side until the response completes.

### 3.6 Text Preprocessing for TTS

Before text is sent to the TTS engine, `sanitizeForTTS()` strips:
- URLs (http/https and www.)
- Email addresses
- Markdown headers, bold/italic/strikethrough markers
- Inline and fenced code blocks
- Markdown links (keeps link text, drops URL)
- Markdown images (drops entirely)
- HTML tags
- Bullet points and numbered list markers
- Blockquotes
- Horizontal rules
- Excess whitespace and blank lines

### 3.7 UI and Navigation

**Header (title bar):**
- App icon and name
- Document filename or title (center, truncated)
- TTS engine status badge (CUDA / CPU / OFFLINE with pulsing dot)
- "Open PDF" button
- Custom window controls (minimize, maximize/restore, close)

**Sidebar:**
- TTS engine status panel with GPU/CPU mode indicator
- Page list (first 50 pages shown as clickable buttons, "+N more pages" label for longer docs)
- Quick start guide
- "Refresh Status" button to re-poll TTS engine
- Toggle via hamburger button in header

**PDF Viewer / Text Area:**
- Previous / Next page buttons
- Direct page number input (number field, validates against page range)
- Page text displayed in scrollable card
- Loading spinner during page fetch

**Drop Zone (no document loaded):**
- Drag-and-drop target with visual feedback (border highlight + scale on hover)
- "Browse Files" button
- TTS engine status shown inline
- Command hint to start TTS engine if offline

### 3.8 State Management

Zustand v5 store (`appStore.ts`) holds all app state:
- Document (path, page count, title, file type)
- Current page and page text
- TTS status, voice list, selected voice, speed
- Playback state (isPlaying, isPaused)
- Sidebar open/closed toggle
- Theme (dark/light field exists but no light theme is implemented)

---

## 4. Non-Functional Requirements

### 4.1 Performance

| Metric | Target | Notes |
|---|---|---|
| TTS first audio (GPU) | < 500ms | Kokoro-82M on RTX-class GPU |
| TTS first audio (CPU) | < 5000ms | Docker CPU mode only |
| PDF open time | < 1s | Typical single-file documents |
| Memory at idle | < 400MB | Electron baseline is around 150-200MB |
| GPU VRAM | ~2GB | Kokoro-82M model size |

### 4.2 Security

The renderer process is locked down:
- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true`
- `webSecurity: true`

All Node.js access goes through a typed preload bridge (`preload.ts`). IPC event listeners are restricted to an allowlist: `file:opened` and `tts:chunk` only.

TTS text is sanitized before leaving the renderer (HTML, URLs, markdown stripped). The local TTS server doesn't receive raw user input — it receives cleaned plain text.

Linux sandbox workaround: `app.commandLine.appendSwitch('no-sandbox')` is set on Linux due to the kernel `unprivileged_userns_clone` restriction common on Ubuntu. This is a known Chromium/Electron requirement on some Linux configs, not a deliberate security reduction.

### 4.3 Accessibility

No accessibility work has been done. There are no ARIA labels, no keyboard navigation beyond what the browser provides by default, and no screen reader support. This is a known gap.

### 4.4 Reliability

- Document cache in both PDF and text services prevents redundant re-parsing
- TTS status polled on app start; manual refresh available in sidebar
- Errors in file open and TTS playback are caught but only logged to console — no user-facing error UI exists yet
- App cleans up TTS service (aborts requests, stops Docker container) on `before-quit`

---

## 5. Technical Architecture

```
Electron Main Process
  ├── index.ts               Entry point, window creation, IPC setup
  ├── services/
  │   ├── pdfService.ts      pdf.js text extraction, document cache
  │   ├── textService.ts     Plain text/MD read, virtual pagination
  │   └── ttsService.ts      Kokoro HTTP client, streaming, Docker control
  └── preload.ts             Context bridge — typed API exposed as window.nova

Renderer Process (React + Vite)
  ├── App.tsx                Root component, file open handler, window state
  ├── components/
  │   ├── Header.tsx         Title bar, window controls, TTS badge
  │   ├── PDFViewer.tsx      Page nav, text display
  │   ├── TTSControls.tsx    Playback buttons, voice select, speed slider
  │   ├── Sidebar.tsx        TTS status, page list, quick start
  │   └── DropZone.tsx       Initial state, drag-and-drop, file browse
  └── stores/appStore.ts     Zustand state, async actions

Shared
  └── types.ts               Shared TypeScript interfaces

External
  └── Kokoro-FastAPI          TTS backend on localhost:8880
      ├── Docker (GPU)        docker-compose.yml
      ├── Docker (CPU)        docker-compose.cpu.yml
      └── Local Python        tts-server/server.py
```

### IPC Channels

| Channel | Direction | Purpose |
|---|---|---|
| `pdf:open` | Renderer → Main | Open and cache PDF, return doc info |
| `pdf:getText` | Renderer → Main | Fetch page text |
| `pdf:getMetadata` | Renderer → Main | Fetch PDF metadata |
| `text:open` | Renderer → Main | Open text/MD file |
| `text:getText` | Renderer → Main | Fetch virtual page text |
| `text:getMetadata` | Renderer → Main | Word/char counts |
| `tts:status` | Renderer → Main | Poll Kokoro health |
| `tts:voices` | Renderer → Main | Get voice list |
| `tts:speak` | Renderer → Main | Generate audio (non-streaming) |
| `tts:speakStream` | Renderer → Main | Generate audio (streaming) |
| `tts:stop` | Renderer → Main | Abort active request |
| `tts:chunk` | Main → Renderer | Push streaming audio chunk |
| `file:opened` | Main → Renderer | Notify of file selected via dialog |
| `dialog:openFile` | Renderer → Main | Open native file dialog |
| `window-minimize` | Renderer → Main | Minimize window |
| `window-maximize` | Renderer → Main | Toggle maximize |
| `window-close` | Renderer → Main | Close window |
| `window-is-maximized` | Renderer → Main | Query maximize state |

---

## 6. Feature Inventory (Current State)

### Implemented and Working

- PDF text extraction with page-by-page navigation
- Text and markdown file support with virtual pagination
- TTS playback via Kokoro-FastAPI (non-streaming path is primary)
- Play, pause, resume, stop controls
- Auto-continue across pages
- Voice selection (from live API or hardcoded fallback)
- Speed control (0.5x to 2.0x)
- TTS text sanitization (markdown, URLs, HTML)
- Frameless transparent window with custom title bar
- Neo-Noir Glass Monitor dark theme (CSS custom property system)
- Linux window controls (minimize, maximize, close)
- Sidebar with TTS status and page list (first 50 pages)
- Drag-and-drop for PDF files
- File dialog for PDF, TXT, and MD files
- Docker Compose configs for GPU and CPU TTS backends
- Local Python TTS server alternative
- AppImage and .deb build targets
- Context isolation, sandbox, no node integration

### Partially Implemented

- Streaming TTS (`speakStream` is wired up but the primary playback uses non-streaming `speak` — streaming is unused in the current UI)
- Stop for streaming only (non-streaming requests can't be cancelled)
- Drag-and-drop for text/markdown (dialog works, drop doesn't)

### Installed but Not Wired

- `electron-store` — dependency installed, `AppPreferences` type defined in shared/types.ts, but settings are not persisted. Voice and speed reset to defaults on every launch.
- `better-sqlite3` + `drizzle-orm` — installed but completely unused. No SQLite database is created or accessed anywhere.

### Not Implemented

- User-visible error messages (errors only go to console)
- Scanned PDF detection (no text layer = silent blank page)
- Bookmarks / saved positions
- Word highlighting during playback
- Persistent preferences (voice, speed)
- Light theme (field exists in store, no styles exist)
- Sidebar page navigation beyond 50 pages
- Multiple documents open simultaneously
- OCR for scanned PDFs

---

## 7. Known Limitations and Defects

### Bugs

1. **DropZone ignores .txt/.md** — `DropZone.tsx` only handles PDF drops. Drag a text file onto the window and nothing happens.

2. **Window maximize polling** — `App.tsx` polls `window.nova.window.isMaximized()` every 500ms. Should use native maximize/unmaximize events instead.

3. **Non-streaming stop** — `tts:stop` sends an abort signal, but the primary playback path uses non-streaming `speak()`, which can't be aborted mid-request. Clicking stop during a long page won't interrupt audio generation server-side.

4. **Stale types file** — `src/shared/types.js` (compiled artifact) and `src/shared/types.ts` both exist. The `.js` is a leftover build artifact that should be deleted.

### Gaps

5. **No error UI** — File open failures and TTS errors only log to `console.error`. Users see nothing when something goes wrong.

6. **No scanned PDF warning** — Empty text pages show "No text content found on this page" with no indication that the file may be a scanned image requiring OCR.

7. **Sentence-break pagination** — Text service splits at character boundaries, not sentence boundaries. Pages can start or end mid-sentence.

8. **No persistent settings** — Voice and speed reset on every launch. The infrastructure (`electron-store`, `AppPreferences`) is in place but not connected.

9. **Unused dependencies** — `better-sqlite3` and `drizzle-orm` are listed in package.json but serve no purpose in the current codebase. These add install size with no benefit.

---

## 8. Dependencies and System Requirements

### Runtime Requirements

| Requirement | Minimum | Notes |
|---|---|---|
| OS | Linux | Ubuntu 24.04 tested |
| GPU | NVIDIA (CUDA) | Required for GPU TTS mode |
| VRAM | 2 GB | Kokoro-82M model |
| Docker | Latest | For containerized TTS backend |
| NVIDIA Container Toolkit | Latest | For GPU passthrough to Docker |
| Node.js | 20.0.0+ | Main process runtime |
| pnpm | 9.0.0+ | Package manager |

**CPU fallback:** The CPU Docker Compose config (`docker-compose.cpu.yml`) allows running without a GPU. Latency will be significantly higher.

**Local Python alternative:** Requires conda/miniconda, PyTorch with CUDA support, and a Kokoro model download. The `tts-server/setup.sh` script handles this.

### Key Dependencies

| Package | Version | Purpose |
|---|---|---|
| electron | ^33.0.0 | Desktop shell |
| react | ^18.3.1 | UI framework |
| react-dom | ^18.3.1 | React DOM renderer |
| vite | ^6.0.0 | Dev server and bundler |
| typescript | ^5.6.0 | Type checking |
| tailwindcss | ^3.4.14 | Utility CSS |
| zustand | ^5.0.0 | State management |
| pdfjs-dist | ^3.11.174 | PDF text extraction |
| electron-store | ^8.2.0 | Settings persistence (installed, unused) |
| better-sqlite3 | ^11.0.0 | SQLite (installed, unused) |
| drizzle-orm | ^0.30.0 | ORM (installed, unused) |
| electron-builder | ^25.0.0 | Linux packaging (AppImage, .deb) |
| vitest | ^2.0.0 | Test runner |

### External Service

Kokoro-FastAPI on `http://localhost:8880` — the app assumes this is running before launch. There is no automatic engine start from within the app (the `startEngine()` method exists in `ttsService.ts` but is not called from the IPC handlers or any UI action). Users start the TTS backend manually using `pnpm tts:start` or Docker Compose.

---

## 9. Build and Distribution

### Development

```bash
pnpm dev          # Starts Vite dev server (port 54450) + Electron
pnpm tts:start    # Start TTS backend (Docker GPU)
```

### Production Build

```bash
pnpm dist         # Build + package (AppImage + .deb)
pnpm dist:deb     # .deb only
pnpm dist:appimage  # AppImage only
```

Build output goes to `dist-electron/`. The `run-source-linux.sh` script runs from source without building.

### Package IDs

- App ID: `com.sanchez314c.nova-pdf-reader`
- AppImage artifact: `NovaPDFReader-${version}.AppImage`
- Linux category: Office

---

## 10. Roadmap

Items ordered by impact. All are currently unimplemented.

**High priority (blocking usability):**
1. Wire up `electron-store` for persistent voice and speed settings
2. Add user-visible error messages for file open failures and TTS errors
3. Fix DropZone to handle .txt and .md files the same way the dialog does
4. Add scanned PDF detection with a clear "no text layer" message

**Medium priority (quality of life):**
5. Smarter text pagination using sentence boundaries
6. Replace maximize state polling with native window events
7. Cancel non-streaming TTS requests on stop
8. Remove unused `better-sqlite3` and `drizzle-orm` dependencies, or wire them up for history/bookmarks
9. Extend sidebar page navigation beyond 50 pages

**Lower priority (nice to have):**
10. Word highlighting during playback (requires word-level timing from TTS API)
11. Bookmarks / saved positions (would use SQLite if kept)
12. Multiple documents open simultaneously
13. Light theme implementation

**Out of scope for now:**
- OCR for scanned PDFs (would require Tesseract integration)
- Windows and macOS builds (Linux-specific flags need platform gating first)
- Cloud sync of any kind
