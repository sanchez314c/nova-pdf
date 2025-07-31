# Troubleshooting

## TTS Engine Issues

### TTS shows "OFFLINE"

1. Check the container is running:
   ```bash
   docker ps | grep kokoro
   ```
2. Check it's binding to port 8880:
   ```bash
   curl http://localhost:8880/v1/audio/voices
   ```
3. If no response, check container logs:
   ```bash
   docker logs nova-kokoro-tts --tail 50
   ```
4. Common cause: model download still in progress. GPU containers need ~30s, CPU ~120s.

### TTS speaks but audio doesn't play

Open DevTools (auto-opens in dev mode) and check the console. If you see `NotAllowedError`, the Web Audio context needs a user gesture first. Click anywhere in the app before pressing Play.

### TTS request fails with "TTS request failed: ..."

The Kokoro container may have crashed. Restart it:

```bash
docker compose -f docker/docker-compose.yml restart
```

### No voices in the dropdown

The app falls back to a hardcoded list of 10 voices when Kokoro is unreachable. If the TTS server is running but no voices appear, click "Refresh Status" in the sidebar.

---

## PDF Issues

### PDF loads but shows "No text content found on this page"

Some PDFs are scanned documents (images). pdf.js can only extract text from PDFs with actual text layers. Try a different PDF to confirm the app is working.

### PDF fails to open

1. Check file permissions: `ls -la yourfile.pdf`
2. Try a different PDF to rule out a corrupted file
3. Password-protected PDFs are not supported

### Very large PDFs are slow

PDF parsing happens on the main process in Node.js. Large PDFs (100+ pages) are parsed page-by-page, so the initial load is fast. Navigation is fast because `PDFService` caches the `PDFDocumentProxy`.

---

## Electron / Window Issues

### App crashes on launch with "credentials.cc: Permission denied"

Enable unprivileged user namespaces:

```bash
sudo sysctl -w kernel.unprivileged_userns_clone=1
```

To persist:

```bash
echo "kernel.unprivileged_userns_clone=1" | sudo tee /etc/sysctl.d/99-nova.conf
```

The `pnpm dev:electron` script already includes `--no-sandbox` to work around this.

### Window has OS title bar decorations (minimize/maximize/close from WM)

This is the Linux window manager overriding the frameless config. Make sure `app.commandLine.appendSwitch('enable-transparent-visuals')` and `disable-gpu-compositing` are called before `app.whenReady()` (they are in `src/main/index.ts`). If your WM still decorates the window, try disabling window decorations in WM settings for this app.

### App window is invisible / all black

The transparent window needs compositor support. Check your WM has compositing enabled. On GNOME, compositing is on by default. On minimal WMs like i3 or openbox, you may need picom or compton.

### Window controls don't work

If minimize/maximize/close buttons in the custom title bar don't respond, check DevTools for IPC errors. The `no-drag` CSS class must be applied to buttons inside the drag region.

---

## Build Issues

### `electron-builder` fails with icon errors

Ensure `resources/icons/` has PNG icons. electron-builder needs at least a 512x512 PNG for Linux packaging.

### TypeScript errors on build

Run `pnpm type-check` first to see all errors. The main and renderer processes have separate tsconfig files; make sure you're checking both if you have mixed errors.

### Vite build fails with module resolution errors

Check the path aliases in `vite.config.ts` match what you're importing. The `@shared` alias maps to `src/shared`.

---

## Local TTS Server Issues

### `pnpm tts:setup` fails

1. Make sure conda is installed and in PATH: `which conda`
2. Run `eval "$(conda shell.bash hook)"` manually to check for errors
3. Check you have enough disk space (~5GB for PyTorch + Kokoro deps)

### `pnpm tts:start` says "Environment not found"

Run `pnpm tts:setup` first to create `tts-server/.venv`.

### Server starts but Kokoro model download hangs

The first start downloads Kokoro-82M from HuggingFace. This can take a few minutes on a slow connection. Check `/tmp/nova-tts-server.log`.
