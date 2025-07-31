# Nova PDF Reader

A local-first Electron desktop application for Linux that reads PDF and text documents aloud. TTS is powered by Kokoro-82M via Kokoro-FastAPI — CUDA-accelerated, OpenAI-compatible, running entirely on your machine. No cloud, no uploads.

**Version:** 1.1.1 | **Platform:** Linux (Ubuntu 20.04+) | **License:** MIT

## Features

- PDF, TXT, and Markdown file support
- CUDA-accelerated TTS via Kokoro-82M (35x-100x realtime on RTX GPUs)
- 10 built-in voices (American and British English); live API can return more
- Auto-continue playback across pages
- Playback speed control (0.5x to 2.0x)
- TTS text sanitization: strips markdown, URLs, HTML tags before synthesis
- Frameless transparent window with custom title bar (Neo-Noir Glass Monitor design)
- AppImage and .deb packaging for Linux

## System Requirements

| Requirement | Minimum |
|-------------|---------|
| OS | Ubuntu 20.04+ or compatible Linux |
| Node.js | 20.0.0+ |
| pnpm | 9.0.0+ |
| Docker | 24.0+ with NVIDIA Container Toolkit (for GPU TTS) |
| GPU | NVIDIA with CUDA 12.8+ (optional; CPU fallback available) |
| VRAM | ~2GB for Kokoro-82M |

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/sanchez314c/nova-pdf-reader.git
cd nova-pdf-reader
pnpm install

# 2. Start the TTS engine (GPU Docker)
docker compose -f docker/docker-compose.yml up -d

# Wait ~30s, then verify:
curl http://localhost:8880/v1/audio/voices

# 3. Run the app
pnpm dev
```

CPU-only systems:

```bash
docker compose -f docker/docker-compose.cpu.yml up -d
```

Or skip Docker entirely:

```bash
bash run-source-linux.sh   # starts local Python TTS server + Electron
```

See [docs/QUICK_START.md](docs/QUICK_START.md) for more detail.

## Scripts

| Command | What it does |
|---------|-------------|
| `pnpm dev` | Start Vite dev server + Electron with HMR |
| `pnpm build` | Build renderer + compile main process TypeScript |
| `pnpm dist` | Build + package for Linux (AppImage + .deb) |
| `pnpm dist:appimage` | AppImage only |
| `pnpm dist:deb` | .deb only |
| `pnpm lint` | Run ESLint |
| `pnpm type-check` | TypeScript check, no emit |
| `pnpm test` | Run Vitest tests |
| `pnpm tts:setup` | Set up local Python TTS environment (one-time) |
| `pnpm tts:start` | Start local Kokoro Python server |
| `pnpm tts:stop` | Stop local Kokoro Python server |
| `pnpm clean` | Remove dist/, out/, node_modules/ |

## Project Structure

```
nova-pdf-reader/
├── src/
│   ├── main/
│   │   ├── index.ts           Entry point, window creation, IPC setup
│   │   ├── preload.ts         Context bridge (window.nova API)
│   │   └── services/
│   │       ├── pdfService.ts  pdf.js wrapper, document cache
│   │       ├── textService.ts .txt/.md reader, virtual pagination
│   │       └── ttsService.ts  Kokoro HTTP client
│   ├── renderer/
│   │   ├── App.tsx            Root component
│   │   ├── components/        Header, PDFViewer, TTSControls, Sidebar, DropZone
│   │   ├── stores/appStore.ts Zustand state
│   │   └── styles/            theme.css + globals.css (Neo-Noir design system)
│   └── shared/types.ts        Shared TypeScript interfaces
├── docker/
│   ├── docker-compose.yml     Kokoro GPU container
│   └── docker-compose.cpu.yml Kokoro CPU container
├── tts-server/                Local Python TTS server (conda-based)
├── scripts/                   Start/dev helper scripts
├── resources/icons/           App icons
├── run-source-linux.sh        One-shot: start TTS + Electron from source
└── docs/                      Full documentation
```

## Architecture

The app runs as two Electron processes:

**Main process (Node.js):** Handles file I/O, PDF parsing via `pdfjs-dist`, HTTP calls to the Kokoro TTS API, and window management. All Node.js access goes through typed IPC handlers.

**Renderer process (React + Vite, sandboxed):** The UI. `contextIsolation: true`, `nodeIntegration: false`. Communicates with the main process only through the `window.nova` preload bridge.

**TTS backend (Docker or local Python):** Kokoro-FastAPI on `localhost:8880`. OpenAI-compatible `/v1/audio/speech` endpoint. The app doesn't start or stop this backend itself; it expects it to be running.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full flow.

## Troubleshooting

**TTS shows "OFFLINE"** — Give the container 30-60s to start. Check with `docker logs nova-kokoro-tts`.

**`credentials.cc: Permission denied` on launch** — Run `sudo sysctl -w kernel.unprivileged_userns_clone=1`, or use the `--no-sandbox` flag (already in `pnpm dev:electron`).

**Window is all black / not transparent** — Your compositor may not support alpha. On GNOME this works by default. On minimal WMs, enable compositing (picom/compton).

**PDF shows "No text content"** — The PDF is likely a scanned image. pdf.js can only extract text from PDFs with an actual text layer.

See [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for more.

## Documentation

| Doc | Description |
|-----|-------------|
| [docs/QUICK_START.md](docs/QUICK_START.md) | Get running in 5 minutes |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design and IPC flow |
| [docs/API.md](docs/API.md) | Preload bridge and IPC channel reference |
| [docs/INSTALLATION.md](docs/INSTALLATION.md) | Full install guide |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Dev setup, scripts, debugging |
| [docs/CONFIGURATION.md](docs/CONFIGURATION.md) | TTS backend, build, and design config |
| [docs/TESTING.md](docs/TESTING.md) | Test setup and examples |
| [docs/TECHSTACK.md](docs/TECHSTACK.md) | Dependency reference |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Common issues and fixes |
| [docs/FAQ.md](docs/FAQ.md) | Frequently asked questions |
| [CHANGELOG.md](CHANGELOG.md) | Version history |

## Credits

- [Kokoro-FastAPI](https://github.com/remsky/Kokoro-FastAPI) by remsky
- [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) by hexgrad
- [PDF.js](https://mozilla.github.io/pdf.js/) by Mozilla

## License

MIT. See [LICENSE](LICENSE).
