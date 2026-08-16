# GoreeCloud Memos Production Cutover Checklist

## Purpose

I use this checklist to move GoreeCloud Memos from source-ready status to a verified private production deployment at `https://memos.goreecloud.com` without treating repository CI as proof that the live service is ready.

This checklist is intentionally conservative. I preserve the currently accepted production runtime and data until backup, restore, routing, user access, and rollback are verified for the candidate deployment.

The current GoreeCloud private-DNS inventory already records `memos.goreecloud.com` at `100.71.27.119`. That is useful prerequisite evidence, but DNS presence alone does not prove that the Memos container, Caddy route, TLS path, monitoring, backup, or application acceptance is complete.

## 1. Stable release evidence

Before changing the live runtime, I verify all of the following:

- The exact candidate source revision has passed the applicable frontend validation.
- The exact candidate source revision has passed the GoreeCloud container validation.
- The exact candidate source revision has passed the Stable upgrade-smoke validation.
- The release branch, when used, points to the exact intended current `main` revision.
- The intended release tag is a GoreeCloud `goreecloud-vX.Y.Z` Stable tag.
- The controlled Stable promotion workflow completed its frontend, container, persistence, upgrade, publication, exact-main, and tag-promotion gates.
- I recorded the published multi-architecture manifest digest and source commit from the workflow/tag evidence.
- The approved production image is written as an immutable tag-plus-digest reference:

```text
ghcr.io/goreecloud/memos:goreecloud-vX.Y.Z@sha256:<validated-digest>
```

I do not deploy `latest`, a moving tag, or a tag-only reference.

For GoreeCloud Memos v0.1.1, the validated release evidence is:

```text
Source commit: ca52b1a7a25925b02cb4bf19b05e38581265fd02
Stable tag: goreecloud-v0.1.1
Immutable image: ghcr.io/goreecloud/memos:goreecloud-v0.1.1@sha256:ec9fd1b02fb0ae545487c6b109b0254794898b4799fcea34e667dd50b4346075
```

This source/release evidence does not by itself prove that v0.1.1 is the active production deployment.

## 2. Backup and rollback evidence

Before modifying the current production Memos runtime or its publication path, I record:

- the currently running image and image digest;
- the current Compose/environment configuration;
- the current persistent data and configuration paths;
- the current Caddy route and private-DNS state;
- a current application-consistent backup or approved recovery point;
- an isolated restore result proving that the protected data can be recovered; and
- the exact previous image, paths, and routing configuration required for rollback.

I do not point an older binary at an upgraded database unless downgrade compatibility has been explicitly validated. When schema compatibility is uncertain, rollback means restoring the pre-change data together with the previous image and publication configuration.

## 3. Target runtime preparation

The intended target uses:

```text
Container: goreecloud-memos
Application port: 5230 inside Docker only
Target data path: /srv/docker/appdata/memos
Target configuration path: /srv/docker/secrets/memos
Proxy network: proxy
Private hostname: memos.goreecloud.com
Recorded private DNS target: 100.71.27.119
```

I verify ownership and permissions before startup. I do not delete, rename, or overwrite accepted production data merely because target paths exist.

## 4. Protected environment file

I create `deploy/goreecloud/.env` from `.env.example` and set the exact immutable production image.

The file must remain outside ordinary source control and use restricted permissions:

```bash
chmod 0600 deploy/goreecloud/.env
```

The image value must use the exact published release tag and digest.

## 5. Read-only deployment preflight

After the target container and routing are in place, I run the repository preflight from the repository root:

```bash
GOREECLOUD_MEMOS_EXPECTED_PRIVATE_IP=100.71.27.119 \
GOREECLOUD_MEMOS_EXPECTED_IMAGE='ghcr.io/goreecloud/memos:goreecloud-vX.Y.Z@sha256:<validated-digest>' \
sh scripts/goreecloud-memos-deployment-preflight.sh
```

The preflight is read-only. It checks:

- environment-file permissions;
- exact immutable GoreeCloud image syntax and optional expected-image equality;
- Compose rendering;
- absence of published backend host ports;
- presence of the approved proxy network;
- running and healthy `goreecloud-memos` container state;
- non-root `10001:10001` runtime identity;
- running-image equality with the configured immutable image;
- absence of runtime host-port publication;
- attachment to the approved proxy network;
- private DNS resolution for `memos.goreecloud.com`;
- optional equality with the recorded private DNS address;
- HTTPS/TLS reachability through Caddy to `/healthz`; and
- GoreeCloud Memos product identity on the application page.

A preflight pass is necessary but not sufficient for production approval.

## 6. Private publication validation

I separately verify that:

- `memos.goreecloud.com` resolves through the approved GoreeCloud private DNS path;
- Caddy routes only the intended hostname to `goreecloud-memos:5230`;
- port 5230 is not directly published to the host or public internet;
- HTTPS uses a valid certificate and no certificate warning appears on approved clients;
- access works from an approved NetBird client;
- access is unavailable through unintended public/backend paths; and
- `notes.goreecloud.com` remains reserved for the separate GoreeCloud Notes product.

## 7. Application acceptance

I validate the live service with an approved individual account rather than a shared administrator identity.

At minimum I verify:

- sign-in and session persistence;
- private note creation and editing;
- Markdown and checklist behavior;
- pinning;
- labels/tags and filtering;
- search;
- per-note colors;
- Archive and restore;
- Trash and restore;
- attachment upload and retrieval;
- Markdown export;
- full-library JSON export;
- restart persistence for application state and attachment bytes;
- registration remains disabled after the approved account/bootstrap sequence; and
- desktop plus real-device Android/PWA behavior is acceptable.

## 8. Monitoring and recovery acceptance

Before declaring the service production-ready, I verify:

- Uptime Kuma monitors the intended private HTTPS endpoint where appropriate;
- backup coverage includes the complete Memos persistence path and required protected configuration;
- the backup job is monitored through the approved GoreeCloud monitoring path;
- an isolated restore has succeeded against the intended release image; and
- the previous runtime remains available as a tested rollback path until acceptance is complete.

## 9. Production acceptance record

I only record GoreeCloud Memos as stable and visit-ready after all applicable checks above pass.

The acceptance record must identify:

- source commit;
- release tag;
- immutable image reference;
- production hostname;
- target host;
- data/configuration paths;
- validation date;
- backup/restore evidence;
- monitoring state;
- rollback reference; and
- any known limitations.

Repository CI, private DNS presence, successful container startup, or a reachable login page by itself is not sufficient evidence of production readiness.