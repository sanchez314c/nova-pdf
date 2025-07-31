# Installation

## Requirements

| Requirement | Minimum | Notes |
|-------------|---------|-------|
| OS | Ubuntu 20.04+ | Linux only; Windows/macOS not officially supported |
| Node.js | 20.0.0 | Use nvm or nvmrc |
| pnpm | 9.0.0 | `npm install -g pnpm` |
| Docker | 24.0+ | For GPU or CPU TTS container |
| NVIDIA GPU | Any CUDA 12.8+ | Optional; CPU fallback available |
| NVIDIA Container Toolkit | Any | Required for GPU Docker container |
| VRAM | 2 GB | For Kokoro-82M model |

For the local Python TTS server (no Docker):

| Requirement | Version |
|-------------|---------|
| conda | Any recent Miniconda/Anaconda |
| CUDA | 11.8 (drivers 470+) |
| Python | 3.11 (installed by setup.sh) |

## Option A: Docker TTS (recommended)

This is the quickest path. Kokoro-FastAPI runs in a Docker container.

```bash
# 1. Clone and install Node dependencies
git clone https://github.com/sanchez314c/nova-pdf-reader.git
cd nova-pdf-reader
pnpm install

# 2. Pull and start Kokoro TTS - GPU mode
docker compose -f docker/docker-compose.yml up -d

# 3. Verify TTS is ready
curl http://localhost:8880/v1/audio/voices

# 4. Start the app in dev mode
pnpm dev
```

CPU-only systems (slower TTS):

```bash
docker compose -f docker/docker-compose.cpu.yml up -d
```

## Option B: Local Python TTS Server (no Docker)

This uses a self-contained conda environment inside `tts-server/.venv`.

```bash
# 1. Install dependencies
pnpm install

# 2. Set up the TTS environment (one-time, ~5 min)
pnpm tts:setup
# or: cd tts-server && bash setup.sh

# 3. Start the TTS server
pnpm tts:start
# or: cd tts-server && bash start.sh

# 4. Start the app
pnpm dev
```

`pnpm tts:setup` creates `tts-server/.venv` with Python 3.11 and installs:
- PyTorch 2.1.2+cu118
- Kokoro TTS dependencies from `tts-server/requirements.txt`

The server binds to `http://localhost:8880`.

## Option C: Run from Source (all-in-one)

`run-source-linux.sh` checks if the TTS server is running, starts it if not, then launches the Electron app via `pnpm dev`.

```bash
bash run-source-linux.sh
```

## Building Distributable Packages

```bash
# AppImage (single-file executable)
pnpm dist:appimage

# .deb package (Debian/Ubuntu)
pnpm dist:deb

# Both
pnpm dist
```

Output goes to `dist-electron/`.

## Electron Sandbox on Linux

If you see `credentials.cc: Permission denied`:

```bash
sudo sysctl -w kernel.unprivileged_userns_clone=1
```

Or run the dev command with `--no-sandbox` (already set in the `dev:electron` script).

## Verifying the Install

```bash
# Check TTS is responding
curl http://localhost:8880/v1/audio/voices

# Check Node version
node --version   # Should be 20+

# TypeScript check
pnpm type-check

# Run tests
pnpm test
```
