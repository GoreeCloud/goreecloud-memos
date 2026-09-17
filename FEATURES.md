# GoreeCloud Memos — Current Features

**Status:** Development  
**Scope:** Features verified in the current repository source only.

## Implemented

- Quick-capture form with optional title and required memo content.
- Local draft recovery using browser local storage.
- Saved memo persistence using browser IndexedDB.
- Stable local memo identifiers using `crypto.randomUUID()`.
- Memo timestamps and schema-version metadata.
- Local memo listing ordered by pinned state and update time; pin editing is not yet exposed.
- Local deletion of saved memos.
- Accessible labels, focus indicators, live status text, responsive layout, and reduced-motion-safe behavior in the prototype UI.
- Unit tests for memo creation, validation, ordering, capture, persistence abstraction, and deletion.

## Not implemented

Server hosting, accounts, authentication, synchronization, offline mutation queues, conflicts, attachments, labels, color metadata, archive/trash semantics, checklists, reminders, revision history, search, saved views, native desktop/mobile clients, import/export, backup/recovery, administration, production observability, and Stable Glaze UI acceptance are not established by this repository state.
