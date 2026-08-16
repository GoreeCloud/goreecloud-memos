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
goreecloud-v0.1.0
```

Current accepted production image:

```text
ghcr.io/goreecloud/memos:goreecloud-v0.1.0@sha256:15f523fb1ac2b946339d9216d741b4368fbfd8631159487acc20b4133702ace1
```

Current validated Stable release available for controlled production upgrade:

```text
goreecloud-v0.1.1
```

Validated v0.1.1 image:

```text
ghcr.io/goreecloud/memos:goreecloud-v0.1.1@sha256:ec9fd1b02fb0ae545487c6b109b0254794898b4799fcea34e667dd50b4346075
```

Validated v0.1.1 source:

```text
ca52b1a7a25925b02cb4bf19b05e38581265fd02
```

The v0.1.1 artifact and the live production runtime remain separate states until the controlled VPS upgrade and target-environment acceptance are completed.

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
```

The backend is not published directly to the host. Caddy provides the private HTTPS publication boundary and approved clients use the GoreeCloud private network path.

The VPS system resolver may return Porkbun public proxy addresses for `memos.goreecloud.com`. The authoritative private-service validation path is the approved AdGuard DNS service at `100.71.27.119`, not the ordinary VPS resolver result.

## Recovery and monitoring boundary

The original production cutover included a verified archive and isolated restore. That evidence does not automatically prove recurring backup coverage for the current Memos production path.

Current recovery acceptance is defined by:

- `docs/goreecloud/backup-live-preflight.md`
- `docs/goreecloud/backup-restore-validation.md`

Current availability-monitoring acceptance is defined by:

- `docs/goreecloud/monitoring-readiness.md`

The remaining operational work for the v0.1.1 production upgrade is target-host work: verify current recurring backup coverage and a fresh isolated restore, deploy the exact v0.1.1 immutable image, run the private-DNS-aware deployment preflight and application acceptance, and establish live Uptime Kuma DOWN/RECOVERED evidence without weakening the Caddy access boundary.

## Release and deployment rule

A Stable GoreeCloud Memos image is not considered deployed merely because CI passed or the image was published. Production acceptance requires live-host evidence for the intended immutable image, persistent data, private DNS, Caddy/TLS path, NetBird access, application workflows, backup/restore, monitoring, and rollback.

Likewise, source-only deployment or recovery tooling changes made after a Stable tag do not silently replace that Stable application image. Runtime promotion remains an explicit controlled operation.
