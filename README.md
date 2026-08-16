# GoreeCloud Memos

GoreeCloud Memos is the GoreeCloud-maintained fork of [Memos](https://github.com/usememos/memos) for **lightweight, private quick-note capture**.

It is intentionally focused on fast capture, simple retrieval, labels, pinning, Archive and recoverable Trash, attachments where useful, portable export, responsive/PWA use, and a polished GoreeCloud **Glaze UI** experience.

GoreeCloud Memos and [GoreeCloud Notes](https://github.com/GoreeCloud/goreecloud-notes) are separate, complementary products. Memos is the quick-capture product; Notes is the larger notes, knowledge-management, research, and long-term productivity product.

## Product principles

- **Quick capture first.** Opening the app and writing should stay low-friction.
- **Private by default.** GoreeCloud-specific behavior favors authenticated, private note creation and avoids unnecessary public/social workflows.
- **Own the data.** Markdown-friendly content, documented exports, attachments, and persistence are treated as portable user data rather than disposable application state.
- **Glaze UI throughout.** Authentication, navigation, content surfaces, empty states, settings, About, light/dark modes, reduced-motion, and reduced-transparency behavior should feel consistently GoreeCloud.
- **Maintain the fork responsibly.** Preserve the upstream relationship, MIT license, required attribution, security fixes, compatibility knowledge, and avoid unnecessary divergence.
- **Keep the scope narrow.** Deep notebooks, knowledge graphs, research workspaces, extensive revision systems, and Evernote-class knowledge management belong primarily to GoreeCloud Notes.

## Current capabilities

The GoreeCloud line includes the quick composer, Markdown memo content and checklists, optional titles, pinned memos, labels, search and filtering, Archive, recoverable Trash, per-memo colors, attachments, portable export, private-by-default behavior, responsive/PWA support, Glaze UI presentation, hardened container packaging, and restart-persistence validation.

Historical Notes-branded RC1–RC3 work remains in Git history as engineering, migration, and provenance evidence. That history does not define the current product identity: this repository is GoreeCloud Memos.

## Repository and upstream

- GoreeCloud repository: `GoreeCloud/goreecloud-memos`
- Canonical source branch: `main`
- Upstream repository: `usememos/memos`
- License: MIT; upstream copyright and license obligations remain preserved
- Stable product address: `https://memos.goreecloud.com`

## Stable release status

GoreeCloud Memos `goreecloud-v0.1.0` is the established Stable release from commit `181317ee0d8c32f5e0c2e625b7b293afdfc659c5`.

The validated production image is:

`ghcr.io/goreecloud/memos:goreecloud-v0.1.0@sha256:15f523fb1ac2b946339d9216d741b4368fbfd8631159487acc20b4133702ace1`

The Stable release was restored from the preserved historical Memos data in an isolated validation environment, promoted to the dedicated GoreeCloud Memos runtime, and accepted through the private `https://memos.goreecloud.com` publication path before the historical Notes-branded Memos runtime was retired. `notes.goreecloud.com` remains reserved for the separate native GoreeCloud Notes application.

Later commits and pull requests are post-Stable development until they are separately validated, merged, released, and deployed. Source changes must not be represented as production merely because CI passes or they exist on `main`.

See [`docs/goreecloud/release-candidate-validation.md`](docs/goreecloud/release-candidate-validation.md) for the preserved RC history, Stable evidence boundary, and post-Stable validation rules.

## Development

The frontend uses Node.js 24 and pnpm 11.0.1. The backend is written in Go.

```bash
# Backend
go run ./cmd/memos --port 8081

# Frontend, in a second terminal
cd web
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

The frontend development server runs on `http://localhost:3001` and proxies API requests to the backend on port `8081`.

Before proposing a new release, run the applicable lint, unit, production-build, container, persistence, export, attachment, backup/restore, and deployment checks at the exact candidate revision. Source-level success must not be treated as proof of a production deployment.

## GoreeCloud deployment package

`deploy/goreecloud/` contains the GoreeCloud-oriented Docker Compose package and supporting configuration examples. It is a source-controlled deployment reference, not authorization to modify a live host.

Production changes must follow GoreeCloud private-service publication, Docker, backup/recovery, network-exposure, secret-separation, and validation requirements.

## Security

See [SECURITY.md](SECURITY.md). Do not commit passwords, tokens, private keys, production secrets, private user data, or reusable credentials.

## Attribution

GoreeCloud Memos derives from the open-source Memos project. GoreeCloud branding and Glaze UI do not remove upstream authorship or legal attribution. See [LICENSE](LICENSE) and the upstream project at <https://github.com/usememos/memos>.
