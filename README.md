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

The GoreeCloud development line includes the quick composer, Markdown note content and checklists, pinned notes, labels, search and filtering, Archive, recoverable Trash, per-note colors, attachments, portable export, private-by-default behavior, responsive/PWA support, Glaze UI presentation, hardened container packaging, and restart-persistence validation.

Historical Notes-branded RC1–RC3 work remains in Git history as engineering, migration, and provenance evidence. That history does not define the current product identity: this repository is now GoreeCloud Memos.

## Repository and upstream

- GoreeCloud repository: `GoreeCloud/goreecloud-memos`
- Canonical source branch: `main`
- Upstream repository: `usememos/memos`
- License: MIT; upstream copyright and license obligations remain preserved
- Target GoreeCloud address: `https://memos.goreecloud.com`

The target hostname is a deployment goal, not proof that the production cutover has already occurred. DNS, Caddy, TLS, monitoring, backup coverage, application data, and rollback must be validated before retiring the historical Notes-branded publication path.

## Release status

The post-RC stabilization work is merged into `main`, but a merged source baseline is **not** the same as a Stable release or an approved production cutover. Historical Notes-branded RC1–RC3 artifacts remain validation evidence only.

Before a Stable GoreeCloud Memos release, validate the exact candidate revision, product terminology and Glaze UI behavior, data portability and recovery, container/deployment integrity, real-device responsive/PWA behavior, and the controlled transition to `https://memos.goreecloud.com`. See [`docs/goreecloud/release-candidate-validation.md`](docs/goreecloud/release-candidate-validation.md) for the release-gate boundary.

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

Before proposing a release, run the applicable lint, unit, production-build, container, persistence, export, attachment, backup/restore, and deployment checks. Source-level success must not be treated as proof of a production deployment.

## GoreeCloud deployment package

`deploy/goreecloud/` contains the GoreeCloud-oriented Docker Compose package and supporting configuration examples. It is a source-controlled deployment reference, not authorization to modify a live host.

Production changes must follow GoreeCloud private-service publication, Docker, backup/recovery, network-exposure, secret-separation, and validation requirements.

## Security

See [SECURITY.md](SECURITY.md). Do not commit passwords, tokens, private keys, production secrets, private user data, or reusable credentials.

## Attribution

GoreeCloud Memos derives from the open-source Memos project. GoreeCloud branding and Glaze UI do not remove upstream authorship or legal attribution. See [LICENSE](LICENSE) and the upstream project at <https://github.com/usememos/memos>.