# GoreeCloud Memos — Competitive Objectives

GoreeCloud Memos should differentiate through a deliberately focused quick-capture role rather than by mechanically maximizing feature count.

Objectives are to make capture fast, preserve local-first and self-hostable operation, keep user-owned portable data, provide reliable offline and future cross-device behavior, recover cleanly from failures, and integrate with the wider GoreeCloud ecosystem without requiring external accounts or hosted dependencies.

## Native product boundary

The current GoreeCloud Memos implementation is an original GoreeCloud-native application. Its architecture, storage model, UI implementation, interaction model, tests, and future service integration are controlled by GoreeCloud rather than inherited from an upstream application.

The historical GoreeCloud Memos experience was based on a fork of `usememos/memos`. That historical product remains useful as research and design-history evidence, but it is not the implementation foundation for the new native application.

Useful historical ideas may be independently reimplemented through the GoreeCloud Reforge process:

**Research → Compare → Understand → Extract Requirements → Redesign → Reforge → Improve → Validate → Document**

Do not copy historical upstream source, CSS, component structure, or branding into the native application merely to reproduce the old interface. Convert useful behavior into GoreeCloud-owned requirements and implement it independently.

## Experience objectives

The native experience should preserve what worked well in the older Memos product while materially improving it:

- instant capture without forcing a full editor workflow;
- a persistent, understandable Memos / Archive / Trash information architecture;
- highly visible search and strong keyboard navigation;
- fast label access without turning labels into the entire navigation model;
- calm masonry or card presentation for quick visual scanning;
- contextual actions that stay available without covering memo content;
- responsive Mobile, Tablet, and Desktop compositions rather than a desktop page squeezed onto small screens;
- stable Light, Dark, and Deep Dark presentation with accessibility fallbacks;
- Glaze UI material hierarchy in which durable reading surfaces remain solid or near-solid and translucent Glaze is reserved for interaction chrome;
- direct control over future features, data formats, accessibility, lifecycle behavior, licensing, interoperability, and GoreeCloud integration.

The target is not to recreate usememos with GoreeCloud branding. The target is a recognizably GoreeCloud quick-capture application that can learn from the older experience while exceeding it in polish, adaptability, accessibility, maintainability, and platform integration.

The current development slice is not yet suitable for public comparative performance or feature-superiority claims. Benchmarks and competitive assertions require measured evidence before publication.
