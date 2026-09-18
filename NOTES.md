# GoreeCloud Memos — Repository Notes

## Current implementation notes

- Repository lifecycle remains Development and is not Stable or production accepted.
- Current implementation includes the browser-local Memos Core slice plus the merged native Android local-capture Development foundation. Neither is production accepted.
- Local draft recovery uses browser-local storage.
- Recent mainline work includes managed Labels, bulk label actions, metadata-aware filters, bounded advanced search expressions, and browser-local Saved View v1 with migration coverage.
- Application code in the current browser-local slice is not the final mobile/desktop/server persistence architecture.
- The central GoreeCloud user-manual representation must remain synchronized with `USER-MANUAL.md` as the product evolves.
- The legacy Memos Google Doc changelog remains historical evidence and requires controlled Markdown migration; it is not implementation authority for current source state.

## Android stabilization context

- Authoritative `main` includes the first native Android Development foundation through signed merge commit `2ad4a8dcc6417603d3719abc05e8be1bd37a4ed4` (PR #16). The foundation remains local-only and Development-only.
- A native Android application is a required first-class delivery target and must not be implemented as a WebView wrapper solely for convenience.
- The merged Android foundation uses a native activity, explicit local-only state, versioned memo/draft files, previous-generation fallback, and exact-source APK CI. It deliberately requests no Internet permission and does not claim synchronization or server capability.
- Android work should reuse documented Memos domain/data contracts where practical while preserving offline-first capture, local draft/data preservation, truthful synchronization state, and portable user-owned data.
- Mobile persistence and future synchronization must not create a second undocumented authoritative data model.
- Server, accounts, synchronization, backup/recovery, import/export, administration, and accepted Integral Platform System runtime integrations remain incomplete.
- Current Glaze UI consumer target is 1.5.1; application-specific rendered, accessibility, representative-device, performance, and release acceptance remain required.

## Governance and infrastructure follow-up

- Default-branch protection and runner/trust configuration must be verified through the authoritative GitHub repository settings before being represented as satisfied.
- Keep local-only, synchronized, backed-up, exported, and recovered state boundaries explicit as the implementation expands.
- Do not claim Android production acceptance, synchronization, operational recovery, platform-system, Release Candidate, production, or Stable acceptance until evidence is tied to the exact candidate revision.
- The canonical Tasks Management record has been migrated to `GoreeCloud Memos — Implementation Task List.docx` and reconciled to the merged Android foundation. Keep it aligned with future verified Android integration.


## Android runtime stabilization candidate — September 18, 2026

The current candidate adds managed Android 16 runtime acceptance for the local-only Development foundation. It verifies launch visibility, absence of INTERNET permission, local-only/synchronization-unavailable presentation, draft survival across Activity recreation, and locally saved memo survival across Activity recreation. The workflow also compiles instrumentation tests and pins third-party CI actions to immutable commit SHAs on Ubuntu 24.04.

This evidence remains Development-only. It does not establish representative physical-device acceptance, synchronization, Identity/account authority, attachments, reminders, sharing, widgets, biometric lock, backup/recovery, production signing, Release Candidate, or Stable acceptance.


## Android accessibility stabilization candidate — September 18, 2026

- The local-only Android Development workspace title and saved-memos section are being exposed as Android accessibility headings.
- Android 16 runtime acceptance verifies those heading semantics alongside the existing no-network/local-only and recreation checks.
- This does not establish full screen-reader certification, representative-device accessibility, Glaze UI visual acceptance, or production/release status.


## Browser validation CI supply-chain candidate — September 18, 2026

- The browser validation workflow is being moved from mutable Ubuntu/action tags to Ubuntu 24.04 plus immutable checkout v4 and setup-node v4 commit SHAs while preserving the existing action major versions.
- Source checks, unit tests, browser acceptance, and repository-baseline jobs now check out the exact pull-request head or pushed main SHA with persisted checkout credentials disabled and verify the revision before executing repository code.
- This changes CI provenance only; it does not expand Memos application, synchronization, account, recovery, signing, Release Candidate, or Stable authority.
