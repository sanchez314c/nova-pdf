# Build and Compile

## Prerequisites

Node 20+, pnpm 9+, and all dependencies installed via `pnpm install`.

## Development Build (no packaging)

```bash
pnpm build
```

This runs two steps:

1. `pnpm build:vite` - compiles the React renderer with Vite, outputs to `dist/renderer/`
2. `pnpm build:electron` - compiles main process TypeScript using `tsconfig.electron.json`, outputs to `dist/main/`

The resulting structure:

```
dist/
├── renderer/        # Bundled React app
│   ├── index.html
│   ├── assets/
│   └── ...
└── main/
    └── main/
        ├── index.js     # Compiled main process entry
        └── preload.js   # Compiled context bridge
```

In production, Electron loads `dist/renderer/index.html` and the preload from `dist/main/main/preload.js` (see `main` field in package.json and the `__dirname` path in `src/main/index.ts`).

## Packaging for Distribution

electron-builder handles packaging. The builder config is in `package.json` under the `"build"` key.

**App ID**: `com.sanchez314c.nova-pdf-reader`
**Product Name**: `Nova PDF Reader`
**Build Resources**: `resources/` (icons)
**Output**: `dist-electron/`

```bash
# AppImage only
pnpm dist:appimage

# .deb only
pnpm dist:deb

# Both
pnpm dist

# All platforms (Linux + Windows + macOS)
pnpm dist:all
```

### Linux Targets

| Format | Command | Notes |
|--------|---------|-------|
| AppImage | `pnpm dist:appimage` | Portable, single file |
| .deb | `pnpm dist:deb` | Debian/Ubuntu package |

AppImage output filename: `NovaPDFReader-{version}.AppImage` (set by `appImage.artifactName`).

## TypeScript Configuration

Two tsconfig files:

**tsconfig.json** - renderer process
- Target: ESNext
- Module: ESNext
- JSX: react-jsx
- Strict: true

**tsconfig.electron.json** - main process
- Target: ESNext
- Module: CommonJS (required for Electron main)
- No JSX
- outDir: `dist/main`

## Vite Configuration

`vite.config.ts`:
- Root: `src/renderer`
- Base: `./` (relative paths for Electron)
- Output: `dist/renderer`
- Dev server: port 5173, strictPort enabled
- Path aliases: `@` -> `src/`, `@renderer` -> `src/renderer/`, `@shared` -> `src/shared/`

## Clean Build

```bash
pnpm clean
# removes: dist/, out/, node_modules/
```

Then re-install and rebuild:

```bash
pnpm install && pnpm build
```

## Using All CPU Cores

For faster TypeScript compilation, set the `TS_NODE_TRANSPILE_ONLY` or use `tsc` directly with project references if compilation time becomes an issue. The current setup compiles both processes sequentially; for a faster dev loop, just use `pnpm dev` which doesn't recompile on each change.
