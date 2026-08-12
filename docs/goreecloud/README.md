# GoreeCloud Notes Fork Record

## Role

I maintain this repository as **GoreeCloud Notes**, the private, self-hosted quick-note application for GoreeCloud.

This repository is a fork of [`usememos/memos`](https://github.com/usememos/memos). I preserve upstream attribution and the MIT license while maintaining GoreeCloud-specific product identity, user-experience changes, integrations, and features.

## Development Model

I will minimize divergence from upstream. I will keep upstream behavior when it already satisfies GoreeCloud requirements and add GoreeCloud-specific behavior only when it provides a material product, privacy, recovery, or maintenance benefit.

The initial GoreeCloud development branch is:

- `feature/goreecloud-foundation`

The branch was created from the fork's `main` branch at upstream commit:

- `34e2a59a4a94176ad95cdb8ce0a93917f471795c`
- Upstream commit date: August 11, 2026

The last stable release reviewed before the fork was Memos `v0.30.0` at commit:

- `2036c1ffc1b0a1e1fa6a473738c2a5ef520df67f`

At fork initialization, upstream `main` was 36 commits ahead of `v0.30.0`. I therefore treat `v0.30.0` as the initial reviewed release rather than claiming that the GoreeCloud development branch is built from the exact `v0.30.0` tree.

## Product Direction

The GoreeCloud product direction is a Google Keep-style notes workspace with:

- Fast note capture.
- A responsive card-oriented workspace.
- Pinned notes.
- Markdown-backed note content.
- Checklists.
- Labels using the upstream tag model.
- Attachments and inline images.
- Search and filtering.
- Archive and restore.
- Private-by-default note creation.
- Individual user accounts.
- Portable export and documented recovery.

Later GoreeCloud-specific work may add persistent per-note colors, a recoverable Trash workflow, reminders through ntfy, improved offline/PWA behavior, Google Keep import, and optional local-only AI integrations.

## Current Implementation Status

The initial GoreeCloud foundation and the first Keep-style workspace changes are implemented on `feature/goreecloud-foundation`.

Implemented so far:

- GoreeCloud Notes product identity in the application shell and PWA manifest.
- Private-by-default note creation preserved from upstream.
- A centered full-width quick-capture composer above the multi-column note grid.
- `Take a note…` quick-capture language.
- Separate **Pinned** and **Notes** sections when pinned notes exist.
- Pinned-note visual emphasis.
- Rounded note cards with restrained hover elevation for faster visual scanning.
- Notes-oriented signed-in navigation that removes **Explore** from the normal authenticated scope switcher while retaining the upstream route for compatibility and direct links.
- A dedicated optional **Title** field for top-level notes, backed by the leading Markdown H1 so the stored document remains upstream-compatible Markdown.
- Separate title/body editing for top-level notes while replies retain the upstream single-document editor.
- Keep-style rendering for a leading H1 title without changing the appearance of ordinary H1 headings elsewhere in a note.
- Unit coverage for the Markdown title split/compose behavior.
- Frontend TypeScript, Biome checks, full frontend unit suite, and production frontend build validated successfully after the navigation and title milestone at commit `aad1efc9c70b7de22ac694b1a9a544bf21a213e9`.

The next implementation milestone is persistent per-note colors. The color extension will be designed as the smallest durable data-model addition that can be carried through the API, storage backends, editor, card renderer, migrations, tests, and export path without breaking Markdown portability.

Still planned for the first GoreeCloud Notes release:

- Per-note colors.
- Recoverable Trash and restore behavior.
- Portable Markdown and JSON export.
- GoreeCloud-specific validation and deployment packaging.

## Privacy Boundary

GoreeCloud Notes is intended to operate as a private GoreeCloud family service. I will not require public discovery, social interaction, telemetry, hosted control planes, proprietary authentication, or external AI providers for core note-taking functionality.

The upstream editor already initializes new notes with private visibility. I will preserve that behavior and avoid unnecessary fork-only code where upstream already satisfies the requirement.

## Upstream Maintenance

I will use `main` as the upstream-aligned stable branch until GoreeCloud changes are reviewed and intentionally merged. GoreeCloud feature work will use `feature/*`, fixes will use `fix/*`, security work will use `security/*`, and temporary upstream integration work will use `upstream-sync/*`.

Before integrating upstream changes, I will:

1. Review upstream release notes and commits.
2. Compare upstream changes against GoreeCloud modifications.
3. Review migrations, dependencies, authentication, storage, export, privacy, and user-interface changes.
4. Integrate through an isolated `upstream-sync/*` branch when needed.
5. Run the applicable upstream and GoreeCloud-specific tests.
6. Validate data migration and recovery before production deployment.

## Release Identification

I will identify GoreeCloud releases with both upstream ancestry and a GoreeCloud revision. I will finalize the first release identifier only after selecting the exact upstream baseline used for the first deployable GoreeCloud build.

## License and Attribution

Memos is distributed under the MIT License. GoreeCloud modifications remain subject to the repository's license and required copyright notices. I will not remove upstream attribution or represent upstream Memos work as original GoreeCloud authorship.
