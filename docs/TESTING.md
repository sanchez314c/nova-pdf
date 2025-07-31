# Testing

Nova PDF Reader uses [Vitest](https://vitest.dev/) as its test runner. Tests live in the `tests/` directory at the project root (currently a placeholder) or alongside source files in `__tests__` directories.

## Running Tests

```bash
# Run all tests once
pnpm test

# Watch mode (re-runs on file changes)
pnpm test:watch

# TypeScript type check only (no test execution)
pnpm type-check
```

## Test Stack

| Tool | Purpose |
|------|---------|
| Vitest 2.x | Test runner and assertion library |
| TypeScript | Full type coverage in test files |

Vitest is configured in `vite.config.ts` via the `test` key. Tests run in a Node.js environment by default (appropriate for main process logic). Renderer tests would need `jsdom` or `happy-dom` environment configuration.

## What to Test

### Main Process Services

These are pure Node.js modules with no Electron dependency and are the easiest to unit test:

**PDFService** (`src/main/services/pdfService.ts`)
- `openDocument(filePath)` returns correct `{ path, numPages, title }`
- `getPageText(filePath, pageNum)` returns a string
- `getPageText` with out-of-range page number throws
- Caches the document on second call (same `PDFDocumentProxy`)

**TextService** (`src/main/services/textService.ts`)
- `openDocument` for a known .txt file returns correct `numPages`
- `getPageText` returns the right chunk for a given page
- Pagination splits at newline boundaries when possible
- Character count and word count metadata are accurate

**TTSService** (`src/main/services/ttsService.ts`)
- `getStatus` returns `{ running: false }` when Kokoro is not reachable
- `speak` throws or returns an error when the HTTP request fails
- `stop` calls `abort()` on the `AbortController`

### Renderer Store

**appStore** (`src/renderer/stores/appStore.ts`)
- `setSpeed` clamps values to `[0.5, 2.0]`
- `setDocument` resets `currentPage` to 1
- `goToPage` clamps to valid page range
- `toggleSidebar` flips the boolean

### Utility Functions

**sanitizeForTTS** (`src/renderer/components/TTSControls.tsx`)
- Strips markdown headers
- Strips URLs
- Strips HTML tags
- Strips inline code and code blocks
- Preserves plain prose text

## Example Test Structure

```typescript
// tests/services/textService.test.ts
import { describe, it, expect } from 'vitest';
import { TextService } from '../../src/main/services/textService';

describe('TextService', () => {
  it('paginates at 3000 character boundaries', async () => {
    const text = 'a'.repeat(3500);
    const doc = await TextService.openDocument('/fake/path.txt', text);
    expect(doc.numPages).toBe(2);
  });

  it('prefers newline split in the last 30% of a page', async () => {
    const line1 = 'a'.repeat(2100);
    const line2 = 'b'.repeat(900);
    const doc = await TextService.openDocument('/fake/path.txt', `${line1}\n${line2}\n`);
    const page1 = await TextService.getPageText('/fake/path.txt', 1);
    expect(page1.endsWith(line1)).toBe(true);
  });
});
```

```typescript
// tests/store/appStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../../src/renderer/stores/appStore';

describe('appStore', () => {
  beforeEach(() => {
    useAppStore.setState({ speed: 1.0 });
  });

  it('clamps speed above 2.0 to 2.0', () => {
    useAppStore.getState().setSpeed(5.0);
    expect(useAppStore.getState().speed).toBe(2.0);
  });

  it('clamps speed below 0.5 to 0.5', () => {
    useAppStore.getState().setSpeed(0.1);
    expect(useAppStore.getState().speed).toBe(0.5);
  });

  it('resets currentPage to 1 when a new document is set', () => {
    useAppStore.setState({ currentPage: 5 });
    useAppStore.getState().setDocument({ path: '/test.pdf', numPages: 10 });
    expect(useAppStore.getState().currentPage).toBe(1);
  });
});
```

## Adding Vitest Environment Config

To test renderer components that use browser APIs, add an environment directive at the top of the test file:

```typescript
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
```

Or configure globally in `vite.config.ts`:

```typescript
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
  // ...
});
```

## Mocking Electron IPC in Tests

Main process services don't need Electron mocks since they call their own logic. The preload bridge (`window.nova`) in renderer tests needs mocking:

```typescript
// tests/setup.ts
import { vi } from 'vitest';

global.window = global.window || {};
(window as any).nova = {
  tts: {
    status: vi.fn().mockResolvedValue({ running: true, gpu: true }),
    voices: vi.fn().mockResolvedValue([]),
    speak: vi.fn().mockResolvedValue({ audio: new Uint8Array(), format: 'wav' }),
    stop: vi.fn().mockResolvedValue(undefined),
  },
  pdf: {
    open: vi.fn().mockResolvedValue({ path: '/test.pdf', numPages: 5 }),
    getText: vi.fn().mockResolvedValue('Sample page text.'),
    getMetadata: vi.fn().mockResolvedValue({ numPages: 5 }),
  },
  dialog: {
    openFile: vi.fn().mockResolvedValue(undefined),
  },
  window: {
    minimize: vi.fn(),
    maximize: vi.fn(),
    close: vi.fn(),
    isMaximized: vi.fn().mockResolvedValue(false),
  },
  on: vi.fn(),
  off: vi.fn(),
};
```

Register the setup file in `vite.config.ts`:

```typescript
test: {
  setupFiles: ['./tests/setup.ts'],
}
```

## Coverage

No coverage threshold is currently enforced. To generate a coverage report:

```bash
pnpm test -- --coverage
```

This requires `@vitest/coverage-v8` or `@vitest/coverage-istanbul` installed as a dev dependency.

## Current State

The `tests/` directory contains only a `.gitkeep` file. No tests exist yet. The test infrastructure (Vitest, TypeScript) is in place. See [TODO.md](TODO.md) for the broader backlog context.
