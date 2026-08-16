# GoreeCloud Memos Release-Candidate Validation

This record preserves the release-candidate evidence created while this repository was still used for the Notes-branded Memos implementation and separates that history from the current GoreeCloud Memos release line.

The historical RC1–RC3 artifacts remain valid engineering, deployment, persistence, portability, Glaze UI, and migration evidence. They are **not** Stable GoreeCloud Memos releases merely because the repository is now the continuing GoreeCloud Memos maintained fork.

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

RC3 desktop visual/product acceptance passed on the private validation instance. Desktop acceptance did not establish Android/PWA acceptance or authorize a Stable GoreeCloud Memos release.

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

The major post-RC stabilization work has been merged into `main`. The current canonical source baseline at the start of this post-merge reconciliation pass is commit `181317ee0d8c32f5e0c2e625b7b293afdfc659c5` (`Fix stable release predecessor detection and unpublished-tag handling`).

A merged source baseline does **not** by itself prove production readiness, real-device acceptance, backup/recovery readiness, or Stable-release authorization.

## Product-Boundary Reconciliation

GoreeCloud Memos is now the continuing lightweight quick-note product. GoreeCloud Notes is the separate native full notes and knowledge-management application.

Current Memos work must therefore optimize for:

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

The approved target address for GoreeCloud Memos is `https://memos.goreecloud.com`. The historical Notes-branded publication path must not be treated as the permanent Memos product address.

## Preserved Automated Validation Evidence

Earlier exact-head automated evidence remains useful historical validation for the code it tested:

- application-code head `5b3f266d443c98ebca08035ebf5c018f6c5e869d`: Frontend Tests run `31787838500` passed and GoreeCloud Container run `31787838506` passed;
- validation-harness head `5aa3fdd05cbc6c110f19009829ec728783106953`: Frontend Tests run `31789535244` passed and GoreeCloud Container run `31789535238` passed the release-asset build, validation-image build, Compose rendering, isolated startup/health, authenticated restart-persistence smokes, logs, and cleanup.

Those runs prove the tested revisions, not every later commit automatically. Any Stable candidate must be validated again at its exact proposed source revision.

The persistence smokes materially strengthen evidence for private memo persistence and attachment-binary persistence through the canonical authenticated file route across container restarts. They do not replace deployed browser/user-workflow validation, real-device PWA acceptance, publication-path validation, or application-specific backup and restore acceptance.

## Remaining Gate Records

The remaining release gates are defined separately so source readiness is not confused with real-world acceptance:

- `docs/goreecloud/android-pwa-validation.md` — source/code readiness and automated checks do not replace real-device Android/PWA acceptance;
- `docs/goreecloud/end-to-end-validation.md` — isolated authenticated persistence evidence does not replace deployed browser/user-workflow and complete-state acceptance;
- `docs/goreecloud/backup-live-preflight.md` — read-only source inspection does not prove that the application is already protected by the approved long-term backup scope;
- `docs/goreecloud/backup-restore-validation.md` — application-specific backup and isolated restore acceptance remains a separate gate.

## Stable Promotion Rule

A Stable GoreeCloud Memos release must not be created merely because post-RC source work is merged.

Before Stable promotion, the exact candidate revision must pass the applicable:

- frontend lint, unit, and production-build checks;
- container build and isolated runtime validation;
- memo, attachment, state, export, and restart-persistence checks;
- product-identity and Glaze UI review against the current Memos quick-capture scope;
- real-device responsive/PWA visual and functional acceptance;
- deployed browser/user-workflow end-to-end validation;
- confirmed application-data protection through the approved long-term backup path;
- real isolated restore testing;
- controlled `memos.goreecloud.com` publication/cutover validation with DNS, Caddy, TLS, monitoring, data preservation, backup coverage, and rollback protection; and
- final pull-request/release review of the exact Stable candidate.

Historical Notes-branded RC3 desktop acceptance and the post-RC source validation remain useful evidence, but Stable status and production cutover require the current Memos-specific gates above to pass separately.