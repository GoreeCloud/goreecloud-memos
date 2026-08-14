# GoreeCloud Notes Fork Record

## Role

I maintain this repository as **GoreeCloud Notes**, the private, self-hosted quick-note application for GoreeCloud.

This repository is a fork of [`usememos/memos`](https://github.com/usememos/memos). I preserve upstream attribution and the MIT license while maintaining GoreeCloud-specific product identity, user-experience changes, validation, deployment packaging, and recovery documentation.

## Development Model and Ancestry

I minimize divergence from upstream. I keep upstream behavior when it already satisfies GoreeCloud requirements and add GoreeCloud-specific behavior only when it provides a material product, privacy, recovery, accessibility, or maintenance benefit.

The active development branch is:

- `feature/goreecloud-foundation`

The branch was created from the fork's `main` branch at upstream commit:

- `34e2a59a4a94176ad95cdb8ce0a93917f471795c`
- Upstream commit date: August 11, 2026

The last stable upstream release reviewed before the fork was Memos `v0.30.0` at commit:

- `2036c1ffc1b0a1e1fa6a473738c2a5ef520df67f`

At fork initialization, upstream `main` was 36 commits ahead of `v0.30.0`. I therefore record `v0.30.0` as the initially reviewed release rather than claiming that the GoreeCloud branch is an exact derivative of that tagged tree.

## Product Direction

GoreeCloud Notes is a Google Keep-style notes workspace with:

- fast note capture;
- a responsive card-oriented workspace;
- pinned notes;
- Markdown-backed titles and note content;
- checklists;
- labels using the upstream tag model;
- attachments and inline images;
- search and filtering;
- Archive and restore;
- recoverable Trash with explicit permanent deletion;
- private-by-default note creation;
- individual user accounts;
- portable Markdown and JSON export;
- a GoreeCloud-native Settings experience;
- Glaze UI presentation; and
- documented deployment, validation, backup, and recovery requirements.

Later work may add reminders through ntfy, improved offline behavior, Google Keep import, richer attachment-bundle export, and optional local-only AI integrations. Those are not first-release requirements unless separately approved.

## Current Release State

The current published prerelease is:

- `goreecloud-v0.1.0-rc.3`
- release commit `eaa7bcd71937aa2025c91d0d4f838f901448a01e`
- immutable image `ghcr.io/goreecloud/memos@sha256:73613691c167b1ec261685168404b781edf844be04ed27e7bb59ebc78cdf0347`

RC3 passed desktop visual and product acceptance on the private GoreeCloud Notes validation instance.

The development branch contains additional post-RC3 stable-candidate work. The latest validated **application-code/runtime head** is `7bcaf7416abbdd39011a4e2bc6aca9169a5672e8`.

Validation on that application-code head:

- Frontend Tests run `31751659555` passed lint, the full frontend unit suite, and the production frontend build.
- GoreeCloud Container run `31751659553` passed release-asset build, validation-image build, Compose rendering, isolated startup and health, authenticated private-note creation/readback, SQLite verification, Notes restart, health recovery, reauthentication, persistence verification, logs, and cleanup.

A later **validation-harness head**, `988d1c2ed286b6cce73d594a62f9d948bdbcd7bf`, changes CI persistence scripts rather than application runtime source. Frontend Tests run `31785960610` and GoreeCloud Container run `31785960604` both passed on that exact harness head. The container run includes the original authenticated restart smoke plus mutation-backed state validation for actual pinning, upstream Archive state, and the GoreeCloud Archive-to-Trash transition through restart.

Documentation and validation-harness commits newer than `7bcaf741…` are not newer application-runtime claims unless application source changes again.

PR #1 remains draft and unmerged. Stable `goreecloud-v0.1.0` has not been created.

## Implemented GoreeCloud Capabilities

The stable candidate includes:

- GoreeCloud Notes application and PWA identity.
- A dedicated Notes/Archive/Trash workspace rather than the upstream activity-first shell.
- A collapsed `Take a note…` quick composer.
- Responsive multi-column note cards with separate Pinned and Notes presentation.
- A user-facing title mapped to the leading Markdown H1 without adding a second title storage model.
- Markdown task-list/checklist behavior.
- Persistent note colors stored as portable GoreeCloud Markdown metadata rather than a database-schema fork.
- Recoverable Trash with original Notes/Archive restore intent preserved in Markdown metadata.
- First-class Labels backed by the upstream tag model, including configured zero-use labels, usage counts, colors, filtering, note assignment/removal, and hierarchical label presentation.
- Markdown-aware label mutation that follows the same context-aware tag semantics used by rendering, preventing tag-looking text inside opaque Markdown contexts from being treated as a managed label.
- Direct desktop search and mobile Quick Find behavior.
- Direct high-frequency note-card actions for pinning, color, labels, Archive/restore, and Trash recovery.
- Individual-note Markdown export and full-library Markdown/JSON export.
- GoreeCloud Settings terminology and organization.
- Glaze UI layered surfaces, softened depth, rounded geometry, theme-aware appearance, focus feedback, and reduced-motion handling.
- Mobile safe-area handling, browser zoom, `viewport-fit=cover`, app-controlled PWA theme color, and larger mobile interaction targets.
- Focusable and accessible mobile note controls, including the pinned-note unpin action and overflow menu.
- A hardened Docker Compose deployment package with non-root execution, dropped Linux capabilities, `no-new-privileges`, bounded logging, persistent SQLite storage, protected file-backed configuration, and no backend host-port publication.
- GoreeCloud-specific GitHub Actions validation and tagged multi-architecture image publication under the `goreecloud-v*` namespace.
- Isolated authenticated API restart smokes that prove basic private-note/SQLite survival plus exact Markdown/checklist content, source-derived label recognition, GoreeCloud color metadata, actual pinned state, actual upstream Archive state, and the GoreeCloud Archive-to-Trash mutation state through real Notes container restarts.

## Data and Portability Model

I avoid unnecessary database divergence.

GoreeCloud Notes reuses:

- memo content for note content;
- the first H1 for the user-facing title;
- upstream pinned and archived state;
- upstream tags for Labels;
- tag metadata for label colors;
- Markdown task lists for checklists;
- upstream attachments; and
- creator ownership for individual user separation.

GoreeCloud-specific note color and Trash state are stored as hidden Markdown metadata. Label recognition and mutation use the canonical Markdown-aware tag grammar rather than independent regular-expression matching.

The JSON export uses format `goreecloud-notes`, schema version 1. It preserves documented note metadata including state, Trash restore target, visibility, pin state, color, labels, timestamps, location, attachment metadata, and relations.

The first export format does **not** bundle attachment binary content, comments, or reactions. Those exclusions are declared in the export so the artifact does not imply those data categories are included.

## Mobile and PWA Readiness

Source/code readiness is implemented and automated regressions protect the viewport, manifest identity, app-controlled theme color, mobile navigation targets, high-frequency note actions, overflow-menu sizing, and pinned-note button semantics.

Real-device Android/PWA acceptance remains a separate release gate. I do not treat source review, responsive unit tests, or container validation as evidence that an installed application has passed physical-device acceptance.

See `docs/goreecloud/android-pwa-validation.md`.

## End-to-End Validation

The repository has broad unit, component, build, container, authenticated API, and restart-persistence evidence.

The isolated authenticated smokes prove that the real application can bootstrap an ephemeral administrator, authenticate, create/read private notes, persist SQLite data across actual Notes container restarts, recover health, reauthenticate, and preserve exact Markdown/checklist content, source-derived label recognition, GoreeCloud color metadata, actual pinned state, actual upstream Archive state, and the GoreeCloud Archive-to-Trash mutation state.

That evidence does not replace deployed browser acceptance. Browser/user-workflow validation for the complete Notes experience, attachment binary workflows, export, private publication path, Trash restore through the deployed interface, and complete deployed full-state restart behavior remains open.

See `docs/goreecloud/end-to-end-validation.md`.

## Backup and Recovery

The application data path is expected at `/srv/docker/appdata/notes`, with SQLite at `/srv/docker/appdata/notes/memos_prod.db` in the current deployment model.

I do not consider Notes protected merely because GoreeCloud has working Kopia and provider-level recovery layers. The live Notes source scope must be inspected, the selected backup method must be application-consistent for SQLite, and a real isolated restore must prove the restored application is usable.

The repository contains:

- `docs/goreecloud/backup-live-preflight.md` — read-only live backup-scope inspection procedure.
- `docs/goreecloud/backup-restore-validation.md` — Notes-specific protection and isolated-restore acceptance requirements.

Reusable secrets remain outside ordinary filesystem backup scope unless an approved sensitive-information recovery mechanism explicitly covers them.

## Remaining First-Release Gates

Before I create `goreecloud-v0.1.0` or merge PR #1, I still require:

1. Real-device Android/PWA visual and functional acceptance.
2. Deployed browser/user-workflow and complete attachment, export, private-publication-path, and full-state restart acceptance.
3. Confirmation that GoreeCloud Notes application data is protected through the approved long-term backup path using an application-consistent method.
4. A real isolated restore test proving that Notes can be reconstructed and used from protected data and required configuration.
5. Final pull-request review of the stable-candidate branch state.

RC3 desktop acceptance and current automated source/container validation do not waive these gates.

## Deployment Boundary

The Notes repository owns the application source, GoreeCloud-specific Compose package, application validation workflow, and Notes-specific recovery instructions. It does not own the authoritative production Caddyfile, AdGuard Home configuration, NetBird policy, host backup configuration, or production monitoring configuration.

The current private validation address is `https://notes.goreecloud.com`. A current VPS validation deployment does not change the long-term architectural placement of GoreeCloud Notes on the Family Services VM.

The application Compose package exposes port 5230 only within Docker networking and does not publish that backend port to the host.

## Upstream Maintenance

I use `main` as the stable GoreeCloud branch once reviewed changes are intentionally merged. Feature work uses `feature/*`, bug fixes use `fix/*`, security work uses `security/*`, and temporary upstream integration work uses `upstream-sync/*`.

Before integrating upstream changes, I will:

1. Review upstream release notes and commits.
2. Compare upstream changes against GoreeCloud modifications.
3. Review migrations, dependencies, authentication, storage, export, privacy, and user-interface changes.
4. Integrate through an isolated `upstream-sync/*` branch when appropriate.
5. Run the applicable upstream and GoreeCloud-specific tests.
6. Validate data migration and recovery before production promotion.

## Release Identification

GoreeCloud Notes uses an independent GoreeCloud release sequence while preserving upstream ancestry separately.

Published prereleases so far are:

- `goreecloud-v0.1.0-rc.1`
- `goreecloud-v0.1.0-rc.2`
- `goreecloud-v0.1.0-rc.3`

The intended first stable release is:

- `goreecloud-v0.1.0`

I do not use the previously considered `0.30.0-gc.1` identifier because it would imply an exact v0.30.0 derivation that the fork history does not support.

Production deployment uses an immutable GHCR digest even when a human-readable release tag exists.

## License and Attribution

Memos is distributed under the MIT License. GoreeCloud modifications remain subject to the repository's license and required copyright notices. I preserve upstream attribution and do not represent upstream Memos work as original GoreeCloud authorship.