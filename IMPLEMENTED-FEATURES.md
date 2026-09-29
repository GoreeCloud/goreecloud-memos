# GoreeCloud Memos — Implemented Features

## 2026-09-29 — explicit recent-search history candidate

PR #27 now includes a privacy-minimized browser-local recent-search history. Live typing continues to filter memos without being retained. A query enters history only after explicit Enter submission or reuse from the recent-search list, and only when the bounded search expression is valid. History is limited to eight entries of at most 256 characters, deduplicated case-insensitively, and can be cleared independently of the active query, Saved Views, filters, or memo records.

The feature uses a dedicated browser-local preference rather than changing the Memo/Label/Saved View IndexedDB schema. Unit and Chromium coverage lock its bounded persistence and explicit-submission behavior. This remains unmerged Development candidate evidence until fresh exact-head validation passes.

## 2026-09-28 — recoverable bulk lifecycle candidate

PR #27 now extends the existing ephemeral browser selection with **Archive selected**, **Move to Trash**, and **Restore selected**. The IndexedDB path validates every selected memo before committing one transaction, so an invalid mixed selection fails without partially changing other memos. Restoring from Trash preserves each memo's prior Active or Archived location. Bulk permanent deletion is deliberately not exposed; permanent deletion remains a single-memo Trash-only destructive action.

Unit coverage verifies multi-memo archive/trash/restore behavior plus pre-mutation failure, and Chromium acceptance exercises Active → Archive → Trash → Archive recovery through the real selection controls. This is a schema-neutral, browser-local Development candidate and adds no account, synchronization, server, backup, or cross-device authority. Exact head `35a17ca14bd58dd67b694cbdaa8d213e96a41eea` passed Platform Contract #82 / `36507814457`, Repository feature records #358 / `36507813845`, Validate #405 / `36507813840`, and Android Development Foundation #255 / `36507813844`, including Android 16 local-only runtime acceptance.


## 2026-09-28 — local memo text portability candidate

- Added per-memo **Copy text** and **Export .txt** quick actions across active, archived, and trashed views plus **Copy selected** / **Export selected** for the current ephemeral browser selection.
- Added deterministic plain-text formatting that preserves title, memo body, labels, and color metadata, deterministic selected-memo ordering, and filesystem-safe local export filenames.
- Exact candidate head `9f6b9e75fe1e04a5758cc4ebdd8e429182e1b703` passed Platform Contract, repository-record, Chromium/unit/source validation, and Android Development Foundation workflows. This remains bounded local text portability only; full-library export/import round-trip, backup/recovery, synchronization, and cross-client portability remain open.


**Record type:** Repository implemented-feature inventory  
**Repository:** `GoreeCloud/memos`  
**Lifecycle:** Development / nonconformant  
**Migration state:** Complete and authoritative on `main`; PR #20 merged as `7985fed0bad91b5a04e8a586aefda6089086a120`, exact-head and exact-main validation passed, root `FEATURE-ROADMAP.md` is absent, and the mapped legacy Drive roadmap was permanently retired and verified absent on September 22, 2026.  
**Runtime evidence baseline:** `d86dfb981830dc9941ab7b009fbbe18d818c3a63`; PR #20 and this reconciliation change governance/documentation only and do not promote runtime state.  
**Governing standard:** Standard — Repository Feature Tracking and Changelog Governance v1.0.

## Interpretation

This record contains capabilities verified in accepted repository state. The retired Drive roadmap is historical migration provenance only and is not implementation evidence or current authority. Memos remains Development; browser/Android source, CI, and emulator evidence do not establish a production server, synchronization, production signing, Release Candidate, production acceptance, or Stable qualification.

## Implemented Development capabilities

### Quick capture and local persistence
- Browser quick capture supports optional title plus required memo content, visual memo-color swatches, removable label chips, search-as-you-type managed-label suggestions, and an explicit new-label affordance.
- Browser composer drafts are preserved locally, including current color and label input state.
- Saved browser memos persist in IndexedDB and support debounced local autosave.
- Native Android provides a first-party local quick-capture Development application with optional title/body editing and no WebView wrapper.
- Android memo and draft persistence use explicit versioned local formats, fsync-backed replacement, and a retained previous readable generation for bounded corruption fallback.

### Local organization and lifecycle
- Optional memo colors use a curated palette with restrained card treatment plus an accessible named color indicator so color is not the only signal.
- Managed Label v2 identities use stable UUIDs, case-insensitive names, optional curated color, optional icon text, and optional description.
- Memo–Label relationships are explicit and label rename/delete/merge operations are transactional.
- Bulk Apply label / Remove label plus recoverable Archive / Trash / Restore operations exist for the current browser-local selection and fail before partial mutation when the selection is invalid.
- Pin/unpin and persisted manual pin ordering are implemented for active memos.
- Active memo cards open an inline editor directly by click or keyboard activation; edits autosave locally, Done, Escape, or an outside click closes the editor, editor/card accessibility state stays synchronized, and the action menu remains for secondary lifecycle and pinning actions.
- Archive and Trash are recoverable local lifecycle states; permanent deletion is restricted to Trash and requires explicit destructive action.
- Comfortable, Compact, List, and Dense presentation modes persist as a browser-local preference.

### Local search, filters, and saved views
- Browser-local substring search covers memo title, body, and current label-name projection.
- Exact memo-color, label-name, and managed Label-color filters are combinable within the current lifecycle view.
- Bounded advanced expressions support `color:`, `label:`, and `label-color:` including quoted label values and deterministic validation errors.
- Saved View v1 records persist user-named snapshots of the current raw search plus those supported direct filters.
- Explicitly submitted recent searches can persist up to eight validated queries in the current browser profile; ordinary live typing is not recorded, and recent history has an independent clear action.
- Active search/filter state, selection, and unsupported Saved View metadata remain intentionally local/ephemeral.

### Data model and migration foundation
- Browser local data currently uses Memo schema v4, Label schema v2, Saved View schema v1, and IndexedDB database v5.
- Tested migrations cover v1/v2/v3 → v5 and a v4 → v5 preservation path for managed Label identity/relationships.
- Framework-independent memo, label, saved-view, query, and application-service modules are present.

### Accessibility and validation foundations
- Browser source includes accessible labels, visible focus treatment, live status text, visible metadata badges, responsive layout, and reduced-motion-safe behavior.
- Android runtime acceptance on Android 16 verifies the local-only boundary, draft persistence across Activity recreation, saved memo persistence, and accessibility heading semantics for the local workspace.
- Browser CI includes repository/source/unit/Chromium end-to-end validation; Android CI includes exact-source lint, unit tests, APK assembly/provenance, package metadata checks, and Internet-permission rejection.
- CI action dependencies for the browser validation path are pinned to immutable revisions and run on Ubuntu 24.04.

## Explicitly not implemented or not accepted

Authoritative `main` does not establish:
- a production Memos server or account system;
- shared/cross-device synchronization, device identity, offline mutation queues, or conflict handling;
- connected/synchronized Android behavior or accepted native desktop client behavior;
- attachments, checklists, reminders, version history, or locked memos;
- complete smart-filter/search coverage or synchronized Saved Views;
- full-library import/export round-trip portability, operational backup, or tested recovery;
- multi-user self-hosting, optional sharing, Notes handoff, or server administration;
- accepted Privacy Shield, Wardveil Security, Everkeep, Manager, Mesh, Identity, Policy, or Observability runtime integration;
- accepted whole-application GLAZE UI V1.6 conformance, representative-device accessibility/performance acceptance, production signing/provenance, Release Candidate, production, or Stable qualification.

## Maintenance rule

When a capability is accepted on authoritative `main`, reconcile this file, `PLANNED-FEATURES.md`, and `CHANGELOGS.md` in the same evidence-backed workflow. Do not promote planning text, open work, or CI-only candidates into implemented state.