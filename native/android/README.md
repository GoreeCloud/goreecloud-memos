# GoreeCloud Memos Native Android — Development Foundation

This directory contains the Android-native Development application for the original GoreeCloud-owned GoreeCloud Memos rebuild.

## Product direction

The long-term Android product is native Android software, not a WebView, Tauri presentation shell, PWA wrapper, or embedded copy of `https://memos.goreecloud.com`. The retained Tauri client remains transition, compatibility, and rollback material while this native line is developed and accepted separately.

The foundation uses Kotlin, Jetpack Compose, Android lifecycle/ViewModel state, Android Back handling, native IME focus, edge-to-edge presentation, native staggered cards, and Android resources. Current Stable GLAZE UI V1.4 is mapped into these native patterns rather than reproducing the web layout.

## Current Home/Capture surface

The Development surface provides:

- a native top app bar and edge-to-edge Activity;
- quick capture that expands into a native text editor;
- native Back behavior that collapses the composer while preserving the process draft;
- explicit Cancel behavior for transient drafts;
- Save into bounded app-private local Development storage;
- native staggered memo cards with content-driven heights;
- local pin/unpin prioritization persisted atomically;
- local `Find saved memos` filtering over already-loaded cards with Unicode-normalized, locale-stable, multi-term semantics;
- a process-memory-only prepared filter snapshot that reuses normalized memo bodies while the saved-card list is unchanged;
- a visible storage/recovery warning when the local saved-card store cannot be read or safely written;
- GLAZE UI V1.4 source authority with inherited structural spacing, radii, optical geometry, 48 dp normal targets, and a 56 dp Touch Assistance target;
- deterministic Light/Dark fallback plus explicit Deep Dark source capability;
- inherited fail-closed Adaptive Resonance policy; and
- a separate V1.4 Optical Intelligence policy whose runtime adapters remain inactive/unaccepted.

## Saved-card local persistence

Explicitly saved native memo cards survive Activity replacement and application-process restart through one app-private, versioned `AtomicFile` store. This store is Development-only local authority and is not the production GoreeCloud Memos library.

The persistence boundary remains narrow:

- only saved card ID, body, order, and pin state are durable;
- draft text and queued Android share payloads remain process-memory only;
- the format validates unique/nonblank IDs, nonblank bodies, UTF-8, record shape, pin state, memo count, field sizes, and total encoded size;
- current bounds are 5,000 saved cards, 1 MiB per memo body, 512 bytes per local ID, and 16 MiB encoded file size;
- writes use Android `AtomicFile` and file-descriptor sync;
- malformed, unsupported, or oversized existing storage fails closed into a visible recovery-required state; and
- transient write failure preserves the prior accepted UI/store state.

This local store has no network, server, GoreeCloud Identity, synchronization, attachment, backup, migration, or production memo-library authority. It is not an Everkeep backup/restore implementation.

## Local saved-memo retrieval boundary

`HomeMemoFilterSnapshot` is a process-memory-only prepared view of the already-loaded saved cards. When the saved-card list changes, Home prepares a fresh snapshot and normalizes each memo body once. Query edits then reuse those normalized bodies while continuing to normalize the query, collapse Unicode separator whitespace, deduplicate repeated terms, require every query term, and preserve the existing card order.

The snapshot is deliberately not a persistent search index. It stores no query history, performs no semantic ranking or inference, contacts no service, emits no telemetry, and has no GoreeCloud Index/Search authority. JVM regression coverage exercises repeated filtering at the current 5,000-card local-store ceiling without using wall-clock thresholds. That source/test coverage does not establish representative-device latency, memory, thermal, or degradation acceptance; those measurements remain part of MR-006/MR-005 device work.

## Android-native capture entry points

The Development package accepts Android `ACTION_SEND` with MIME type `text/plain`. Shared text enters the same native quick composer. If a nonblank draft already exists, incoming shared text is queued in memory instead of overwriting the draft. Duplicate queued payloads are ignored.

The app also publishes a static **New memo** launcher shortcut. `MainActivity` uses `singleTop` and handles new intents so capture works on cold launch and while the Activity is already open.

These entry points are text-only. They do not accept file streams, request storage access, create background services, start sync, or gain production authority. Incoming share text remains volatile until the user saves it.

## Deliberate authority limits

This line has **no** production memo authority. It does not load or mutate the accepted GoreeCloud Memos web/server runtime. It has no network permission, WebView, embedded production URL, native server API, GoreeCloud Identity session, synchronization engine, attachment transfer, reminder scheduling, production queue, backup/restore path, or migration authority.

The Development application ID is `com.goreecloud.memos.native.dev`; Kotlin source remains under `com.goreecloud.memos`. This allows controlled side-by-side Development comparison with the transitional package. A production native package identity is not established here.

## GLAZE UI V1.4 source boundary

Native source targets **GLAZE UI V1.4 / `1.4.0` — Optical Intelligence** at exact Stable revision `84cb3db4884042f0fa25ed6d475a127fb110f596`.

V1.4 inherits the V1.3 token system and public component baseline. Memos therefore preserves the established geometry and Adaptive Resonance restrictions instead of inventing replacement tokens merely to change versions.

`GlazeAdaptivePolicy` retains accessibility/semantic-first color precedence, protected semantic roles, reachability review bands, and disabled user/context/environment adapters. `GlazeOpticalPolicy` separately records the V1.4 contract:

- the shared Optical Engine is local and deterministic;
- telemetry, camera access, and remote context are not required;
- environmental memory tint influence is capped at `0.08`;
- Forced Colors and Reduced Transparency require solid-accessible behavior;
- Increased Contrast suppresses decorative tint/warmth;
- optical context cannot outrank accessibility or carry semantic/product authority; and
- memo content, drafts, queued shares, Identity state, and privacy/security/recovery state are prohibited optical sampling sources in this Development mapping.

The current `HomeScreen` consumes neither `GlazeAdaptivePolicy`, `GlazeOpticalPolicy`, nor `GlazeAtmosphere`. The renderer stays on deterministic mapped Light/Dark/explicit Deep Dark source behavior. V1.4 source support does not authorize context inspection or Optical Engine activation.

## GLAZE UI acceptance boundary

This is a V1.4 **source migration**, not application conformance. Earlier V1.3 source/build/emulator evidence remains historical and is not reused as V1.4 acceptance.

V1.4.0 Stable explicitly defers human/manual/physical-device validation to V1.4.1. Native Memos therefore does **not** claim passed physical-device, manual assistive-technology, human optical-finish, Human Visual Excellence, or representative real-device performance acceptance.

Fresh exact-revision evidence is still required for rendered/native visual behavior; interaction; accessibility/resilience; any Optical Engine/Personalization adapter; adaptive phone/tablet/foldable composition; product workflows; representative performance/degradation; V1.4.1 human validation; rollback; release; and explicit production approval.

Privacy Shield, Wardveil Security, GoreeCloud Identity, Everkeep, Mesh, Manager, controlled migration, protected signing/provenance, Release Candidate qualification, deployment, production acceptance, and Stable qualification remain independently blocked.

## Validation and acceptance artifact

`native/android/scripts/check_native_android.py` fails closed if the source gains WebView/`android.webkit`, requests `INTERNET`, embeds the production web origin, changes the Development package identity, drifts from the Android SDK baseline or exact V1.4 authority, regresses geometry/target floors, activates unaccepted adaptive/optical authority, lets Home consume atmosphere/adaptive/optical context, or loses the existing native capture/local-persistence contracts.

Android CI runs native-boundary validation, platform-integration validation, lint, JVM tests, debug APK build, and handheld-emulator acceptance. Generated artifacts/provenance remain Development evidence only.

Passing automated checks validates only the source/build/emulator tranche exercised. It does not substitute for V1.4/V1.4.1 application, physical-device, accessibility, human-visual, production, or Stable acceptance.
