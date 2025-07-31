# Development Workflow

## Git Branches

- `main` - stable, released code
- `feature/description` - new features
- `fix/description` - bug fixes
- `docs/description` - documentation only
- `refactor/description` - code reorganization

Always branch from `main`. Keep PRs small and focused.

## Commit Messages

Follow Conventional Commits:

```
type(scope): description

[optional body]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`

Examples:
```
feat(tts): add streaming audio playback
fix(pdf): handle PDFs with no text layer
refactor(renderer): extract audio controls into TTSControls
docs(api): document all IPC channels
```

## Development Loop

1. Start TTS backend (Docker or local server)
2. `pnpm dev` - starts Vite + Electron with HMR
3. Make renderer changes - they reload instantly
4. Make main process changes - restart `pnpm dev`
5. `pnpm type-check` before committing
6. `pnpm lint` and fix any issues
7. `pnpm test` to run unit tests

## Before Submitting a PR

```bash
pnpm lint
pnpm type-check
pnpm test
pnpm build   # verify production build works
```

Update `CHANGELOG.md` with your changes under `[Unreleased]`.

## Code Style

- Functional React components only, no class components
- Hooks for all state and effects
- Zustand for shared state, local `useState` for component-only state
- TypeScript strict mode - no `any` unless absolutely necessary
- 2-space indent, LF line endings (enforced by `.editorconfig`)
- ESLint handles everything else - `pnpm lint:fix` to auto-fix

## Making Changes to IPC

When adding a new IPC channel:
1. Add to `IPCChannel` type in `src/shared/types.ts`
2. Add handler in `setupIPC()` in `src/main/index.ts`
3. Expose in preload (`src/main/preload.ts`) via `contextBridge`
4. Update `NovaAPI` interface in `src/main/preload.ts`
5. Call from renderer via `window.nova.*`
6. If it's a push channel (main -> renderer), add to `validChannels`

## Testing

```bash
pnpm test           # run all tests
pnpm test:watch     # watch mode
pnpm type-check     # TypeScript only
```

Tests use Vitest. Unit test files go alongside the source they test or in a `__tests__` directory.

## Release Process

1. Bump version in `package.json`
2. Update `CHANGELOG.md` - move `[Unreleased]` items to a new version section
3. Update `VERSION_MAP.md`
4. Commit: `chore: bump version to x.y.z`
5. Tag: `git tag vx.y.z`
6. Build packages: `pnpm dist`
7. Test both AppImage and .deb on a clean machine
8. Push tag to trigger any CI workflows

## Reviewing Pull Requests

Things to check:
- Does it run? (`pnpm dev` works after the change)
- TypeScript passes? (`pnpm type-check`)
- Linting passes? (`pnpm lint`)
- IPC security: are new channels added to the allowlist if needed?
- Context isolation maintained: no new `nodeIntegration` usage
- Input validation on any new IPC handlers that accept user-controlled data
