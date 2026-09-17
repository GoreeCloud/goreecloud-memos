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
| `updatedAt` | ISO-8601 UTC string | Last persisted memo content, organization, pinning, or lifecycle update timestamp. Managed-label rename/delete/merge projection maintenance does not rewrite this memo timestamp. |
| `state` | `active` \| `archived` \| `trashed` | Current local lifecycle location. |
| `pinned` | boolean | Whether the memo participates in the pinned section/order. |
| `pinOrder` | non-negative safe integer or `null` | Persisted manual ordering key for pinned memos. |
| `archivedAt` | ISO-8601 UTC string or `null` | Time the memo entered Archive. |
| `trashedAt` | ISO-8601 UTC string or `null` | Time the memo entered Trash. |
| `restoreState` | `active` \| `archived` \| `null` | Previous lifecycle location used to restore a memo from Trash. |

## Managed Label v1

Managed Labels are local identity records introduced with IndexedDB database version 4.

| Field | Type | Current meaning |
|---|---|---|
| `schemaVersion` | integer | Managed Label record version; currently `1`. |
| `id` | string | Stable cryptographically strong UUID generated once when the Label is created/migrated. |
| `name` | string | Canonical display name, trimmed and limited to 60 characters. |
| `nameKey` | string | Case-insensitive, locale-independent canonical lookup key. The IndexedDB `labels.nameKey` index is unique. |
| `createdAt` | ISO-8601 UTC string | Label creation/migration timestamp. |
| `updatedAt` | ISO-8601 UTC string | Last Label metadata update timestamp. |

Label color, icon, description, synchronization revision, ownership, and other roadmap metadata are not implemented yet.

## Memo Label relation

The `memoLabels` object store uses the composite key `[memoId, labelId]`. Each row represents one local many-to-many association. Secondary indexes on `memoId` and `labelId` support bounded relationship lookup.

The managed Label entity plus the Memo Label relation are the identity layer. The memo `labels` string array is only a synchronized compatibility projection during this Development stage.

## Name and identity rules

- Label-name uniqueness is case-insensitive through `nameKey`.
- `nameKey` uses deterministic lowercasing rather than locale-sensitive casing so the same label name is keyed consistently regardless of browser locale.
- Existing Label identity is reused when memo input differs only by case or surrounding whitespace.
- A memo can currently reference at most 20 labels.
- Memo input order is preserved for the local display projection and `labelIds` array.
- Creating or editing a memo reconciles requested names against existing managed Labels; missing names create new managed Label UUIDs.
- Deleting a memo removes its Memo Label relations. Unreferenced managed Labels are retained unless the user explicitly deletes or merges the managed Label.

## Implemented browser-local rename/delete/merge semantics

These operations use one IndexedDB read-write transaction across `memos`, `labels`, and `memoLabels` so identity, relationships, and compatibility projections change together.

- **Rename:** preserves the Label `id` and `createdAt`, updates `name`, `nameKey`, and Label `updatedAt`, and changes the corresponding label-name projection on every related memo. A normalized-name collision with a different Label is rejected and requires explicit Merge. Memo `updatedAt` is intentionally preserved so a library-wide label rename does not reorder otherwise unchanged memos.
- **Delete:** removes the managed Label identity and every Memo Label relation for it, and removes the corresponding `labelId`/display-name projection from every related memo. Memo content and lifecycle state are not deleted. The UI requires explicit confirmation.
- **Merge:** transfers every source Label relationship to an existing target Label, deduplicates the target relation/projection when a memo already had both labels, deletes the source relationships, updates affected memo projections to the target identity/name, then removes the source Label in the same transaction. The target Label identity is preserved. The UI requires explicit confirmation.

These are browser-local Development operations. They do not establish ownership, authorization, synchronization, cross-device conflict behavior, label colors/icons/descriptions, or bulk label workflows.

## IndexedDB database version 4

The browser database remains `goreecloud-memos-local`.

Version 4 adds:
- `labels` object store keyed by stable Label UUID, with unique `nameKey` index.
- `memoLabels` object store keyed by `[memoId, labelId]`, with `memoId` and `labelId` indexes.
- `labelIds` on memo records while retaining `labels` as a synchronized compatibility projection.

Rename, Delete, and Merge operate within version 4 and therefore do not require another schema-version increment.

### v3 → v4

During the upgrade transaction, v3 memo-local label names are normalized and deduplicated case-insensitively across the local library. The first canonical display spelling is chosen deterministically from the earliest-created memo carrying that normalized name (with memo ID as a tie-breaker). One stable Label UUID is generated for each distinct normalized name, Memo Label relation rows are created, and every memo receives aligned `labelIds` plus canonical display-name projections. Memo content, timestamps, color, pin state/order, and lifecycle fields are preserved.

### v1/v2 → v4 compatibility

Opening a version 1 or version 2 database directly with the current application first normalizes the legacy memo record into the current memo shape, then establishes the managed-label stores. Because those legacy schemas did not contain label names, their migrated `labels` and `labelIds` arrays are empty. Existing v2 pin state continues to receive deterministic pin ordering.

Chromium acceptance covers v1 → v4, v2 → v4, v3 → v4, plus transactional managed-label rename/collision/delete/merge behavior on v4.

## Remaining roadmap expansion

User, Memo Revision, Attachment, Reminder, Saved View, Device, Sync Event, Session, Import Job, Export Job, and Backup Record schemas remain unimplemented. Managed Label ownership, synchronization, colors/icons/descriptions, and bulk operations remain open.

## Migration rule

Any future incompatible persisted-record or IndexedDB database change must increment the relevant version and provide an explicit tested migration path. Persisted data must not be silently reinterpreted or discarded.
