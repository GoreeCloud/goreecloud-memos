# GoreeCloud Memos — Repository Specifications

**Status:** Development  
**Repository specification version:** v0.3  
**Last updated:** 2026-09-18

## Authority

The governing planned-feature authority is `GoreeCloud/Feature Roadmap/GoreeCloud Memos/goreecloud-memos.md` in GoreeCloud Drive, currently v0.5 and Planned. This file records the repository-coupled implementation boundary and must not convert roadmap intent into unsupported implementation claims.

## Product boundary

GoreeCloud Memos is for fast, lightweight capture. GoreeCloud Notes remains the deeper note-taking and knowledge-management product.

## Current implementation boundary

The repository currently implements a local browser-only quick-capture and organization slice. Verified local behavior includes draft recovery, IndexedDB persistence, editing/autosave, Archive/Trash recovery, memo colors, managed Label v2 identities and metadata, Label rename/delete/merge administration, memo-card Label presentation, pinning/manual pin order, four presentation modes, ephemeral bulk Label Apply/Remove, lifecycle-scoped substring search, direct memo-color/label-name/managed Label-color filters, bounded advanced search expressions over those already verified local dimensions, and user-named browser-local Saved View v1 records that persist and restore the current query/direct-filter state. No network service is required by this slice.

The bounded expression syntax is `color:<memo-color>`, `label:<exact-name>`, and `label-color:<managed-label-color>`; quoted values support label names containing spaces. Recognized invalid expressions produce explicit errors. This does not establish a general-purpose query language, smart filters, server-side indexing, synchronized or decorated Saved Views, or full roadmap search.

The following remain outside the verified implementation boundary: server APIs, authentication, multi-user isolation, synchronization, conflict handling, native desktop/mobile clients, reminders, attachments, checklists, advanced expression dimensions beyond the current three local fields, full metadata/date/attachment search, smart filters, Saved View synchronization/order/pin/icon/color/default-view behavior beyond the current local named snapshots, import/export, backup/recovery, broad administration, accepted GoreeCloud platform-system integrations, production deployment, and Stable qualification.

## Initial implementation constraints

- Preserve user-entered memo content without sending it to external services.
- Use stable generated identifiers for saved memo records.
- Store creation/update timestamps as ISO-8601 UTC values.
- Keep the domain model independent from browser persistence.
- Treat the current IndexedDB adapter as local development persistence, not the final cross-platform storage architecture.
- Do not introduce server or synchronization contracts until they are explicitly designed, documented, and tested.
