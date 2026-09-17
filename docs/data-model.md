# GoreeCloud Memos — Initial Data Model

**Status:** Development model for the local Memos Core slice; not the complete roadmap schema.

## Memo v2

| Field | Type | Current meaning |
|---|---|---|
| `schemaVersion` | integer | Local memo record schema version; currently `2`. |
| `id` | string | Stable locally generated UUID. |
| `title` | string | Optional title, currently limited to 240 characters. |
| `content` | string | Required memo body, currently limited to 100,000 characters. |
| `createdAt` | ISO-8601 UTC string | Creation timestamp. |
| `updatedAt` | ISO-8601 UTC string | Last persisted content or lifecycle update timestamp. |
| `state` | `active` \| `archived` \| `trashed` | Current local lifecycle location. |
| `pinned` | boolean | Domain field exists; UI mutation is not implemented. |
| `archivedAt` | ISO-8601 UTC string or `null` | Time the memo entered Archive. Preserved while a memo is temporarily in Trash if Trash restoration should return it to Archive. |
| `trashedAt` | ISO-8601 UTC string or `null` | Time the memo entered Trash. |
| `restoreState` | `active` \| `archived` \| `null` | Previous lifecycle location used to restore a memo from Trash. |

## Local lifecycle rules

- New memos begin in `active`.
- Active memos may move to `archived`.
- Active or archived memos may move to `trashed`.
- Restoring from Trash returns a memo to `restoreState`.
- Permanent deletion is allowed only while a memo is `trashed`.
- Restoring from Archive returns a memo to `active`.

## IndexedDB database version 2

The browser database remains `goreecloud-memos-local`. Database version `2` adds a `state` index and migrates existing memo records through the v2 record normalizer during the IndexedDB upgrade transaction.

The v1 → v2 migration is covered by domain tests and a Chromium end-to-end test that creates an actual v1 IndexedDB database, opens the v2 application, and verifies the migrated record.

## Required future expansion

The roadmap requires broader objects including User, Memo Revision, Label, Memo Label, Attachment, Reminder, Saved View, Device, Sync Event, Session, Import Job, Export Job, and Backup Record. Those schemas are not yet established here.

## Migration rule

Any future incompatible persisted-record or IndexedDB database change must increment the relevant version and provide an explicit tested migration path. Persisted data must not be silently reinterpreted or discarded.
