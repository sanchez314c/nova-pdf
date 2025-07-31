# Architecture

Nova PDF Reader uses a three-layer architecture: Electron main process, React renderer process, and an external Kokoro-FastAPI TTS backend running in Docker or a local conda environment.

## System Overview

```
┌──────────────────────────────────────────────────────────────┐
│                     Nova PDF Reader                           │
├──────────────────────────────────────────────────────────────┤
│  Electron Main Process (Node.js)                              │
│  ├── PDFService    — pdf.js extraction, document cache        │
│  ├── TextService   — .txt/.md reader, page splitter (3000c)   │
│  ├── TTSService    — HTTP client to Kokoro API at :8880       │
│  └── IPC Bridge    — typed channels via preload.ts            │
├──────────────────────────────────────────────────────────────┤
│  Renderer Process (React + Vite, sandboxed)                   │
│  ├── App.tsx       — root, file-open event listener           │
│  ├── Header        — custom title bar, window controls        │
│  ├── PDFViewer     — text display + prev/next navigation      │
│  ├── TTSControls   — play/pause/stop, voice select, speed     │
│  ├── Sidebar       — TTS status panel, page list (max 50)     │
│  ├── DropZone      — drag-and-drop file opening               │
│  └── appStore.ts   — Zustand state (document, TTS, UI)        │
├──────────────────────────────────────────────────────────────┤
│  External TTS Backend                                         │
│  └── Kokoro-FastAPI container (port 8880)                     │
│      ├── GPU mode: ghcr.io/remsky/kokoro-fastapi-gpu:latest   │
│      └── CPU mode: ghcr.io/remsky/kokoro-fastapi-cpu:latest   │
└──────────────────────────────────────────────────────────────┘
```

## Process Security Model

The renderer runs with `contextIsolation: true`, `nodeIntegration: false`, and `sandbox: true`. All access to Node.js and native APIs flows through the preload bridge at `src/main/preload.ts`.

The preload script calls `contextBridge.exposeInMainWorld('nova', ...)` and exposes only the typed `NovaAPI` interface. IPC event listeners in the renderer are restricted to the `validChannels` allowlist: `['file:opened', 'tts:chunk']`.

## IPC Flow

```
Renderer (window.nova.*)
  |
  | contextBridge (preload.ts)
  |
  v
ipcRenderer.invoke(channel, ...args)
  |
  | Electron IPC
  |
  v
ipcMain.handle(channel, handler) (main/index.ts)
  |
  v
PDFService | TextService | TTSService
```

## Data Flow: Opening a File

1. User drops a file or clicks "Open PDF" in the renderer.
2. For dialog opens: renderer calls `window.nova.dialog.openFile()`, which triggers `dialog.showOpenDialog` in main, which emits `file:opened` back to the renderer.
3. For drag-and-drop: renderer reads `file.path` from the Electron-augmented `File` object and calls `window.nova.pdf.open(filePath)` directly.
4. Main process loads the file via `PDFService.openDocument()` or `TextService.openDocument()`, caches the parsed document, and returns `{ path, numPages, title }`.
5. `appStore.ts` stores the document, sets `currentPage = 1`, fetches first page text.

## Data Flow: TTS Playback

1. User clicks Play in `TTSControls.tsx`.
2. `sanitizeForTTS()` strips markdown headers, bold/italic markers, inline code, URLs, HTML tags, and list markers from `pageText`.
3. Renderer calls `window.nova.tts.speak(cleanText, voice, speed)`.
4. Main process POSTs to `http://localhost:8880/v1/audio/speech` with `{ model: "kokoro", input, voice, speed, response_format: "wav" }`.
5. Response buffer returned as `Uint8Array` over IPC (Buffer serialized to avoid IPC limitations).
6. Renderer wraps the buffer in a `Blob`, creates an object URL, plays via `<audio>` element.
7. On `audioended`, if more pages remain and `shouldContinueRef.current` is true, auto-advances to next page.

## State Management

Zustand store at `src/renderer/stores/appStore.ts` holds all mutable state:

- **Document state**: `document`, `currentPage`, `pageText`, `isLoading`
- **TTS state**: `ttsStatus`, `voices`, `selectedVoice`, `speed`, `isPlaying`, `isPaused`
- **UI state**: `sidebarOpen`, `theme`

`speed` is clamped to `[0.5, 2.0]` on write. `goToPage` bounds-checks against `document.numPages`.

## PDF Service

`PDFService` (src/main/services/pdfService.ts) uses `pdfjs-dist` in Node.js mode. Documents are cached in a `Map<string, PDFDocumentProxy>` to avoid re-parsing on page navigation. `getPageText` joins text items with spaces and collapses whitespace.

## Text Service

`TextService` (src/main/services/textService.ts) reads `.txt` and `.md` files as UTF-8, splits into virtual pages at 3000-character boundaries, preferring newline splits at 70%+ of the page boundary.

## TTS Service

`TTSService` (src/main/services/ttsService.ts) is a thin HTTP client. It does not manage the Docker container lifecycle in production use (that is handled by `docker compose` or the startup scripts). The `startEngine`/`stopEngine` methods exist for programmatic control but are not called by the app by default. `AbortController` is used to cancel in-flight streaming requests on stop.

## Linux Transparency

Electron frameless transparent windows on Linux need two command-line switches added before `app.whenReady()`:

```typescript
app.commandLine.appendSwitch('enable-transparent-visuals');
app.commandLine.appendSwitch('disable-gpu-compositing');
```

Window creation is also delayed 400ms on Linux to let the compositor initialize.

## UI: Neo-Noir Glass Monitor

The UI uses a custom design system defined in `src/renderer/styles/theme.css` (CSS variables) and `src/renderer/styles/globals.css` (Tailwind component layer). Key characteristics:

- Frameless window: `frame: false`, `transparent: true`, `backgroundColor: '#00000000'`
- App root floats 16px from all edges inside the transparent window
- Accent color: teal `#14b8a6`
- Shadows are layered (3-5 layers per component) instead of backdrop-filter, which is unreliable on Linux
- Glass edge highlights use `::before` pseudo-elements with gradient overlays
