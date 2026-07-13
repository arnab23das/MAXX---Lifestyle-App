# RLS isolation test suite

Automated proof that user A cannot read or write user B's data (journals,
progress, gamification state, emergency contacts, profile, custom habit
categories), plus checks for the SOS region filter, block enforcement, the
duplicate-report guard, server-side content policy, and posting rate limits
added in `0004_security_hardening.sql`.

This runs against a real local Postgres instance with the actual migration
files from `supabase/migrations/`, not a mock — `00_supabase_shim.sql` adds
just enough of Supabase's `auth` schema (`auth.users`, `auth.uid()`,
`auth.role()`, the `anon`/`authenticated` roles) for the real RLS policies to
be exercised exactly as PostgREST would exercise them in production.

## Run it

```
./supabase/tests/run.sh
```

Requires a local `psql` client and a reachable Postgres server your OS user
(or `postgres` via `sudo`) can create databases on. No Docker or live
Supabase project required. The script creates a throwaway database, runs
every migration + the assertions, prints PASS/FAIL for each check, and exits
non-zero if anything fails. The database is dropped automatically on exit.

## Run this after every new migration

Any migration that touches RLS policies, table grants, or adds new
per-user tables should be tested against this suite before merging — add new
assertions to `20_isolation_assertions.sql` for new tables as they're added.
