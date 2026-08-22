#!/usr/bin/env bash
set -euo pipefail

browser=""
for candidate in google-chrome google-chrome-stable chromium chromium-browser; do
  if command -v "$candidate" >/dev/null 2>&1; then
    browser="$(command -v "$candidate")"
    break
  fi
done

if [[ -z "$browser" ]]; then
  echo "FAIL: no supported Chromium browser found on PATH" >&2
  exit 1
fi

vite_log="${RUNNER_TEMP:-/tmp}/goreecloud-memos-browser-vite.log"
artifact_dir="${RUNNER_TEMP:-/tmp}/goreecloud-memos-browser-acceptance"
mkdir -p "$artifact_dir"

pnpm exec vite --host 127.0.0.1 --port 4173 >"$vite_log" 2>&1 &
vite_pid=$!
cleanup() {
  kill "$vite_pid" >/dev/null 2>&1 || true
  wait "$vite_pid" >/dev/null 2>&1 || true
}
trap cleanup EXIT

ready_url="http://127.0.0.1:4173/browser-tests/home-masonry.html?width=358"
for _ in $(seq 1 40); do
  if curl --fail --silent --show-error "$ready_url" >/dev/null 2>&1; then
    break
  fi
  sleep 0.25
done
curl --fail --silent --show-error "$ready_url" >/dev/null

run_case() {
  local width="$1"
  local expected_columns="$2"
  local output="$artifact_dir/home-masonry-${width}.html"

  "$browser" \
    --headless=new \
    --no-sandbox \
    --disable-gpu \
    --disable-dev-shm-usage \
    --virtual-time-budget=2500 \
    --dump-dom \
    "http://127.0.0.1:4173/browser-tests/home-masonry.html?width=${width}" \
    >"$output" 2>"${output%.html}.stderr.log"

  grep -q 'data-render-ready="true"' "$output" || {
    echo "FAIL: ${width}px browser case never published rendered geometry" >&2
    exit 1
  }
  grep -q "data-column-count=\"${expected_columns}\"" "$output" || {
    echo "FAIL: ${width}px browser case did not render ${expected_columns} physical column(s)" >&2
    grep -o 'data-column-count="[^"]*"' "$output" | head -1 >&2 || true
    exit 1
  }
  grep -q 'data-overflow="false"' "$output" || {
    echo "FAIL: ${width}px browser case overflowed its grid container" >&2
    exit 1
  }

  local min_width
  min_width="$(grep -o 'data-min-card-width="[0-9][0-9]*"' "$output" | head -1 | grep -o '[0-9][0-9]*')"
  if [[ -z "$min_width" || "$min_width" -lt 168 ]]; then
    echo "FAIL: ${width}px browser case rendered a card narrower than 168px (actual: ${min_width:-unknown})" >&2
    exit 1
  fi

  echo "PASS: ${width}px rendered ${expected_columns} physical column(s), minimum card width ${min_width}px, no overflow"
  grep -A 40 'id="geometry-diagnostics"' "$output" | head -41 || true
}

run_case 358 2
run_case 320 1

echo "PASS: Home masonry rendered-browser acceptance complete"
