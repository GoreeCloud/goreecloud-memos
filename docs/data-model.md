# GoreeCloud Memos — Initial Data Model

**Status:** Development model for the local capture slice; not the complete roadmap schema.

## Memo v1

| Field | Type | Current meaning |
|---|---|---|
| `schemaVersion` | integer | Local record schema version; currently `1`. |
| `id` | string | Stable locally generated UUID. |
| `title` | string | Optional title, currently limited to 240 characters. |
| `content` | string | Required memo body, currently limited to 100,000 characters. |
| `createdAt` | ISO-8601 UTC string | Creation timestamp. |
| `updatedAt` | ISO-8601 UTC string | Last-update timestamp; equal to creation time until editing is implemented. |
| `state` | string | Currently always `active`. |
| `pinned` | boolean | Domain field exists; UI mutation is not implemented. |

## Required future expansion

The roadmap requires broader objects including User, Memo Revision, Label, Memo Label, Attachment, Reminder, Saved View, Device, Sync Event, Session, Import Job, Export Job, and Backup Record. Those schemas are not yet established here.

## Migration rule

A change to persisted record shape must increment the local schema version and add an explicit migration before the previous representation can be considered safely replaced.
