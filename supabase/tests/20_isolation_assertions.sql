-- Cross-user authorization proof: for every category of sensitive data in
-- the schema, assert that user B (a second, unrelated authenticated user)
-- cannot read or write user A's rows, then assert user A still can. Run via
-- supabase/tests/run.sh, which fails the whole suite (nonzero exit) if any
-- assertion here fails.

\set user_a '11111111-1111-1111-1111-111111111111'
\set user_b '22222222-2222-2222-2222-222222222222'

create temporary table test_results (
  id serial primary key,
  description text,
  passed boolean
);

-- security definer: assertions run after SET LOCAL ROLE authenticated, which
-- has no privileges on this superuser-owned temp table otherwise.
create or replace function pg_temp.assert(description text, condition boolean)
returns void as $$
begin
  insert into test_results (description, passed) values (description, condition);
  if condition then
    raise notice 'PASS: %', description;
  else
    raise warning 'FAIL: %', description;
  end if;
end;
$$ language plpgsql security definer;

-- =============================================================================
-- Acting as user B: attempt to read/write user A's data across every table
-- that stores per-user sensitive information.
-- =============================================================================
begin;
set local role authenticated;
set local request.jwt.claim.sub = :'user_b';
set local request.jwt.claim.role = 'authenticated';

select pg_temp.assert(
  'journal_entries: user B cannot read user A''s journal',
  not exists (select 1 from public.journal_entries where user_id = :'user_a'::uuid)
);

select pg_temp.assert(
  'level_progress: user B cannot read user A''s progress',
  not exists (select 1 from public.level_progress where user_id = :'user_a'::uuid)
);

select pg_temp.assert(
  'gamification_state: user B cannot read user A''s xp/credits/streak',
  not exists (select 1 from public.gamification_state where user_id = :'user_a'::uuid)
);

select pg_temp.assert(
  'emergency_contacts: user B cannot read user A''s SOS contacts',
  not exists (select 1 from public.emergency_contacts where user_id = :'user_a'::uuid)
);

select pg_temp.assert(
  'profiles: user B cannot read user A''s profile row',
  not exists (select 1 from public.profiles where id = :'user_a'::uuid)
);

select pg_temp.assert(
  'custom_habit_categories: user B cannot read user A''s custom categories',
  not exists (select 1 from public.custom_habit_categories where user_id = :'user_a'::uuid)
);

-- Attempted writes to user A's rows. Under RLS these should simply match
-- zero rows (not error), so verify by checking the affected row count.
update public.journal_entries set answers = '{"hacked":true}'::jsonb where user_id = :'user_a'::uuid;
select pg_temp.assert('journal_entries: user B''s UPDATE of user A''s row matched 0 rows', (select count(*) from public.journal_entries where user_id = :'user_a'::uuid and answers ? 'hacked') = 0);

update public.gamification_state set xp = 999999, credits = 999999 where user_id = :'user_a'::uuid;
-- (checked against the real value after the transaction, below)

update public.emergency_contacts set phone = '000-000-0000' where user_id = :'user_a'::uuid;

delete from public.journal_entries where user_id = :'user_a'::uuid;

-- Attempt to reset user A's completed level back to 'unlocked' (the exploit
-- this lockdown specifically closes: reset + re-invoke complete-level would
-- otherwise farm unlimited XP).
update public.level_progress set status = 'unlocked' where user_id = :'user_a'::uuid;

commit;

-- Verify (as superuser, bypassing RLS) that none of user B's attempted
-- writes above actually changed anything.
select pg_temp.assert(
  'gamification_state: user A''s xp was NOT changed by user B''s UPDATE attempt',
  (select xp from public.gamification_state where user_id = :'user_a'::uuid) = 0
);
select pg_temp.assert(
  'emergency_contacts: user A''s phone was NOT changed by user B''s UPDATE attempt',
  (select phone from public.emergency_contacts where user_id = :'user_a'::uuid) = '555-000-1111'
);
select pg_temp.assert(
  'journal_entries: user A''s entry was NOT deleted by user B''s DELETE attempt',
  exists (select 1 from public.journal_entries where user_id = :'user_a'::uuid)
);
select pg_temp.assert(
  'level_progress: user B cannot reset user A''s completed level back to unlocked (anti-XP-farming)',
  (select status from public.level_progress where user_id = :'user_a'::uuid and level_id = 'doom_awareness_01') = 'completed'
);

-- =============================================================================
-- Gamification is now read-only for EVERYONE, including the owner — all
-- writes must go through the complete-level Edge Function (service role).
-- =============================================================================
begin;
set local role authenticated;
set local request.jwt.claim.sub = :'user_a';
set local request.jwt.claim.role = 'authenticated';

update public.gamification_state set xp = 12345 where user_id = :'user_a'::uuid;
commit;

select pg_temp.assert(
  'gamification_state: even the OWNER cannot self-award xp directly anymore',
  (select xp from public.gamification_state where user_id = :'user_a'::uuid) = 0
);

begin;
set local role authenticated;
set local request.jwt.claim.sub = :'user_a';
set local request.jwt.claim.role = 'authenticated';

update public.level_progress set status = 'unlocked' where user_id = :'user_a'::uuid and level_id = 'doom_awareness_01';
commit;

-- A direct INSERT (unlike UPDATE) has no row to silently filter out, so RLS
-- raises an error rather than affecting 0 rows — assert it's rejected.
do $$
declare
  insert_was_rejected boolean := false;
begin
  execute 'set local role authenticated';
  execute 'set local request.jwt.claim.sub = ''11111111-1111-1111-1111-111111111111''';
  execute 'set local request.jwt.claim.role = ''authenticated''';
  begin
    insert into public.level_progress (user_id, level_id, status)
      values ('11111111-1111-1111-1111-111111111111', 'doom_triggers_01', 'completed');
  exception when others then
    insert_was_rejected := true;
  end;
  perform pg_temp.assert('level_progress: even the OWNER cannot INSERT a completed level directly (must go through complete-level)', insert_was_rejected);
end
$$;

select pg_temp.assert(
  'level_progress: even the OWNER''s UPDATE back to unlocked was a no-op (status still completed)',
  (select status from public.level_progress where user_id = :'user_a'::uuid and level_id = 'doom_awareness_01') = 'completed'
);

-- =============================================================================
-- SOS broadcasts: region filter. User B (US-West) must not see user A's
-- (US-Northeast) broadcast; user A must still see it, and each user must
-- always be able to see their own regardless of region.
-- =============================================================================
begin;
set local role authenticated;
set local request.jwt.claim.sub = :'user_b';
set local request.jwt.claim.role = 'authenticated';

select pg_temp.assert(
  'sos_broadcasts: user B (different region) cannot see user A''s broadcast',
  not exists (select 1 from public.sos_broadcasts where user_id = :'user_a'::uuid)
);
select pg_temp.assert(
  'sos_broadcasts: user B can still see their own broadcast',
  exists (select 1 from public.sos_broadcasts where user_id = :'user_b'::uuid)
);
commit;

begin;
set local role authenticated;
set local request.jwt.claim.sub = :'user_a';
set local request.jwt.claim.role = 'authenticated';

select pg_temp.assert(
  'sos_broadcasts: user A can see their own broadcast',
  exists (select 1 from public.sos_broadcasts where user_id = :'user_a'::uuid)
);
commit;

-- =============================================================================
-- Community posts: block enforcement (both directions of visibility).
-- =============================================================================
begin;
set local role authenticated;
set local request.jwt.claim.sub = :'user_a';
set local request.jwt.claim.role = 'authenticated';

insert into public.blocks (blocker_id, blocked_id, blocked_display_name) values (:'user_a', :'user_b', 'User B');
commit;

begin;
set local role authenticated;
set local request.jwt.claim.sub = :'user_a';
set local request.jwt.claim.role = 'authenticated';

select pg_temp.assert(
  'community_posts: user A no longer sees posts from a user they blocked',
  not exists (select 1 from public.community_posts where author_id = :'user_b'::uuid)
);
commit;

-- =============================================================================
-- Reports: a single reporter cannot inflate report_count by reporting the
-- same target repeatedly (duplicate unique constraint added in 0004).
-- =============================================================================
begin;
set local role authenticated;
set local request.jwt.claim.sub = :'user_b';
set local request.jwt.claim.role = 'authenticated';

insert into public.reports (reporter_id, target_type, target_id, reason)
  values (:'user_b', 'post', (select id from public.community_posts where author_id = :'user_a'::uuid limit 1), 'spam');
commit;

do $$
declare
  duplicate_was_rejected boolean := false;
begin
  execute 'set local role authenticated';
  execute 'set local request.jwt.claim.sub = ''22222222-2222-2222-2222-222222222222''';
  execute 'set local request.jwt.claim.role = ''authenticated''';
  begin
    insert into public.reports (reporter_id, target_type, target_id, reason)
      values ('22222222-2222-2222-2222-222222222222', 'post',
              (select id from public.community_posts where author_id = '11111111-1111-1111-1111-111111111111'::uuid limit 1),
              'spam again');
  exception when unique_violation then
    duplicate_was_rejected := true;
  end;
  perform pg_temp.assert('reports: duplicate report from the same user on the same target is rejected', duplicate_was_rejected);
end
$$;

-- =============================================================================
-- Server-side content policy: a post containing a phone number is rejected
-- even when sent directly to the API (bypassing the client-side filter).
-- =============================================================================
do $$
declare
  content_policy_rejected boolean := false;
begin
  execute 'set local role authenticated';
  execute 'set local request.jwt.claim.sub = ''11111111-1111-1111-1111-111111111111''';
  execute 'set local request.jwt.claim.role = ''authenticated''';
  begin
    insert into public.community_posts (author_id, author_display_name, text)
      values ('11111111-1111-1111-1111-111111111111', 'User A', 'call me at 555-123-4567');
  exception when others then
    content_policy_rejected := true;
  end;
  perform pg_temp.assert('community_posts: a post containing a phone number is rejected server-side', content_policy_rejected);
end
$$;

-- =============================================================================
-- Rate limiting: an 11th post within 5 minutes from the same author is
-- rejected (limit is 10 — see enforce_post_rate_limit in 0004).
-- =============================================================================
do $$
declare
  i integer;
  rate_limited boolean := false;
begin
  execute 'set local role authenticated';
  execute 'set local request.jwt.claim.sub = ''22222222-2222-2222-2222-222222222222''';
  execute 'set local request.jwt.claim.role = ''authenticated''';
  for i in 1..15 loop
    begin
      insert into public.community_posts (author_id, author_display_name, text)
        values ('22222222-2222-2222-2222-222222222222', 'User B', 'post number ' || i);
    exception when others then
      rate_limited := true;
      exit;
    end;
  end loop;
  perform pg_temp.assert('community_posts: posting is rate-limited (11th+ post in 5 minutes is rejected)', rate_limited);
end
$$;

-- =============================================================================
-- Summary
-- =============================================================================
do $$
declare
  total integer;
  failed integer;
begin
  select count(*), count(*) filter (where not passed) into total, failed from test_results;
  raise notice '=== RLS isolation suite: % / % passed ===', total - failed, total;
  if failed > 0 then
    raise exception '% assertion(s) FAILED — see PASS/FAIL lines above', failed;
  end if;
end
$$;
