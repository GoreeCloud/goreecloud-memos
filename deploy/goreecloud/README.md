# GoreeCloud Notes Deployment

## Purpose

I use this deployment package to run GoreeCloud Notes as a private GoreeCloud family service through Docker Compose. The long-term production placement is the GoreeCloud Family Services VM.

This package is intentionally production-oriented but does not itself approve production deployment. I will not deploy GoreeCloud Notes as a production service until the exact container image, private access path, backup scope, restore procedure, and end-to-end behavior have been validated.

## Runtime model

I run one GoreeCloud Notes application container with SQLite storage.

- Container name: `goreecloud-notes`
- Internal application port: `5230`
- Persistent application path in the container: `/var/opt/memos`
- Default GoreeCloud data path: `/srv/docker/appdata/notes`
- Default GoreeCloud deployment-configuration path: `/srv/docker/secrets/notes`
- Reverse-proxy Docker network: `proxy`
- Planned private address: `https://notes.goreecloud.com`
- Runtime user and group: `10001:10001`

I do not publish port 5230 to the host. Caddy reaches the application directly through the external `proxy` Docker network and the backend target `goreecloud-notes:5230`.

I intentionally do **not** set `MEMOS_INSTANCE_URL`. In this Memos baseline, setting an instance URL enables anonymous access. Leaving it unset keeps the application in private mode, while browser requests through `notes.goreecloud.com` continue to use the same-origin reverse-proxy path.

## Container image

Production must use an immutable GHCR image reference such as:

```text
ghcr.io/goreecloud/memos@sha256:<validated-digest>
```

I will not use `latest`, `canary`, or another moving tag for production. `GOREECLOUD_NOTES_IMAGE` is therefore mandatory in the Compose file.

The GoreeCloud container workflow validates the fork image from source on pull requests. A tag beginning with `goreecloud-v` may publish the exact tagged build to `ghcr.io/goreecloud/memos`; I must still record and deploy its immutable digest.

## Host preparation

Before starting the stack, I will verify that I am on the intended Docker host and that the existing GoreeCloud reverse-proxy network is present:

```bash
docker network inspect proxy
```

I will create the persistent and deployment-configuration directories for the non-root container identity:

```bash
sudo install -d -o 10001 -g 10001 -m 0770 /srv/docker/appdata/notes
sudo install -d -o 10001 -g 10001 -m 0750 /srv/docker/secrets/notes
```

I will copy the example general policy into the protected deployment-configuration directory and preserve restrictive permissions:

```bash
sudo cp deploy/goreecloud/memos-instance-setting-general.json.example \
  /srv/docker/secrets/notes/memos-instance-setting-general.json
sudo chown 10001:10001 /srv/docker/secrets/notes/memos-instance-setting-general.json
sudo chmod 0640 /srv/docker/secrets/notes/memos-instance-setting-general.json
```

The supplied policy disables ordinary self-registration while keeping password authentication available. Memos allows the first account on an empty database to be created as the administrator before applying the ordinary registration restriction, so this policy can remain active from first startup.

## Environment file

I will create a local `.env` from `.env.example` and replace the image placeholder with the exact validated digest:

```bash
cp deploy/goreecloud/.env.example deploy/goreecloud/.env
```

The `.env` file must not contain reusable credentials. If future configuration introduces OAuth, SMTP, S3, AI, or other credentials, I will store those values only in the approved protected secrets location and mount them through Memos deployment-configuration files.

## Configuration validation

Before creating or recreating the service, I will validate the rendered Compose configuration:

```bash
docker compose \
  --env-file deploy/goreecloud/.env \
  -f deploy/goreecloud/compose.yaml \
  config
```

I will stop if Compose reports an error or if the rendered configuration unexpectedly publishes a host port.

## Start and health validation

I will start the service with:

```bash
docker compose \
  --env-file deploy/goreecloud/.env \
  -f deploy/goreecloud/compose.yaml \
  up -d
```

I will verify container state and the built-in Memos health endpoint:

```bash
docker inspect \
  --format '{{.State.Status}} {{if .State.Health}}{{.State.Health.Status}}{{end}}' \
  goreecloud-notes

docker exec goreecloud-notes \
  wget -q -O - http://127.0.0.1:5230/healthz
```

The health endpoint must return `Service ready.`.

## Private publication

I will publish GoreeCloud Notes only through the approved private-service path:

1. The Family Services VM is an approved NetBird peer.
2. `notes.goreecloud.com` resolves privately to the approved NetBird destination through AdGuard Home.
3. Caddy and `goreecloud-notes` share only the required `proxy` Docker network.
4. Caddy reverse-proxies the private hostname to `goreecloud-notes:5230`.
5. The backend does not publish port 5230 to the host or public internet.
6. Caddy and NetBird access controls restrict the private service to approved users and devices.
7. HTTPS, authentication, desktop behavior, and mobile/PWA behavior are validated before production approval.

The Notes repository does not own the production Caddyfile or NetBird policy. I will make those infrastructure changes in their authoritative GoreeCloud locations during the controlled deployment step.

## Persistent data and backup scope

The entire application data directory is persistent and must be protected:

```text
/srv/docker/appdata/notes/
```

For the initial SQLite deployment, the primary database is expected at:

```text
/srv/docker/appdata/notes/memos_prod.db
```

Attachments and other local application-managed data under the same directory are part of the recovery set.

I will not treat a copy of a live SQLite database as automatically consistent. Until I validate a SQLite-safe online backup method, the conservative backup procedure is:

1. Confirm the current GoreeCloud backup destination is available.
2. Gracefully stop `goreecloud-notes`.
3. Back up `/srv/docker/appdata/notes/` and the required deployment configuration.
4. Restart the service.
5. Confirm `/healthz` returns `Service ready.`.
6. Monitor the backup job and preserve its verification result.

## Restore validation

A backup is not approved solely because it completed. I will perform a restoration test in an isolated validation location before production approval.

The minimum restore test is:

1. Stop or isolate the validation instance.
2. Restore the complete Notes data directory to a clean location with ownership `10001:10001`.
3. Mount the restored directory into the same validated image version.
4. Start the validation instance without exposing it publicly.
5. Confirm database migration succeeds.
6. Sign in with a test account or validated restored account.
7. Confirm normal, pinned, colored, archived, and trashed notes survive.
8. Confirm labels and local attachments survive.
9. Confirm Markdown and JSON export still works.
10. Record the restore result before approving production use.

## Rollback

Application rollback requires both a known-good image and data compatibility.

Before an upgrade I will:

- Record the running image digest.
- Verify a current recoverable Notes backup.
- Review upstream migrations and GoreeCloud changes.
- Preserve the previous Compose/environment configuration.

If an upgrade changes the database schema, I will not point an older binary at the upgraded database unless that downgrade path has been explicitly validated. When necessary, rollback means restoring the pre-upgrade data backup together with the previous image digest.

## Production approval gate

I will not mark GoreeCloud Notes production-ready until all of the following are true:

- The GoreeCloud container workflow passes.
- A tagged GoreeCloud image is published and its immutable digest is recorded.
- Compose validation passes with no backend host port publication.
- The `proxy` network path to Caddy is validated.
- Private DNS and NetBird access are validated.
- HTTPS through `notes.goreecloud.com` is validated.
- Initial administrator creation and registration lockout are validated.
- Notes, titles, labels, checklists, attachments, colors, Archive, Trash, restore, and export are validated.
- A backup completes successfully.
- A restore test succeeds.
- Desktop and Android/PWA behavior are validated.
- PR #1 receives final review before merge.
