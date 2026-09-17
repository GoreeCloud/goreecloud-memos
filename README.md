# GoreeCloud Memos

GoreeCloud Memos is the GoreeCloud quick-capture application: **Open → type → done.**

## Status

**Development.** The current repository implements a browser-local Memos Core slice. It is not a Stable release and does not yet provide a server, synchronization, account system, desktop client, mobile client, backup/recovery system, import/export pipeline, or accepted Glaze UI conformance.

### Implemented in this slice

- Browser quick-capture composer with optional title.
- Local draft preservation in browser storage.
- Local saved-memo persistence through IndexedDB.
- Memo editing with debounced local autosave.
- Recoverable Archive and Trash flows, including explicit permanent deletion from Trash.
- Versioned local data schema with tested v1 → v2 migration.
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
