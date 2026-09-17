# GoreeCloud Memos — Security

## Current security boundary

The current development slice is a local browser application with no authentication, server, synchronization service, privileged API, or production deployment. It must not be represented as suitable for protecting shared or remotely accessible memo data.

## Source-control requirements

- Never commit passwords, tokens, private keys, production environment files, recovery codes, signing material, or reusable credentials.
- Keep CI workflow permissions least-privilege.
- Do not expose privileged credentials to untrusted pull-request code.
- Treat future self-hosted runners with infrastructure access as privileged systems and route workloads according to verified labels and trust boundaries.

## Vulnerability reporting

Do not publish secrets or exploitable private details in a public issue. Use a private repository-owner security channel or GitHub private vulnerability reporting when it is available. If no private reporting path is available, open a minimal public issue that contains no exploit details or sensitive information and request a private contact path.

## Future security work

Authentication, session security, multi-user isolation, attachment authorization, rate limiting, security-event logging, GoreeCloud Identity, Wardveil Security, GoreeCloud Policy, and production hardening remain unimplemented and release-blocking for the applicable future scopes.
