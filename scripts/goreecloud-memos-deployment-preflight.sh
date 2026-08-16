#!/bin/sh
set -eu

# GoreeCloud Memos deployment preflight
#
# Read-only validation for the intended private production deployment. This script
# does not create, modify, restart, or remove Docker resources, DNS records, Caddy
# configuration, application data, backups, or certificates.
#
# Source validation: `sh -n scripts/goreecloud-memos-deployment-preflight.sh`.

HOSTNAME="${GOREECLOUD_MEMOS_HOSTNAME:-memos.goreecloud.com}"
CONTAINER="${GOREECLOUD_MEMOS_CONTAINER:-goreecloud-memos}"
COMPOSE_FILE="${GOREECLOUD_MEMOS_COMPOSE_FILE:-deploy/goreecloud/compose.yaml}"
ENV_FILE="${GOREECLOUD_MEMOS_ENV_FILE:-deploy/goreecloud/.env}"
EXPECTED_PRIVATE_IP="${GOREECLOUD_MEMOS_EXPECTED_PRIVATE_IP:-}"
PRIVATE_DNS_SERVER="${GOREECLOUD_MEMOS_PRIVATE_DNS_SERVER:-}"
HTTPS_TARGET_IP="${GOREECLOUD_MEMOS_HTTPS_TARGET_IP:-}"
EXPECTED_IMAGE="${GOREECLOUD_MEMOS_EXPECTED_IMAGE:-}"
EXPECTED_NETWORK="${GOREECLOUD_PROXY_NETWORK:-proxy}"

pass() { printf 'PASS: %s\n' "$*"; }
fail() { printf 'FAIL: %s\n' "$*" >&2; exit 1; }
info() { printf 'INFO: %s\n' "$*"; }
require_command() { command -v "$1" >/dev/null 2>&1 || fail "required command not found: $1"; }

for command_name in docker curl getent grep sed awk sort tr stat mktemp; do
  require_command "$command_name"
done

if [ -n "$PRIVATE_DNS_SERVER" ]; then
  require_command dig
fi

[ -f "$COMPOSE_FILE" ] || fail "Compose file not found: $COMPOSE_FILE"
[ -f "$ENV_FILE" ] || fail "environment file not found: $ENV_FILE"

compose_render="$(mktemp)"
trap 'rm -f "$compose_render"' EXIT HUP INT TERM

case "$(stat -c '%a' "$ENV_FILE")" in
  600|640) pass "environment file permissions are restricted" ;;
  *) fail "environment file permissions must be 0600 or 0640" ;;
esac

configured_image="$(sed -n 's/^GOREECLOUD_MEMOS_IMAGE=//p' "$ENV_FILE" | tail -n 1)"
[ -n "$configured_image" ] || fail "GOREECLOUD_MEMOS_IMAGE is missing from $ENV_FILE"
case "$configured_image" in
  ghcr.io/goreecloud/memos:goreecloud-v*@sha256:*) pass "configured image uses exact GoreeCloud tag plus digest" ;;
  *) fail "configured image must use ghcr.io/goreecloud/memos:goreecloud-vX.Y.Z@sha256:..." ;;
esac

if [ -n "$EXPECTED_IMAGE" ]; then
  [ "$configured_image" = "$EXPECTED_IMAGE" ] || fail "configured image does not match GOREECLOUD_MEMOS_EXPECTED_IMAGE"
  pass "configured image matches expected immutable release reference"
fi

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" config >"$compose_render"
pass "Compose configuration renders successfully"

if grep -Eq '(^|[[:space:]])published:' "$compose_render"; then
  fail "Compose configuration contains a published host port"
fi
pass "Compose configuration has no published backend host port"

docker network inspect "$EXPECTED_NETWORK" >/dev/null 2>&1 || fail "required Docker network is missing: $EXPECTED_NETWORK"
pass "required Docker proxy network exists"

docker inspect "$CONTAINER" >/dev/null 2>&1 || fail "container is not present: $CONTAINER"

running="$(docker inspect --format '{{.State.Running}}' "$CONTAINER")"
[ "$running" = "true" ] || fail "container is not running: $CONTAINER"
pass "container is running"

health="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$CONTAINER")"
[ "$health" = "healthy" ] || fail "container health is $health"
pass "container health is healthy"

runtime_user="$(docker inspect --format '{{.Config.User}}' "$CONTAINER")"
[ "$runtime_user" = "10001:10001" ] || fail "container runtime user is '$runtime_user', expected 10001:10001"
pass "container uses the approved non-root runtime identity"

runtime_image_id="$(docker inspect --format '{{.Image}}' "$CONTAINER")"
configured_image_id="$(docker image inspect --format '{{.Id}}' "$configured_image" 2>/dev/null || true)"
[ -n "$configured_image_id" ] || fail "configured immutable image is not present locally"
[ "$runtime_image_id" = "$configured_image_id" ] || fail "running container does not use the configured immutable image"
pass "running container matches the configured immutable image"

published_ports="$(docker inspect --format '{{range $p, $v := .NetworkSettings.Ports}}{{if $v}}{{$p}}={{$v}} {{end}}{{end}}' "$CONTAINER")"
[ -z "$published_ports" ] || fail "container publishes host ports: $published_ports"
pass "running container exposes no backend host ports"

networks_json="$(docker inspect --format '{{json .NetworkSettings.Networks}}' "$CONTAINER")"
printf '%s\n' "$networks_json" | grep -F "\"$EXPECTED_NETWORK\"" >/dev/null || fail "container is not attached to Docker network: $EXPECTED_NETWORK"
pass "container is attached to the approved proxy network"

host_resolved_ips="$(getent ahostsv4 "$HOSTNAME" 2>/dev/null | awk '{print $1}' | sort -u | tr '\n' ' ' || true)"
if [ -n "$host_resolved_ips" ]; then
  info "host resolver returns for $HOSTNAME: $host_resolved_ips"
else
  info "host resolver returned no IPv4 address for $HOSTNAME"
fi

if [ -n "$PRIVATE_DNS_SERVER" ]; then
  resolved_ips="$(dig @"$PRIVATE_DNS_SERVER" +short A "$HOSTNAME" | awk 'NF {print $1}' | sort -u | tr '\n' ' ')"
  [ -n "$resolved_ips" ] || fail "private DNS server $PRIVATE_DNS_SERVER did not resolve $HOSTNAME"
  info "$HOSTNAME via private DNS server $PRIVATE_DNS_SERVER resolves to: $resolved_ips"
  pass "private DNS server returned an address for $HOSTNAME"
else
  resolved_ips="$host_resolved_ips"
  [ -n "$resolved_ips" ] || fail "host resolver did not resolve $HOSTNAME"
  info "using host resolver result for private-DNS validation"
fi

if [ -n "$EXPECTED_PRIVATE_IP" ]; then
  printf '%s\n' "$resolved_ips" | grep -F "$EXPECTED_PRIVATE_IP" >/dev/null || fail "$HOSTNAME does not resolve to expected private IP $EXPECTED_PRIVATE_IP through the selected DNS validation path"
  pass "private DNS validation matches expected address"
fi

if [ -z "$HTTPS_TARGET_IP" ]; then
  if [ -n "$EXPECTED_PRIVATE_IP" ]; then
    HTTPS_TARGET_IP="$EXPECTED_PRIVATE_IP"
  elif [ -n "$PRIVATE_DNS_SERVER" ]; then
    HTTPS_TARGET_IP="$(printf '%s\n' "$resolved_ips" | awk '{print $1}')"
  fi
fi

https_get() {
  path="$1"
  if [ -n "$HTTPS_TARGET_IP" ]; then
    curl --fail --silent --show-error --location --max-time 10 \
      --resolve "${HOSTNAME}:443:${HTTPS_TARGET_IP}" \
      "https://${HOSTNAME}${path}"
  else
    curl --fail --silent --show-error --location --max-time 10 \
      "https://${HOSTNAME}${path}"
  fi
}

if [ -n "$HTTPS_TARGET_IP" ]; then
  info "HTTPS validation is pinned to private target $HTTPS_TARGET_IP"
fi

health_body="$(https_get /healthz)" || fail "HTTPS health endpoint is not reachable"
printf '%s\n' "$health_body" | grep -F 'Service ready.' >/dev/null || fail "HTTPS health endpoint returned unexpected content"
pass "Caddy/TLS path reaches the Memos health endpoint"

page_body="$(https_get /)" || fail "application page is not reachable through HTTPS"
printf '%s\n' "$page_body" | grep -F 'GoreeCloud Memos' >/dev/null || fail "application page does not identify as GoreeCloud Memos"
pass "application page identifies as GoreeCloud Memos"

info "Preflight does not prove backup freshness, isolated restore success, Uptime Kuma configuration, or rollback execution."
info "Those records must be verified separately before production acceptance."
printf '\nGoreeCloud Memos deployment preflight passed for https://%s\n' "$HOSTNAME"
