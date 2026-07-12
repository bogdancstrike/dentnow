#!/usr/bin/env bash
# Generate DentNow Compose secret files under ./.secrets/ (git-ignored).
#
# DEVELOPMENT (default): writes simple, predictable dev secrets (e.g. keycloak
# admin = admin/admin). These are intentionally weak — it is a local dev stack, not
# production. Services consume them via Compose secrets + *_FILE.
#
# PRODUCTION (ENVIRONMENT=production): generates strong random secrets and refuses
# weak/example values.
#
#   ./ops/init-secrets.sh                 # dev secrets (default)
#   ENVIRONMENT=production ./ops/init-secrets.sh   # strong random secrets
#   ./ops/init-secrets.sh --rotate        # regenerate all
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SECRETS_DIR="${ROOT_DIR}/.secrets"
ENVIRONMENT="${ENVIRONMENT:-local}"
ROTATE=0
[[ "${1:-}" == "--rotate" ]] && ROTATE=1

# Simple dev defaults (name:value). MinIO requires >= 8 char passwords.
DEV_SECRETS=(
  "postgres_password:dentnow-dev"
  "keycloak_db_password:keycloak-dev"
  "keycloak_admin_password:admin"
  "minio_root_password:minio-dev-secret"
  "minio_app_secret:dentnow-app-secret"
  "preview_token_pepper:dev-preview-pepper"
  "backend_secret_key:dev-secret-key-change-me"
)
# Production secret lengths.
PROD_SECRETS=(
  "postgres_password:32" "keycloak_db_password:32" "keycloak_admin_password:24"
  "minio_root_password:32" "minio_app_secret:32" "preview_token_pepper:32" "backend_secret_key:32"
)

gen() { openssl rand -base64 "$1" | tr -d '\n/+=' | cut -c1-"$1"; }

is_weak() {
  local v="$1"
  [[ -z "$v" || ${#v} -lt 16 ]] && return 0
  case "${v,,}" in *example*|*changeme*|admin|dev|password) return 0 ;; esac
  return 1
}

mkdir -p "$SECRETS_DIR"
chmod 700 "$SECRETS_DIR"

write_secret() {  # name value
  local file="${SECRETS_DIR}/$1"
  printf '%s' "$2" > "$file"
  # 0644 inside the 0700 dir: host-secure (dir blocks other users) and readable by
  # the non-root backend container user.
  chmod 644 "$file"
}

created=0 kept=0
if [[ "$ENVIRONMENT" == "production" ]]; then
  for entry in "${PROD_SECRETS[@]}"; do
    name="${entry%%:*}"; len="${entry##*:}"; file="${SECRETS_DIR}/${name}"
    if [[ -f "$file" && $ROTATE -eq 0 ]]; then
      is_weak "$(cat "$file")" && { echo "ERROR: production secret '${name}' is weak; use --rotate" >&2; exit 1; }
      kept=$((kept+1)); continue
    fi
    v="$(gen "$len")"; is_weak "$v" && { echo "ERROR: generated weak value" >&2; exit 1; }
    write_secret "$name" "$v"; created=$((created+1))
  done
  echo "secrets: production strong secrets ready (created=${created} kept=${kept})"
else
  for entry in "${DEV_SECRETS[@]}"; do
    name="${entry%%:*}"; value="${entry#*:}"; file="${SECRETS_DIR}/${name}"
    if [[ -f "$file" && $ROTATE -eq 0 ]]; then kept=$((kept+1)); continue; fi
    write_secret "$name" "$value"; created=$((created+1))
  done
  echo "secrets: simple DEV secrets ready in ${SECRETS_DIR} (created=${created} kept=${kept})"
  echo "  keycloak admin = admin / admin  |  NOT for production (use ENVIRONMENT=production)"
fi
