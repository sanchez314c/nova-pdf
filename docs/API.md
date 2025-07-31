# API Reference

## Preload Bridge (`window.nova`)

The renderer accesses all native functionality through `window.nova`, exposed by `src/main/preload.ts` via `contextBridge.exposeInMainWorld`.

### `window.nova.pdf`

#### `pdf.open(filePath: string): Promise<{ path: string; numPages: number; title?: string }>`

Opens a PDF, parses it with pdf.js, caches the `PDFDocumentProxy`, and returns document info.

#### `pdf.getText(filePath: string, pageNum: number): Promise<string>`

Returns extracted text for the given page (1-indexed). Joins text content items with spaces, collapses whitespace.

#### `pdf.getMetadata(filePath: string): Promise<PDFMetadata>`

Returns PDF metadata: title, author, subject, creator, producer, creationDate, numPages.

### `window.nova.text`

#### `text.open(filePath: string): Promise<{ path: string; numPages: number; title?: string; type: 'txt' | 'md' }>`

Opens a .txt or .md file, splits it into virtual pages at 3000-character boundaries, and caches the result.

#### `text.getText(filePath: string, pageNum: number): Promise<string>`

Returns text for the given virtual page (1-indexed).

#### `text.getMetadata(filePath: string): Promise<TextMetadata>`

Returns: title (basename), numPages, wordCount, charCount.

### `window.nova.tts`

#### `tts.status(): Promise<{ running: boolean; gpu: boolean; voices?: string[] }>`

Checks if Kokoro is reachable at `http://localhost:8880/v1/audio/voices`. Times out after 3 seconds.

#### `tts.voices(): Promise<Array<{ id: string; name: string; language: string }>>`

Lists available voices from Kokoro. Falls back to a hardcoded list of 10 default voices if the server is unreachable.

#### `tts.speak(text: string, voice: string, speed: number): Promise<{ audio: Uint8Array; format: string }>`

Generates audio for the given text. Returns WAV audio as `Uint8Array`. The main process converts the Node.js `Buffer` to `Uint8Array` before sending over IPC.

#### `tts.speakStream(text: string, voice: string, speed: number): Promise<void>`

Starts streaming audio generation. Chunks are emitted via the `tts:chunk` IPC channel to the renderer.

#### `tts.stop(): Promise<void>`

Aborts any in-progress streaming request via `AbortController`.

#### `tts.onChunk(callback: (chunk: ArrayBuffer) => void): void`

Registers a listener for `tts:chunk` events.

### `window.nova.dialog`

#### `dialog.openFile(): Promise<void>`

Opens a native file picker filtered to PDF, TXT, and MD. On selection, emits `file:opened` with the file path.

### `window.nova.window`

#### `window.minimize(): void`
#### `window.maximize(): void` (toggles maximize/restore)
#### `window.close(): void`
#### `window.isMaximized(): Promise<boolean>`

### `window.nova.on(channel, callback)` / `.off(channel, callback)`

Restricted to `validChannels`: `['file:opened', 'tts:chunk']`.

## IPC Channels

| Channel | Direction | Handler |
|---------|-----------|---------|
| `pdf:open` | renderer -> main | `PDFService.openDocument` |
| `pdf:getText` | renderer -> main | `PDFService.getPageText` |
| `pdf:getMetadata` | renderer -> main | `PDFService.getMetadata` |
| `text:open` | renderer -> main | `TextService.openDocument` |
| `text:getText` | renderer -> main | `TextService.getPageText` |
| `text:getMetadata` | renderer -> main | `TextService.getMetadata` |
| `tts:status` | renderer -> main | `TTSService.getStatus` |
| `tts:voices` | renderer -> main | `TTSService.getVoices` |
| `tts:speak` | renderer -> main | `TTSService.speak` |
| `tts:speakStream` | renderer -> main | `TTSService.speakStream` |
| `tts:stop` | renderer -> main | `TTSService.stop` |
| `tts:chunk` | main -> renderer | stream chunk push |
| `file:opened` | main -> renderer | file dialog result |
| `dialog:openFile` | renderer -> main | `dialog.showOpenDialog` |
| `window-minimize` | renderer -> main | `mainWindow.minimize()` |
| `window-maximize` | renderer -> main | toggle maximize |
| `window-close` | renderer -> main | `mainWindow.close()` |
| `window-is-maximized` | renderer -> main | returns bool |

## Kokoro TTS REST API

The `TTSService` communicates with Kokoro-FastAPI at `http://localhost:8880`.

### POST /v1/audio/speech

Generates audio. OpenAI-compatible endpoint.

```json
{
  "model": "kokoro",
  "input": "Text to synthesize",
  "voice": "af_bella",
  "speed": 1.0,
  "response_format": "wav",
  "stream": false
}
```

For streaming, set `response_format: "mp3"` and `stream: true`. Response body is a chunked audio stream.

**Supported response_format values**: `mp3`, `wav`, `opus`, `flac`, `pcm`

### GET /v1/audio/voices

Returns an array of available voice objects:

```json
[
  { "id": "af_bella", "name": "Bella (Female)", "language": "en" },
  ...
]
```

### Default Voices

| ID | Name | Accent |
|----|------|--------|
| af_bella | Bella | American Female |
| af_nicole | Nicole | American Female |
| af_sarah | Sarah | American Female |
| af_sky | Sky | American Female |
| am_adam | Adam | American Male |
| am_michael | Michael | American Male |
| bf_emma | Emma | British Female |
| bf_isabella | Isabella | British Female |
| bm_george | George | British Male |
| bm_lewis | Lewis | British Male |

## Shared Types (`src/shared/types.ts`)

```typescript
interface PDFDocument { path: string; numPages: number; title?: string; }
interface PDFMetadata { title?; author?; subject?; creator?; producer?; creationDate?; numPages: number; }
interface Voice { id: string; name: string; language: string; }
interface TTSStatus { running: boolean; gpu: boolean; voices?: string[]; error?: string; }
interface AudioResult { audio: ArrayBuffer; format: string; }
interface TTSRequest { model: string; input: string; voice: string; speed: number; response_format: 'mp3'|'wav'|'opus'|'flac'|'pcm'; stream?: boolean; }
interface AppPreferences { theme: 'dark'|'light'; defaultVoice: string; defaultSpeed: number; autoPlay: boolean; }
```
