# GoreeCloud Memos Clients

This directory contains the first-party GoreeCloud Memos Linux desktop and Android client shell.

## Role

The client provides a native application container for the existing self-hosted GoreeCloud Memos service at `https://memos.goreecloud.com`.

It intentionally does **not** create a second memo database, duplicate sync engine, or separate authentication model. The web application and the Linux/Android clients use the same GoreeCloud Memos server as their source of truth.

## Architecture

- Framework: Tauri 2
- Current client acceptance candidate: `0.1.1`
- Linux target: AppImage and Debian package
- Android target: APK
- Application identifier: `com.goreecloud.memos`
- Remote application origin: `https://memos.goreecloud.com`
- Native IPC exposed to remote content: none
- Allowed top-level navigation: the canonical GoreeCloud Memos HTTPS origin only, plus `about:blank`
- New webview windows: denied by the native shell

The native shell is deliberately small. Product UI, Glaze UI behavior, authentication, memo editing, labels, archive/trash behavior, Wardveil Security presentation, and server communication remain in the maintained GoreeCloud Memos web application.

Because the shell loads the canonical live service, a client APK can be newer than the web runtime it displays. Device acceptance must therefore verify both the installed native client version and the GoreeCloud Memos build identity shown by the web application.

## Product icon

`../../web/public/goreecloud-memos.svg` is the canonical GoreeCloud Memos application icon source for every client surface.

- Web uses the SVG directly as the primary favicon and committed raster derivatives for browser/PWA and Apple touch-icon compatibility.
- Linux packaging runs Tauri's pinned `icon` command from that same SVG before creating AppImage and Debian bundles.
- Android runs Tauri's pinned `icon` command after Android project initialization so launcher resources are generated from the same SVG rather than a framework or platform default.
- Client CI fails if the expected Linux icon outputs or Android launcher resources are not generated.
- Frontend identity regression coverage verifies that web/PWA and native packaging remain anchored to this canonical source.

The icon is intentionally text-free and uses the Memos quick-capture document motif with GoreeCloud Glaze UI geometry and blue surface semantics. Platform launchers may apply their own icon mask, but the product symbol and source identity remain the same.

The `0.1.1` acceptance candidate intentionally increments the native package version so Android treats it as a new application update and regenerates launcher resources from the canonical icon. If a launcher continues to show a cached older icon after updating, uninstalling the prior debug build before reinstalling is an acceptable test-only cache reset.

## Security boundary

The client is a constrained presentation shell, not a privileged native extension of the web application.

- It allows top-level navigation only to `https://memos.goreecloud.com` and `about:blank`.
- HTTP downgrade, look-alike hosts, and unrelated origins are rejected by native navigation tests.
- New webview windows are denied instead of silently creating an unrestricted secondary browser surface.
- No native IPC command is intentionally exposed to the remote Memos application.
- The same GoreeCloud Memos authentication, authorization, data-protection, Glaze UI, and Wardveil Security controls remain authoritative.

## Current release boundary

- The client requires network access to the GoreeCloud Memos service.
- When the service is private through GoreeCloud networking, the device must already have the required NetBird/private-DNS access.
- External links that request a new browser window are currently denied by the shell rather than handed off to the platform browser.
- Offline drafts and native share-sheet capture are not part of this thin-shell client role.
- Android CI creates a debug APK for direct device acceptance. Stable Android distribution requires a protected GoreeCloud signing key supplied through repository secrets; keystore material and passwords must never be committed to source control.
- Linux and Android acceptance artifacts include SHA-256 checksum manifests plus the SHA-256 of the canonical icon source used by the packaging workflow.

## Linux development and build

Install the current Tauri Linux prerequisites for your distribution, then run from this directory:

```bash
cargo install tauri-cli --version 2.11.4 --locked
cargo tauri icon ../../web/public/goreecloud-memos.svg
cargo test --manifest-path src-tauri/Cargo.toml
cargo tauri build --bundles appimage,deb
```

Expected bundles are written beneath:

```text
src-tauri/target/release/bundle/appimage/
src-tauri/target/release/bundle/deb/
```

## Android development and build

Configure the Android SDK, NDK, Java, and Rust Android target first. Then run:

```bash
cargo install tauri-cli --version 2.11.4 --locked
cargo tauri android init --ci --skip-targets-install
cargo tauri icon ../../web/public/goreecloud-memos.svg
cargo tauri android build --debug --apk --target aarch64
```

The generated Android project is intentionally not committed. Tauri recreates it from the controlled Rust/configuration source, and CI uploads the resulting APK as a workflow artifact.

## Device acceptance

For an Android acceptance pass, verify at minimum:

- The APK installs and launches as GoreeCloud Memos.
- The launcher uses the canonical GoreeCloud Memos icon.
- Sign-in, memo feed, drawer navigation, search, attachments, settings, Archive, and Trash render correctly.
- The Wardveil Security account group is readable and correctly scoped to evidenced protections.
- The About surface reports the expected deployed GoreeCloud Memos build identity.
- Draft labels and Trash `Delete all` are visible when the deployed server version contains those features.
- Phone typography and touch targets are comfortable without system-level display scaling workarounds.
- Keyboard resizing, Android Back behavior, lifecycle resume, attachment opening/downloading, and external-link handling are checked before Stable release approval.

For Linux acceptance, verify the AppImage application/launcher icon, window identity, core quick-capture workflows, Wardveil account group, resize behavior, keyboard/pointer accessibility, and package checksum before Stable approval.

## Validation

The `GoreeCloud Memos Clients` GitHub Actions workflow performs:

- Native desktop/Android icon generation from the canonical GoreeCloud Memos SVG.
- Fail-closed verification that expected Linux and Android launcher resources were generated.
- Rust unit tests for the client navigation boundary.
- Linux AppImage and Debian package builds on Ubuntu 22.04.
- Android target initialization.
- Android ARM64 debug APK build for direct device testing.
- SHA-256 checksum generation for packaged artifacts and the canonical icon source.
- Artifact upload for both platforms.
