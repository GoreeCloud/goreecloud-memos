# GoreeCloud Memos Backup and Restore Validation

## Status

GoreeCloud Memos v0.1.0 is an accepted production deployment at `https://memos.goreecloud.com`. Its original production cutover included a verified pre-cutover archive and an isolated restore test before the historical Notes-branded runtime was retired.

That cutover evidence proves the migration was recoverable at the time it was performed. It does **not** establish recurring long-term backup coverage for the current `/srv/docker/appdata/memos` production path.

The current long-term Memos backup/restore gate therefore remains open until I verify current Kopia source coverage, create an application-consistent Memos recovery point, verify the resulting snapshot, and complete a fresh isolated restore using the current production data.

## Recovery layers

I use complementary recovery layers for different failure scopes:

- OVHcloud provider backup — VPS-level rollback, restoration, or mounted provider recovery.
- Kopia — independently administered, encrypted, versioned file/application-data recovery stored off the VPS.
- GoreeCloud Memos application procedure — application-consistent SQLite/data capture and isolated application restore validation.
- Stable immutable container images — reproducible application runtime and rollback identity.

These layers are complementary rather than interchangeable.

## Required GoreeCloud Memos recovery set

### Persistent application data

The authoritative Memos application-data path is:

```text
/srv/docker/appdata/memos/
```

The SQLite database is expected at:

```text
/srv/docker/appdata/memos/memos_prod.db
```

Attachments, thumbnail/cache data required by the application, and other application-managed persistent content under the same Memos directory must be included in the recovery set.

### Deployment reconstruction

The service must also be reconstructable from source-controlled and protected deployment records, including:

- `deploy/goreecloud/compose.yaml` as the canonical repository deployment model;
- the live production stack at `/srv/docker/stacks/memos/docker-compose.yml`;
- `deploy/goreecloud/.env.example` plus the protected live environment file;
- `deploy/goreecloud/memos-instance-setting-general.json.example` plus the protected live instance setting;
- the exact immutable Stable image reference;
- the Docker `proxy` network relationship;
- the approved Caddy private HTTPS route;
- the approved AdGuard Home private DNS record;
- the approved NetBird access path; and
- the monitoring and backup relationships required for production acceptance.

The repository provides a reproducible model, but the live target must still be inspected before a recovery exercise.

### Sensitive configuration and credentials

The current GoreeCloud Kopia design intentionally excludes `/srv/docker/secrets` from ordinary filesystem snapshot source scope.

I do not add reusable secrets to the Memos repository or assume that Kopia contains them. Required sensitive values must remain recoverable through the approved GoreeCloud sensitive-information recovery process and protected configuration records.

## Current production and upgrade identities

Current accepted production baseline:

```text
ghcr.io/goreecloud/memos:goreecloud-v0.1.0@sha256:15f523fb1ac2b946339d9216d741b4368fbfd8631159487acc20b4133702ace1
```

Current validated Stable release available for controlled upgrade:

```text
ghcr.io/goreecloud/memos:goreecloud-v0.1.1@sha256:ec9fd1b02fb0ae545487c6b109b0254794898b4799fcea34e667dd50b4346075
```

I keep the production and target identities separate until the live v0.1.1 rollout passes backup, runtime, private publication, application, monitoring, and rollback acceptance.

## Current evidence and open question

The initial v0.1.0 cutover proved that the historical data could be archived, checksum-verified, restored into an isolated v0.1.0 instance with networking disabled, and then migrated to the new Memos production paths without losing the SQLite database or representative attachment data.

The current records do not establish that `/srv/docker/appdata/memos` was subsequently added to the live Kopia source set. I must inspect the current Kopia Compose source mounts before changing backup scope or claiming recurring Memos protection.

The retained `/srv/docker/backups/notes` cutover archive remains historical recovery evidence. It is not the current recurring Memos backup source.

## Application-consistent SQLite backup rule

I do not assume that copying a live SQLite database, WAL, and shared-memory files at arbitrary times produces a valid recovery point.

Until I separately validate a SQLite-safe online backup method for this deployment, the conservative Memos backup procedure is:

1. Confirm the approved Kopia repository is reachable and healthy.
2. Confirm the current Memos source path is included in the intended Kopia source set or prepare an approved quiesced recovery artifact under the protected backup path.
3. Record the currently running immutable Memos image reference and stack state.
4. Gracefully stop only `goreecloud-memos`.
5. Confirm the application stopped cleanly.
6. Create the application-consistent recovery point while SQLite is quiescent.
7. Restart only `goreecloud-memos` on the previously approved production image.
8. Wait for `/healthz` to return `Service ready.`.
9. Confirm the private HTTPS application is available again.
10. Run or complete the intended Kopia snapshot.
11. Verify the new snapshot and confirm the Memos recovery data is present.
12. Record the snapshot identity and validation result without recording repository credentials or private key material.

A stopped-application snapshot is a temporary conservative strategy. A future validated SQLite-native online backup process may replace it when it provides equal or stronger consistency and recoverability.

## Backup-scope change requirements

Before adding GoreeCloud Memos to Kopia, I inspect the live Kopia stack with `docs/goreecloud/backup-live-preflight.md`.

If the Memos application-data path is not already protected, the intended direct source is:

```text
/srv/docker/appdata/memos/
```

The active Kopia container must receive that source only through the existing approved read-only source-mount model.

After a Kopia Compose source change, I refresh the Kopia container as required so the live container mount set matches the edited configuration. Editing the Compose file alone is not evidence that an existing container has the new mount.

## Isolated restore test

I restore a selected known-good Memos recovery point into a clean isolated directory and validate it without overwriting or repointing production data.

The test must:

1. Select and record the source Kopia snapshot or approved application-consistent recovery artifact.
2. Restore the complete Memos application-data directory into a clean temporary validation location.
3. Verify restored files are present and readable.
4. Verify ownership and permissions are appropriate for runtime UID/GID `10001:10001` before application startup.
5. Start an isolated validation instance that uses the restored directory instead of `/srv/docker/appdata/memos`.
6. Use no host-published backend port and no production Caddy hostname.
7. Prefer `network_mode: none` when the validation goal does not require browser/API interaction; otherwise use an isolated non-production Docker network with no production publication path.
8. Start the restored application with the exact currently accepted production image or the explicitly approved target image being validated for upgrade.
9. Confirm database initialization/migration completes without corrupting the restored dataset.
10. Confirm `/healthz` returns `Service ready.`.
11. When an isolated authenticated path is intentionally provided, sign in with an approved restored or disposable validation identity and verify representative application state.
12. Stop and remove the isolated validation instance after the test without deleting the source backup snapshot.

## Restore acceptance checks

A successful file copy is not enough. The restored application must prove the information is usable in its intended context.

At minimum I verify:

- application startup and health;
- authentication when the isolated test exposes an authenticated validation path;
- normal and archived memo content;
- checklists and Markdown rendering;
- labels/tags and filtering;
- pin state;
- memo colors when present;
- Archive and restore behavior;
- Trash and recovery metadata when present;
- representative local attachment bytes and rendering;
- Markdown export;
- full-library JSON export;
- correct ownership and permissions;
- no unexpected backend host-port publication; and
- no unintended Caddy, DNS, or NetBird production route attached to the restore instance.

Where practical, I compare known validation content, counts, sizes, or checksums against the pre-restore record.

## v0.1.1 production-upgrade backup gate

Before replacing the current v0.1.0 production image with v0.1.1, I require:

- a current application-consistent v0.1.0 recovery point;
- verified readability or snapshot inspection;
- an isolated restore that succeeds against the protected production data;
- the exact v0.1.0 rollback image and pre-upgrade deployment configuration retained;
- the exact v0.1.1 immutable image recorded;
- the updated deployment preflight passing through the authoritative private-DNS path; and
- no unresolved data-integrity or restore discrepancy.

If v0.1.1 changes the production database before acceptance and rollback is required, I do not point v0.1.0 at a potentially upgraded database unless downgrade compatibility has been explicitly proven. The conservative rollback is the v0.1.0 image together with the pre-upgrade v0.1.0 recovery data and configuration.

## Backup gate acceptance rule

I may mark the current GoreeCloud Memos long-term backup/restore gate complete only after all of the following are true:

- the live Memos application-data path is confirmed in the approved recurring backup scope or an equally approved recurring application-consistent artifact path is established;
- an application-consistent Memos backup has completed successfully;
- the resulting Kopia snapshot has been inspected or verified;
- the required protected configuration and independent secrets-recovery path are available;
- an isolated restore has completed successfully;
- the restored Memos instance starts and passes representative application validation;
- restored ownership and permissions are correct; and
- the result is documented in the Memos and Kopia change records as applicable.

The backup/restore gate is an operational acceptance requirement. It does not change the fact that v0.1.0 is currently the accepted live production runtime and v0.1.1 is the validated Stable release awaiting a separate controlled host rollout.
