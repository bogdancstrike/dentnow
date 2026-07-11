#!/bin/bash
# Idempotent Keycloak configuration for realm `doncik` (one-shot `keycloak-config`).
#
# Runs inside the Keycloak image (has kcadm.sh). It NEVER re-imports or replaces an
# existing realm wholesale — it upserts:
#   - realm `doncik`
#   - public PKCE client `dentnow-admin-spa` (standard flow only)
#   - non-interactive resource client `dentnow-api` (all flows off, no secret)
#   - an access-token audience mapper adding `dentnow-api` to SPA tokens
#   - realm roles dentnow_admin / dentnow_editor / dentnow_publisher / dentnow_clinic_manager
#   - a local dev admin only when SEED_ADMIN_USERNAME + SEED_ADMIN_PASSWORD are set
#   - deterministic E2E users only when SEED_E2E_USERS=true and ENVIRONMENT in {local,test}
set -euo pipefail

KCADM=/opt/keycloak/bin/kcadm.sh
REALM="${KEYCLOAK_REALM:-doncik}"
KC_URL="${KEYCLOAK_INTERNAL_URL:-http://keycloak:8080}"
ADMIN_USER="${KEYCLOAK_ADMIN_USER:-admin}"
ADMIN_PW="$(cat "${KEYCLOAK_ADMIN_PASSWORD_FILE:-/run/secrets/keycloak_admin_password}")"
PUBLIC_APP_URL="${PUBLIC_APP_URL:-http://localhost:3000}"
PUBLIC_PREVIEW_URL="${PUBLIC_PREVIEW_URL:-http://localhost:3001}"
SPA_CLIENT="${KEYCLOAK_SPA_CLIENT_ID:-dentnow-admin-spa}"
API_CLIENT="${KEYCLOAK_AUDIENCE:-dentnow-api}"

echo "keycloak-config: waiting for ${KC_URL}"
until $KCADM config credentials --server "$KC_URL" --realm master \
        --user "$ADMIN_USER" --password "$ADMIN_PW" >/dev/null 2>&1; do
  sleep 3
done

# ── realm ──────────────────────────────────────────────────────────────────
if ! $KCADM get "realms/${REALM}" >/dev/null 2>&1; then
  $KCADM create realms -s realm="$REALM" -s enabled=true \
    -s sslRequired=external \
    -s registrationAllowed=false
  echo "keycloak-config: created realm ${REALM}"
else
  echo "keycloak-config: realm ${REALM} already exists (leaving intact)"
fi

client_id_of() {  # echoes the internal id for a clientId, empty if absent
  $KCADM get clients -r "$REALM" -q clientId="$1" --fields id --format csv --noquotes 2>/dev/null | head -n1
}

# ── public PKCE SPA client ───────────────────────────────────────────────────
SPA_ID="$(client_id_of "$SPA_CLIENT")"
if [[ -z "$SPA_ID" ]]; then
  $KCADM create clients -r "$REALM" \
    -s clientId="$SPA_CLIENT" \
    -s protocol=openid-connect \
    -s publicClient=true \
    -s standardFlowEnabled=true \
    -s implicitFlowEnabled=false \
    -s directAccessGrantsEnabled=false \
    -s serviceAccountsEnabled=false \
    -s 'attributes."pkce.code.challenge.method"=S256' \
    -s "redirectUris=[\"${PUBLIC_APP_URL}/admin/*\"]" \
    -s "webOrigins=[\"${PUBLIC_APP_URL}\"]"
  SPA_ID="$(client_id_of "$SPA_CLIENT")"
  echo "keycloak-config: created SPA client ${SPA_CLIENT}"
else
  $KCADM update "clients/${SPA_ID}" -r "$REALM" \
    -s publicClient=true -s standardFlowEnabled=true \
    -s implicitFlowEnabled=false -s directAccessGrantsEnabled=false \
    -s serviceAccountsEnabled=false \
    -s 'attributes."pkce.code.challenge.method"=S256' \
    -s "redirectUris=[\"${PUBLIC_APP_URL}/admin/*\"]" \
    -s "webOrigins=[\"${PUBLIC_APP_URL}\"]"
  echo "keycloak-config: updated SPA client ${SPA_CLIENT}"
fi

# ── non-interactive resource (audience) client ───────────────────────────────
API_ID="$(client_id_of "$API_CLIENT")"
if [[ -z "$API_ID" ]]; then
  $KCADM create clients -r "$REALM" \
    -s clientId="$API_CLIENT" \
    -s protocol=openid-connect \
    -s publicClient=false \
    -s bearerOnly=true \
    -s standardFlowEnabled=false \
    -s implicitFlowEnabled=false \
    -s directAccessGrantsEnabled=false \
    -s serviceAccountsEnabled=false
  API_ID="$(client_id_of "$API_CLIENT")"
  echo "keycloak-config: created resource client ${API_CLIENT}"
fi

# ── audience mapper on the SPA client (adds dentnow-api to access-token aud) ──
if ! $KCADM get "clients/${SPA_ID}/protocol-mappers/models" -r "$REALM" \
      --fields name --format csv --noquotes 2>/dev/null | grep -qx "dentnow-api-audience"; then
  $KCADM create "clients/${SPA_ID}/protocol-mappers/models" -r "$REALM" \
    -s name="dentnow-api-audience" \
    -s protocol=openid-connect \
    -s protocolMapper=oidc-audience-mapper \
    -s 'config."included.client.audience"='"$API_CLIENT" \
    -s 'config."id.token.claim"=false' \
    -s 'config."access.token.claim"=true'
  echo "keycloak-config: added audience mapper -> ${API_CLIENT}"
fi

# ── realm roles ──────────────────────────────────────────────────────────────
for role in dentnow_admin dentnow_editor dentnow_publisher dentnow_clinic_manager; do
  $KCADM get "roles/${role}" -r "$REALM" >/dev/null 2>&1 || \
    $KCADM create roles -r "$REALM" -s name="$role"
done
echo "keycloak-config: realm roles ensured"

# ── optional local dev admin ─────────────────────────────────────────────────
if [[ -n "${SEED_ADMIN_USERNAME:-}" && -n "${SEED_ADMIN_PASSWORD:-}" ]]; then
  if [[ "${ENVIRONMENT:-local}" == "production" ]]; then
    echo "keycloak-config: refusing to seed users in production" >&2; exit 1
  fi
  if [[ -z "$($KCADM get users -r "$REALM" -q username="$SEED_ADMIN_USERNAME" --fields id --format csv --noquotes 2>/dev/null | head -n1)" ]]; then
    $KCADM create users -r "$REALM" -s username="$SEED_ADMIN_USERNAME" -s enabled=true
    $KCADM set-password -r "$REALM" --username "$SEED_ADMIN_USERNAME" --new-password "$SEED_ADMIN_PASSWORD"
    $KCADM add-roles -r "$REALM" --uusername "$SEED_ADMIN_USERNAME" --rolename dentnow_admin
    echo "keycloak-config: seeded dev admin ${SEED_ADMIN_USERNAME}"
  fi
fi

# ── optional deterministic E2E identities (disposable local/CI only) ─────────
if [[ "${SEED_E2E_USERS:-false}" == "true" && ( "${ENVIRONMENT:-local}" == "local" || "${ENVIRONMENT:-local}" == "test" ) ]]; then
  seed_user() {  # username role password
    local u="$1" r="$2" p="$3"
    if [[ -z "$($KCADM get users -r "$REALM" -q username="$u" --fields id --format csv --noquotes 2>/dev/null | head -n1)" ]]; then
      $KCADM create users -r "$REALM" -s username="$u" -s enabled=true
      $KCADM set-password -r "$REALM" --username "$u" --new-password "$p"
      [[ -n "$r" ]] && $KCADM add-roles -r "$REALM" --uusername "$u" --rolename "$r"
    fi
  }
  PW="${SEED_E2E_PASSWORD:-Dent-E2E-pass-1}"
  seed_user e2e-admin           dentnow_admin          "$PW"
  seed_user e2e-editor          dentnow_editor         "$PW"
  seed_user e2e-publisher       dentnow_publisher      "$PW"
  seed_user e2e-clinic-manager  dentnow_clinic_manager "$PW"
  seed_user e2e-norole          ""                     "$PW"
  echo "keycloak-config: seeded deterministic E2E identities"
fi

echo "keycloak-config: done"
