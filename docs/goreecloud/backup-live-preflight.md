# GoreeCloud Memos Backup Live Preflight

## Purpose

I use this read-only checklist on `goreecloud-vps-01` before changing Kopia source scope or claiming that the current GoreeCloud Memos production data is protected by the long-term application backup path.

This preflight makes **no configuration changes**. Passing it does not prove that a current usable snapshot exists and does not replace an isolated restore test.

## Current production baseline

- Production container: `goreecloud-memos`
- Production application data: `/srv/docker/appdata/memos`
- Production SQLite database: `/srv/docker/appdata/memos/memos_prod.db`
- Protected configuration path: `/srv/docker/secrets/memos`
- Production stack: `/srv/docker/stacks/memos/docker-compose.yml`
- Kopia Compose: `/srv/docker/stacks/kopia/compose.yaml`
- Shared backup-artifact path: `/srv/docker/backups`
- Production hostname: `https://memos.goreecloud.com`

The historical Notes-branded Memos runtime and `/srv/docker/appdata/notes` path were retired after the stable Memos cutover. I do not use those retired paths as the active Memos backup source.

## 1. Confirm Memos data and runtime mount

```bash
sudo test -d /srv/docker/appdata/memos && echo 'PASS: Memos appdata exists'
sudo test -f /srv/docker/appdata/memos/memos_prod.db && echo 'PASS: Memos SQLite exists'

sudo docker inspect goreecloud-memos \
  --format '{{range .Mounts}}{{println .Source "->" .Destination}}{{end}}'

sudo docker exec goreecloud-memos \
  test -f /var/opt/memos/memos_prod.db \
  && echo 'PASS: container sees Memos SQLite'
```

Expected persistent-data relationship:

```text
/srv/docker/appdata/memos -> /var/opt/memos
```

The configuration path should also remain read-only inside the container.

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

The existing GoreeCloud backup architecture historically protects `/srv/docker/backups`. A quiesced Memos recovery artifact stored there can provide an additional recovery layer, but the artifact still requires its own Kopia snapshot and isolated restore validation.

The retained `/srv/docker/backups/notes` material is historical cutover/retirement evidence. It is not a substitute for current recurring Memos backup coverage.

## 5. Confirm secrets remain outside Kopia filesystem snapshot scope

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
- the current production image reference and previous Stable image reference are recorded;
- the Memos stack and protected configuration can be reconstructed without exposing reusable credentials; and
- there is sufficient local space for any temporary application-consistent recovery artifact or isolated restore directory.

## 8. Stop conditions

I stop without changing backup scope if any of these conditions are unresolved:

- the Memos data path or SQLite file is missing;
- the running Memos container does not use the expected persistent bind mount;
- Kopia Compose does not validate cleanly;
- the intended Memos protection method is unclear;
- a live SQLite snapshot would be treated as application-consistent without validation;
- a secret-bearing path appears under Kopia `/source`;
- the off-VPS Kopia repository is unavailable or unhealthy; or
- rollback image, data, or reconstruction information is not available.

## What this preflight does not prove

This inspection does not prove:

- an application-consistent current Memos recovery point exists;
- a Kopia snapshot contains the intended Memos recovery set;
- the snapshot is verified and readable;
- attachments and all application state are recoverable;
- protected credentials required for reconstruction are available;
- an isolated restored GoreeCloud Memos instance starts and works; or
- the proposed `goreecloud-v0.1.1` production upgrade is accepted.

The production backup/restore gate remains governed by `docs/goreecloud/backup-restore-validation.md` and stays open until a current application-consistent Memos backup and isolated restore are actually completed and validated.
