# GoreeCloud Memos Monitoring Readiness

## Purpose

I use this record to define the production availability-monitoring contract for GoreeCloud Memos while Uptime Kuma remains the authoritative GoreeCloud availability-monitoring platform.

GoreeCloud Memos already has accepted production monitoring as part of the v0.1.2 production state. This document therefore governs **revalidation** of that existing monitoring relationship during the v0.1.3 production upgrade; it does not direct me to create a duplicate monitor or broaden the Caddy access boundary unnecessarily.

## Current and target runtime

Current accepted production image:

```text
ghcr.io/goreecloud/memos:goreecloud-v0.1.2@sha256:98cea4ed48e6c8dea2c70a7c88b5b246ae8569a69ad5fe749127a91720ef00be
```

Published v0.1.3 Stable target image:

```text
ghcr.io/goreecloud/memos:goreecloud-v0.1.3@sha256:13b45db6b0977d5b4c89afba2a1d5d0eacf9bc1ad884f86c0c719958de1b84f4
```

## Target service contract

- Monitor name: `GoreeCloud Memos`
- Primary endpoint: `https://memos.goreecloud.com/healthz`
- Method: `GET`
- Expected HTTP status: `200`
- Expected response marker: `Service ready.`
- TLS verification: required
- Backend host-port publication: prohibited
- Production application container: `goreecloud-memos`
- Application port: `5230/tcp` inside Docker only

The monitor validates the private HTTPS/Caddy path rather than bypassing Caddy and checking the application container through a newly exposed host port.

## Existing private-source boundary

Before changing monitoring or Caddy during the v0.1.3 maintenance window, I inspect the **live** Uptime Kuma monitor identity and the exact source allowance already accepted for GoreeCloud Memos.

If the existing monitor remains correct, I preserve it unchanged and revalidate it. I do not create a duplicate Memos monitor, copy a source address from another application's historical contract, or broaden the Memos allowlist to an unnecessary Docker subnet.

If the observed Uptime Kuma source identity has changed since the previous acceptance, I treat that as a separate narrow monitoring-source correction: back up the active Caddy configuration, identify the exact required source, apply only the least-privilege allowance, validate/reload Caddy, and verify both approved access and unintended-source denial before proceeding.

## Notification behavior

The Memos monitor uses the existing GoreeCloud availability-alert path while Uptime Kuma remains authoritative.

v0.1.3 acceptance requires:

- the healthy service produces no false DOWN alert after cutover;
- a controlled Memos outage during the approved maintenance window transitions the existing monitor to DOWN when practical;
- the alert contains only the minimum service/outage information required for administration;
- recovery transitions the monitor back to UP and produces the expected recovery notification;
- monitoring credentials or notification secrets are not exposed in source, logs, screenshots, or permanent documentation; and
- the monitor does not gain administrative access to Memos data or user content.

## v0.1.3 revalidation procedure

Before marking v0.1.3 monitoring acceptance complete, I verify all of the following on the live target:

1. Record the current Uptime Kuma version, existing `GoreeCloud Memos` monitor identity, current state, and rollback/recovery point without recording reusable secrets.
2. Confirm the monitor target is exactly `https://memos.goreecloud.com/healthz` with TLS verification, HTTP 200, and response marker `Service ready.`.
3. Inspect the current Caddy Memos route and identify the already accepted monitoring-source allowance.
4. Confirm v0.1.2 is healthy and monitored before the application upgrade begins.
5. Deploy v0.1.3 through the controlled Memos production checklist without restarting Uptime Kuma or Caddy unnecessarily.
6. Confirm the existing monitor returns or remains UP after v0.1.3 becomes healthy.
7. Confirm the private endpoint still returns HTTP 200 with `Service ready.` through the monitor path.
8. Perform a controlled stop of only `goreecloud-memos` during the approved maintenance window when practical.
9. Confirm Uptime Kuma records DOWN and the approved outage notification is received.
10. Restart only `goreecloud-memos` and wait for Docker health to return healthy.
11. Confirm Uptime Kuma records recovery and the approved recovery notification is received.
12. Confirm Caddy still permits approved NetBird clients and the exact monitoring source while denying an unapproved non-NetBird/non-monitor source.
13. Confirm the Memos backend still has no host-published port.
14. Confirm monitoring logs/evidence contain no reusable credentials or private memo content.
15. Record the monitor identity, validation time, DOWN/RECOVERED result, notification result, and rollback state.

## Rollback

If the v0.1.3 application upgrade fails but monitoring itself remains correct, I keep the monitor and Caddy source boundary intact while following the application rollback procedure.

If a monitoring-source correction made during the maintenance window causes unexpected access or false monitoring behavior, I:

1. restore the pre-change Caddy configuration when the Caddy source allowance changed;
2. validate and reload Caddy;
3. restore or re-enable only the previously accepted Memos monitor configuration if it was changed;
4. confirm approved NetBird clients can still reach Memos;
5. confirm the intended monitor path works;
6. confirm unapproved sources receive HTTP 403; and
7. leave Memos user/application data unchanged except as required by the separate application rollback procedure.

## Completion rule

I mark v0.1.3 monitoring acceptance complete only when the existing GoreeCloud Memos Uptime Kuma monitor is verified against the v0.1.3 runtime, the private HTTPS path remains correct, expected UP/DOWN/RECOVERED behavior and notifications are observed for the maintenance window when practical, and the Caddy source boundary remains least-privilege.

Until that target-environment evidence exists, the v0.1.3 release remains deployment-pending even though its source and immutable image were published successfully.
