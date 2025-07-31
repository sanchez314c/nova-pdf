# Performance

This document covers what we know about Nova PDF Reader's performance characteristics, where the bottlenecks are, and how to get the best experience.

## TTS Latency

The biggest variable in user experience is how fast the TTS engine responds.

| Mode | Expected First Audio | Notes |
|------|----------------------|-------|
| GPU (RTX-class) | 200-500ms | Kokoro-82M at 35x-100x realtime |
| GPU (lower-end) | 500ms-2s | Depends on VRAM speed and GPU generation |
| CPU Docker | 3-10s | Kokoro runs in real-time or slower on CPU |

"First audio" means the time from clicking Play to hearing sound. The WAV is generated fully before playback starts (non-streaming path). Longer pages take more time.

A 500-word page takes roughly 3 minutes of audio at normal speech speed. At 35x realtime, that generates in about 5 seconds on a fast GPU.

### Reducing TTS Latency

1. Use GPU mode. The difference between CPU and GPU is dramatic.
2. Keep pages short. The text service splits at 3,000 characters. That's already a reasonable target.
3. Don't use speed 0.5x if you don't need it. Slower speed doesn't reduce generation time (it's a playback rate change, not a model parameter), but it does increase the audio length.

## PDF Loading

PDF loading uses `pdfjs-dist` in the Node.js main process. For typical documents:

- Small PDFs (1-50 pages): open time is usually under 100ms
- Large PDFs (100+ pages): open is fast because parsing is lazy (page-by-page via `getPage()`)
- The first `getPageText()` call parses that page; subsequent calls for the same page hit the cache

The `PDFDocumentProxy` is cached in a `Map<string, PDFDocumentProxy>`. Navigating between pages is fast (no re-parse). Opening a new file replaces the cached entry.

**Where it gets slow:** Very large PDFs with complex content (lots of images, embedded fonts, many text items per page) will have slower `getTextContent()` calls. There's no background pre-loading of adjacent pages.

## Memory Usage

At idle with no document loaded:
- Electron baseline: ~150-200MB RAM
- Node.js main process: minimal

With a document loaded:
- PDF content is cached as a `PDFDocumentProxy` object in the main process
- Page text is stored as a string in the Zustand store
- Large PDFs with many cached page objects will use more memory, but typical documents stay well under 400MB total

Kokoro-FastAPI in Docker uses ~2GB VRAM for the model weights. RAM usage for the container itself is modest (200-400MB). CPU Docker mode uses more RAM since there's no GPU offloading.

## Rendering Performance

The UI is React 18 with Vite. There's no virtualization of the page text display, so extremely long pages (full chapter, many thousands of words) will render all at once in a scrollable `<pre>` or `<p>` block. This is generally fine but could cause jank on very long pages.

The sidebar page list caps at 50 entries to avoid rendering large lists. Documents with more than 50 pages show a "+N more pages" label. There's no virtual list implementation.

## Window Rendering

The transparent frameless window requires compositor support. On systems where the compositor is working correctly, rendering is smooth. Two things can degrade rendering:

1. **`disable-gpu-compositing`** is set as a command-line switch on Linux. This is needed for transparency but shifts some rendering work to the CPU.
2. **Shadow layers**: The design system uses 3-5 layered `box-shadow` values per element instead of `backdrop-filter`. This is intentional (backdrop-filter is unreliable on Linux) and generally performs well on modern hardware.

If the UI feels sluggish on a weak machine, you can reduce shadow complexity by editing `src/renderer/styles/globals.css`.

## Network (TTS Backend)

All TTS requests go to `http://localhost:8880`. There's no network hop in normal use. If the Kokoro container is on a remote machine, latency increases proportionally. The app doesn't have a config option for a custom TTS URL yet (it's hardcoded in `ttsService.ts`).

## Build Performance

The TypeScript compilation is split: Vite handles the renderer (fast, uses esbuild internally), and `tsc` handles the main process. Full builds are sequential:

```
pnpm build:vite      # ~3-5 seconds (esbuild)
pnpm build:electron  # ~5-15 seconds (tsc)
```

In dev mode, `pnpm dev` skips the build entirely and uses Vite's dev server with HMR for the renderer. Main process changes require restarting the process.

## Profiling

To profile renderer performance, open DevTools (opens automatically in dev mode) and use the Performance tab. The main process can be profiled via the Node.js inspector opened by `--inspect` in the dev script. Connect from Chrome at `chrome://inspect`.

For TTS performance specifically, the `TTSService` doesn't currently log timing. To measure it, you can add `console.time('tts-speak')` / `console.timeEnd('tts-speak')` around the `fetch()` call in `ttsService.ts`.
