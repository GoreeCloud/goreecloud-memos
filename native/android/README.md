# GoreeCloud Memos Native Android — Development Foundation

This directory is the first committed Android-native application foundation for the original GoreeCloud-owned GoreeCloud Memos rebuild.

## Product direction

The long-term Android product is native Android software, not a WebView, Tauri presentation shell, PWA wrapper, or embedded copy of `https://memos.goreecloud.com`. The retained Tauri client remains transition, compatibility, and rollback material while this native line is developed and accepted separately.

The foundation uses Kotlin, Jetpack Compose, Android lifecycle/ViewModel state, Android Back handling, native IME focus, edge-to-edge system presentation, native staggered cards, and Android resources. GLAZE UI V1.1 is mapped into these Android-native patterns rather than reproducing the web layout.

## Current Home/Capture surface

The surface provides:

- a native Android top app bar and edge-to-edge Activity;
- a collapsed quick-capture surface that expands into a native text editor;
- native Back behavior that collapses the composer while preserving its current process draft;
- explicit Cancel behavior that discards the transient draft;
- Save into bounded app-private local Development storage;
- native staggered memo cards with content-driven heights and a 168 dp adaptive minimum card width;
- local pin/unpin prioritization whose saved-card state is persisted atomically;
- a visible storage/recovery warning when the bounded local saved-card store cannot be read or safely written;
- GLAZE UI V1.1 Light/Dark foundation colors, inherited 4/8/12/16/20/24/32/48/64 dp structural spacing, 12/20/28 dp structural radius tiers, separate 8/16/24/32 dp optical geometry plus capsule, 48 dp normal targets, and a 56 dp Touch Assistance target token; and
- an explicit V1.1 Deep Dark source palette plus a bounded non-semantic Deep Teal + Soft Amber atmosphere source contract that are not automatically selected or rendered by the current Home/Capture surface.

## Saved-card local persistence

Explicitly saved native memo cards now survive Activity replacement and application-process restart through one app-private, versioned `AtomicFile` store. The store is a Development-only local authority and is not the production GoreeCloud Memos library.

The persistence boundary is intentionally narrow:

- only saved card ID, body, order, and pin state are written;
- draft text and queued Android share payloads remain process-memory only;
- the format is versioned and validates unique nonblank IDs, nonblank memo bodies, UTF-8 decoding, pin-state values, record shape, and upper bounds before accepting data;
- the current implementation limits the store to 5,000 saved cards, 1 MiB per memo body, 512 bytes per local ID, and 16 MiB total encoded file size;
- writes use Android `AtomicFile` plus file-descriptor sync so a failed replacement can roll back to the prior complete file;
- a malformed, unsupported, or oversized existing store fails closed into a visible recovery-required state rather than being silently overwritten; and
- transient write failure leaves the previous accepted UI/store state intact and surfaces a retryable local-storage warning.

This store has no network, server, GoreeCloud Identity, synchronization, attachment, backup, migration, or production memo-library authority. It is not yet an Everkeep backup/restore implementation; durable local storage and platform continuity are separate responsibilities.

## Android-native capture entry points

The Development package accepts Android `ACTION_SEND` with MIME type `text/plain`. Shared text opens the same native quick composer; no separate browser or share UI exists. If a user already has a nonblank draft, incoming shared text is queued in memory rather than overwriting the draft. Saving or explicitly canceling the current draft advances the oldest queued share into the composer. Duplicate queued payloads are ignored.

The app also publishes a static launcher shortcut named **New memo**. The shortcut targets the Development application ID and opens the same quick composer with no synthetic content. `MainActivity` uses `singleTop` and handles new intents so these entry points work both for a cold launch and while the native Activity is already open.

These entry points are text-only. They do not accept file streams, request storage access, create background services, start sync, or gain production memo authority. Incoming share text remains volatile until the user explicitly saves it.

## Deliberate authority limits

This line has **no** production memo authority. It does not load or mutate the accepted GoreeCloud Memos web/server v0.1.3 runtime. It has no network permission, WebView, embedded production URL, native server API, GoreeCloud Identity session, synchronization engine, attachment transfer, reminder scheduling, production durable queue, backup/restore path, or migration authority.

Explicitly saved cards are now durable only inside the Development application's private local store. Drafts and queued text shares remain process-memory only. The visible Development notice distinguishes these lifetimes so local persistence is not mistaken for production synchronization or server-backed durability.

The Development application ID is `com.goreecloud.memos.native.dev`, while Kotlin source remains under the canonical `com.goreecloud.memos` namespace. This lets the native Development package coexist with the transitional `com.goreecloud.memos` Tauri package during physical-device comparison. A production native package identity is not established by this foundation.

## GLAZE UI acceptance boundary

Source maps the currently consumed foundation subset to GLAZE UI V1.1 (`1.1.0`) at exact Stable source revision `15cc76d2bcd4065552dc31c77145b63f34d9e7b2`. Android system appearance currently selects only the mapped Light or Dark scheme. The explicit Deep Dark palette is source capability only until a separately reviewed runtime appearance policy selects it.

`GlazeAtmosphere` similarly defines bounded non-semantic Deep Teal + Soft Amber source values but is not consumed by `HomeScreen`. It cannot inspect memo text, draft text, queued shares, editor metadata, location, time, weather, identity state, privacy/security state, or other user/environmental content, and it does not enable Environmental Color Memory, remote derivation, sample persistence, or semantic inference.

This remains a source-level consumer foundation only. Complete rendered visual acceptance, runtime Deep Dark policy, reduced-transparency/increased-contrast and other accessibility/resilience equivalents, complete semantic-color/state coverage, motion evaluation, screen-reader acceptance, large-font/200% text acceptance, RTL/localization, adaptive/foldable behavior, Touch Assistance mode, Human Visual Excellence review, representative physical-device acceptance, release, production approval, and Stable qualification remain open.

## Validation and acceptance artifact

`native/android/scripts/check_native_android.py` fails closed if the source gains WebView/`android.webkit` usage, the Android manifest requests `INTERNET`, the production web origin is embedded, the Development package identity changes, the Android SDK baseline drifts, required V1.1 target metadata drifts, the Deep Dark/optical/atmosphere source boundary regresses, the atmosphere contract becomes a Home renderer dependency, the native Home loses its Compose staggered-card/Back/IME-focus contracts, the saved-card local-persistence boundary disappears, or the native text-share/New-memo entry points disappear.

Android CI runs native-boundary validation, platform-integration validation, lint, JVM unit tests, a debug APK build, and handheld-emulator acceptance. A successful exact-head run stages the APK with `BUILD-PROVENANCE.txt` and a verified `SHA256SUMS` file, then uploads the set as `goreecloud-memos-native-android-dev`; emulator test evidence is uploaded separately. Provenance binds the evidence to the exact source SHA, Development version, `.native.dev` package identity, workflow run, and the Development-only local-authority boundary.

This artifact exists for controlled side-by-side Development acceptance against the transitional Tauri client. It is not a signed Stable Android release and does not authorize production data binding, migration, deployment, or replacement of the retained client.
