#!/bin/sh
set -eu

SCRIPT="${1:-scripts/goreecloud-memos-deployment-preflight.sh}"
[ -f "$SCRIPT" ] || { echo "preflight script not found: $SCRIPT" >&2; exit 1; }

root="$(mktemp -d)"
trap 'rm -rf "$root"' EXIT HUP INT TERM
mock_bin="$root/bin"
mkdir -p "$mock_bin"

compose_file="$root/compose.yaml"
env_file="$root/.env"
curl_log="$root/curl.log"
output="$root/output.log"
image='ghcr.io/goreecloud/memos:goreecloud-v0.1.1@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'

cat >"$compose_file" <<'YAML'
name: goreecloud-memos
services:
  memos:
    image: placeholder
    expose:
      - "5230"
YAML
printf 'GOREECLOUD_MEMOS_IMAGE=%s\n' "$image" >"$env_file"
chmod 0600 "$env_file"

cat >"$mock_bin/docker" <<'EOF_DOCKER'
#!/bin/sh
set -eu
if [ "$1" = "compose" ]; then
  cat <<'YAML'
name: goreecloud-memos
services:
  memos:
    expose:
      - "5230"
YAML
  exit 0
fi
if [ "$1" = "network" ] && [ "$2" = "inspect" ]; then
  exit 0
fi
if [ "$1" = "image" ] && [ "$2" = "inspect" ]; then
  printf '%s\n' 'sha256:mock-image'
  exit 0
fi
if [ "$1" = "inspect" ]; then
  if [ "${2:-}" != "--format" ]; then
    exit 0
  fi
  case "$3" in
    '{{.State.Running}}') printf '%s\n' true ;;
    '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}') printf '%s\n' healthy ;;
    '{{.Config.User}}') printf '%s\n' '10001:10001' ;;
    '{{.Image}}') printf '%s\n' 'sha256:mock-image' ;;
    '{{range $p, $v := .NetworkSettings.Ports}}{{if $v}}{{$p}}={{$v}} {{end}}{{end}}') printf '%s' '' ;;
    '{{json .NetworkSettings.Networks}}') printf '%s\n' '{"proxy":{}}' ;;
    *) echo "unexpected docker inspect format: $3" >&2; exit 90 ;;
  esac
  exit 0
fi
echo "unexpected docker invocation: $*" >&2
exit 91
EOF_DOCKER
chmod +x "$mock_bin/docker"

cat >"$mock_bin/getent" <<'EOF_GETENT'
#!/bin/sh
printf '%s\n' \
  '207.207.210.36 STREAM memos.goreecloud.com' \
  '207.207.210.50 STREAM memos.goreecloud.com'
EOF_GETENT
chmod +x "$mock_bin/getent"

cat >"$mock_bin/dig" <<'EOF_DIG'
#!/bin/sh
if [ "${1:-}" != '@100.71.27.119' ]; then
  echo "unexpected DNS server: ${1:-}" >&2
  exit 92
fi
printf '%s\n' "${MOCK_PRIVATE_IP:-100.71.27.119}"
EOF_DIG
chmod +x "$mock_bin/dig"

cat >"$mock_bin/curl" <<'EOF_CURL'
#!/bin/sh
set -eu
printf '%s\n' "$*" >>"$MOCK_CURL_LOG"
url=''
for arg in "$@"; do
  case "$arg" in
    https://*) url="$arg" ;;
  esac
done
case "$url" in
  */healthz) printf '%s\n' 'Service ready.' ;;
  https://*) printf '%s\n' '<html><title>GoreeCloud Memos</title></html>' ;;
  *) echo "unexpected curl URL: $url" >&2; exit 93 ;;
esac
EOF_CURL
chmod +x "$mock_bin/curl"

# The production host may use a public system resolver. Direct private-DNS validation
# must still pass when the approved AdGuard server returns the expected NetBird address.
env PATH="$mock_bin:$PATH" \
  GOREECLOUD_MEMOS_COMPOSE_FILE="$compose_file" \
  GOREECLOUD_MEMOS_ENV_FILE="$env_file" \
  GOREECLOUD_MEMOS_EXPECTED_IMAGE="$image" \
  GOREECLOUD_MEMOS_EXPECTED_PRIVATE_IP='100.71.27.119' \
  GOREECLOUD_MEMOS_PRIVATE_DNS_SERVER='100.71.27.119' \
  GOREECLOUD_PROXY_NETWORK='proxy' \
  MOCK_CURL_LOG="$curl_log" \
  sh "$SCRIPT" >"$output"

grep -F 'PASS: private DNS validation matches expected address' "$output" >/dev/null
grep -F 'PASS: Caddy/TLS path reaches the Memos health endpoint' "$output" >/dev/null
grep -F -- '--resolve memos.goreecloud.com:443:100.71.27.119' "$curl_log" >/dev/null

# Without an explicit private-DNS server, the same public host-resolver result must
# fail closed instead of being mistaken for the approved private answer.
if env PATH="$mock_bin:$PATH" \
  GOREECLOUD_MEMOS_COMPOSE_FILE="$compose_file" \
  GOREECLOUD_MEMOS_ENV_FILE="$env_file" \
  GOREECLOUD_MEMOS_EXPECTED_IMAGE="$image" \
  GOREECLOUD_MEMOS_EXPECTED_PRIVATE_IP='100.71.27.119' \
  GOREECLOUD_PROXY_NETWORK='proxy' \
  MOCK_CURL_LOG="$curl_log" \
  sh "$SCRIPT" >/dev/null 2>&1; then
  echo 'preflight unexpectedly accepted public host-resolver answers' >&2
  exit 1
fi

# A direct private-DNS answer that differs from the expected address must also fail.
if env PATH="$mock_bin:$PATH" \
  GOREECLOUD_MEMOS_COMPOSE_FILE="$compose_file" \
  GOREECLOUD_MEMOS_ENV_FILE="$env_file" \
  GOREECLOUD_MEMOS_EXPECTED_IMAGE="$image" \
  GOREECLOUD_MEMOS_EXPECTED_PRIVATE_IP='100.71.27.119' \
  GOREECLOUD_MEMOS_PRIVATE_DNS_SERVER='100.71.27.119' \
  GOREECLOUD_PROXY_NETWORK='proxy' \
  MOCK_PRIVATE_IP='100.71.27.120' \
  MOCK_CURL_LOG="$curl_log" \
  sh "$SCRIPT" >/dev/null 2>&1; then
  echo 'preflight unexpectedly accepted the wrong private DNS answer' >&2
  exit 1
fi

printf '%s\n' 'GoreeCloud Memos deployment preflight tests passed.'
