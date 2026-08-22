# GoreeCloud Memos Backup Live Preflight

## Purpose

I use this read-only checklist on `goreecloud-vps-01` before changing the GoreeCloud Memos production runtime or claiming that the current production data is protected by a usable rollback/recovery path.

This preflight makes **no configuration changes**. Passing it does not prove that a current usable snapshot exists and does not replace an isolated restore test.

## Current production baseline

- Accepted production version: `goreecloud-v0.1.2`
- Accepted production image: `ghcr.io/goreecloud/memos:goreecloud-v0.1.2@sha256:98cea4ed48e6c8dea2c70a7c88b5b246ae8569a69ad5fe749127a91720ef00be`
- Production container: `goreecloud-memos`
- Production application data: `/srv/docker/appdata/memos`
- Production SQLite database: `/srv/docker/appdata/memos/memos_prod.db`
- Protected configuration path: `/srv/docker/secrets/memos`
- Production stack: `/srv/docker/stacks/memos/docker-compose.yml`
- Kopia Compose: `/srv/docker/stacks/kopia/compose.yaml`
- Shared backup-artifact path: `/srv/docker/backups`
- Production hostname: `https://memos.goreecloud.com`
- Approved upgrade target: `ghcr.io/goreecloud/memos:goreecloud-v0.1.3@sha256:13b45db6b0977d5b4c89afba2a1d5d0eacf9bc1ad884f86c0c719958de1b84f4`

The historical Notes-branded Memos runtime and `/srv/docker/appdata/notes` path were retired after the stable Memos cutover. I do not use those retired paths as the active Memos backup source.

## 1. Confirm Memos data and runtime mount

```bash
sudo test -d /srv/docker/appdata/memos && echo 'PASS: Memos appdata exists'
sudo test -f /srv/docker/appdata/memos/memos_prod.db && echo 'PASS: Memos SQLite exists'

sudo docker inspect goreecloud-memos \
  --format '{{.Config.Image}} {{.State.Status}} {{if .State.Health}}{{.State.Health.Status}}{{end}}'

sudo docker inspect goreecloud-memos \
  --format '{{range .Mounts}}{{println .Source "->" .Destination}}{{end}}'

sudo docker exec goreecloud-memos \
  test -f /var/opt/memos/memos_prod.db \
  && echo 'PASS: container sees Memos SQLite'
```

Expected runtime image before the v0.1.3 cutover:

```text
ghcr.io/goreecloud/memos:goreecloud-v0.1.2@sha256:98cea4ed48e6c8dea2c70a7c88b5b246ae8569a69ad5fe749127a91720ef00be
```

Expected persistent-data relationship:

```text
/srv/docker/appdata/memos -> /var/opt/memos
```

The configuration path must remain read-only inside the container and protected outside ordinary source control.

## 2. Validate the authoritative Kopia Compose without expanding secrets

```bash
cd /srv/docker/stacks/kopia
sudo docker compose -f compose.yaml config --no-env-resolution --quiet
```

I do not use a fully environment-expanded rendering for this inspection because the Kopia deployment contains protected environment values.

## 3. Inspect current Kopia source mounts

```bash
sudo grep -nE '^[[:space:]]*-[[:space:]]+/srv/docker/.+:/source/.+:ro$' \
  /srv/docker/stacks/kopia/compose.yaml
```

Then explicitly check the active Memos path:

```bash
sudo grep -nF '/srv/docker/appdata/memos:' \
  /srv/docker/stacks/kopia/compose.yaml || true
```

Interpretation:

- A matching Memos line proves the Compose definition includes a direct read-only Memos source mount.
- No matching line means the current Compose definition does not directly snapshot `/srv/docker/appdata/memos`.
- A Compose line alone does not prove that a running Kopia container has refreshed mounts, that a snapshot completed, or that the snapshot can be restored.

## 4. Confirm the shared backups path remains protected

```bash
sudo grep -nF '/srv/docker/backups:/source/backups:ro' \
  /srv/docker/stacks/kopia/compose.yaml || true
```

The GoreeCloud backup architecture protects `/srv/docker/backups`. A fresh quiesced v0.1.2 Memos recovery artifact stored there can provide the pre-v0.1.3 application-consistent rollback point, but the artifact still requires checksum validation, Kopia snapshot coverage where applicable, and isolated restore verification.

Historical `/srv/docker/backups/notes` material is migration history, not the current rollback source.

## 5. Confirm secrets remain outside ordinary Kopia filesystem snapshot scope

```bash
if sudo grep -nE '/srv/docker/secrets[^:]*:/source' \
  /srv/docker/stacks/kopia/compose.yaml; then
  echo 'FAIL: a secrets path appears under Kopia /source scope'
else
  echo 'PASS: no /srv/docker/secrets path is mounted under Kopia /source scope'
fi
```

`/srv/docker/secrets` is intentionally outside the ordinary Kopia filesystem source model. I do not add it merely to make the Memos restore set appear complete. Reusable credentials and protected configuration remain recoverable through the approved sensitive-information and configuration-recovery process.

## 6. If a direct Memos mount is configured, inspect the live Kopia mount set

Kopia is normally an on-demand Compose CLI container. I first inspect whether a current container exists:

```bash
sudo docker ps -a --filter name='^/kopia$' \
  --format 'table {{.Names}}\t{{.Status}}'
```

If a `kopia` container exists, I inspect mounts without printing environment values:

```bash
sudo docker inspect kopia \
  --format '{{range .Mounts}}{{println .Source "->" .Destination}}{{end}}'
```

If the Compose file was changed but an existing container still carries old mounts, I refresh only the Kopia service using the approved Kopia procedure before treating the new source scope as active.

## 7. Verify repository and independent recovery availability

Before changing the Memos runtime or relying on a new application backup, I confirm:

- the off-VPS Kopia repository is reachable and healthy;
- the current OVHcloud provider restore point remains available as a separate VPS-level recovery layer;
- the exact v0.1.2 production image and v0.1.3 target image are recorded;
- the current Memos stack and protected configuration can be reconstructed without exposing reusable credentials;
- sufficient local space exists for the new quiesced v0.1.2 recovery artifact and isolated restore directory; and
- the v0.1.2 application is healthy before any maintenance stop begins.

## 8. Pre-v0.1.3 application-consistent recovery point

Unless an equally strong validated online SQLite method is in use, I create the fresh rollback point conservatively:

1. Record the current exact v0.1.2 runtime image and stack state.
2. Gracefully stop only `goreecloud-memos`.
3. Confirm the container stopped cleanly.
4. Create a timestamped archive of `/srv/docker/appdata/memos` under the approved Memos backup path.
5. Generate and verify a SHA-256 checksum for that exact archive.
6. Restart only `goreecloud-memos` on the unchanged v0.1.2 image.
7. Wait for Docker health to return `healthy` and `/healthz` to return `Service ready.`.
8. Ensure the new recovery artifact is captured by the approved backup path.
9. Complete a fresh isolated restore using `docs/goreecloud/backup-restore-validation.md`.
10. Record only non-secret recovery identifiers and verification results.

I do not proceed to v0.1.3 until the isolated restore succeeds.

## 9. Stop conditions

I stop without changing production if any of these conditions are unresolved:

- the Memos data path or SQLite file is missing;
- the running Memos container is not the expected v0.1.2 immutable image;
- the running Memos container does not use the expected persistent bind mount;
- Kopia Compose does not validate cleanly;
- the intended Memos protection method is unclear;
- a live SQLite copy would be treated as application-consistent without validation;
- a secret-bearing path appears under Kopia `/source` unexpectedly;
- the off-VPS Kopia repository is unavailable or unhealthy;
- the fresh v0.1.2 recovery artifact cannot be checksum-verified;
- the isolated restore fails; or
- rollback image, data, configuration, or reconstruction information is unavailable.

## What this preflight does not prove

This inspection does not prove:

- a new application-consistent v0.1.2 recovery point has been created;
- a Kopia snapshot contains the intended Memos recovery set;
- the snapshot is verified and readable;
- attachments and all application state are recoverable;
- protected credentials required for reconstruction are available;
- an isolated restored GoreeCloud Memos instance starts and works; or
- the proposed `goreecloud-v0.1.3` production upgrade is accepted.

The production backup/restore gate remains governed by `docs/goreecloud/backup-restore-validation.md` and stays open until a fresh pre-v0.1.3 recovery point and isolated restore are actually completed and validated.
