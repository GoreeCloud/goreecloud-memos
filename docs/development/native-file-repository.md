# Native file repository

Status: Development

The original GoreeCloud-owned native Memos path now has a single-node durable `FileRepository` implementation behind the existing owner-scoped `Repository` interface.

Records are stored under hashed owner and memo path components so raw identifiers are not exposed in filenames. Memo content remains protected user data inside the record. The repository protects its root and owner directories, writes through an owner-private temporary file, synchronizes record contents, atomically renames the record, and synchronizes the containing directory before reporting Save success.

Reads, lists, and deletes remain explicitly owner-scoped. Cross-owner operations return the same not-found boundary, list ordering remains deterministic, and corrupt/version-mismatched records fail closed instead of silently falling back to another state.

## Authority boundary

This is Development single-node persistence only. It does not provide cross-device synchronization, production database migration, encryption-at-rest key management, Everkeep backup/restore acceptance, multi-process locking, deployment, or Stable qualification. The accepted production Memos runtime is unchanged.
