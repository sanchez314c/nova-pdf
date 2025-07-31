# Development

## Setup

```bash
git clone https://github.com/sanchez314c/nova-pdf-reader.git
cd nova-pdf-reader
pnpm install
```

Start TTS backend first (pick one):

```bash
# Docker GPU
docker compose -f docker/docker-compose.yml up -d

# Docker CPU
docker compose -f docker/docker-compose.cpu.yml up -d

# Local Python server
pnpm tts:start
```

Then start the dev server:

```bash
pnpm dev
```

This runs two processes in parallel (via `concurrently`):
- `pnpm dev:vite` - starts Vite at `http://localhost:5173`
- `pnpm dev:electron` - waits for Vite then launches Electron with `--inspect` and `--no-sandbox`

HMR is active: changes to renderer files reload instantly. Changes to main process files require a restart.

## Scripts Reference

| Script | What it does |
|--------|-------------|
| `pnpm dev` | Start dev mode (Vite + Electron) |
| `pnpm build` | Build Vite + compile TypeScript for Electron |
| `pnpm build:vite` | Build renderer only to `dist/renderer` |
| `pnpm build:electron` | Compile main process TypeScript to `dist/main` |
| `pnpm dist` | Build then package for Linux |
| `pnpm dist:appimage` | Build AppImage |
| `pnpm dist:deb` | Build .deb |
| `pnpm lint` | Run ESLint on `src/**/*.{ts,tsx}` |
| `pnpm lint:fix` | ESLint with auto-fix |
| `pnpm type-check` | TypeScript type checking, no emit |
| `pnpm test` | Run Vitest tests |
| `pnpm test:watch` | Vitest in watch mode |
| `pnpm tts:setup` | Create conda env and install Kokoro dependencies |
| `pnpm tts:start` | Start local Kokoro server |
| `pnpm tts:stop` | Stop local Kokoro server process |
| `pnpm clean` | Remove `dist`, `out`, `node_modules` |

## Directory Structure

```
nova-pdf-reader/
├── src/
│   ├── main/                    # Electron main process (Node.js)
│   │   ├── index.ts             # Window creation, IPC setup, app lifecycle
│   │   ├── preload.ts           # Context bridge - NovaAPI interface
│   │   └── services/
│   │       ├── pdfService.ts    # pdf.js wrapper, document cache
│   │       ├── textService.ts   # .txt/.md reader, page splitter
│   │       └── ttsService.ts    # HTTP client for Kokoro API
│   ├── renderer/                # React frontend (sandboxed)
│   │   ├── index.html           # Vite entry HTML
│   │   ├── main.tsx             # React render root
│   │   ├── App.tsx              # Root component, file-open listener
│   │   ├── components/
│   │   │   ├── Header.tsx       # Custom title bar + window controls
│   │   │   ├── PDFViewer.tsx    # Page display + prev/next nav
│   │   │   ├── TTSControls.tsx  # Play/pause/stop, voice, speed
│   │   │   ├── Sidebar.tsx      # TTS status, page list
│   │   │   ├── DropZone.tsx     # Drag-and-drop landing
│   │   │   └── index.ts         # Component re-exports
│   │   ├── stores/
│   │   │   └── appStore.ts      # Zustand store
│   │   └── styles/
│   │       ├── globals.css      # Tailwind + component layer
│   │       └── theme.css        # Design tokens (CSS variables)
│   └── shared/
│       └── types.ts             # Shared interfaces (PDFDocument, Voice, TTSRequest...)
├── docker/
│   ├── docker-compose.yml       # Kokoro GPU container
│   └── docker-compose.cpu.yml   # Kokoro CPU container
├── tts-server/
│   ├── setup.sh                 # Create conda env, install PyTorch+Kokoro
│   ├── start.sh                 # Activate env, start server.py
│   └── .venv/                   # Self-contained conda env (git-ignored)
├── scripts/
│   ├── start-app.sh             # Production start script
│   └── start-dev.sh             # Dev start helper
├── resources/
│   └── icons/                   # App icons (16x16, 128x128, etc.)
├── run-source-linux.sh          # One-shot: start TTS + Electron
├── vite.config.ts               # Vite config (root: src/renderer, output: dist/renderer)
├── tsconfig.json                # Renderer TypeScript config
├── tsconfig.electron.json       # Main process TypeScript config
├── tailwind.config.js           # Tailwind config
└── package.json                 # Scripts, dependencies, electron-builder config
```

## Adding a New IPC Channel

1. Add the channel name to `IPCChannel` union in `src/shared/types.ts`.
2. Add the handler in `setupIPC()` in `src/main/index.ts`.
3. Expose it via `contextBridge.exposeInMainWorld` in `src/main/preload.ts`.
4. Add the type to `NovaAPI` interface in `src/main/preload.ts`.
5. Call it from the renderer via `window.nova.*`.

If the channel emits events back to the renderer (like `tts:chunk`), add it to `validChannels` in `preload.ts`.

## Debugging

Electron DevTools open automatically in dev mode.

For main process logs:

```bash
# View TTS server logs
tail -f /tmp/nova-tts-server.log

# Check Kokoro container
docker logs nova-kokoro-tts -f

# Verify TTS endpoint
curl http://localhost:8880/v1/audio/voices
```

Main process can be debugged with Node.js inspector on the port opened by `--inspect` in the dev script. Connect via Chrome at `chrome://inspect`.

## TypeScript Configs

Two separate configs handle the split:
- `tsconfig.json` - renderer (targets browser, includes React types)
- `tsconfig.electron.json` - main process (targets Node, outputs to `dist/main`)

## Linting

ESLint config at `eslint.config.js` covers TypeScript and React. Run `pnpm lint:fix` to auto-fix most issues.

`.editorconfig` enforces: 2-space indent, LF line endings, UTF-8, trim trailing whitespace.
