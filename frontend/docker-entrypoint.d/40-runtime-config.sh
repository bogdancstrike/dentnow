#!/bin/sh
# Generate /config.json atomically at container start with a REAL JSON serializer (jq).
# Only public runtime coordinates — never clinic content, never secrets. Values with
# quotes/newlines/</script> are safely escaped by jq.
set -e

OUT=/usr/share/nginx/html/config.json
TMP="${OUT}.tmp"

jq -n \
  --arg apiBase "${APP_API_BASE:-/api}" \
  --arg previewAppUrl "${APP_PREVIEW_URL:-}" \
  --arg keycloakUrl "${APP_KEYCLOAK_URL:-}" \
  --arg keycloakRealm "${APP_KEYCLOAK_REALM:-doncik}" \
  --arg keycloakClientId "${APP_KEYCLOAK_CLIENT_ID:-dentnow-admin-spa}" \
  --arg buildRevision "${BUILD_REVISION:-dev}" \
  '{ apiBase: $apiBase, buildRevision: $buildRevision }
   + ( if $previewAppUrl != "" then { previewAppUrl: $previewAppUrl } else {} end )
   + ( if $keycloakUrl != "" then { keycloakUrl: $keycloakUrl, keycloakRealm: $keycloakRealm, keycloakClientId: $keycloakClientId } else {} end )' \
  > "$TMP"

mv "$TMP" "$OUT"
echo "runtime-config: wrote $OUT"
