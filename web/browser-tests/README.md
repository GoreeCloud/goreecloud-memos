# GoreeCloud Memos Browser Acceptance

This directory contains test-only rendered-browser acceptance coverage for layout behavior that cannot be validated reliably by jsdom alone.

## Home masonry

`run-home-masonry-browser.sh` starts the existing Vite frontend pipeline and loads `home-masonry.html` in a locally available headless Chromium browser. The harness mounts the production `ColumnGrid` component with the production stylesheet and records geometry from the browser's real layout engine.

The current acceptance contract verifies that:

- a 358px Home-equivalent content width can render two physical columns using the Home 168px minimum card width;
- a 320px content width safely falls back to one column;
- rendered cards never become narrower than 168px in either case; and
- rendered cards remain inside the grid container without horizontal overflow.

This is source and CI acceptance only. Passing this harness does not release or deploy GoreeCloud Memos and does not replace desktop, PWA, or Android device acceptance.
