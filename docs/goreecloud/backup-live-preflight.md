# GoreeCloud Notes Backup Live Preflight

## Purpose

Use this read-only checklist on `goreecloud-vps-01` before changing Kopia source scope or claiming GoreeCloud Notes is protected by the long-term backup path.

This preflight makes **no configuration changes**. Passing it is not a backup/restore acceptance result.

## Known paths

- Notes application data: `/srv/docker/appdata/notes`
- Notes SQLite database: `/srv/docker/appdata/notes/memos_prod.db`
- Notes container: `goreecloud-notes`
- Kopia Compose: `/srv/docker/stacks/kopia/compose.yaml`
- Shared backup-artifact path: `/srv/docker/backups`

## 1. Confirm Notes data and runtime mount

```bash
sudo test -d /srv/docker/appdata/notes && echo 'PASS: Notes appdata exists'
sudo test -f /srv/docker/appdata/notes/memos_prod.db && echo 'PASS: Notes SQLite exists'

sudo docker inspect goreecloud-notes \
  --format '{{range .Mounts}}{{println .Source "->" .Destination}}{{end}}'

sudo docker exec goreecloud-notes \
  test -f /var/opt/memos/memos_prod.db \
  && echo 'PASS: container sees Notes SQLite'
```

Expected persistent-data relationship:

```text
/srv/docker/appdata/notes -> /var/opt/memos
```

## 2. Validate the authoritative Kopia Compose without expanding secrets

```bash
cd /srv/docker/stacks/kopia
sudo docker compose -f compose.yaml config --no-env-resolution --quiet
```

Do not use a fully environment-expanded Compose rendering for this inspection because the Kopia deployment has protected environment values.

## 3. Inspect current Kopia source mounts

```bash
sudo grep -nE '^[[:space:]]*-[[:space:]]+/srv/docker/.+:/source/.+:ro$' \
  /srv/docker/stacks/kopia/compose.yaml
```

Then explicitly check the Notes path:

```bash
sudo grep -nF '/srv/docker/appdata/notes:' \
  /srv/docker/stacks/kopia/compose.yaml || true
```

Interpretation:

- A matching Notes line proves the Compose definition includes a direct Notes source mount.
- No matching line means the current Compose definition does not directly snapshot `/srv/docker/appdata/notes`.
- A Compose line by itself does not prove the running Kopia container has refreshed mounts or that a usable snapshot exists.

## 4. Confirm the shared backups path remains protected

```bash
sudo grep -nF '/srv/docker/backups:/source/backups:ro' \
  /srv/docker/stacks/kopia/compose.yaml || true
```

The existing GoreeCloud Kopia architecture historically protects `/srv/docker/backups`. If Notes uses a quiesced application-consistent recovery artifact there, that artifact still requires its own snapshot and restore validation before the Notes gate may pass.

## 5. Confirm secrets are not in Kopia snapshot source scope

```bash
if sudo grep -nE '/srv/docker/secrets[^:]*:/source' \
  /srv/docker/stacks/kopia/compose.yaml; then
  echo 'FAIL: a secrets path appears under Kopia /source scope'
else
  echo 'PASS: no /srv/docker/secrets path is mounted under Kopia /source scope'
fi
```

`/srv/docker/secrets` is intentionally outside the Kopia filesystem source model. Do not add it merely to make the Notes restore set appear complete; reusable credentials remain in the approved sensitive-information recovery path.

## 6. If a direct Notes mount is already configured, inspect the live Kopia mount set

Kopia is normally an on-demand Compose CLI container, so first inspect whether a current container exists:

```bash
sudo docker ps -a --filter name='^/kopia$' \
  --format 'table {{.Names}}\t{{.Status}}'
```

If a `kopia` container exists, inspect mounts without printing environment values:

```bash
sudo docker inspect kopia \
  --format '{{range .Mounts}}{{println .Source "->" .Destination}}{{end}}'
```

If the Compose file was changed but an existing container still carries old mounts, refresh only the Kopia service using the approved Kopia procedure before treating the new source scope as active.

## 7. Stop conditions

Stop without changing backup scope if any of these are unresolved:

- the Notes data path or SQLite file is missing;
- the running Notes container does not use the expected persistent bind mount;
- Kopia Compose does not validate cleanly;
- the intended Notes protection method is unclear;
- adding a live SQLite mount would lead to an unvalidated consistency claim;
- a secret-bearing path appears under Kopia `/source`;
- the off-VPS Kopia repository is unavailable or unhealthy.

## What this preflight does not prove

This inspection does not prove:

- an application-consistent Notes recovery point exists;
- a Kopia snapshot contains the intended Notes recovery set;
- the snapshot is verified;
- attachments and all application state are recoverable;
- credentials required for reconstruction are available;
- an isolated restored GoreeCloud Notes instance starts and works.

The stable backup/restore gate remains governed by `docs/goreecloud/backup-restore-validation.md` and stays open until the application-consistent backup and isolated restore are actually completed and validated.
