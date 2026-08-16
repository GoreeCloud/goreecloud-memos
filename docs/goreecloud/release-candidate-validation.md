# GoreeCloud Memos Release and Validation Record

This record preserves the release-candidate evidence created while this repository was still used for the Notes-branded Memos implementation, records the established GoreeCloud Memos Stable baseline, and defines how later source changes must be evaluated.

Historical RC1–RC3 artifacts remain valid engineering, deployment, persistence, portability, Glaze UI, and migration evidence. They are not themselves Stable GoreeCloud Memos releases.

## Historical Notes-Branded RC1

Release candidate `goreecloud-v0.1.0-rc.1` validated the GoreeCloud private deployment architecture, SQLite persistence, non-root container execution, Docker `proxy` networking, private DNS, Caddy HTTPS routing, `/healthz`, and initial memo creation.

RC1 did **not** pass user-interface acceptance. The interface remained too close to upstream Memos and did not meet the intended GoreeCloud product experience. RC1 remains a validation artifact.

## Historical Notes-Branded RC2

Release candidate `goreecloud-v0.1.0-rc.2` delivered the first substantial GoreeCloud workspace redesign, responsive card wall, first-class Labels workflow, and preserved application state through an in-place private validation upgrade.

RC2 passed core workspace and Labels functional acceptance, but visual/product acceptance remained partial because terminology, Settings presentation, label display, search behavior, composer behavior, and card actions still needed product polish.

## Historical Notes-Branded RC3

Release candidate `goreecloud-v0.1.0-rc.3` was published on August 12, 2026 at 6:09 PM CDT from validated commit `eaa7bcd71937aa2025c91d0d4f838f901448a01e`.

Published immutable image:

`ghcr.io/goreecloud/memos@sha256:73613691c167b1ec261685168404b781edf844be04ed27e7bb59ebc78cdf0347`

Tag-triggered GoreeCloud Container run `31649812690` passed and published the release for `linux/amd64` and `linux/arm64`.

RC3 implemented the primary product-polish corrections from RC2, including clean label presentation, direct desktop search, collapsed quick capture, direct card actions, GoreeCloud Settings terminology, and stronger Glaze UI treatment.

## Historical RC3 Desktop Acceptance

RC3 desktop visual/product acceptance passed on the private historical Notes-branded Memos validation instance.

Desktop acceptance covered the workspace hierarchy, Glaze UI direction, composer behavior, direct search, responsive cards/actions, Labels, Notes/Archive/Trash workflows, Settings terminology, removal of ordinary user-facing upstream Memos branding from the intended GoreeCloud workflow, and reviewed light/dark appearance behavior.

That desktop acceptance did not by itself establish Android/PWA acceptance or the later GoreeCloud Memos Stable release.

## Post-RC Stabilization Baseline

After the published RC3 image, the development line received additional stable-target Glaze UI, terminology, mobile/PWA readiness, automated persistence validation, label-data-integrity hardening, state-view integrity hardening, export-portability hardening, and release-lineage hardening.

The stabilization work includes:

- shared Glaze surface tokens, selective translucency, softened depth, rounded geometry, focus feedback, and reduced-motion behavior;
- additional GoreeCloud product terminology cleanup;
- mobile safe-area handling for the header, slide-out navigation, and bottom navigation/gesture area;
- browser zoom support and `viewport-fit=cover`;
- one app-controlled mobile browser/PWA theme color synchronized by the existing theme loader;
- explicit installed-app manifest identity;
- larger mobile header, slide-out navigation, search, memo-card action, overflow-menu, and restore touch targets;
- a focusable, accessible pinned-memo unpin control;
- fine-pointer-only hover elevation so touch interaction does not retain desktop hover effects;
- small-screen Glaze background behavior tuned for mobile rendering;
- automated regression coverage for the PWA shell and high-frequency mobile memo actions;
- isolated authenticated API smokes that prove private-memo persistence, attachment binary persistence through the canonical authenticated file route, exact Markdown/checklist content, source-derived label recognition, GoreeCloud color metadata, actual pinned state, actual upstream Archive state, and the GoreeCloud Archive-to-Trash mutation state through actual container restarts against the persistent data bind mount;
- Markdown-aware label mutation that follows the same context-sensitive tag grammar used by the renderer;
- Archive/Trash state-view guards that keep hidden GoreeCloud state markers out of rendered top-level content and require restore before generic double-click editing;
- full-library JSON export that preserves the documented attachment metadata model, including normalized photo/video and motion-media metadata, while continuing to exclude attachment binary payloads intentionally; and
- release-lineage hardening so historical or unpublished tags are not incorrectly treated as Stable-release predecessors.

Source-level Android/PWA review found and corrected conflicting media-scoped theme-color tags, undersized mobile navigation controls, undersized direct memo-card actions, a 16 px overflow-menu trigger, and a pinned-memo interaction attached to a non-focusable element.

The stabilized source baseline was merged into `main` at commit `181317ee0d8c32f5e0c2e625b7b293afdfc659c5` (`Fix stable release predecessor detection and unpublished-tag handling`).

## Label and Markdown Integrity

The earlier GoreeCloud label helper identified labels with raw token-oriented regular expressions. That could treat `#label` text inside opaque Markdown contexts as a managed label during lookup or mutation.

The stabilized implementation routes label recognition through the same GFM and `remarkMemoSyntax` transformation used by the GoreeCloud renderer. Label normalization also requires the complete user-facing value to satisfy the canonical tag scanner.

The corrected behavior excludes tag-looking text in contexts such as:

- inline code;
- fenced code;
- Markdown link destinations;
- image destinations;
- autolinks; and
- HTML attributes/content that the renderer treats as opaque to tag extraction.

Removal changes only source candidates proven to contribute a recognized Markdown tag. Addition verifies that the new tag is actually recognized and handles unclosed opaque Markdown without rewriting unrelated user text.

Regression coverage includes opaque-context examples, invalid complete-label grammar, unclosed fenced code, preservation of literal copies during removal, and spacing/data-integrity cases.

## Archive and Trash State-View Integrity

GoreeCloud memo color and recoverable Trash state are intentionally stored as hidden Markdown metadata rather than new database fields.

Top-level display content removes the GoreeCloud color and Trash implementation markers before Markdown rendering. Stored memo content is not rewritten by this presentation behavior. This protects the user-facing display when malformed or unclosed Markdown would otherwise make a trailing implementation marker visible as ordinary source content.

Archive and Trash also share a consistent editing boundary. Their explicit action menus withhold ordinary Edit behavior; the generic double-click path follows the same model. Archived and trashed top-level memos must be restored before that generic edit path can modify them.

`web/tests/goreecloud-trash-integrity.test.ts` guards both the hidden-marker display rule and the restore-before-edit state boundary.

## Preserved Automated Validation Evidence

The latest separately recorded application-code head before Stable promotion was:

`5b3f266d443c98ebca08035ebf5c018f6c5e869d`

Validation on that application-code head:

- Frontend Tests run `31787838500` — passed, including lint, the full frontend unit suite with attachment-export metadata regressions, and the production frontend build.
- GoreeCloud Container run `31787838506` — passed.

That application head extended the GoreeCloud JSON portability export so attachment records retain the normalized metadata already carried by the API, including motion-media family/role/group/presentation data, display dimensions, photo capture/location/camera/exposure fields, and video duration. Attachment binary content remains intentionally excluded from the JSON export.

The later validation-harness head was:

`5aa3fdd05cbc6c110f19009829ec728783106953`

That head changed the isolated persistence smoke rather than application runtime source. Validation on that exact harness head:

- Frontend Tests run `31789535244` — passed.
- GoreeCloud Container run `31789535238` — passed the release-asset build, validation-image build, Compose rendering, isolated startup/health, both authenticated restart-persistence smokes, logs, and cleanup.

The first smoke in `scripts/goreecloud-notes-ci-smoke.sh` bootstraps an ephemeral administrator, signs in through the real authentication API, creates and reads a private memo through the real memo API, creates a deterministic linked text attachment through the real attachment API, reads its exact bytes through the canonical authenticated `/file/attachments/...` route, verifies the SQLite database from the application container context, restarts only the application, waits for health to recover, signs in again, and verifies both the memo content and the attachment bytes survived the restart.

The attachment check does not inspect or compare a storage file directly. It exercises the same file-serving route used by the application for locally stored attachments, so it proves isolated authenticated attachment-binary persistence across a real container restart for the tested database-backed validation configuration.

The supplemental `scripts/goreecloud-notes-state-persistence-smoke.sh` reuses that isolated identity, creates richer private memo fixtures, verifies exact Markdown/checklist content and the source-derived `ci-label`, verifies persisted GoreeCloud color metadata, then exercises the same `UpdateMemo` REST mutation model used by the application for pinning and state changes. It pins the memo using the `pinned` update mask, archives it using the `state` update mask, moves a second memo into Archive, and transitions that second memo through the GoreeCloud Archive-to-Trash mutation shape using `content`, `state`, and `update_time`. After a second actual application restart, the smoke reauthenticates and proves the first memo remains pinned and archived while the second retains the GoreeCloud Trash restore marker with its underlying memo state returned to `NORMAL`. The SQLite database remains present after the second restart.

The runner sends PATCH requests directly to the isolated container's Docker-network address. No backend host port is published, and no curl package or other validation dependency is added to the production image.

These smokes materially strengthen restart-persistence evidence, including attachment binary persistence through the canonical authenticated file route. Documentation and validation-harness commits may be newer than a separately recorded application-code validation head; they must not be interpreted as a new application runtime unless application code changes again.

## GoreeCloud Memos Stable v0.1.0

GoreeCloud Memos `goreecloud-v0.1.0` was established from commit:

`181317ee0d8c32f5e0c2e625b7b293afdfc659c5`

Validated immutable image:

`ghcr.io/goreecloud/memos:goreecloud-v0.1.0@sha256:15f523fb1ac2b946339d9216d741b4368fbfd8631159487acc20b4133702ace1`

The Stable promotion and production transition completed on August 16, 2026. The validated deployment process included:

- preserving the historical Notes-branded Memos data in a verified backup archive before cutover;
- an isolated restore test using the exact Stable image with no network access, non-root UID/GID `10001:10001`, `no-new-privileges`, and all capabilities dropped;
- promotion of the validated restored database, assets, thumbnail cache, and instance settings into dedicated GoreeCloud Memos production paths;
- Docker Compose validation of the exact immutable image, non-root user, external `proxy` network, bounded logging, `/healthz` health check, and absence of backend host-port publication;
- startup and health validation of the dedicated `goreecloud-memos` runtime;
- private publication at `https://memos.goreecloud.com` through Caddy using Porkbun DNS-01 TLS, NetBird source restriction, and no backend host-port publication;
- private DNS, HTTPS, certificate, backend-health, and NetBird-connected client validation;
- browser acceptance covering authentication, Glaze UI rendering, Archive, Trash, label state, and migrated attachment rendering;
- byte-for-byte SQLite equality plus attachment-size/path comparison between the historical source copy and the promoted Memos copy before retirement; and
- retirement of the historical Notes-branded Memos runtime only after the replacement remained healthy and the private Memos endpoint passed acceptance.

The resulting Stable production state is GoreeCloud Memos at `https://memos.goreecloud.com`. The historical Memos-derived service is no longer routed from `notes.goreecloud.com`; that hostname remains reserved for the separate native GoreeCloud Notes application.

A later production branding reconciliation changed the active instance title from `GoreeCloud Notes` to `GoreeCloud Memos`, preserved the existing description, restarted only the Memos service, and confirmed the corrected browser/sidebar identity while the service remained healthy.

## Product Boundary

GoreeCloud Memos is the continuing lightweight quick-note product. GoreeCloud Notes is the separate native full notes and knowledge-management application.

Current Memos work should optimize for:

- fast memo creation and editing;
- compact, low-friction capture;
- Markdown-friendly content and checklists;
- labels/tags, pinning, simple filtering, Archive, Trash/recovery, and search;
- attachments where they remain useful without making the product unnecessarily heavy;
- private-by-default individual-user behavior;
- responsive web/PWA operation;
- portable exports;
- Glaze UI consistency and accessibility; and
- secure, reproducible self-hosted deployment.

Deep notebooks, knowledge graphs, broad research organization, extensive revision systems, and Evernote-class knowledge-management features belong primarily to GoreeCloud Notes unless a narrow Memos-specific need is separately justified.

## Post-Stable Development Rule

Later commits and pull requests are **post-Stable development** until they are separately validated and released. The existence of a commit on a branch, a successful CI run, or a merge to `main` does not mean that change is running in production.

For any post-Stable release candidate, validate the exact candidate revision with the checks appropriate to the changed scope. Application changes should consider, as applicable:

- frontend lint, unit, and production-build checks;
- container build and isolated runtime validation;
- memo, attachment, state, export, and restart-persistence checks when those areas are affected;
- product-identity and Glaze UI review against the Memos quick-capture scope;
- responsive/PWA and accessibility checks when user-interface behavior changes;
- backup/restore and data-migration checks when persistence or deployment behavior changes; and
- publication-path, DNS, Caddy, TLS, monitoring, data-preservation, and rollback validation when production infrastructure changes.

A post-Stable release must identify its exact source revision and immutable image. Production state must be recorded separately from source state.

## Operational Follow-Up Boundary

The Stable cutover record identified several operational follow-up items that are not silently claimed complete by this source document:

- long-term monitoring and backup coverage for the dedicated GoreeCloud Memos production paths must remain explicitly verified and documented;
- Porkbun API credentials exposed during an earlier administrative inspection require credential rotation and protected-environment update verification; and
- the existing non-fatal Caddyfile formatting warning remains a separate infrastructure-maintenance item.

These items should be closed through the appropriate GoreeCloud operational records and runtime validation. Source documentation must not imply they are complete without evidence.
