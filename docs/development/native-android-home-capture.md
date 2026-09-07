# Native Android Home and Capture Foundation

## Status

Development candidate only. This document does not describe the accepted web/server v0.1.3 runtime as changed, replaced, migrated, or redeployed.

## Why this exists

The retained Android Tauri client intentionally renders the canonical GoreeCloud Memos web application and therefore inherits browser-oriented composition and interaction behavior. The original native rebuild now establishes a separate Android-native product surface so Android acceptance can be based on native behavior rather than on how convincingly a responsive web interface fits inside an app container.

## Native boundary

The first slice is Kotlin + Jetpack Compose. It does not contain a WebView or `android.webkit`, request the Android `INTERNET` permission, or embed `https://memos.goreecloud.com`. It uses a `ComponentActivity`, edge-to-edge Android presentation, a ViewModel state holder, Compose Back handling, native IME focus, Material/Compose controls, and a native staggered-grid Home surface.

The runtime starts with no synthetic production memos. A user can create cards during the Development session, but those cards are intentionally in-memory only and disappear when process state is lost. This prevents a UI prototype from silently becoming an unreviewed second data store or synchronization system.

## Home and Quick Capture

The Home surface keeps quick capture immediately available, uses a full-line composer above adaptive memo cards, and uses a 168 dp minimum staggered-card width so ordinary phone widths can show multiple short memos where Android layout space allows. Content drives card height. Pinned session memos remain prioritized above ordinary session memos.

The collapsed composer is at least 48 dp high. Expanding it requests native text focus and opens the software keyboard. Android Back collapses the expanded composer while preserving the Activity-scoped draft; explicit Cancel clears it. Save trims content, refuses blank drafts, creates one session-only memo, clears the draft, and closes the composer.

## GLAZE UI V1.1 mapping

The consumed native subset targets exact GLAZE UI V1.1 Stable source revision `15cc76d2bcd4065552dc31c77145b63f34d9e7b2`:

- structural spacing: 4, 8, 12, 16, 20, 24, 32, 48, and 64 dp;
- structural radii: 12, 20, and 28 dp plus pill geometry;
- separate V1.1 optical geometry: 8, 16, 24, and 32 dp plus capsule;
- normal touch-oriented interaction floor: 48 dp;
- Touch Assistance target token: 56 dp;
- Light/Dark semantic surface mappings adapted through Android Material 3;
- an explicit V1.1 Deep Dark source palette that is not automatically selected by Android system dark mode; and
- a bounded non-semantic Deep Teal + Soft Amber atmosphere source contract that is not rendered by the Home/Capture surface.

The current `GlazeTheme` remains binary at runtime: Android system appearance selects Light or Dark only. Selecting Deep Dark requires a separately reviewed appearance policy. `GlazeAtmosphere` is source capability only and cannot observe memo text, draft text, queued shares, editor metadata, location, time, weather, account state, or platform security/privacy state. Environmental Color Memory, remote derivation, persistent samples, and semantic inference remain disabled.

This mapping is a source foundation, not complete consumer acceptance. Complete rendered visual acceptance, runtime Deep Dark policy, complete semantic/state mappings, motion, reduced-transparency/increased-contrast/native forced-colors equivalents, screen-reader and switch-access acceptance, 200% text/reflow, RTL/localization, foldables/tablets, representative devices, Touch Assistance mode, Human Visual Excellence, release, production approval, and Stable qualification remain acceptance gates.

## Security, privacy, and platform limits

This slice introduces no network, telemetry, credentials, Identity implementation, Wardveil acceptance, Privacy Shield acceptance, Everkeep authority, Mesh capability, Manager registration, production API, or native attachment path. It cannot read the accepted production memo library and cannot write any persistent memo state.

The Development application ID is deliberately isolated as `com.goreecloud.memos.native.dev` so the prototype can coexist with the transitional Tauri package during device comparison. This does not settle final production package migration or signing.

## Next native milestones

Later reviewed slices can bind the UI to authorized owner-scoped native data, introduce real native editing/search/labels/Archive/Trash, add Android share/reminder/attachment integrations, and design an approved local-first/offline queue. Each such step must preserve explicit Identity ownership, Privacy Shield data minimization, Wardveil controls, Everkeep recovery semantics, migration safety, and the separation between Development evidence and production acceptance.
