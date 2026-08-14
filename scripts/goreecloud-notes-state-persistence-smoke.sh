#!/bin/sh
set -eu

CONTAINER_NAME="${GOREECLOUD_NOTES_CONTAINER:-goreecloud-notes}"
BASE_URL="http://127.0.0.1:5230"
RUN_ID="${GITHUB_RUN_ID:-local}"
RUN_ATTEMPT="${GITHUB_RUN_ATTEMPT:-1}"
CI_USERNAME="gc-ci-${RUN_ID}-${RUN_ATTEMPT}"
CI_PASSWORD="gc-ci-password-${RUN_ID}-${RUN_ATTEMPT}"
MARKER="goreecloud-ci-state-${RUN_ID}-${RUN_ATTEMPT}"
RICH_CONTENT="# GoreeCloud CI Persistence

$MARKER

- [ ] preserve checklist syntax
- [x] preserve completed checklist state

#ci-label

<!-- goreecloud-note-color: blue -->"
TRASH_BASE_CONTENT="GoreeCloud CI Trash persistence

$MARKER-trash"
TRASH_CONTENT="$TRASH_BASE_CONTENT

<!-- goreecloud-note-trash: archived -->"

post_json() {
  path="$1"
  body="$2"
  shift 2
  docker exec "$CONTAINER_NAME" wget -q -O - \
    --header="Content-Type: application/json" \
    "$@" \
    --post-data="$body" \
    "$BASE_URL$path"
}

get_json() {
  path="$1"
  shift
  docker exec "$CONTAINER_NAME" wget -q -O - "$@" "$BASE_URL$path"
}

patch_json() {
  path="$1"
  body="$2"
  content_length="$(printf '%s' "$body" | wc -c | tr -d ' ')"
  response="$({
    printf 'PATCH %s HTTP/1.1\r\n' "$path"
    printf 'Host: 127.0.0.1:5230\r\n'
    printf 'Authorization: Bearer %s\r\n' "$access_token"
    printf 'Content-Type: application/json\r\n'
    printf 'Content-Length: %s\r\n' "$content_length"
    printf 'Connection: close\r\n\r\n'
    printf '%s' "$body"
  } | docker exec -i "$CONTAINER_NAME" nc 127.0.0.1 5230)"

  status_line="$(printf '%s' "$response" | sed -n '1{s/\r$//;p;}')"
  case "$status_line" in
    "HTTP/1.1 200 "* | "HTTP/1.0 200 "*) ;;
    *)
      printf '%s\n' "$response" >&2
      echo "GoreeCloud Notes PATCH failed: $status_line" >&2
      return 1
      ;;
  esac
}

json_field() {
  field="$1"
  node -e '
    let input = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (input += chunk));
    process.stdin.on("end", () => {
      const value = JSON.parse(input)[process.argv[1]];
      if (value === undefined || value === null) process.exit(2);
      process.stdout.write(String(value));
    });
  ' "$field"
}

json_array_contains() {
  field="$1"
  expected="$2"
  node -e '
    let input = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (input += chunk));
    process.stdin.on("end", () => {
      const value = JSON.parse(input)[process.argv[1]];
      if (!Array.isArray(value) || !value.includes(process.argv[2])) process.exit(2);
    });
  ' "$field" "$expected"
}

memo_body() {
  content="$1"
  node -e 'process.stdout.write(JSON.stringify({ content: process.argv[1], visibility: "PRIVATE" }));' "$content"
}

memo_pin_patch_body() {
  name="$1"
  node -e 'process.stdout.write(JSON.stringify({ name: process.argv[1], pinned: true }));' "$name"
}

memo_state_patch_body() {
  name="$1"
  state="$2"
  node -e 'process.stdout.write(JSON.stringify({ name: process.argv[1], state: process.argv[2] }));' "$name" "$state"
}

memo_trash_patch_body() {
  name="$1"
  content="$2"
  node -e 'process.stdout.write(JSON.stringify({ name: process.argv[1], content: process.argv[2], state: "NORMAL" }));' "$name" "$content"
}

wait_healthy() {
  for attempt in $(seq 1 30); do
    status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$CONTAINER_NAME")"
    if [ "$status" = "healthy" ]; then
      docker exec "$CONTAINER_NAME" wget -q -O - "$BASE_URL/healthz" | grep -F "Service ready." >/dev/null
      return 0
    fi
    if [ "$status" = "unhealthy" ]; then
      docker logs "$CONTAINER_NAME"
      return 1
    fi
    sleep 2
  done

  docker logs "$CONTAINER_NAME"
  echo "Timed out waiting for GoreeCloud Notes after state-persistence restart" >&2
  return 1
}

signin_body="{\"passwordCredentials\":{\"username\":\"$CI_USERNAME\",\"password\":\"$CI_PASSWORD\"}}"
signin_response="$(post_json "/api/v1/auth/signin" "$signin_body")"
access_token="$(printf '%s' "$signin_response" | json_field accessToken)"
[ -n "$access_token" ]
auth_header="--header=Authorization: Bearer $access_token"

rich_response="$(post_json "/api/v1/memos" "$(memo_body "$RICH_CONTENT")" "$auth_header")"
rich_name="$(printf '%s' "$rich_response" | json_field name)"
trash_response="$(post_json "/api/v1/memos" "$(memo_body "$TRASH_BASE_CONTENT")" "$auth_header")"
trash_name="$(printf '%s' "$trash_response" | json_field name)"
[ -n "$rich_name" ]
[ -n "$trash_name" ]
[ "$rich_name" != "$trash_name" ]

rich_response="$(get_json "/api/v1/$rich_name" "$auth_header")"
[ "$(printf '%s' "$rich_response" | json_field content)" = "$RICH_CONTENT" ]
printf '%s' "$rich_response" | json_array_contains tags "ci-label"

patch_json "/api/v1/$rich_name?updateMask=pinned" "$(memo_pin_patch_body "$rich_name")"
patch_json "/api/v1/$rich_name?updateMask=state" "$(memo_state_patch_body "$rich_name" ARCHIVED)"
rich_response="$(get_json "/api/v1/$rich_name" "$auth_header")"
[ "$(printf '%s' "$rich_response" | json_field pinned)" = "true" ]
[ "$(printf '%s' "$rich_response" | json_field state)" = "ARCHIVED" ]
[ "$(printf '%s' "$rich_response" | json_field content)" = "$RICH_CONTENT" ]
printf '%s' "$rich_response" | json_array_contains tags "ci-label"

patch_json "/api/v1/$trash_name?updateMask=state" "$(memo_state_patch_body "$trash_name" ARCHIVED)"
trash_response="$(get_json "/api/v1/$trash_name" "$auth_header")"
[ "$(printf '%s' "$trash_response" | json_field state)" = "ARCHIVED" ]
[ "$(printf '%s' "$trash_response" | json_field content)" = "$TRASH_BASE_CONTENT" ]

patch_json "/api/v1/$trash_name?updateMask=content,state,update_time" "$(memo_trash_patch_body "$trash_name" "$TRASH_CONTENT")"
trash_response="$(get_json "/api/v1/$trash_name" "$auth_header")"
[ "$(printf '%s' "$trash_response" | json_field state)" = "NORMAL" ]
[ "$(printf '%s' "$trash_response" | json_field content)" = "$TRASH_CONTENT" ]

docker restart "$CONTAINER_NAME" >/dev/null
wait_healthy

signin_response="$(post_json "/api/v1/auth/signin" "$signin_body")"
access_token="$(printf '%s' "$signin_response" | json_field accessToken)"
[ -n "$access_token" ]
auth_header="--header=Authorization: Bearer $access_token"

rich_response="$(get_json "/api/v1/$rich_name" "$auth_header")"
[ "$(printf '%s' "$rich_response" | json_field content)" = "$RICH_CONTENT" ]
printf '%s' "$rich_response" | json_array_contains tags "ci-label"
[ "$(printf '%s' "$rich_response" | json_field pinned)" = "true" ]
[ "$(printf '%s' "$rich_response" | json_field state)" = "ARCHIVED" ]
trash_response="$(get_json "/api/v1/$trash_name" "$auth_header")"
[ "$(printf '%s' "$trash_response" | json_field content)" = "$TRASH_CONTENT" ]
[ "$(printf '%s' "$trash_response" | json_field state)" = "NORMAL" ]

docker exec "$CONTAINER_NAME" test -f /var/opt/memos/memos_prod.db

echo "GoreeCloud Markdown, checklist syntax, label derivation, pinned/Archive state, color metadata, and Trash workflow state survived restart."
