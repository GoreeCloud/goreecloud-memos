# GoreeCloud Memos Monitoring Readiness

## Purpose

I use this record to define the production availability-monitoring contract for GoreeCloud Memos while Uptime Kuma remains the authoritative GoreeCloud availability-monitoring platform.

This document is a source-controlled acceptance contract. It does **not** claim that the live Uptime Kuma monitor has already been created.

## Target service

- Monitor name: `GoreeCloud Memos`
- Primary endpoint: `https://memos.goreecloud.com/healthz`
- Method: `GET`
- Expected HTTP status: `200`
- Expected response marker: `Service ready.`
- TLS verification: required
- Backend host-port publication: prohibited
- Production application container: `goreecloud-memos`
- Application port: `5230/tcp` inside Docker only

The monitor must validate the same private HTTPS/Caddy path used by approved clients rather than bypassing Caddy and checking the application container directly.

## Private-source requirement

The active Memos Caddy route currently permits approved NetBird client sources and denies other sources with HTTP 403. Before adding Uptime Kuma to the allowlist, I must inspect the **live** Uptime Kuma Docker network identity and confirm the exact source address Caddy observes.

I do not copy an address from another application's historical monitor contract and assume it is still correct. The live source identity must be observed and documented during the production monitoring change.

If I authorize a Docker-network monitoring source, the Caddy rule must allow only the exact required monitoring source in addition to the approved NetBird client range. I do not broaden Memos to an entire unnecessary Docker subnet merely to make monitoring work.

## Notification behavior

The Memos monitor should use the existing GoreeCloud availability-alert path while Uptime Kuma remains authoritative.

Acceptance requires:

- healthy service produces no false DOWN alert;
- a controlled Memos outage transitions the monitor to DOWN;
- the alert contains only the minimum service/outage information required for administration;
- recovery transitions the monitor back to UP and produces the expected recovery notification;
- monitoring credentials or notification secrets are not exposed in source, logs, screenshots, or permanent documentation; and
- the monitor does not gain administrative access to Memos data or user content.

## Acceptance procedure

Before marking Memos monitoring complete, I verify all of the following on the live target:

1. Record the current Uptime Kuma version and backup/recovery point.
2. Inspect the live Uptime Kuma source network and the source address seen by Caddy.
3. Back up the active Caddy configuration before changing a Memos source allowlist.
4. Add only the narrow monitoring-source allowance required for the Memos health endpoint.
5. Validate and reload Caddy without altering the existing NetBird-only user-access model.
6. Create the `GoreeCloud Memos` HTTPS monitor using the target contract above.
7. Confirm TLS verification is enabled and the monitor reaches the private HTTPS endpoint.
8. Confirm the healthy endpoint returns HTTP 200 and `Service ready.` without false alerts.
9. Perform a controlled stop of only `goreecloud-memos` during an approved maintenance window.
10. Confirm Uptime Kuma records DOWN and the approved outage notification is received.
11. Restart only `goreecloud-memos` and wait for Docker health to return healthy.
12. Confirm Uptime Kuma records recovery and the approved recovery notification is received.
13. Confirm Caddy still returns HTTP 403 to an unapproved non-NetBird/non-monitoring source.
14. Confirm the Memos backend still has no host-published port.
15. Record the monitor identity, validation date, alert result, and rollback state without recording reusable secrets.

## Rollback

If the monitoring change causes unexpected access, false alerts, or publication behavior, I:

1. disable or remove only the new Memos Uptime Kuma monitor;
2. restore the pre-change Caddy configuration if a monitoring-source allowance was added;
3. validate and reload Caddy;
4. confirm approved NetBird clients can still reach Memos;
5. confirm unapproved sources receive HTTP 403; and
6. leave the Memos application runtime and data unchanged.

## Completion rule

I mark GoreeCloud Memos monitoring complete only when the live Uptime Kuma monitor exists, the private HTTPS path is verified, controlled DOWN and RECOVERED transitions have been observed, the administrator receives the expected notifications, and the Caddy source boundary remains least-privilege.

Until that target-environment evidence exists, monitoring remains an open operational gate even though the Memos application itself is stable and currently usable.
