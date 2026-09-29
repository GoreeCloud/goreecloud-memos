# GoreeCloud Memos — Current Features

**Status:** Development  
**Scope:** Features verified in the current repository source only.

## Implemented

- Native Android Development foundation with a launcher activity, native quick-capture title/body editors, explicit local-only/sync-unavailable presentation, adaptive/round/monochrome application identity, and no WebView wrapper.
- Android local memo persistence uses a versioned v1 record format and previous-generation fallback; Android draft persistence uses a separate versioned v1 draft record with the same bounded recovery model.
- Android Development source requests no Internet permission. No network, account, Identity, Sync, remote backup, or server authority is implied by the client shell.
- Android host-side tests cover persistence/recreation, Unicode/newline codec round-trip, blank-memo rejection without clearing prior data, draft clear/reload, and corruption fallback to the previous readable generation.
- Responsive Glaze-oriented browser shell with persistent Memos / Archive / Trash workspace navigation, live lifecycle counts, managed-label navigation, top-bar search, compact quick capture, and secondary workspace/label-management drawers.
- First-use setup and replayable contextual guidance for quick capture, local privacy boundaries, workspace controls, and keyboard shortcuts.
- Browser-local System / Light / Dark / Deep Dark appearance plus Reduced Motion, Increased Contrast, Reduced Transparency, and Forced Colors resilience handling.
- Compact quick-capture composer with optional title, required memo content, visual memo-color swatches, removable label chips, and managed-label suggestions.
- Local composer draft recovery using browser local storage, including draft color and label input state.
- Saved memo persistence using browser IndexedDB.
- Active memos can be duplicated locally into a new Active, unpinned memo without changing the source.
- Stable local memo identifiers using `crypto.randomUUID()`.
- Memo timestamps and explicit schema-version metadata.
- Local Memo schema v4 / Label schema v2 / Saved View schema v1 on IndexedDB database v5, with migration coverage from v1, v2, v3, and preservation coverage for existing v4 managed-label state.
- Managed local Label v2 identity records with stable UUIDs, a case-insensitive unique `nameKey`, optional curated color, optional icon text, optional description, and a composite Memo–Label relation store.
- Sidebar labels show per-lifecycle counts and act as reversible exact-label filters with explicit pressed-state semantics rather than one-way navigation.
- Legacy managed Label v1 records normalize to Label v2 with empty optional metadata without requiring a Label-specific IndexedDB migration; database v5 is introduced separately for Saved View persistence.
- v3 → v4 migration of memo-local label names into shared managed Label identities while preserving the existing label-name display/search projection.
- Browser-local managed-label administration for rename, metadata editing, explicit delete, and merge.
- Managed-label rename preserves stable identity, metadata, and creation time, rejects normalized-name collisions, and updates affected memo display/search projections transactionally.
- Managed-label metadata editing validates and persists optional color/icon/description while preserving Label identity/name and Memo–Label relationships.
- Managed-label delete removes the Label identity, Memo–Label rows, and affected memo projections without deleting memo content.
- Managed-label merge transfers source relationships to the target identity with relation/projection deduplication, then removes the source identity in the same transaction while preserving target metadata.
- Memo-card label badges join memo `labelIds` to managed Label v2 metadata by stable identity, keep the canonical label name visible and accessible, optionally show icon text as a decorative cue, and use optional label color only as a supplementary accent with a Forced Colors fallback. Label descriptions remain management-only.
- Ephemeral memo multi-selection in the currently rendered lifecycle/search/filter result set, with browser-local bulk **Apply label** and **Remove label** actions for existing managed Labels.
- Bulk label changes validate the full selected memo set before writes, update Memo–Label relationships and memo label-name/ID projections in one IndexedDB transaction, and use one shared organization-change timestamp for changed memos. Apply respects the 20-label-per-memo limit and aborts the full bulk action before writes when a selected memo would exceed it.
- Optional memo color metadata from a curated palette, rendered with a restrained visual treatment plus an accessible named color indicator so color is not the sole signal.
- Per-memo label chips with managed-label suggestions and new-label entry, backed by whitespace normalization, case-insensitive duplicate removal, and managed-identity reuse across memos.
- Local memo listing ordered by pin state, persisted manual pin order, and update time.
- Direct Pin/Unpin controls plus Move pin up/Move pin down controls for active pinned memos.
- Direct active-card editing by click or keyboard activation with one inline editor at a time, debounced autosave for content/title/color/labels, Done/Escape dismissal, and the three-dot menu reserved for secondary lifecycle/pinning actions.
- Comfortable, Compact, List, and Dense memo presentation modes with a persisted browser-local preference and native keyboard-accessible radio controls.
- Ephemeral local substring search across memo title, body, and current label-name projection.
- Combinable exact memo-color, label-name, and managed Label-color filters scoped to the current Memos, Archive, or Trash lifecycle view. Label-color matching resolves current Label v2 metadata by stable `labelId` and matches when any linked managed Label has the selected palette color.
- Bounded advanced expressions in **Search memos** for `color:<memo-color>`, `label:<exact-name>`, and `label-color:<managed-label-color>`. Quoted values support label names containing spaces; recognized malformed/duplicate/unsupported expressions surface deterministic errors, while unknown colon-containing text remains ordinary substring search text. Expression constraints combine with the separate filter controls using AND semantics.
- Browser-local Saved View v1 records with stable UUIDs and case-insensitive unique names. A saved view captures the raw Search memos value plus the direct memo-color, label-name, and managed Label-color controls, persists across reload, restores those controls in the current lifecycle location, and can be explicitly deleted.
- Large browser libraries are progressively materialized in 200-card batches while preserving full result/lifecycle counts, and memo editors/action controls hydrate only when requested to bound initial DOM work.
- Long memo bodies use accessible Show more / Show less previews so a single memo does not dominate a board column.
- Active search/filter state and bulk memo selection remain ephemeral unless the user explicitly saves the filter state as a Saved View; there is still no recent-search history, synchronization, saved selection state, saved-view ordering, pinning, styling metadata, or default-view behavior.
- Recoverable Archive behavior with restore to active Memos.
- Recoverable Trash behavior that remembers whether a memo came from Memos or Archive.
- Explicit permanent deletion restricted to memos already in Trash.
- Accessible labels, visible focus indicators, concise live status text, current-page/pressed-state semantics, focus restoration for transient UI, 48 px compact-layout touch-target coverage, 200% text/reflow coverage, and reduced-motion/high-contrast/forced-colors resilience in the browser UI.
- Unit tests for memo/label/saved-view normalization, managed-label reconciliation/rename/metadata, label presentation identity/fallback behavior, label and Saved View service forwarding/validation, bulk-label service validation/forwarding, memo migration/editing, colors, pin ordering, capture, lifecycle transitions, permanent-deletion guards, presentation preferences, bounded advanced-search parsing/error handling, and local query/filter behavior including managed Label-color matching by stable identity.
- Chromium end-to-end tests for draft recovery, persistence across reload, organization-metadata autosave, manual pin ordering, presentation/appearance persistence, onboarding/hint behavior, keyboard/focus semantics, mobile/tablet touch targets and large-text reflow, accessibility media modes, lifecycle-scoped local search/filter behavior including reversible sidebar label filters and managed Label-color combinations, bounded advanced expressions/error recovery, Saved View save/reload/apply/delete behavior with duplicate-name rejection, progressive large-library rendering, long-card expansion, ephemeral bulk selection, atomic bulk label apply/remove and label-limit rollback, Archive/Trash recovery, managed-label rename/collision/metadata/presentation/merge/delete behavior, v1/v2/v3 → v5 migration, v4 → v5 identity-preservation migration, and deterministic Development performance diagnostics.

## Not implemented

Server hosting, accounts, authentication, synchronization, offline mutation queues, conflicts, bulk actions beyond label application/removal, ownership/authorization/synchronization metadata, managed Label icon/description search/filter dimensions, advanced expression fields beyond memo color/label name/managed Label color, attachment/checklist/date/metadata search, smart filters, persisted recent searches, saved-view synchronization/order/pin/icon/color/default-view features beyond the current named local filter snapshots, attachments, checklists, reminders, revision history, full roadmap search coverage, native desktop clients, connected/synchronized Android behavior beyond the current local Development foundation, synchronized presentation preferences, import/export, operational backup/recovery, administration beyond the local label-management slice, production observability, and Stable Glaze UI acceptance are not established by this repository state.
