#!/bin/sh
# Provision the isolated `keycloak` database/role in PostgreSQL (one-shot `postgres-init`).
#
# Runs as root in a client container (postgres image) AFTER postgres is healthy, so it
# can read the 0600 Compose secret files (the postgres server runs initdb.d scripts as
# the unprivileged postgres user, which cannot read them — hence this client approach).
# Idempotent: safe to re-run. Uses psql `format(%L, ...)` + \gexec so the password is a
# properly quoted literal and is never interpolated as an identifier.
set -eu

export PGPASSWORD="$(cat "${POSTGRES_PASSWORD_FILE:-/run/secrets/postgres_password}")"
KC_PW="$(cat "${KEYCLOAK_DB_PASSWORD_FILE:-/run/secrets/keycloak_db_password}")"
PGHOST="${PGHOST:-postgres}"
SUPERUSER="${POSTGRES_USER:-dentnow}"
KC_DB="${KEYCLOAK_DB_NAME:-keycloak}"
KC_USER="${KEYCLOAK_DB_USER:-keycloak}"

psql -v ON_ERROR_STOP=1 -h "$PGHOST" -U "$SUPERUSER" -d "$SUPERUSER" \
     -v kc_pw="$KC_PW" -v kc_user="$KC_USER" -v kc_db="$KC_DB" <<'SQL'
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'kc_user', :'kc_pw')
  WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = :'kc_user')\gexec
SELECT format('ALTER ROLE %I WITH LOGIN PASSWORD %L', :'kc_user', :'kc_pw')\gexec
SELECT format('CREATE DATABASE %I OWNER %I', :'kc_db', :'kc_user')
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = :'kc_db')\gexec
SQL

echo "postgres-init: ensured database '${KC_DB}' owned by role '${KC_USER}'"
