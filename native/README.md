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
- native reminder semantics with UTC-normalized reminder instants, zero-time rejection, no-op-safe equivalent updates and clearing, and due-state evaluation only while the memo is Active;
- an explicit native repository boundary;
- a concurrency-safe in-memory Development/test repository that keys every operation by owner and defensively copies mutable memo state; and
- a single-node durable `FileRepository` Development foundation that hashes owner/memo identifiers before filesystem use, protects repository/record permissions, publishes records through synchronized temporary files plus atomic rename/directory sync, validates owner/version identity on reads, fails closed on malformed or unsafe records, and preserves owner isolation across reopen/list/delete operations.

Focused tests cover identity, capture, editing, lifecycle, pinning, labels, search, filtering, reminder behavior, repository owner isolation, defensive copies, deterministic list order, durable reopen behavior, protected paths, corrupt-record rejection, and delete isolation.

The native foundation also carries the mandatory GoreeCloud platform-system contract for Glaze UI, Wardveil Security, Privacy Shield, and Everkeep. Source validation is fail-closed and does not convert implementation evidence into production acceptance.

## Architecture boundary

All future GoreeCloud Memos application behavior on this path must be original GoreeCloud-owned implementation. The existing upstream-derived Memos application tree and accepted production runtime remain protected migration, compatibility, provenance, and rollback material; they are not the long-term native product architecture.

Narrow external dependencies may be used only where they are appropriate supporting foundations rather than substitute application implementations.

The `Repository` interface in `native/internal/memo` is the persistence seam. `MemoryRepository` remains intentionally non-durable and exists for domain/application development and tests. `FileRepository` is a durable single-node Development implementation and evidence that the native model can survive process/repository recreation; it does **not** establish production persistence readiness, Android application persistence, synchronization, migration, encryption-at-rest acceptance, Everkeep integration, or production deployment authority.

Before native production persistence can be accepted, the selected production repository/runtime must have explicit configuration and lifecycle management, crash/recovery and migration validation, approved protection/encryption behavior where required, backup/restore participation, GoreeCloud Identity owner binding, representative target-environment testing, and accepted owner-isolation evidence.

## Reminder boundary

The reminder capability in this checkpoint is domain logic only. The repository seam can preserve reminder state inside a stored Memo object, but the Android Development home remains session-only and does not schedule background jobs, send notifications, contact ntfy, expose a production service API, or modify the accepted production Memos runtime. Durable application binding, delivery, notification authorization, deduplication, recurrence, timezone presentation, and cross-application capture remain separate later milestones.

## Android acceptance boundary

The native Android Development surface has emulator-backed acceptance for launch, the explicit Development/session-only boundary, quick capture, system Back draft preservation, and text-share delivery into the native composer. Incoming text-share payloads are parsed into the minimized `NativeCaptureRequest` model and are not retained by replacing the Activity's launch intent after `onNewIntent` delivery.

This evidence validates only the tested Android Development behavior. It does not establish representative physical-device acceptance, production data persistence, synchronization, migration, release signing, current-Stable Glaze acceptance, or any Integral Platform System acceptance.

## Acceptance boundary

This native source remains a Development foundation. A green source, build, emulator, or Platform Contract workflow proves only the checks that actually ran. Production deployment, user-data migration, retirement of the accepted Memos runtime, DNS/Caddy/NetBird changes, Release Candidate promotion, and Stable qualification remain separately controlled and require their own exact-revision evidence.
