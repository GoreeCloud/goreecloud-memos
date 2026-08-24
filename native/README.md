# GoreeCloud Memos Native Foundation

This directory begins the original GoreeCloud-owned implementation of GoreeCloud Memos.

## Product role

GoreeCloud Memos is the lightweight quick-capture application in GoreeCloud Suite. Its native implementation is intentionally focused on immediate capture, simple retrieval, labels, pinning, Archive, recoverable Trash, attachments where justified, portable export, responsive clients, and controlled interoperability with GoreeCloud Notes.

## Transition boundary

The existing Memos-derived application remains the accepted production source/runtime until a native replacement independently satisfies migration, equivalence, recovery, security, privacy, Glaze UI, Everkeep, client, release, and production-acceptance gates.

The upstream-derived source tree is retained only as transition, compatibility, migration, provenance, and product-reference material. New native product logic must not depend on upstream Memos application architecture, UI, workflows, or general application code.

## Initial native architecture

The initial native foundation uses:

- Go for the application service and domain model;
- versioned HTTP APIs owned by GoreeCloud;
- application-owned memo and lifecycle contracts;
- local-first development without external telemetry;
- explicit Glaze UI, Wardveil Security, Privacy Shield, and Everkeep integration contracts;
- migration tooling that reads protected existing Memos data without mutating the source; and
- deterministic tests before any production cutover.

## Current milestone

Milestone 0 establishes the native product boundary, domain model, API health contract, platform-system integration manifest, validation tooling, and continuous integration. It does not authorize deployment or migration.