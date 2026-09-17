# GoreeCloud Memos

GoreeCloud Memos is the GoreeCloud quick-capture application: **Open → type → done.**

## Status

**Development.** The current repository implements a browser-local Memos Core slice. It is not a Stable release and does not yet provide a server, synchronization, account system, desktop client, mobile client, backup/recovery system, import/export pipeline, or accepted Glaze UI conformance.

### Implemented in this slice

- Browser quick-capture composer with optional title.
- Local draft preservation in browser storage, including draft color and label fields.
- Local saved-memo persistence through IndexedDB.
- Memo editing with debounced local autosave.
- Optional memo color metadata using a curated local palette.
- Per-memo label-name metadata with trimming, case-insensitive deduplication, and local persistence.
- Pin/unpin controls with persisted manual ordering for active pinned memos.
- Recoverable Archive and Trash flows, including explicit permanent deletion from Trash.
- Comfortable, Compact, List, and Dense memo presentation modes with a browser-local persisted preference.
- Ephemeral browser-local substring search across memo title, body, and memo-local label names, plus combinable exact color and label filters within the current lifecycle view.
- Versioned local data schema v3 with tested v1 → v3 and v2 → v3 migration paths.
- Framework-independent memo domain and service modules.
- Automated unit, syntax, repository-baseline, and Chromium end-to-end validation.

## Run locally

From the repository root:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173/web/`.

Run source and unit validation with Node.js 22 or newer:

```bash
npm run check
npm test
```

End-to-end tests additionally require the pinned Playwright development dependency and Chromium browser runtime:

```bash
npm install --ignore-scripts
npx playwright install chromium
npm run test:e2e
```

## Repository documentation

- [Specifications](SPECIFICATIONS.md)
- [Current features](FEATURES.md)
- [Feature roadmap](FEATURE-ROADMAP.md)
- [Architecture](docs/architecture.md)
- [Data model](docs/data-model.md)
- [Phase 0 audit](docs/phase-0-audit.md)

The governing product roadmap is maintained in GoreeCloud Drive at `GoreeCloud/Feature Roadmap/GoreeCloud Memos/goreecloud-memos.md`. Repository roadmap material must remain synchronized with that authority.

## License

GoreeCloud Memos currently uses the GoreeCloud default fallback license, **AGPL-3.0-or-later**, because no Memos-specific license decision has superseded it.
