# GoreeCloud Memos Security Policy

## Scope

This policy covers the GoreeCloud-maintained Memos fork in `GoreeCloud/goreecloud-memos`, including GoreeCloud-specific frontend behavior, deployment packaging, data-state extensions, export/recovery behavior, and changes carried on the active development line.

GoreeCloud Memos is a private-by-default quick-note application. Security work must preserve that product role without weakening upstream Memos protections or silently blocking relevant upstream security fixes.

## Security priorities

Changes should receive heightened review when they affect:

- authentication, sessions, authorization, or account separation;
- private-by-default visibility and public/share behavior;
- attachment upload, storage, rendering, or download authorization;
- Markdown/HTML rendering, sanitization, links, embeds, and cross-site scripting boundaries;
- exports, imports, backups, restores, migrations, and data integrity;
- database migrations and persistent GoreeCloud note state;
- dependencies, build tooling, GitHub Actions, or container supply-chain behavior;
- secrets, environment/configuration files, filesystem permissions, or least privilege;
- network exposure, reverse-proxy assumptions, and private-service publication; and
- the controlled transition to `memos.goreecloud.com`.

## Reporting

Do not publish suspected vulnerabilities, credentials, private infrastructure details, private user content, or exploit details in a public issue.

Use a private GoreeCloud administrative/security channel for GoreeCloud-specific findings. For an upstream Memos vulnerability, also follow the upstream project's current security-reporting process when appropriate.

## Deployment boundary

A successful application build, a login page, or a healthy container is not sufficient evidence that a deployment is secure. Production acceptance must also verify the intended access path, TLS, DNS, reverse proxy, firewall/network exposure, authentication behavior, persistent-data ownership/permissions, backup coverage, restore path, monitoring, and rollback capability.

Do not expose the Memos backend port directly to the public internet as a substitute for the approved GoreeCloud publication architecture.

## Secrets and private information

Never commit reusable secrets. Keep passwords, tokens, API keys, private keys, recovery material, production environment values, and other sensitive information outside ordinary source and documentation. Use only synthetic data in automated tests and examples.

## Upstream maintenance

This fork retains responsibility for monitoring relevant upstream Memos releases, security fixes, dependency changes, database migrations, breaking changes, and license changes. GoreeCloud-specific divergence must remain deliberate and reviewable.
