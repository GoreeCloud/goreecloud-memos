# GoreeCloud Memos — Changelogs

## 2026-09-29 — privacy-minimized recent searches candidate

- Added a browser-local recent-search history that records a query only after the user explicitly submits it with Enter or reuses an existing recent search; ordinary search-as-you-type input remains ephemeral.
- Bounded history to eight valid queries of at most 256 characters, with newest-first ordering and case-insensitive deduplication.
- Added **Clear recent searches** without changing the current query, filters, Saved Views, or memo data.
- Added malformed-storage recovery, unit tests, and Chromium coverage for non-persistence while typing, explicit submission, reload persistence, reuse, and clearing.
- Added no account, synchronization, telemetry, network, server, or memo-schema authority. Fresh exact-head validation remains required.

## 2026-09-28 — recoverable bulk memo lifecycle candidate

- Extended the existing ephemeral browser selection with **Archive selected**, **Move to Trash**, and **Restore selected**.
- Added one-transaction IndexedDB lifecycle updates that validate the full selection before writing, preventing partial mutation when one selected memo cannot perform the requested transition.
- Preserved each trashed memo's prior Active or Archived location when restoring.
- Kept bulk permanent deletion unavailable; permanent deletion remains an explicit single-memo Trash action.
- Added service/unit and Chromium end-to-end coverage for reversible bulk lifecycle behavior.
- No schema, account, synchronization, server, backup, or cross-device authority was added.
- Exact head `35a17ca14bd58dd67b694cbdaa8d213e96a41eea` passed Platform Contract #82, Repository feature records #358, Validate #405, and Android Development Foundation #255.


## 2026-09-28 — local memo text portability candidate

- Added per-memo **Copy text** and **Export .txt** quick actions plus **Copy selected** / **Export selected** for the current ephemeral selection.
- Added deterministic selected-memo text bundles that preserve selection order and existing memo metadata, with filesystem-safe filenames and unit/browser coverage.
- Hardened compact memo action geometry to 49 CSS px after Chromium exposed sub-pixel rounding below the 48 px acceptance floor.
- Exact candidate head `9f6b9e75fe1e04a5758cc4ebdd8e429182e1b703` passed all configured Memos workflow families. Full-library export/import round-trip, backup/recovery, synchronization, and cross-client portability remain open.


**Record type:** Repository changelog and migration history  
**Repository:** `GoreeCloud/memos`  
**Lifecycle:** Development / nonconformant  
**Migration state:** Complete and authoritative on `main`; PR #20 merged as `7985fed0bad91b5a04e8a586aefda6089086a120`, exact-head and exact-main validation passed, root `FEATURE-ROADMAP.md` is absent, and the mapped legacy Drive roadmap was permanently retired and verified absent on September 22, 2026.  
**Runtime evidence baseline:** `d86dfb981830dc9941ab7b009fbbe18d818c3a63`; governance migration/reconciliation does not promote runtime state.  
**Governing standard:** Standard — Repository Feature Tracking and Changelog Governance v1.0.

## Authority and interpretation

This file records meaningful changes accepted in repository history. The former Drive planning roadmap is now retired migration provenance only; it is not current authority. No dedicated `Change Log — Memos` Drive source was resolved during the bounded migration inventory, so no unidentified Drive changelog deletion is claimed.

### September 28, 2026 — persistent contextual-hint dismissal and reset
- Changed the workspace Quick tip dismissal from session-only state to browser-profile-local persistence so a dismissed optional hint stays dismissed after reload.
- Added a **Reset dismissed hints** control in Guidance settings, independent from the global Contextual hints toggle and first-use setup replay.
- Expanded Chromium end-to-end coverage for dismissal persistence, reload behavior, reset behavior, and reappearance after reset.
- The feature remains local to the browser profile and adds no account, synchronization, telemetry, or network authority. Fresh exact-head validation is required for this Development candidate.

## Current repository changelog

### September 22, 2026 — Migration retirement reconciliation
- Confirmed PR #20 merged to authoritative `main` as `7985fed0bad91b5a04e8a586aefda6089086a120`.
- Confirmed exact-head `Repository feature records`, `Validate`, and `Android Development Foundation` workflows passed for the migration head.
- Confirmed the corresponding three push validations passed on merged `main`.
- Verified root `IMPLEMENTED-FEATURES.md`, `PLANNED-FEATURES.md`, and `CHANGELOGS.md` are readable on `main` and root `FEATURE-ROADMAP.md` is absent.
- Permanently deleted the mapped legacy Drive roadmap `GoreeCloud/Feature Roadmap/GoreeCloud Memos/goreecloud-memos.md` (former file ID `1l-A6Hp88v7Tuv1llWUN3KwgKaHB6-Huv`) and independently verified the former ID returns not found.
- Reconciled stale candidate-era migration metadata in the repository-native feature/changelog records.
- No Memos runtime, storage format, Android permission, synchronization, account, server, production, Release Candidate, or Stable state is changed by this retirement reconciliation.

### September 22, 2026 — Repository-native feature/changelog migration
- Added root `IMPLEMENTED-FEATURES.md`, `PLANNED-FEATURES.md`, and `CHANGELOGS.md` on an isolated migration branch and merged them through PR #20.
- Reclassified all 52 numbered areas from Drive roadmap v0.5 against accepted repository evidence without treating planning text as implementation proof.
- Reconciled README navigation/authority from the old Drive-synchronized roadmap model to repository-native feature/changelog authority.
- Added a fail-closed repository feature-record validation workflow and retired root `FEATURE-ROADMAP.md` only after replacement coverage was established.
- No Memos runtime, storage format, Android permission, synchronization, account, server, production, Release Candidate, or Stable state was changed by this governance migration.

### September 18, 2026 — Validation, Android local-only acceptance, and CI hardening
- PR #16 established the native Android local-capture Development foundation with local memo/draft persistence, no WebView, no Internet permission, and no invented server/Identity/Sync authority.
- PR #17 added Android 16 managed-emulator acceptance for the local-only boundary plus draft/saved-memo recreation behavior.
- PR #18 added verified accessibility heading semantics for the Android local workspace.
- PR #19 pinned browser validation Actions to immutable revisions, moved jobs to Ubuntu 24.04, disabled persisted checkout credentials, and added exact-source verification.
- These changes culminate in runtime baseline `d86dfb981830dc9941ab7b009fbbe18d818c3a63` and remain Development evidence only.

### September 18, 2026 — Browser-local search and Saved View foundation
- PRs #10–#13 advanced managed Label presentation, Label-color filtering, bounded advanced search expressions, and Saved View v1 persistence.
- IndexedDB advanced to database v5 while preserving existing Memo v4 / Label v2 state and adding a dedicated Saved View store.
- Search/filter state remains local; synchronization, broad smart-filter semantics, recent-search history, and complete roadmap search remain open.

### September 17, 2026 — Managed labels, lifecycle, organization, and local search
- PRs #1–#9 established the browser-local quick-capture foundation, autosave, Archive/Trash recovery, memo colors, managed Labels, pin ordering, presentation modes, local search/filtering, managed Label identity/schema v4, label administration/metadata, and bulk label apply/remove.
- Browser regression coverage expanded through unit and Chromium end-to-end validation.
- These accepted increments do not establish shared synchronization, server accounts, operational backup/recovery, or Stable status.

## Completed Drive retirement gate

The mapped roadmap retirement gate is complete:
1. repository migration accepted through PR #20;
2. applicable exact-head checks passed;
3. authoritative `main` readback verified the three required root records;
4. root `FEATURE-ROADMAP.md` was confirmed absent;
5. current README/automation authority was reconciled by the migration;
6. applicable post-merge push validation passed; and
7. the mapped Drive roadmap was permanently deleted and its former ID independently verified not found.

No Memos Drive changelog deletion is claimed because no dedicated source was resolved in the bounded migration inventory.

## Maintenance rule

Record meaningful implementation, architecture, privacy/security, accessibility, migration, compatibility, deployment, recovery, release, rollback, and correction events with evidence-backed lifecycle state. Preserve historical facts rather than rewriting them to match later architecture.