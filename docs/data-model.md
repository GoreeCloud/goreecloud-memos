# GoreeCloud Memos — Initial Data Model

**Status:** Development model for the local Memos Core slice; not the complete roadmap schema.

## Memo v3

| Field | Type | Current meaning |
|---|---|---|
| `schemaVersion` | integer | Local memo record schema version; currently `3`. |
| `id` | string | Stable locally generated UUID. |
| `title` | string | Optional title, currently limited to 240 characters. |
| `content` | string | Required memo body, currently limited to 100,000 characters. |
| `color` | palette token or `null` | Optional memo color metadata. Current tokens: `red`, `orange`, `yellow`, `green`, `teal`, `blue`, `purple`, `pink`, `gray`. |
| `labels` | string array | Current memo-local label names. Names are trimmed, case-insensitively deduplicated, limited to 60 characters each, and limited to 20 labels per memo. This is not yet the roadmap's complete Label/Memo Label entity model. |
| `createdAt` | ISO-8601 UTC string | Creation timestamp. |
| `updatedAt` | ISO-8601 UTC string | Last persisted content, organization, pinning, or lifecycle update timestamp. |
| `state` | `active` \| `archived` \| `trashed` | Current local lifecycle location. |
| `pinned` | boolean | Whether the memo participates in the pinned section/order. |
| `pinOrder` | non-negative safe integer or `null` | Persisted manual ordering key for pinned memos; `null` when unpinned. |
| `archivedAt` | ISO-8601 UTC string or `null` | Time the memo entered Archive. Preserved while a memo is temporarily in Trash if Trash restoration should return it to Archive. |
| `trashedAt` | ISO-8601 UTC string or `null` | Time the memo entered Trash. |
| `restoreState` | `active` \| `archived` \| `null` | Previous lifecycle location used to restore a memo from Trash. |

## Local organization rules

- Memo color is optional and validated against the current curated palette.
- Label names are memo-local metadata in this Development increment; they do not yet establish central Label entities, label colors/icons/descriptions, merge behavior, search/filter indexes, or bulk assignment.
- Pinning is currently supported for active memos through the UI.
- Pinned memos are displayed before unpinned memos.
- Pinned memos are ordered by `pinOrder` first, then by `updatedAt` only as a fallback.
- Unpinned memos are ordered by `updatedAt` descending.
- Pin state and `pinOrder` are retained through lifecycle transitions unless the user explicitly unpins the memo.

## Local lifecycle rules

- New memos begin in `active`.
- Active memos may move to `archived`.
- Active or archived memos may move to `trashed`.
- Restoring from Trash returns a memo to `restoreState`.
- Permanent deletion is allowed only while a memo is `trashed`.
- Restoring from Archive returns a memo to `active`.

## IndexedDB database version 3

The browser database remains `goreecloud-memos-local`. Database version `3` migrates existing memo records through the v3 record normalizer during the IndexedDB upgrade transaction.

### v2 → v3

Version 3 adds `color`, `labels`, and `pinOrder` to the memo record. Existing v2 memos receive `color: null` and `labels: []`. Existing unpinned memos receive `pinOrder: null`. Existing pinned v2 memos receive a deterministic numeric `pinOrder` derived from their previous `updatedAt` value so their prior pinned-by-recency ordering is preserved until manually reordered.

### v1 → v3 compatibility

Opening a version 1 database directly with the current application also normalizes its records to v3. Browser acceptance covers both v1 → v3 and v2 → v3 upgrade paths.

## Required future expansion

The roadmap requires broader objects including User, Memo Revision, Label, Memo Label, Attachment, Reminder, Saved View, Device, Sync Event, Session, Import Job, Export Job, and Backup Record. Those schemas are not yet established here.

The current string-array `labels` field is therefore a bounded local-development representation. A future versioned migration must introduce stable Label/Memo Label identifiers before synchronization or full label-management claims are made.

## Migration rule

Any future incompatible persisted-record or IndexedDB database change must increment the relevant version and provide an explicit tested migration path. Persisted data must not be silently reinterpreted or discarded.
