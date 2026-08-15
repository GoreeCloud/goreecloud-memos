# GoreeCloud Memos Transitional Source Record

## Role and Current Status

I retain this repository as the **transitional Memos-derived source for GoreeCloud Notes** and as a historical engineering record while the long-term Notes product moves to original GoreeCloud-owned development in `GoreeCloud/goreecloud-notes`.

This repository is a fork of `usememos/memos`. I preserve upstream attribution and the MIT license while maintaining the GoreeCloud-specific behavior that is still required for safe operation, validation, recovery, and migration.

I no longer classify this repository as the long-term GoreeCloud Notes product. I will not expand it into a second competing Notes platform merely because the code is available.

## Development Boundary

The active transitional branch is:

- `feature/goreecloud-foundation`

Draft PR #1 records the GoreeCloud Memos-derived implementation. I keep that work reviewable and unmerged while the remaining transitional requirements are evaluated.

Permitted work in this repository includes changes that materially improve:

- security;
- stability and reliability;
- accessibility;
- Glaze UI consistency for the still-used transitional interface;
- data integrity;
- export and migration quality;
- attachment portability;
- backup and restore readiness;
- deployment hardening;
- test coverage;
- upstream security compatibility; or
- documentation needed to operate or retire the transitional implementation safely.

New long-term product capabilities should normally be implemented in native GoreeCloud Notes instead.

## Upstream Ancestry

The GoreeCloud development branch originated from the fork's `main` branch at upstream commit:

- `34e2a59a4a94176ad95cdb8ce0a93917f471795c`
- upstream commit date: August 11, 2026

The last stable upstream release reviewed at fork initialization was Memos `v0.30.0` at commit `2036c1ffc1b0a1e1fa6a473738c2a5ef520df67f`.

I preserve this ancestry separately from GoreeCloud release naming so that version labels do not imply an exact tagged derivation that the repository history does not support.

## Historical GoreeCloud Release Evidence

The Memos-derived line published three GoreeCloud release candidates:

- `goreecloud-v0.1.0-rc.1`
- `goreecloud-v0.1.0-rc.2`
- `goreecloud-v0.1.0-rc.3`

RC3 is historical validation evidence for the transitional implementation. It is not evidence that this repository remains the intended long-term Notes product, and I do not treat creation of a stable `goreecloud-v0.1.0` as an automatic objective.

A future stable tag, merge, or production promotion requires an explicit decision based on the current migration and operational state.

## Implemented Transitional Capabilities

The branch contains substantial GoreeCloud-specific work, including:

- GoreeCloud Notes application and PWA identity;
- a Notes/Archive/Trash workspace;
- quick note capture;
- Markdown-backed titles and checklists;
- pinned notes;
- persistent note colors without a dedicated GoreeCloud database-schema fork;
- recoverable Trash state;
- labels backed by the upstream tag model;
- direct search and note actions;
- Markdown and JSON export;
- GoreeCloud Settings terminology;
- responsive and accessibility improvements;
- Glaze UI presentation;
- hardened Compose packaging; and
- authenticated restart-persistence validation.

These capabilities remain useful because they describe the data and behavior that migration tooling may need to understand.

## Glaze UI Boundary

I use Glaze UI to keep the transitional application visually coherent with GoreeCloud while it remains in use. The visual layer may be substantially improved because the interface is not migration-critical in the same way as the data model.

Glaze UI work should emphasize:

- layered and selectively translucent surfaces;
- rounded geometry;
- restrained shadows and depth;
- purposeful gradients;
- clear typography and spacing;
- consistent navigation and controls;
- strong light and dark appearance behavior;
- accessible focus and touch targets;
- reduced-motion and reduced-transparency considerations; and
- responsive behavior that changes appropriately by form factor.

Visual polish must not introduce unnecessary backend divergence or obscure important privacy and recovery states.

## Data and Migration Model

I continue to minimize unnecessary database divergence. The transitional implementation reuses upstream Memos concepts where practical, including memo content, pinned and archived state, tags, attachments, creator ownership, and Markdown task lists.

GoreeCloud-specific note color and Trash behavior are encoded in portable content metadata rather than through a large custom schema fork. Label recognition uses Markdown-aware semantics so migration does not need to infer labels from every token that resembles a tag.

The JSON export identifies itself as `goreecloud-notes`, schema version 1, and preserves the documented note metadata exposed by the transitional application. Attachment binary payloads are not represented as included when they are not bundled.

Migration to native GoreeCloud Notes must explicitly account for:

- user ownership;
- note content and titles;
- timestamps;
- pinned and archived state;
- Trash restore intent;
- labels and label colors;
- note colors;
- checklists;
- attachments and attachment bytes;
- location or media metadata when present;
- export limitations; and
- any behavior that cannot be represented natively without transformation.

## Privacy and Security

The transitional service must remain private by default. GoreeCloud changes should not introduce optional telemetry, public sharing, anonymous discovery, unnecessary external integrations, or broader network exposure.

The deployment package is designed to avoid direct backend host-port publication and to run with hardened container settings. Live private-service controls still require verification against the current Caddy, NetBird, DNS, firewall, Docker, authentication, and host configuration before production decisions are made.

Individual identity and owner separation remain required. Administrative capability does not imply unrestricted permission to inspect another user's private notes.

## Validation

I treat validation as evidence, not assumption. Depending on the change, evidence may include:

- frontend lint and unit tests;
- production frontend builds;
- backend tests;
- container builds and startup checks;
- authentication checks;
- API checks;
- persistence across actual application restarts;
- attachment-byte validation through the application route;
- browser workflow acceptance;
- real-device/PWA acceptance;
- export validation;
- backup-scope validation; and
- an isolated restore test.

A source-level or CI check does not automatically prove the corresponding deployed behavior.

## Backup and Recovery

Historical repository records reference a GoreeCloud application-data path under `/srv/docker/appdata/notes` and a SQLite database named `memos_prod.db`. I must inspect the live environment before treating those historical values as current operational facts.

I do not consider the transitional service protected merely because other GoreeCloud systems have working backups. The application data, attachment bytes, required configuration, and secret dependencies must be included through an approved application-consistent method, and a real restore must be validated before backup readiness is claimed.

Relevant repository records include:

- `docs/goreecloud/backup-live-preflight.md`
- `docs/goreecloud/backup-restore-validation.md`
- `docs/goreecloud/end-to-end-validation.md`
- `docs/goreecloud/android-pwa-validation.md`

## Retirement and Replacement

Before I retire the Memos-derived service, I will preserve the data, configuration, exports, migration records, recovery information, and relevant source history needed to protect the GoreeCloud Notes capability.

The retirement decision should verify:

1. native GoreeCloud Notes can represent or intentionally transform the required user data;
2. migration tooling has been tested against realistic transitional data;
3. attachment bytes and ownership survive the migration;
4. backup and rollback paths exist for the migration event;
5. the native application has passed the applicable production-readiness gates; and
6. obsolete transitional credentials, routes, monitoring, backups, and deployment resources are removed only after rollback is no longer required.

## License and Attribution

Memos is distributed under the MIT License. I preserve the repository license, required copyright notices, upstream ancestry, and engineering attribution.

GoreeCloud product identity and Glaze UI presentation do not convert upstream work into original GoreeCloud authorship. Required attribution remains available in source and legal records even when upstream branding is not the primary user-facing identity.
