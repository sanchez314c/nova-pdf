# Tech Stack

## Runtime Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| electron | ^33.0.0 | Desktop framework, window management, IPC |
| react | ^18.3.1 | UI component framework |
| react-dom | ^18.3.1 | React DOM renderer |
| zustand | ^5.0.0 | Lightweight state management for renderer |
| pdfjs-dist | ^3.11.174 | PDF parsing in Node.js (main process) |
| electron-store | ^8.2.0 | Persistent settings storage (available, not yet wired) |
| better-sqlite3 | ^11.0.0 | SQLite bindings (available, not yet wired) |
| drizzle-orm | ^0.30.0 | ORM for SQLite (available, not yet wired) |
| uuid | ^10.0.0 | UUID generation |

## Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| vite | ^6.0.0 | Renderer build tool and dev server |
| @vitejs/plugin-react | ^4.3.0 | React HMR and JSX transform |
| typescript | ^5.6.0 | Type checking |
| tailwindcss | ^3.4.14 | Utility CSS framework |
| postcss | ^8.4.47 | CSS processing for Tailwind |
| autoprefixer | ^10.4.20 | CSS vendor prefixes |
| electron-builder | ^25.0.0 | Packaging to AppImage/.deb |
| concurrently | ^9.0.0 | Run Vite and Electron in parallel |
| wait-on | ^8.0.0 | Wait for Vite dev server before launching Electron |
| vitest | ^2.0.0 | Test runner |
| eslint | ^9.0.0 | Linting |
| @typescript-eslint/* | ^8.0.0 | TypeScript ESLint rules |
| eslint-plugin-react | ^7.37.0 | React-specific lint rules |
| eslint-plugin-react-hooks | ^5.0.0 | Hooks lint rules |
| rimraf | ^6.0.0 | Cross-platform rm -rf |

## External Backend

| Service | Image | Purpose |
|---------|-------|---------|
| Kokoro-FastAPI (GPU) | ghcr.io/remsky/kokoro-fastapi-gpu:latest | CUDA TTS, port 8880 |
| Kokoro-FastAPI (CPU) | ghcr.io/remsky/kokoro-fastapi-cpu:latest | CPU TTS fallback |

Kokoro-FastAPI exposes an OpenAI-compatible `/v1/audio/speech` endpoint backed by the Kokoro-82M model (82 million parameters). On RTX GPUs it runs 35x-100x realtime.

## Local Python TTS Server (alternative to Docker)

| Package | Version | Purpose |
|---------|---------|---------|
| Python | 3.11 | Runtime |
| PyTorch | 2.1.2+cu118 | Deep learning framework (CUDA 11.8) |
| Kokoro TTS | latest | Text-to-speech model library |
| FastAPI | latest | HTTP server |
| uvicorn | 0.40.0 | ASGI server |

The local server is set up in `tts-server/.venv` (self-contained conda env) via `tts-server/setup.sh`.

## Design System

The UI is the Neo-Noir Glass Monitor design system:
- CSS custom properties defined in `src/renderer/styles/theme.css`
- Component styles in Tailwind `@layer components` in `src/renderer/styles/globals.css`
- Primary font: Inter (system fallback to -apple-system)
- Monospace font: JetBrains Mono, Fira Code, SF Mono (system fallbacks)
- Accent color: Teal #14b8a6
- Layered shadow system (3-5 layers per element) for 3D depth without backdrop-filter

## Build Pipeline

```
TypeScript (src/main/)
  -> tsc (tsconfig.electron.json)
  -> dist/main/

TypeScript + React (src/renderer/)
  -> Vite + @vitejs/plugin-react
  -> dist/renderer/

dist/ + package.json + node_modules/
  -> electron-builder
  -> dist-electron/NovaPDFReader-*.AppImage
  -> dist-electron/nova-pdf-reader_*_amd64.deb
```
