# GoreeCloud Memos Deployment

I use this directory as the source-controlled reference for a future private GoreeCloud Memos deployment. It does not authorize or perform a live migration by itself.

The approved target address is:

`https://memos.goreecloud.com`

GoreeCloud Notes remains a separate product and retains `https://notes.goreecloud.com`.

## Deployment boundary

The target GoreeCloud Memos stack uses:

- Compose project: `goreecloud-memos`
- Container: `goreecloud-memos`
- Published image namespace: `ghcr.io/goreecloud/memos`
- Persistent application data: `/srv/docker/appdata/memos`
- Protected configuration/secrets: `/srv/docker/secrets/memos`
- Private proxy network: `proxy`
- No application host-port publication

The application listens only on its Docker network. Caddy and the private GoreeCloud access path remain responsible for HTTPS publication.

## Image selection

I do not deploy `latest`, a floating release family, or a tag by itself as the production image reference.

A tagged GoreeCloud release is published only after the GoreeCloud container-validation job and reusable upgrade-smoke workflow succeed. The successful tagged `GoreeCloud Container` workflow records:

- the human-readable `goreecloud-v*` release tag;
- the exact multi-architecture manifest digest;
- the immutable `tag@sha256:...` image reference; and
- the source commit used for the build.

I copy that exact immutable reference into the protected production environment file as `GOREECLOUD_MEMOS_IMAGE`. The repository `.env.example` intentionally contains a placeholder rather than an active digest.

Example shape:

```text
GOREECLOUD_MEMOS_IMAGE=ghcr.io/goreecloud/memos:goreecloud-vX.Y.Z@sha256:<validated-digest>
```

I retain the previously approved immutable image reference until the new release is fully validated in production so rollback does not depend on rediscovering an old tag or digest.

## Historical Notes deployment

Historical Notes-branded application data and configuration are migration sources, not disposable legacy paths. I do not move, rename, delete, overwrite, or repurpose them merely because the repository now uses Memos-native target paths.

Before a live cutover I verify:

1. the existing Notes-branded application data is backed up;
2. the backup can be restored in an isolated validation environment;
3. attachment and application-state persistence are confirmed;
4. current ownership and permissions are recorded;
5. the old image reference and deployment definition required for rollback are retained; and
6. the cutover plan identifies an explicit stop/rollback condition.

## Files

- `compose.yaml` — authoritative source deployment definition for the Memos target stack.
- `.env.example` — non-sensitive variable template. The active environment file remains protected infrastructure configuration and must not be committed.
- `memos-instance-setting-general.json.example` — non-sensitive example of the intended private instance settings.

## Target filesystem preparation

The target paths use the service UID/GID expected by the GoreeCloud image:

```bash
sudo install -d -o 10001 -g 10001 -m 0770 /srv/docker/appdata/memos
sudo install -d -o 10001 -g 10001 -m 0750 /srv/docker/secrets/memos
```

I copy the example instance setting into the protected configuration path only after reviewing it for the target environment:

```bash
sudo install \
  -o 10001 \
  -g 10001 \
  -m 0640 \
  deploy/goreecloud/memos-instance-setting-general.json.example \
  /srv/docker/secrets/memos/memos-instance-setting-general.json
```

I do not store working credentials or other active secrets in repository examples.

## Protected environment file

I create the active `.env` beside the authoritative Compose deployment only after selecting the approved immutable image reference. It contains the target paths and network name required by the deployment.

At minimum I verify that `GOREECLOUD_MEMOS_IMAGE` includes both:

- an exact GoreeCloud release tag; and
- the exact approved `sha256` digest from the successful release workflow.

The active `.env` is protected configuration and is not committed to source control.

## Pre-deployment validation

Before activation I validate the resolved Compose model:

```bash
docker compose --env-file .env -f compose.yaml config
```

I review the resolved output for:

- the exact immutable image reference;
- expected bind mounts;
- the external `proxy` network;
- absence of published application host ports;
- non-root execution;
- capability dropping;
- `no-new-privileges`;
- health-check behavior;
- restart policy; and
- bounded container logging.

Syntax success alone is not a production-readiness decision.

## Backup and restore gate

Before a stateful deployment change I confirm that current application data, attachments, configuration, and any required rollback material are protected.

I do not count a backup as validated merely because a backup job reported success. Stable-release readiness requires an isolated restoration test appropriate to the deployment.

The restoration test must demonstrate that the recovered application can start and that representative user content and attachments remain available.

## Cutover gate

A controlled transition to `memos.goreecloud.com` must preserve:

- private DNS behavior;
- Caddy routing and HTTPS/TLS;
- NetBird/private access requirements;
- user authentication and access;
- application data and attachments;
- filesystem ownership and permissions;
- monitoring and alert coverage;
- backup scope; and
- rollback capability.

Repository validation is not evidence that any of those runtime relationships changed successfully.

## Post-cutover validation

After a live cutover I independently verify the production runtime rather than inferring health from CI. At minimum I confirm:

1. the running container resolves to the approved immutable image reference;
2. the application is healthy through the intended private access path;
3. no unintended host listener or public exposure was introduced;
4. authentication works;
5. representative memos and attachments are intact;
6. create/edit/archive/restore workflows function;
7. restart persistence succeeds;
8. monitoring reports the expected service state;
9. backup coverage includes the new Memos paths; and
10. the retained rollback deployment can still be identified and used if required.

## Release and rollback rule

I do not remove the previous approved image or historical migration source immediately after cutover. I retain sufficient rollback material until the new production state has passed the applicable acceptance and recovery checks.

A healthy container alone is not proof of compatibility, successful migration, or complete production readiness.

## Current repository validation

The branch CI validates the source deployment with isolated temporary paths. It checks Compose rendering, container startup/health, authenticated restart persistence, GoreeCloud application-state persistence, frontend quality, database migration paths, release-image upgrade behavior, and entrypoint-secret handling.

Those automated checks are necessary release evidence, but the environment-specific backup/restore, private DNS, Caddy, NetBird, TLS, monitoring, and real-device/PWA acceptance gates remain separate operational responsibilities.
