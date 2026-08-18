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
- **Overlay** — dialogs, sheets, menus, popovers, selects, and tooltips with the strongest separation.

The Glaze layers retain solid and forced-color fallbacks so content does not depend on blur or translucency.

## Adaptive layout contract

I use the official Glaze UI adaptive ranges:

- **Compact:** through 599 CSS pixels.
- **Medium:** 600 through 1023 CSS pixels.
- **Expanded:** 1024 through 1439 CSS pixels.
- **Wide:** 1440 CSS pixels and above.

Compact is treated as a real phone layout rather than a scaled-down desktop layout. The Compact source rules increase the base reading size, preserve practical touch targets, apply safe-area insets, constrain overlays to the viewport, enlarge mobile navigation, stack editor actions, make settings controls full-width where appropriate, and transform settings tables into card/list presentations instead of requiring horizontal scrolling.

Portaled Overlay surfaces are explicit adaptive scopes. Dialog, sheet, popover, dropdown-menu, select, and tooltip content can be mounted outside the `.gc-app-shell` DOM subtree by Base UI, so Compact/Medium interaction sizing, focus treatment, viewport containment, forced-colors fallbacks, and reduced-motion behavior do not depend on physical nesting beneath the application shell. Dialog content and dialog/sheet close controls expose stable `data-slot` hooks so the same Glaze contract reaches the actual rendered popup controls.

Semantic menu choices remain part of the same adaptive contract. Plain menu items, radio menu items, and checkbox menu items receive the same Compact/Medium target sizing and focus treatment so accessibility semantics do not reduce touch usability or keyboard visibility.

Semantic select options follow the same rule. `option` roles retain Compact and Medium target sizing, visible keyboard focus, and forced-colors focus treatment, while select overlay content receives the same forced-colors Canvas fallback as menu and popover surfaces.

Shared tab lists also transform for narrow layouts. Compact tab lists remain horizontally contained and scrollable rather than compressing labels or forcing page-level horizontal overflow, while each tab remains a stable target inside the Glaze Compact/Medium sizing contract.

Settings switches preserve the compact visual pill while receiving an invisible centered hit area that expands to the Compact and Medium interaction targets. The switch itself is also included explicitly in normal and forced-colors focus treatment, so increasing touch usability does not require visually enlarging every toggle.

Checkbox and radio-group controls follow the same visual-density rule. Their compact `size-4` marks remain unchanged, but the adaptive layer provides the same centered Compact and Medium interaction envelope used for switches and explicitly includes both control slots in normal and forced-colors focus treatment.

Settings help controls are also treated as Compact controls rather than desktop-sized icons. Their interactive button area remains deliberately enlarged on phones while returning to the accepted desktop density at the Medium/desktop breakpoint, and help tooltip content is constrained to the usable viewport width.

Medium retains touch-friendly controls and additional horizontal breathing room. Expanded preserves the accepted desktop composition. Wide constrains readable content width instead of stretching the workspace indefinitely.

## Accessibility and resilience

I preserve or implement:

- visible `:focus-visible` treatment;
- practical Compact touch targets;
- keyboard-operable controls and semantic buttons/links;
- shared Tabs with one active tab stop, `ArrowLeft`/`ArrowRight` navigation, `Home`/`End`, cyclic movement, RTL-aware direction, focus movement, and automatic activation;
- semantic radio state for note-color selection;
- semantic checkbox state for note-label assignment;
- adaptive focus and target-size coverage for `menuitem`, `menuitemradio`, and `menuitemcheckbox` roles;
- adaptive target-size and focus coverage for semantic `option` roles on Compact and Medium surfaces;
- forced-colors Canvas/focus treatment for select content and options;
- forced-colors selected-state treatment for the active shared tab;
- visually compact Settings switches with expanded Compact/Medium hit targets and explicit focus treatment;
- visually compact checkbox and radio controls with expanded Compact/Medium hit targets and explicit normal/forced-colors focus treatment;
- keyboard-focusable, explicitly labeled Settings help buttons instead of SVG-only tooltip triggers;
- enlarged Compact Settings help targets with desktop-density restoration;
- viewport-safe Settings help tooltip width;
- portal-safe dialog, sheet, menu, popover, select, and tooltip resilience even when Base UI mounts the surface outside `.gc-app-shell`;
- Compact/Medium dialog and sheet close controls inside the same practical target contract as other interactive controls;
- reduced-motion behavior that removes nonessential motion on both portaled popup elements and their descendants;
- increased-contrast treatment;
- forced-colors support with Canvas-backed portaled Overlay surfaces;
- viewport-safe dialog/menu/popover/select sizing;
- safe-area handling for mobile sheets, clients, and installed PWAs;
- readable solid fallbacks when layered visual effects are not suitable.

## Security and privacy boundary

GoreeCloud Memos does not execute the inherited instance `additional_script` or `additional_style` fields in the browser. The GoreeCloud Settings interface does not expose arbitrary-code editors, and the API rejects nonempty values for those fields. This intentionally prevents stored administrative customization from becoming arbitrary JavaScript execution, UI spoofing, unreviewed remote-resource loading, or a bypass around the Glaze UI presentation contract.

Instance branding remains customizable within a bounded local-asset model. Custom logos must use a root-relative path served by the current Memos origin; absolute URLs, protocol-relative URLs, backslash-based paths, `data:`/`javascript:`-style values, and other externally resolved assets are rejected. Unsafe legacy values fail closed in the client to the canonical `/goreecloud-memos.svg` asset. Profile title, description, and logo-path lengths are bounded in both the user interface and server validation.

The dependency baseline is fail-closed rather than advisory-only. The frontend lock resolves the patched GoreeCloud-selected React Router, Vite, Nano ID, and PostCSS releases required by the current security gate. The backend uses Go 1.26.6 and fixed networking, text, image, and gRPC modules. PostgreSQL access no longer depends on `lib/pq`; production and integration-test `database/sql` paths use `pgx/v5/stdlib`, and retryable PostgreSQL transaction errors use `pgconn.PgError` SQLSTATE handling. Migration and upgrade helpers retain their complete SQLite/MySQL/PostgreSQL coverage after the driver replacement.

The GoreeCloud container defaults to the fixed unprivileged `nonroot` identity instead of starting the application as root. The entrypoint retains its explicit privilege-drop path only for an operator who deliberately overrides the image user to root for a controlled legacy-volume ownership migration. This preserves normal least-privilege execution without silently removing the documented recovery path.

The repository includes a dedicated `GoreeCloud Security` workflow. It performs a production-only pnpm advisory audit at HIGH severity or above, Go reachable-vulnerability analysis with a pinned `govulncheck`, a pinned Trivy filesystem scan for HIGH/CRITICAL vulnerabilities, secrets, and misconfigurations, and CycloneDX SBOM generation. Designated findings fail the workflow rather than being treated as informational only. Backend and upgrade workflows use the same patched Go toolchain baseline so a scanner requirement cannot diverge from the compiler and migration gates.

Glaze UI does not add analytics, trackers, remote font delivery, remote icon delivery, advertising, or presentation-only third-party telemetry. New remote integrations remain outside the presentation layer and require separate functional, privacy, and security review.

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

The frontend regression suite includes `web/tests/goreecloud-glaze-adaptive.test.ts` and `web/tests/goreecloud-security-hardening.test.ts`. Together they verify that the adaptive layer is loaded after the base Glaze layers, the four official adaptive ranges are present, Compact readability/touch/safe-area requirements remain present, semantic controls remain inside adaptive focus/target treatment, Settings help remains viewport-safe and keyboard accessible, portaled Overlay surfaces retain Glaze adaptive and resilience coverage, shared Tabs retain roving keyboard semantics and Compact containment, the browser shell cannot recreate arbitrary instance script/style injection, unsafe branding URLs fail closed, and profile customization remains bounded to local GoreeCloud assets.

Backend regression coverage verifies the corresponding General-setting policy: arbitrary custom code, remote/protocol-relative or malformed branding paths, empty profile titles, and oversized branding metadata are rejected while canonical/local root-relative assets remain accepted. PostgreSQL integration and retryable-transaction tests exercise the pgx driver path while Upgrade Smoke retains migration/fresh-install coverage for SQLite, MySQL, and PostgreSQL.

Existing GoreeCloud Memos frontend, backend, Trash, draft-label, PWA, mobile-action, container, security, and upgrade validation remain required alongside this conformance evidence.

## Manual visual acceptance gates

Before a new Stable source release or production deployment, I still require manual visual acceptance for the affected source revision on representative supported surfaces:

- Compact Android device: Memos feed, drawer, new-memo composer with labels, Trash with Delete all, Settings, Members, Notifications, tabs, switches, menus, selects, dialogs, sheets, local profile branding, keyboard resize, and safe areas.
- Linux desktop client: feed/grid, Archive, Trash, Attachments, Settings, About, local profile branding, light/dark appearance, resize/maximize/restore, pointer/keyboard focus behavior, tab keyboard navigation, and portaled overlay presentation.
- Web/PWA: canonical/local favicon identity, responsive breakpoints, light/dark appearance, keyboard access, tab keyboard navigation, portaled overlay resilience, and the same source behaviors used by the native shells.

The accepted GoreeCloud Memos application icon must remain unchanged unless a later explicit branding decision replaces the canonical product identity.

## Stable-release boundary

I will not call a revision Glaze-complete or security-ready merely because it has rounded cards, glass effects, or a scanner workflow. Stable acceptance requires exact-head frontend, backend, container, security, and upgrade validation; manual visual acceptance on the affected form factors; no unresolved material security findings or regressions; preserved product identity and quick-capture scope; and a separately controlled production deployment when production is intended to change.
