#!/bin/sh
# Idempotent MinIO bootstrap (one-shot `minio-init` service).
#
#   create dentnow-media if absent
#   enable bucket versioning
#   create/update policy dentnow-media-rw restricted to that bucket
#   create/update the DentNow application user
#   attach only dentnow-media-rw
#
# Root credentials are used ONLY here; the API receives the least-privilege
# application credential (S3_ACCESS_KEY / S3_SECRET_KEY) instead.
set -eu

MC=mc
ALIAS=local
BUCKET="${S3_BUCKET:-dentnow-media}"
POLICY_NAME="dentnow-media-rw"
POLICY_FILE="/policies/dentnow-policy.json"

ROOT_USER="${MINIO_ROOT_USER:?MINIO_ROOT_USER required}"
ROOT_PW="$(cat "${MINIO_ROOT_PASSWORD_FILE:-/run/secrets/minio_root_password}")"
APP_KEY="${S3_ACCESS_KEY:?S3_ACCESS_KEY required}"
APP_SECRET="$(cat "${S3_APP_SECRET_FILE:-/run/secrets/minio_app_secret}")"
ENDPOINT="${S3_ENDPOINT_URL:-http://minio:9000}"

echo "minio-init: waiting for ${ENDPOINT}"
until $MC alias set "$ALIAS" "$ENDPOINT" "$ROOT_USER" "$ROOT_PW" >/dev/null 2>&1; do
  sleep 2
done

# Bucket (idempotent) + versioning
$MC mb --ignore-existing "$ALIAS/$BUCKET"
$MC version enable "$ALIAS/$BUCKET"

# Private: no anonymous access
$MC anonymous set none "$ALIAS/$BUCKET" || true

# Policy (create-or-replace, idempotent)
$MC admin policy remove "$ALIAS" "$POLICY_NAME" >/dev/null 2>&1 || true
$MC admin policy create "$ALIAS" "$POLICY_NAME" "$POLICY_FILE"

# Application user (create-or-update secret) + attach only the scoped policy
$MC admin user add "$ALIAS" "$APP_KEY" "$APP_SECRET"
$MC admin policy attach "$ALIAS" "$POLICY_NAME" --user "$APP_KEY" 2>/dev/null || true

echo "minio-init: bucket '$BUCKET' ready (versioned, private); app user '$APP_KEY' scoped to '$POLICY_NAME'"
