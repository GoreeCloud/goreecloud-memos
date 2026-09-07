# Native Android GLAZE UI V1.1 Source Mapping

Status: Development source-mapping candidate

GoreeCloud Memos native Android now targets the current Stable **GLAZE UI V1.1 (`1.1.0`)** source contract at exact release commit `15cc76d2bcd4065552dc31c77145b63f34d9e7b2`.

## Implemented source mapping

- Preserves inherited V1 spacing 4/8/12/16/20/24/32/48/64 dp.
- Preserves structural radius tiers 12/20/28 dp plus capsule.
- Preserves the 48 dp ordinary interaction floor and 56 dp Touch Assistance/far-view token.
- Records V1.1 optical geometry references 8/16/24/32 dp plus capsule separately from structural radii.
- Preserves inherited V1 Light and Dark structural appearance values.
- Defines the V1.1 Deep Dark structural source mapping with canvas `#05070A`, base surface `#0D1015`, raised/panel family `#171C23`, primary text `#F5F7FA`, and secondary text `#ABB4C2`.
- `GlazeTheme` exposes Deep Dark as an explicit source appearance. The default `SYSTEM` mode continues to follow Android's binary Light/Dark signal and does not infer Deep Dark.
- No user appearance preference or Theme Manager is introduced by this slice.

## Atmospheric boundary

`GlazeAtmosphere` records the V1.1 Deep Teal + Soft Amber primitive and aura-cap subset as non-semantic source metadata. The current Home/Capture renderer does not consume it.

This source mapping authorizes no:

- memo-content or draft-content sampling;
- label/reminder/pin/lifecycle inference for visual atmosphere;
- remote color derivation;
- persistent sample history;
- Environmental Color Memory;
- semantic inference;
- telemetry; or
- animated atmosphere.

Deep Teal or Soft Amber cannot represent privacy, security, identity, recovery, synchronization, persistence, pin state, data durability, network state, or another authoritative condition. Removing atmosphere must not remove content, actions, focus, semantic state, or hierarchy.

## Native data boundary

The V1.1 source migration does not widen native Memos data authority. The Android Development application remains `com.goreecloud.memos.native.dev`, requests no `INTERNET` permission, contains no WebView, and keeps Home/Capture cards, drafts, and queued text-share captures only in current-process `HomeViewModel` memory. It does not bind the native durable Go repository, the accepted production web/server runtime, an Identity session, synchronization, backup/restore, or migration authority.

## Acceptance boundary

This mapping remains `foundation` / `applicable-migration-required`, not accepted conformance. Still required are complete rendered/native V1.1 review; a reviewed Deep Dark runtime policy if product requirements call for one; Reduced Transparency, Increased Contrast/native equivalents, Reduced Motion, 200% text/reflow, RTL/localization, TalkBack/Switch Access, runtime Touch Assistance behavior, adaptive phone/tablet/foldable composition, representative physical-device capture/share/shortcut behavior, Human Visual Excellence, platform-system acceptance, production signing/distribution, release approval, migration acceptance, and Stable qualification.
