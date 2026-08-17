# GoreeCloud Memos — Glaze UI 1.0 Conformance

## Status

I target **Glaze UI 1.0** for every GoreeCloud-controlled GoreeCloud Memos presentation surface. This record covers the web/PWA interface and the same remotely rendered interface used by the first-party Linux and Android Tauri clients.

This conformance record is a source-readiness artifact. It does not by itself promote a source revision to Stable or authorize a production deployment.

## Product identity

I preserve GoreeCloud Memos as the lightweight quick-capture application rather than expanding it into the deeper GoreeCloud Notes product role. The canonical GoreeCloud Memos icon remains `web/public/goreecloud-memos.svg` and is the shared source for web, Linux, and Android application identity.

## Surface hierarchy

I map the Glaze UI hierarchy into Memos as follows:

- **Canvas** — the atmospheric application background and workspace stage.
- **Solid** — content-first surfaces that prioritize readability.
- **Raised** — memo cards, compact settings cards, and supporting panels.
- **Glaze** — navigation, hero, search, composer, and selected contextual surfaces that benefit from restrained translucency.
- **Overlay** — dialogs, sheets, menus, popovers, and selects with the strongest separation.

The Glaze layers retain solid and forced-color fallbacks so content does not depend on blur or translucency.

## Adaptive layout contract

I use the official Glaze UI adaptive ranges:

- **Compact:** through 599 CSS pixels.
- **Medium:** 600 through 1023 CSS pixels.
- **Expanded:** 1024 through 1439 CSS pixels.
- **Wide:** 1440 CSS pixels and above.

Compact is treated as a real phone layout rather than a scaled-down desktop layout. The Compact source rules increase the base reading size, preserve practical touch targets, apply safe-area insets, constrain overlays to the viewport, enlarge mobile navigation, stack editor actions, make settings controls full-width where appropriate, and transform settings tables into card/list presentations instead of requiring horizontal scrolling.

Medium retains touch-friendly controls and additional horizontal breathing room. Expanded preserves the accepted desktop composition. Wide constrains readable content width instead of stretching the workspace indefinitely.

## Accessibility and resilience

I preserve or implement:

- visible `:focus-visible` treatment;
- practical Compact touch targets;
- keyboard-operable controls and semantic buttons/links;
- reduced-motion behavior that removes nonessential motion;
- increased-contrast treatment;
- forced-colors support;
- viewport-safe dialog/menu/popover sizing;
- safe-area handling for mobile clients and installed PWAs;
- readable solid fallbacks when layered visual effects are not suitable.

Glaze UI does not add analytics, trackers, remote font delivery, remote icon delivery, or other presentation-only third-party telemetry.

## Memos-specific usability

The current quick-capture workflow keeps these Memos-specific behaviors first-class:

- collapsed `Take a note…` capture;
- draft labels before first save;
- private-by-default presentation;
- labels, colors, pinning, Archive, recoverable Trash, and permanent Trash deletion;
- compact attachments;
- direct search and mobile navigation;
- responsive Settings administration without desktop-table overflow on Compact screens.

## Automated evidence

The frontend regression suite includes `web/tests/goreecloud-glaze-adaptive.test.ts`. It verifies that the adaptive layer is loaded after the base Glaze layers, the four official adaptive ranges are present, Compact readability/touch/safe-area requirements remain present, accessibility/resilience fallbacks remain present, settings tables retain their Compact transformation, and draft-label/save controls remain connected to the adaptive editor toolbar.

Existing GoreeCloud Memos frontend, Trash, draft-label, PWA, mobile-action, and container validation remain required alongside this conformance regression.

## Manual visual acceptance gates

Before a new Stable source release or production deployment, I still require manual visual acceptance for the affected source revision on representative supported surfaces:

- Compact Android device: Memos feed, drawer, new-memo composer with labels, Trash with Delete all, Settings, Members, Notifications, menus, dialogs, keyboard resize, and safe areas.
- Linux desktop client: feed/grid, Archive, Trash, Attachments, Settings, About, light/dark appearance, resize/maximize/restore, and pointer/keyboard focus behavior.
- Web/PWA: favicon/install identity, responsive breakpoints, light/dark appearance, keyboard access, and the same source behaviors used by the native shells.

The accepted GoreeCloud Memos application icon must remain unchanged unless a later explicit branding decision replaces the canonical product identity.

## Stable-release boundary

I will not call a revision Glaze-complete merely because it has rounded cards or glass effects. Stable acceptance requires exact-head frontend and container validation, manual visual acceptance on the affected form factors, no unresolved material regressions, preserved product identity and quick-capture scope, and a separately controlled production deployment when production is intended to change.
