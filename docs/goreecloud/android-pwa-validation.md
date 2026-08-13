# GoreeCloud Notes Android/PWA Validation

## Status

Android/PWA **code-readiness improvements are implemented** on the stable-candidate branch. Real-device visual and functional acceptance remains pending and must be completed before `goreecloud-v0.1.0` is promoted.

A repository/source review is not a substitute for installed-app testing on an actual Android device.

## Automated Readiness Improvements

The stable-candidate branch includes the following Android/PWA readiness work:

- The mobile viewport permits user zoom instead of disabling pinch zoom.
- `viewport-fit=cover` is enabled so installed-app layouts can use device safe-area insets.
- The page exposes one app-controlled `theme-color` value so the existing GoreeCloud Notes theme loader can keep browser/PWA chrome synchronized with the selected Light, Dark, or Paper appearance.
- The Apple installed-app title is explicitly set to **GoreeCloud Notes**.
- The web app manifest has an explicit application `id`, language, text direction, and productivity/utility categories.
- Mobile sticky headers account for the top safe area.
- Mobile sheet navigation accounts for top and bottom safe areas.
- The mobile application shell accounts for the bottom gesture/navigation safe area.
- Mobile header controls use larger touch targets.
- Mobile slide-out navigation rows, links, section actions, and labeled icon controls use a minimum 44 px touch target while the compact desktop sidebar remains unchanged.
- The mobile Quick Find submit control uses a larger touch target.
- High-frequency note-card actions use 44 px mobile targets while retaining compact desktop sizing.
- The note overflow-menu trigger uses a 44 px mobile target.
- The pinned-note unpin action is a real focusable button with an accessible label instead of an icon click attached to a non-focusable element.
- Glaze hover elevation is limited to fine-pointer devices so touch browsers do not retain desktop-style hover elevation after taps.
- The ambient Glaze background uses scrolling rather than fixed attachment on small screens to reduce mobile rendering jank.
- `web/tests/goreecloud-pwa-shell.test.ts` guards the viewport, manifest identity, single app-controlled theme color, and mobile navigation touch-target requirements against regression.
- `web/tests/goreecloud-mobile-actions.test.ts` guards the mobile note-card action sizing, overflow-menu trigger sizing, and pinned-note button semantics.

The final mobile-specific application head for these UI corrections was `7762d32bbfd4e8c73bb8c99130bce3e77c1bc446`.

Automated evidence on that mobile-specific head:

- Frontend Tests run `31744796653` — passed.
- GoreeCloud Container run `31744796705` — passed.

The later stable-candidate application-code head `8a0d807a6060857e5a9663492e968addde0ae370` retains the same mobile/PWA implementation while adding persistence-validation and Markdown-aware label-integrity work. It also passed the complete frontend and container validation paths:

- Frontend Tests run `31749969786` — passed.
- GoreeCloud Container run `31749969796` — passed, including the authenticated restart-persistence smoke.

Readiness review identified source-level Android/PWA issues before device acceptance, including conflicting media-scoped theme-color tags, desktop-sized controls reused in the mobile slide-out navigation, undersized high-frequency note-card controls, a 16 px note overflow trigger, and a non-focusable pinned-note unpin interaction. These source-level issues were corrected and regression coverage was expanded accordingly.

## Real-Device Acceptance Checklist

The stable-release Android/PWA gate requires validation of the deployed private instance on an actual Android device.

### Installation and launch

- Confirm the browser recognizes GoreeCloud Notes as installable when supported.
- Install the application from the private HTTPS address.
- Confirm the installed name and icon identify the application as GoreeCloud Notes.
- Launch from the home-screen/app launcher and confirm standalone presentation.
- Confirm the application opens to the expected authenticated or sign-in workflow.

### Safe areas and responsive layout

- Verify the header does not overlap the status bar, camera cutout, hinge/cutout region, or browser/PWA chrome.
- Verify the slide-out navigation does not place content under unsafe top or bottom regions.
- Verify bottom content and controls remain usable above gesture/navigation areas.
- Verify portrait and landscape layouts.
- Verify narrow-screen and wider-screen/foldable layouts when available.
- Confirm note cards fall back cleanly to the single-column flow when the available width cannot support the card grid.

### Accessibility and interaction

- Confirm pinch zoom works.
- Confirm text remains readable after zooming.
- Confirm header, navigation, search, direct card actions, pinned-note controls, and overflow-menu controls are comfortable touch targets.
- Confirm keyboard focus remains visible and the pinned-note unpin control is reachable when a hardware keyboard or accessibility navigation is used.
- Confirm touch interactions do not leave note cards or controls visually stuck in a desktop hover state.
- Confirm reduced-motion behavior when the operating system requests reduced motion.

### Notes workflow

- Create a note from the collapsed `Take a note…` composer.
- Edit an existing note.
- Create and edit a title.
- Create and toggle checklist items.
- Pin and unpin a note.
- Change note color.
- Assign and remove labels.
- Filter by label.
- Search notes and clear the search.
- Archive and restore a note.
- Move a note to Trash, restore it, and verify permanent deletion remains confined to the Trash workflow.
- Add and view an attachment.

### Appearance and navigation

- Verify Notes, Archive, Trash, Labels, Attachments, Inbox, and Settings navigation.
- Verify the GoreeCloud Notes Settings shell and terminology.
- Verify Light, Dark, and Paper appearances update application/browser chrome appropriately where supported.
- Verify Glaze surfaces remain readable and do not create excessive blur, contrast loss, or visual obstruction on the device.

### Persistence

- Close the installed application completely and reopen it.
- Confirm authentication/session behavior matches the intended private deployment policy.
- Confirm newly created and edited notes remain present.
- Confirm note title, checklist, pin, color, labels, Archive/Trash state, and attachments persist after restart.

## Acceptance Rule

Android/PWA acceptance may be recorded as passed only after the deployed stable-candidate application is tested on a real Android device and the applicable checks above succeed.

Automated frontend/container validation and source-level responsive/PWA review are supporting evidence, not substitutes for real-device acceptance.