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

After the published RC3 image, the development branch received additional stable-target Glaze UI, terminology, mobile/PWA readiness, automated persistence validation, and label-data-integrity hardening.

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
- an isolated authenticated API smoke that proves a private note survives an actual GoreeCloud Notes container restart against the persistent SQLite bind mount; and
- Markdown-aware label mutation that follows the same context-sensitive tag grammar used by the Notes renderer.

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

## Current Automated Validation

The latest validated application-code head is:

`8a0d807a6060857e5a9663492e968addde0ae370`

Validation on that application-code head:

- Frontend Tests run `31749969786` — passed, including lint, the full frontend unit suite with the label-integrity regressions, and the production frontend build.
- GoreeCloud Container run `31749969796` — passed.
- Container validation successfully built the release assets and validation image, rendered Compose, started an isolated instance, and passed the initial application health check.
- The authenticated persistence step bootstrapped an ephemeral administrator, signed in through the real authentication API, created and read a private memo through the real memo API, verified the SQLite database from the application container context, restarted only GoreeCloud Notes, waited for health to recover, signed in again, and verified the same memo content survived the restart.
- The workflow completed logs and teardown successfully after the persistence smoke.

The authenticated restart smoke is implemented in `scripts/goreecloud-notes-ci-smoke.sh` and invoked from `.github/workflows/goreecloud-container.yml`. It introduces no host backend port and no browser-testing framework.

This automated smoke materially strengthens restart-persistence evidence, but it does not close the deployed browser/user-workflow acceptance gate. Browser interaction, attachments, exports, the private Caddy/DNS/NetBird publication path, full GoreeCloud-specific state, and Android/PWA behavior still require their respective deployed acceptance checks.

Documentation-only reconciliation commits may be newer than the application-code validation head above. Those commits must not be interpreted as a new application runtime unless application code changes again.

## Remaining Gate Records

The remaining first-release gates are defined separately so automated readiness is not confused with real-world acceptance:

- `docs/goreecloud/android-pwa-validation.md` — source/code readiness is implemented and automated validation passes; real-device Android/PWA acceptance remains open.
- `docs/goreecloud/end-to-end-validation.md` — isolated authenticated note/restart persistence is automated and passing; deployed browser/user-workflow and full-state restart acceptance remain open.
- `docs/goreecloud/backup-live-preflight.md` — defines a read-only live-source inspection; it does not prove that Notes is already in the active Kopia source scope.
- `docs/goreecloud/backup-restore-validation.md` — GoreeCloud Notes application-specific backup and isolated restore acceptance remains open.

## Stable Promotion Rule

`goreecloud-v0.1.0` must not be created until all remaining applicable first-release gates pass:

- real-device Android/PWA visual and functional acceptance;
- deployed browser/user-workflow end-to-end validation and full-state restart-persistence acceptance;
- confirmed application-data protection through the approved long-term backup path using an application-consistent method;
- a real isolated restore test proving the restored application is usable; and
- final pull-request review of the stable-candidate branch state.

RC3 desktop acceptance, mobile/PWA source readiness, Markdown-aware label hardening, and the current isolated automated validation are complete. PR #1 remains draft and unmerged until the remaining gates above are complete.