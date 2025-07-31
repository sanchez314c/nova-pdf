# Migration Guide

This document covers how to upgrade between versions of Nova PDF Reader, including any breaking changes to configuration or data formats.

## v1.0.x to v1.1.x

### Visual Change: Neo-Noir Glass Monitor Design

Version 1.1.0 replaced the original dark theme with the Neo-Noir Glass Monitor design system. The changes are purely visual. No functionality changed, no data formats changed, no IPC channels changed.

If you have custom CSS overrides, you'll need to update them. The color palette changed:
- Old accent: Emerald `#10b981`
- New accent: Teal `#14b8a6`

CSS custom properties are defined in `src/renderer/styles/theme.css`. Tailwind colors are under the `noir-*` namespace in `tailwind.config.js`.

### Electron Window Config Change

In v1.1.0, `hasShadow` was set to `false` (was unset/default before). This removes the OS-level window shadow since CSS handles depth. If you're building a fork and want OS shadows back, set `hasShadow: true` in `createWindow()`.

### No Data Migration Needed

There is no persistent user data in v1.0.x or v1.1.x. The app stores nothing on disk (no preferences, no history, no bookmarks). When persistent settings land in a future version, a migration doc will be added here.

## From Development Branch to v1.1.1

If you were running the app from source before the documentation pass in v1.1.1, there are no code changes. v1.1.1 was a documentation-only release.

## Future Migrations

### When electron-store lands (planned)

A future release will wire up `electron-store` for persistent preferences. On first run after upgrading, the app will create a new config file at the default electron-store path:

- Linux: `~/.config/nova-pdf-reader/config.json`

No migration will be needed since there's no prior state to migrate.

### If SQLite/Drizzle lands (planned)

If bookmarks or history are added via `better-sqlite3`, the database will be created at first run. A migration doc will be added when that feature ships.

## Dependency Version Notes

### pdfjs-dist 3.x

The app uses `pdfjs-dist` v3.x. Version 4.x has a different module format and API changes. If you upgrade pdfjs-dist:

- `PDFDocumentProxy` and `getPage()` behavior changed in v4
- The worker initialization path changed
- Check the pdfjs-dist changelog before upgrading

### Zustand 5.x

The app uses Zustand v5. The store shape and API are compatible with v4 for the patterns used here, but if you're referencing external Zustand v4 docs, be aware of the breaking changes in v5 (no `devtools` middleware import path change, etc.).

### Electron 33.x

Electron 33 ships with Chromium 130. If upgrading to a newer Electron major:
- Check for deprecated `app.commandLine.appendSwitch` flags
- The `enable-transparent-visuals` and `disable-gpu-compositing` flags may behave differently
- Verify the frameless transparent window still works on your compositor

## Rollback

To roll back to a previous version, check the `archive/` directory for timestamped zip backups, or use `git checkout vX.Y.Z` for a tagged release.
