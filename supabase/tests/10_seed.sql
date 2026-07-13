-- Seeds two users and one row of "private" data each, acting as each user
-- through the same `authenticated` role + JWT claims PostgREST would set,
-- so every insert below is itself already subject to the real RLS policies
-- (not just the reads tested afterward in 20_isolation_assertions.sql).

\set user_a '11111111-1111-1111-1111-111111111111'
\set user_b '22222222-2222-2222-2222-222222222222'

-- Superuser: create the two auth.users rows (this is what Supabase's own
-- auth server does on signup — a client can never do this directly).
insert into auth.users (id, email) values
  (:'user_a', 'user_a@test.local'),
  (:'user_b', 'user_b@test.local');

-- Give each profile a distinct region up front (needed for the SOS
-- region-filter test).
update public.profiles set region = 'US-Northeast' where id = :'user_a';
update public.profiles set region = 'US-West' where id = :'user_b';

-- level_progress is written exclusively by the complete-level Edge Function
-- using the service-role key (see 0004_security_hardening.sql) — clients
-- have no write access to it at all anymore, so seed it here as the
-- superuser, standing in for "the Edge Function already ran for this level".
insert into public.level_progress (user_id, level_id, status, completed_at, attempts) values
  (:'user_a', 'doom_awareness_01', 'completed', now(), 1),
  (:'user_b', 'food_awareness_01', 'completed', now(), 1);

-- ---- acting as user A ----
begin;
set local role authenticated;
set local request.jwt.claim.sub = :'user_a';
set local request.jwt.claim.role = 'authenticated';

insert into public.journal_entries (user_id, level_id, answers, is_shared) values
  (:'user_a', 'doom_awareness_01', '{"notes":"user A private journal"}'::jsonb, false);

insert into public.emergency_contacts (user_id, name, phone, relationship) values
  (:'user_a', 'Contact A', '555-000-1111', 'Friend');

insert into public.community_posts (author_id, author_display_name, text) values
  (:'user_a', 'User A', 'Hello from user A');

insert into public.sos_broadcasts (user_id, author_display_name, region, message, active) values
  (:'user_a', 'User A', 'US-Northeast', 'User A needs support', true);

insert into public.custom_habit_categories (user_id, label) values
  (:'user_a', 'User A custom habit');
commit;

-- ---- acting as user B ----
begin;
set local role authenticated;
set local request.jwt.claim.sub = :'user_b';
set local request.jwt.claim.role = 'authenticated';

insert into public.journal_entries (user_id, level_id, answers, is_shared) values
  (:'user_b', 'food_awareness_01', '{"notes":"user B private journal"}'::jsonb, false);

insert into public.emergency_contacts (user_id, name, phone, relationship) values
  (:'user_b', 'Contact B', '555-000-2222', 'Sibling');

insert into public.community_posts (author_id, author_display_name, text) values
  (:'user_b', 'User B', 'Hello from user B');

insert into public.sos_broadcasts (user_id, author_display_name, region, message, active) values
  (:'user_b', 'User B', 'US-West', 'User B needs support', true);
commit;
