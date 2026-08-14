# GoreeCloud Notes Release-Candidate Validation

## RC1

Release candidate `goreecloud-v0.1.0-rc.1` validated the GoreeCloud private deployment architecture, SQLite persistence, non-root container execution, Docker `proxy` networking, private DNS, Caddy HTTPS routing, `/healthz`, and initial note creation.

RC1 did **not** pass user-interface acceptance. The interface remained too close to upstream Memos and did not meet the intended GoreeCloud Notes experience. RC1 remains a validation artifact.

## RC2

Release candidate `goreecloud-v0.1.0-rc.2` delivered the first substantial Notes workspace redesign, responsive card wall, first-class Labels workflow, and preserved application state through an in-place private validation upgrade.

RC2 passed core workspace and Labels functional acceptance, but visual/product acceptance remained partial because terminology, Settings presentation, label display, search behavior, composer behavior, and card actions still needed product polish.

## RC3

Release candidate `goreecloud-v0.1.0-rc.3` was published on August 12, 2026 at 6:09 PM CDT from validated commit `eaa7bcd71937aa2025c91d0d4f838f901448a01e`.

Published immutable image:

`ghcr.io/goreecloud/memos@sha256:73613691c167b1ec261685168404b781edf844be04ed27e7bb59ebc78cdf0347`

Tag-triggered GoreeCloud Container run `31649812690` passed and published the release for `linux/amd64` and `linux/arm64`.

RC3 implemented the primary product-polish corrections from RC2, including clean label presentation, direct desktop search, collapsed quick capture, direct card actions, GoreeCloud Notes Settings terminology, and stronger Glaze UI treatment.

## RC3 Desktop Acceptance

RC3 desktop visual/product acceptance passed on the private GoreeCloud Notes validation instance.

Desktop acceptance covered the Notes workspace hierarchy, Glaze UI direction, composer behavior, direct search, responsive cards/actions, Labels, Notes/Archive/Trash workflows, Settings terminology, removal of ordinary user-facing Memos branding from the intended Notes workflow, and reviewed light/dark appearance behavior.

Desktop acceptance does not imply Android/PWA acceptance.

## Stable-Candidate Branch

After the published RC3 image, the development branch received additional stable-target Glaze UI, terminology, mobile/PWA readiness, automated persistence validation, label-data-integrity hardening, and state-view integrity hardening.

The branch now includes:

- shared Glaze surface tokens, selective translucency, softened depth, rounded geometry, focus feedback, and reduced-motion behavior;
- additional note-oriented Settings terminology;
- mobile safe-area handling for the header, slide-out navigation, and bottom navigation/gesture area;
- browser zoom support and `viewport-fit=cover`;
- one app-controlled mobile browser/PWA theme color synchronized by the existing Notes theme loader;
- explicit installed-app manifest identity;
- larger mobile header, slide-out navigation, search, note-card action, overflow-menu, and restore touch targets;
- a focusable, accessible pinned-note unpin control;
- fine-pointer-only hover elevation so touch interaction does not retain desktop hover effects;
- small-screen Glaze background behavior tuned for mobile rendering;
- automated regression coverage for the PWA shell and high-frequency mobile note actions;
- isolated authenticated API smokes that prove basic private-note persistence plus exact Markdown/checklist content, source-derived label recognition, GoreeCloud color metadata, actual pinned state, actual upstream Archive state, and the GoreeCloud Archive-to-Trash mutation state through actual Notes container restarts against the persistent SQLite bind mount;
- Markdown-aware label mutation that follows the same context-sensitive tag grammar used by the Notes renderer; and
- Archive/Trash state-view guards that keep hidden GoreeCloud state markers out of rendered top-level content and require restore before generic double-click editing.

Source-level Android/PWA review found and corrected conflicting media-scoped theme-color tags, undersized mobile navigation controls, undersized direct note-card actions, a 16 px overflow-menu trigger, and a pinned-note interaction attached to a non-focusable element. These corrections improve code readiness but do not replace real-device acceptance.

## Label and Markdown Integrity

The earlier GoreeCloud label helper identified labels with raw token-oriented regular expressions. That could treat `#label` text inside opaque Markdown contexts as a managed label during lookup or mutation.

The stable candidate now routes label recognition through the same GFM and `remarkMemoSyntax` transformation used by GoreeCloud Notes rendering. Label normalization also requires the complete user-facing value to satisfy the canonical tag scanner.

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

GoreeCloud note color and recoverable Trash state are intentionally stored as hidden Markdown metadata rather than new database fields.

Top-level display content now removes the GoreeCloud color and Trash implementation markers before Markdown rendering. Stored memo content is not rewritten by this presentation change. This protects the user-facing display when malformed or unclosed Markdown would otherwise make a trailing implementation marker visible as ordinary source content.

Archive and Trash also now share a consistent editing boundary. Their explicit action menus already withheld ordinary Edit behavior; the generic double-click path now follows the same model. Archived and trashed top-level notes must be restored before that generic edit path can modify them.

`web/tests/goreecloud-trash-integrity.test.ts` guards both the hidden-marker display rule and the restore-before-edit state boundary.

## Current Automated Validation

The latest validated application-code head is:

`7bcaf7416abbdd39011a4e2bc6aca9169a5672e8`

Validation on that application-code head:

- Frontend Tests run `31751659555` — passed, including lint, the full frontend unit suite with state-view integrity coverage, and the production frontend build.
- GoreeCloud Container run `31751659553` — passed.

The later validation-harness head is:

`988d1c2ed286b6cce73d594a62f9d948bdbcd7bf`

That head changes the CI persistence scripts/workflow rather than application runtime source. Validation on that exact harness head:

- Frontend Tests run `31785960610` — passed.
- GoreeCloud Container run `31785960604` — passed the release-asset build, validation-image build, Compose rendering, isolated startup/health, both authenticated restart-persistence smokes, logs, and cleanup.

The first smoke in `scripts/goreecloud-notes-ci-smoke.sh` bootstraps an ephemeral administrator, signs in through the real authentication API, creates and reads a private memo through the real memo API, verifies the SQLite database from the application container context, restarts only GoreeCloud Notes, waits for health to recover, signs in again, and verifies the same memo content survived the restart.

The supplemental `scripts/goreecloud-notes-state-persistence-smoke.sh` reuses that isolated identity, creates richer private note fixtures, verifies exact Markdown/checklist content and the source-derived `ci-label`, verifies persisted GoreeCloud color metadata, then exercises the same `UpdateMemo` REST mutation model used by the application for pinning and state changes. It pins the note using the `pinned` update mask, archives it using the `state` update mask, moves a second note into Archive, and transitions that second note through the GoreeCloud Archive-to-Trash mutation shape using `content`, `state`, and `update_time`. After a second actual Notes restart, the smoke reauthenticates and proves the first note remains pinned and archived while the second retains the GoreeCloud Trash restore marker with its underlying memo state returned to `NORMAL`. The SQLite database remains present after the second restart.

The runner sends PATCH requests directly to the isolated container's Docker-network address. No backend host port is published, and no curl package or other validation dependency is added to the production Notes image.

These smokes materially strengthen restart-persistence evidence, but they do not close the deployed browser/user-workflow acceptance gate. Browser interaction, attachment binary workflows, exports, the private Caddy/DNS/NetBird publication path, complete deployed state, Trash restore through the user interface, and Android/PWA behavior still require their respective acceptance checks.

Documentation and validation-harness commits may be newer than the application-code validation head above. Those commits must not be interpreted as a new application runtime unless application code changes again.

## Remaining Gate Records

The remaining first-release gates are defined separately so automated readiness is not confused with real-world acceptance:

- `docs/goreecloud/android-pwa-validation.md` — source/code readiness is implemented and automated validation passes; real-device Android/PWA acceptance remains open.
- `docs/goreecloud/end-to-end-validation.md` — isolated authenticated restart persistence now covers basic note persistence, Markdown/checklist content, source-derived label recognition, GoreeCloud color metadata, actual pinning, actual upstream Archive state, and the GoreeCloud Archive-to-Trash mutation state; deployed browser/user-workflow and complete full-state acceptance remain open.
- `docs/goreecloud/backup-live-preflight.md` — defines a read-only live-source inspection; it does not prove that Notes is already in the active Kopia source scope.
- `docs/goreecloud/backup-restore-validation.md` — GoreeCloud Notes application-specific backup and isolated restore acceptance remains open.

## Stable Promotion Rule

`goreecloud-v0.1.0` must not be created until all remaining applicable first-release gates pass:

- real-device Android/PWA visual and functional acceptance;
- deployed browser/user-workflow end-to-end validation and full-state restart-persistence acceptance;
- confirmed application-data protection through the approved long-term backup path using an application-consistent method;
- a real isolated restore test proving the restored application is usable; and
- final pull-request review of the stable-candidate branch state.

RC3 desktop acceptance, mobile/PWA source readiness, Markdown-aware label hardening, state-view integrity hardening, and the current isolated automated validation are complete. PR #1 remains draft and unmerged until the remaining gates above are complete.
