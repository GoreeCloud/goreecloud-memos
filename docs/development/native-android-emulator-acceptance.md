# Native Android Emulator Acceptance

Status: Development acceptance candidate

## Purpose

This checkpoint adds GoreeCloud Memos-owned Android instrumentation coverage to the existing native Home/Capture Development line. It is intended to prove a small set of application-specific behaviors on an actual Android runtime instead of relying only on source assertions, JVM tests, lint, and APK assembly.

The test scope is deliberately narrower than full GLAZE UI V1.1 application acceptance and narrower than representative physical-device acceptance.

## Runtime scope

The emulator suite launches the Development package `com.goreecloud.memos.native.dev` and verifies:

- the native Home surface exposes the explicit session-only Development boundary;
- the quick-capture composer can expand, accept text, and save one session-only memo card;
- Android Back collapses the expanded composer without discarding the current draft;
- an Android `ACTION_SEND` `text/plain` intent enters the same native composer.

The tests use the existing `MainActivity`, Compose Home surface, `HomeViewModel`, and Android intent handling. They do not substitute a test-only product implementation.

## CI environment

The repository workflow creates a clean Android handheld emulator from `system-images;android-35;google_apis;x86_64`, disables system animation scales for deterministic interaction, and runs `:app:connectedDebugAndroidTest` against the exact pull-request head.

The workflow creates a self-verifying evidence artifact containing Android test results, available HTML reports, emulator logs, exact source/build provenance, emulator SDK/size/density information, and SHA-256 checksums.

The workflow uses the repository's existing trusted checkout, Java, Gradle, and artifact-upload actions. It does not add a third-party Android-emulator action.

## Security, privacy, and data-authority boundary

This acceptance slice does not widen native application authority. The tested package still:

- requests no Android `INTERNET` permission;
- contains no WebView and embeds no production GoreeCloud Memos origin;
- uses no production credentials, GoreeCloud Identity session, memo repository, service API, synchronization, telemetry, attachment transfer, backup/restore, or migration path;
- keeps created memo cards and drafts only in current-process `HomeViewModel` memory; and
- does not contact or modify the accepted GoreeCloud Memos web/server production runtime.

The CI runner necessarily downloads Android/Gradle test dependencies and a system image as build infrastructure. That infrastructure access is not application production-network authority.

## Acceptance boundary

A passing emulator suite establishes only the four tested Development behaviors at the exact source revision. It does not establish:

- complete rendered GLAZE UI V1.1 conformance;
- Deep Dark runtime policy or acceptance;
- Reduced Transparency, Increased Contrast, Reduced Motion, 200% text/reflow, RTL/localization, TalkBack, Switch Access, or runtime Touch Assistance acceptance;
- tablet, foldable, multi-window, or broad adaptive-layout acceptance;
- representative physical-device ergonomics, share-sheet, launcher-shortcut, keyboard/IME, lifecycle, OEM, or Human Visual Excellence acceptance;
- GoreeCloud Identity, Wardveil Security, Privacy Shield, Everkeep, GoreeCloud Mesh, or Manager acceptance;
- production repository/API/synchronization/migration authority;
- protected release signing, distribution, deployment, release approval, production acceptance, or Stable qualification.

Those gates remain separately controlled and fail closed.
