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
- Managed local Label identities with stable UUIDs and a Memo–Label relation layer, while retaining the current label-name projection for UI/search compatibility.
- Browser-local managed-label administration for transactional rename, explicit delete, and merge. These operations update affected Memo–Label relations and memo label-name/ID projections atomically; deleting a label does not delete its memos.
- Browser-local managed-label metadata editing for an optional curated color, optional icon text, and optional description. Existing Label v1 records normalize to Label schema v2 without changing IndexedDB database version 4.
- Memo cards join stable Label identities to current Label v2 metadata and present optional icon/color as supplementary cues while always keeping the canonical label name visible; descriptions remain in Manage labels.
- Ephemeral memo multi-selection with browser-local bulk Apply label / Remove label actions for existing managed Labels. Each bulk action validates the full selection before one atomic IndexedDB transaction and updates changed memo organization timestamps together.
- Per-memo label input with trimming, case-insensitive deduplication, and identity reuse by normalized name.
- Pin/unpin controls with persisted manual ordering for active pinned memos.
- Recoverable Archive and Trash flows, including explicit permanent deletion from Trash.
- Comfortable, Compact, List, and Dense memo presentation modes with a browser-local persisted preference.
- Ephemeral browser-local substring search across memo title, body, and label-name projection, plus combinable exact color and label filters within the current lifecycle view.
- Versioned local memo schema v4 / IndexedDB database v4 with tested v1 → v4, v2 → v4, and v3 → v4 migration paths.
- Framework-independent memo/label domain and application-service modules.
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
