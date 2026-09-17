# GoreeCloud Memos — Current Features

**Status:** Development  
**Scope:** Features verified in the current repository source only.

## Implemented

- Quick-capture form with optional title and required memo content.
- Local composer draft recovery using browser local storage, including draft color and label input state.
- Saved memo persistence using browser IndexedDB.
- Stable local memo identifiers using `crypto.randomUUID()`.
- Memo timestamps and explicit schema-version metadata.
- Local record schema v3 with tested browser migrations from both v1 and v2 persisted representations.
- Optional memo color metadata from a curated palette, rendered with both a visual treatment and visible color-name text.
- Per-memo label-name metadata with whitespace normalization, case-insensitive duplicate removal, and persistence across reload.
- Local memo listing ordered by pin state, persisted manual pin order, and update time.
- Direct Pin/Unpin controls plus Move pin up/Move pin down controls for active pinned memos.
- Local memo editing with debounced autosave, including content, title, color, and labels.
- Comfortable, Compact, List, and Dense memo presentation modes with a persisted browser-local preference and native keyboard-accessible radio controls.
- Ephemeral local substring search across memo title, body, and memo-local label names.
- Combinable exact color and memo-local label filters scoped to the current Memos, Archive, or Trash lifecycle view.
- Search and filter controls that are intentionally not persisted as recent-search history or synchronized preferences.
- Recoverable Archive behavior with restore to active Memos.
- Recoverable Trash behavior that remembers whether a memo came from Memos or Archive.
- Explicit permanent deletion restricted to memos already in Trash.
- Accessible labels, focus indicators, live status text, visible metadata badges, responsive layout, and reduced-motion-safe behavior in the prototype UI.
- Unit tests for memo creation, validation, migration, editing, colors, labels, pin ordering, capture, lifecycle transitions, permanent-deletion guards, presentation preference persistence, and local query/filter behavior.
- Chromium end-to-end tests for draft recovery, persistence across reload, organization-metadata autosave, manual pin ordering, presentation preference persistence, lifecycle-scoped local search/filter behavior, Archive/Trash recovery, permanent deletion, and v1/v2 → v3 IndexedDB migration.

## Not implemented

Server hosting, accounts, authentication, synchronization, offline mutation queues, conflicts, central label entities, label colors/icons/descriptions, label rename/delete/merge, bulk label operations, advanced search expressions, attachment/checklist/date/metadata search, smart filters, persisted recent searches, saved views, attachments, checklists, reminders, revision history, full roadmap search coverage, native desktop/mobile clients, synchronized presentation preferences, import/export, operational backup/recovery, administration, production observability, and Stable Glaze UI acceptance are not established by this repository state.
