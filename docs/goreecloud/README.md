# GoreeCloud Memos Fork Record

## Role

GoreeCloud Memos is the GoreeCloud-maintained fork of Memos used for lightweight quick-note capture. It is optimized for fast writing, simple retrieval, private-by-default use, and a focused Glaze UI interface.

GoreeCloud Memos is separate from GoreeCloud Notes. Memos remains intentionally lightweight; GoreeCloud Notes is the native full notes and knowledge-management product.

## Historical context

This source tree was originally used for the Memos-based GoreeCloud Notes RC1–RC3 line. That work established useful GoreeCloud behavior including private-by-default capture, Glaze UI direction, the quick composer, labels, per-note colors, Archive, recoverable Trash, export improvements, attachment persistence evidence, and container validation.

That history is retained as engineering and migration evidence. Current product-facing development in this repository must use the GoreeCloud Memos identity and quick-capture scope.

## Product boundary

Appropriate Memos work includes:

- quick capture and editing;
- Markdown and checklists;
- pinning, labels/tags, filtering, and search;
- Archive and recovery-oriented Trash;
- compact note colors and attachments where they remain low-friction;
- individual accounts and private-by-default behavior;
- responsive/PWA behavior;
- portable export;
- accessibility and Glaze UI consistency;
- security, dependency, compatibility, performance, persistence, backup/restore, and deployment hardening.

Deep notebooks, advanced backlinks/knowledge graphs, research organization, extensive revision systems, OCR-heavy document processing, and broad knowledge-management workflows belong primarily to GoreeCloud Notes unless a narrowly scoped Memos requirement is separately approved.

## Upstream relationship

- GoreeCloud repository: `GoreeCloud/goreecloud-memos`
- Upstream: `usememos/memos`
- Governing license: MIT

GoreeCloud branding does not replace upstream authorship or license obligations. Relevant upstream releases and security fixes should be reviewed, while unnecessary divergence should be avoided.

## Glaze UI

Glaze UI is the required GoreeCloud presentation language for this fork. Product identity must be consistent across setup/authentication, sidebar and mobile navigation, content pages, Settings, About, empty/loading/error states, browser/PWA metadata, and accessible light/dark/reduced-effect behavior.

Upstream visual branding may be replaced where GoreeCloud controls the user-facing experience, while source/legal attribution remains preserved.

## Release and deployment boundary

Historical Notes-branded release candidates are not automatically stable GoreeCloud Memos releases. Stable Memos readiness requires product-brand reconciliation, green source/container checks, data portability and persistence validation, security review, and verified backup/restore and deployment behavior.

The approved target address is `https://memos.goreecloud.com`. The runtime cutover is a separate infrastructure change and must preserve data, users, TLS, private DNS, Caddy routing, monitoring, backup coverage, and rollback before the old Notes-branded publication path is retired.
