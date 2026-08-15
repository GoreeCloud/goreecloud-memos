# GoreeCloud Memos — Transitional Notes Source

This repository is the **transitional Memos-derived source for GoreeCloud Notes**. It preserves the validated self-hosted implementation, migration source, data-compatibility knowledge, deployment packaging, and engineering history that existed before GoreeCloud Notes moved to a native GoreeCloud-owned application direction.

The long-term Notes product is developed in [`GoreeCloud/goreecloud-notes`](https://github.com/GoreeCloud/goreecloud-notes).

## Repository Role

This repository remains useful for:

- preserving compatibility with the existing Memos-derived Notes data model;
- maintaining a safe migration source while the native application matures;
- fixing security, stability, accessibility, recovery, and migration defects that affect the transitional service;
- keeping the transitional interface coherent with the GoreeCloud **Glaze UI** design language;
- validating export, persistence, backup, restore, and replacement paths; and
- preserving upstream ancestry, license obligations, release evidence, and historical implementation decisions.

It is **not** the preferred location for new long-term Notes product capabilities. New feature work should normally be implemented in the native GoreeCloud Notes repository unless a migration, compatibility, security, or transitional-operability requirement specifically belongs here.

## Current Development Boundary

The active GoreeCloud development line is `feature/goreecloud-foundation`, represented by draft PR #1.

Changes on that line should minimize unnecessary divergence from upstream Memos and should avoid new database/schema forks unless they are required to protect existing data or complete the migration safely.

The transitional source currently includes GoreeCloud product identity, private-by-default note creation, Archive and recoverable Trash behavior, labels, export support, responsive/PWA work, Glaze UI presentation, hardened container packaging, and restart-persistence validation.

## Glaze UI

The transitional interface is intentionally presented as a GoreeCloud product rather than an upstream Memos theme. Glaze UI work in this repository focuses on a consistent application shell, layered surfaces, rounded geometry, restrained depth, responsive behavior, accessible interaction states, and polished light/dark presentation without changing the underlying migration-critical data model.

## Privacy and Deployment

The GoreeCloud configuration is designed around private self-hosting:

- private-by-default note creation;
- authenticated user access;
- no unnecessary telemetry or tracking introduced by GoreeCloud changes;
- no direct backend host-port publication in the GoreeCloud Compose package;
- persistent application data separated from source code; and
- export, backup, restore, and migration treated as release-readiness requirements.

Live infrastructure state must be verified before operational changes. Repository examples and historical deployment records are not substitutes for inspecting the currently deployed environment.

## Validation

Material transitional changes should be validated with the applicable frontend, backend, container, persistence, migration, and recovery checks. A successful build alone is not sufficient evidence for production readiness.

Real-device, deployed-browser, backup, and restore evidence should remain explicit rather than being inferred from source review or unit tests.

## Upstream and License

This repository is a fork of [`usememos/memos`](https://github.com/usememos/memos) and remains subject to the repository's MIT license and required upstream copyright notices.

GoreeCloud rebranding does not remove upstream authorship or legal attribution. Upstream information should remain available in source, license, acknowledgments, and engineering records even when GoreeCloud Notes is the primary user-facing identity.

## Transitional Exit

Retirement of this repository or its deployed service must preserve the information and recovery paths required to migrate safely to native GoreeCloud Notes. Before retirement, verify the applicable data export/import path, attachment handling, account ownership, backup/restore state, configuration dependencies, and rollback plan.
