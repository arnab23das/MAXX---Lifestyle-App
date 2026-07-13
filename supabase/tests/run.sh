#!/usr/bin/env bash
# Automated cross-user authorization test suite for MAXX's Supabase schema.
#
# Spins up a throwaway local Postgres database, applies a minimal shim of
# Supabase's auth schema/roles, runs every migration in supabase/migrations/
# for real, seeds two unrelated test users, then asserts (as user B, acting
# through the same `authenticated` role + JWT claims PostgREST would set)
# that user B cannot read or write user A's journals, progress, gamification
# state, emergency contacts, profile, or custom habit categories — and that
# the SOS region filter, block enforcement, duplicate-report guard, rate
# limiting, and server-side content policy added in 0004 all actually work.
#
# Requires a local `psql` client and a reachable Postgres server (role with
# CREATEDB privilege). Does not require Docker or a running Supabase project.
#
# Usage: ./supabase/tests/run.sh
#        PGHOST=... PGPORT=... PGUSER=... PGPASSWORD=... ./supabase/tests/run.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DB_NAME="maxx_rls_test_$$"

PSQL_ADMIN=(psql -v ON_ERROR_STOP=1)
if [ "$(id -u)" -eq 0 ] || ! psql -c '\q' >/dev/null 2>&1; then
  # Fall back to the postgres superuser role via sudo when the current OS
  # user has no matching Postgres role (typical on a fresh dev container).
  PSQL_ADMIN=(sudo -u postgres psql -v ON_ERROR_STOP=1)
fi

cleanup() {
  "${PSQL_ADMIN[@]}" -c "drop database if exists \"$DB_NAME\";" >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "==> Creating throwaway database $DB_NAME"
"${PSQL_ADMIN[@]}" -c "create database \"$DB_NAME\";" >/dev/null

run() {
  echo "==> $1"
  "${PSQL_ADMIN[@]}" -d "$DB_NAME" -f "$1" >/tmp/maxx_rls_test_output.log 2>&1 || {
    echo "--- FAILED: $1 ---"
    cat /tmp/maxx_rls_test_output.log
    exit 1
  }
}

run "$SCRIPT_DIR/00_supabase_shim.sql"
for m in "$REPO_ROOT"/supabase/migrations/*.sql; do
  run "$m"
done
run "$SCRIPT_DIR/02_grants.sql"
run "$SCRIPT_DIR/10_seed.sql"

echo "==> Running isolation assertions"
if "${PSQL_ADMIN[@]}" -d "$DB_NAME" -f "$SCRIPT_DIR/20_isolation_assertions.sql" 2>&1 | tee /tmp/maxx_rls_test_output.log | grep -E "PASS:|FAIL:|RLS isolation suite"; then
  if grep -q "FAIL:" /tmp/maxx_rls_test_output.log; then
    echo "==> SUITE FAILED — see FAIL lines above"
    exit 1
  fi
  echo "==> SUITE PASSED"
else
  echo "--- assertions script errored ---"
  cat /tmp/maxx_rls_test_output.log
  exit 1
fi
