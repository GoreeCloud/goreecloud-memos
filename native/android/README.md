# GoreeCloud Memos Native Android — Development Foundation

This directory is the first committed Android-native application foundation for the original GoreeCloud-owned GoreeCloud Memos rebuild.

## Product direction

The long-term Android product is native Android software, not a WebView, Tauri presentation shell, PWA wrapper, or embedded copy of `https://memos.goreecloud.com`. The retained Tauri client remains transition, compatibility, and rollback material while this native line is developed and accepted separately.

The foundation uses Kotlin, Jetpack Compose, Android lifecycle/ViewModel state, Android Back handling, native IME focus, edge-to-edge system presentation, native staggered cards, and Android resources. GLAZE UI V1.0 is mapped into these Android-native patterns rather than reproducing the web layout.

## Current Home/Capture surface

The surface provides:

- a native Android top app bar and edge-to-edge Activity;
- a collapsed quick-capture surface that expands into a native text editor;
- native Back behavior that collapses the composer while preserving its current draft in Activity-scoped state;
- explicit Cancel behavior that discards the transient draft;
- Save into session-only in-memory Development state;
- native staggered memo cards with content-driven heights and a 168 dp adaptive minimum card width;
- local pin/unpin prioritization for session memos;
- GLAZE UI V1.0 Light/Dark foundation colors, 4/8/12/16/20/24/32/48/64 dp spacing, 12/20/28 dp radius tiers, 48 dp normal targets, and a 56 dp touch-assistance target token.

## Android-native capture entry points

The Development package now accepts Android `ACTION_SEND` with MIME type `text/plain`. Shared text opens the same native quick composer; no separate browser or share UI exists. If a user already has a nonblank draft, incoming shared text is queued in memory rather than overwriting the draft. Saving or explicitly canceling the current draft advances the oldest queued share into the composer. Duplicate queued payloads are ignored.

The app also publishes a static launcher shortcut named **New memo**. The shortcut targets the Development application ID and opens the same quick composer with no synthetic content. `MainActivity` uses `singleTop` and handles new intents so these entry points work both for a cold launch and while the native Activity is already open.

These entry points are text-only. They do not accept file streams, request storage access, create background services, start sync, or gain production memo authority.

## Deliberate authority limits

This line has **no** production memo authority. It does not load or mutate the accepted GoreeCloud Memos web/server v0.1.3 runtime. It has no network permission, WebView, embedded production URL, native server API, database, file repository binding, GoreeCloud Identity session, synchronization engine, attachment transfer, reminder scheduling, durable offline queue, backup/restore path, or migration authority.

Saved cards, drafts, and queued text shares exist only in `HomeViewModel` memory for the current application process. The Development notice is visible in the UI so this limitation is not mistaken for production persistence.

The Development application ID is `com.goreecloud.memos.native.dev`, while Kotlin source remains under the canonical `com.goreecloud.memos` namespace. This lets the native Development package coexist with the transitional `com.goreecloud.memos` Tauri package during physical-device comparison. A production native package identity is not established by this foundation.

## GLAZE UI acceptance boundary

Source maps the currently consumed foundation subset to GLAZE UI V1.0 (`1.0.0`) at exact canonical source revision `70909bbdccad378fb7281ae1842e2f5beed64c38`. This is a source-level consumer foundation only. Deep Dark, reduced-transparency/increased-contrast equivalents, complete semantic-color/state coverage, animation/motion evaluation, screen-reader acceptance, large-font acceptance, adaptive/foldable behavior, Touch Assistance mode, Human Visual Excellence review, and representative physical-device acceptance remain open.

## Validation and acceptance artifact

`native/android/scripts/check_native_android.py` fails closed if the source gains WebView/`android.webkit` usage, the Android manifest requests `INTERNET`, the production web origin is embedded, the Development package identity changes, the Android SDK baseline drifts, required V1 target metadata drifts, the native Home loses its Compose staggered-card/Back/IME-focus contracts, or the native text-share/New-memo entry points disappear.

Android CI runs lint, JVM unit tests, and a debug APK build. A successful exact-head run stages the APK with `BUILD-PROVENANCE.txt` and a verified `SHA256SUMS` file, then uploads the set as `goreecloud-memos-native-android-dev`. The provenance binds the artifact to the exact source SHA, Development version, `.native.dev` package identity, workflow run, and session-only data-authority boundary.

This artifact exists for controlled side-by-side Development acceptance against the transitional Tauri client. It is not a signed Stable Android release and does not authorize production data binding, migration, deployment, or replacement of the retained client.
