# GoreeCloud Notes Backup and Restore Validation

## Status

The GoreeCloud backup platform is operational, but the **GoreeCloud Notes application-specific backup and isolated restore gate remains open**.

I will not treat the existence of a healthy GoreeCloud Kopia repository, an OVHcloud VPS restore point, or the pre-RC2 local rollback archive as proof that GoreeCloud Notes is recoverable.

Before `goreecloud-v0.1.0` is promoted, I must prove that the current Notes recovery set is protected and that I can restore it into an isolated application instance successfully.

## Recovery Layers

I use the existing GoreeCloud recovery layers for different failure scopes:

- OVHcloud provider backup — VPS-level recovery or mounted provider restore point.
- Kopia — independently administered, encrypted, versioned file/application-data recovery stored off the VPS.
- GoreeCloud Notes application procedure — application-consistent SQLite/data capture and isolated application restore validation.

These mechanisms are complementary rather than interchangeable.

## Required GoreeCloud Notes Recovery Set

The stable release requires recovery coverage for the following components.

### Persistent application data

The authoritative Notes application-data path is:

```text
/srv/docker/appdata/notes/
```

This directory includes the SQLite application database and local application-managed data such as attachments.

The initial SQLite database is expected at:

```text
/srv/docker/appdata/notes/memos_prod.db
```

This data must be represented in the approved application-level backup path before stable promotion.

### Deployment reconstruction

The service must also be reconstructable from the GoreeCloud repository and the controlled deployment configuration, including:

- `deploy/goreecloud/compose.yaml`
- `deploy/goreecloud/.env.example`
- `deploy/goreecloud/memos-instance-setting-general.json.example`
- the recorded immutable GoreeCloud Notes image digest or a reproducible validated image build
- the Docker `proxy` network relationship
- the approved Caddy private HTTPS route
- the approved AdGuard Home private DNS record
- the approved NetBird access path

The repository provides the reproducible deployment definition; the live deployment must still be inspected before a restore test.

### Sensitive configuration and credentials

The current GoreeCloud Kopia design intentionally excludes `/srv/docker/secrets` from its filesystem snapshot source.

I will therefore not add reusable secrets to the Notes repository or assume that Kopia contains them.

Required sensitive values must be recoverable through the approved GoreeCloud sensitive-information recovery process, such as Vaultwarden or another authoritative protected record.

## Current Evidence and Open Question

Kopia is already deployed on `goreecloud-vps-01` with an encrypted SFTP repository stored off the VPS on `personal-laptop-ideapad3-01`, automated backup attempts, monitoring, repository verification, and previously tested restoration.

Flatnotes was later removed from the active Kopia source set when that service was retired.

The current records available to this project do not establish that `/srv/docker/appdata/notes` has subsequently been added to the live Kopia source set. I must inspect the current Kopia Compose source mounts before changing backup scope or claiming Notes protection.

## Application-Consistent SQLite Backup Rule

I will not assume that copying a live SQLite database, WAL, and shared-memory files at arbitrary times produces a valid recovery point.

Until I separately validate a SQLite-safe online-backup method for this deployment, the conservative GoreeCloud Notes backup procedure is:

1. Confirm the approved Kopia repository is reachable and healthy.
2. Confirm the current Notes source path is included in the intended Kopia source set.
3. Gracefully stop only `goreecloud-notes`.
4. Confirm the application has stopped cleanly.
5. Create the Notes application-data recovery snapshot while SQLite is quiescent.
6. Restart only `goreecloud-notes`.
7. Wait for `/healthz` to return `Service ready.`.
8. Confirm the private HTTPS application is available again.
9. Verify the new Kopia snapshot and confirm the Notes data is present.
10. Record the snapshot identity and validation result without recording repository credentials or private key material.

A stopped-application snapshot is a temporary conservative strategy. A future validated SQLite-native online backup process may replace it when it provides equal or stronger consistency and recoverability.

## Backup-Scope Change Requirements

Before adding GoreeCloud Notes to Kopia, I will inspect the live Kopia stack first.

If the Notes application-data path is not already protected, the intended source is:

```text
/srv/docker/appdata/notes/
```

The active Kopia container must receive that source only through the existing approved read-only source-mount model.

After a Kopia Compose source change, I must recreate or otherwise refresh the Kopia container as required so the live container mount set matches the edited configuration. Editing the Compose file alone is not evidence that an already-created container has the new mount.

I will verify the live mount before the first Notes snapshot.

## Isolated Restore Test

The stable-release restore test must not overwrite or repoint the production/validation Notes data in place.

I will restore a selected known-good Notes snapshot into a clean isolated directory and validate it with the same GoreeCloud Notes image version or another explicitly approved compatible image.

The test must:

1. Select and record the source Kopia snapshot.
2. Restore the complete Notes application-data directory into a clean temporary validation location.
3. Verify restored files are present and readable.
4. Verify ownership and permissions are appropriate for runtime UID/GID `10001:10001` before application startup.
5. Create an isolated Compose validation instance that uses the restored directory instead of `/srv/docker/appdata/notes`.
6. Keep the restored instance off the public internet and avoid conflicting with the live `goreecloud-notes` container name, network identity, and Caddy backend.
7. Start the restored application and confirm database initialization/migration completes without corrupting the restored dataset.
8. Confirm `/healthz` returns `Service ready.`.
9. Sign in through the isolated validation path using an approved restored or disposable test account as appropriate.
10. Verify representative notes and application state.
11. Stop and remove the isolated validation instance after the test without deleting the source backup snapshot.

## Restore Acceptance Checks

A successful file copy is not enough. The restored application must prove the information is usable in its intended context.

At minimum I will verify:

- application startup and health;
- authentication;
- normal note content;
- title extraction from the leading H1;
- checklist state;
- labels;
- pin state;
- persistent note color;
- Archive state;
- Trash/restore metadata;
- representative local attachment access;
- Markdown export;
- full-library JSON export;
- correct ownership and permissions;
- no unexpected backend host-port publication.

Where practical, I will compare known validation note content or checksums against the pre-restore record.

## Backup Gate Acceptance Rule

I may mark the GoreeCloud Notes backup/restore gate complete only after all of the following are true:

- the live Notes application-data path is confirmed in the approved backup scope;
- an application-consistent Notes backup has completed successfully;
- the resulting snapshot has been inspected or verified;
- the required recovery credentials and independent secrets-recovery path are available;
- an isolated restore has completed successfully;
- the restored GoreeCloud Notes application starts and passes representative application validation;
- restored ownership and permissions are correct;
- the test is documented in the GoreeCloud Notes and Kopia change records as applicable.

Until then, PR #1 remains draft and `goreecloud-v0.1.0` remains blocked.
