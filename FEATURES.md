# GoreeCloud Memos — Features

GoreeCloud Memos is the lightweight GoreeCloud quick-note product. This list separates the accepted production web application from post-production source work and client acceptance candidates.

## Current production features — Stable v0.1.2

- Fast, focused memo creation and editing
- Compact quick-note workflow
- Markdown-friendly note content
- Checklists and task-list content
- Pinned notes
- Labels/tags and simple filtering
- Search
- Archive and restore
- Recoverable Trash behavior
- Per-note colors
- Attachments and inline images
- Individual user accounts
- Private-by-default note visibility
- Responsive web application behavior
- Portable export improvements inherited and extended through the GoreeCloud fork
- Glaze UI product direction and GoreeCloud Memos branding
- Private HTTPS deployment at `memos.goreecloud.com`
- Non-root, no-host-port container hardening in the accepted deployment
- Recurring backup coverage, Uptime Kuma monitoring, restart persistence validation, and rollback support
- Production-accepted corrections for edit triggering, title spacing, and long-note label behavior

## Post-v0.1.2 source enhancements and acceptance-gated work

- Attachment transaction-integrity hardening
- Trash “Delete all” and 30-day retention source work
- Additional deployment, security, dependency, and vulnerability gates
- PostgreSQL driver modernization and security hardening
- Unified canonical product icon across web, Linux, and Android packaging

These source capabilities are not automatically part of the currently deployed v0.1.2 runtime until separately released, deployed, and accepted.

## Linux and Android client foundation

- Shared Tauri 2 client foundation under `clients/goreecloud-memos`
- Linux AppImage and Debian package direction
- Android APK direction
- Clients use `https://memos.goreecloud.com` as the authoritative service and data source
- No second memo database, authentication system, or independent synchronization layer in the native clients
- Consistent canonical GoreeCloud Memos icon generation for web, Linux, and Android

### Client acceptance boundary

Client 0.1.3 remains an acceptance candidate. Earlier Android physical-device testing validated install, launch, sign-in, core navigation, search, attachments, Settings, Archive, and Trash rendering, but final Stable client promotion still requires the remaining Linux, Android, physical-network, signing, and deployed-web acceptance gates.

## Planned / deliberately bounded features

- Controlled “promote/send to GoreeCloud Notes” interoperability may be added later when it can preserve content, timestamps, supported metadata, and clear user control.
- Additional quick-capture improvements are allowed when they keep startup, writing, retrieval, and organization lightweight.
- Deep notebooks, knowledge graphs, advanced backlinks, research organization, OCR-heavy workflows, and other Evernote-class features remain primarily GoreeCloud Notes responsibilities.

## Status rule

A source feature, packaged client, or passing CI workflow is not automatically a Stable or production feature. This file must continue to distinguish repository state, released artifacts, and the accepted production runtime.
