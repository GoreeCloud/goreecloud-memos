# GoreeCloud Notes End-to-End Validation

## Status

The GoreeCloud Notes repository now has broad automated unit, component, build, isolated-container, authenticated API, and restart-persistence smoke coverage, but the **first-release deployed end-to-end acceptance gate is not yet complete**.

The stable-release gate still requires validation of the deployed stable-candidate application as a complete user-facing system. Existing frontend tests, container health checks, and the isolated authenticated persistence smoke are strong supporting evidence; they do not replace browser-driven validation of the full GoreeCloud Notes workflow, attachments, export, private publication path, or real-device behavior on the deployed application.

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

### Automated isolated authenticated persistence smoke

The stable-candidate container workflow also performs a dependency-free authenticated API smoke against the actual running GoreeCloud Notes container. It does not publish a backend host port or introduce a browser-testing framework.

On validation head `628be9c90a12fbb01267fdfab8850c32b56cd0e7`, GoreeCloud Container run `31745910673` successfully:

- bootstrapped an ephemeral first administrator in the otherwise empty isolated instance;
- authenticated through the real `/api/v1/auth/signin` endpoint and verified the current authenticated user;
- created a uniquely marked private note through the real `/api/v1/memos` endpoint;
- read that note back through the authenticated API and verified its content;
- verified the SQLite database exists at `/var/opt/memos/memos_prod.db` from the application container context;
- restarted only the GoreeCloud Notes container while retaining the same isolated persistent-data bind mount;
- waited for the actual container health check and `/healthz` endpoint to return ready again;
- authenticated again after restart; and
- read the same memo back and verified the unique content marker survived the restart.

The smoke is implemented in `scripts/goreecloud-notes-ci-smoke.sh` and invoked by `.github/workflows/goreecloud-container.yml` after initial health validation.

Frontend Tests run `31745910683` also passed on the same validation head, including lint, the frontend unit suite, and the production frontend build.

## What Automated Coverage Does Not Prove

The repository does not currently use a full browser-driven end-to-end framework such as Playwright or Cypress for the GoreeCloud Notes release gate.

The authenticated API restart smoke proves considerably more than a health-only container check, but it still does not prove that a real authenticated user can complete the entire first-release workflow through the browser against the deployed private service. In particular, it does not by itself validate:

- the complete browser sign-in and navigation experience;
- editor/composer interaction as rendered to a user;
- labels, checklist controls, pin/color controls, Archive, or Trash through the browser;
- attachment upload/open/download through the deployed UI;
- individual or full-library export through the deployed UI;
- desktop search and mobile Quick Find as rendered interactions;
- the Caddy, private DNS, and NetBird publication path for the stable candidate;
- real-device Android/PWA presentation or touch behavior; or
- the full deployed application state after an operational restart of the actual private service.

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

The isolated authenticated smoke now proves a basic private note survives a real container restart against the application SQLite bind mount. The deployed gate still requires the broader user-visible state below.

After the validation data above exists:

- Record the validation note identities and expected state.
- Restart only the deployed GoreeCloud Notes application service using the approved operational procedure.
- Wait for the application health check to return ready.
- Sign in again if required.
- Verify notes, titles, Markdown content, checklist state, labels, pinning, colors, attachments, Archive/Trash state, and searchability remain intact.
- Verify the service still uses the approved persistent-data path and does not acquire a published backend host port.

## Relationship to Android/PWA Acceptance

Android/PWA acceptance is tracked separately in `docs/goreecloud/android-pwa-validation.md` because installed-app presentation, safe areas, touch interaction, and real-device behavior require device-specific review.

A workflow may satisfy both checklists during one real-device validation session when the same stable-candidate deployment is used, but each gate must be recorded explicitly.

## Relationship to Backup and Restore

Application restart persistence is not a backup/restore test.

The stable release still requires integration with the approved long-term backup path and a real isolated restore test proving that GoreeCloud Notes can be reconstructed from protected application data and required configuration.

## Acceptance Rule

The deployed end-to-end gate may be recorded as passed only after the applicable browser/user-facing checks above have been completed successfully against the stable-candidate private deployment and the result has been documented.

The automated authenticated persistence smoke is a required supporting check but is not sufficient by itself to close the deployed E2E gate.

Do not merge PR #1 or create `goreecloud-v0.1.0` solely because unit tests, frontend builds, container health checks, or the isolated authenticated API smoke pass.
