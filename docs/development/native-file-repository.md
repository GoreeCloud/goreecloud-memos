# Native file repository

Status: Development

The original GoreeCloud-owned native Memos path now has a single-node durable `FileRepository` implementation behind the existing owner-scoped `Repository` interface.

Records are stored under hashed owner and memo path components so raw identifiers are not exposed in filenames. Memo content remains protected user data inside the record. The repository protects its root and owner directories, writes through an owner-private temporary file, synchronizes record contents, atomically renames the record, and synchronizes the containing directory before reporting Save success.

Reads, lists, and deletes remain explicitly owner-scoped. Cross-owner operations return the same not-found boundary, list ordering remains deterministic, and corrupt/version-mismatched records fail closed instead of silently falling back to another state.

The durable path also fails closed when a hashed owner path is a symlink or not an owner-private directory, when a memo record is a symlink/non-regular file or has group/world permissions, and when a listed record's normalized memo ID does not match its hashed filename. These checks reduce accidental path substitution and record-placement ambiguity without expanding repository authority.

## Authority boundary

This is Development single-node persistence only. It does not provide cross-device synchronization, production database migration, encryption-at-rest key management, Everkeep backup/restore acceptance, adversarial same-user filesystem isolation, multi-process locking, deployment, or Stable qualification. The accepted production Memos runtime is unchanged.
