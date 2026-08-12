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

RC1 did **not** pass user-interface acceptance. The deployed interface remained too close to upstream Memos and did not meet the intended Google Keep-style GoreeCloud Notes experience. Specific acceptance failures included:

- The activity calendar consumed prominent sidebar space in the private Notes workspace.
- Navigation remained oriented around upstream Memos concepts rather than a dedicated notes application.
- The cached/default single-column layout produced oversized note cards and excessive empty space.
- Labels were not discoverable as a first-class note workflow.
- Label creation and assignment were not presented in user-facing GoreeCloud Notes terminology.
- The overall application shell did not yet feel sufficiently distinct from upstream Memos.

RC1 therefore remains a validation artifact and must not be promoted to the first stable GoreeCloud Notes release.

## RC2 UI Redesign Gate

The next validation candidate is `goreecloud-v0.1.0-rc.2` after the redesigned frontend passes automated validation.

The RC2 redesign includes:

- A dedicated GoreeCloud Notes workspace sidebar for Notes, Archive, Trash, Labels, Attachments, and Inbox.
- Removal of the activity calendar and upstream scope-switcher clutter from the primary private Notes workspace.
- A prominent desktop `Search notes` control while retaining responsive mobile search/navigation.
- A responsive multi-column card wall as the default layout, with existing view controls still available.
- Labels surfaced as a first-class GoreeCloud Notes concept while continuing to use Memos' portable Markdown tag/index model internally.
- A user-facing Labels manager for creating labels and assigning optional label colors.
- A Labels submenu in each editable top-level note for assigning and removing configured labels.
- Existing note title, pin, color, Archive, Trash, restore, export, privacy, and deployment behavior retained.

## Promotion Rule

RC2 must pass all automated frontend and container checks and then receive a new visual acceptance review on the deployed private `notes.goreecloud.com` instance.

Backup/restore validation remains required before `goreecloud-v0.1.0` stable promotion. PR #1 remains draft until the applicable release gates are complete.
