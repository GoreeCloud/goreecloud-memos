# Native GoreeCloud Memos

This directory contains the original GoreeCloud-owned native Memos implementation path.

## Current foundation

The current native source establishes an application-owned Memo domain with:

- required normalized memo and owner identifiers;
- non-empty memo content;
- Active, Archived, and Trashed lifecycle states;
- pinning;
- recoverable restoration to Active;
- native memo editing that trims content, rejects empty edits without mutating existing state, and updates the UTC modification timestamp only after a valid edit;
- lightweight memo labels with whitespace normalization, case-insensitive lookup/deduplication, explicit removal, and no timestamp mutation for duplicate or missing-label no-ops;
- lightweight quick-find semantics with case-insensitive content/label matching and normalized exact label filtering;
- native reminder semantics with UTC-normalized reminder instants, zero-time rejection, no-op-safe equivalent updates and clearing, and due-state evaluation only while the memo is Active; and
- focused unit coverage for identity, capture, editing, lifecycle, pinning, labels, search, filtering, and reminder behavior.

The native foundation also carries the mandatory GoreeCloud platform-system contract for Glaze UI, Wardveil Security, Privacy Shield, and Everkeep. Source validation is fail-closed and does not convert implementation evidence into production acceptance.

## Architecture boundary

All future GoreeCloud Memos application behavior on this path must be original GoreeCloud-owned implementation. The existing upstream-derived Memos application tree and accepted production runtime remain protected migration, compatibility, provenance, and rollback material; they are not the long-term native product architecture.

Narrow external dependencies may be used only where they are appropriate supporting foundations rather than substitute application implementations.

## Reminder boundary

The reminder capability in this checkpoint is domain logic only. It does not persist reminder state, schedule background jobs, send notifications, contact ntfy, expose a service API, or modify the accepted production Memos runtime. Persistence, delivery, notification authorization, deduplication, recurrence, timezone presentation, and cross-application capture remain separate later milestones.

## Acceptance boundary

This native source remains a development foundation. A green source test or workflow proves only the tested source contract. Production deployment, user-data migration, retirement of the accepted Memos runtime, DNS/Caddy/NetBird changes, and Stable qualification remain separately controlled and require their own evidence.
