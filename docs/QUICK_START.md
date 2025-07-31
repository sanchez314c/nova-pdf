# Quick Start

Get Nova PDF Reader running in under 5 minutes.

## Prerequisites

- Ubuntu 20.04+ with Node 20+ and pnpm installed
- Docker with NVIDIA Container Toolkit (for GPU TTS)

## 1. Install

```bash
git clone https://github.com/sanchez314c/nova-pdf-reader.git
cd nova-pdf-reader
pnpm install
```

## 2. Start TTS Engine

GPU (recommended):

```bash
docker compose -f docker/docker-compose.yml up -d
```

CPU-only (slower TTS):

```bash
docker compose -f docker/docker-compose.cpu.yml up -d
```

Wait ~30 seconds for the container to pull and start. Check it's ready:

```bash
curl http://localhost:8880/v1/audio/voices
```

You should see a JSON array of voices.

## 3. Run the App

```bash
pnpm dev
```

The app opens. The header shows a green "CUDA" or "CPU" badge when TTS is connected.

## 4. Open a File

- Click "Open PDF" in the header, or
- Drag and drop a PDF onto the drop zone

## 5. Listen

1. Select a voice from the dropdown
2. Set playback speed (0.5x to 2.0x)
3. Click Play

The app reads the current page aloud, then auto-advances to the next page.

## All-in-One Script

```bash
bash run-source-linux.sh
```

This starts the local Python TTS server (not Docker) and launches the app.

## Stopping the TTS Engine

```bash
docker compose -f docker/docker-compose.yml down
```

Or if using local server:

```bash
pnpm tts:stop
```
