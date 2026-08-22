#!/bin/sh
set -eu

backup_preflight='docs/goreecloud/backup-live-preflight.md'
backup_restore='docs/goreecloud/backup-restore-validation.md'
monitoring='docs/goreecloud/monitoring-readiness.md'
fork_record='docs/goreecloud/README.md'
deployment_readme='deploy/goreecloud/README.md'
deployment_checklist='deploy/goreecloud/DEPLOYMENT-CHECKLIST.md'

require_literal() {
  literal="$1"
  file="$2"
  description="$3"
  if ! grep -F "$literal" "$file" >/dev/null; then
    echo "missing ${description} in ${file}: ${literal}" >&2
    exit 1
  fi
}

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
  require_literal '/srv/docker/appdata/memos' "$file" 'current Memos data path'
  require_literal 'goreecloud-memos' "$file" 'current Memos container identity'

  if grep -Eq 'sudo test -(d|f) /srv/docker/appdata/notes|docker inspect goreecloud-notes|docker exec goreecloud-notes|Notes application.data path is:.*appdata/notes' "$file"; then
    echo "obsolete retired Notes runtime instruction found in $file" >&2
    exit 1
  fi

  if grep -F 'goreecloud-notes' "$file" >/dev/null; then
    echo "stale retired Notes container found in $file" >&2
    exit 1
  fi
done

production_image='goreecloud-v0.1.2@sha256:98cea4ed48e6c8dea2c70a7c88b5b246ae8569a69ad5fe749127a91720ef00be'
target_image='goreecloud-v0.1.3@sha256:13b45db6b0977d5b4c89afba2a1d5d0eacf9bc1ad884f86c0c719958de1b84f4'
production_source='ff3d5c6740b83bc55486ff51c5f6ec65436d91f9'
target_source='70de16fb8dc08b1aadc42190566d5981f9ab2216'

for file in "$backup_preflight" "$backup_restore" "$fork_record" "$deployment_readme" "$deployment_checklist"; do
  require_literal "$production_image" "$file" 'accepted v0.1.2 immutable production image'
  require_literal "$target_image" "$file" 'published v0.1.3 immutable target image'
  if grep -F 'PR #1' "$file" >/dev/null; then
    echo "stale PR #1 gate found in $file" >&2
    exit 1
  fi
done

require_literal "$production_source" "$fork_record" 'accepted v0.1.2 source revision'
require_literal "$target_source" "$fork_record" 'published v0.1.3 source revision'
require_literal "$production_source" "$deployment_readme" 'accepted v0.1.2 source revision'
require_literal "$target_source" "$deployment_readme" 'published v0.1.3 source revision'
require_literal "$production_source" "$deployment_checklist" 'accepted v0.1.2 source revision'
require_literal "$target_source" "$deployment_checklist" 'published v0.1.3 source revision'

require_literal 'https://memos.goreecloud.com/healthz' "$monitoring" 'Memos private HTTPS health endpoint'
require_literal 'Service ready.' "$monitoring" 'health response marker'
require_literal 'TLS verification: required' "$monitoring" 'TLS verification requirement'
require_literal 'Backend host-port publication: prohibited' "$monitoring" 'backend host-port prohibition'
require_literal "$production_image" "$monitoring" 'accepted v0.1.2 monitoring baseline'
require_literal "$target_image" "$monitoring" 'v0.1.3 monitoring target'
require_literal 'UP/DOWN/RECOVERED' "$monitoring" 'monitoring transition contract'

require_literal 'GOREECLOUD_MEMOS_PRIVATE_DNS_SERVER=100.71.27.119' "$deployment_checklist" 'authoritative private DNS selection'
require_literal 'GOREECLOUD_MEMOS_HTTPS_TARGET_IP=100.71.27.119' "$deployment_checklist" 'private HTTPS destination pinning'
require_literal 'GOREECLOUD_MEMOS_PRIVATE_DNS_SERVER=100.71.27.119' "$deployment_readme" 'deployment private DNS selection'
require_literal 'GOREECLOUD_MEMOS_HTTPS_TARGET_IP=100.71.27.119' "$deployment_readme" 'deployment private HTTPS pinning'

require_literal 'fresh application-consistent v0.1.2 recovery point' "$backup_restore" 'fresh rollback recovery gate'
require_literal 'isolated v0.1.2 rollback restore' "$backup_restore" 'isolated rollback restore gate'
require_literal 'draft label selection before first save' "$deployment_checklist" 'v0.1.3 draft-label acceptance'
require_literal 'attachment upload and retrieval' "$deployment_checklist" 'v0.1.3 attachment acceptance'
require_literal 'quick-capture autosave/Undo' "$deployment_checklist" 'v0.1.3 quick-capture acceptance'

if grep -F 'The runtime cutover is a separate infrastructure change' "$fork_record" >/dev/null; then
  echo "stale pending-cutover statement found in $fork_record" >&2
  exit 1
fi

for file in "$fork_record" "$deployment_readme" "$deployment_checklist"; do
  if grep -Fi 'current accepted production release:' "$file" >/dev/null && \
     grep -F 'goreecloud-v0.1.0' "$file" >/dev/null; then
    echo "stale v0.1.0 current-production wording found in $file" >&2
    exit 1
  fi
done

echo 'GoreeCloud Memos readiness documentation validation passed.'
