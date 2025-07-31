# Configuration

This doc covers all the configurable aspects of Nova PDF Reader: TTS backend, window behavior, build settings, and the planned (but not yet wired) user preferences system.

## TTS Backend URL

The Kokoro endpoint is hardcoded in `src/main/services/ttsService.ts`:

```typescript
const KOKORO_BASE = 'http://localhost:8880';
```

If you want to point the app at a Kokoro instance on a different host or port, change this constant. There's no UI or config file option for it yet.

## TTS Engine: Docker vs Local Server

### GPU Docker (default)

```bash
docker compose -f docker/docker-compose.yml up -d
```

Config: `docker/docker-compose.yml`

Key settings:
- Port: `8880`
- Image: `ghcr.io/remsky/kokoro-fastapi-gpu:latest`
- GPU: `count: 1`, all `nvidia` capabilities
- Cache volume: `kokoro-cache` (persists downloaded model between restarts)
- Health check: polls `/v1/audio/voices` every 30s, up to 60s start period

To change the port, update both the `ports` mapping in docker-compose.yml and `KOKORO_BASE` in `ttsService.ts`.

### CPU Docker

```bash
docker compose -f docker/docker-compose.cpu.yml up -d
```

Config: `docker/docker-compose.cpu.yml`

Same as GPU config but uses `ghcr.io/remsky/kokoro-fastapi-cpu:latest` and no GPU reservation. Health check start period is 120s (CPU model load is slower).

### Local Python Server

```bash
pnpm tts:start
# or
cd tts-server && bash start.sh
```

Config: `tts-server/setup.sh` (installs deps), `tts-server/start.sh` (starts server)

The local server writes logs to `/tmp/nova-tts-server.log`.

## Electron Window

Window configuration lives in `src/main/index.ts` in the `createWindow()` function:

| Setting | Value | Why |
|---------|-------|-----|
| `frame` | `false` | Custom title bar |
| `transparent` | `true` | Glass floating effect |
| `backgroundColor` | `'#00000000'` | Full transparency |
| `hasShadow` | `false` | CSS handles depth |
| `resizable` | `true` | Standard resize behavior |
| `minWidth` | `800` | Prevents layout breakage |
| `minHeight` | `600` | Same |

Linux-specific command-line switches added before `app.whenReady()`:

```typescript
app.commandLine.appendSwitch('enable-transparent-visuals');
app.commandLine.appendSwitch('disable-gpu-compositing');
```

Window creation is delayed 400ms on Linux to let the compositor initialize before the window appears.

## Dev Server Port

Vite's dev server runs on port `54450` (configured in `vite.config.ts`). This is what the `wait-on` check waits for before launching Electron. If you need to change it:

1. Update `server.port` in `vite.config.ts`
2. Update the URL in the `dev:electron` script in `package.json`

## Path Aliases

Defined in `vite.config.ts` (for the renderer build) and mirrored in `tsconfig.json` (for TypeScript):

| Alias | Resolves to |
|-------|-------------|
| `@` | `src/` |
| `@renderer` | `src/renderer/` |
| `@shared` | `src/shared/` |

## Build Output Directories

| What | Output |
|------|--------|
| Renderer (Vite) | `dist/renderer/` |
| Main process (tsc) | `dist/main/` |
| Packaged distributable | `dist-electron/` |

Controlled by `vite.config.ts` (`build.outDir`) and `tsconfig.electron.json` (`outDir`).

## electron-builder Config

The packaging config is in `package.json` under `"build"`:

```json
{
  "appId": "com.sanchez314c.nova-pdf-reader",
  "productName": "Nova PDF Reader",
  "directories": {
    "output": "dist-electron",
    "buildResources": "resources"
  },
  "linux": {
    "target": ["AppImage", "deb"],
    "category": "Office"
  },
  "appImage": {
    "artifactName": "NovaPDFReader-${version}.AppImage"
  }
}
```

To add a Windows or macOS target, add the respective platform config here and run `pnpm dist:all`.

## AppPreferences (Not Yet Wired)

The `AppPreferences` interface is defined in `src/shared/types.ts` and `electron-store` is installed, but the two are not connected. When implemented, this will be the user-configurable settings:

```typescript
interface AppPreferences {
  theme: 'dark' | 'light';
  defaultVoice: string;   // e.g. 'af_bella'
  defaultSpeed: number;   // 0.5 to 2.0
  autoPlay: boolean;
}
```

Planned implementation: use `electron-store` in the main process, expose get/set via IPC, and wire the Zustand store to load from preferences on startup and write back on change. See [TODO.md](TODO.md) for priority.

## Design Tokens

UI colors and spacing are controlled by CSS custom properties in `src/renderer/styles/theme.css`. The Tailwind config (`tailwind.config.js`) extends with the full `noir-*` palette. To change the accent color, update:

1. `--accent` and related variables in `theme.css`
2. The `noir.accent` object in `tailwind.config.js`

Current accent: `#14b8a6` (Teal 500).

## ESLint

Config: `eslint.config.js`. Covers TypeScript and React rules. Run:

```bash
pnpm lint         # check
pnpm lint:fix     # auto-fix
```

## Editor Config

`.editorconfig` at the project root enforces:
- 2-space indent
- LF line endings
- UTF-8 encoding
- Trim trailing whitespace
- Insert final newline
