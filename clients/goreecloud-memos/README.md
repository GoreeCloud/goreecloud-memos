# GoreeCloud Memos Clients

This directory contains the first-party GoreeCloud Memos Linux desktop and Android client shell.

## Role

The client provides a native application container for the existing self-hosted GoreeCloud Memos service at `https://memos.goreecloud.com`.

It intentionally does **not** create a second memo database, duplicate sync engine, or separate authentication model. The web application and the Linux/Android clients use the same GoreeCloud Memos server as their source of truth.

## Architecture

- Framework: Tauri 2
- Linux target: AppImage and Debian package
- Android target: APK
- Application identifier: `com.goreecloud.memos`
- Remote application origin: `https://memos.goreecloud.com`
- Native IPC exposed to remote content: none
- Allowed top-level navigation: the canonical GoreeCloud Memos HTTPS origin only, plus `about:blank`
- New webview windows: denied by the native shell

The native shell is deliberately small. Product UI, Glaze UI behavior, authentication, memo editing, labels, archive/trash behavior, and server communication remain in the maintained GoreeCloud Memos web application.

## Current limitations

- The client requires network access to the GoreeCloud Memos service.
- When the service is private through GoreeCloud networking, the device must already have the required NetBird/private-DNS access.
- External links that request a new browser window are currently denied by the shell rather than handed off to the platform browser.
- Offline drafts and native share-sheet capture are not part of this initial client foundation.
- Android CI currently creates a debug APK for direct testing. Stable release signing must use a protected GoreeCloud signing key supplied through repository secrets and must never commit keystore material.

## Linux development and build

Install the current Tauri Linux prerequisites for your distribution, then run from this directory:

```bash
cargo install tauri-cli --version 2.11.4 --locked
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
cargo tauri android build --debug --apk --target aarch64
```

The generated Android project is intentionally not committed. Tauri recreates it from the controlled Rust/configuration source, and CI uploads the resulting APK as a workflow artifact.

## Validation

The `GoreeCloud Memos Clients` GitHub Actions workflow performs:

- Rust unit tests for the client navigation boundary.
- Linux AppImage and Debian package builds on Ubuntu 22.04.
- Android target initialization.
- Android ARM64 debug APK build for direct device testing.
- Artifact upload for both platforms.
