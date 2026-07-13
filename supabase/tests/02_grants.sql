-- Real Supabase projects grant broad table-level privileges to `anon` /
-- `authenticated` by default and rely entirely on RLS policies to restrict
-- access (this is why "RLS enabled with no policy = default deny" and "no
-- RLS enabled at all = wide open" are both true). Mirror that here so the
-- isolation tests are exercising RLS, not incidental GRANT denials.
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema auth to anon, authenticated;
grant execute on all functions in schema public to anon, authenticated;
