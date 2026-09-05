# Native Memos portable snapshot foundation

Status: Development only

This document describes the current source-level portability foundation for the original GoreeCloud-owned native Memos implementation.

## Purpose

The native Memos domain exposes a bounded, versioned JSON snapshot format for preserving memo content and meaning independently of the current repository implementation. The durable native `FileRepository` also exposes a bounded clean-target materialization primitive for this format. These source capabilities support the Everkeep portability and recovery direction without claiming accepted backup, production restore, migration, or recovery readiness.

The current implementation is in:

- `native/internal/memo/portable_snapshot.go`;
- `native/internal/memo/portable_snapshot_restore.go`; and
- `native/internal/memo/portable_snapshot_restore_test.go`.

## Snapshot contents

Schema version 1 preserves, for each memo:

- memo ID;
- content;
- pinned state;
- labels;
- reminder instant when present;
- Active, Archived, or Trashed lifecycle state;
- creation timestamp; and
- last-updated timestamp.

The envelope also records:

- the explicit format identifier `goreecloud-memos-portable-snapshot`;
- schema version;
- UTC export timestamp; and
- a SHA-256 checksum over the canonical encoded memo-record array.

## Privacy and ownership boundary

The source owner identifier is intentionally omitted from the portable payload. Export remains owner-scoped because `CreatePortableSnapshot` requires an explicit owner and obtains records through the owner-scoped `Repository` contract.

Decode requires an explicit target owner and assigns that owner only after the envelope, checksum, and memo records pass validation. The clean-target writer likewise requires its caller to supply the target owner and materializes only the decoded target-owner records.

Neither the codec nor the clean-target writer authenticates a GoreeCloud Identity session, chooses an owner on behalf of the caller, proves that the caller is authorized for the requested owner, or establishes production restore authority. Those bindings must be supplied by a separately accepted integration before user-facing or production recovery use.

## Validation behavior

Decode uses a strict JSON decoder and fails closed when it encounters:

- an empty target owner;
- malformed JSON;
- unknown envelope fields;
- unknown memo-record fields;
- appended or trailing JSON values;
- an unsupported format or schema version;
- a zero export timestamp;
- a missing memo array;
- a checksum mismatch;
- duplicate memo IDs;
- blank memo IDs or content;
- zero or temporally inconsistent memo timestamps;
- unknown lifecycle values;
- blank or case-insensitively duplicate labels; or
- a zero reminder instant.

Timestamps are normalized to UTC when materialized.

Strict schema rejection is intentional: an unrecognized field must be introduced through an explicit versioned schema change rather than being silently accepted by an older decoder.

## Integrity boundary

The SHA-256 field detects payload modification or corruption. It is not a digital signature, authentication mechanism, provenance proof, encryption layer, or authorization decision.

Wardveil Security requirements for protected recovery artifacts and provenance remain separate work.

## Clean-target restore boundary

`RestorePortableSnapshotCleanTarget` is deliberately narrower than a general import, migration, or recovery engine.

The function:

- requires the concrete durable `FileRepository` rather than an arbitrary repository implementation;
- decodes and validates the complete snapshot before creating target-owner state;
- requires an explicit target owner and uses the existing decoder's owner rebinding;
- refuses a target-owner directory that already exists when observed through the protected repository instance;
- creates an owner-only staging directory beneath the repository root;
- writes each protected record with owner-only permissions and synchronizes each record;
- synchronizes the complete staging directory before commit;
- rechecks target absence while holding the repository instance's write lock;
- commits the complete staged owner directory with one directory rename;
- validates and rereads the committed records; and
- synchronizes the repository root before returning success.

Once the directory rename has made target-owner state visible, any subsequent verification or parent-directory durability failure is returned as `ErrPortableRestoreCommitAmbiguous`. Callers must reconcile the resulting repository state rather than retrying as if no materialization could have occurred.

The operation does not merge or overwrite target state already observed by the repository instance. It is a single-node primitive and does not claim exclusion against hostile or non-cooperating processes or independent repository instances racing on the same filesystem root.

It also does not provide:

- GoreeCloud Identity authentication or owner authorization;
- conflict resolution or merge semantics;
- arbitrary overwrite of existing owner state;
- cross-device synchronization;
- recovery lineage or trusted provenance;
- encrypted artifact transport/storage beyond requirements of the surrounding accepted system;
- Android production repository binding;
- Everkeep runtime integration;
- migration from the retained accepted runtime; or
- representative-device, recovery-drill, release, or production acceptance.

No current function silently merges portable content into existing durable memo state.

## Development evidence boundary

Strict-decoder source revision `907ce6302e9fa9ec2bee06935685000bf925836e` passed Native Memos Foundation #63 / run `33587296175`, including format check, unit tests, `go vet`, and platform-integration-manifest validation.

The clean-target restore source and tests are newer Development work and require successful exact-head Platform Contract, Native Memos Foundation, and Native Memos Android workflows before they can be recorded as an accepted Development checkpoint. Source presence alone does not establish restore testing, Everkeep acceptance, production recovery, migration readiness, release qualification, or Stable status.
