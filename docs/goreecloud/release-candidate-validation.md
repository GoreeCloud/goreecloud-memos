# GoreeCloud Memos Release and Validation Record

This record preserves the release-candidate evidence created while this repository was still used for the Notes-branded Memos implementation, records the established GoreeCloud Memos Stable baseline, and defines how later source changes must be evaluated.

Historical RC1–RC3 artifacts remain valid engineering, deployment, persistence, portability, Glaze UI, and migration evidence. They are not themselves Stable GoreeCloud Memos releases.

## Historical Notes-Branded RC1

Release candidate `goreecloud-v0.1.0-rc.1` validated the private deployment architecture, SQLite persistence, non-root container execution, Docker `proxy` networking, private DNS, Caddy HTTPS routing, `/healthz`, and initial note creation.

RC1 did not pass user-interface acceptance. It remains a historical validation artifact.

## Historical Notes-Branded RC2

Release candidate `goreecloud-v0.1.0-rc.2` delivered the first substantial GoreeCloud workspace redesign, responsive card wall, first-class Labels workflow, and preserved application state through an in-place private validation upgrade.

RC2 passed core workspace and Labels functional acceptance, but product acceptance remained partial because terminology, Settings presentation, label display, search behavior, composer behavior, and card actions still needed polish.

## Historical Notes-Branded RC3

Release candidate `goreecloud-v0.1.0-rc.3` was published on August 12, 2026 at 6:09 PM CDT from validated commit `eaa7bcd71937aa2025c91d0d4f838f901448a01e`.

Published immutable image:

`ghcr.io/goreecloud/memos@sha256:73613691c167b1ec261685168404b781edf844be04ed27e7bb59ebc78cdf0347`

Tag-triggered GoreeCloud Container run `31649812690` passed and published the release for `linux/amd64` and `linux/arm64`.

RC3 implemented the primary product-polish corrections from RC2, including clean label presentation, direct desktop search, collapsed quick capture, direct card actions, GoreeCloud Settings terminology, and stronger Glaze UI treatment.

RC3 desktop visual/product acceptance passed on the private validation instance. Desktop acceptance did not by itself establish the later GoreeCloud Memos Stable release.

## Post-RC Stabilization Baseline

After RC3, the repository received additional work intended to make the maintained fork safer, more portable, more responsive, and more release-ready. That work includes:

- shared Glaze UI surface treatment, focus feedback, reduced-motion behavior, and responsive/mobile refinements;
- safe-area handling, mobile navigation and action touch-target improvements, browser zoom support, and installed-PWA identity improvements;
- a focusable accessible pinned-item interaction and touch-safe hover behavior;
- authenticated persistence smokes covering private memo content, attachment bytes, pinned state, Archive state, recoverable Trash state, and actual container restarts;
- Markdown-aware label handling that avoids treating tag-looking text in opaque Markdown contexts as managed labels;
- presentation guards that keep hidden GoreeCloud state markers out of rendered content;
- restore-before-edit behavior for archived and trashed top-level memos;
- full-library JSON portability work preserving documented attachment metadata while intentionally excluding attachment binary payloads; and
- release-lineage hardening so historical or unpublished tags are not incorrectly treated as Stable-release predecessors.

The stabilized source baseline was merged into `main` at commit `181317ee0d8c32f5e0c2e625b7b293afdfc659c5` (`Fix stable release predecessor detection and unpublished-tag handling`).

## GoreeCloud Memos Stable v0.1.0

GoreeCloud Memos `goreecloud-v0.1.0` was established from commit `181317ee0d8c32f5e0c2e625b7b293afdfc659c5`.

Validated immutable image:

`ghcr.io/goreecloud/memos:goreecloud-v0.1.0@sha256:15f523fb1ac2b946339d9216d741b4368fbfd8631159487acc20b4133702ace1`

The Stable promotion and production transition completed on August 16, 2026. The validated deployment process included:

- preserving the historical Notes-branded Memos data in a verified backup archive before cutover;
- an isolated restore test using the exact Stable image with no network access, non-root UID/GID `10001:10001`, `no-new-privileges`, and all capabilities dropped;
- promotion of the validated restored database and application data into dedicated GoreeCloud Memos paths;
- Docker Compose validation of the exact immutable image, non-root user, external `proxy` network, bounded logging, `/healthz` health check, and absence of backend host-port publication;
- private publication at `https://memos.goreecloud.com` through Caddy with Porkbun DNS-01 TLS and NetBird source restriction;
- private DNS, HTTPS, certificate, backend health, and NetBird-connected client validation;
- browser acceptance covering authentication, Glaze UI rendering, Archive, Trash, label state, and attachment rendering;
- byte-for-byte database equality and attachment comparison between the historical source copy and the promoted Memos copy before retirement; and
- retirement of the historical Notes-branded Memos runtime only after the replacement remained healthy and the private Memos endpoint had passed acceptance.

The resulting Stable production state is GoreeCloud Memos at `https://memos.goreecloud.com`. The historical Memos-derived service is no longer routed from `notes.goreecloud.com`; that hostname remains reserved for the separate native GoreeCloud Notes application.

A later production branding reconciliation changed the active instance title from `GoreeCloud Notes` to `GoreeCloud Memos` and confirmed the corrected browser/sidebar identity while the service remained healthy.

## Product Boundary

GoreeCloud Memos is the continuing lightweight quick-note product. GoreeCloud Notes is the separate native full notes and knowledge-management application.

Current Memos work should optimize for:

- fast note creation and editing;
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

## Preserved Automated Validation Evidence

Earlier exact-head automated evidence remains useful historical validation for the code it tested:

- application-code head `5b3f266d443c98ebca08035ebf5c018f6c5e869d`: Frontend Tests run `31787838500` passed and GoreeCloud Container run `31787838506` passed;
- validation-harness head `5aa3fdd05cbc6c110f19009829ec728783106953`: Frontend Tests run `31789535244` passed and GoreeCloud Container run `31789535238` passed the release-asset build, validation-image build, Compose rendering, isolated startup/health, authenticated restart-persistence smokes, logs, and cleanup.

Those runs prove the tested revisions, not every later commit automatically.

## Post-Stable Development Rule

Later commits and pull requests are **post-Stable development** until they are separately validated and released. The existence of a commit on a branch, a successful CI run, or a merge to `main` does not mean that change is running in production.

For any post-Stable release candidate, validate the exact candidate revision with the checks appropriate to the changed scope. At minimum, application changes should consider:

- frontend lint, unit, and production-build checks;
- container build and isolated runtime validation;
- memo, attachment, state, export, and restart-persistence checks when those areas are affected;
- product-identity and Glaze UI review against the Memos quick-capture scope;
- responsive/PWA and accessibility checks when user-interface behavior changes;
- backup/restore and data-migration checks when persistence or deployment behavior changes; and
- publication-path, DNS, Caddy, TLS, monitoring, and rollback validation when production infrastructure changes.

A post-Stable release must identify its exact source revision and immutable image. Production state must be recorded separately from source state.

## Operational Follow-Up Boundary

The Stable cutover record identified several operational follow-up items that are not silently claimed complete by this source document:

- long-term monitoring and backup coverage for the dedicated GoreeCloud Memos production paths must remain explicitly verified and documented;
- Porkbun API credentials exposed during an earlier administrative inspection require credential rotation and protected-environment update verification; and
- the existing non-fatal Caddyfile formatting warning remains a separate infrastructure-maintenance item.

These items should be closed through the appropriate GoreeCloud operational records and runtime validation. Source documentation must not imply they are complete without evidence.
