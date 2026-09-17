# GoreeCloud Memos — Repository Specifications

**Status:** Development  
**Repository specification version:** v0.1  
**Last updated:** 2026-09-17

## Authority

The governing planned-feature authority is `GoreeCloud/Feature Roadmap/GoreeCloud Memos/goreecloud-memos.md` in GoreeCloud Drive, currently v0.5 and Planned. This file records the repository-coupled implementation boundary and must not convert roadmap intent into unsupported implementation claims.

## Product boundary

GoreeCloud Memos is for fast, lightweight capture. GoreeCloud Notes remains the deeper note-taking and knowledge-management product.

## Current implementation boundary

The repository currently implements a local browser-only quick-capture slice. A user can capture a memo, preserve an in-progress draft locally, store completed memos in IndexedDB, list them, and delete them. No network service is required by this slice.

The following remain outside the verified implementation boundary: server APIs, authentication, multi-user isolation, synchronization, conflict handling, native desktop/mobile clients, reminders, attachments, import/export, backup/recovery, administration, GoreeCloud platform-system integrations, production deployment, and Stable qualification.

## Initial implementation constraints

- Preserve user-entered memo content without sending it to external services.
- Use stable generated identifiers for saved memo records.
- Store creation/update timestamps as ISO-8601 UTC values.
- Keep the domain model independent from browser persistence.
- Treat the current IndexedDB adapter as local development persistence, not the final cross-platform storage architecture.
- Do not introduce server or synchronization contracts until they are explicitly designed, documented, and tested.
