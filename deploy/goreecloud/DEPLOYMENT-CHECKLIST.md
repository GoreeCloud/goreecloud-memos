# GoreeCloud Memos Production Upgrade Checklist

## Purpose

I use this checklist to upgrade the accepted GoreeCloud Memos production deployment at `https://memos.goreecloud.com` without confusing repository validation with live-host acceptance.

The original Notes-to-Memos cutover is complete. The current accepted production runtime is GoreeCloud Memos v0.1.0. The next approved deployment target is the already validated v0.1.1 Stable artifact.

## 1. Current and target identities

Current accepted production image:

```text
ghcr.io/goreecloud/memos:goreecloud-v0.1.0@sha256:15f523fb1ac2b946339d9216d741b4368fbfd8631159487acc20b4133702ace1
```

Validated v0.1.1 target image:

```text
ghcr.io/goreecloud/memos:goreecloud-v0.1.1@sha256:ec9fd1b02fb0ae545487c6b109b0254794898b4799fcea34e667dd50b4346075
```

Validated v0.1.1 source commit:

```text
ca52b1a7a25925b02cb4bf19b05e38581265fd02
```

Post-v0.1.1 `main` commits may improve deployment/recovery tooling without changing the already published v0.1.1 application image. I do not rebuild or substitute a different runtime artifact merely because operational documentation changed after the Stable tag.

## 2. Production baseline

The live deployment must retain this model unless a separately approved change says otherwise:

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
```

Port 5230 must not be published to the host or public internet.

## 3. Pre-upgrade recovery gate

Before replacing v0.1.0, I complete the current recovery gate in:

- `docs/goreecloud/backup-live-preflight.md`
- `docs/goreecloud/backup-restore-validation.md`

At minimum I require:

- the current production image and Compose/environment state recorded;
- a current application-consistent v0.1.0 recovery point;
- verified backup readability;
- a fresh isolated restore of the protected Memos data;
- the v0.1.0 immutable image retained for rollback; and
- the protected configuration/secrets recovery path confirmed without exposing reusable credentials.

I do not point v0.1.0 at a database modified by v0.1.1 unless downgrade compatibility has been explicitly proven. Conservative rollback means restoring the pre-upgrade v0.1.0 recovery data together with the v0.1.0 image and previous deployment configuration.

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

I stop if I am on the wrong host, the current image is unexpected, the Memos bind mounts differ from the documented production paths, or the container is not healthy before maintenance begins.

## 5. Update only the protected production image reference

I preserve the existing production stack and change only the approved immutable image reference required for the v0.1.1 upgrade.

The active value must be exactly:

```text
GOREECLOUD_MEMOS_IMAGE=ghcr.io/goreecloud/memos:goreecloud-v0.1.1@sha256:ec9fd1b02fb0ae545487c6b109b0254794898b4799fcea34e667dd50b4346075
```

I keep the live environment file outside ordinary source control and preserve its approved restrictive permissions.

Before activation I render the live Compose configuration and verify the resolved image, paths, network, and absence of a published backend port.

## 6. Pull and recreate only GoreeCloud Memos

I pull the exact immutable v0.1.1 image before replacing the running service. I then recreate only the Memos service using the live production stack.

I do not restart Caddy, NetBird, AdGuard Home, Kopia, Uptime Kuma, or unrelated application containers merely because Memos is being upgraded.

After recreation I require Docker health to become `healthy` and the local container health endpoint to return:

```text
Service ready.
```

## 7. Private-DNS-aware production preflight

The VPS system resolver may return Porkbun public proxy addresses for `memos.goreecloud.com`; that is not the authoritative private-service answer. The approved AdGuard private DNS path returns `100.71.27.119`.

I run the repository preflight with the private DNS server and HTTPS destination explicitly selected:

```bash
GOREECLOUD_MEMOS_EXPECTED_PRIVATE_IP=100.71.27.119 \
GOREECLOUD_MEMOS_PRIVATE_DNS_SERVER=100.71.27.119 \
GOREECLOUD_MEMOS_HTTPS_TARGET_IP=100.71.27.119 \
GOREECLOUD_MEMOS_EXPECTED_IMAGE='ghcr.io/goreecloud/memos:goreecloud-v0.1.1@sha256:ec9fd1b02fb0ae545487c6b109b0254794898b4799fcea34e667dd50b4346075' \
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

A preflight pass is necessary but does not replace application, backup, monitoring, or rollback acceptance.

## 8. Application acceptance

From an approved NetBird client I verify at minimum:

- sign-in and session persistence;
- existing memo visibility and representative attachment retrieval;
- private memo creation and editing;
- Markdown and checklist behavior;
- pinning;
- labels/tags and filtering;
- search;
- memo colors;
- Archive and restore;
- Trash and restore;
- attachment upload and retrieval;
- Markdown export;
- full-library JSON export;
- restart persistence; and
- acceptable desktop and real-device Android/PWA behavior.

Registration must remain in its approved locked-down state.

## 9. Monitoring acceptance

I complete `docs/goreecloud/monitoring-readiness.md` against the live target.

The authoritative target is:

```text
https://memos.goreecloud.com/healthz
```

with HTTP 200, valid TLS, and response marker `Service ready.`.

I verify the live Uptime Kuma source identity before changing any Caddy allowlist. I do not assume another application's historical monitoring IP, and I do not broaden the Memos allowlist to an unnecessary Docker subnet.

Production monitoring acceptance requires controlled DOWN and RECOVERED transitions plus the expected administrative notifications.

## 10. Final security and publication checks

Before closing the maintenance window I confirm:

- approved NetBird clients still reach `https://memos.goreecloud.com`;
- an unapproved non-NetBird/non-monitor source remains denied by Caddy;
- port 5230 remains unpublished on the host;
- the running container uses the exact v0.1.1 immutable image;
- `/srv/docker/appdata/memos` remains the production persistence path;
- Caddy, private DNS, and TLS remain unchanged except for a separately validated narrow monitoring-source allowance if required; and
- unrelated GoreeCloud services remain healthy.

## 11. Production acceptance record

I record v0.1.1 as deployed only after all applicable live checks pass. The acceptance record includes:

- source commit;
- Stable tag;
- immutable image reference;
- production hostname and target host;
- data/configuration paths;
- validation date;
- backup and isolated-restore evidence;
- monitoring DOWN/RECOVERED evidence;
- rollback reference; and
- any remaining limitations.

Until that record exists, v0.1.1 is a validated Stable artifact ready for controlled deployment, while v0.1.0 remains the accepted production runtime.
