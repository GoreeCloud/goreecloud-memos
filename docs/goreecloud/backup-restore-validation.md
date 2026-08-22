# GoreeCloud Memos Backup and Restore Validation

## Status

GoreeCloud Memos v0.1.2 is the accepted production deployment at `https://memos.goreecloud.com`.

The published v0.1.3 Stable release is approved as the next production-upgrade target, but release publication does not prove that the live v0.1.2 data has a fresh application-consistent rollback point or that the v0.1.3 runtime has passed target-host acceptance.

The v0.1.3 production backup/restore gate remains open until I create and verify a fresh pre-upgrade v0.1.2 recovery point, complete a fresh isolated restore, retain the exact v0.1.2 runtime/configuration rollback state, and then deploy and validate v0.1.3 separately.

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

Attachments and other application-managed persistent content under the same Memos directory must be included in the recovery set.

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
ghcr.io/goreecloud/memos:goreecloud-v0.1.2@sha256:98cea4ed48e6c8dea2c70a7c88b5b246ae8569a69ad5fe749127a91720ef00be
```

Current accepted production source:

```text
ff3d5c6740b83bc55486ff51c5f6ec65436d91f9
```

Published Stable release available for controlled upgrade:

```text
ghcr.io/goreecloud/memos:goreecloud-v0.1.3@sha256:13b45db6b0977d5b4c89afba2a1d5d0eacf9bc1ad884f86c0c719958de1b84f4
```

Published v0.1.3 source and tag:

```text
70de16fb8dc08b1aadc42190566d5981f9ab2216
goreecloud-v0.1.3
```

I keep the production and target identities separate until the live v0.1.3 rollout passes backup, runtime, private publication, application, monitoring, client, and rollback acceptance.

## Current evidence and upgrade requirement

Earlier production acceptance proved GoreeCloud Memos recovery and rollback at the time of the previous cutovers. That evidence remains valuable history but does not replace a fresh pre-v0.1.3 recovery point for the current v0.1.2 data.

Before v0.1.3 deployment I must confirm the current Kopia/source coverage and create a new application-consistent v0.1.2 rollback point that reflects the state immediately before the new maintenance window.

Historical Notes-branded cutover archives remain historical recovery evidence. They are not the current v0.1.2 rollback source.

## Application-consistent SQLite backup rule

I do not assume that copying a live SQLite database, WAL, and shared-memory files at arbitrary times produces a valid recovery point.

Until I separately validate a SQLite-safe online backup method for this deployment, the conservative Memos backup procedure is:

1. Confirm the approved Kopia repository is reachable and healthy.
2. Confirm the current Memos source path is included in the intended Kopia source set or prepare an approved quiesced recovery artifact under the protected backup path.
3. Record the currently running immutable v0.1.2 image reference and stack state.
4. Gracefully stop only `goreecloud-memos`.
5. Confirm the application stopped cleanly.
6. Create the application-consistent v0.1.2 recovery point while SQLite is quiescent.
7. Generate and verify a SHA-256 checksum for the exact recovery artifact when an archive is used.
8. Restart only `goreecloud-memos` on the unchanged v0.1.2 production image.
9. Wait for Docker health and `/healthz` to return `Service ready.`.
10. Confirm the private HTTPS application is available again.
11. Run or complete the intended Kopia snapshot.
12. Verify the new snapshot or protected recovery artifact and confirm the Memos recovery data is present.
13. Record the recovery identity and validation result without recording repository credentials or private key material.

A stopped-application snapshot is a temporary conservative strategy. A future validated SQLite-native online backup process may replace it when it provides equal or stronger consistency and recoverability.

## Backup-scope change requirements

Before relying on GoreeCloud Memos backup coverage, I inspect the live Kopia stack with `docs/goreecloud/backup-live-preflight.md`.

If the Memos application-data path is not already protected, the intended direct source is:

```text
/srv/docker/appdata/memos/
```

The active Kopia container must receive that source only through the existing approved read-only source-mount model.

After a Kopia Compose source change, I refresh only Kopia as required so the live container mount set matches the edited configuration. Editing the Compose file alone is not evidence that an existing container has the new mount.

## Isolated restore test

I restore the fresh pre-v0.1.3 v0.1.2 recovery point into a clean isolated directory and validate it without overwriting or repointing production data.

The test must:

1. Select and record the source Kopia snapshot or approved application-consistent v0.1.2 recovery artifact.
2. Restore the complete Memos application-data directory into a clean temporary validation location.
3. Verify restored files are present and readable.
4. Verify ownership and permissions are appropriate for runtime UID/GID `10001:10001` before application startup.
5. Start an isolated validation instance that uses the restored directory instead of `/srv/docker/appdata/memos`.
6. Use no host-published backend port and no production Caddy hostname.
7. Prefer `network_mode: none` when the validation goal does not require browser/API interaction; otherwise use an isolated non-production Docker network with no production publication path.
8. Start the restored application with the exact v0.1.2 production image first, proving the rollback data is usable by the rollback runtime.
9. Confirm database initialization completes without corrupting the restored dataset.
10. Confirm `/healthz` returns `Service ready.`.
11. When an isolated authenticated path is intentionally provided, sign in with an approved restored or disposable validation identity and verify representative application state.
12. Optionally start a second disposable isolated instance from a copy of the restored data using the exact v0.1.3 target image to rehearse forward upgrade behavior without changing the primary rollback restore.
13. Stop and remove isolated validation instances after the test without deleting the source backup snapshot or recovery artifact.

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

## v0.1.3 production-upgrade backup gate

Before replacing the current v0.1.2 production image with v0.1.3, I require:

- a fresh application-consistent v0.1.2 recovery point;
- checksum/readability or snapshot verification;
- an isolated v0.1.2 rollback restore that starts and passes representative validation;
- the exact v0.1.2 rollback image and pre-upgrade deployment configuration retained;
- the exact v0.1.3 immutable image recorded;
- the private-DNS-aware deployment preflight prepared for the v0.1.3 digest;
- the existing Uptime Kuma Memos monitor and Caddy source allowance identified for revalidation; and
- no unresolved data-integrity or restore discrepancy.

If v0.1.3 changes the production database before acceptance and rollback is required, I do not point v0.1.2 at a potentially upgraded database unless downgrade compatibility has been explicitly proven. The conservative rollback is the v0.1.2 image together with the fresh pre-upgrade v0.1.2 recovery data and configuration.

## Backup gate acceptance rule

I may mark the v0.1.3 production backup/restore gate complete only after all of the following are true:

- the live Memos application-data path is confirmed in the approved recurring backup scope or an equally approved recurring application-consistent artifact path is established;
- a fresh application-consistent v0.1.2 pre-upgrade backup has completed successfully;
- the resulting Kopia snapshot or recovery artifact has been inspected or verified;
- the required protected configuration and independent secrets-recovery path are available;
- an isolated v0.1.2 rollback restore has completed successfully;
- the restored Memos instance starts and passes representative application validation;
- restored ownership and permissions are correct; and
- the result is documented in the Memos and Kopia change records as applicable.

This backup/restore gate is an operational acceptance requirement. Until the later deployment and post-deployment gates pass, v0.1.2 remains the accepted live production runtime and v0.1.3 remains the published Stable release awaiting controlled host rollout.
