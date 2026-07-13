-- Minimal stand-in for the parts of a real Supabase project that our
-- migrations assume exist: the `auth` schema, `auth.users`, `auth.uid()` /
-- `auth.role()`, and the `anon` / `authenticated` roles that PostgREST uses.
-- This is NOT a full Supabase emulation — it exists only so the actual
-- migration files in supabase/migrations/ can be run and their RLS policies
-- exercised against a plain local Postgres instance. See supabase/tests/README.md.

create schema if not exists auth;

create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text
);

-- Same definitions Supabase itself ships: read the JWT claims that PostgREST
-- sets as GUCs for the current request/transaction.
create or replace function auth.uid() returns uuid as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$ language sql stable;

create or replace function auth.role() returns text as $$
  select nullif(current_setting('request.jwt.claim.role', true), '')::text;
$$ language sql stable;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
end
$$;

grant usage on schema public to anon, authenticated;
grant usage on schema auth to anon, authenticated;
