# GoreeCloud Memos — Features

GoreeCloud Memos is the lightweight GoreeCloud quick-note product. This list separates the accepted production web/server application from later source work and native-client acceptance candidates.

## Current production features — Stable v0.1.3

- Fast, focused memo creation and editing
- Compact quick-note workflow
- Markdown-friendly note content
- Checklists and task-list content
- Pinned notes
- Labels/tags, including draft-label assignment before first save, and simple filtering
- Search
- Archive and restore
- Recoverable Trash behavior, guarded Delete All, and automatic 30-day Trash retention
- Per-note colors
- Attachments and inline images with transaction-integrity hardening
- Quick-capture autosave and visible Undo
- Separate Copy body and Copy entire memo actions
- Individual user accounts
- Private-by-default note visibility
- Responsive web application behavior with Compact/mobile Glaze UI and accessibility hardening
- Portable export improvements inherited and extended through the GoreeCloud fork
- Unified GoreeCloud Memos application identity across web and native packaging
- Wardveil/session and release-security hardening, privacy-aware structured observability, and stored-script/style execution restrictions
- PostgreSQL pgx driver migration and non-root runtime defaults
- Permanent dependency, vulnerability, security, container, and SBOM validation gates
- Glaze UI product direction and GoreeCloud Memos branding
- Private HTTPS deployment at `memos.goreecloud.com`
- Non-root, no-host-port container hardening in the accepted deployment
- Recurring backup coverage, Uptime Kuma monitoring, restart persistence validation, and rollback support
- Production-accepted corrections for edit triggering, title spacing, and long-note label behavior

## Post-v0.1.3 source enhancements and acceptance-gated work

- Home/Capture responsive preferred masonry, including narrow-width fallback and rendered Chromium geometry acceptance
- First-party attachment Download action in the full-screen media preview, preserving filenames and following the selected preview item
- Discoverable Ctrl/Cmd + Enter save affordance with `aria-keyshortcuts` metadata while retaining validation-first blocked-save messaging
- Discoverable Ctrl/Cmd + K Quick Find affordance on desktop and mobile search controls with `aria-keyshortcuts` metadata while retaining the existing scoped-search behavior
- Additional source-level usability, accessibility, security, dependency, and container validation as development continues

These source capabilities are not automatically part of the currently deployed v0.1.3 runtime. They require a later controlled Stable release, deployment, and applicable representative-client acceptance before they can be described as production behavior.

## Linux and Android client foundation

- Shared Tauri 2 client foundation under `clients/goreecloud-memos`
- Linux AppImage and Debian package direction
- Android APK direction
- Clients use `https://memos.goreecloud.com` as the authoritative service and data source
- No second memo database, authentication system, or independent synchronization layer in the native clients
- Consistent canonical GoreeCloud Memos icon generation for web, Linux, and Android

### Client acceptance boundary

Client 0.1.3 remains an acceptance candidate. Earlier Android physical-device testing validated install, launch, sign-in, core navigation, search, attachments, Settings, Archive, and Trash rendering, but final Stable client promotion still requires the remaining Linux, Android, physical-network, protected-signing, independent-signature-verification, and deployed-web acceptance gates that apply to the target release.

## Planned / deliberately bounded features

- Controlled “promote/send to GoreeCloud Notes” interoperability may be added later when it can preserve content, timestamps, supported metadata, and clear user control.
- Additional quick-capture improvements are allowed when they keep startup, writing, retrieval, and organization lightweight.
- Deep notebooks, knowledge graphs, advanced backlinks, research organization, OCR-heavy workflows, and other Evernote-class features remain primarily GoreeCloud Notes responsibilities.

## Status rule

A source feature, packaged client, or passing CI workflow is not automatically a Stable or production feature. This file must continue to distinguish repository state, released artifacts, deployed runtime state, and completed acceptance evidence.
