# Native Android Capture Entry Points

## Status

Development candidate only. This continuation adds Android-native ways to reach the existing session-only quick composer and does not add production memo persistence, synchronization, migration, or release authority.

## Text share capture

The native Development Activity accepts Android `ACTION_SEND` for `text/plain` only. The Activity reads `Intent.EXTRA_TEXT`, trims blank-only shares, and converts nonblank text into a one-shot `NativeCaptureRequest`. No URI, file stream, clipboard read, browser surface, storage permission, network request, or background service is introduced.

If the current draft is blank, shared text becomes the active draft and the composer opens. If a nonblank draft already exists, the incoming value is placed in an in-memory FIFO queue without changing the current draft. Saving the current draft or explicitly canceling it advances the oldest queued capture into the composer. Additional distinct text shares are queued; duplicate queued payloads are not added again. The UI reports only the number of waiting shares and does not echo their contents outside the editor.

This behavior prevents an external Android share from silently overwriting an unsaved quick-capture draft.

## Launcher New memo shortcut

The Development package publishes a static Android application shortcut named `New memo`. It invokes `com.goreecloud.memos.action.NEW_MEMO` and opens the same Compose composer without prefilled text. The shortcut targets `com.goreecloud.memos.native.dev`, which is intentionally separate from the transitional Tauri package identity during Development acceptance.

`MainActivity` uses `singleTop` and handles `onNewIntent`, so both text sharing and New memo requests can enter an already-running Activity without creating a second browser or application surface.

## Native input and lifecycle boundary

The Activity explicitly uses `adjustResize` for the software keyboard, while the Compose editor retains native focus management and Back-to-collapse behavior. These source contracts are intended for later representative-device validation; source presence and CI do not prove physical IME, launcher, lifecycle, or accessibility acceptance.

## Authority limits

Shared text, current drafts, pending captures, and saved Development memo cards remain process-memory state. This feature does not introduce a database, native repository binding, server API, GoreeCloud Identity session, network permission, telemetry, attachments, durable queue, backup/restore, Wardveil acceptance, Privacy Shield acceptance, Everkeep authority, Mesh capability, Manager registration, production signing, or migration.

The accepted GoreeCloud Memos web/server v0.1.3 runtime and retained Tauri client are unchanged.

## Validation

Focused reducer tests verify blank-draft population, no overwrite of an existing draft, FIFO promotion after Save or Cancel, and duplicate pending-share suppression. Static Android validation requires the text-share manifest filter, launcher shortcut metadata/action, and explicit `Intent.ACTION_SEND` / `Intent.EXTRA_TEXT` handling while continuing to reject WebView, `android.webkit`, the production web origin, and Android `INTERNET` permission.
