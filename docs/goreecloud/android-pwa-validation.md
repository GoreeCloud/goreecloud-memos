# GoreeCloud Notes Android/PWA Validation

## Status

Android/PWA **code-readiness improvements are implemented** on the stable-candidate branch. Real-device visual and functional acceptance remains pending and must be completed before `goreecloud-v0.1.0` is promoted.

A repository/source review is not a substitute for installed-app testing on an actual Android device.

## Automated Readiness Improvements

The post-RC3 branch now includes the following Android/PWA readiness work:

- The mobile viewport permits user zoom instead of disabling pinch zoom.
- `viewport-fit=cover` is enabled so installed-app layouts can use device safe-area insets.
- Light and dark mobile browser/PWA chrome colors are declared separately.
- The Apple installed-app title is explicitly set to **GoreeCloud Notes**.
- The web app manifest has an explicit application `id`, language, text direction, and productivity/utility categories.
- Mobile sticky headers account for the top safe area.
- Mobile sheet navigation accounts for top and bottom safe areas.
- The mobile application shell accounts for the bottom gesture/navigation safe area.
- Header controls and Notes utility links use larger touch targets on small screens.
- The mobile Quick Find submit control uses a larger touch target.
- Glaze hover elevation is limited to fine-pointer devices so touch browsers do not retain desktop-style hover elevation after taps.
- The ambient Glaze background uses scrolling rather than fixed attachment on small screens to reduce mobile rendering jank.
- `web/tests/goreecloud-pwa-shell.test.ts` guards the mobile viewport and manifest identity requirements against regression.

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
- Confirm header, navigation, search, and note actions are comfortable touch targets.
- Confirm keyboard focus remains visible when a hardware keyboard or accessibility navigation is used.
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
- Verify light appearance.
- Verify dark appearance.
- Verify Glaze surfaces remain readable and do not create excessive blur, contrast loss, or visual obstruction on the device.

### Persistence

- Close the installed application completely and reopen it.
- Confirm authentication/session behavior matches the intended private deployment policy.
- Confirm newly created and edited notes remain present.
- Confirm note title, checklist, pin, color, labels, Archive/Trash state, and attachments persist after restart.

## Acceptance Rule

Android/PWA acceptance may be recorded as passed only after the deployed stable-candidate application is tested on a real Android device and the applicable checks above succeed.

Automated frontend/container validation and source-level responsive/PWA review are supporting evidence, not substitutes for real-device acceptance.
