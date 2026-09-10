# GoreeCloud Memos — Feature Roadmap

**Lifecycle:** Development for the original GoreeCloud-owned native rebuild  
**Operational baseline:** GoreeCloud Memos web/server v0.1.3 remains the separately accepted Stable production runtime  
**Current design-system requirement:** GLAZE UI V1.3 / 1.3.0  
**Last reconciled:** September 10, 2026

This roadmap governs the native-from-the-ground-up GoreeCloud Memos line. It is subordinate to the canonical GoreeCloud project specification, governing GoreeCloud instructions, the machine-readable Platform Contract, verified source state, and exact-revision acceptance evidence.

The long-term product remains a focused quick-capture application. Roadmap work must not turn Memos into a duplicate of GoreeCloud Notes or silently replace the accepted web/server production runtime before migration, recovery, deployment, and acceptance gates are satisfied.

## Current validated Development foundation

### MR-001 — Native Android Home and quick capture
**Status:** Implemented Development foundation

Maintain the Android-native Jetpack Compose Home/Capture surface, native text editing, Back/cancel behavior, adaptive card presentation, and bounded Android share/launcher capture entry points. These surfaces remain Development and do not by themselves establish production data authority.

### MR-002 — Durable local saved-card foundation
**Status:** Implemented Development foundation

Maintain app-private durable storage for explicitly saved native memo cards with fail-closed persistence behavior. Draft text and queued external-share payloads remain bounded according to their existing session/process authority. The native store is not yet the accepted production memo library.

### MR-003 — Local saved-memo retrieval
**Status:** Active Development candidate

Continue the local `Find saved memos` path over already-loaded native saved cards. Preserve Unicode-normalized, locale-stable, multi-term matching, pinned-before-ordinary ordering, and the no-network/no-query-persistence/no-telemetry boundary.

## Immediate next work

### MR-004 — GLAZE UI V1.3 source migration
**Status:** Next

Migrate the native Android application from its current V1.1 source mapping to current Stable GLAZE UI V1.3 / 1.3.0. Preserve Android-native interaction patterns rather than recreating a desktop/web shell. Do not mark Glaze conformant until fresh rendered, accessibility, resilience, adaptive/form-factor, representative-device, Human Visual Excellence, rollback, release, and production acceptance is complete.

### MR-005 — Physical-device retrieval ergonomics
**Status:** Next

Validate and refine native saved-memo filtering on representative Android hardware, including keyboard/IME interaction, query editing and clearing, focus behavior, empty/no-result states, large text, touch targets, Back behavior, and useful memo density.

### MR-006 — Large-library local retrieval performance
**Status:** Next

Measure retrieval behavior against representative local memo-library sizes. Keep filtering responsive and bounded without introducing unauthorized remote search, semantic inference, query telemetry, or a second ungoverned indexing authority. Escalate to GoreeCloud Index/Search integration only through an approved contract and platform authority boundary.

### MR-007 — Accessibility, localization, and RTL acceptance
**Status:** Next

Complete TalkBack/semantic labeling, keyboard/focus behavior where applicable, 200% text/reflow, contrast and forced/high-contrast equivalents available to the platform, reduced-motion behavior, localization expansion safety, RTL layout/navigation, and representative-device acceptance.

## Product-completion sequence

### MR-008 — Native organization workflows
**Status:** Planned

Implement production-intended native labels, pinning, Archive, recoverable Trash, and other lightweight organization workflows defined by the Memos product scope. Preserve portable metadata semantics and the intentional Memos-versus-Notes boundary.

### MR-009 — Native attachments and Android system integration
**Status:** Planned

Add approved attachment selection/viewing/transfer, share/intents, reminders/notifications, lifecycle/re-entry, and system integration without widening file, network, background, or notification authority beyond explicit user actions and approved platform contracts.

### MR-010 — GoreeCloud Identity authority and synchronization
**Status:** Blocked pending accepted platform integration

Bind native memo ownership, authentication, sessions, authorization, synchronization, revocation, and production data access to accepted GoreeCloud Identity and related application contracts. Local Development owner identifiers or stores must not be promoted into production identity authority.

### MR-011 — Privacy Shield and Wardveil Security acceptance
**Status:** Blocked pending accepted platform integration

Integrate runtime-enforced privacy authorization and security evidence for native capture, storage, retrieval, sharing, attachment transfer, synchronization, and recovery. Preserve minimized telemetry and fail-closed authority boundaries.

### MR-012 — Everkeep backup, restore, and recovery acceptance
**Status:** Blocked pending accepted platform integration

Advance the existing portable snapshot, clean-target restore, and post-ambiguous reconciliation foundations into an authenticated, authorized, provenance-aware Everkeep recovery workflow. Require backup integrity, restore rehearsal, rollback, recovery lineage, and target-environment evidence before production recovery claims.

### MR-013 — GoreeCloud Mesh and Manager integration
**Status:** Blocked pending accepted platform integration

Register approved Memos capabilities, dependencies, and events through GoreeCloud Mesh and expose bounded administrative/operational state through GoreeCloud Manager. Do not publish capabilities or platform health states that have not been accepted at runtime.

### MR-014 — Controlled migration from retained production runtime
**Status:** Planned / blocked by authority and recovery prerequisites

Define and validate migration from the accepted GoreeCloud Memos web/server v0.1.3 data/runtime into the native architecture. Preserve user data, timestamps, supported labels/metadata, attachments where supported, rollback safety, and explicit source-of-truth transitions. Do not silently switch production authority.

### MR-015 — Native release and Stable qualification
**Status:** Blocked

Complete protected Android signing and independent signature/provenance verification, platform-system acceptance, target-environment deployment validation, accessibility/device acceptance, recovery drills, migration/cutover acceptance, release evidence, rollback proof, and post-deployment verification before any native Release Candidate or Stable promotion.

## Fail-closed roadmap rules

- Source implementation, CI success, emulator evidence, documentation, or a Platform Contract declaration does not by itself establish production or Stable acceptance.
- The accepted web/server v0.1.3 runtime remains operationally separate until a controlled migration and deployment changes that state.
- Native local data must not be represented as the accepted production memo library until Identity, synchronization, migration, privacy, security, and recovery authority are accepted.
- GLAZE UI source-version labels must distinguish the actual mapped source from the current required Stable baseline.
- Every material roadmap completion must be reconciled against exact source revisions, applicable CI/runtime evidence, the Platform Contract, canonical Drive records, and GoreeCloud task records.
