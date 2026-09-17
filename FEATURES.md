# GoreeCloud Memos — Current Features

**Status:** Development  
**Scope:** Features verified in the current repository source only.

## Implemented

- Quick-capture form with optional title and required memo content.
- Local composer draft recovery using browser local storage.
- Saved memo persistence using browser IndexedDB.
- Stable local memo identifiers using `crypto.randomUUID()`.
- Memo timestamps and explicit schema-version metadata.
- Local record schema v2 with tested migration from the prior v1 representation.
- Local memo listing ordered by pinned state and update time; pin editing is not yet exposed.
- Local memo editing with debounced autosave.
- Recoverable Archive behavior with restore to active Memos.
- Recoverable Trash behavior that remembers whether a memo came from Memos or Archive.
- Explicit permanent deletion restricted to memos already in Trash.
- Accessible labels, focus indicators, live status text, responsive layout, and reduced-motion-safe behavior in the prototype UI.
- Unit tests for memo creation, validation, migration, editing, ordering, capture, lifecycle transitions, and permanent-deletion guards.
- Chromium end-to-end tests for draft recovery, persistence across reload, edit autosave, Archive/Trash recovery, permanent deletion, and v1 → v2 IndexedDB migration.

## Not implemented

Server hosting, accounts, authentication, synchronization, offline mutation queues, conflicts, attachments, labels, color metadata, pin controls, checklists, reminders, revision history, search, saved views, native desktop/mobile clients, import/export, operational backup/recovery, administration, production observability, and Stable Glaze UI acceptance are not established by this repository state.
