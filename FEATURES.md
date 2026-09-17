# GoreeCloud Memos — Current Features

**Status:** Development  
**Scope:** Features verified in the current repository source only.

## Implemented

- Quick-capture form with optional title and required memo content.
- Local composer draft recovery using browser local storage, including draft color and label input state.
- Saved memo persistence using browser IndexedDB.
- Stable local memo identifiers using `crypto.randomUUID()`.
- Memo timestamps and explicit schema-version metadata.
- Local memo schema v4 / IndexedDB database v4 with migration coverage from v1, v2, and v3 persisted representations.
- Managed local Label v2 identity records with stable UUIDs, a case-insensitive unique `nameKey`, optional curated color, optional icon text, optional description, and a composite Memo–Label relation store.
- Legacy managed Label v1 records normalize to Label v2 with empty optional metadata without requiring an IndexedDB database-version change.
- v3 → v4 migration of memo-local label names into shared managed Label identities while preserving the existing label-name display/search projection.
- Browser-local managed-label administration for rename, metadata editing, explicit delete, and merge.
- Managed-label rename preserves stable identity, metadata, and creation time, rejects normalized-name collisions, and updates affected memo display/search projections transactionally.
- Managed-label metadata editing validates and persists optional color/icon/description while preserving Label identity/name and Memo–Label relationships.
- Managed-label delete removes the Label identity, Memo–Label rows, and affected memo projections without deleting memo content.
- Managed-label merge transfers source relationships to the target identity with relation/projection deduplication, then removes the source identity in the same transaction while preserving target metadata.
- Optional memo color metadata from a curated palette, rendered with both visual treatment and visible color-name text.
- Per-memo label input with whitespace normalization, case-insensitive duplicate removal, and managed-identity reuse across memos.
- Local memo listing ordered by pin state, persisted manual pin order, and update time.
- Direct Pin/Unpin controls plus Move pin up/Move pin down controls for active pinned memos.
- Local memo editing with debounced autosave, including content, title, color, and labels.
- Comfortable, Compact, List, and Dense memo presentation modes with a persisted browser-local preference and native keyboard-accessible radio controls.
- Ephemeral local substring search across memo title, body, and current label-name projection.
- Combinable exact color and label filters scoped to the current Memos, Archive, or Trash lifecycle view.
- Search and filter controls intentionally not persisted as recent-search history or synchronized preferences.
- Recoverable Archive behavior with restore to active Memos.
- Recoverable Trash behavior that remembers whether a memo came from Memos or Archive.
- Explicit permanent deletion restricted to memos already in Trash.
- Accessible labels, focus indicators, live status text, visible metadata badges, responsive layout, and reduced-motion-safe behavior in the prototype UI.
- Unit tests for memo/label normalization, managed-label reconciliation/rename/metadata, label administration service forwarding/validation, memo migration/editing, colors, pin ordering, capture, lifecycle transitions, permanent-deletion guards, presentation preferences, and local query/filter behavior.
- Chromium end-to-end tests for draft recovery, persistence across reload, organization-metadata autosave, manual pin ordering, presentation preference persistence, lifecycle-scoped local search/filter behavior, Archive/Trash recovery, managed-label rename/collision/metadata/merge/delete behavior, and v1/v2/v3 → v4 IndexedDB migration.

## Not implemented

Server hosting, accounts, authentication, synchronization, offline mutation queues, conflicts, bulk label operations, ownership/synchronization metadata, advanced search expressions, attachment/checklist/date/metadata search, smart filters, persisted recent searches, saved views, attachments, checklists, reminders, revision history, full roadmap search coverage, native desktop/mobile clients, synchronized presentation preferences, import/export, operational backup/recovery, administration beyond the local label-management slice, production observability, and Stable Glaze UI acceptance are not established by this repository state.
