# GoreeCloud Memos Production Upgrade Checklist

## Purpose

I use this checklist to upgrade the accepted GoreeCloud Memos production deployment at `https://memos.goreecloud.com` without confusing repository validation, release publication, live-host deployment, production acceptance, or Stable classification.

The original Notes-to-Memos cutover is complete. The current accepted production runtime is GoreeCloud Memos v0.1.2. The approved deployment target for this maintenance window is the published GoreeCloud Memos v0.1.3 Stable release.

## 1. Current and target identities

Current accepted production image:

```text
ghcr.io/goreecloud/memos:goreecloud-v0.1.2@sha256:98cea4ed48e6c8dea2c70a7c88b5b246ae8569a69ad5fe749127a91720ef00be
```

Current accepted production source:

```text
ff3d5c6740b83bc55486ff51c5f6ec65436d91f9
```

Published v0.1.3 Stable target image:

```text
ghcr.io/goreecloud/memos:goreecloud-v0.1.3@sha256:13b45db6b0977d5b4c89afba2a1d5d0eacf9bc1ad884f86c0c719958de1b84f4
```

Published v0.1.3 Stable source:

```text
70de16fb8dc08b1aadc42190566d5981f9ab2216
```

Stable tag:

```text
goreecloud-v0.1.3
```

The v0.1.3 image digest was independently resolved from GHCR before this cutover runbook was prepared. Later `main` commits do not alter the already published v0.1.3 release. I deploy the exact immutable v0.1.3 image above and do not substitute a rebuild or a later `main` revision.

## 2. Production baseline

The live deployment must retain this model unless a separately approved target-environment finding requires a controlled change:

```text
Host: goreecloud-vps-01
Container: goreecloud-memos
Application port: 5230 inside Docker only
Data path: /srv/docker/appdata/memos
Protected configuration path: /srv/docker/secrets/memos
Live stack: /srv/docker/stacks/memos/docker-compose.yml
Proxy network: proxy
Private hostname: memos.goreecloud.com
AdGuard / NetBird private address: 100.71.27.119
Runtime identity: 10001:10001
```

Port 5230 must not be published to the host or public internet.

## 3. Pre-upgrade recovery gate

Before replacing v0.1.2, I complete the current recovery gate in:

- `docs/goreecloud/backup-live-preflight.md`
- `docs/goreecloud/backup-restore-validation.md`

At minimum I require:

- the current v0.1.2 production image, Compose state, and protected environment/configuration state recorded without exposing reusable secrets;
- a fresh application-consistent v0.1.2 recovery point made while SQLite is quiescent unless an equally strong validated online method is in use;
- checksum/readability verification for the new recovery artifact or snapshot;
- a fresh isolated restore of the protected Memos data;
- the v0.1.2 immutable image retained for rollback;
- the previous production Compose/environment configuration retained; and
- the protected configuration/secrets recovery path confirmed without placing reusable credentials in source, logs, screenshots, or permanent evidence.

I do not point v0.1.2 at a database modified by v0.1.3 unless downgrade compatibility has been explicitly proven. Conservative rollback means restoring the pre-upgrade v0.1.2 recovery data together with the exact v0.1.2 image and previous deployment configuration.

## 4. Inspect the live target before writing

Using the approved VPS administrative path, I first confirm the host and current runtime:

```bash
hostname
whoami
sudo docker inspect goreecloud-memos \
  --format '{{.Config.Image}} {{.State.Status}} {{if .State.Health}}{{.State.Health.Status}}{{end}}'

sudo docker inspect goreecloud-memos \
  --format '{{range .Mounts}}{{println .Source "->" .Destination}}{{end}}'
```

Expected image before maintenance:

```text
ghcr.io/goreecloud/memos:goreecloud-v0.1.2@sha256:98cea4ed48e6c8dea2c70a7c88b5b246ae8569a69ad5fe749127a91720ef00be
```

I stop if I am on the wrong host, the current image is unexpected, the Memos bind mounts differ from the documented production paths, the container is not healthy before maintenance begins, or the rollback/recovery state is incomplete.

## 5. Update only the protected production image reference

I preserve the existing production stack and change only the approved immutable image reference required for the v0.1.3 upgrade unless a separately documented target-environment correction is required.

The active value must be exactly:

```text
GOREECLOUD_MEMOS_IMAGE=ghcr.io/goreecloud/memos:goreecloud-v0.1.3@sha256:13b45db6b0977d5b4c89afba2a1d5d0eacf9bc1ad884f86c0c719958de1b84f4
```

I keep the live environment file outside ordinary source control and preserve its approved restrictive permissions.

Before activation I render the live Compose configuration and verify the resolved image, data/configuration paths, proxy network, runtime identity, and absence of a published backend port.

## 6. Pull and recreate only GoreeCloud Memos

I pull the exact immutable v0.1.3 image before replacing the running service. I then recreate only the Memos service using the live production stack.

I do not restart Caddy, NetBird, AdGuard Home, Kopia, Uptime Kuma, or unrelated application containers merely because Memos is being upgraded.

After recreation I require Docker health to become `healthy` and the local container health endpoint to return:

```text
Service ready.
```

I verify the running container resolves to the exact v0.1.3 tag-plus-digest reference rather than assuming the recreate command succeeded.

## 7. Private-DNS-aware production preflight

The VPS system resolver may return Porkbun public proxy addresses for `memos.goreecloud.com`; that is not the authoritative private-service answer. The approved AdGuard private DNS path returns `100.71.27.119`.

From a checkout containing the release-compatible preflight tooling, I run:

```bash
GOREECLOUD_MEMOS_EXPECTED_PRIVATE_IP=100.71.27.119 \
GOREECLOUD_MEMOS_PRIVATE_DNS_SERVER=100.71.27.119 \
GOREECLOUD_MEMOS_HTTPS_TARGET_IP=100.71.27.119 \
GOREECLOUD_MEMOS_EXPECTED_IMAGE='ghcr.io/goreecloud/memos:goreecloud-v0.1.3@sha256:13b45db6b0977d5b4c89afba2a1d5d0eacf9bc1ad884f86c0c719958de1b84f4' \
sh scripts/goreecloud-memos-deployment-preflight.sh
```

The preflight must confirm:

- restricted environment-file permissions;
- exact immutable image equality;
- valid Compose rendering;
- no backend host-port publication;
- approved `proxy` network attachment;
- running and healthy `goreecloud-memos` state;
- runtime identity `10001:10001`;
- direct AdGuard/private-DNS equality with `100.71.27.119`;
- HTTPS/TLS reachability pinned to the approved private destination; and
- GoreeCloud Memos product identity.

A preflight pass is necessary but does not replace application, backup, monitoring, rollback, or real-client acceptance.

## 8. v0.1.3 application acceptance

From an approved NetBird client I verify at minimum:

- sign-in and session persistence;
- existing memo visibility and representative attachment retrieval;
- private memo creation and editing;
- draft label selection before first save and correct persistence after save;
- label/tag filtering and removable label chips;
- Markdown and checklist behavior;
- pinning;
- search;
- memo colors;
- Archive and restore;
- Trash, Delete All, restore, and 30-day retention behavior at the intended boundary;
- attachment upload and retrieval, including representative failure/retry behavior where practical;
- Markdown export;
- full-library JSON export;
- quick-capture autosave/Undo behavior;
- clipboard flows introduced in v0.1.3;
- restart persistence;
- acceptable desktop browser behavior; and
- acceptable real-device Android/PWA behavior for the web runtime.

Registration must remain in its approved locked-down state.

Native Linux and Android wrapper package acceptance is a separate client-distribution boundary. The Android debug acceptance APK must not be represented as a protected-signing Stable Android release.

## 9. Monitoring acceptance

I revalidate the existing GoreeCloud Memos Uptime Kuma monitor against the live v0.1.3 target using `docs/goreecloud/monitoring-readiness.md`.

The authoritative endpoint remains:

```text
https://memos.goreecloud.com/healthz
```

with HTTP 200, valid TLS, and response marker `Service ready.`.

I verify the existing monitor identity and Caddy source allowance before changing either. I do not broaden the Memos allowlist to an unnecessary Docker subnet.

Production monitoring acceptance for this upgrade requires the monitor to remain healthy after cutover and a controlled DOWN/RECOVERED validation during the approved maintenance window when practical, with the expected administrative notifications.

## 10. Final security and publication checks

Before closing the maintenance window I confirm:

- approved NetBird clients still reach `https://memos.goreecloud.com`;
- an unapproved non-NetBird/non-monitor source remains denied by Caddy;
- port 5230 remains unpublished on the host;
- the running container uses the exact v0.1.3 immutable image;
- `/srv/docker/appdata/memos` remains the production persistence path;
- `/srv/docker/secrets/memos` remains the protected configuration path with approved restrictive permissions;
- runtime identity remains `10001:10001`;
- Caddy, private DNS, and TLS remain unchanged unless a separately validated narrow correction was required;
- Uptime Kuma remains healthy after the controlled monitor test;
- backup continuity remains intact; and
- unrelated GoreeCloud services remain healthy.

## 11. Rollback triggers and action

I roll back if the new runtime creates unacceptable security, privacy, data-integrity, authentication, critical-feature, attachment, monitoring, publication, performance, or compatibility failure, or if I cannot verify the exact deployed artifact.

Conservative rollback is:

1. stop further Memos mutation if continued writes could worsen the failure;
2. preserve diagnostic evidence and any unique post-upgrade information that must not be lost;
3. restore the previous v0.1.2 image reference and deployment configuration;
4. restore the fresh pre-v0.1.3 v0.1.2 data recovery point when database compatibility is uncertain;
5. recreate only GoreeCloud Memos;
6. rerun the private-DNS-aware preflight against the v0.1.2 immutable image;
7. verify critical application workflows and monitoring; and
8. record the failed deployment and rollback without erasing its history.

## 12. Production acceptance record

I record v0.1.3 as deployed and production-accepted only after all applicable live checks pass. The acceptance record includes:

- source commit `70de16fb8dc08b1aadc42190566d5981f9ab2216`;
- Stable tag `goreecloud-v0.1.3`;
- immutable image `ghcr.io/goreecloud/memos:goreecloud-v0.1.3@sha256:13b45db6b0977d5b4c89afba2a1d5d0eacf9bc1ad884f86c0c719958de1b84f4`;
- production hostname and target host;
- data/configuration paths;
- deployment and validation time;
- backup and isolated-restore evidence;
- monitoring evidence;
- representative application/client acceptance results;
- retained v0.1.2 rollback reference; and
- any remaining limitations or separately tracked client-signing work.

Until that record exists, v0.1.3 remains a published Stable release awaiting controlled production deployment, while v0.1.2 remains the accepted production runtime.
