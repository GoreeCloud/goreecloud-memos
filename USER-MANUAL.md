# GoreeCloud Memos — User Manual

## Document status

This manual describes GoreeCloud Memos while preserving the repository's two distinct implementation states:

1. **Accepted GoreeCloud Memos web/server runtime** — the currently documented Stable production line described by `FEATURES.md`, release evidence, and deployment records.
2. **Original native GoreeCloud Memos rebuild** — Development source under `native/`. It is not yet a supported user-facing replacement for the accepted runtime and must not be treated as deployed or Stable merely because its source tests pass.

Where those states differ, this manual says so explicitly.

## 1. Product role

GoreeCloud Memos is GoreeCloud's lightweight quick-note application. It is intended for fast private capture, simple retrieval, labels, pinning, Archive, recoverable Trash, attachments where appropriate, and portable user data.

GoreeCloud Memos is intentionally separate from GoreeCloud Notes. Memos is optimized for lightweight capture and retrieval; deeper knowledge-management, research, notebook, graph, and long-form organization capabilities belong primarily to GoreeCloud Notes.

## 2. Accessing the accepted web application

The accepted GoreeCloud Memos web application is published through the private HTTPS service at:

`https://memos.goreecloud.com`

Use an authorized GoreeCloud Memos account and the supported authentication flow presented by the service. Do not place credentials, recovery secrets, or private memo content into bug reports, screenshots, source-control issues, or other public locations.

A successful source build, local development server, packaged client, or CI workflow is not proof that the same revision is deployed at this address. Production behavior is determined by the separately accepted release and deployment evidence.

## 3. Creating and editing a memo

The accepted web/server product supports fast memo creation and editing.

Typical use:

1. Open the memo composer.
2. Enter the memo content. Markdown-friendly text and checklist/task-list content are supported.
3. Add an optional title when useful.
4. Add labels before or after the first save when the current interface exposes that control.
5. Save the memo using the visible save action. Supported builds may also expose a discoverable Ctrl/Cmd + Enter shortcut; source-only shortcut enhancements are not automatically production behavior until released and deployed.

Editing an existing memo changes that memo rather than creating a second independent record. Production-accepted work includes corrections for edit triggering, title spacing, and long-note label behavior.

## 4. Quick capture, autosave, and Undo

The accepted product includes a compact quick-capture workflow with autosave behavior and visible Undo support.

Treat Undo as a convenience for the currently presented capture action, not as a substitute for long-term revision history or backup. GoreeCloud Memos is not intended to provide the deep revision-management model of a full knowledge-management application.

## 5. Organizing memos

### Labels

Use labels/tags to add lightweight organization and filtering. Labels can be assigned during supported draft/save workflows and used with filtering and search.

### Pinning

Pin important memos when they should remain easy to reach. Pinning changes presentation priority; it does not change ownership, privacy, backup, or lifecycle state.

### Colors

The accepted product supports per-memo colors for lightweight visual organization. Color is presentation metadata and should not be relied on as the sole carrier of important meaning.

## 6. Search and Quick Find

Use search to locate memo content and labels. The accepted product provides simple search/filtering appropriate to a lightweight memo application.

Some post-release source work adds more discoverable Quick Find shortcuts and persistent scope presentation. Those enhancements are Development/acceptance-gated until a later release and deployment proves they are part of the production runtime.

When a search control indicates a current route, saved view, or other scope, interpret results within that visible scope rather than assuming every memo is searched globally.

## 7. Archive and Trash

### Archive

Archive memos that should leave the active working set without being deleted. Archived memos can be restored through the supported Archive workflow.

### Trash

Trash is recoverable rather than immediate permanent deletion. The accepted product includes guarded Delete All behavior and automatic 30-day Trash retention.

Do not treat Trash as a backup. A memo may eventually be removed under retention or explicit deletion behavior, while backups and disaster recovery are separate platform responsibilities.

## 8. Attachments and images

The accepted product supports attachments and inline images with transaction-integrity hardening.

Use attachments only for content appropriate to the memo and the account's privacy/security context. Attachment availability, download controls, filenames, previews, and media behavior can vary by accepted release. A source-only attachment-preview or download improvement is not automatically deployed production behavior.

## 9. Copying memo content

The accepted product distinguishes copying the memo body from copying the entire memo where those actions are exposed. Choose the action that matches the information you intend to place on the clipboard.

Clipboard contents can be read by other software according to operating-system and application rules. Avoid copying sensitive material unless necessary and clear or overwrite sensitive clipboard content when appropriate to the surrounding environment.

## 10. Privacy and account boundaries

GoreeCloud Memos is private by default and supports individual user accounts.

Users should assume that:

- account identity and memo ownership matter to authorization;
- private memo content must not be exposed merely to support search, diagnostics, telemetry, or interoperability;
- security/privacy indicators are meaningful only when supported by accepted implementation and evidence; and
- a future native client or integration must not silently create a second authority for memo ownership or bypass the accepted account boundary.

## 11. Portable data and recovery

The accepted product includes portable-export capabilities and recurring backup/recovery coverage described by its release and operations evidence.

Export, backup, Archive, Trash, and native Development snapshots are different mechanisms:

- **Export** is a user-data portability mechanism.
- **Backup** is a recovery/continuity mechanism governed by accepted operations and Everkeep requirements where applicable.
- **Archive** is a memo lifecycle state.
- **Trash** is a recoverable deletion lifecycle state with its own retention behavior.
- **Native portable snapshot source** under `native/` is a Development serialization foundation and is not yet an accepted production backup or restore path.

Do not use the native snapshot codec as a substitute for the accepted production backup process.

## 12. Native GoreeCloud Memos rebuild — Development boundary

The `native/` tree is an original GoreeCloud-owned rebuild path. Current source establishes, among other Development foundations:

- owner-scoped memo identity;
- capture and editing rules;
- Active, Archived, and Trashed lifecycle states;
- pinning;
- labels and lightweight search/filter behavior;
- reminder domain state;
- an owner-scoped durable single-node file repository with fail-closed filesystem safeguards; and
- a versioned portable memo snapshot format with strict integrity and schema validation.

There is currently **no accepted user-facing native application workflow** in this repository that replaces the accepted web/server runtime. The native line does not yet establish an accepted Glaze UI 2.2 rendered application, production GoreeCloud Identity session integration, Wardveil Security acceptance, Privacy Shield acceptance, Everkeep backup/restore integration, GoreeCloud Mesh registration, production service API, controlled user-data migration, deployment, release, or Stable qualification.

Developers and reviewers must therefore treat native source behavior as Development evidence only.

## 13. Native portable snapshot boundary

The native `goreecloud-memos-portable-snapshot/1` format is designed to preserve supported memo state while omitting the source owner identity and requiring an explicit target owner during materialization.

The decoder validates the format, version, integrity checksum, identifiers, timestamps, lifecycle values, duplicates, and unknown fields. Decoding or materializing an in-memory snapshot does **not** overwrite the authoritative repository and does not itself authorize restore.

A future accepted restore path must separately establish authentication/ownership, conflict handling, transactional persistence, backup lineage, failure behavior, auditability, security/privacy review, and Everkeep acceptance.

## 14. Supported clients and packaging

The repository contains web/server production history and separate client/native development work. Packaged Linux, Android, Tauri, or other clients must be treated according to their own release and acceptance evidence.

Do not infer that a package is Stable because it builds, installs, launches, or points at the production service. Signing, independent signature verification, physical-device/network validation, application acceptance, release approval, and deployment evidence remain separate requirements.

## 15. Troubleshooting

When a production user encounters an issue:

1. Confirm the issue occurs in the accepted production service rather than a local or Development build.
2. Record the user-visible action, expected result, and actual result without including private memo text, credentials, tokens, cookies, or reusable secrets.
3. Check whether the behavior belongs to the active view or search scope.
4. For attachment issues, distinguish upload, preview, download, and persistence behavior.
5. For Archive/Trash issues, record the memo lifecycle action rather than assuming data loss.
6. Escalate using the approved GoreeCloud support/engineering path with minimized diagnostics.

Developers should use repository tests, exact-revision CI, release evidence, and deployment evidence to determine whether a behavior is implemented, accepted, or production-active.

## 16. Security reporting

Follow `SECURITY.md` for security reporting. Never commit or publish passwords, tokens, private keys, production secrets, private user data, memo content, attachment contents, session material, or reusable credentials.

## 17. Status rule

This manual is documentation, not release evidence. A feature is considered production behavior only when the applicable implementation, tests, release, deployment, platform acceptance, and production evidence support that claim.

The original native rebuild remains Development until its separate migration, platform-system, recovery, client, release, and Stable gates are satisfied.