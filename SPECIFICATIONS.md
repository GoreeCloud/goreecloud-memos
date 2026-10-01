# GoreeCloud Memos — Repository Specifications

**Status:** Development  
**Repository specification version:** v0.4  
**Last updated:** 2026-09-27

## Authority

Repository-native feature state is authoritative for Memos development: `IMPLEMENTED-FEATURES.md` records accepted implemented capability, `PLANNED-FEATURES.md` records remaining/open capability, and `CHANGELOGS.md` records accepted repository history. The former Drive roadmap `GoreeCloud/Feature Roadmap/GoreeCloud Memos/goreecloud-memos.md` was retired after verified migration and is historical provenance only. This specification records the repository-coupled implementation boundary and must not convert roadmap intent, pull-request candidates, or CI evidence into unsupported production or Stable claims.

## Product boundary

GoreeCloud Memos is for fast, lightweight capture. GoreeCloud Notes remains the deeper note-taking and knowledge-management product.

## Current implementation boundary

The repository contains two Development-local application paths:

- a browser-local Memos Core experience with local draft recovery, IndexedDB persistence, editing/autosave, Archive/Trash recovery, memo colors, managed Label v2 identities and metadata, stateful sidebar label filtering, Label rename/delete/merge administration, memo-card Label presentation, pinning/manual pin order, four presentation modes, ephemeral bulk Label Apply/Remove, lifecycle-scoped search and filters, bounded advanced search expressions, browser-local Saved View v1 records, first-use/contextual guidance, responsive Glaze-oriented shell presentation, local appearance preferences, lazy secondary-control hydration, and progressive large-library materialization; and
- a first-party native Android Development foundation with local quick capture and bounded local memo/draft persistence, intentionally without network/server synchronization authority.

No production server or network service is required by the current local Development paths.

The bounded browser expression syntax is `color:<memo-color>`, `label:<exact-name>`, and `label-color:<managed-label-color>`; quoted values support label names containing spaces. Recognized invalid expressions produce explicit errors. This does not establish a general-purpose query language, smart filters, server-side indexing, synchronized or decorated Saved Views, or full roadmap search.

The following remain outside the verified implementation boundary: server APIs, authentication, multi-user isolation, synchronization, conflict handling, connected/synchronized Android behavior, a native desktop client, reminders, attachments, checklists, advanced expression dimensions beyond the current three local fields, full metadata/date/attachment search, smart filters, Saved View synchronization/order/pin/icon/color/default-view behavior beyond the current local named snapshots, import/export, operational backup/recovery, broad administration, accepted whole-application GoreeCloud platform-system integration, production deployment/signing, and Stable qualification.

## Initial implementation constraints

- Preserve user-entered memo content without sending it to external services.
- Use stable generated identifiers for saved memo records.
- Store creation/update timestamps as ISO-8601 UTC values.
- Keep the domain model independent from browser persistence.
- Treat the current IndexedDB adapter and Android local files as Development-local persistence, not the final cross-platform synchronized storage architecture.
- Preserve browser-local data continuity across the repository rename; existing `goreecloud-memos-*` browser storage/database namespaces are compatibility identifiers, not current repository-name authority.
- Do not introduce server or synchronization contracts until they are explicitly designed, documented, and tested.
