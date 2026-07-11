#!/bin/bash
# PostgreSQL init hook (runs once, on an empty data volume).
#
# The main POSTGRES_* env already creates database/user `dentnow` for the API. This
# script additionally provisions an isolated database/user `keycloak` for Keycloak's
# own storage, using a password supplied via the mounted secret file. It uses fixed
# SQL identifiers and a psql variable for the password value — never string
# interpolation of an arbitrary identifier.
set -euo pipefail

KC_DB="${KEYCLOAK_DB_NAME:-keycloak}"
KC_USER="${KEYCLOAK_DB_USER:-keycloak}"
KC_PW_FILE="${KEYCLOAK_DB_PASSWORD_FILE:-/run/secrets/keycloak_db_password}"

if [[ ! -f "$KC_PW_FILE" ]]; then
  echo "01-create-keycloak: missing secret file $KC_PW_FILE" >&2
  exit 1
fi
KC_PW="$(cat "$KC_PW_FILE")"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
     -v kc_pw="$KC_PW" <<-SQL
	CREATE ROLE "${KC_USER}" WITH LOGIN PASSWORD :'kc_pw';
	CREATE DATABASE "${KC_DB}" OWNER "${KC_USER}";
	REVOKE ALL ON DATABASE "${KC_DB}" FROM PUBLIC;
SQL

echo "01-create-keycloak: provisioned database '${KC_DB}' owned by '${KC_USER}'"
