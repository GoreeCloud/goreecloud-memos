# Native portable snapshot inspection

Status: Development source only.

GoreeCloud Memos exposes a read-only preflight helper for the existing `goreecloud-memos-portable-snapshot/1` artifact. The helper is intended for a future import/recovery review screen where a user should be able to confirm the broad shape of a snapshot before any restore authority is granted.

## Validation authority

`InspectPortableSnapshot` first calls the existing strict `DecodePortableSnapshot` boundary. A snapshot therefore receives no preflight summary unless it already satisfies the reviewed format/version, JSON shape, trailing-value, checksum, lifecycle, timestamp, label, duplicate-ID, and other record validation rules.

The preflight helper does not introduce a permissive second decoder and does not repair or normalize an invalid artifact into an apparently acceptable summary.

## Returned information

The summary contains only:

- export timestamp;
- total memo count;
- active count;
- archived count;
- trashed count;
- pinned count; and
- reminder-bearing memo count.

It deliberately does not return memo IDs, memo content, labels, reminder timestamps, source-owner identity, attachment data, credentials, filesystem paths, or repository configuration.

## Authority boundary

Inspection performs no `Repository` read or write and has no restore, overwrite, merge, conflict-resolution, migration, or deployment authority. The synthetic owner value used for strict in-memory materialization is internal to validation and is never read from or written to the snapshot.

A successful preflight means only that the supplied bytes are a valid instance of the current Development portability format and that the aggregate summary could be calculated. It does not establish artifact provenance, cryptographic authenticity, Everkeep acceptance, backup acceptance, clean-target restore safety, user-facing import acceptance, production migration readiness, or Stable qualification.

## Privacy boundary

The projection is intentionally content-minimized. Future UI or API surfaces consuming this helper must not widen the summary by serializing the internally materialized memo records. Any future preview that exposes titles/content, labels, reminders, or individual memo identifiers requires a separate reviewed privacy and authorization contract.
