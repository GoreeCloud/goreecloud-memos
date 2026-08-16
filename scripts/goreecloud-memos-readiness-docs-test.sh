#!/bin/sh
set -eu

backup_preflight='docs/goreecloud/backup-live-preflight.md'
backup_restore='docs/goreecloud/backup-restore-validation.md'
monitoring='docs/goreecloud/monitoring-readiness.md'
fork_record='docs/goreecloud/README.md'
deployment_readme='deploy/goreecloud/README.md'
deployment_checklist='deploy/goreecloud/DEPLOYMENT-CHECKLIST.md'

for file in \
  "$backup_preflight" \
  "$backup_restore" \
  "$monitoring" \
  "$fork_record" \
  "$deployment_readme" \
  "$deployment_checklist"; do
  test -f "$file"
done

for file in "$backup_preflight" "$backup_restore"; do
  grep -F '/srv/docker/appdata/memos' "$file" >/dev/null
  grep -F 'goreecloud-memos' "$file" >/dev/null

  if grep -Eq 'sudo test -(d|f) /srv/docker/appdata/notes|docker inspect goreecloud-notes|docker exec goreecloud-notes|Notes application.data path is:.*appdata/notes' "$file"; then
    echo "obsolete retired Notes runtime instruction found in $file" >&2
    exit 1
  fi

  if grep -F 'goreecloud-notes' "$file" >/dev/null; then
    echo "stale retired Notes container found in $file" >&2
    exit 1
  fi
done

production_image='goreecloud-v0.1.0@sha256:15f523fb1ac2b946339d9216d741b4368fbfd8631159487acc20b4133702ace1'
target_image='goreecloud-v0.1.1@sha256:ec9fd1b02fb0ae545487c6b109b0254794898b4799fcea34e667dd50b4346075'

for file in "$backup_restore" "$fork_record" "$deployment_readme" "$deployment_checklist"; do
  grep -F "$production_image" "$file" >/dev/null
  grep -F "$target_image" "$file" >/dev/null
  if grep -F 'PR #1' "$file" >/dev/null; then
    echo "stale PR #1 gate found in $file" >&2
    exit 1
  fi
done

grep -F 'https://memos.goreecloud.com/healthz' "$monitoring" >/dev/null
grep -F 'Service ready.' "$monitoring" >/dev/null
grep -F 'TLS verification: required' "$monitoring" >/dev/null
grep -F 'Backend host-port publication: prohibited' "$monitoring" >/dev/null

grep -F 'GOREECLOUD_MEMOS_PRIVATE_DNS_SERVER=100.71.27.119' "$deployment_checklist" >/dev/null
grep -F 'GOREECLOUD_MEMOS_HTTPS_TARGET_IP=100.71.27.119' "$deployment_checklist" >/dev/null
grep -F 'GOREECLOUD_MEMOS_PRIVATE_DNS_SERVER=100.71.27.119' "$deployment_readme" >/dev/null

if grep -F 'The runtime cutover is a separate infrastructure change' "$fork_record" >/dev/null; then
  echo "stale pending-cutover statement found in $fork_record" >&2
  exit 1
fi

echo 'GoreeCloud Memos readiness documentation validation passed.'
