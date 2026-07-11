#!/usr/bin/env bash
# Generate DentNow Compose secret files under ./.secrets/ (git-ignored, mode 0600).
#
# Services consume these through Compose `secrets:` and `*_FILE` env vars — never as
# plaintext production environment values. Re-running is safe: existing files are kept
# unless `--rotate` is given. Weak/example values are refused.
#
#   ./ops/init-secrets.sh            # create any missing secrets
#   ./ops/init-secrets.sh --rotate   # regenerate ALL secrets (invalidates the stack)
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SECRETS_DIR="${ROOT_DIR}/.secrets"
ROTATE=0
[[ "${1:-}" == "--rotate" ]] && ROTATE=1

# Secret files to generate (name => byte length of random material).
SECRETS=(
  "postgres_password:32"
  "keycloak_db_password:32"
  "keycloak_admin_password:24"
  "minio_root_password:32"
  "minio_app_secret:32"
  "preview_token_pepper:32"
  "backend_secret_key:32"
)

gen() { openssl rand -base64 "$1" | tr -d '\n/+=' | cut -c1-"$1"; }

is_weak() {
  local v="$1"
  [[ -z "$v" || ${#v} -lt 16 ]] && return 0
  case "${v,,}" in
    *example*|*changeme*|*password*|*secret*|admin|dentnow) return 0 ;;
  esac
  return 1
}

mkdir -p "$SECRETS_DIR"
chmod 700 "$SECRETS_DIR"

created=0 kept=0 rotated=0
for entry in "${SECRETS[@]}"; do
  name="${entry%%:*}"; len="${entry##*:}"
  file="${SECRETS_DIR}/${name}"
  if [[ -f "$file" && $ROTATE -eq 0 ]]; then
    if is_weak "$(cat "$file")"; then
      echo "ERROR: existing secret '${name}' is weak/example; run with --rotate to replace." >&2
      exit 1
    fi
    kept=$((kept+1)); continue
  fi
  value="$(gen "$len")"
  if is_weak "$value"; then
    echo "ERROR: generated a weak value for '${name}' (retry)." >&2
    exit 1
  fi
  printf '%s' "$value" > "$file"
  # 0644 files inside the 0700 .secrets/ dir: other host users cannot traverse into
  # the directory, while non-root container users (e.g. the backend uid 10001) can
  # read the Compose-mounted secret. Compose v2 bind-mounts file secrets with the
  # host file's own perms, so the directory — not the file mode — is the host guard.
  chmod 644 "$file"
  if [[ -f "$file" && $ROTATE -eq 1 ]]; then rotated=$((rotated+1)); else created=$((created+1)); fi
done

echo "secrets ready in ${SECRETS_DIR} (created=${created} kept=${kept} rotated=${rotated})"
echo "NOTE: rotating PostgreSQL/MinIO/Keycloak secrets on an existing stack requires a"
echo "      coordinated re-init or volume reset — see docs/deployment_runbook.md (Task 24)."
