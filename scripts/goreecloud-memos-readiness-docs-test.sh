#!/bin/sh
set -eu

backup_preflight='docs/goreecloud/backup-live-preflight.md'
backup_restore='docs/goreecloud/backup-restore-validation.md'
monitoring='docs/goreecloud/monitoring-readiness.md'

for file in "$backup_preflight" "$backup_restore" "$monitoring"; do
  test -f "$file"
done

for file in "$backup_preflight" "$backup_restore"; do
  grep -F '/srv/docker/appdata/memos' "$file" >/dev/null
  grep -F 'goreecloud-memos' "$file" >/dev/null
  if grep -F '/srv/docker/appdata/notes' "$file" >/dev/null; then
    echo "stale retired Notes appdata path found in $file" >&2
    exit 1
  fi
  if grep -F 'goreecloud-notes' "$file" >/dev/null; then
    echo "stale retired Notes container found in $file" >&2
    exit 1
  fi
done

grep -F 'goreecloud-v0.1.0@sha256:15f523fb1ac2b946339d9216d741b4368fbfd8631159487acc20b4133702ace1' "$backup_restore" >/dev/null
grep -F 'goreecloud-v0.1.1@sha256:ec9fd1b02fb0ae545487c6b109b0254794898b4799fcea34e667dd50b4346075' "$backup_restore" >/dev/null

grep -F 'https://memos.goreecloud.com/healthz' "$monitoring" >/dev/null
grep -F 'Service ready.' "$monitoring" >/dev/null
grep -F 'TLS verification: required' "$monitoring" >/dev/null
grep -F 'Backend host-port publication: prohibited' "$monitoring" >/dev/null

echo 'GoreeCloud Memos readiness documentation validation passed.'
