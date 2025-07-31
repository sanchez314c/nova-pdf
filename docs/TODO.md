# TODO

Known gaps and planned work.

## Current Gaps

### High Priority

- [ ] **Persistent settings** - `AppPreferences` interface exists in `src/shared/types.ts` and `electron-store` is installed, but not wired up. Voice selection and speed reset on every app start.

- [ ] **Scanned PDF detection** - No user-facing message when a PDF page has no text layer. Currently shows "No text content found on this page" with no explanation.

- [ ] **Error handling in renderer** - Failed file opens and TTS errors only log to console. No user-visible error messages.

### Medium Priority

- [ ] **Bookmarks** - No way to save a position and return to it.

- [ ] **Text service pagination UX** - Long paragraphs can split mid-sentence. Need smarter split logic (sentence boundaries).

- [ ] **Word highlight during TTS** - No visual feedback showing which part of the text is currently being read.

- [ ] **Sidebar page count cap** - Sidebar only shows the first 50 pages. Long documents need a scroll-to-page or jump input.

- [ ] **SQLite/Drizzle not used** - `better-sqlite3` and `drizzle-orm` are installed but unused. Either wire them up for settings/history or remove the dependencies.

### Low Priority

- [ ] **macOS/Windows support** - The Linux-specific `app.commandLine.appendSwitch` calls need platform gating.

- [ ] **Multiple file tabs** - Only one document open at a time.

- [ ] **OCR support** - Scanned PDFs can't be read. Would need Tesseract integration.

- [ ] **`tts:stop` for non-streaming** - `tts:stop` only aborts streaming requests via AbortController. Non-streaming `speak()` calls can't be cancelled mid-request.

## Technical Debt

- [ ] `src/shared/types.js` - there's both a `.js` and `.ts` version of the shared types file. The `.js` is likely a leftover from an earlier build step and should be removed.

- [ ] `DropZone.tsx` only handles PDF drops - dropping a .txt or .md file onto the drop zone does nothing. The file handler in `App.tsx` handles all types via the `file:opened` channel, but the drop handler only calls `window.nova.pdf.open`.

- [ ] Window maximize state polling - `App.tsx` polls `window.nova.window.isMaximized()` every 500ms. Should use a native maximize/unmaximize event instead.

## Completed

- [x] Frameless transparent window on Linux
- [x] Neo-Noir Glass Monitor design system
- [x] Auto-continue playback across pages
- [x] TTS text sanitization (markdown, URLs, HTML)
- [x] Docker GPU and CPU configs
- [x] Local Python TTS server option
- [x] AppImage and .deb packaging
- [x] Drag-and-drop file opening
- [x] Voice selection and speed control
- [x] Context isolation and sandbox security
