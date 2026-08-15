# GoreeCloud Memos Deployment

## Purpose

I use this package as the source-controlled deployment reference for **GoreeCloud Memos**, the lightweight GoreeCloud quick-note service derived from upstream Memos.

This package is production-oriented, but repository configuration is not proof of a production deployment. I will not treat GoreeCloud Memos as production-ready until the exact image, data path, private publication path, backup/restore process, and application behavior are validated on the intended host.

## Runtime model

I run one GoreeCloud Memos application container with SQLite storage.

- Container name: `goreecloud-memos`
- Compose service: `memos`
- Internal application port: `5230`
- Persistent application path in the container: `/var/opt/memos`
- Target GoreeCloud data path: `/srv/docker/appdata/memos`
- Target GoreeCloud configuration path: `/srv/docker/secrets/memos`
- Reverse-proxy Docker network: `proxy`
- Target private address: `https://memos.goreecloud.com`
- Runtime user and group: `10001:10001`

I do not publish port 5230 to the host. Caddy should reach the application directly through the external `proxy` Docker network at `goreecloud-memos:5230`.

I intentionally do **not** set `MEMOS_INSTANCE_URL` for the private GoreeCloud deployment. In the upstream baseline, an instance URL participates in anonymous/public behavior. Leaving it unset preserves the private-by-default model while same-origin requests continue through the reverse proxy.

## Historical Notes-branded deployment boundary

Earlier GoreeCloud validation used a Notes-branded Memos deployment and paths such as:

```text
/srv/docker/appdata/notes
/srv/docker/secrets/notes
notes.goreecloud.com
```

Those names are historical migration sources, not current GoreeCloud Memos targets. I will **not** rename, move, overwrite, or delete those live paths solely because this repository now uses Memos names.

Before any cutover I will:

1. identify the exact existing data and configuration paths;
2. create and verify a recoverable pre-cutover backup;
3. test restore into an isolated location;
4. decide whether to copy or migrate data into the Memos target paths;
5. validate ownership and permissions;
6. validate `memos.goreecloud.com`, Caddy, private DNS, NetBird access, TLS, monitoring, and health checks; and
7. retain rollback to the previous image, paths, and route until the Memos deployment is accepted.

Historical Notes-branded RC records remain engineering evidence. They are not evidence that the Memos hostname or target paths have already been deployed.

## Container image

Production must use an immutable GHCR image reference such as:

```text
ghcr.io/goreecloud/memos@sha256:<validated-digest>
```

I will not use `latest`, `canary`, or another moving tag for production. `GOREECLOUD_MEMOS_IMAGE` is mandatory in the Compose package.

The GoreeCloud container workflow builds and validates the fork image on pull requests. A `goreecloud-v*` tag may publish the exact tagged build to `ghcr.io/goreecloud/memos`; I must still record and deploy the immutable digest.

## Host preparation

Before starting the stack, I will verify the intended Docker host and the approved reverse-proxy network:

```bash
docker network inspect proxy
```

For a new Memos target layout I will prepare the persistent directories for the non-root container identity:

```bash
sudo install -d -o 10001 -g 10001 -m 0770 /srv/docker/appdata/memos
sudo install -d -o 10001 -g 10001 -m 0750 /srv/docker/secrets/memos
```

I will copy the instance policy into the protected configuration directory:

```bash
sudo cp deploy/goreecloud/memos-instance-setting-general.json.example \
  /srv/docker/secrets/memos/memos-instance-setting-general.json
sudo chown 10001:10001 /srv/docker/secrets/memos/memos-instance-setting-general.json
sudo chmod 0640 /srv/docker/secrets/memos/memos-instance-setting-general.json
```

The supplied policy disables ordinary self-registration while retaining password authentication. I will validate first-administrator bootstrap and registration lockout against the exact release image.

## Environment file

I will create a local `.env` from the example and replace the image placeholder with the exact validated digest:

```bash
cp deploy/goreecloud/.env.example deploy/goreecloud/.env
```

The `.env` file must not contain reusable credentials. Future OAuth, SMTP, S3, AI, or other secrets must remain in approved protected secret storage rather than ordinary source control.

## Configuration validation

Before creating or recreating the service, I will render the Compose configuration:

```bash
docker compose \
  --env-file deploy/goreecloud/.env \
  -f deploy/goreecloud/compose.yaml \
  config
```

I will stop if Compose reports an error, resolves an unexpected path, or publishes a backend host port.

## Start and health validation

I will start the service with:

```bash
docker compose \
  --env-file deploy/goreecloud/.env \
  -f deploy/goreecloud/compose.yaml \
  up -d
```

I will verify container state and the Memos health endpoint:

```bash
docker inspect \
  --format '{{.State.Status}} {{if .State.Health}}{{.State.Health.Status}}{{end}}' \
  goreecloud-memos

docker exec goreecloud-memos \
  wget -q -O - http://127.0.0.1:5230/healthz
```

The health endpoint must return `Service ready.`.

## Private publication

I will publish GoreeCloud Memos only through the approved private-service path:

1. the intended service host is an approved NetBird peer;
2. `memos.goreecloud.com` resolves privately to the approved destination through GoreeCloud DNS;
3. Caddy and `goreecloud-memos` share only the required `proxy` Docker network;
4. Caddy reverse-proxies the private hostname to `goreecloud-memos:5230`;
5. the backend does not publish port 5230 to the host or public internet;
6. approved network and application controls restrict access to intended users and devices; and
7. HTTPS, authentication, desktop behavior, and mobile/PWA behavior are validated before production acceptance.

This repository does not own the production Caddyfile, DNS inventory, NetBird policy, monitoring configuration, or backup schedule. I will make those changes only in their authoritative GoreeCloud locations during a controlled deployment.

## Persistent data and backup scope

The complete Memos application data directory is part of the recovery set:

```text
/srv/docker/appdata/memos/
```

The SQLite database is expected at:

```text
/srv/docker/appdata/memos/memos_prod.db
```

Attachments and other application-managed data under the same directory must be included. The protected configuration required to reconstruct the deployment is also part of recovery planning.

I will not assume that copying a live SQLite database is consistent. Until a validated online-backup procedure is documented for this deployment, the conservative application-consistent process is to stop the service cleanly, capture the complete persistence/configuration set, restart, verify health, and verify the backup result.

## Restore validation

A completed backup is not sufficient evidence of recoverability. I will restore into an isolated validation location and verify at minimum:

- the exact image starts against the restored data;
- database migration succeeds;
- authentication succeeds;
- normal, pinned, colored, archived, and trashed notes survive;
- labels, checklists, and local attachments survive;
- Markdown and JSON export works; and
- the restored instance remains isolated from production publication paths.

## Rollback

Before an upgrade or Notes-to-Memos cutover I will record the running image digest, preserve the previous Compose/environment configuration, verify a current recovery point, and review database migrations.

If an upgrade changes the database schema, I will not point an older binary at the upgraded database unless downgrade compatibility has been explicitly validated. When required, rollback means restoring the pre-change data together with the previous image and publication configuration.

## Production approval gate

I will not mark GoreeCloud Memos production-ready until all applicable gates pass:

- frontend lint, unit tests, and production build pass on the exact release head;
- the GoreeCloud container workflow passes on the exact release head;
- a release image is published and its immutable digest is recorded;
- Compose renders with Memos target names and no backend host-port publication;
- private DNS, Caddy, NetBird access, TLS, and monitoring are validated for `memos.goreecloud.com`;
- administrator bootstrap and registration lockout are validated;
- quick capture, titles, pinning, labels, checklists, attachments, colors, Archive, Trash, restore, and export are validated;
- backup and isolated restore succeed;
- desktop and Android/PWA behavior are accepted; and
- PR #1 receives final review before merge or stable tagging.
