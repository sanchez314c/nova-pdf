# Deployment

Nova PDF Reader is a desktop app, not a web service. "Deployment" means distributing the packaged binary to Linux systems.

## Building the Package

```bash
# Full build + package
pnpm dist

# AppImage only
pnpm dist:appimage

# .deb only
pnpm dist:deb
```

Packages land in `dist-electron/`.

## AppImage Distribution

AppImages are portable and run on any modern Linux distribution without installation.

```bash
# Make executable
chmod +x NovaPDFReader-1.0.0.AppImage

# Run it
./NovaPDFReader-1.0.0.AppImage
```

If you see sandbox errors on the target machine:

```bash
./NovaPDFReader-1.0.0.AppImage --no-sandbox
```

Or enable unprivileged namespaces on the target system:

```bash
sudo sysctl -w kernel.unprivileged_userns_clone=1
```

To persist across reboots:

```bash
echo "kernel.unprivileged_userns_clone=1" | sudo tee /etc/sysctl.d/99-nova.conf
```

## .deb Distribution

```bash
sudo dpkg -i nova-pdf-reader_1.0.0_amd64.deb
# or
sudo apt install ./nova-pdf-reader_1.0.0_amd64.deb
```

The .deb installs to standard paths and adds a desktop entry.

## TTS Backend Requirements on Target System

The packaged Electron app does NOT bundle the Kokoro TTS engine. End users need one of:

1. **Docker + NVIDIA Container Toolkit** (GPU mode)
2. **Docker** (CPU mode, no GPU required)
3. **The local conda TTS server** (from `tts-server/`)

Distribute the start/setup scripts alongside the binary, or include instructions to run:

```bash
# GPU
docker run --rm --gpus all -p 8880:8880 ghcr.io/remsky/kokoro-fastapi-gpu:latest

# CPU
docker run --rm -p 8880:8880 ghcr.io/remsky/kokoro-fastapi-cpu:latest
```

## Verifying a Packaged Build

Before distributing, test on a clean machine:

1. Install the package
2. Start the Kokoro container
3. Verify `curl http://localhost:8880/v1/audio/voices` returns voices
4. Open a PDF, confirm text loads
5. Click play, confirm audio plays
6. Test drag-and-drop
7. Test window minimize/maximize/close

## Version Tracking

The app version is set in `package.json` under `"version"`. Update that and the `VERSION_MAP.md` when releasing a new version. Electron Builder reads the version from `package.json` automatically for the package filename.
