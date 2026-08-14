#!/bin/sh
set -eu

CONTAINER_NAME="${GOREECLOUD_NOTES_CONTAINER:-goreecloud-notes}"
BASE_URL="http://127.0.0.1:5230"
RUN_ID="${GITHUB_RUN_ID:-local}"
RUN_ATTEMPT="${GITHUB_RUN_ATTEMPT:-1}"
CI_USERNAME="gc-ci-${RUN_ID}-${RUN_ATTEMPT}"
CI_PASSWORD="gc-ci-password-${RUN_ID}-${RUN_ATTEMPT}"
MARKER="goreecloud-ci-persistence-${RUN_ID}-${RUN_ATTEMPT}"
ATTACHMENT_FILENAME="goreecloud-ci-persistence.txt"
ATTACHMENT_MARKER="goreecloud-ci-attachment-${RUN_ID}-${RUN_ATTEMPT}"

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
  echo "Timed out waiting for GoreeCloud Notes after restart" >&2
  return 1
}

create_user_body="{\"username\":\"$CI_USERNAME\",\"password\":\"$CI_PASSWORD\",\"displayName\":\"GoreeCloud CI\"}"
post_json "/api/v1/users" "$create_user_body" >/dev/null

signin_body="{\"passwordCredentials\":{\"username\":\"$CI_USERNAME\",\"password\":\"$CI_PASSWORD\"}}"
signin_response="$(post_json "/api/v1/auth/signin" "$signin_body")"
access_token="$(printf '%s' "$signin_response" | json_field accessToken)"
[ -n "$access_token" ]

auth_header="--header=Authorization: Bearer $access_token"
current_user_response="$(get_json "/api/v1/auth/me" "$auth_header")"
printf '%s' "$current_user_response" | grep -F "$CI_USERNAME" >/dev/null

create_memo_body="{\"content\":\"$MARKER\",\"visibility\":\"PRIVATE\"}"
create_memo_response="$(post_json "/api/v1/memos" "$create_memo_body" "$auth_header")"
memo_name="$(printf '%s' "$create_memo_response" | json_field name)"
[ -n "$memo_name" ]

memo_response="$(get_json "/api/v1/$memo_name" "$auth_header")"
memo_content="$(printf '%s' "$memo_response" | json_field content)"
[ "$memo_content" = "$MARKER" ]

attachment_content="$(printf '%s' "$ATTACHMENT_MARKER" | base64 | tr -d '\n')"
create_attachment_body="{\"filename\":\"$ATTACHMENT_FILENAME\",\"type\":\"text/plain\",\"content\":\"$attachment_content\",\"memo\":\"$memo_name\"}"
create_attachment_response="$(post_json "/api/v1/attachments" "$create_attachment_body" "$auth_header")"
attachment_name="$(printf '%s' "$create_attachment_response" | json_field name)"
[ -n "$attachment_name" ]

attachment_response="$(get_json "/file/$attachment_name/$ATTACHMENT_FILENAME" "$auth_header")"
[ "$attachment_response" = "$ATTACHMENT_MARKER" ]

docker exec "$CONTAINER_NAME" test -f /var/opt/memos/memos_prod.db

docker restart "$CONTAINER_NAME" >/dev/null
wait_healthy

signin_response="$(post_json "/api/v1/auth/signin" "$signin_body")"
access_token="$(printf '%s' "$signin_response" | json_field accessToken)"
[ -n "$access_token" ]
auth_header="--header=Authorization: Bearer $access_token"

memo_response="$(get_json "/api/v1/$memo_name" "$auth_header")"
memo_content="$(printf '%s' "$memo_response" | json_field content)"
[ "$memo_content" = "$MARKER" ]

attachment_response="$(get_json "/file/$attachment_name/$ATTACHMENT_FILENAME" "$auth_header")"
[ "$attachment_response" = "$ATTACHMENT_MARKER" ]

echo "Authenticated note and attachment persistence survived the GoreeCloud Notes restart."
