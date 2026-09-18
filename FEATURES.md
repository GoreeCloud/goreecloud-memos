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
- Memo-card label badges join memo `labelIds` to managed Label v2 metadata by stable identity, keep the canonical label name visible and accessible, optionally show icon text as a decorative cue, and use optional label color only as a supplementary accent with a Forced Colors fallback. Label descriptions remain management-only.
- Ephemeral memo multi-selection in the currently rendered lifecycle/search/filter result set, with browser-local bulk **Apply label** and **Remove label** actions for existing managed Labels.
- Bulk label changes validate the full selected memo set before writes, update Memo–Label relationships and memo label-name/ID projections in one IndexedDB transaction, and use one shared organization-change timestamp for changed memos. Apply respects the 20-label-per-memo limit and aborts the full bulk action before writes when a selected memo would exceed it.
- Optional memo color metadata from a curated palette, rendered with both visual treatment and visible color-name text.
- Per-memo label input with whitespace normalization, case-insensitive duplicate removal, and managed-identity reuse across memos.
- Local memo listing ordered by pin state, persisted manual pin order, and update time.
- Direct Pin/Unpin controls plus Move pin up/Move pin down controls for active pinned memos.
- Local memo editing with debounced autosave, including content, title, color, and labels.
- Comfortable, Compact, List, and Dense memo presentation modes with a persisted browser-local preference and native keyboard-accessible radio controls.
- Ephemeral local substring search across memo title, body, and current label-name projection.
- Combinable exact memo-color, label-name, and managed Label-color filters scoped to the current Memos, Archive, or Trash lifecycle view. Label-color matching resolves current Label v2 metadata by stable `labelId` and matches when any linked managed Label has the selected palette color.
- Search/filter state and bulk memo selection are intentionally not persisted as recent-search history, synchronized preferences, or saved selection state.
- Recoverable Archive behavior with restore to active Memos.
- Recoverable Trash behavior that remembers whether a memo came from Memos or Archive.
- Explicit permanent deletion restricted to memos already in Trash.
- Accessible labels, focus indicators, live status text, visible metadata badges, responsive layout, and reduced-motion-safe behavior in the prototype UI.
- Unit tests for memo/label normalization, managed-label reconciliation/rename/metadata, label presentation identity/fallback behavior, label administration service forwarding/validation, bulk-label service validation/forwarding, memo migration/editing, colors, pin ordering, capture, lifecycle transitions, permanent-deletion guards, presentation preferences, and local query/filter behavior including managed Label-color matching by stable identity.
- Chromium end-to-end tests for draft recovery, persistence across reload, organization-metadata autosave, manual pin ordering, presentation preference persistence, lifecycle-scoped local search/filter behavior including managed Label-color combinations, ephemeral bulk selection, atomic bulk label apply/remove and label-limit rollback, Archive/Trash recovery, managed-label rename/collision/metadata/presentation/merge/delete behavior, and v1/v2/v3 → v4 IndexedDB migration.

## Not implemented

Server hosting, accounts, authentication, synchronization, offline mutation queues, conflicts, bulk actions beyond label application/removal, ownership/authorization/synchronization metadata, managed Label icon/description search/filter dimensions, advanced search expressions, attachment/checklist/date/metadata search, smart filters, persisted recent searches, saved views, attachments, checklists, reminders, revision history, full roadmap search coverage, native desktop/mobile clients, synchronized presentation preferences, import/export, operational backup/recovery, administration beyond the local label-management slice, production observability, and Stable Glaze UI acceptance are not established by this repository state.
