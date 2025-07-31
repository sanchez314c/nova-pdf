# Learnings

Technical decisions made during development and what we learned.

## Linux Transparent Electron Windows

**Problem**: Linux window managers wrap frameless Electron windows with their own title bar and decorations.

**What didn't work**: Using `type: 'dock'` in `BrowserWindow` config. This tells the WM the app is a panel, causing unexpected decoration behavior on some DEs.

**What works**: Three things together:
1. `app.commandLine.appendSwitch('enable-transparent-visuals')` called before `app.whenReady()` (not in the CLI args)
2. `app.commandLine.appendSwitch('disable-gpu-compositing')` for transparency on Linux
3. A 400ms delay before `createWindow()` on Linux to let the compositor initialize

Without the delay, the window would sometimes render as opaque black before transparency kicked in.

## backdrop-filter is Unreliable on Linux

We initially used `backdrop-filter: blur()` for glassmorphism effects. On Linux with some compositors, this doesn't work or causes performance issues.

**Solution**: The Neo-Noir Glass Monitor design system uses semi-transparent backgrounds and layered box-shadows (3-5 layers per element) to simulate depth, with `::before` pseudo-elements for glass edge highlights. No backdrop-filter dependency.

## IPC Buffer Serialization

When passing audio data from the main process (Node.js `Buffer`) to the renderer over Electron IPC, the `Buffer` arrives as an object with numeric keys rather than a proper `ArrayBuffer`.

**Solution**: Explicitly convert to `Uint8Array` before sending:

```typescript
return {
  audio: new Uint8Array(result.audio),
  format: result.format,
};
```

The renderer then wraps it in a `Blob` for playback.

## TTS Text Sanitization

PDF text often contains markdown artifacts if the PDF was generated from markdown, plus URLs, email addresses, and HTML tags. Passing these directly to TTS produces awkward audio (it literally reads out "hashtag hashtag Introduction").

`sanitizeForTTS()` in `TTSControls.tsx` strips: markdown headers, bold/italic markers, inline code, code blocks, links (keeping link text), images, HTML tags, bullet points, blockquotes, horizontal rules.

The order of replacements matters - strip code blocks before inline code, or the regex patterns interfere.

## Auto-Continue Across Pages

Auto-continuing to the next page required coordination between the audio `ended` event and the async page text fetch. We use two refs:

- `shouldContinueRef` - tracks whether continuous playback mode is active
- `waitingForPageRef` - tracks whether we've started a page navigation and are waiting for text to arrive

The `useEffect` on `pageText` checks both refs and triggers playback when text arrives. This avoids race conditions from setState batching.

## PDF Page Numbering

`pdfjs-dist` uses 1-indexed page numbers in `getPage(pageNum)`. Our `getPageText` validates against the cached document's `numPages` and throws on out-of-range. The UI also validates via `Math.max(1, Math.min(page, document.numPages))` in `goToPage`.

## Text File Pagination

`TextService` uses a simple character-count approach (3000 chars per virtual page). The split prefers newlines in the last 30% of the page boundary (i.e., if there's a newline after 70% of the way through), falling back to the last space, then the hard character limit. This keeps paragraphs mostly intact.

## Electron Context Isolation with TypeScript

The preload script defines the `NovaAPI` interface and the `declare global { interface Window { nova: ... } }` augmentation must be in `App.tsx` since the preload types aren't available to the renderer process. This is a known Electron TypeScript pattern - the renderer can't import from the preload directly.

## Kokoro TTS First-Start Download

On first run, Kokoro-FastAPI downloads the Kokoro-82M model from HuggingFace (~300MB). The Docker healthcheck handles this by waiting up to 60 seconds for `start_period`. The local start script polls `/health` up to 60 times with 1-second waits.
