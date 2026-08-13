# GoreeCloud Notes Release-Candidate Validation

## RC1

Release candidate `goreecloud-v0.1.0-rc.1` was built from the GoreeCloud fork, published to GHCR, deployed on the temporary GoreeCloud VPS validation host, and successfully validated for container health and private HTTPS publication.

Validated infrastructure behavior included:

- Immutable GHCR image deployment.
- SQLite persistence under the GoreeCloud Notes application-data path.
- Non-root container execution.
- No backend host-port publication.
- Docker `proxy` network connectivity.
- AdGuard Home private resolution for `notes.goreecloud.com`.
- Caddy HTTPS routing to `goreecloud-notes:5230`.
- Successful `/healthz` response.
- Successful authenticated application startup and note creation.

RC1 did **not** pass user-interface acceptance. The deployed interface remained too close to upstream Memos and did not meet the intended Google Keep-style GoreeCloud Notes experience. Specific acceptance failures included the activity-calendar-heavy sidebar, oversized single-column presentation, poor label discoverability, upstream-oriented navigation, and insufficient GoreeCloud product identity.

RC1 remains a validation artifact and must not be promoted to stable.

## RC2

Release candidate `goreecloud-v0.1.0-rc.2` implemented the first substantial GoreeCloud Notes workspace redesign and was published and deployed to the same private validation environment without replacing the existing SQLite data.

RC2 validation confirmed:

- Dedicated GoreeCloud Notes navigation for Notes, Archive, Trash, Labels, Attachments, and Inbox.
- Removal of the activity calendar and Views/Tasks clutter from the primary Notes workspace.
- Responsive multi-column card-wall behavior.
- A first-class Labels manager backed by the upstream tag/index model.
- Label creation, label color, label assignment/removal, usage counts, card display, and sidebar filtering.
- Existing title, checklist, pin, note color, Archive, Trash, restore, authentication, and persistent-data behavior.
- Exact immutable image deployment with no backend host-port publication.
- Private AdGuard Home resolution, Caddy HTTPS publication, and successful application health checks.

RC2 passed the functional acceptance gate for the redesigned Notes workspace and Labels workflow, but visual/product acceptance remained **partial**. Remaining issues included upstream Memos terminology and administration surfaces in Settings, `#`-prefixed label presentation, modal-style Quick Find instead of direct workspace filtering, an always-expanded composer, and card actions that remained too dependent on the overflow menu.

RC2 therefore remains a release candidate rather than the stable first release.

## RC3 Product Polish Gate

Release candidate `goreecloud-v0.1.0-rc.3` was published on August 12, 2026 at 6:09 PM CDT from validated commit `eaa7bcd71937aa2025c91d0d4f838f901448a01e`.

The tag-triggered GoreeCloud Container workflow, run `31649812690`, completed successfully. The release job built and published the exact tag for both `linux/amd64` and `linux/arm64`.

Published immutable image:

`ghcr.io/goreecloud/memos@sha256:73613691c167b1ec261685168404b781edf844be04ed27e7bb59ebc78cdf0347`

RC3 focuses on product polish rather than infrastructure changes. The implementation includes:

- Clean user-facing label chips that display the configured label name without exposing the Markdown `#` token.
- Direct desktop `Search notes` filtering through the existing `contentSearch` filter model instead of opening a second Quick Find dialog.
- A collapsed `Take a note…` capture surface that expands into the full editor only when the user begins composing.
- Direct card actions for pin/unpin, color, labels, Archive/restore, with Trash restore surfaced directly where applicable; the overflow menu remains for secondary actions.
- Removal of reactions from the primary Notes card workflow, consistent with the initial GoreeCloud Notes MVP scope.
- A dedicated GoreeCloud Notes Settings navigation shell using GoreeCloud terminology.
- User-facing Settings reduced to My account, Preferences, and Labels.
- Administrator Settings reduced to Members, System, Notes, Storage, and Notifications for the initial product surface.
- Upstream Webhooks, SSO, AI, Resources, and Access Tokens hidden from the GoreeCloud Notes Settings experience for the initial MVP instead of defining the visible product interface.
- The former Memo administration page presented as Notes with note-oriented terminology, while reaction configuration is removed from that page.
- Softer rounded card geometry, restrained elevation, hover movement, translucent workspace surfaces, and other refinements aligned with GoreeCloud Glaze UI.

The upstream implementation remains available in source where removing it would create unnecessary divergence. RC3 changes the GoreeCloud product surface and does not change the SQLite data model, persistent storage paths, private DNS architecture, Caddy route, or backend network-exposure model.

## RC3 Desktop Acceptance

RC3 desktop visual/product acceptance passed on the private GoreeCloud Notes validation instance. The accepted desktop product surface includes:

- GoreeCloud Notes workspace hierarchy and Glaze UI direction.
- Collapsed and expanded composer behavior.
- Direct inline search and clearing behavior.
- Responsive card layout and direct card actions.
- Labels creation, assignment, clean chip presentation, counts, and filtering.
- Notes, Archive, and Trash workflows.
- GoreeCloud Settings navigation and note-oriented terminology.
- Removal of ordinary user-facing Memos branding and irrelevant upstream administration from the intended Notes workflow.
- Light and dark appearance behavior within the reviewed desktop surface.

Desktop acceptance closes the RC3 desktop visual/product gate. Mobile/PWA validation remains a separate first-release requirement and is not implied by this desktop result.

## Post-RC3 Glaze UI Branch Polish

After the published RC3 image, the development branch received an additional Glaze UI refinement intended for the stable release rather than a new published prerelease.

The post-RC3 branch polish adds or strengthens:

- Shared layered-surface tokens for blur, radius, borders, highlights, and restrained elevation.
- Selective translucency across the sidebar, sticky header, search, quick composer, editor, note cards, and Settings panels.
- Ambient background gradients and softer workspace depth.
- Light/dark theme-aware Glaze treatment.
- Hover and focus feedback for interactive cards and capture surfaces.
- Reduced-motion behavior.
- Additional English Settings terminology cleanup including **Note defaults** and **Default note visibility**.

Current post-RC3 branch validation head: `eba17578eb80df565e48fde1207c7a08ea563d0a`.

Validation on that head:

- Frontend Tests run `31718902784` — passed.
- GoreeCloud Container run `31718902812` — passed.

This branch-level polish does not change the SQLite data model, persistent storage paths, private DNS architecture, Caddy route, or backend network-exposure model.

## Stable Promotion Rule

`goreecloud-v0.1.0` must not be created until all remaining applicable first-release gates pass:

- Android/PWA visual and functional acceptance.
- End-to-end validation for notes, titles, checklists, labels, colors, pinning, attachments, Archive, Trash, restore, search, export, authentication, and restart persistence.
- Kopia integration or the approved long-term application-backup path.
- A real isolated restore test proving the application data can be recovered.
- Final pull-request review of the stable candidate branch state.

The RC3 automated validation and desktop visual/product acceptance gates are complete. PR #1 remains draft and unmerged until the remaining gates above are complete.
