# GoreeCloud Memos — Repository Notes

## Current implementation notes

- Repository lifecycle remains Development and is not Stable or production accepted.
- Current implementation is a browser-local Memos Core slice using IndexedDB for local Development state.
- Local draft recovery uses browser-local storage.
- Recent mainline work includes managed Labels, bulk label actions, metadata-aware filters, bounded advanced search expressions, and browser-local Saved View v1 with migration coverage.
- Application code in the current browser-local slice is not the final mobile/desktop/server persistence architecture.
- The central GoreeCloud user-manual representation must remain synchronized with `USER-MANUAL.md` as the product evolves.
- The legacy Memos Google Doc changelog remains historical evidence and requires controlled Markdown migration; it is not implementation authority for current source state.

## Android stabilization context

- Authoritative `main` at the branch start supports the web target only. This topic branch introduces the first native Android Development candidate; it is not authoritative `main` until governed integration and task-record reconciliation occur.
- A native Android application is a required first-class delivery target and must not be implemented as a WebView wrapper solely for convenience.
- The current Android candidate uses a native activity, explicit local-only state, versioned memo/draft files, previous-generation fallback, and exact-source APK CI. It deliberately requests no Internet permission and does not claim synchronization or server capability.
- Android work should reuse documented Memos domain/data contracts where practical while preserving offline-first capture, local draft/data preservation, truthful synchronization state, and portable user-owned data.
- Mobile persistence and future synchronization must not create a second undocumented authoritative data model.
- Server, accounts, synchronization, backup/recovery, import/export, administration, and accepted Integral Platform System runtime integrations remain incomplete.
- Current Glaze UI consumer target is 1.5.1; application-specific rendered, accessibility, representative-device, performance, and release acceptance remain required.

## Governance and infrastructure follow-up

- Default-branch protection and runner/trust configuration must be verified through the authoritative GitHub repository settings before being represented as satisfied.
- Keep local-only, synchronized, backed-up, exported, and recovered state boundaries explicit as the implementation expands.
- Do not claim Android production acceptance, synchronization, operational recovery, platform-system, Release Candidate, production, or Stable acceptance until evidence is tied to the exact candidate revision.
- Before merging this Android foundation to authoritative `main`, reconcile the existing canonical `GoreeCloud/Tasks Management/GoreeCloud Memos — Implementation Task List.md` so it no longer states that native mobile is wholly unimplemented.


## Android runtime stabilization candidate — September 18, 2026

The current candidate adds managed Android 16 runtime acceptance for the local-only Development foundation. It verifies launch visibility, absence of INTERNET permission, local-only/synchronization-unavailable presentation, draft survival across Activity recreation, and locally saved memo survival across Activity recreation. The workflow also compiles instrumentation tests and pins third-party CI actions to immutable commit SHAs on Ubuntu 24.04.

This evidence remains Development-only. It does not establish representative physical-device acceptance, synchronization, Identity/account authority, attachments, reminders, sharing, widgets, biometric lock, backup/recovery, production signing, Release Candidate, or Stable acceptance.
