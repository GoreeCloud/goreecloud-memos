# GoreeCloud Memos Native Android — Development Foundation

This directory is the first committed Android-native application foundation for the original GoreeCloud-owned GoreeCloud Memos rebuild.

## Product direction

The long-term Android product is native Android software, not a WebView, Tauri presentation shell, PWA wrapper, or embedded copy of `https://memos.goreecloud.com`. The retained Tauri client remains transition, compatibility, and rollback material while this native line is developed and accepted separately.

The foundation uses Kotlin, Jetpack Compose, Android lifecycle/ViewModel state, Android Back handling, native IME focus, edge-to-edge system presentation, native staggered cards, and Android resources. GLAZE UI V1.3 is mapped into these Android-native patterns rather than reproducing the web layout.

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
- GLAZE UI V1.3 source authority with inherited 4/8/12/16/20/24/32/48/64 dp structural spacing, 12/20/28 dp structural radius tiers, separate 8/16/24/32 dp optical geometry plus capsule, 48 dp normal targets, and a 56 dp Touch Assistance target token;
- deterministic Light/Dark fallback colors plus explicit Deep Dark source capability; and
- a fail-closed V1.3 Adaptive Resonance policy covering color-authority precedence, protected semantic roles, compact reachability review bands, accessibility precedence, and disabled/unaccepted contextual adapters.

## Saved-card local persistence

Explicitly saved native memo cards survive Activity replacement and application-process restart through one app-private, versioned `AtomicFile` store. The store is a Development-only local authority and is not the production GoreeCloud Memos library.

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

Explicitly saved cards are durable only inside the Development application's private local store. Drafts and queued text shares remain process-memory only. The visible Development notice distinguishes these lifetimes so local persistence is not mistaken for production synchronization or server-backed durability.

The Development application ID is `com.goreecloud.memos.native.dev`, while Kotlin source remains under the canonical `com.goreecloud.memos` namespace. This lets the native Development package coexist with the transitional `com.goreecloud.memos` Tauri package during physical-device comparison. A production native package identity is not established by this foundation.

## GLAZE UI V1.3 source boundary

Native source now targets GLAZE UI V1.3 (`1.3.0`) at exact integrated implementation revision `fc7cc91d2eace8da2371371c2855c24cbcb326a1`, with Stable lifecycle authority explicitly anchored at `d68e408a9abd946a7fd1b30816a0e3876d8bf8bb`.

V1.3 inherits the V1.2 structural rendering baseline, so Memos preserves the established geometry instead of inventing replacement spacing/radii merely to change versions. `GlazeAdaptivePolicy` separately records V1.3 Adaptive Resonance behavior relevant to the native line: the default non-semantic Glaze accent, accessibility/semantic-first color precedence, protected product-truth roles, compact reachability review bands, and the rule that adaptive expression cannot carry authoritative semantic state.

Android system appearance currently selects only the deterministic mapped Light or Dark fallback scheme. Deep Dark remains an explicit source capability. Native user-accent/context-color/Personalization adapters are not accepted, so user/context accent application, environmental sampling, remote dynamic color, persistent color memory, and semantic inference remain disabled. `GlazeAtmosphere` remains unrendered and content-independent.

The current `HomeScreen` deliberately consumes neither `GlazeAdaptivePolicy` nor `GlazeAtmosphere`. Source support for V1.3 adaptive behavior is not runtime authority to inspect memo content, drafts, queued shares, editor metadata, location, time, weather, account state, privacy/security/recovery state, synchronization state, or other user/environmental content.

## GLAZE UI acceptance boundary

This is a V1.3 **source migration**, not application conformance. Earlier V1.1 emulator/rendering evidence is historical and is not reused as V1.3 acceptance.

Fresh exact-revision acceptance remains required for rendered/native visual behavior; touch/focus/selection/consequential-action interaction; accessibility/resilience including TalkBack, Switch Access, large text/reflow, RTL/localization, Reduced Motion, transparency/contrast equivalents; adaptive phone/tablet/foldable/multi-pane composition; any native Personalization/runtime appearance adapters; product workflows; representative performance/degradation; physical-device capture/share/shortcut/retrieval behavior; Human Visual Excellence; rollback; release; and explicit production approval.

Privacy Shield, Wardveil Security, GoreeCloud Identity, Everkeep, Mesh, Manager, controlled migration, protected signing/provenance, Release Candidate qualification, deployment, production acceptance, and Stable qualification remain independently blocked.

## Validation and acceptance artifact

`native/android/scripts/check_native_android.py` fails closed if the source gains WebView/`android.webkit` usage, the Android manifest requests `INTERNET`, the production web origin is embedded, the Development package identity changes, the Android SDK baseline drifts, required V1.3 exact anchors drift, inherited geometry/target floors regress, the adaptive policy gains unaccepted authority, the atmosphere/adaptive contracts become Home renderer dependencies, the native Home loses its Compose staggered-card/Back/IME-focus contracts, the saved-card local-persistence boundary disappears, or the native text-share/New-memo entry points disappear.

Android CI runs native-boundary validation, platform-integration validation, lint, JVM unit tests, a debug APK build, and handheld-emulator acceptance. A successful exact-head run stages the APK with `BUILD-PROVENANCE.txt` and a verified `SHA256SUMS` file, then uploads the set as `goreecloud-memos-native-android-dev`; emulator test evidence is uploaded separately. Provenance binds the evidence to the exact source SHA, Development version, `.native.dev` package identity, workflow run, and the Development-only local-authority boundary.

Passing those automated checks validates only the source/build/emulator tranche they exercise. It does not substitute for the fresh V1.3 rendered/accessibility/representative-device/Human Visual Excellence and production acceptance still required.

This artifact exists for controlled side-by-side Development acceptance against the transitional Tauri client. It is not a signed Stable Android release and does not authorize production data binding, migration, deployment, or replacement of the retained client.
