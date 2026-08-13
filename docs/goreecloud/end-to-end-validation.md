# GoreeCloud Notes End-to-End Validation

## Status

The GoreeCloud Notes repository now has broad automated unit, component, build, isolated-container, authenticated API, and restart-persistence smoke coverage, but the **first-release deployed end-to-end acceptance gate is not yet complete**.

The stable-release gate still requires validation of the deployed stable-candidate application as a complete user-facing system. Existing frontend tests, container health checks, and the isolated authenticated persistence smokes are strong supporting evidence; they do not replace browser-driven validation of the full GoreeCloud Notes workflow, attachments, export, private publication path, or real-device behavior on the deployed application.

## Existing Automated Evidence

The current frontend suite covers major pieces of the GoreeCloud Notes experience and supporting upstream behavior, including:

- GoreeCloud Notes navigation and mobile sidebar behavior.
- Responsive card-grid and column planning.
- Collapsed composer and editor behavior.
- Title/Markdown heading handling.
- Markdown task-list actions and checklist rendering.
- Tag/label parsing, rendering, metadata, and navigation.
- Quick Find and filter-context behavior.
- Note-card and display-setting behavior.
- Attachment placement, URLs, media metadata, library behavior, and upload helpers.
- Authentication page, redirect, initialization, and password-sign-in components.
- Autosave and editor-cache behavior.
- GoreeCloud Settings-shell behavior.
- Mobile/PWA manifest, viewport, touch-target, and note-action regression requirements.

The GoreeCloud Container workflow separately validates that the real application image can be built, rendered through the GoreeCloud Compose package, started with isolated temporary storage, and become healthy through the actual `/healthz` endpoint.

### Automated isolated authenticated persistence smokes

The stable-candidate container workflow performs two dependency-light authenticated API smokes against the actual running GoreeCloud Notes container. They do not publish a backend host port or introduce a browser-testing framework.

The latest validated **application-code head** remains:

`7bcaf7416abbdd39011a4e2bc6aca9169a5672e8`

That application-code head passed:

- Frontend Tests run `31751659555`; and
- GoreeCloud Container run `31751659553`.

The later **validation-harness head** `19e7513cff79f3c9d24efbe921706025d167780b` changes the CI persistence scripts/workflow rather than the application runtime. On that exact head:

- Frontend Tests run `31753450214` passed; and
- GoreeCloud Container run `31753450232` passed the complete isolated container path, including both restart-persistence smokes.

The original smoke in `scripts/goreecloud-notes-ci-smoke.sh` successfully:

- bootstraps an ephemeral first administrator in the otherwise empty isolated instance;
- authenticates through the real `/api/v1/auth/signin` endpoint and verifies the current authenticated user;
- creates a uniquely marked private note through the real `/api/v1/memos` endpoint;
- reads that note back through the authenticated API and verifies its content;
- verifies the SQLite database exists at `/var/opt/memos/memos_prod.db` from the application container context;
- restarts only the GoreeCloud Notes container while retaining the same isolated persistent-data bind mount;
- waits for the actual container health check and `/healthz` endpoint to return ready again;
- authenticates again after restart; and
- reads the same memo back and verifies the unique content marker survived the restart.

The supplemental smoke in `scripts/goreecloud-notes-state-persistence-smoke.sh` then uses the same isolated identity to create richer GoreeCloud state fixtures and performs a second actual Notes restart. It verifies before and after restart that:

- a private Markdown note retains its H1 title source and ordinary body content exactly;
- incomplete and completed Markdown checklist syntax remain intact;
- the source-derived `ci-label` tag remains recognized by the API;
- the hidden GoreeCloud note-color metadata marker remains intact as part of the persisted note content;
- a second private note retains the hidden Trash metadata marker with an `archived` restore target; and
- the SQLite database remains present after the second restart.

This is stronger evidence than a health-only or one-note content check, but it is intentionally scoped. The supplemental smoke does not claim that browser controls were exercised, that a note was actually pinned or moved into the upstream archived state through its mutation API, or that an attachment binary was uploaded and restored.

## What Automated Coverage Does Not Prove

The repository does not currently use a full browser-driven end-to-end framework such as Playwright or Cypress for the GoreeCloud Notes release gate.

The authenticated API restart smokes prove considerably more than a health-only container check, including exact Markdown/checklist content, source-derived label recognition, GoreeCloud color metadata, and Trash restore-intent metadata through restart. They still do not prove that a real authenticated user can complete the entire first-release workflow through the browser against the deployed private service. In particular, they do not by themselves validate:

- the complete browser sign-in and navigation experience;
- editor/composer interaction as rendered to a user;
- label assignment/removal, checklist toggling, pin/color controls, Archive, or Trash actions through the browser;
- actual pinned state or upstream archived state across a deployed operational restart;
- attachment upload/open/download and binary persistence through the deployed UI;
- individual or full-library export through the deployed UI;
- desktop search and mobile Quick Find as rendered interactions;
- the Caddy, private DNS, and NetBird publication path for the stable candidate;
- real-device Android/PWA presentation or touch behavior; or
- the complete deployed application state after an operational restart of the actual private service.

## Deployed End-to-End Acceptance Checklist

The following checks must be completed against the deployed stable-candidate application before `goreecloud-v0.1.0` is promoted.

### Authentication and session

- Sign in with an approved GoreeCloud Notes account.
- Confirm unauthenticated access follows the intended private deployment policy.
- Confirm ordinary self-registration remains unavailable after bootstrap.
- Confirm the authenticated session works through ordinary navigation.
- Close and reopen the application and verify the intended session behavior.

### Note creation and editing

- Create a new note from the collapsed `Take a note…` composer.
- Add a user-facing title and verify it remains backed by the leading Markdown H1.
- Add ordinary Markdown body content.
- Edit the title and body and verify the changes persist.
- Reload the application and verify the note remains correct.

### Checklists

- Create multiple Markdown checklist items.
- Toggle incomplete and complete states.
- Reload the note and verify checklist state persists.

### Labels

- Create or select a label.
- Assign the label to a note.
- Verify the user-facing chip does not expose the underlying Markdown `#` token.
- Verify the label usage count.
- Filter the Notes workspace by that label.
- Remove the label and verify the filter/count state updates correctly.

### Pinning and color

- Pin and unpin a note.
- Verify pinned ordering/presentation.
- Change the note color.
- Reload the application and verify pin and color state persist.

### Attachments

- Upload an approved test attachment.
- Verify the attachment appears on the note.
- Open or download the attachment through the intended interface.
- Reload the application and verify the attachment remains associated with the note.

### Archive

- Archive a note.
- Verify it leaves the normal Notes view and appears in Archive.
- Restore it from Archive.
- Verify its prior title, body, labels, checklist state, pin/color metadata, and attachments remain correct as applicable.

### Trash and recovery

- Move a note to Trash through the normal GoreeCloud Notes deletion workflow.
- Verify it leaves the active Notes view and appears in Trash.
- Restore it from Trash and confirm the intended pre-Trash state is recovered.
- Verify permanent deletion remains available only from the Trash workflow.
- Use a disposable validation note when verifying permanent deletion.

### Search

- Search for a unique term in note content.
- Search for a title term.
- Verify direct desktop filtering and mobile Quick Find return the intended note.
- Clear the search and verify the ordinary Notes collection returns.

### Export

- Export an individual note as Markdown.
- Verify the exported Markdown preserves the intended title/body/checklist/label representation.
- Run the full-library Markdown export.
- Run the full-library JSON export.
- Verify the JSON identifies the GoreeCloud Notes export schema/version and preserves the documented note state and metadata fields.
- Confirm documented exclusions such as attachment binaries, comments, and reactions are not misrepresented as included.

### Restart persistence

The isolated authenticated smokes now prove that private note content, exact Markdown checklist syntax, source-derived label recognition, GoreeCloud color metadata, and Trash restore-intent metadata survive actual container restarts against the persistent SQLite bind mount. The deployed gate still requires the broader user-visible and mutation-backed state below.

After the validation data above exists:

- Record the validation note identities and expected state.
- Restart only the deployed GoreeCloud Notes application service using the approved operational procedure.
- Wait for the application health check to return ready.
- Sign in again if required.
- Verify notes, titles, edited Markdown content, checklist state, labels, actual pinning, colors, attachments, actual Archive/Trash workflow state, and searchability remain intact.
- Verify the service still uses the approved persistent-data path and does not acquire a published backend host port.

## Relationship to Android/PWA Acceptance

Android/PWA acceptance is tracked separately in `docs/goreecloud/android-pwa-validation.md` because installed-app presentation, safe areas, touch interaction, and real-device behavior require device-specific review.

A workflow may satisfy both checklists during one real-device validation session when the same stable-candidate deployment is used, but each gate must be recorded explicitly.

## Relationship to Backup and Restore

Application restart persistence is not a backup/restore test.

The stable release still requires integration with the approved long-term backup path and a real isolated restore test proving that GoreeCloud Notes can be reconstructed from protected application data and required configuration.

## Acceptance Rule

The deployed end-to-end gate may be recorded as passed only after the applicable browser/user-facing checks above have been completed successfully against the stable-candidate private deployment and the result has been documented.

The automated authenticated persistence smokes are required supporting checks but are not sufficient by themselves to close the deployed E2E gate.

Do not merge PR #1 or create `goreecloud-v0.1.0` solely because unit tests, frontend builds, container health checks, or the isolated authenticated API smokes pass.
