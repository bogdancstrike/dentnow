#!/usr/bin/env bash
# DentNow infrastructure smoke test (Task 4).
#
# Verifies against the running data/identity services:
#   - PostgreSQL accepts SELECT 1 on database dentnow;
#   - bucket dentnow-media exists with versioning enabled;
#   - the application MinIO credential CANNOT list another bucket;
#   - realm doncik is discoverable;
#   - both DentNow clients and all four realm roles exist.
#
# Run via: docker compose ... then `bash backend/tests/compose/test_infrastructure.sh`
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT_DIR"

DC="docker compose"
# Derive the actual host mapping for Keycloak (host port is configurable/loopback).
KC_HOSTPORT="$($DC port keycloak 8080 2>/dev/null | sed -E 's/.*:([0-9]+)$/\1/')"
KC_URL="http://localhost:${KC_HOSTPORT:-${KEYCLOAK_PORT:-8080}}"
REALM="doncik"
fail() { echo "FAIL: $*" >&2; exit 1; }
ok() { echo "ok: $*"; }

# 1. PostgreSQL SELECT 1
$DC exec -T postgres psql -U dentnow -d dentnow -c 'SELECT 1;' >/dev/null \
  || fail "postgres SELECT 1"
ok "postgres accepts SELECT 1 on dentnow"

# 2. Bucket exists + versioning enabled (via root mc alias in a throwaway mc run)
MROOT_PW="$(cat .secrets/minio_root_password)"
VERS="$($DC run --rm --entrypoint /bin/sh minio-init -c "
  mc alias set l http://minio:9000 ${MINIO_ROOT_USER:-dentnow-root} '${MROOT_PW}' >/dev/null 2>&1
  mc ls l/dentnow-media >/dev/null 2>&1 && mc version info l/dentnow-media
")" || fail "bucket dentnow-media missing"
echo "$VERS" | grep -qi 'enabled' || fail "versioning not enabled on dentnow-media"
ok "bucket dentnow-media exists with versioning"

# 3. App credential is scoped: creating a bucket outside dentnow-media is denied.
APP_SECRET="$(cat .secrets/minio_app_secret)"
if $DC run --rm --entrypoint /bin/sh minio-init -c "
  mc alias set a http://minio:9000 ${S3_ACCESS_KEY:-dentnow-app} '${APP_SECRET}' >/dev/null 2>&1
  mc mb a/should-not-exist
" >/dev/null 2>&1; then
  fail "app credential could create a bucket outside its policy"
fi
ok "app credential cannot create buckets outside dentnow-media (least privilege)"

# 4. Realm discoverable
curl -fsS "${KC_URL}/realms/${REALM}/.well-known/openid-configuration" >/dev/null \
  || fail "realm ${REALM} not discoverable"
ok "realm ${REALM} discoverable"

# 5. Clients + roles via kcadm (inside a keycloak one-shot)
KC_ADMIN_PW="$(cat .secrets/keycloak_admin_password)"
CLIENTS_ROLES="$($DC run --rm --entrypoint /bin/bash keycloak-config -c "
  /opt/keycloak/bin/kcadm.sh config credentials --server http://keycloak:8080 --realm master --user ${KEYCLOAK_ADMIN_USER:-admin} --password '${KC_ADMIN_PW}' >/dev/null 2>&1
  echo CLIENTS:
  /opt/keycloak/bin/kcadm.sh get clients -r ${REALM} --fields clientId --format csv --noquotes 2>/dev/null
  echo ROLES:
  /opt/keycloak/bin/kcadm.sh get roles -r ${REALM} --fields name --format csv --noquotes 2>/dev/null
")"
for c in dentnow-admin-spa dentnow-api; do
  echo "$CLIENTS_ROLES" | grep -q "$c" || fail "client $c missing"
done
for r in dentnow_admin dentnow_editor dentnow_publisher dentnow_clinic_manager; do
  echo "$CLIENTS_ROLES" | grep -q "$r" || fail "role $r missing"
done
ok "both DentNow clients and all four roles exist"

echo "INFRA SMOKE PASSED"
