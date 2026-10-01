# GoreeCloud Memos — Planned Features

## 2026-09-29 full-library export continuation

PR #27 now also carries a versioned browser-local library export containing Memo lifecycle records, managed Labels, and Saved Views. It deliberately excludes drafts, recent-search history, and UI preferences and does not claim backup/recovery. Full-library import preview, strict validation, round-trip preservation, operational backup, clean-target recovery, and cross-client/server portability remain open.

## 2026-09-29 recent-search continuation

PR #27 now also carries bounded browser-local recent-search history. It records only explicitly submitted valid queries, retains at most eight entries, and exposes an independent clear action; normal search-as-you-type input remains unpersisted. Broader date/attachment/checklist/full-metadata search, synchronized search history, and search portability remain open. Fresh exact-head validation is required before treating this candidate as verified Development evidence.

## 2026-09-28 candidate continuation

PR #27 now carries device-local text portability plus recoverable multi-selection lifecycle actions. In addition to per-memo and selected-memo Copy/Export, the current candidate adds atomic **Archive selected**, **Move to Trash**, and **Restore selected** behavior while preserving prior Active/Archived restore state and deliberately keeping permanent deletion single-memo and Trash-only. These changes remain browser-local and create no sync, backup, cloud, or cross-device authority. Exact head `35a17ca14bd58dd67b694cbdaa8d213e96a41eea` passed all four configured workflow families (Platform Contract #82, feature records #358, Validate #405, Android Development Foundation #255). Integration to authoritative `main` and broader portability/recovery acceptance remain open.

**Record type:** Repository planned/open feature inventory  
**Repository:** `GoreeCloud/memos`  
**Lifecycle:** Development / nonconformant  
**Migration state:** Complete and authoritative on `main`; PR #20 merged as `7985fed0bad91b5a04e8a586aefda6089086a120`, exact-head and exact-main validation passed, root `FEATURE-ROADMAP.md` is absent, and the mapped legacy Drive roadmap was permanently retired and verified absent on September 22, 2026.  
**Runtime evidence baseline:** `d86dfb981830dc9941ab7b009fbbe18d818c3a63`; repository feature/changelog migration and retirement reconciliation do not promote runtime state.  
**Migration provenance:** Former Drive roadmap v0.5, `GoreeCloud/Feature Roadmap/GoreeCloud Memos/goreecloud-memos.md`, former file ID `1l-A6Hp88v7Tuv1llWUN3KwgKaHB6-Huv`; permanently retired after successful repository migration and retained only as historical provenance in Git/changelog evidence.  
**Governing standard:** Standard — Repository Feature Tracking and Changelog Governance v1.0.

## Interpretation

The retired Drive roadmap was a planning migration source whose metadata explicitly stated that implementation status was not established by the specification. This repository-native file preserves and dispositions all 52 numbered roadmap capability areas against accepted repository evidence. `IMPLEMENTED-FEATURES.md` controls implemented state. A roadmap item remains here when any material part is planned, partial, blocked, deferred, or acceptance-gated.

The product boundary remains **Open → type → done.** Memos is quick capture; GoreeCloud Notes remains the deeper knowledge-management product.

## Roadmap migration matrix

| Source roadmap area | Repository-native disposition | Current open boundary |
| --- | --- | --- |
| 1. Product Vision | Partial | Quick-capture browser and Android foundations exist; production server, desktop client, synchronized mobile behavior, shared synchronization service, and portability/recovery tools remain open. |
| 2. Core Product Principles | Partial | Current local-only source supports privacy-minimized, open-source Development behavior; self-hosting, cross-device operation, complete portability/recovery, and production acceptance remain open. |
| 3. Quick Capture | Partial | Browser and Android quick capture with optional title is implemented. Rich formatting, checklists, attachments, tables, dates, and broader content types remain open. |
| 4. Instant Save | Partial | Browser autosave/draft recovery and Android local draft persistence exist. Server synchronization, network-interruption recovery, and cross-device guarantees remain open. |
| 5. Memo Cards | Partial | Browser memo cards and four presentation modes exist. Checklist/attachment/reminder/offline/sync indicators remain open. |
| 6. Color-Coded Memos | Partial | Local memo color metadata exists. Synchronization/export/import/backup/restore/device-migration preservation remains open. |
| 7. Labels | Partial | Managed local labels, rename/delete/merge, color/icon/description metadata, search/filter, and bulk apply/remove exist. Ownership/synchronization and complete cross-client behavior remain open. |
| 8. Smart Filters | Partial | Current local filters cover memo color, label name, managed Label color, lifecycle scoping, and bounded expressions. The full roadmap filter set remains open. |
| 9. Saved Views | Partial | Browser-local named Saved View v1 snapshots exist. Synchronization, pin/order/icon/color/default-view behavior remains open. |
| 10. Search | Partial | Local text/title/label search, three bounded expression fields, and PR #27 browser-local explicit recent-search history exist. Attachment/checklist/date/full metadata search, synchronized history, and search portability remain open. |
| 11. Pinning | Partial | Local pin/unpin and manual ordering exist. Cross-device synchronization/context-menu parity remains open. |
| 12. Archive | Partial | Local archive/restore exists, and PR #27 now carries atomic selected-memo archive/restore as a Development candidate. Full archive search/filter/export and cross-device behavior remain open. |
| 13. Trash | Partial | Local trash/restore/permanent deletion exists, and PR #27 now carries selected-memo Move to Trash / Restore while preserving prior lifecycle location. Bulk permanent deletion remains deliberately absent; retention policy and synchronized trash remain open. |
| 14. Checklists and Lightweight Tasks | Planned | No checklist data model or UI is established on accepted `main`. |
| 15. Attachments | Planned | No attachment storage, upload, preview, quota, or client attachment flow is established. |
| 16. Link Recognition | Planned | No governed link-recognition/preview feature is established. |
| 17. Reminders | Planned | No reminder model, recurrence, or notification behavior is established. |
| 18. Quick Actions | Partial | Pin, color, label, archive, delete, bulk label actions, per-memo/selected-memo Copy/Export, and recoverable selected-memo Archive/Trash/Restore exist locally in the PR #27 candidate. Reminder/share and destructive bulk deletion remain open. |
| 19. Desktop Application | Planned | No accepted native desktop client is established. |
| 20. Mobile Application | Partial | Native Android local-only quick capture/persistence exists. Synchronization, sharing, widgets, camera/voice attachments, notifications, biometric lock, and production acceptance remain open. |
| 21. Web Application | Partial | Responsive browser-local experience, keyboard-accessible controls, local draft protection, and browser persistence exist. Server-backed administration, synchronized/offline web behavior, attachments, and full roadmap parity remain open. |
| 22. Offline-First Client Model | Partial | Local browser and Android operation exists without server authority. A synchronized offline queue and reconnection behavior are not established. |
| 23. Synchronization | Planned | No accepted synchronization service/protocol, device state, incremental sync, attachment sync, or diagnostics exists. |
| 24. Conflict Handling | Planned | No cross-device conflict engine or merge UI is established. |
| 25. Version History | Planned | No memo revision-history product feature is established. |
| 26. Imports | Planned | No product import pipeline or preview is established. |
| 27. Exports | Partial | PR #27 implements bounded plain-text export for one memo/selection plus a versioned browser-local full-library JSON export of memos, labels, and Saved Views. Import/round-trip acceptance, cross-client preservation, and server-side export jobs remain open. |
| 28. Import/Export Round-Trip Guarantee | Planned | No round-trip portability acceptance evidence is established. |
| 29. Backups | Planned | No operational Memos backup system is established. |
| 30. Tested Recovery | Planned | No accepted clean-target restore/recovery proof is established. |
| 31. Privacy | Partial | Current Development clients avoid required telemetry/external AI and Android requests no Internet permission. Production privacy acceptance and server-side privacy controls remain open. |
| 32. Security | Partial | Local validation and fail-closed boundaries exist, but production auth/session/rate-limit/attachment authorization/admin/security-log controls remain open. |
| 33. Application Lock | Planned | No accepted PIN/biometric/local application-lock feature is established. |
| 34. Optional Locked Memos | Planned | No individually locked memo/client-side encryption feature is established. |
| 35. Multi-User Self-Hosting | Planned | No accepted multi-user server/account isolation runtime is established. |
| 36. Optional Sharing | Planned | No user-to-user/public sharing runtime is established. |
| 37. GoreeCloud Notes Integration | Planned | No accepted Send to GoreeCloud Notes workflow is established. |
| 38. GLAZE UI | Partial | Repository design targets GLAZE semantics, but accepted whole-application V1.6 rendered/accessibility/visual conformance is not established. |
| 39. Accessibility | Partial | Browser accessibility foundations and Android heading semantics exist. Full screen-reader, large-text/reflow, forced-colors, reduced-effects, RTL/localization, representative-device, and human acceptance remain open. |
| 40. Keyboard-First Experience | Partial | Native keyboard controls exist for current browser interactions/presentation modes. Full shortcut system and configuration remain open. |
| 41. Command Interface | Planned | No command palette/interface is established. |
| 42. User Preferences | Partial | Browser-local presentation preference exists. Broader synchronized preferences and device-local policy remain open. |
| 43. Server Administration | Planned | No accepted server administration surface/runtime is established. |
| 44. Architecture | Partial | Browser-local and Android local-data layers exist. Shared service, persistent server data, synchronization, and recovery layers remain open. |
| 45. Suggested Core Data Model | Partial | Memo, Label, Memo–Label, and Saved View local records exist. User, Memo Revision, Attachment, Reminder, Device, Sync Event, Session, Import/Export Job, and Backup Record remain open. |
| 46. Open-Source Requirements | Partial | Public source, automated tests, build documentation, and repository governance exist. Reproducible release, server upgrade/schema migration/backup/restore/API/data-format documentation and release/security process remain incomplete. |
| 47. Performance Goals | Open acceptance | No Stable large-library/performance acceptance is established; keep all stated performance goals open. |
| 48. Reliability Requirements | Partial | Local migration/corruption fallback and regression coverage exist. Server/sync/import/export/attachment/storage-exhaustion reliability remains open. |
| 49. Feature Boundary | Ongoing product constraint | Keep Memos focused on quick capture rather than duplicating GoreeCloud Notes. |
| 50. Development Roadmap | In progress | Phase 0 audit and portions of Phase 1/Web/Mobile local foundations are implemented; synchronization, full web, desktop, mobile, portability/recovery, and expanded productivity phases remain open. |
| 51. Initial Stable Cross-Platform Release Criteria | Planned release gate | All listed cross-platform synchronization, portability, recovery, isolation, accessibility, performance, and GLAZE acceptance criteria remain open. |
| 52. Final Product Direction | Ongoing product direction | Preserve Open → type → done while advancing only evidence-backed capabilities. |

## Priority open work

### P0 — Shared synchronization and authority
- Establish the server/account model, device identity, revision model, incremental/resumable synchronization, offline mutation queue, retry/backoff, attachment synchronization, conflict detection, and diagnostics.
- Preserve data rather than silently resolving unsafe body conflicts.
- Keep local-only browser/Android evidence from being represented as synchronized or server-authoritative.

### P0 — Portability, backup, and recovery
- Integrate and validate the PR #27 full-library export candidate; then add fail-closed import preview/validation, round-trip preservation, operational backups, integrity validation, retention, off-device copies, and tested clean-target recovery.
- Keep export portability distinct from operational backup/recovery.

### P0 — Privacy, security, and multi-user self-hosting
- Implement server authentication/session/device management, secure recovery, rate limiting, attachment authorization, per-user isolation, administrative role separation, security logging, registration policy, and applicable local locks.
- Independently validate all applicable GoreeCloud Integral Platform System relationships; source-local safeguards do not manufacture external authority.

### P0 — Cross-platform application acceptance
- Complete the web experience, native desktop client, and connected/synchronized mobile client against common documented server interfaces.
- Complete application-specific GLAZE UI V1.6, accessibility, large-text/reflow, reduced-effects, representative-device/form-factor, performance, and human visual acceptance.

### P1 — Remaining product capabilities
- Add checklists, attachments, link handling, reminders, broader quick actions, version history, command interface, expanded preferences, optional sharing/locked memos, Notes handoff, and server administration only through bounded, evidence-backed increments.

## Repository-governance obligations
- Do not recreate root `FEATURE-ROADMAP.md` after verified migration retirement.
- Do not recreate, synchronize, mirror, or retain a Memos feature-roadmap or changelog master in Google Drive.
- Keep `IMPLEMENTED-FEATURES.md`, this file, and `CHANGELOGS.md` synchronized with accepted `main` truth.
- Preserve historical/candidate evidence without promoting it into implemented state.

## Maintenance rule
A capability stays here until its defined implementation and acceptance scope is complete. When accepted on authoritative `main`, reconcile this file, `IMPLEMENTED-FEATURES.md`, and `CHANGELOGS.md` in the same governed workflow.