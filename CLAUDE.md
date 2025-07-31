# CLAUDE.md - Nova PDF Reader

## Project Overview

Nova PDF Reader is a modern Electron application for Ubuntu that transforms PDF documents into audio using CUDA-accelerated TTS via Kokoro-82M.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Nova PDF Reader                          │
├─────────────────────────────────────────────────────────────┤
│  Electron Main Process                                       │
│  ├── PDF Service (pdf.js extraction)                        │
│  ├── TTS Service (HTTP client → Kokoro API)                 │
│  └── IPC Bridge (context isolated)                          │
├─────────────────────────────────────────────────────────────┤
│  Renderer Process (React + Vite)                            │
│  ├── PDF Viewer (text display + navigation)                 │
│  ├── TTS Controls (play/pause/stop + voice selection)       │
│  └── Zustand State (document, audio, preferences)           │
├─────────────────────────────────────────────────────────────┤
│  Docker Container                                            │
│  └── Kokoro-FastAPI (CUDA TTS, port 8880)                   │
└─────────────────────────────────────────────────────────────┘
```

## Key Technologies

- **Electron 33+**: Desktop framework
- **React 18**: UI framework
- **Vite 6**: Build tool
- **Zustand 5**: State management
- **Tailwind CSS 3.4**: Styling
- **pdf.js 4.5**: PDF parsing
- **Kokoro-FastAPI**: CUDA TTS backend

## Development Commands

```bash
pnpm dev          # Start development
pnpm build        # Build for production
pnpm dist         # Package for Linux
pnpm tts:start    # Start TTS engine
pnpm tts:stop     # Stop TTS engine
pnpm lint         # Run linter
pnpm type-check   # TypeScript check
```

## TTS Integration

The application communicates with Kokoro-FastAPI via HTTP:

```typescript
// Speak text
POST http://localhost:8880/v1/audio/speech
{
  "model": "kokoro",
  "input": "Text to speak",
  "voice": "af_bella",
  "speed": 1.0,
  "response_format": "mp3"
}

// Get voices
GET http://localhost:8880/v1/audio/voices
```

## File Structure

| Path | Purpose |
|------|---------|
| `src/main/index.ts` | Electron entry, window management, IPC |
| `src/main/preload.ts` | Context bridge for renderer |
| `src/main/services/ttsService.ts` | Kokoro API client |
| `src/main/services/pdfService.ts` | PDF text extraction |
| `src/renderer/App.tsx` | Root React component |
| `src/renderer/stores/appStore.ts` | Zustand state |
| `src/renderer/components/` | UI components |
| `docker/docker-compose.yml` | Kokoro GPU container |

## Critical Notes

1. **Context Isolation**: All IPC is type-safe via preload bridge
2. **TTS Dependency**: Requires Docker + NVIDIA GPU for full performance
3. **Streaming**: Audio chunks via IPC for low-latency playback
4. **Security**: CSP headers, sandboxed renderer, no nodeIntegration

## Performance Targets

- TTS latency: <500ms first audio
- PDF load: <1s for typical documents
- Memory: <400MB idle
- GPU VRAM: ~2GB for Kokoro

## Testing

```bash
pnpm test           # Run unit tests
pnpm type-check     # Validate types
curl localhost:8880/v1/audio/voices  # Verify TTS
```
