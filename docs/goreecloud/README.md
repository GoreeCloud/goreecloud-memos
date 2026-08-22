# GoreeCloud Memos Fork Record

## Role

GoreeCloud Memos is the GoreeCloud-maintained fork of Memos used for lightweight quick-note capture. It is optimized for fast writing, simple retrieval, private-by-default use, and a focused Glaze UI interface.

GoreeCloud Memos is separate from GoreeCloud Notes. Memos remains intentionally lightweight; GoreeCloud Notes is the native full notes and knowledge-management product.

## Historical context

This source tree was originally used for the Memos-based GoreeCloud Notes RC1–RC3 line. That work established useful GoreeCloud behavior including private-by-default capture, Glaze UI direction, the quick composer, labels, per-note colors, Archive, recoverable Trash, export improvements, attachment persistence evidence, and container validation.

The product boundary was later corrected: this maintained fork became **GoreeCloud Memos**, while GoreeCloud Notes moved to its separate native application project.

The original Notes-branded Memos runtime was subsequently migrated to the permanent Memos production identity and retired only after backup, restore, data-equivalence, private-publication, and browser acceptance checks passed.

## Current production and Stable state

Accepted production address:

```text
https://memos.goreecloud.com
```

Current accepted production release:

```text
goreecloud-v0.1.2
```

Current accepted production image:

```text
ghcr.io/goreecloud/memos:goreecloud-v0.1.2@sha256:98cea4ed48e6c8dea2c70a7c88b5b246ae8569a69ad5fe749127a91720ef00be
```

Current accepted production source:

```text
ff3d5c6740b83bc55486ff51c5f6ec65436d91f9
```

Current published Stable release awaiting controlled production deployment:

```text
goreecloud-v0.1.3
```

Published v0.1.3 image:

```text
ghcr.io/goreecloud/memos:goreecloud-v0.1.3@sha256:13b45db6b0977d5b4c89afba2a1d5d0eacf9bc1ad884f86c0c719958de1b84f4
```

Published v0.1.3 source:

```text
70de16fb8dc08b1aadc42190566d5981f9ab2216
```

The v0.1.3 release and the live v0.1.2 production runtime remain separate states until the controlled VPS upgrade and target-environment acceptance are completed. Later `main` commits do not silently become part of the immutable v0.1.3 release.

## Product boundary

Appropriate Memos work includes:

- quick capture and editing;
- Markdown and checklists;
- pinning, labels/tags, filtering, and search;
- Archive and recovery-oriented Trash;
- compact memo colors and attachments where they remain low-friction;
- individual accounts and private-by-default behavior;
- responsive/PWA behavior;
- portable export;
- accessibility and Glaze UI consistency;
- security, dependency, compatibility, performance, persistence, backup/restore, and deployment hardening.

Deep notebooks, advanced backlinks/knowledge graphs, research organization, extensive revision systems, OCR-heavy document processing, and broad knowledge-management workflows belong primarily to GoreeCloud Notes unless a narrowly scoped Memos requirement is separately approved.

## Upstream relationship

- GoreeCloud repository: `GoreeCloud/goreecloud-memos`
- Upstream: `usememos/memos`
- Governing license: MIT

GoreeCloud branding does not replace upstream authorship or license obligations. Relevant upstream releases and security fixes should be reviewed while unnecessary divergence is avoided.

## Glaze UI

Glaze UI is the required GoreeCloud presentation language for this fork. Product identity must remain consistent across setup/authentication, sidebar and mobile navigation, content pages, Settings, About, empty/loading/error states, browser/PWA metadata, and accessible light/dark/reduced-effect behavior.

Upstream visual branding may be replaced where GoreeCloud controls the user-facing experience, while source/legal attribution remains preserved.

## Production runtime boundary

The active production model uses:

```text
Container: goreecloud-memos
Data: /srv/docker/appdata/memos
Protected configuration: /srv/docker/secrets/memos
Live stack: /srv/docker/stacks/memos/docker-compose.yml
Docker network: proxy
Private DNS / NetBird target: 100.71.27.119
Backend port: 5230/tcp inside Docker only
Runtime identity: 10001:10001
```

The backend is not published directly to the host. Caddy provides the private HTTPS publication boundary and approved clients use the GoreeCloud private network path.

The VPS system resolver may return Porkbun public proxy addresses for `memos.goreecloud.com`. The authoritative private-service validation path is the approved AdGuard DNS service at `100.71.27.119`, not the ordinary VPS resolver result.

## Recovery and monitoring boundary

The accepted v0.1.2 production state includes recovery/rollback history and Uptime Kuma monitoring. Historical acceptance does not replace a fresh pre-v0.1.3 application-consistent rollback point or target-runtime monitoring revalidation.

Current recovery acceptance is defined by:

- `docs/goreecloud/backup-live-preflight.md`
- `docs/goreecloud/backup-restore-validation.md`

Current availability-monitoring acceptance is defined by:

- `docs/goreecloud/monitoring-readiness.md`

The remaining operational work for the v0.1.3 production upgrade is target-host work: inspect the actual v0.1.2 runtime; create and checksum/verify a fresh application-consistent v0.1.2 recovery point; complete a fresh isolated v0.1.2 rollback restore; deploy the exact v0.1.3 immutable image; run the private-DNS-aware deployment preflight; verify v0.1.3 application and real-client workflows; and revalidate the existing Uptime Kuma monitor with controlled DOWN/RECOVERED evidence without weakening the Caddy access boundary.

## v0.1.3 feature-acceptance emphasis

The production acceptance pass must exercise the material behavior delivered by v0.1.3, including draft label selection before first save, label persistence/filtering, Trash Delete All and retention behavior, attachment upload/retrieval and failure handling, quick-capture autosave/Undo, clipboard flows, exports, authentication/session continuity, restart persistence, and representative desktop/mobile web behavior.

Native Linux and Android wrapper artifacts remain separately versioned distribution targets. An Android debug acceptance APK is not a protected-signing Stable Android release.

## Release and deployment rule

A Stable GoreeCloud Memos image is not considered deployed merely because CI passed, a tag exists, or the image was published. Production acceptance requires live-host evidence for the intended immutable image, persistent data, private DNS, Caddy/TLS path, NetBird access, application workflows, backup/restore, monitoring, clients, and rollback.

Likewise, source-only deployment or recovery tooling changes made after a Stable tag do not silently replace that Stable application image. Runtime promotion remains an explicit controlled operation.
