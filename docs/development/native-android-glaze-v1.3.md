# Native Android GLAZE UI V1.3 Source Mapping

**Status:** Development source-migration candidate  
**Target:** GLAZE UI V1.3 — Adaptive Resonance / `1.3.0`  
**Integrated implementation anchor:** `fc7cc91d2eace8da2371371c2855c24cbcb326a1`  
**Stable lifecycle authority anchor:** `d68e408a9abd946a7fd1b30816a0e3876d8bf8bb`

## Purpose

This tranche migrates the GoreeCloud Memos native Android source contract from the former V1.1 mapping to the current Stable V1.3 consumer target without manufacturing rendered, physical-device, accessibility, performance, production, or Stable application acceptance.

V1.3's Stable entrypoint inherits the V1.2 structural rendering foundation and layers Adaptive Resonance behavior through separate color, shape, reachability, navigation, material, accessibility, personalization, and related contracts. Memos therefore preserves its existing structural spacing/radius/interaction geometry while explicitly adopting the V1.3 source authority and adding a bounded native adaptive-policy layer.

## Structural source mapping

`GlazeMetrics` now records:

- design-system target `1.3.0`;
- exact integrated V1.3 implementation revision `fc7cc91d2eace8da2371371c2855c24cbcb326a1`;
- exact Stable-lifecycle authority revision `d68e408a9abd946a7fd1b30816a0e3876d8bf8bb`;
- inherited 4/8/12/16/20/24/32/48/64 dp spacing;
- inherited 12/20/28 dp structural radius tiers plus capsule;
- inherited separate 8/16/24/32 dp optical geometry plus capsule; and
- inherited 48 dp ordinary / 56 dp Touch Assistance interaction floors, matching the V1.3 reachability contract.

No new geometry is invented merely to make the version marker read V1.3.

## Adaptive Resonance policy

`GlazeAdaptivePolicy` maps the bounded V1.3 behaviors relevant to the native source line:

- default non-semantic Glaze accent `#68AEE0`;
- color-authority precedence beginning with accessibility and semantic authority;
- protected semantic roles including privacy, security, recovery, connectivity, success/warning/danger, and availability states;
- compact reachability review bands with the Interaction Zone beginning at `0.62` of normalized usable height;
- reachability scoring/review as non-authoritative Development evidence only;
- accessibility precedence over adaptive expression; and
- no autonomous decorative shape morphing as a source of product state.

The current Home/Capture renderer deliberately does **not** consume `GlazeAdaptivePolicy` yet.

## Dynamic color and Personalization boundary

V1.3 supports adaptive/dynamic expression, but Memos does not yet have an accepted native Personalization, wallpaper/environment, or contextual-color adapter. Therefore:

- user-accent adapter acceptance is false;
- context-accent adapter acceptance is false;
- environmental sampling is disabled;
- remote dynamic-color derivation is disabled;
- persistent color memory is disabled;
- semantic inference is disabled; and
- adaptive expression may not carry authoritative semantic state.

`GlazeTheme` continues to provide deterministic Light/Dark fallback behavior from Android's system appearance signal. Deep Dark remains an explicit source capability rather than an inferred Android system state. The retained Memos atmosphere values remain unrendered and content-independent.

## Privacy and truth-domain boundary

GLAZE UI owns presentation and interaction, not underlying product truth. This source migration does not grant or replace GoreeCloud Privacy Shield, Wardveil Security, GoreeCloud Identity, Everkeep, synchronization, network, persistence, recovery, or memo-lifecycle authority.

Adaptive color, shape, reachability, or material behavior cannot reinterpret memo text, draft text, queued shares, labels, pin state, local-storage state, identity state, privacy/security state, synchronization state, recovery state, or service availability as design-system truth.

## Existing native data boundary

The Android Development package remains `com.goreecloud.memos.native.dev`. It still requests no `INTERNET` permission and contains no WebView. Explicitly saved cards remain bounded to the existing app-private Development `AtomicFile` store. Drafts and queued text shares remain process-memory only. No production Memos server/API, Identity session, synchronization engine, migration authority, or Everkeep recovery path is added by this migration.

## Acceptance boundary

This tranche establishes **source migration only**. Earlier V1.1 emulator/rendering evidence is historical and cannot be reused as V1.3 application acceptance.

Still required are fresh exact-revision V1.3 evidence for applicable:

- rendered/native visual behavior;
- touch/keyboard/focus/selection/consequential-action interaction;
- TalkBack, Switch Access, large text/reflow, RTL/localization, Reduced Motion, transparency/contrast resilience and platform equivalents;
- phone, tablet, foldable/posture, multi-pane and adaptive composition;
- native Personalization/runtime appearance adapters if enabled;
- Home/Capture product workflows and truthful state presentation;
- representative performance and graceful degradation;
- physical-device capture/share/shortcut/retrieval behavior;
- Human Visual Excellence review;
- consumer-local rollback;
- explicit production approval bound to an exact consumer revision;
- Privacy Shield, Wardveil Security, Identity, Everkeep, Mesh and Manager acceptance;
- controlled migration, protected signing/provenance, Release Candidate qualification, deployment, production acceptance, and Stable qualification.

The native line therefore remains Development and globally nonconformant after this source migration until those independent gates are completed.
