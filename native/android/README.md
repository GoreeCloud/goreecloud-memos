# GoreeCloud Memos Native Android — Development Foundation

This directory is the first committed Android-native application foundation for the original GoreeCloud-owned GoreeCloud Memos rebuild.

## Product direction

The long-term Android product is native Android software, not a WebView, Tauri presentation shell, PWA wrapper, or embedded copy of `https://memos.goreecloud.com`. The retained Tauri client remains transition, compatibility, and rollback material while this native line is developed and accepted separately.

The foundation uses Kotlin, Jetpack Compose, Android lifecycle/ViewModel state, Android Back handling, native IME focus, edge-to-edge system presentation, native staggered cards, and Android resources. GLAZE UI V1.0 is mapped into these Android-native patterns rather than reproducing the web layout.

## Current Home/Capture slice

The first surface provides:

- a native Android top app bar and edge-to-edge Activity;
- a collapsed quick-capture surface that expands into a native text editor;
- native Back behavior that collapses the composer while preserving its current draft in Activity-scoped state;
- explicit Cancel behavior that discards the transient draft;
- Save into session-only in-memory Development state;
- native staggered memo cards with content-driven heights and a 168 dp adaptive minimum card width;
- local pin/unpin prioritization for session memos;
- GLAZE UI V1.0 Light/Dark foundation colors, 4/8/12/16/20/24/32/48/64 dp spacing, 12/20/28 dp radius tiers, 48 dp normal targets, and a 56 dp touch-assistance target token.

## Deliberate authority limits

This slice has **no** production memo authority. It does not load or mutate the accepted GoreeCloud Memos web/server v0.1.3 runtime. It has no network permission, WebView, embedded production URL, native server API, database, file repository binding, GoreeCloud Identity session, synchronization engine, attachment transfer, reminder scheduling, share receiver, durable offline queue, backup/restore path, or migration authority.

Saved cards exist only in `HomeViewModel` memory for the current application process. The Development notice is visible in the UI so this limitation is not mistaken for production persistence.

The Development application ID is `com.goreecloud.memos.native.dev`, while Kotlin source remains under the canonical `com.goreecloud.memos` namespace. This lets the native Development package coexist with the transitional `com.goreecloud.memos` Tauri package during physical-device comparison. A production native package identity is not established by this foundation.

## GLAZE UI acceptance boundary

Source maps the currently consumed foundation subset to GLAZE UI V1.0 (`1.0.0`) at exact canonical source revision `70909bbdccad378fb7281ae1842e2f5beed64c38`. This is a source-level consumer foundation only. Deep Dark, reduced-transparency/increased-contrast equivalents, complete semantic-color/state coverage, animation/motion evaluation, screen-reader acceptance, large-font acceptance, adaptive/foldable behavior, Touch Assistance mode, Human Visual Excellence review, and representative physical-device acceptance remain open.

## Validation

`native/android/scripts/check_native_android.py` fails closed if the new source gains WebView/`android.webkit` usage, the Android manifest requests `INTERNET`, the production web origin is embedded, the Development package identity changes, the Android SDK baseline drifts, required V1 target metadata drifts, or the native Home loses its Compose staggered-card, Back, or IME-focus contracts.

Android CI also runs lint, JVM unit tests, and a debug APK build. Those gates establish Development source/build evidence only; they do not authorize release, migration, production deployment, or Stable qualification.
