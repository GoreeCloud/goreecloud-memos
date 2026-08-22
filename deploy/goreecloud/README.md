# GoreeCloud Memos Deployment

## Purpose

I use this package as the source-controlled deployment reference for **GoreeCloud Memos**, the lightweight GoreeCloud quick-note service derived from upstream Memos.

GoreeCloud Memos is an accepted private production service at `https://memos.goreecloud.com`. The original Notes-branded cutover is complete. This package governs reproducible maintenance, upgrades, recovery, and production acceptance rather than an unperformed initial cutover.

## Current production state

Current accepted production runtime:

```text
Host: goreecloud-vps-01
Container: goreecloud-memos
Image: ghcr.io/goreecloud/memos:goreecloud-v0.1.2@sha256:98cea4ed48e6c8dea2c70a7c88b5b246ae8569a69ad5fe749127a91720ef00be
Source: ff3d5c6740b83bc55486ff51c5f6ec65436d91f9
Internal port: 5230/tcp
Data: /srv/docker/appdata/memos
Protected configuration: /srv/docker/secrets/memos
Live stack: /srv/docker/stacks/memos/docker-compose.yml
Proxy network: proxy
Private address: https://memos.goreecloud.com
Private DNS / NetBird target: 100.71.27.119
Runtime identity: 10001:10001
```

The backend does not publish port 5230 to the host. Caddy reaches `goreecloud-memos:5230` through the approved Docker proxy network and applies the private-service access boundary.

## Current validated upgrade target

The published GoreeCloud Memos v0.1.3 Stable runtime artifact is:

```text
ghcr.io/goreecloud/memos:goreecloud-v0.1.3@sha256:13b45db6b0977d5b4c89afba2a1d5d0eacf9bc1ad884f86c0c719958de1b84f4
```

Its Stable source commit and tag are:

```text
70de16fb8dc08b1aadc42190566d5981f9ab2216
goreecloud-v0.1.3
```

The v0.1.3 registry digest was independently resolved from GHCR after publication. Later `main` commits are not part of that release. I do not substitute a later source revision, rebuild, floating tag, or tag-only reference for the exact v0.1.3 immutable image above.

## Repository and live-host boundary

The canonical repository deployment model is:

```text
deploy/goreecloud/compose.yaml
```

The current live VPS stack is:

```text
/srv/docker/stacks/memos/docker-compose.yml
```

Repository configuration is a reproducible reference, not proof of live state. Before every production maintenance operation I inspect the current host, live Compose configuration, immutable image, mounts, Caddy route, private DNS, backup state, monitoring state, and rollback path.

## Historical Notes-branded runtime

Earlier Memos-based GoreeCloud Notes validation used paths such as:

```text
/srv/docker/appdata/notes
/srv/docker/secrets/notes
notes.goreecloud.com
```

Those paths are historical migration evidence, not current Memos runtime targets. The original stable Memos production cutover preserved and validated data before retiring the historical Notes-branded runtime. I do not use the retired Notes paths for current Memos deployment, backup, or upgrade operations.

`notes.goreecloud.com` remains reserved for the separate native GoreeCloud Notes product.

## Container image policy

Production uses only an exact immutable GoreeCloud Stable tag-plus-digest reference:

```text
ghcr.io/goreecloud/memos:goreecloud-vX.Y.Z@sha256:<validated-digest>
```

I do not deploy `latest`, a moving branch image, a floating release family, or a tag without its validated digest.

Stable publication requires the GoreeCloud release workflow gates, including frontend validation, container validation, persistence checks, upgrade-smoke coverage, and immutable multi-architecture publication.

## Persistent data and protected configuration

The complete Memos application-data recovery scope begins at:

```text
/srv/docker/appdata/memos/
```

The SQLite database is expected at:

```text
/srv/docker/appdata/memos/memos_prod.db
```

Attachments and other application-managed persistent data under the same directory are part of the recovery set.

Protected configuration is stored under:

```text
/srv/docker/secrets/memos/
```

I keep reusable credentials and other sensitive values outside ordinary source control. The current GoreeCloud Kopia filesystem source model intentionally does not treat `/srv/docker/secrets` as an ordinary snapshot source; protected configuration and credentials require the approved independent recovery process.

## Private publication model

GoreeCloud Memos is private by design:

1. approved clients use NetBird;
2. AdGuard Home provides the private `memos.goreecloud.com` answer;
3. the approved private target is `100.71.27.119`;
4. Caddy terminates HTTPS and reverse-proxies to `goreecloud-memos:5230`;
5. the Memos backend has no host-published port; and
6. unapproved source paths remain denied.

The VPS system resolver may return Porkbun public proxy addresses for the hostname. I therefore do not use the VPS system resolver as the authoritative proof of Memos private DNS.

## Production preflight

The read-only preflight is:

```text
scripts/goreecloud-memos-deployment-preflight.sh
```

For the current VPS architecture I explicitly select the approved private DNS server and private HTTPS target:

```bash
GOREECLOUD_MEMOS_EXPECTED_PRIVATE_IP=100.71.27.119 \
GOREECLOUD_MEMOS_PRIVATE_DNS_SERVER=100.71.27.119 \
GOREECLOUD_MEMOS_HTTPS_TARGET_IP=100.71.27.119 \
GOREECLOUD_MEMOS_EXPECTED_IMAGE='ghcr.io/goreecloud/memos:goreecloud-v0.1.3@sha256:13b45db6b0977d5b4c89afba2a1d5d0eacf9bc1ad884f86c0c719958de1b84f4' \
sh scripts/goreecloud-memos-deployment-preflight.sh
```

This preserves TLS hostname verification while directing the HTTPS acceptance request to the verified private destination.

The preflight validates the immutable image, Compose rendering, non-root runtime identity, health, absence of backend host-port publication, proxy-network attachment, authoritative private DNS, private Caddy/TLS reachability, and GoreeCloud Memos product identity.

## Backup and restore acceptance

I use these current records:

- `docs/goreecloud/backup-live-preflight.md`
- `docs/goreecloud/backup-restore-validation.md`

The v0.1.2 production cutover established an accepted production baseline and retained recovery history. Historical recovery evidence does not replace a fresh pre-v0.1.3 recovery point.

Before the v0.1.3 production upgrade, I require a current application-consistent v0.1.2 recovery point, verification of the resulting recovery artifact or snapshot, and a fresh isolated restore. Until a separately validated SQLite-safe online backup method exists, I use the documented conservative quiesced-data procedure.

## Monitoring acceptance

The current monitoring contract is:

```text
docs/goreecloud/monitoring-readiness.md
```

Uptime Kuma remains the active availability-monitoring platform until a separately accepted GoreeCloud Monitor cutover occurs.

The existing Memos monitor validates:

```text
https://memos.goreecloud.com/healthz
```

with valid TLS, HTTP 200, and response marker `Service ready.`.

For the v0.1.3 cutover I revalidate the live monitor identity, Caddy source boundary, healthy state, and controlled DOWN/RECOVERED behavior rather than assuming the previously accepted monitor proves the new runtime.

## Upgrade procedure

The controlled v0.1.2 → v0.1.3 procedure is maintained in:

```text
deploy/goreecloud/DEPLOYMENT-CHECKLIST.md
```

The upgrade changes only the approved Memos image reference unless a separately documented target-environment finding requires another controlled correction. I do not restart or reconfigure unrelated services merely because Memos is being upgraded.

After recreation, I run the private-DNS-aware preflight and complete application, backup, monitoring, publication, client, and rollback acceptance.

## Rollback

I retain the exact v0.1.2 immutable image, previous deployment configuration, and fresh pre-upgrade v0.1.2 recovery point until v0.1.3 is fully production-accepted.

If v0.1.3 modifies the database and rollback is required, I do not point the older v0.1.2 binary at the modified database unless downgrade compatibility is explicitly proven. The conservative rollback is the exact v0.1.2 image together with the pre-upgrade v0.1.2 data and deployment configuration.

## Production approval rule

I call v0.1.3 deployed and production-accepted only after target-environment evidence confirms:

- exact immutable v0.1.3 image identity;
- healthy container and local `/healthz`;
- approved non-root runtime and mounts;
- no backend host-port publication;
- authoritative private DNS and private HTTPS/Caddy access;
- approved NetBird client access and unintended-source denial;
- authentication and representative quick-note workflows, including v0.1.3 draft labels, Trash Delete All/retention behavior, attachment transfer, quick-capture/Undo, and clipboard flows;
- restart persistence;
- current backup and fresh isolated restore;
- Uptime Kuma monitoring revalidation and controlled DOWN/RECOVERED acceptance;
- representative desktop and real-device web/PWA acceptance; and
- a recorded v0.1.2 rollback state.

Repository CI and release publication alone are never sufficient evidence of live production acceptance.

Native Linux and Android wrappers remain separately versioned client artifacts. A debug Android APK is an acceptance package and must not be described as a protected-signing Stable Android distribution.
