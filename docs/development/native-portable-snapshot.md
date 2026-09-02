# Native Memos portable snapshot foundation

Status: Development only

This document describes the current source-level portability foundation for the original GoreeCloud-owned native Memos implementation.

## Purpose

The native Memos domain now exposes a bounded, versioned JSON snapshot format for preserving memo content and meaning independently of the current repository implementation. This supports the Everkeep portability direction without claiming backup, restore, migration, or production recovery acceptance.

The current implementation is in `native/internal/memo/portable_snapshot.go`.

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

Decode requires an explicit target owner and assigns that owner only after the envelope, checksum, and memo records pass validation. This keeps identity binding outside the portable content artifact and avoids disclosing an application owner identifier merely to preserve memo data.

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

Wardveil Security requirements for protected recovery artifacts and provenance remain separate future work.

## Restore boundary

`DecodePortableSnapshot` returns validated domain memos. It does not write them to a repository.

This is intentional. A restore or migration path still requires a controlled design for:

- existing-ID conflict handling;
- atomicity or rollback;
- authorization;
- target-owner confirmation;
- audit/evidence semantics;
- encrypted storage or transport where required;
- backup/restore integration;
- migration validation; and
- representative runtime acceptance.

No current function silently overwrites durable memo state.

## Development evidence boundary

Strict-decoder source revision `907ce6302e9fa9ec2bee06935685000bf925836e` passed Native Memos Foundation #63 / run `33587296175`, including format check, unit tests, `go vet`, and platform-integration-manifest validation.

Subsequent documentation-only revisions do not change that runtime result, but the current pull-request head must still pass its own exact-head gate before promotion. No source/test/build checkpoint establishes restore testing, recovery validation, production acceptance, or full Everkeep protection without the distinct evidence required for those states.
