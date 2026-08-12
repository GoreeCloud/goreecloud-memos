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
- Recoverable Trash and explicit permanent deletion.
- Private-by-default note creation.
- Individual user accounts.
- Portable Markdown and JSON export.
- Documented recovery.

Later GoreeCloud-specific work may add reminders through ntfy, improved offline/PWA behavior, Google Keep import, richer attachment-bundle export, and optional local-only AI integrations.

## Current Implementation Status

The initial GoreeCloud foundation, Keep-style workspace, title model, persistent note colors, recoverable Trash workflow, and portable export milestone are implemented on `feature/goreecloud-foundation`.

Implemented so far:

- GoreeCloud Notes product identity in the application shell and PWA manifest.
- Private-by-default note creation preserved from upstream.
- A centered full-width quick-capture composer above the multi-column note grid.
- `Take a note…` quick-capture language.
- Separate **Pinned** and **Notes** sections when pinned notes exist.
- Pinned-note visual emphasis.
- Rounded note cards with restrained hover elevation for faster visual scanning.
- Notes-oriented signed-in navigation that removes **Explore** from the normal authenticated scope switcher while retaining the upstream route for compatibility and direct links.
- A dedicated optional **Title** field for top-level notes, backed by the leading Markdown H1 so the stored document remains upstream-compatible Markdown rather than introducing a second title storage format.
- Separate title/body editing for top-level notes while replies retain the upstream single-document editor.
- Keep-style rendering for a leading H1 title without changing the appearance of ordinary H1 headings elsewhere in a note.
- Unit coverage for the Markdown title split/compose behavior.
- Persistent per-note colors with default, red, orange, yellow, green, teal, blue, purple, and pink choices.
- A note-card **Color** submenu with visual swatches and selected-color indication.
- Color state stored as a trailing GoreeCloud HTML comment in the Markdown document rather than a database or API schema extension, preserving compatibility with the existing Memos storage model and keeping the data portable.
- Color metadata hidden from the editor and copied note content while being preserved automatically when a colored note is edited.
- Unit coverage for color detection, replacement, removal, and metadata stripping.
- Recoverable Trash for top-level notes. The normal delete action now moves a note to Trash instead of calling the upstream hard-delete operation immediately.
- Trash state stored as a GoreeCloud Markdown metadata marker that preserves whether the note originated from Notes or Archive.
- Trashed notes moved to the upstream `NORMAL` state internally and excluded from ordinary Notes and Archive queries using the existing cross-database CEL filter engine.
- A dedicated authenticated `/trash` page that lists only trashed notes owned by the signed-in user.
- Restore behavior that removes Trash metadata and returns a note to its original Notes or Archive state.
- Explicit **Delete permanently** behavior inside Trash that continues to use the upstream hard-delete path, including upstream cleanup of comments, relations, and attachments.
- Trash access from the signed-in user menu.
- Unit coverage for Trash metadata, color preservation, replacement, restore stripping, and server-side Trash filter composition.
- Individual-note **Export Markdown** action that downloads clean user-authored Markdown without GoreeCloud color or Trash implementation markers.
- Signed-in **Export notes** menu with full-library Markdown and JSON downloads.
- Full-library export pagination across the signed-in user's normal and archived top-level notes, including trashed notes because Trash is represented as a recoverable GoreeCloud state on normal notes.
- JSON export format `goreecloud-notes`, schema version 1, preserving note UID/name, title, clean Markdown, normal/archive/Trash state, Trash restore target, visibility, pin state, color, labels, timestamps, location, attachment metadata, and relations.
- Full-library Markdown export containing clean note content plus non-rendered export boundary metadata; implementation-specific color and Trash markers are stripped.
- Unit coverage for clean export serialization, title-based Markdown filenames, full-library Markdown, and the JSON schema envelope.
- Frontend TypeScript/Biome checks, full frontend unit suite, and production frontend build validated successfully for the export milestone at commit `f43e3c86fbdd24a018767658a73a60edc6f9615f`.

Current export limitation: the first portable export format does not bundle attachment binary content, comments, or reactions. Attachment metadata is preserved in JSON. These exclusions are declared in the JSON export itself so the artifact does not imply that those data categories were included.

The next implementation milestone is GoreeCloud-specific deployment packaging and end-to-end validation.

Still planned for the first GoreeCloud Notes release:

- Final Docker image and release identifier selection.
- GoreeCloud Docker Compose deployment configuration.
- Private `notes.goreecloud.com` publication through the approved NetBird, AdGuard Home, and Caddy model.
- Persistent-data backup and restore validation.
- End-to-end desktop and mobile/PWA validation.
- Final PR review, merge decision, and first GoreeCloud Notes release.

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
