# Security Policy

## Scope

This repository is the transitional Memos-derived implementation used as a migration source and historical service line for GoreeCloud Notes. Security work remains in scope while the transitional implementation is retained or deployed.

The native long-term Notes product is developed separately in `GoreeCloud/goreecloud-notes`.

## Supported Code

Security fixes should target the currently maintained GoreeCloud transitional branch or the exact deployed GoreeCloud release that is still in service. Historical release candidates and arbitrary older commits are not automatically supported.

Because this repository derives from Memos, relevant upstream Memos security fixes, dependency advisories, authentication changes, migrations, and container changes must continue to be reviewed until the transitional service is retired.

## Reporting a Vulnerability

Do **not** publish suspected vulnerabilities, credentials, private infrastructure details, exploit steps, or sensitive user information in a public issue or discussion.

Report the issue privately to the GoreeCloud repository owner through an established private GoreeCloud administrative channel. If GitHub private vulnerability reporting is enabled for this repository, that private reporting path is also appropriate.

Include when available:

- a concise description of the issue;
- affected commit, release, or deployment version;
- steps required to reproduce it;
- expected and observed behavior;
- security impact and affected data or permissions;
- whether the problem is inherited from upstream Memos or introduced by a GoreeCloud change; and
- any safe mitigation already identified.

Do not include reusable secrets in the report body unless the private reporting method is explicitly approved for that secret. Rotate exposed credentials independently of the software fix.

## Security Priorities

Transitional maintenance should prioritize:

- authentication and authorization integrity;
- individual-user data separation;
- private-by-default visibility and sharing behavior;
- attachment and export authorization;
- XSS, Markdown/rendering, upload, and content-sanitization risks;
- dependency and container vulnerabilities;
- database migration and data-integrity risks;
- secret separation and least privilege;
- removal of unnecessary network exposure;
- backup/restore confidentiality and integrity; and
- migration safety to native GoreeCloud Notes.

## Deployment Boundary

A login page alone is not considered sufficient private-service protection. GoreeCloud deployments should use the approved private networking, reverse-proxy, TLS, application-authentication, and no-unnecessary-host-port model documented for the current environment.

Repository configuration does not prove that a live deployment is secure. Validate the deployed network path, access controls, secrets, logging, persistent storage, backup scope, and recovery process directly.

## Disclosure and Remediation

Security fixes should be validated before deployment and documented with enough detail to support future review without unnecessarily publishing exploit-enabling information before remediation is complete.

When a vulnerability is inherited from upstream, preserve the upstream relationship and evaluate the upstream fix rather than creating unnecessary long-lived divergence.
