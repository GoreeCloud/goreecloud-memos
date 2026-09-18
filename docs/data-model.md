# GoreeCloud Memos — Development Data Model

**Status:** Development model for the local Memos Core slice; not the complete roadmap schema.

## Memo v4

| Field | Type | Current meaning |
|---|---|---|
| `schemaVersion` | integer | Local memo record schema version; currently `4`. |
| `id` | string | Stable locally generated UUID. |
| `title` | string | Optional title, currently limited to 240 characters. |
| `content` | string | Required memo body, currently limited to 100,000 characters. |
| `color` | palette token or `null` | Optional memo color metadata. |
| `labels` | string array | Synchronized local display/search projection of the memo's managed Label relationships. It remains for current UI/search compatibility; it is not the identity authority. |
| `labelIds` | string array | Stable managed Label identifiers associated with the memo, in the same display order as the `labels` projection. |
| `createdAt` | ISO-8601 UTC string | Creation timestamp. |
| `updatedAt` | ISO-8601 UTC string | Last persisted memo content, organization, pinning, or lifecycle update timestamp. Managed-label identity/metadata maintenance such as Rename, Save details, Delete, or Merge does not rewrite this memo timestamp; direct memo organization edits, including bulk Apply/Remove label when a memo changes, do. |
| `state` | `active` \| `archived` \| `trashed` | Current local lifecycle location. |
| `pinned` | boolean | Whether the memo participates in the pinned section/order. |
| `pinOrder` | non-negative safe integer or `null` | Persisted manual ordering key for pinned memos. |
| `archivedAt` | ISO-8601 UTC string or `null` | Time the memo entered Archive. |
| `trashedAt` | ISO-8601 UTC string or `null` | Time the memo entered Trash. |
| `restoreState` | `active` \| `archived` \| `null` | Previous lifecycle location used to restore a memo from Trash. |

## Managed Label v2

Managed Labels are local identity records stored in the IndexedDB version-5 `labels` store. Label record schema version 2 extends the existing stable identity with browser-local organizational metadata without changing the database object-store layout.

| Field | Type | Current meaning |
|---|---|---|
| `schemaVersion` | integer | Managed Label record version; currently `2`. |
| `id` | string | Stable cryptographically strong UUID generated once when the Label is created/migrated. |
| `name` | string | Canonical display name, trimmed and limited to 60 characters. |
| `nameKey` | string | Case-insensitive, locale-independent canonical lookup key. The IndexedDB `labels.nameKey` index is unique. |
| `color` | palette token or `null` | Optional label color using Red, Orange, Yellow, Green, Teal, Blue, Purple, Pink, or Gray. |
| `icon` | string or `null` | Optional trimmed icon text, currently limited to 32 characters. |
| `description` | string or `null` | Optional trimmed label description, currently limited to 280 characters. |
| `createdAt` | ISO-8601 UTC string | Label creation/migration timestamp. |
| `updatedAt` | ISO-8601 UTC string | Last persisted Label name or metadata update timestamp. |

Legacy managed Label v1 records are normalized to schema v2 when read. Missing `color`, `icon`, and `description` values become `null`; existing stable IDs, names, keys, and timestamps are preserved. Any subsequent label write persists the normalized v2 shape. This is a Label-record migration, not an IndexedDB database-version change.

Managed Label synchronization revision, ownership, authorization, and other cross-client roadmap metadata are not implemented yet.

## Memo Label relation

The `memoLabels` object store uses the composite key `[memoId, labelId]`. Each row represents one local many-to-many association. Secondary indexes on `memoId` and `labelId` support bounded relationship lookup.

The managed Label entity plus the Memo Label relation are the identity layer. The memo `labels` string array is only a synchronized compatibility projection during this Development stage.

## Name and identity rules

- Label-name uniqueness is case-insensitive through `nameKey`.
- `nameKey` uses deterministic lowercasing rather than locale-sensitive casing so the same label name is keyed consistently regardless of browser locale.
- Existing Label identity is reused when memo input differs only by case or surrounding whitespace.
- A memo can currently reference at most 20 labels.
- Memo input order is preserved for the local display projection and `labelIds` array.
- Creating or editing a memo reconciles requested names against existing managed Labels; missing names create new managed Label UUIDs with empty optional metadata.
- Deleting a memo removes its Memo Label relations. Unreferenced managed Labels are retained unless the user explicitly deletes or merges the managed Label.

## Implemented browser-local managed-label operations

Rename, Delete, and Merge use one IndexedDB read-write transaction across `memos`, `labels`, and `memoLabels` so identity, relationships, and compatibility projections change together.

- **Rename:** preserves the Label `id`, metadata, and `createdAt`, updates `name`, `nameKey`, and Label `updatedAt`, and changes the corresponding label-name projection on every related memo. A normalized-name collision with a different Label is rejected and requires explicit Merge. Memo `updatedAt` is intentionally preserved so a library-wide label rename does not reorder otherwise unchanged memos.
- **Save details:** updates Label `color`, optional `icon`, optional `description`, and Label `updatedAt` in the existing `labels` store while preserving Label identity/name and all Memo Label relationships. Blank optional text normalizes to `null`; unsupported color tokens are rejected.
- **Delete:** removes the managed Label identity and every Memo Label relation for it, and removes the corresponding `labelId`/display-name projection from every related memo. Memo content and lifecycle state are not deleted. The UI requires explicit confirmation.
- **Merge:** transfers every source Label relationship to an existing target Label, deduplicates the target relation/projection when a memo already had both labels, deletes the source relationships, updates affected memo projections to the target identity/name, then removes the source Label in the same transaction. The target Label identity and metadata are preserved. The UI requires explicit confirmation.

These managed-label maintenance operations are browser-local Development behavior. They do not establish ownership, authorization, synchronization, or cross-device conflict behavior.

## Bulk label Apply/Remove semantics

Bulk Apply/Remove is a direct memo-organization workflow over existing managed Label identities. The browser selection itself is ephemeral and is not stored in IndexedDB.

For each bulk action:

- Selected memo IDs are normalized and deduplicated before the store operation.
- The target managed Label must already exist.
- Every selected memo must exist before writes are queued.
- **Apply** validates the current 20-label-per-memo limit for the full selected set before writes. If any selected memo would exceed the limit, the operation is rejected before changing any selected memo.
- The relation changes and affected memo `labels`/`labelIds` projections are written in one read-write transaction across `memos`, `labels`, and `memoLabels`.
- A memo that already has the target Label on Apply, or lacks it on Remove, is left unchanged.
- Every memo actually changed by the bulk action receives the same normalized `updatedAt` timestamp because the operation is one user-directed organization edit.
- The managed Label identity and its metadata are preserved. A legacy Label v1 target is normalized to the current Label v2 record shape when the bulk operation writes it.

These semantics apply equally to selected memos currently rendered from Memos, Archive, or Trash. They do not add cross-device synchronization, authorization, ownership, or server-side bulk processing.

## Memo-card Label presentation

Memo-card presentation is a read-time projection over the existing Memo v4 and managed Label v2 records; it does not add persisted fields or require a database-version change beyond the current IndexedDB v5 Saved View upgrade.

- The renderer preserves memo label order from the memo `labels` / `labelIds` projection.
- When a stable `labelId` resolves to a current managed Label, the Label record's canonical `name`, optional `color`, and optional `icon` drive the badge presentation.
- If managed metadata cannot be resolved, the existing memo label-name projection remains visible rather than hiding the label.
- Optional icon text is supplementary and hidden from the accessibility tree; the canonical label name remains visible and supplies the badge's accessible identity.
- Optional label color is a supplementary identity accent rather than the sole carrier of meaning. Forced Colors presentation falls back to system colors while retaining the visible canonical label name.
- Label `description` remains a management/detail field and is not rendered on memo cards.
- Label-name search/filtering remains based on the existing memo projection. A separate bounded managed Label-color filter resolves current Label v2 metadata by stable `labelId`; this does not make card presentation fields themselves authoritative search storage.

## Managed Label-color filter projection

The browser-local **Label color** filter is a read-time metadata join over existing Memo v4 `labelIds` and current managed Label v2 records. It does not add persisted fields or indexes; IndexedDB v5 is introduced separately for Saved View persistence.

- The filter matches a memo when any stable `labelId` resolves to a managed Label whose current `color` equals the selected palette token.
- The match is based on Label identity rather than label-name text, so renaming a Label does not break color filtering.
- A missing or unresolved Label identity does not match a selected Label color; unknown metadata is not treated as a color.
- The Label-color filter combines with the existing substring query, memo-color filter, and exact label-name filter within the current lifecycle view.
- Active filter state remains ephemeral and resets on reload unless the user explicitly stores the current filter snapshot as a Saved View. It is not a synchronized preference, recent search, or smart-filter definition.
- Label `icon` and `description` remain outside this bounded search/filter increment.

## Saved View v1

Saved Views are explicit browser-local filter snapshots stored in the IndexedDB v5 `savedViews` object store. They do not alter Memo or Label records.

| Field | Type | Current meaning |
|---|---|---|
| `schemaVersion` | integer | Saved View record version; currently `1`. |
| `id` | string | Stable cryptographically strong UUID generated when the Saved View is created. |
| `name` | string | User-provided display name, trimmed and currently limited to 80 characters. |
| `nameKey` | string | Case-insensitive deterministic uniqueness key. The `savedViews.nameKey` index is unique. |
| `filters.query` | string | Raw **Search memos** value, including supported bounded expressions. |
| `filters.color` | memo-color filter token | Direct memo-color control value: `all`, `none`, or one supported memo color. |
| `filters.label` | string | Direct exact label-name control value or `all`. |
| `filters.labelColor` | label-color filter token | Direct managed Label-color control value or `all`. |
| `createdAt` | ISO-8601 UTC string | Saved View creation timestamp. |
| `updatedAt` | ISO-8601 UTC string | Last persisted Saved View update timestamp; v1 currently has no rename/edit operation, so it initially equals `createdAt`. |

Current Saved View semantics are intentionally narrow:

- Names are unique case-insensitively.
- The raw search value must parse successfully under the current bounded `color:`, `label:`, and `label-color:` expression rules before a Saved View is persisted.
- Applying a Saved View restores only the stored search/direct-filter controls in the current Memos, Archive, or Trash location.
- Lifecycle location, presentation mode, sort/order, pin state, Saved View icon/color decoration, Saved View ordering/pinning, and default-view behavior are not stored.
- If the Saved View requires an exact label that is unavailable in the current lifecycle location, application fails explicitly rather than silently removing that constraint.
- Deleting a Saved View removes only that Saved View record. Memo and Label data are unaffected.
- Saved Views are browser-local and have no ownership, authorization, synchronization, conflict-resolution, import/export, backup, or server semantics yet.

## IndexedDB database version 5

The browser database remains `goreecloud-memos-local`.

Version 5 retains the existing Memo/Label stores and adds:
- `labels` object store keyed by stable Label UUID, with unique `nameKey` index.
- `memoLabels` object store keyed by `[memoId, labelId]`, with `memoId` and `labelId` indexes.
- `labelIds` on Memo v4 records while retaining `labels` as a synchronized compatibility projection.
- `savedViews` object store keyed by stable Saved View UUID, with unique case-insensitive `nameKey` index.

Managed-label Rename, metadata updates, Delete, Merge, and bulk Apply/Remove continue to use the existing Memo/Label stores. The v5 bump exists specifically to establish persisted Saved View v1 storage.

### v4 → v5

Opening an existing database v4 creates only the new `savedViews` store and unique `nameKey` index. Existing Memo v4 records, Label v2 identities/metadata, and Memo–Label relations are preserved. The managed-label migration is **not** rerun for v4 data.

### v3 → v5

During the upgrade transaction, v3 memo-local label names are normalized and deduplicated case-insensitively across the local library. The first canonical display spelling is chosen deterministically from the earliest-created memo carrying a normalized label name (with memo ID as a tie-breaker). One stable Label UUID is generated for each distinct normalized name, Memo Label relation rows are created, and every memo receives aligned `labelIds` plus canonical display-name projections. Memo content, timestamps, color, pin state/order, and lifecycle fields are preserved. Newly generated managed Label records use the current Label v2 shape with empty optional metadata.

### v1/v2 → v5 compatibility

Opening a version 1 or version 2 database directly with the current application first normalizes the legacy memo record into the current Memo v4 shape, establishes the managed-label stores, and creates the empty Saved View store. Because those legacy memo schemas did not contain label names, their migrated `labels` and `labelIds` arrays are empty. Existing v2 pin state continues to receive deterministic pin ordering.

Chromium acceptance covers v1 → v5, v2 → v5, v3 → v5, explicit v4 → v5 preservation of managed Memo/Label identity state, Saved View persistence/reload/apply/delete behavior with duplicate-name rejection, transactional managed-label rename/collision/delete/merge behavior, browser-local Label v2 metadata persistence plus memo-card icon/color/name presentation, ephemeral bulk selection, successful bulk Apply/Remove, and atomic pre-write rejection when a selected memo would exceed the label limit.

## Remaining roadmap expansion

User, Memo Revision, Attachment, Reminder, Device, Sync Event, Session, Import Job, Export Job, and Backup Record schemas remain unimplemented. Saved View v1 now exists only as a browser-local named filter snapshot; synchronization, ownership, authorization, ordering, pinning, icon/color decoration, default-view behavior, and broader roadmap Saved View semantics remain open. Managed Label ownership, authorization, synchronization, icon/description search/filter dimensions, and broader multi-selection bulk actions also remain open.

## Migration rule

Any future incompatible persisted-record or IndexedDB database change must increment the relevant version and provide an explicit tested migration path. Persisted data must not be silently reinterpreted or discarded.
