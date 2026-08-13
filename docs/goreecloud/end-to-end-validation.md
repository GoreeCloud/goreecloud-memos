# GoreeCloud Notes End-to-End Validation

## Status

The GoreeCloud Notes repository has broad automated unit, component, build, and isolated-container coverage, but the **first-release end-to-end acceptance gate is not yet complete**.

The stable-release gate requires validation of the deployed stable-candidate application as a complete system. Existing frontend tests and container health checks are supporting evidence; they do not replace authenticated user-workflow, restart-persistence, attachment, export, and recovery acceptance on the deployed application.

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
- Mobile/PWA manifest and viewport regression requirements.

The GoreeCloud Container workflow separately validates that the real application image can be built, rendered through the GoreeCloud Compose package, started with isolated temporary storage, and become healthy through the actual `/healthz` endpoint.

## What Automated Coverage Does Not Prove

The repository does not currently use a full browser-driven end-to-end framework such as Playwright or Cypress for the GoreeCloud Notes release gate.

The current automated suite therefore does not by itself prove that a real authenticated user can complete the entire first-release workflow against a running stable-candidate deployment, nor does it prove that every GoreeCloud-specific state survives an actual service restart.

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

After the validation data above exists:

- Record the validation note identities and expected state.
- Restart only the GoreeCloud Notes application service using the approved operational procedure.
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

The end-to-end gate may be recorded as passed only after the applicable deployed checks above have been completed successfully against the stable-candidate application and the result has been documented.

Do not merge PR #1 or create `goreecloud-v0.1.0` solely because unit tests, frontend builds, or container health checks pass.
